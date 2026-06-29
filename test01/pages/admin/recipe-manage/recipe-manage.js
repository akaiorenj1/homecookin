const authBehavior = require('../../utils/behavior');
const { recipes } = require('../../utils/db');

Page({
  behaviors: [authBehavior],

  data: {
    currentCategory: 'main',
    menuList: [],
    loading: true
  },

  onShow() {
    this.loadMenu();
  },

  switchCategory(e) {
    this.setData({ currentCategory: e.currentTarget.dataset.category });
    this.loadMenu();
  },

  async loadMenu() {
    this.setData({ loading: true });
    try {
      const res = await recipes.where({ category: this.data.currentCategory }).orderBy('createTime', 'desc').get();
      this.setData({ menuList: res.data, loading: false });
    } catch (err) { console.error('加载失败:', err); this.setData({ loading: false }); }
  },

  editRecipe(e) {
    wx.navigateTo({ url: `/pages/admin/recipe-edit/recipe-edit?id=${e.currentTarget.dataset.id}` });
  },

  deleteRecipe(e) {
    wx.showModal({
      title: '删除菜品',
      content: `确定要删除「${e.currentTarget.dataset.name}」吗？`,
      success: async (res) => {
        if (res.confirm) {
          await recipes.doc(e.currentTarget.dataset.id).remove();
          wx.showToast({ title: '已删除', icon: 'success' });
          this.loadMenu();
        }
      }
    });
  },

  goToAddRecipe() {
    wx.navigateTo({ url: '/pages/admin/recipe-edit/recipe-edit' });
  }
});
