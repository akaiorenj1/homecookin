const authBehavior = require('../../utils/behavior');
const auth = require('../../utils/auth');

Page({
  behaviors: [authBehavior],

  data: {
    hasLogin: false,
    todayMenu: [],
    lowStockCount: 0,
    pendingOrderCount: 0,
    totalRecipes: 0
  },

  onShow() {
    const loggedIn = auth.isLoggedIn();
    this.setData({ hasLogin: loggedIn });
    
    if (loggedIn) {
      this.loadDashboard();
    }
  },

  async loadDashboard() {
    const db = require('../../utils/db');
    try {
      const [recipes, inventory, orders] = await Promise.all([
        db.find(db.recipes, { orderBy: 'createTime', limit: 3 }),
        db.find(db.inventory, { orderBy: 'name' }),
        db.find(db.orders, { where: { status: 'pending' } })
      ]);

      const lowStock = inventory.filter(item => item.quantity <= 100);
      
      this.setData({
        todayMenu: recipes,
        lowStockCount: lowStock.length,
        pendingOrderCount: orders.length,
        totalRecipes: recipes.length
      });
    } catch (err) {
      console.error('加载首页数据失败:', err);
    }
  },

  goToMenu() {
    if (!auth.isLoggedIn()) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    wx.switchTab({ url: '/pages/menu/menu' });
  },

  goToInventory() {
    if (!auth.isLoggedIn()) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    wx.switchTab({ url: '/pages/inventory/inventory' });
  },

  goToOrders() {
    if (!auth.isLoggedIn()) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    wx.switchTab({ url: '/pages/orders/orders' });
  },

  goToRecipeManage() {
    if (!auth.isLoggedIn()) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    wx.navigateTo({ url: '/pages/admin/recipe-manage/recipe-manage' });
  },

  goToInventoryLogs() {
    if (!auth.isLoggedIn()) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    wx.navigateTo({ url: '/pages/inventory-logs/inventory-logs' });
  }
});
