const app = getApp();

const CORRECT_PASSWORD = '123456';

Page({
  data: {
    password: '',
    errorMsg: ''
  },

  onLoad() {
    wx.removeStorageSync('isAuthorized');
    wx.removeStorageSync('userInfo');
    
    const isAuthorized = wx.getStorageSync('isAuthorized');
    if (isAuthorized) {
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  onPasswordInput(e) {
    this.setData({ 
      password: e.detail.value,
      errorMsg: ''
    });
  },

  doLogin() {
    const { password } = this.data;
    
    if (!password) {
      this.setData({ errorMsg: '请输入密码' });
      return;
    }

    if (password === CORRECT_PASSWORD) {
      wx.setStorageSync('isAuthorized', true);
      wx.setStorageSync('userInfo', { nickname: '授权用户' });
      
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });

      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' });
      }, 1500);
    } else {
      this.setData({ errorMsg: '密码错误，请重试' });
    }
  }
});
