const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { userInfo } = event;

  try {
    const openId = wxContext.OPENID;

    const existUser = await db.collection('users').where({
      openId: openId
    }).get();

    if (existUser.data.length > 0) {
      await db.collection('users').doc(existUser.data[0]._id).update({
        data: {
          nickname: userInfo.nickName,
          avatar: userInfo.avatarUrl,
          lastLoginTime: db.serverDate()
        }
      });

      return {
        success: true,
        user: { ...existUser.data[0], nickname: userInfo.nickName, avatar: userInfo.avatarUrl },
        isNew: false
      };
    } else {
      const newUser = {
        openId: openId,
        nickname: userInfo.nickName || '家庭成员',
        avatar: userInfo.avatarUrl || '',
        role: 'member',
        createTime: db.serverDate(),
        lastLoginTime: db.serverDate()
      };

      const addRes = await db.collection('users').add({
        data: newUser
      });

      return {
        success: true,
        user: { _id: addRes._id, ...newUser },
        isNew: true
      };
    }
  } catch (e) {
    return { success: false, error: e.message };
  }
};
