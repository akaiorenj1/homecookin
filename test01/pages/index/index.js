const authBehavior = require('../../utils/behavior');
const auth = require('../../utils/auth');
const { db, recipes, inventory, orders } = require('../../utils/db');

Page({
  behaviors: [authBehavior],

  data: {
    hasLogin: false,
    todayMenu: [],
    lowStockCount: 0,
    pendingOrderCount: 0,
    totalRecipes: 0,
    loaded: false  // 防止重复加载
  },

  onShow() {
    const loggedIn = auth.isLoggedIn();
    this.setData({ hasLogin: loggedIn });

    if (loggedIn && !this.data.loaded) {
      this.loadDashboard();
    }
  },

  onPullDownRefresh() {
    this.loadDashboard().finally(() => wx.stopPullDownRefresh());
  },

  async loadDashboard() {
    try {
      const [recipeTotal, recentItems, allInventory, pendingOrders] = await Promise.all([
        db.count(db.recipes),                                           // 总菜谱数（不受 limit 影响）
        db.find(db.recipes, { orderBy: 'createTime', orderDir: 'desc', limit: 3 }),
        db.find(db.inventory, { orderBy: 'name' }),
        db.find(db.orders, { where: { status: 'pending' } })
      ]);

      const lowStock = allInventory.filter(item => item.quantity <= 100);

      this.setData({
        todayMenu: recentItems,
        lowStockCount: lowStock.length,
        pendingOrderCount: pendingOrders.length,
        totalRecipes: recipeTotal,  // ✅ 真实的菜谱总数
        loaded: true
      });
    } catch (err) {
      console.error('加载首页数据失败:', err);
    }
  },

  goToMenu() {
    if (!auth.isLoggedIn()) { wx.navigateTo({ url: '/pages/login/login' }); return; }
    wx.switchTab({ url: '/pages/menu/menu' });
  },

  goToInventory() {
    if (!auth.isLoggedIn()) { wx.navigateTo({ url: '/pages/login/login' }); return; }
    wx.switchTab({ url: '/pages/inventory/inventory' });
  },

  goToOrders() {
    if (!auth.isLoggedIn()) { wx.navigateTo({ url: '/pages/login/login' }); return; }
    wx.switchTab({ url: '/pages/orders/orders' });
  },

  goToRecipeManage() {
    if (!auth.isLoggedIn()) { wx.navigateTo({ url: '/pages/login/login' }); return; }
    wx.navigateTo({ url: '/pages/admin/recipe-manage/recipe-manage' });
  },

  goToInventoryLogs() {
    if (!auth.isLoggedIn()) { wx.navigateTo({ url: '/pages/login/login' }); return; }
    wx.navigateTo({ url: '/pages/inventory-logs/inventory-logs' });
  }
});
