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
    ingredientList: [],
    filteredList: [],
    loading: true,
    searchKeyword: '',
    currentCategory: '',
    showModal: false,
    isEdit: false,
    editId: '',
    formData: {
      name: ''
    },
    units: ['g', 'kg', '个', '颗', '把', '袋', '盒', '瓶', 'L', 'ml', '勺', '片'],
    unitIndex: 0,
    categories: ['蔬菜', '肉类', '海鲜', '调料', '其他'],
    categoryIndex: 4
  },

  onLoad() {
    this.loadIngredients();
  },

  async loadIngredients() {
    this.setData({ loading: true });
    try {
      const res = await db.collection('ingredients').get();
      const list = res.data.map(item => {
        let categoryText = '其他';
        if (item.category === 'vegetable') categoryText = '蔬菜';
        else if (item.category === 'meat') categoryText = '肉类';
        else if (item.category === 'seafood') categoryText = '海鲜';
        else if (item.category === 'seasoning') categoryText = '调料';
        return { ...item, categoryText };
      });
      this.setData({
        ingredientList: list,
        filteredList: list,
        loading: false
      });
    } catch (err) {
      console.error('加载食材失败:', err);
      this.setData({ loading: false });
    }
  },

  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });
    this.filterList();
  },

  switchCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ currentCategory: category });
    this.filterList();
  },

  filterList() {
    let list = this.data.ingredientList;
    
    if (this.data.currentCategory) {
      const categoryMap = {
        'vegetable': '蔬菜',
        'meat': '肉类',
        'seafood': '海鲜',
        'seasoning': '调料'
      };
      list = list.filter(item => item.category === this.data.currentCategory);
    }
    
    if (this.data.searchKeyword) {
      list = list.filter(item => 
        item.name.toLowerCase().includes(this.data.searchKeyword.toLowerCase())
      );
    }
    
    this.setData({ filteredList: list });
  },

  showAddModal() {
    this.setData({
      showModal: true,
      isEdit: false,
      editId: '',
      formData: { name: '' },
      unitIndex: 0,
      categoryIndex: 4
    });
  },

  editIngredient(e) {
    const item = e.currentTarget.dataset.item;
    const categoryMap = {
      '蔬菜': 0, '肉类': 1, '海鲜': 2, '调料': 3, '其他': 4
    };
    
    let unitIndex = this.data.units.indexOf(item.unit);
    if (unitIndex === -1) unitIndex = 0;
    
    this.setData({
      showModal: true,
      isEdit: true,
      editId: item._id,
      formData: { name: item.name },
      unitIndex: unitIndex,
      categoryIndex: categoryMap[item.categoryText] || 4
    });
  },

  hideModal() {
    this.setData({ showModal: false });
  },

  onNameInput(e) {
    this.setData({ 'formData.name': e.detail.value });
  },

  onUnitChange(e) {
    this.setData({ unitIndex: e.detail.value });
  },

  onCategoryChange(e) {
    this.setData({ categoryIndex: e.detail.value });
  },

  async submitIngredient() {
    const { name } = this.data.formData;
    if (!name) {
      wx.showToast({ title: '请输入名称', icon: 'none' });
      return;
    }

    const categoryArr = ['vegetable', 'meat', 'seafood', 'seasoning', 'other'];
    const unit = this.data.units[this.data.unitIndex];
    const category = categoryArr[this.data.categoryIndex];

    try {
      if (this.data.isEdit) {
        await db.collection('ingredients').doc(this.data.editId).update({
          data: { name, unit, category }
        });
      } else {
        await db.collection('ingredients').add({
          data: { name, unit, category, createTime: db.serverDate() }
        });
      }

      wx.showToast({ title: '保存成功', icon: 'success' });
      this.hideModal();
      this.loadIngredients();
    } catch (err) {
      console.error('保存失败:', err);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  async deleteIngredient(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个食材吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await db.collection('ingredients').doc(id).remove();
            wx.showToast({ title: '删除成功', icon: 'success' });
            this.loadIngredients();
          } catch (err) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  }
});
