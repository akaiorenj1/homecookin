/**
 * 分类映射常量
 * 所有页面共用，一处修改全局生效
 */

// 菜品分类
const RECIPE_CATEGORIES = {
  main:  { label: '菜品', value: 'main' },
  drink: { label: '饮品', value: 'drink' },
  dessert: { label: '甜品', value: 'dessert' }
};

const RECIPE_CATEGORY_LIST = Object.values(RECIPE_CATEGORIES);

// 食材分类
const INGREDIENT_CATEGORIES = {
  vegetable: { label: '蔬菜', value: 'vegetable' },
  meat:      { label: '肉类', value: 'meat' },
  seafood:   { label: '海鲜', value: 'seafood' },
  seasoning: { label: '调料', value: 'seasoning' },
  other:     { label: '其他', value: 'other' }
};

const INGREDIENT_CATEGORY_LIST = Object.values(INGREDIENT_CATEGORIES);

// 库存变动类型
const LOG_TYPES = {
  in:    { label: '入库', value: 'in', color: '#07c160' },
  out:   { label: '消耗', value: 'out', color: '#fa5151' },
  waste: { label: '报废', value: 'waste', color: '#ffc300' }
};

// 单位列表
const UNITS = ['g', 'kg', '斤', '两', '个', '颗', '把', '袋', '盒', '瓶', 'L', 'ml', '勺', '片'];

// 单位换算（到 g/ml）
const UNIT_TO_GRAM = {
  '斤': 500,
  '两': 50,
  'kg': 1000,
  '千克': 1000,
  '公斤': 1000,
  '克': 1,
  'L': 1000
};

// ========== 辅助函数 ==========

function getRecipeCategoryLabel(value) {
  return RECIPE_CATEGORIES[value]?.label || '菜品';
}

function getIngredientCategoryLabel(value) {
  return INGREDIENT_CATEGORIES[value]?.label || '食材';
}

function getLogTypeLabel(value) {
  return LOG_TYPES[value]?.label || value;
}

function getLogTypeColor(value) {
  return LOG_TYPES[value]?.color || '#888';
}

/**
 * 单位换算到克
 */
function convertToGrams(quantity, unit) {
  if (!unit) return quantity;
  const ratio = UNIT_TO_GRAM[unit];
  return ratio ? quantity * ratio : quantity;
}

module.exports = {
  RECIPE_CATEGORIES,
  RECIPE_CATEGORY_LIST,
  INGREDIENT_CATEGORIES,
  INGREDIENT_CATEGORY_LIST,
  LOG_TYPES,
  UNITS,
  UNIT_TO_GRAM,
  getRecipeCategoryLabel,
  getIngredientCategoryLabel,
  getLogTypeLabel,
  getLogTypeColor,
  convertToGrams
};
