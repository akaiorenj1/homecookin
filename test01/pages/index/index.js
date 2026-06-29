Page({
  data: {
    hasLogin: false
  },

  onShow() {
    const isAuthorized = wx.getStorageSync('isAuthorized');
    if (!isAuthorized) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        showCancel: false,
        success: () => {
          wx.navigateTo({ url: '/pages/login/login' });
        }
      });
    }
    this.setData({ hasLogin: !!isAuthorized });
  },

  goToLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  goToMenu() {
    const isAuthorized = wx.getStorageSync('isAuthorized');
    if (!isAuthorized) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    wx.switchTab({ url: '/pages/menu/menu' });
  },

  goToInventory() {
    const isAuthorized = wx.getStorageSync('isAuthorized');
    if (!isAuthorized) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    wx.switchTab({ url: '/pages/inventory/inventory' });
  },

  goToOrders() {
    const isAuthorized = wx.getStorageSync('isAuthorized');
    if (!isAuthorized) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    wx.switchTab({ url: '/pages/orders/orders' });
  },

  goToAdmin() {
    const isAuthorized = wx.getStorageSync('isAuthorized');
    if (!isAuthorized) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    wx.navigateTo({ url: '/pages/admin/recipe-edit/recipe-edit' });
  },

  goToRecipeManage() {
    const isAuthorized = wx.getStorageSync('isAuthorized');
    if (!isAuthorized) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    wx.navigateTo({ url: '/pages/admin/recipe-manage/recipe-manage' });
  }
});
