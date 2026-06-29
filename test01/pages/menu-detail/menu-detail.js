const authBehavior = require('../../utils/behavior');
const { db, recipes, orders } = require('../../utils/db');

Page({
  behaviors: [authBehavior],

  data: {
    recipeId: '',
    recipe: null,
    loading: true
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ recipeId: options.id });
      this.loadDetail(options.id);
    }
  },

  async loadDetail(id) {
    try {
      const res = await recipes.doc(id).get();
      this.setData({ recipe: res.data, loading: false });
    } catch (err) {
      console.error('加载详情失败:', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  orderRecipe() {
    wx.showModal({
      title: '确认点菜',
      content: `确定要点「${this.data.recipe.name}」吗？`,
      success: (res) => {
        if (res.confirm) this.createOrder();
      }
    });
  },

  async createOrder() {
    try {
      await orders.add({
        data: {
          recipeId: this.data.recipe._id,
          recipeName: this.data.recipe.name,
          recipeImage: this.data.recipe.image || '',
          ingredients: this.data.recipe.ingredients || [],
          status: 'pending',
          createTime: db.serverDate()
        }
      });
      wx.showToast({ title: '点菜成功', icon: 'success' });
      setTimeout(() => wx.switchTab({ url: '/pages/orders/orders' }), 1200);
    } catch (err) {
      console.error('点菜失败:', err);
      wx.showToast({ title: '点菜失败', icon: 'none' });
    }
  }
});
