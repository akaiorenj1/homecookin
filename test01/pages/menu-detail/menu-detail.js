const db = wx.cloud.database();

Page({
  onShow() {
    this.checkAuth();
  },

  checkAuth() {
    const isAuthorized = wx.getStorageSync('isAuthorized');
    if (!isAuthorized) {
      wx.reLaunch({ url: '/pages/login/login' });
    }
  },

  data: {
    recipeId: '',
    recipe: null,
    loading: true
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ recipeId: options.id });
      this.loadRecipeDetail(options.id);
    }
  },

  async loadRecipeDetail(id) {
    try {
      const res = await db.collection('recipes').doc(id).get();
      this.setData({
        recipe: res.data,
        loading: false
      });
    } catch (err) {
      console.error('加载菜品详情失败:', err);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  orderRecipe() {
    const that = this;
    wx.showModal({
      title: '确认点菜',
      content: `确定要点「${this.data.recipe.name}」吗？`,
      success(res) {
        if (res.confirm) {
          that.createOrder();
        }
      }
    });
  },

  async createOrder() {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    try {
      await db.collection('orders').add({
        data: {
          recipeId: this.data.recipe._id,
          recipeName: this.data.recipe.name,
          recipeImage: this.data.recipe.image,
          date: today,
          status: 'pending',
          ingredients: this.data.recipe.ingredients || [],
          createTime: db.serverDate()
        }
      });
      
      wx.showToast({
        title: '点菜成功',
        icon: 'success'
      });
      
      setTimeout(() => {
        wx.switchTab({ url: '/pages/orders/orders' });
      }, 1500);
    } catch (err) {
      console.error('点菜失败:', err);
      wx.showToast({
        title: '点菜失败',
        icon: 'none'
      });
    }
  }
});
