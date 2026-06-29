const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

async function createCollectionIfNotExist(name) {
  try {
    await db.collection(name).count();
  } catch (e) {
    if (e.message && e.message.includes('not exist')) {
      await db.createCollection(name);
    }
  }
}

exports.main = async (event, context) => {
  try {
    const collections = ['recipes', 'ingredients', 'inventory', 'orders', 'users', 'inventory_logs'];
    
    for (const name of collections) {
      await createCollectionIfNotExist(name);
    }

    const recipesCount = await db.collection('recipes').count();
    if (recipesCount.total === 0) {
      const sampleRecipes = [
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
          name: '蒜蓉白菜',
          category: 'main',
          cookingTime: 10,
          method: '1. 白菜洗净切段\n2. 蒜蓉爆香\n3. 放入白菜翻炒\n4. 加盐调味即可',
          image: '',
          ingredients: [
            { ingredientName: '白菜', quantity: 300, unit: 'g' }
          ],
          tags: ['清淡', '快手菜']
        }
      ];

      for (const recipe of sampleRecipes) {
        await db.collection('recipes').add({ data: { ...recipe, createTime: db.serverDate() } });
      }
    }

    const ingredientsCount = await db.collection('ingredients').count();
    if (ingredientsCount.total === 0) {
      const sampleIngredients = [
        { name: '猪肉', unit: 'g', category: 'meat' },
        { name: '牛肉', unit: 'g', category: 'meat' },
        { name: '鸡肉', unit: 'g', category: 'meat' },
        { name: '白菜', unit: 'g', category: 'vegetable' },
        { name: '土豆', unit: 'g', category: 'vegetable' },
        { name: '西红柿', unit: 'g', category: 'vegetable' },
        { name: '鸡蛋', unit: '个', category: 'other' },
        { name: '糖', unit: 'g', category: 'other' }
      ];

      for (const ing of sampleIngredients) {
        await db.collection('ingredients').add({ data: { ...ing, createTime: db.serverDate() } });
      }
    }

    return { success: true, message: '数据库和示例数据初始化完成' };
  } catch (e) {
    return { success: false, error: e.message };
  }
};
