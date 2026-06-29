const db = wx.cloud.database();

Page({
  onShow() {
    this.checkAuth();
  },

  checkAuth() {
    const isAuthorized = wx.getStorageSync('isAuthorized');
    if (!isAuthorized) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/login/login' });
      }, 1000);
    }
  },

  data: {
    currentCategory: 'main',
    menuList: [],
    loading: true
  },

  switchCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ currentCategory: category });
    this.loadMenu();
  },

  async loadMenu() {
    this.setData({ loading: true });
    try {
      const res = await db.collection('recipes')
        .where({ category: this.data.currentCategory })
        .orderBy('createTime', 'desc')
        .get();
      
      this.setData({
        menuList: res.data,
        loading: false
      });
    } catch (err) {
      console.error('加载菜单失败:', err);
      this.setData({ loading: false });
    }
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/menu-detail/menu-detail?id=${id}` });
  },

  goToAddRecipe() {
    wx.navigateTo({ url: '/pages/admin/recipe-edit/recipe-edit' });
  },

  goToHome() {
    wx.navigateTo({ url: '/pages/index/index' });
  }
});
