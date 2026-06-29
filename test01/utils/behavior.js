/**
 * 页面鉴权 Behavior
 * 所有需要登录的页面引入此 Behavior，自动处理 onShow 鉴权
 * 
 * 使用方式:
 *   const authBehavior = require('../../utils/behavior');
 *   Page({
 *     behaviors: [authBehavior],
 *     // ... 页面其他配置
 *   });
 */

const auth = require('./auth');

module.exports = Behavior({
  lifetimes: {
    attached() {
      // 组件/页面创建时的鉴权标记
      this.__authChecked = false;
    }
  },

  pageLifetimes: {
    show() {
      if (this.__authChecked) return;
      this.__authChecked = true;
      
      if (!auth.isLoggedIn()) {
        wx.showToast({ title: '请先登录', icon: 'none', duration: 1500 });
        setTimeout(() => {
          wx.reLaunch({ url: '/pages/login/login' });
        }, 1500);
      }
    }
  },

  methods: {
    /**
     * 显式调用鉴权检查（替代原有的 checkAuth）
     */
    $checkAuth() {
      return auth.guard({ silent: true });
    },

    $getUser() {
      return auth.getCurrentUser();
    },

    $isAdmin() {
      return auth.isAdmin();
    }
  }
});
