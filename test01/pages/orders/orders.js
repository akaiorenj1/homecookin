const authBehavior = require('../../utils/behavior');
const { db, _, orders, inventory, inventoryLogs } = require('../../utils/db');
const { getInventoryMap } = require('../../utils/db');

Page({
  behaviors: [authBehavior],

  data: {
    currentTab: 'pending',
    ordersList: [],
    shoppingList: [],
    today: '',
    loading: true
  },

  onLoad() {
    this.setToday();
    this.initWatch();
  },

  onUnload() {
    if (this._watch) this._watch.close();
  },

  onShow() {
    this.setToday();
  },

  onPullDownRefresh() {
    this.loadOrders().then(() => wx.stopPullDownRefresh());
  },

  setToday() {
    const now = new Date();
    this.setData({ today: `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日` });
  },

  initWatch() {
    this._watch = orders.where({ status: 'pending' }).orderBy('createTime', 'desc').watch({
      onChange: (snapshot) => {
        const list = this.formatOrders(snapshot.docs);
        this.setData({ ordersList: list, loading: false });
        this.calcShopping(list);
      },
      onError: (err) => console.error('订单监听失败:', err)
    });
  },

  formatOrders(list) {
    return list.map(item => {
      const t = item.createTime ? new Date(item.createTime) : new Date();
      return { ...item, createTimeFormat: `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`, createDateFormat: `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}` };
    });
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (this._watch) this._watch.close();
    this.setData({ currentTab: tab, ordersList: [], shoppingList: [] });
    if (tab === 'pending') this.initWatch();
    else this.loadOrders();
  },

  async loadOrders() {
    this.setData({ loading: true });
    try {
      const res = await orders.where({ status: this.data.currentTab }).orderBy('createTime', 'desc').get();
      this.setData({ ordersList: this.formatOrders(res.data), loading: false });
    } catch (err) {
      console.error('加载订单失败:', err);
      this.setData({ loading: false });
    }
  },

  async calcShopping(orderList) {
    if (!orderList.length) { this.setData({ shoppingList: [] }); return; }
    try {
      const invMap = await getInventoryMap();
      const needed = {};
      orderList.forEach(o => (o.ingredients || []).forEach(ing => {
        needed[ing.ingredientName] = (needed[ing.ingredientName] || 0) + ing.quantity;
      }));
      const list = [];
      for (const [name, need] of Object.entries(needed)) {
        const cur = invMap[name] || { quantity: 0, unit: 'g' };
        const diff = need - cur.quantity;
        if (diff > 0) list.push({ name, needQuantity: Math.ceil(diff), unit: cur.unit, currentQuantity: cur.quantity });
      }
      this.setData({ shoppingList: list });
    } catch (err) { console.error('计算采购清单失败:', err); }
  },

  deleteOrder(e) {
    wx.showModal({
      title: '删除订单',
      content: `确定要删除「${e.currentTarget.dataset.name}」吗？`,
      success: async (res) => {
        if (res.confirm) {
          await orders.doc(e.currentTarget.dataset.id).remove();
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  },

  async completeOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认完成',
      content: '完成后将自动扣减库存，确定吗？',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          const order = (await orders.doc(orderId).get()).data;
          if (!order.ingredients?.length) { wx.showToast({ title: '没有食材信息', icon: 'none' }); return; }

          const invMap = await getInventoryMap();
          const missing = [];
          for (const ing of order.ingredients) {
            const inv = invMap[ing.ingredientName];
            if (!inv) missing.push(`${ing.ingredientName}（无库存）`);
            else if (inv.quantity < ing.quantity) missing.push(`${ing.ingredientName}（需${ing.quantity}，库存${inv.quantity}）`);
          }
          if (missing.length) {
            wx.showToast({ title: `库存不足：${missing.join('、')}`, icon: 'none', duration: 3000 });
            return;
          }

          for (const ing of order.ingredients) {
            const inv = invMap[ing.ingredientName];
            await inventory.doc(inv._id).update({ data: { quantity: _.inc(-ing.quantity) } });
            await inventoryLogs.add({
              data: { ingredientName: ing.ingredientName, quantity: ing.quantity, unit: inv.unit, type: 'out', description: `做菜消耗：${order.recipeName}`, createTime: db.serverDate() }
            });
          }

          await orders.doc(orderId).update({ data: { status: 'completed' } });
          wx.showToast({ title: '已完成', icon: 'success' });
        } catch (err) { wx.showToast({ title: '操作失败', icon: 'none' }); }
      }
    });
  },

  /** 复制采购清单 */
  copyShoppingList() {
    const text = this.data.shoppingList.map(i => `${i.name} ×${i.needQuantity}${i.unit}`).join('\n');
    if (!text) { wx.showToast({ title: '暂无采购项目', icon: 'none' }); return; }
    wx.setClipboardData({ data: text, success: () => wx.showToast({ title: '已复制', icon: 'success' }) });
  }
});
