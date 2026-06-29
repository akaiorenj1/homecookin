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
    isEdit: false,
    recipeId: '',
    recipe: {
      name: '',
      category: 'main',
      cookingTime: '',
      image: '',
      method: '',
      ingredients: []
    },
    categories: ['菜品', '饮品', '甜品'],
    categoryIndex: 0,
    units: ['g', 'kg', '个', '颗', '把', 'ml', 'L', '勺', '片'],
    showIngredientModal: false,
    newIngredient: {
      name: '',
      quantity: ''
    },
    ingUnitIndex: 0
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ 
        isEdit: true,
        recipeId: options.id
      });
      this.loadRecipe(options.id);
    }
  },

  async loadRecipe(id) {
    try {
      const res = await db.collection('recipes').doc(id).get();
      const recipe = res.data;
      
      let categoryIndex = 0;
      if (recipe.category === 'drink') categoryIndex = 1;
      else if (recipe.category === 'dessert') categoryIndex = 2;

      this.setData({
        recipe,
        categoryIndex
      });
    } catch (err) {
      console.error('加载菜品失败:', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  onNameInput(e) {
    this.setData({ 'recipe.name': e.detail.value });
  },

  onCategoryChange(e) {
    const index = parseInt(e.detail.value);
    const categoryArr = ['main', 'drink', 'dessert'];
    this.setData({ 
      categoryIndex: index,
      'recipe.category': categoryArr[index]
    });
  },

  onTimeInput(e) {
    this.setData({ 'recipe.cookingTime': parseInt(e.detail.value) });
  },

  onMethodInput(e) {
    this.setData({ 'recipe.method': e.detail.value });
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.uploadImage(tempFilePath);
      }
    });
  },

  async uploadImage(filePath) {
    wx.showLoading({ title: '上传中...' });
    
    try {
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath: `recipes/${Date.now()}.png`,
        filePath: filePath
      });
      
      wx.hideLoading();
      this.setData({ 'recipe.image': uploadRes.fileID });
      wx.showToast({ title: '上传成功', icon: 'success' });
    } catch (err) {
      wx.hideLoading();
      console.error('上传图片失败:', err);
      wx.showToast({ title: '上传失败', icon: 'none' });
    }
  },

  showIngredientModal() {
    this.setData({
      showIngredientModal: true,
      newIngredient: { name: '', quantity: '' },
      ingUnitIndex: 0
    });
  },

  hideIngredientModal() {
    this.setData({ showIngredientModal: false });
  },

  onIngNameInput(e) {
    this.setData({ 'newIngredient.name': e.detail.value });
  },

  onIngQuantityInput(e) {
    this.setData({ 'newIngredient.quantity': e.detail.value });
  },

  onIngUnitChange(e) {
    this.setData({ ingUnitIndex: e.detail.value });
  },

  addIngredient() {
    const { name, quantity } = this.data.newIngredient;
    if (!name || !quantity) {
      wx.showToast({
        title: '请填写完整',
        icon: 'none'
      });
      return;
    }

    const unit = this.data.units[this.data.ingUnitIndex];
    const ingredients = [...this.data.recipe.ingredients, {
      ingredientName: name,
      quantity: parseFloat(quantity),
      unit: unit
    }];

    this.setData({
      'recipe.ingredients': ingredients,
      showIngredientModal: false
    });
  },

  deleteIngredient(e) {
    const index = e.currentTarget.dataset.index;
    const ingredients = this.data.recipe.ingredients.filter((_, i) => i !== index);
    this.setData({ 'recipe.ingredients': ingredients });
  },

  async submitRecipe() {
    const { name, category, cookingTime, image, method, ingredients } = this.data.recipe;
    
    if (!name || !cookingTime) {
      wx.showToast({
        title: '请填写菜品名称和制作时间',
        icon: 'none'
      });
      return;
    }

    try {
      const data = {
        name,
        category,
        cookingTime,
        image,
        method,
        ingredients,
        updateTime: db.serverDate()
      };

      if (this.data.isEdit) {
        await db.collection('recipes').doc(this.data.recipeId).update({ data });
      } else {
        data.createTime = db.serverDate();
        await db.collection('recipes').add({ data });
      }

      wx.showToast({
        title: this.data.isEdit ? '保存成功' : '添加成功',
        icon: 'success'
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      console.error('保存菜品失败:', err);
      wx.showToast({
        title: '保存失败: ' + err.errMsg,
        icon: 'none'
      });
    }
  },

  goBack() {
    wx.navigateBack();
  }
});
