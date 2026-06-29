/**
 * 页面鉴权 Behavior
 * 所有需要登录的页面引入此 Behavior
 * 
 * 使用方式:
 *   const authBehavior = require('../../utils/behavior');
 *   Page({
 *     behaviors: [authBehavior],
 *     // ... 页面其他配置
 *   });
 * 
 * 注意：如果页面自定义了 onShow，Behavior 的 onShow 会先执行，
 * 然后页面的 onShow 再执行。这是微信小程序的标准合并行为。
 */

const auth = require('./auth');

module.exports = Behavior({
  lifetimes: {
    attached() {
      this.__authChecked = false;
    }
  },

  // ⚠️ 必须在 Behavior 根级别定义 onShow，不能用 pageLifetimes
  // pageLifetimes 是 Component 专属，在 Page 中不触发
  methods: {
    /** 使用子菜单二次确认（可被页面覆盖） */
    $checkAuth() {
      return auth.guard({ silent: true });
    },

    $getUser() {
      return auth.getCurrentUser();
    },

    $isAdmin() {
      return auth.isAdmin();
    }
  },

  // 根级别 onShow — Page + Behavior 合并时，
  // Behavior 的 onShow 先于 Page 的 onShow 执行
  onShow() {
    if (this.__authChecked) return;
    this.__authChecked = true;

    if (!auth.isLoggedIn()) {
      wx.showToast({ title: '请先登录', icon: 'none', duration: 1500 });
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/login/login' });
      }, 1500);
    }
  }
});
