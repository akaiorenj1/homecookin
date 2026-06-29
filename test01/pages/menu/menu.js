const authBehavior = require('../../utils/behavior');
const { db, recipes, orders } = require('../../utils/db');
const { RECIPE_CATEGORIES } = require('../../utils/category');

Page({
  behaviors: [authBehavior],

  data: {
    categories: Object.values(RECIPE_CATEGORIES),
    currentCategory: 'main',
    menuList: [],
    searchKeyword: '',
    loading: true,
    orderingId: null  // 防重复点菜
  },

  onShow() {
    this.loadMenu();
  },

  onHide() {
    if (this._searchTimer) { clearTimeout(this._searchTimer); this._searchTimer = null; }
  },

  onUnload() {
    if (this._searchTimer) clearTimeout(this._searchTimer);
  },

  switchCategory(e) {
    const cat = e.currentTarget.dataset.category;
    this.setData({ currentCategory: cat, menuList: [] });
    this.loadMenu();
  },

  /** 防抖搜索：300ms 内连续输入只发一次请求 */
  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });

    if (this._searchTimer) clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => {
      this.loadMenu();
    }, 300);
  },

  async loadMenu() {
    this.setData({ loading: true });
    try {
      const category = this.data.currentCategory;
      const keyword = this.data.searchKeyword.trim();
      let query;

      if (keyword) {
        query = recipes.where({
          category,
          name: db.RegExp({ regexp: keyword, options: 'i' })
        });
      } else {
        query = recipes.where({ category });
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

  /** 长按快捷点菜（有去重保护） */
  quickOrder(e) {
    const item = e.currentTarget.dataset.item;
    if (this.data.orderingId === item._id) return; // 正在下单同一道菜，忽略

    wx.showModal({
      title: `点菜 - ${item.name}`,
      content: '确定要加入点菜列表吗？',
      success: async (res) => {
        if (!res.confirm) return;
        this.setData({ orderingId: item._id });
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
        } finally {
          this.setData({ orderingId: null });
        }
      },
      fail: () => { this.setData({ orderingId: null }); }
    });
  },

  goToAddRecipe() {
    wx.navigateTo({ url: '/pages/admin/recipe-edit/recipe-edit' });
  }
});
