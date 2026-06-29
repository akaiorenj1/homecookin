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
    currentTab: 'pending',
    ordersList: [],
    shoppingList: [],
    today: '',
    loading: true
  },

  onLoad() {
    this.setTodayDate();
    this.initWatch();
  },

  onUnload() {
    if (this._ordersWatch) {
      this._ordersWatch.close();
    }
  },

  setTodayDate() {
    const now = new Date();
    const today = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    this.setData({ today });
  },

  initWatch() {
    const that = this;
    this._ordersWatch = db.collection('orders')
      .where({
        status: 'pending'
      })
      .orderBy('createTime', 'desc')
      .watch({
        onChange: function(snapshot) {
          const list = snapshot.docs.map(item => {
            const createTime = item.createTime ? new Date(item.createTime) : new Date();
            const timeStr = `${createTime.getHours().toString().padStart(2, '0')}:${createTime.getMinutes().toString().padStart(2, '0')}`;
            const dateStr = `${createTime.getFullYear()}-${String(createTime.getMonth() + 1).padStart(2, '0')}-${String(createTime.getDate()).padStart(2, '0')} ${timeStr}`;
            return { ...item, createTimeFormat: timeStr, createDateFormat: dateStr };
          });
          that.setData({
            ordersList: list,
            loading: false
          });
          that.calculateShoppingList(list);
        },
        onError: function(err) {
          console.error('监听订单变化失败:', err);
        }
      });
  },

  onShow() {
    this.setTodayDate();
    if (!this.data.ordersList.length) {
      this.loadOrders();
    } else {
      this.calculateShoppingList(this.data.ordersList);
    }
  },

  onPullDownRefresh() {
    this.loadOrders().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    
    if (this._ordersWatch) {
      this._ordersWatch.close();
    }
    
    this.setData({ 
      currentTab: tab,
      ordersList: [],
      shoppingList: []
    });
    
    if (tab === 'pending') {
      this.initWatch();
    } else {
      this.loadOrders();
    }
  },

  async loadOrders() {
    this.setData({ loading: true });
    
    try {
      const res = await db.collection('orders')
        .where({
          status: this.data.currentTab
        })
        .orderBy('createTime', 'desc')
        .get();
      
      const list = res.data.map(item => {
        const createTime = item.createTime ? new Date(item.createTime) : new Date();
        const timeStr = `${createTime.getHours().toString().padStart(2, '0')}:${createTime.getMinutes().toString().padStart(2, '0')}`;
        const dateStr = `${createTime.getFullYear()}-${String(createTime.getMonth() + 1).padStart(2, '0')}-${String(createTime.getDate()).padStart(2, '0')} ${timeStr}`;
        return { ...item, createTimeFormat: timeStr, createDateFormat: dateStr };
      });
      
      this.setData({
        ordersList: list,
        loading: false
      });

      if (this.data.currentTab === 'pending') {
        this.calculateShoppingList(list);
      }
    } catch (err) {
      console.error('加载订单失败:', err);
      this.setData({ loading: false });
    }
  },

  async calculateShoppingList(orders) {
    if (orders.length === 0) {
      this.setData({ shoppingList: [] });
      return;
    }

    try {
      const inventoryRes = await db.collection('inventory').get();
      const inventoryMap = {};
      inventoryRes.data.forEach(item => {
        inventoryMap[item.name] = { quantity: item.quantity, unit: item.unit };
      });

      const requiredIngredients = {};
      orders.forEach(order => {
        const recipeIngredients = order.ingredients || [];
        recipeIngredients.forEach(ing => {
          if (requiredIngredients[ing.ingredientName]) {
            requiredIngredients[ing.ingredientName] += ing.quantity;
          } else {
            requiredIngredients[ing.ingredientName] = ing.quantity;
          }
        });
      });

      const shoppingList = [];
      for (const [name, needQty] of Object.entries(requiredIngredients)) {
        const currentInfo = inventoryMap[name] || { quantity: 0, unit: 'g' };
        const diff = needQty - currentInfo.quantity;
        if (diff > 0) {
          shoppingList.push({
            name: name,
            needQuantity: Math.ceil(diff),
            unit: currentInfo.unit || 'g',
            currentQuantity: currentInfo.quantity
          });
        }
      }

      this.setData({ shoppingList });
    } catch (err) {
      console.error('计算采购清单失败:', err);
    }
  },

  deleteOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    const orderName = e.currentTarget.dataset.name;
    
    wx.showModal({
      title: '删除订单',
      content: `确定要删除「${orderName}」吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await db.collection('orders').doc(orderId).remove();
            wx.showToast({
              title: '已删除',
              icon: 'success'
            });
          } catch (err) {
            console.error('删除失败:', err);
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  async completeOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认完成',
      content: '完成后将自动扣减库存，确定吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const orderRes = await db.collection('orders').doc(orderId).get();
            const order = orderRes.data;
            
            if (!order.ingredients || order.ingredients.length === 0) {
              wx.showToast({
                title: '没有食材信息',
                icon: 'none'
              });
              return;
            }

            const inventoryRes = await db.collection('inventory').get();
            const inventoryMap = {};
            inventoryRes.data.forEach(item => {
              inventoryMap[item.name] = { 
                quantity: item.quantity, 
                _id: item._id,
                unit: item.unit
              };
            });

            const insufficientItems = [];
            const missingItems = [];
            
            for (const ing of order.ingredients) {
              const inventoryItem = inventoryMap[ing.ingredientName];
              
              if (!inventoryItem) {
                missingItems.push(ing.ingredientName);
              } else if (inventoryItem.quantity < ing.quantity) {
                insufficientItems.push(`${ing.ingredientName}（需要${ing.quantity}，库存${inventoryItem.quantity}）`);
              }
            }

            if (missingItems.length > 0) {
              wx.showToast({
                title: `缺少食材：${missingItems.join('、')}`,
                icon: 'none',
                duration: 3000
              });
              return;
            }

            if (insufficientItems.length > 0) {
              wx.showToast({
                title: `库存不足：${insufficientItems.join('、')}`,
                icon: 'none',
                duration: 3000
              });
              return;
            }

            for (const ing of order.ingredients) {
              const inventoryItem = inventoryMap[ing.ingredientName];
              if (inventoryItem) {
                await db.collection('inventory').doc(inventoryItem._id).update({
                  data: {
                    quantity: _.inc(-ing.quantity)
                  }
                });

                await db.collection('inventory_logs').add({
                  data: {
                    ingredientName: ing.ingredientName,
                    quantity: ing.quantity,
                    unit: inventoryItem.unit || ing.unit || 'g',
                    type: 'out',
                    description: `做菜消耗：${order.recipeName}`,
                    createTime: db.serverDate()
                  }
                });
              }
            }
            
            await db.collection('orders').doc(orderId).update({
              data: {
                status: 'completed'
              }
            });
            
            wx.showToast({
              title: '已完成',
              icon: 'success'
            });
          } catch (err) {
            console.error('更新订单状态失败:', err);
            wx.showToast({
              title: '操作失败',
              icon: 'none'
            });
          }
        }
      }
    });
  }
});
