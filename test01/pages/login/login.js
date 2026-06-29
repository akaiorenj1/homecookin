const auth = require('../../utils/auth');

Page({
  data: {
    loading: false,
    errorMsg: ''
  },

  onLoad() {
    auth.clearAuth();
    
    // 已登录则直接跳转
    if (auth.isLoggedIn()) {
      wx.switchTab({ url: '/pages/menu/menu' });
    }
  },

  /**
   * 微信一键登录 — 调用云函数获取 openid 完成鉴权
   */
  async doLogin() {
    if (this.data.loading) return;
    this.setData({ loading: true, errorMsg: '' });

    try {
      // 先获取微信用户信息
      const profileRes = await wx.getUserProfile({ desc: '用于家庭成员识别' }).catch(() => null);
      
      const result = await auth.cloudLogin();
      
      if (result.success) {
        wx.showToast({ title: '登录成功', icon: 'success' });
        
        setTimeout(() => {
          wx.switchTab({ url: '/pages/menu/menu' });
        }, 1200);
      } else {
        this.setData({ errorMsg: result.error || '登录失败，请重试' });
      }
    } catch (err) {
      console.error('登录失败:', err);
      this.setData({ errorMsg: '网络错误，请检查云开发环境' });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 备用：密码登录（用于无法获取用户信息时）
   */
  showPasswordLogin() {
    wx.showModal({
      title: '备用登录',
      content: '输入家庭密码',
      editable: true,
      placeholderText: '请输入家庭密码',
      success: (res) => {
        if (res.confirm && res.content === '123456') {
          auth.saveAuth({ nickname: '家庭成员', role: 'member' });
          wx.showToast({ title: '登录成功', icon: 'success' });
          setTimeout(() => wx.switchTab({ url: '/pages/menu/menu' }), 1200);
        } else if (res.confirm) {
          wx.showToast({ title: '密码错误', icon: 'none' });
        }
      }
    });
  }
});
