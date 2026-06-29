# TabBar 图标说明

由于微信小程序 TabBar 图标需要 81x81 的 PNG 图片，
请在 images/ 目录下放入以下图标文件：

## 需要的文件（按 app.json 配置）：
1. tab-menu.png          - 菜谱（未选中）
2. tab-menu-active.png   - 菜谱（选中）
3. tab-inventory.png     - 库存（未选中）
4. tab-inventory-active.png - 库存（选中）
5. tab-orders.png        - 订单（未选中）
6. tab-orders-active.png - 订单（选中）

## 临时方案：
如果暂时没有图标，可以把 app.json 中 tabBar.list 的 iconPath 和 selectedIconPath 删掉，
TabBar 会以纯文字模式显示，不影响功能。

## 推荐图标来源：
- https://www.iconfont.cn/ 搜索"菜单""库存""订单"下载 81px PNG
- 或使用 Figma/即时设计 自己画
