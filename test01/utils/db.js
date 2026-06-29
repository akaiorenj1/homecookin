/**
 * 数据库操作封装
 * 统一错误处理、loading 状态
 */

const db = wx.cloud.database();
const _ = db.command;

// ========== 集合引用 ==========

const recipes = db.collection('recipes');
const ingredients = db.collection('ingredients');
const inventory = db.collection('inventory');
const orders = db.collection('orders');
const users = db.collection('users');
const inventoryLogs = db.collection('inventory_logs');

// ========== 通用操作 ==========

/**
 * 查询列表
 */
async function find(collection, options = {}) {
  const { where = {}, orderBy, orderDir = 'desc', limit = 100, skip = 0 } = options;
  let query = collection.where(where);
  
  if (orderBy) {
    query = query.orderBy(orderBy, orderDir);
  }
  
  query = query.skip(skip).limit(limit);
  const res = await query.get();
  return res.data;
}

/**
 * 查询单条
 */
async function findById(collection, id) {
  const res = await collection.doc(id).get();
  return res.data;
}

/**
 * 新增
 */
async function insert(collection, data) {
  data.createTime = db.serverDate();
  data.updateTime = db.serverDate();
  const res = await collection.add({ data });
  return res._id;
}

/**
 * 更新
 */
async function update(collection, id, data) {
  data.updateTime = db.serverDate();
  await collection.doc(id).update({ data });
}

/**
 * 删除
 */
async function remove(collection, id) {
  await collection.doc(id).remove();
}

/**
 * 计数
 */
async function count(collection, where = {}) {
  const res = await collection.where(where).count();
  return res.total;
}

// ========== 业务操作 ==========

/**
 * 获取库存映射表 { name: { quantity, unit, _id } }
 */
async function getInventoryMap() {
  const list = await find(inventory, { orderBy: 'name' });
  const map = {};
  list.forEach(item => {
    map[item.name] = { quantity: item.quantity, unit: item.unit, _id: item._id };
  });
  return map;
}

module.exports = {
  db,
  _,
  recipes,
  ingredients,
  inventory,
  orders,
  users,
  inventoryLogs,
  find,
  findById,
  insert,
  update,
  remove,
  count,
  getInventoryMap
};
