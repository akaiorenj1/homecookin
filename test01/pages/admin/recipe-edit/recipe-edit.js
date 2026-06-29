const authBehavior = require('../../utils/behavior');
const { db, recipes } = require('../../utils/db');
const { RECIPE_CATEGORY_LIST, UNITS } = require('../../utils/category');

Page({
  behaviors: [authBehavior],

  data: {
    isEdit: false,
    recipeId: '',
    recipe: { name: '', category: 'main', cookingTime: '', image: '', method: '', ingredients: [] },
    categories: RECIPE_CATEGORY_LIST.map(c => c.label),
    categoryIndex: 0,
    units: UNITS,
    showIngredientModal: false,
    newIngredient: { name: '', quantity: '' },
    ingUnitIndex: 0
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ isEdit: true, recipeId: options.id });
      this.loadRecipe(options.id);
    }
  },

  async loadRecipe(id) {
    try {
      const res = await recipes.doc(id).get();
      const r = res.data;
      const idx = r.category === 'drink' ? 1 : r.category === 'dessert' ? 2 : 0;
      this.setData({ recipe: r, categoryIndex: idx });
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onNameInput(e) { this.setData({ 'recipe.name': e.detail.value }); },
  onTimeInput(e) { this.setData({ 'recipe.cookingTime': parseInt(e.detail.value) || '' }); },
  onMethodInput(e) { this.setData({ 'recipe.method': e.detail.value }); },

  onCategoryChange(e) {
    const map = ['main', 'drink', 'dessert'];
    this.setData({ categoryIndex: parseInt(e.detail.value), 'recipe.category': map[e.detail.value] });
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sourceType: ['album', 'camera'],
      success: (res) => this.uploadImage(res.tempFiles[0].tempFilePath)
    });
  },

  async uploadImage(filePath) {
    wx.showLoading({ title: '上传中...' });
    try {
      const uploadRes = await wx.cloud.uploadFile({ cloudPath: `recipes/${Date.now()}.png`, filePath });
      this.setData({ 'recipe.image': uploadRes.fileID });
      wx.showToast({ title: '上传成功', icon: 'success' });
    } catch (err) { wx.showToast({ title: '上传失败', icon: 'none' }); }
    finally { wx.hideLoading(); }
  },

  // 食材弹窗
  showIngredientModal() { this.setData({ showIngredientModal: true, newIngredient: { name: '', quantity: '' }, ingUnitIndex: 0 }); },
  hideIngredientModal() { this.setData({ showIngredientModal: false }); },
  onIngNameInput(e) { this.setData({ 'newIngredient.name': e.detail.value }); },
  onIngQuantityInput(e) { this.setData({ 'newIngredient.quantity': e.detail.value }); },
  onIngUnitChange(e) { this.setData({ ingUnitIndex: e.detail.value }); },

  addIngredient() {
    const { name, quantity } = this.data.newIngredient;
    if (!name || !quantity) { wx.showToast({ title: '请填写完整', icon: 'none' }); return; }
    const unit = this.data.units[this.data.ingUnitIndex];
    const ingredients = [...this.data.recipe.ingredients, { ingredientName: name, quantity: parseFloat(quantity), unit }];
    this.setData({ 'recipe.ingredients': ingredients, showIngredientModal: false });
  },

  deleteIngredient(e) {
    this.setData({ 'recipe.ingredients': this.data.recipe.ingredients.filter((_, i) => i !== e.currentTarget.dataset.index) });
  },

  async submitRecipe() {
    const { name, category, cookingTime, image, method, ingredients } = this.data.recipe;
    if (!name || !cookingTime) { wx.showToast({ title: '请填写菜名和制作时间', icon: 'none' }); return; }
    try {
      const data = { name, category, cookingTime, image, method, ingredients, updateTime: db.serverDate() };
      if (this.data.isEdit) {
        await recipes.doc(this.data.recipeId).update({ data });
      } else {
        data.createTime = db.serverDate();
        await recipes.add({ data });
      }
      wx.showToast({ title: this.data.isEdit ? '保存成功' : '添加成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1200);
    } catch (err) { wx.showToast({ title: '保存失败', icon: 'none' }); }
  }
});
