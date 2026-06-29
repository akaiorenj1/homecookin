const authBehavior = require('../../utils/behavior');
const { db, _, inventory, inventoryLogs } = require('../../utils/db');
const { INGREDIENT_CATEGORIES, UNITS, UNIT_TO_GRAM, getIngredientCategoryLabel } = require('../../utils/category');

Page({
  behaviors: [authBehavior],

  data: {
    inventoryList: [],
    loading: true,
    showModal: false,
    showOcrModal: false,
    modalType: 'add',
    ocrResults: [],
    submitting: false,
    lowStockAlerts: [],
    newInventory: { name: '', quantity: '' },
    wasteItem: {},
    wasteQuantity: '',
    wasteReason: '',
    units: UNITS,
    unitIndex: 0,
    categories: Object.values(INGREDIENT_CATEGORIES)
  },

  onLoad() {
    this.initWatch();
  },

  onUnload() {
    if (this._watch) this._watch.close();
  },

  initWatch() {
    this._watch = inventory.orderBy('name', 'asc').watch({
      onChange: (snapshot) => {
        const list = snapshot.docs.map(item => ({
          ...item,
          categoryText: getIngredientCategoryLabel(item.category),
          isLow: item.quantity <= 100
        }));
        const alerts = list.filter(item => item.isLow);
        this.setData({ inventoryList: list, loading: false, lowStockAlerts: alerts });
      },
      onError: (err) => console.error('库存监听失败:', err)
    });
  },

  async loadInventory() {
    this.setData({ loading: true });
    try {
      const res = await inventory.orderBy('name', 'asc').get();
      const list = res.data.map(item => ({
        ...item,
        categoryText: getIngredientCategoryLabel(item.category),
        isLow: item.quantity <= 100
      }));
      this.setData({ inventoryList: list, loading: false });
    } catch (err) {
      console.error('加载库存失败:', err);
      this.setData({ loading: false });
    }
  },

  goToLogs() {
    wx.navigateTo({ url: '/pages/inventory-logs/inventory-logs' });
  },

  // ========== 入库弹窗 ==========

  showAddModal(e) {
    const item = e?.currentTarget?.dataset?.item;
    if (item) {
      this.setData({
        showModal: true, modalType: 'increase',
        newInventory: { name: item.name, quantity: '' },
        unitIndex: this.data.units.indexOf(item.unit) || 0
      });
    } else {
      this.setData({ showModal: true, modalType: 'add', newInventory: { name: '', quantity: '' }, unitIndex: 0 });
    }
  },

  hideModal() {
    this.setData({ showModal: false });
  },

  onNameInput(e) { this.setData({ 'newInventory.name': e.detail.value }); },
  onQuantityInput(e) { this.setData({ 'newInventory.quantity': e.detail.value }); },
  onUnitChange(e) { this.setData({ unitIndex: e.detail.value }); },

  async submitInventory() {
    if (this.data.submitting) return;
    const { name, quantity } = this.data.newInventory;
    if (!name || !quantity) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    const unit = this.data.units[this.data.unitIndex];
    const ratio = UNIT_TO_GRAM[unit];
    const finalQuantity = ratio ? parseFloat(quantity) * ratio : parseFloat(quantity);
    const finalUnit = (ratio || unit === 'g' || unit === 'ml') ? 'g' : unit;

    try {
      const exist = await inventory.where({ name }).get();
      if (exist.data.length > 0) {
        await inventory.doc(exist.data[0]._id).update({
          data: { quantity: _.inc(finalQuantity), updateTime: db.serverDate() }
        });
      } else {
        await inventory.add({
          data: { name, quantity: finalQuantity, unit: finalUnit, category: 'other', updateTime: db.serverDate() }
        });
      }

      await inventoryLogs.add({
        data: {
          ingredientName: name, quantity: finalQuantity, unit: finalUnit,
          type: 'in', description: this.data.modalType === 'add' ? '新增入库' : '补充入库',
          createTime: db.serverDate()
        }
      });

      wx.showToast({ title: '添加成功', icon: 'success' });
      this.hideModal();
    } catch (err) {
      console.error('入库失败:', err);
      wx.showToast({ title: '添加失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  // ========== 报废 ==========

  showWasteModal(e) {
    const item = e.currentTarget.dataset.item;
    this.setData({ showWasteModal: true, wasteItem: item, wasteQuantity: '', wasteReason: '' });
  },

  closeWasteModal() { this.setData({ showWasteModal: false }); },
  onWasteQuantityInput(e) { this.setData({ wasteQuantity: e.detail.value }); },
  onWasteReasonInput(e) { this.setData({ wasteReason: e.detail.value }); },

  async submitWaste() {
    const { wasteItem, wasteQuantity, wasteReason } = this.data;
    const qty = parseFloat(wasteQuantity);
    if (!qty || qty <= 0) {
      wx.showToast({ title: '请输入有效数量', icon: 'none' });
      return;
    }
    if (qty > wasteItem.quantity) {
      wx.showToast({ title: '报废数量不能超过库存', icon: 'none' });
      return;
    }
    try {
      await inventory.doc(wasteItem._id).update({ data: { quantity: _.inc(-qty) } });
      await inventoryLogs.add({
        data: {
          ingredientName: wasteItem.name, quantity: qty, unit: wasteItem.unit,
          type: 'waste', description: wasteReason || '报废', createTime: db.serverDate()
        }
      });
      wx.showToast({ title: '报废成功', icon: 'success' });
      this.closeWasteModal();
    } catch (err) {
      console.error('报废失败:', err);
      wx.showToast({ title: '报废失败', icon: 'none' });
    }
  },

  // ========== OCR 小票识别 ==========

  chooseImage() {
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sourceType: ['album', 'camera'],
      success: (res) => this.uploadAndRecognize(res.tempFiles[0].tempFilePath)
    });
  },

  async uploadAndRecognize(filePath) {
    wx.showLoading({ title: '识别中...' });
    try {
      const uploadRes = await wx.cloud.uploadFile({ cloudPath: `ocr/${Date.now()}.png`, filePath });
      const ocrRes = await wx.cloud.callFunction({ name: 'ocrRecognize', data: { fileID: uploadRes.fileID } });
      wx.hideLoading();
      if (ocrRes.result?.success) {
        const items = ocrRes.result.ingredients;
        if (items?.length) {
          this.setData({ showOcrModal: true, ocrResults: items });
        } else {
          wx.showToast({ title: '未识别到食材', icon: 'none' });
        }
      } else {
        wx.showToast({ title: ocrRes.result?.error || '识别失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '识别失败', icon: 'none' });
    }
  },

  closeOcrModal() { this.setData({ showOcrModal: false, ocrResults: [] }); },

  onOcrInput(e) {
    const { index, field } = e.currentTarget.dataset;
    const results = [...this.data.ocrResults];
    results[index][field] = e.detail.value;
    this.setData({ ocrResults: results });
  },

  addOcrItem() {
    this.setData({ ocrResults: [...this.data.ocrResults, { name: '', quantity: '' }] });
  },

  deleteOcrItem(e) {
    this.setData({ ocrResults: this.data.ocrResults.filter((_, i) => i !== e.currentTarget.dataset.index) });
  },

  async submitOcrResults() {
    const valid = this.data.ocrResults.filter(item => item.name && item.quantity);
    if (!valid.length) {
      wx.showToast({ title: '没有有效的食材数据', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '入库中...' });
    try {
      for (const item of valid) {
        const exist = await inventory.where({ name: item.name }).get();
        if (exist.data.length) {
          await inventory.doc(exist.data[0]._id).update({ data: { quantity: _.inc(parseFloat(item.quantity)) } });
        } else {
          await inventory.add({ data: { name: item.name, quantity: parseFloat(item.quantity), unit: 'g', category: 'other', updateTime: db.serverDate() } });
        }
        await inventoryLogs.add({ data: { ingredientName: item.name, quantity: parseFloat(item.quantity), unit: 'g', type: 'in', description: 'OCR识别入库', createTime: db.serverDate() } });
      }
      wx.hideLoading();
      wx.showToast({ title: '入库成功', icon: 'success' });
      this.closeOcrModal();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '入库失败', icon: 'none' });
    }
  }
});
