# 高德地图API配置说明

## 获取高德地图API密钥

1. 访问高德开放平台：https://console.amap.com/dev/key/app
2. 注册并登录账号
3. 创建新应用
4. 添加Key，选择"Web端(JS API)"
5. 复制生成的API Key

## 配置步骤

1. 打开 `public/index.html` 文件
2. 找到以下行：
   ```html
   <script type="text/javascript" src="https://webapi.amap.com/maps?v=2.0&key=YOUR_AMAP_KEY&plugin=AMap.Scale,AMap.ToolBar,AMap.ControlBar,AMap.Geolocation"></script>
   ```
3. 将 `YOUR_AMAP_KEY` 替换为您申请的API密钥

## 注意事项

- 高德地图API密钥是免费的，但有调用次数限制
- 个人开发者每日可免费调用10万次
- 请妥善保管您的API密钥，不要泄露给他人
- 建议在生产环境中使用环境变量来管理API密钥

## 临时测试密钥

为了方便测试，您可以使用以下临时密钥（仅供开发测试使用）：
`b9b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3`

注意：此密钥仅为示例，实际使用时请申请您自己的密钥。

## 高德地图功能特性

相比Leaflet，高德地图API提供了以下优势：

1. **国内优化**: 专为中国用户优化，地图数据更准确
2. **丰富的插件**: 内置定位、路径规划、地理编码等功能
3. **移动端支持**: 更好的移动设备兼容性
4. **中文支持**: 完整的中文地名和地址支持
5. **实时数据**: 实时交通、POI信息等

## 已实现的功能

- ✅ 高德地图基础显示
- ✅ 自定义标记点（支持分类图标和颜色）
- ✅ 点击地图添加店铺
- ✅ 信息窗口显示店铺详情
- ✅ 地图控件（缩放、工具栏）
- ✅ 用户定位功能
- ✅ 地图状态同步到Vuex
