const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  const { fileID } = event;

  try {
    const result = await cloud.openapi.ocr.printedText({
      type: 'url',
      value: fileID
    });

    const text = result.data.text;
    const lines = text.split('\n').filter(line => line.trim());

    const ingredients = [];
    const quantityPattern = /(\d+(?:\.\d+)?)\s*(g|kg|个|颗|把|袋|盒|瓶|L|ml|克|千克|公斤)?/i;

    for (const line of lines) {
      const match = line.match(quantityPattern);
      if (match) {
        let quantity = parseFloat(match[1]);
        let unit = match[2] || 'g';

        if (unit === '千克' || unit === '公斤') {
          quantity = quantity * 1000;
          unit = 'g';
        } else if (unit === '克') {
          unit = 'g';
        } else if (unit === 'ml') {
          unit = 'ml';
        }

        const name = line.replace(quantityPattern, '').trim();
        if (name && quantity > 0) {
          ingredients.push({ name, quantity, unit });
        }
      }
    }

    return {
      success: true,
      rawText: text,
      ingredients: ingredients
    };
  } catch (e) {
    return {
      success: false,
      error: e.message
    };
  }
};
