const authBehavior = require('../../utils/behavior');
const { db, ingredients } = require('../../utils/db');
const { INGREDIENT_CATEGORIES, UNITS, getIngredientCategoryLabel } = require('../../utils/category');

Page({
  behaviors: [authBehavior],

  data: {
    ingredientList: [],
    filteredList: [],
    loading: true,
    searchKeyword: '',
    currentCategory: '',
    categories: Object.values(INGREDIENT_CATEGORIES),
    showModal: false,
    isEdit: false,
    editId: '',
    formData: { name: '' },
    units: UNITS,
    unitIndex: 0,
    categoryIndex: 4
  },

  onLoad() { this.loadAll(); },
  onShow() { this.loadAll(); },

  async loadAll() {
    this.setData({ loading: true });
    try {
      const res = await ingredients.get();
      const list = res.data.map(item => ({ ...item, categoryText: getIngredientCategoryLabel(item.category) }));
      this.setData({ ingredientList: list, filteredList: list, loading: false });
    } catch (err) { console.error('加载食材失败:', err); this.setData({ loading: false }); }
  },

  onSearchInput(e) { this.setData({ searchKeyword: e.detail.value }); this.filterList(); },

  switchCategory(e) {
    this.setData({ currentCategory: e.currentTarget.dataset.category });
    this.filterList();
  },

  filterList() {
    let list = this.data.ingredientList;
    if (this.data.currentCategory) list = list.filter(i => i.category === this.data.currentCategory);
    if (this.data.searchKeyword) list = list.filter(i => i.name.toLowerCase().includes(this.data.searchKeyword.toLowerCase()));
    this.setData({ filteredList: list });
  },

  showAddModal() {
    this.setData({ showModal: true, isEdit: false, editId: '', formData: { name: '' }, unitIndex: 0, categoryIndex: 4 });
  },

  editIngredient(e) {
    const item = e.currentTarget.dataset.item;
    const catMap = { '蔬菜': 0, '肉类': 1, '海鲜': 2, '调料': 3, '其他': 4 };
    let ui = this.data.units.indexOf(item.unit);
    if (ui === -1) ui = 0;
    this.setData({ showModal: true, isEdit: true, editId: item._id, formData: { name: item.name }, unitIndex: ui, categoryIndex: catMap[item.categoryText] || 4 });
  },

  hideModal() { this.setData({ showModal: false }); },
  onNameInput(e) { this.setData({ 'formData.name': e.detail.value }); },
  onUnitChange(e) { this.setData({ unitIndex: e.detail.value }); },
  onCategoryChange(e) { this.setData({ categoryIndex: e.detail.value }); },

  async submitIngredient() {
    const { name } = this.data.formData;
    if (!name) { wx.showToast({ title: '请输入名称', icon: 'none' }); return; }
    const catArr = ['vegetable', 'meat', 'seafood', 'seasoning', 'other'];
    const unit = this.data.units[this.data.unitIndex];
    const category = catArr[this.data.categoryIndex];
    try {
      if (this.data.isEdit) {
        await ingredients.doc(this.data.editId).update({ data: { name, unit, category } });
      } else {
        await ingredients.add({ data: { name, unit, category, createTime: db.serverDate() } });
      }
      wx.showToast({ title: '保存成功', icon: 'success' });
      this.hideModal();
      this.loadAll();
    } catch (err) { wx.showToast({ title: '保存失败', icon: 'none' }); }
  },

  async deleteIngredient(e) {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个食材吗？',
      success: async (res) => {
        if (res.confirm) {
          await ingredients.doc(e.currentTarget.dataset.id).remove();
          wx.showToast({ title: '删除成功', icon: 'success' });
          this.loadAll();
        }
      }
    });
  }
});
