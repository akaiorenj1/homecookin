const authBehavior = require('../../utils/behavior');
const { db, recipes, orders, inventory } = require('../../utils/db');
const { RECIPE_CATEGORIES } = require('../../utils/category');

Page({
  behaviors: [authBehavior],

  data: {
    categories: Object.values(RECIPE_CATEGORIES),
    currentCategory: 'main',
    menuList: [],
    searchKeyword: '',
    loading: true,
    longpressIndex: -1
  },

  onShow() {
    this.loadMenu();
  },

  switchCategory(e) {
    const cat = e.currentTarget.dataset.category;
    this.setData({ currentCategory: cat, menuList: [] });
    this.loadMenu();
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
    this.loadMenu();
  },

  async loadMenu() {
    this.setData({ loading: true });
    try {
      let query = recipes.where({ category: this.data.currentCategory });
      const keyword = this.data.searchKeyword.trim();
      if (keyword) {
        query = recipes.where({
          category: this.data.currentCategory,
          name: db.RegExp({ regexp: keyword, options: 'i' })
        });
      }
      const res = await query.orderBy('createTime', 'desc').get();
      this.setData({ menuList: res.data, loading: false });
    } catch (err) {
      console.error('加载菜单失败:', err);
      this.setData({ loading: false });
    }
  },

  goToDetail(e) {
    wx.navigateTo({ url: `/pages/menu-detail/menu-detail?id=${e.currentTarget.dataset.id}` });
  },

  /** 长按快捷点菜 */
  quickOrder(e) {
    const item = e.currentTarget.dataset.item;
    wx.showModal({
      title: `点菜 - ${item.name}`,
      content: '确定要加入点菜列表吗？',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await orders.add({
            data: {
              recipeId: item._id,
              recipeName: item.name,
              recipeImage: item.image || '',
              ingredients: item.ingredients || [],
              status: 'pending',
              createTime: db.serverDate()
            }
          });
          wx.showToast({ title: '点菜成功', icon: 'success' });
        } catch (err) {
          wx.showToast({ title: '点菜失败', icon: 'none' });
        }
      }
    });
  },

  goToAddRecipe() {
    wx.navigateTo({ url: '/pages/admin/recipe-edit/recipe-edit' });
  }
});
