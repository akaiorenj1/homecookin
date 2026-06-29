const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { fileID } = event;

  try {
    // 先获取临时 URL
    const urlResult = await cloud.getTempFileURL({
      fileList: [fileID]
    });
    const tempUrl = urlResult.fileList[0]?.tempFileURL;

    if (!tempUrl) {
      return { success: false, error: '无法获取图片链接' };
    }

    // 调用微信 OCR API
    const result = await cloud.openapi.ocr.printedText({
      type: 'url',
      value: tempUrl
    });

    const text = result?.data?.text || result?.text || '';
    const items = result?.data?.items || result?.items || [];

    const lines = text ? text.split('\n').filter(line => line.trim()) : [];

    // 增强版正则：支持多种小票格式
    const quantityPatterns = [
      /(\d+(?:\.\d+)?)\s*(g|kg|个|颗|把|袋|盒|瓶|L|ml|克|千克|公斤|斤|两)/i,
      /(\d+(?:\.\d+)?)\s*(g|kg|个|颗|把|袋|盒|瓶|L|ml)/i,
      /×\s*(\d+(?:\.\d+)?)/i
    ];

    const ingredients = [];

    for (const line of lines) {
      for (const pattern of quantityPatterns) {
        const match = line.match(pattern);
        if (match) {
          let quantity = parseFloat(match[1]);
          let unit = match[2] || '个';

          // 单位转换
          if (unit === '千克' || unit === '公斤') { quantity *= 1000; unit = 'g'; }
          else if (unit === '斤') { quantity *= 500; unit = 'g'; }
          else if (unit === '两') { quantity *= 50; unit = 'g'; }
          else if (unit === '克') { unit = 'g'; }

          const name = line.replace(pattern, '').replace(/[¥￥]\s*\d+(?:\.\d+)?/g, '').replace(/\d+/g, '').trim();
          
          if (name && quantity > 0 && name.length < 20) {
            ingredients.push({ name, quantity, unit });
          }
          break;
        }
      }
    }

    return {
      success: true,
      rawText: text,
      ingredients: ingredients.length > 0 ? ingredients : lines.map(l => ({ name: l.trim(), quantity: 1, unit: '个' })).filter(i => i.name)
    };
  } catch (e) {
    console.error('OCR 识别失败:', e);
    return { success: false, error: e.message || 'OCR 识别失败' };
  }
};
