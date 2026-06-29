const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;

  try {
    const existUser = await db.collection('users').where({ openId }).get();

    if (existUser.data.length > 0) {
      const user = existUser.data[0];
      await db.collection('users').doc(user._id).update({
        data: { lastLoginTime: db.serverDate() }
      });
      return { success: true, user, isNew: false };
    }

    // 新用户自动注册
    const newUser = {
      openId,
      nickname: '家庭成员',
      avatar: '',
      role: 'member', // 默认 member，管理员在云函数 setAdmin 中设置
      createTime: db.serverDate(),
      lastLoginTime: db.serverDate()
    };

    const addRes = await db.collection('users').add({ data: newUser });
    newUser._id = addRes._id;

    return { success: true, user: newUser, isNew: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
};
