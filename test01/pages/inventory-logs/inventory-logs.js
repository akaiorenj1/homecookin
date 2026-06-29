const db = wx.cloud.database();

Page({
  onShow() {
    this.checkAuth();
  },

  checkAuth() {
    const isAuthorized = wx.getStorageSync('isAuthorized');
    if (!isAuthorized) {
      wx.reLaunch({ url: '/pages/login/login' });
    }
  },

  data: {
    currentTab: 'all',
    logsList: [],
    filteredList: [],
    searchKeyword: '',
    startDate: '',
    endDate: '',
    loading: true
  },

  onLoad() {
    this.loadLogs();
  },

  onShow() {
    this.loadLogs();
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
    this.filterList();
  },

  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });
    this.filterList();
  },

  onStartDateChange(e) {
    this.setData({ startDate: e.detail.value });
    this.filterList();
  },

  onEndDateChange(e) {
    this.setData({ endDate: e.detail.value });
    this.filterList();
  },

  clearDateFilter() {
    this.setData({ startDate: '', endDate: '' });
    this.filterList();
  },

  filterList() {
    let list = this.data.logsList;
    
    if (this.data.currentTab !== 'all') {
      list = list.filter(item => item.type === this.data.currentTab);
    }
    
    if (this.data.searchKeyword) {
      list = list.filter(item => 
        item.ingredientName.toLowerCase().includes(this.data.searchKeyword.toLowerCase())
      );
    }

    if (this.data.startDate) {
      list = list.filter(item => item.dateStr >= this.data.startDate);
    }

    if (this.data.endDate) {
      list = list.filter(item => item.dateStr <= this.data.endDate);
    }
    
    this.setData({ filteredList: list });
  },

  async loadLogs() {
    this.setData({ loading: true });
    
    try {
      let query = {};
      if (this.data.currentTab !== 'all') {
        query = { type: this.data.currentTab };
      }
      
      const res = await db.collection('inventory_logs')
        .where(query)
        .orderBy('createTime', 'desc')
        .limit(500)
        .get();

      const inventoryRes = await db.collection('inventory').get();
      const currentInventory = {};
      inventoryRes.data.forEach(item => {
        currentInventory[item.name] = { quantity: item.quantity, unit: item.unit };
      });
      
      const logs = res.data.map(item => {
        const createTime = item.createTime ? new Date(item.createTime) : new Date();
        const dateStr = `${createTime.getFullYear()}-${String(createTime.getMonth() + 1).padStart(2, '0')}-${String(createTime.getDate()).padStart(2, '0')}`;
        const timeStr = `${createTime.getFullYear()}-${String(createTime.getMonth() + 1).padStart(2, '0')}-${String(createTime.getDate()).padStart(2, '0')} ${String(createTime.getHours()).padStart(2, '0')}:${String(createTime.getMinutes()).padStart(2, '0')}`;
        
        const balance = currentInventory[item.ingredientName]?.quantity || 0;
        
        return { 
          ...item, 
          dateStr,
          createTimeFormat: timeStr,
          balance: balance
        };
      });

      logs.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
      
      const processedLogs = [];
      const inventorySnapshot = {};
      
      for (const item of inventoryRes.data) {
        inventorySnapshot[item.name] = { quantity: item.quantity, unit: item.unit };
      }

      for (const log of logs) {
        const current = inventorySnapshot[log.ingredientName]?.quantity || 0;
        
        if (log.type === 'in') {
          processedLogs.push({
            ...log,
            balance: current
          });
          inventorySnapshot[log.ingredientName] = {
            quantity: current - log.quantity,
            unit: log.unit
          };
        } else {
          processedLogs.push({
            ...log,
            balance: current
          });
          inventorySnapshot[log.ingredientName] = {
            quantity: current + log.quantity,
            unit: log.unit
          };
        }
      }
      
      this.setData({
        logsList: processedLogs,
        filteredList: processedLogs,
        loading: false
      });
      this.filterList();
    } catch (err) {
      console.error('加载记录失败:', err);
      this.setData({ loading: false });
    }
  }
});
