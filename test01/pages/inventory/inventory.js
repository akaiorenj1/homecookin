const db = wx.cloud.database();
const _ = db.command;

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
    inventoryList: [],
    loading: true,
    showModal: false,
    showOcrModal: false,
    modalType: 'add',
    ocrResults: [],
    submitting: false,
    newInventory: {
      name: '',
      quantity: ''
    },
    wasteItem: {},
    wasteQuantity: '',
    wasteReason: '',
    units: ['g', 'kg', '斤', '两', '个', '颗', '把', '袋', '盒', '瓶', 'L', 'ml'],
    unitIndex: 0,
    unitConversion: {
      '斤': 500,
      '两': 50,
      'kg': 1000,
      'L': 1000
    }
  },

  onLoad() {
    this.initWatch();
  },

  onShow() {
    if (!this.data.inventoryList.length) {
      this.loadInventory();
    }
  },

  onUnload() {
    if (this._inventoryWatch) {
      this._inventoryWatch.close();
    }
  },

  initWatch() {
    const that = this;
    this._inventoryWatch = db.collection('inventory')
      .orderBy('name', 'asc')
      .watch({
        onChange: function(snapshot) {
          if (snapshot.docChanges.length > 0) {
            const list = snapshot.docs.map(item => {
              let categoryText = '食材';
              if (item.category === 'vegetable') categoryText = '蔬菜';
              else if (item.category === 'meat') categoryText = '肉类';
              else if (item.category === 'seafood') categoryText = '海鲜';
              else if (item.category === 'seasoning') categoryText = '调料';
              return { ...item, categoryText };
            });
            that.setData({
              inventoryList: list,
              loading: false
            });
          }
        },
        onError: function(err) {
          console.error('监听库存变化失败:', err);
        }
      });
  },

  async loadInventory() {
    this.setData({ loading: true });
    try {
      const res = await db.collection('inventory')
        .orderBy('name', 'asc')
        .get();
      
      const list = res.data.map(item => {
        let categoryText = '食材';
        if (item.category === 'vegetable') categoryText = '蔬菜';
        else if (item.category === 'meat') categoryText = '肉类';
        else if (item.category === 'seafood') categoryText = '海鲜';
        else if (item.category === 'seasoning') categoryText = '调料';
        return { ...item, categoryText };
      });
      
      this.setData({
        inventoryList: list,
        loading: false
      });
    } catch (err) {
      console.error('加载库存失败:', err);
      this.setData({ loading: false });
    }
  },

  goToLogs() {
    wx.navigateTo({ url: '/pages/inventory-logs/inventory-logs' });
  },

  showAddModal(e) {
    const item = e.currentTarget.dataset.item;
    if (item) {
      this.setData({
        showModal: true,
        modalType: 'increase',
        newInventory: { name: item.name, quantity: '' },
        unitIndex: this.data.units.indexOf(item.unit) || 0
      });
    } else {
      this.setData({
        showModal: true,
        modalType: 'add',
        newInventory: { name: '', quantity: '' },
        unitIndex: 0
      });
    }
  },

  hideModal() {
    this.setData({ showModal: false });
  },

  onNameInput(e) {
    this.setData({ 'newInventory.name': e.detail.value });
  },

  onQuantityInput(e) {
    this.setData({ 'newInventory.quantity': e.detail.value });
  },

  onUnitChange(e) {
    this.setData({ unitIndex: e.detail.value });
  },

  async submitInventory() {
    if (this.data.submitting) return;
    
    const { name, quantity } = this.data.newInventory;
    if (!name || !quantity) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    const unit = this.data.units[this.data.unitIndex];
    const conversion = this.data.unitConversion;
    
    let finalQuantity = parseFloat(quantity);
    let finalUnit = 'g';
    
    if (unit === '斤') {
      finalQuantity = finalQuantity * conversion['斤'];
    } else if (unit === '两') {
      finalQuantity = finalQuantity * conversion['两'];
    } else if (unit === 'kg') {
      finalQuantity = finalQuantity * conversion['kg'];
    } else if (unit === 'L') {
      finalQuantity = finalQuantity * conversion['L'];
    } else if (unit === '个' || unit === '颗' || unit === '把' || unit === '袋' || unit === '盒' || unit === '瓶') {
      finalUnit = unit;
    } else {
      finalUnit = unit;
    }
    
    try {
      const existRes = await db.collection('inventory').where({ name: name }).get();

      if (existRes.data.length > 0) {
        const existing = existRes.data[0];
        if (existing.unit === unit || (existing.unit === 'g' && finalUnit === 'g')) {
          await db.collection('inventory').doc(existing._id).update({
            data: { quantity: db.command.inc(finalQuantity) }
          });
        } else {
          wx.showToast({ title: '单位不一致，请使用相同单位', icon: 'none' });
          this.setData({ submitting: false });
          return;
        }
      } else {
        await db.collection('inventory').add({
          data: {
            name: name,
            quantity: finalQuantity,
            unit: finalUnit,
            category: 'other',
            updateTime: db.serverDate()
          }
        });
      }

      await db.collection('inventory_logs').add({
        data: {
          ingredientName: name,
          quantity: finalQuantity,
          unit: finalUnit,
          type: 'in',
          description: this.data.modalType === 'add' ? '新增入库' : '补充入库',
          createTime: db.serverDate()
        }
      });

      wx.showToast({ title: '添加成功', icon: 'success' });
      this.hideModal();
      this.loadInventory();
    } catch (err) {
      console.error('添加库存失败:', err);
      wx.showToast({ title: '添加失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  showWasteModal(e) {
    const item = e.currentTarget.dataset.item;
    this.setData({
      showWasteModal: true,
      wasteItem: item,
      wasteQuantity: '',
      wasteReason: ''
    });
  },

  closeWasteModal() {
    this.setData({ showWasteModal: false });
  },

  onWasteQuantityInput(e) {
    this.setData({ wasteQuantity: e.detail.value });
  },

  onWasteReasonInput(e) {
    this.setData({ wasteReason: e.detail.value });
  },

  async submitWaste() {
    const { wasteItem, wasteQuantity, wasteReason } = this.data;
    if (!wasteQuantity || parseFloat(wasteQuantity) <= 0) {
      wx.showToast({ title: '请输入有效的报废数量', icon: 'none' });
      return;
    }

    const quantity = parseFloat(wasteQuantity);
    if (quantity > wasteItem.quantity) {
      wx.showToast({ title: '报废数量不能超过库存', icon: 'none' });
      return;
    }

    try {
      await db.collection('inventory').doc(wasteItem._id).update({
        data: { quantity: _.inc(-quantity) }
      });

      await db.collection('inventory_logs').add({
        data: {
          ingredientName: wasteItem.name,
          quantity: quantity,
          unit: wasteItem.unit,
          type: 'waste',
          description: wasteReason || '报废',
          createTime: db.serverDate()
        }
      });

      wx.showToast({ title: '报废成功', icon: 'success' });
      this.closeWasteModal();
    } catch (err) {
      console.error('报废失败:', err);
      wx.showToast({ title: '报废失败', icon: 'none' });
    }
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.uploadAndRecognize(tempFilePath);
      }
    });
  },

  async uploadAndRecognize(filePath) {
    wx.showLoading({ title: '识别中...' });

    try {
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath: `ocr/${Date.now()}.png`,
        filePath: filePath
      });

      const ocrRes = await wx.cloud.callFunction({
        name: 'ocrRecognize',
        data: { fileID: uploadRes.fileID }
      });

      wx.hideLoading();

      if (ocrRes.result && ocrRes.result.success) {
        const ingredients = ocrRes.result.ingredients;
        if (ingredients && ingredients.length > 0) {
          this.setData({ showOcrModal: true, ocrResults: ingredients });
        } else {
          wx.showToast({ title: '未识别到食材', icon: 'none' });
        }
      } else {
        wx.showToast({ title: ocrRes.result?.error || '识别失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('OCR识别失败:', err);
      wx.showToast({ title: '识别失败，请重试', icon: 'none' });
    }
  },

  closeOcrModal() {
    this.setData({ showOcrModal: false, ocrResults: [] });
  },

  onOcrInput(e) {
    const { index, field } = e.currentTarget.dataset;
    const value = e.detail.value;
    const ocrResults = [...this.data.ocrResults];
    ocrResults[index][field] = value;
    this.setData({ ocrResults });
  },

  addOcrItem() {
    this.setData({ ocrResults: [...this.data.ocrResults, { name: '', quantity: '' }] });
  },

  deleteOcrItem(e) {
    const index = e.currentTarget.dataset.index;
    const ocrResults = this.data.ocrResults.filter((_, i) => i !== index);
    this.setData({ ocrResults });
  },

  async submitOcrResults() {
    const validResults = this.data.ocrResults.filter(item => item.name && item.quantity);
    if (validResults.length === 0) {
      wx.showToast({ title: '没有有效的食材数据', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '入库中...' });

    try {
      for (const item of validResults) {
        const existRes = await db.collection('inventory').where({ name: item.name }).get();
        if (existRes.data.length > 0) {
          await db.collection('inventory').doc(existRes.data[0]._id).update({
            data: { quantity: db.command.inc(parseFloat(item.quantity)) }
          });
        } else {
          await db.collection('inventory').add({
            data: {
              name: item.name,
              quantity: parseFloat(item.quantity),
              unit: 'g',
              category: 'other',
              updateTime: db.serverDate()
            }
          });
        }

        await db.collection('inventory_logs').add({
          data: {
            ingredientName: item.name,
            quantity: parseFloat(item.quantity),
            unit: 'g',
            type: 'in',
            description: 'OCR识别入库',
            createTime: db.serverDate()
          }
        });
      }

      wx.hideLoading();
      wx.showToast({ title: '入库成功', icon: 'success' });
      this.closeOcrModal();
    } catch (err) {
      wx.hideLoading();
      console.error('入库失败:', err);
      wx.showToast({ title: '入库失败', icon: 'none' });
    }
  }
});
