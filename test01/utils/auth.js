/**
 * 鉴权工具模块
 * 统一管理登录态、用户信息、权限校验
 */

const db = wx.cloud.database();

// ========== 本地存储操作 ==========

function isLoggedIn() {
  return !!wx.getStorageSync('isAuthorized');
}

function getCurrentUser() {
  return wx.getStorageSync('userInfo') || null;
}

function saveAuth(userInfo) {
  wx.setStorageSync('isAuthorized', true);
  wx.setStorageSync('userInfo', userInfo);
}

function clearAuth() {
  wx.removeStorageSync('isAuthorized');
  wx.removeStorageSync('userInfo');
}

// ========== 登录流程 ==========

async function cloudLogin() {
  const wxContext = await wx.cloud.callFunction({ name: 'login', data: {} });
  const result = wxContext.result;
  if (result && result.success) {
    saveAuth(result.user);
    return { success: true, user: result.user, isNew: result.isNew };
  }
  return { success: false, error: result?.error || '登录失败' };
}

// ========== 页面守卫 ==========

/**
 * 页面鉴权守卫 - 在页面 onShow 中调用
 * @param {Object} options - { redirectTo?: string, silent?: boolean }
 * @returns {boolean} 是否已登录
 */
function guard(options = {}) {
  if (isLoggedIn()) return true;
  
  const { redirectTo = '/pages/login/login', silent = false } = options;
  
  if (!silent) {
    wx.showToast({ title: '请先登录', icon: 'none', duration: 1500 });
  }
  
  setTimeout(() => {
    wx.reLaunch({ url: redirectTo });
  }, silent ? 0 : 1500);
  
  return false;
}

// ========== 权限检查 ==========

function isAdmin() {
  const user = getCurrentUser();
  return user && user.role === 'admin';
}

function requireAdmin() {
  if (!isAdmin()) {
    wx.showToast({ title: '需要管理员权限', icon: 'none' });
    return false;
  }
  return true;
}

module.exports = {
  isLoggedIn,
  getCurrentUser,
  saveAuth,
  clearAuth,
  cloudLogin,
  guard,
  isAdmin,
  requireAdmin
};
