const authBehavior = require('../../utils/behavior');
const { db, inventoryLogs, inventory } = require('../../utils/db');
const { LOG_TYPES, getLogTypeLabel, getLogTypeColor } = require('../../utils/category');

Page({
  behaviors: [authBehavior],

  data: {
    tabs: Object.values(LOG_TYPES),
    currentTab: 'all',
    logsList: [],
    filteredList: [],
    searchKeyword: '',
    startDate: '',
    endDate: '',
    loading: true
  },

  onLoad() { this.loadLogs(); },
  onShow() { this.loadLogs(); },

  switchTab(e) { this.setData({ currentTab: e.currentTarget.dataset.tab }); this.filterList(); },
  onSearchInput(e) { this.setData({ searchKeyword: e.detail.value }); this.filterList(); },
  onStartDateChange(e) { this.setData({ startDate: e.detail.value }); this.filterList(); },
  onEndDateChange(e) { this.setData({ endDate: e.detail.value }); this.filterList(); },
  clearDateFilter() { this.setData({ startDate: '', endDate: '' }); this.filterList(); },

  filterList() {
    let list = this.data.logsList;
    if (this.data.currentTab !== 'all') list = list.filter(i => i.type === this.data.currentTab);
    if (this.data.searchKeyword) list = list.filter(i => i.ingredientName.toLowerCase().includes(this.data.searchKeyword.toLowerCase()));
    if (this.data.startDate) list = list.filter(i => i.dateStr >= this.data.startDate);
    if (this.data.endDate) list = list.filter(i => i.dateStr <= this.data.endDate);
    this.setData({ filteredList: list });
  },

  async loadLogs() {
    this.setData({ loading: true });
    try {
      const [res, invRes] = await Promise.all([
        inventoryLogs.orderBy('createTime', 'desc').limit(500).get(),
        inventory.get()
      ]);

      const invMap = {};
      invRes.data.forEach(i => { invMap[i.name] = { quantity: i.quantity, unit: i.unit }; });

      const logs = res.data.map(item => {
        const t = item.createTime ? new Date(item.createTime) : new Date();
        const dateStr = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
        const timeStr = `${dateStr} ${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`;
        return { ...item, dateStr, createTimeFormat: timeStr, typeColor: getLogTypeColor(item.type), typeLabel: getLogTypeLabel(item.type), balance: invMap[item.ingredientName]?.quantity || 0 };
      });

      this.setData({ logsList: logs, filteredList: logs, loading: false });
      this.filterList();
    } catch (err) { console.error('加载日志失败:', err); this.setData({ loading: false }); }
  }
});
