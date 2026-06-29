const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const ingredients = [
      { name: '猪肉', unit: 'g', category: 'meat' },
      { name: '牛肉', unit: 'g', category: 'meat' },
      { name: '鸡肉', unit: 'g', category: 'meat' },
      { name: '白菜', unit: 'g', category: 'vegetable' },
      { name: '土豆', unit: 'g', category: 'vegetable' },
      { name: '西红柿', unit: 'g', category: 'vegetable' },
      { name: '鸡蛋', unit: '个', category: 'other' },
      { name: '米饭', unit: 'g', category: 'other' },
      { name: '面粉', unit: 'g', category: 'other' },
      { name: '牛奶', unit: 'ml', category: 'drink' },
      { name: '咖啡', unit: 'g', category: 'drink' },
      { name: '糖', unit: 'g', category: 'dessert' },
      { name: '奶油', unit: 'g', category: 'dessert' }
    ];

    for (const ing of ingredients) {
      const exist = await db.collection('ingredients').where({ name: ing.name }).get();
      if (exist.data.length === 0) {
        await db.collection('ingredients').add({ data: { ...ing, createTime: db.serverDate() } });
      }
    }

    const recipes = [
      {
        name: '红烧肉',
        category: 'main',
        cookingTime: 60,
        method: '1. 五花肉切块焯水\n2. 炒糖色，放入五花肉翻炒\n3. 加入生抽、老抽、料酒\n4. 加水没过肉块，小火炖1小时\n5. 大火收汁即可',
        image: '',
        ingredients: [
          { ingredientName: '猪肉', quantity: 500, unit: 'g' },
          { ingredientName: '糖', quantity: 50, unit: 'g' }
        ],
        tags: ['家常菜', '下饭菜']
      },
      {
        name: '番茄炒蛋',
        category: 'main',
        cookingTime: 15,
        method: '1. 番茄切块，鸡蛋打散\n2. 炒鸡蛋至凝固盛出\n3. 炒番茄出汁\n4. 加入鸡蛋一起翻炒\n5. 加盐调味即可',
        image: '',
        ingredients: [
          { ingredientName: '西红柿', quantity: 200, unit: 'g' },
          { ingredientName: '鸡蛋', quantity: 2, unit: '个' }
        ],
        tags: ['简单快手', '家常菜']
      },
      {
        name: '可乐鸡翅',
        category: 'main',
        cookingTime: 40,
        method: '1. 鸡翅洗净，表面划刀\n2. 冷水下锅焯水\n3. 锅中放油，煎鸡翅至金黄\n4. 加入可乐和调料\n5. 小火炖煮，大火收汁',
        image: '',
        ingredients: [
          { ingredientName: '鸡肉', quantity: 500, unit: 'g' },
          { ingredientName: '糖', quantity: 30, unit: 'g' }
        ],
        tags: ['小朋友最爱', '下饭菜']
      },
      {
        name: '土豆炖牛肉',
        category: 'main',
        cookingTime: 90,
        method: '1. 牛肉切块焯水\n2. 土豆切块\n3. 炒香牛肉，加调料和水\n4. 放入土豆一起炖\n5. 炖至软烂即可',
        image: '',
        ingredients: [
          { ingredientName: '牛肉', quantity: 400, unit: 'g' },
          { ingredientName: '土豆', quantity: 300, unit: 'g' }
        ],
        tags: ['营养丰富', '家常菜']
      },
      {
        name: '蒜蓉白菜',
        category: 'main',
        cookingTime: 10,
        method: '1. 白菜洗净切段\n2. 蒜蓉爆香\n3. 放入白菜翻炒\n4. 加盐调味即可',
        image: '',
        ingredients: [
          { ingredientName: '白菜', quantity: 300, unit: 'g' }
        ],
        tags: ['清淡', '快手菜']
      },
      {
        name: '奶茶',
        category: 'drink',
        cookingTime: 15,
        method: '1. 牛奶加热\n2. 加入茶叶煮出茶味\n3. 过滤茶叶\n4. 加入糖调味',
        image: '',
        ingredients: [
          { ingredientName: '牛奶', quantity: 250, unit: 'ml' },
          { ingredientName: '糖', quantity: 20, unit: 'g' }
        ],
        tags: ['甜品', '饮品']
      },
      {
        name: '美式咖啡',
        category: 'drink',
        cookingTime: 5,
        method: '1. 咖啡粉冲泡\n2. 加入热水稀释\n3. 根据口味加糖或奶',
        image: '',
        ingredients: [
          { ingredientName: '咖啡', quantity: 15, unit: 'g' }
        ],
        tags: ['提神', '饮品']
      },
      {
        name: '奶油蛋糕',
        category: 'dessert',
        cookingTime: 60,
        method: '1. 蛋黄蛋白分离\n2. 蛋黄糊搅拌均匀\n3. 蛋白打发\n4. 混合蛋黄糊和蛋白\n5. 烤箱170度烤40分钟\n6. 冷却后装饰奶油',
        image: '',
        ingredients: [
          { ingredientName: '鸡蛋', quantity: 4, unit: '个' },
          { ingredientName: '面粉', quantity: 80, unit: 'g' },
          { ingredientName: '糖', quantity: 60, unit: 'g' },
          { ingredientName: '奶油', quantity: 100, unit: 'g' }
        ],
        tags: ['甜品', '生日']
      }
    ];

    for (const recipe of recipes) {
      const exist = await db.collection('recipes').where({ name: recipe.name }).get();
      if (exist.data.length === 0) {
        await db.collection('recipes').add({ data: { ...recipe, createTime: db.serverDate() } });
      }
    }

    return { success: true, message: '示例数据初始化完成' };
  } catch (e) {
    return { success: false, error: e.message };
  }
};
