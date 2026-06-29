const db = wx.cloud.database();

Page({
  onShow() {
    this.checkAuth();
    this.loadMenu();
  },

  checkAuth() {
    const isAuthorized = wx.getStorageSync('isAuthorized');
    if (!isAuthorized) {
      wx.reLaunch({ url: '/pages/login/login' });
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

  editRecipe(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/admin/recipe-edit/recipe-edit?id=${id}` });
  },

  deleteRecipe(e) {
    const id = e.currentTarget.dataset.id;
    const name = e.currentTarget.dataset.name;
    
    wx.showModal({
      title: '删除菜品',
      content: `确定要删除「${name}」吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await db.collection('recipes').doc(id).remove();
            wx.showToast({ title: '已删除', icon: 'success' });
            this.loadMenu();
          } catch (err) {
            console.error('删除失败:', err);
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  goToAddRecipe() {
    wx.navigateTo({ url: '/pages/admin/recipe-edit/recipe-edit' });
  },

  goBack() {
    wx.navigateBack();
  }
});
