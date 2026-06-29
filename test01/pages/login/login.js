const auth = require('../../utils/auth');

Page({
  data: {
    loading: false,
    errorMsg: ''
  },

  onLoad() {
    // 已登录直接跳转，不再清除再检查
    if (auth.isLoggedIn()) {
      wx.switchTab({ url: '/pages/menu/menu' });
    }
  },

  /**
   * 微信静默登录 — 调用云函数获取 openid
   * 基础库 2.27.1+ 已废弃 wx.getUserProfile，改用云函数获取 openid 做身份标识
   */
  async doLogin() {
    if (this.data.loading) return;
    this.setData({ loading: true, errorMsg: '' });

    try {
      const result = await auth.cloudLogin();

      if (result.success) {
        wx.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(() => wx.switchTab({ url: '/pages/menu/menu' }), 1000);
      } else {
        this.setData({ errorMsg: result.error || '登录失败，请确认云开发环境已配置' });
      }
    } catch (err) {
      console.error('登录失败:', err);
      this.setData({ errorMsg: '网络错误，请检查云开发环境' });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 备用密码登录 — 当云开发环境未配置时的兜底
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
          setTimeout(() => wx.switchTab({ url: '/pages/menu/menu' }), 1000);
        } else if (res.confirm) {
          wx.showToast({ title: '密码错误', icon: 'none' });
        }
      }
    });
  }
});
