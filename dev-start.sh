#!/bin/bash

# 本地开发环境启动脚本

set -e

echo "🍕 美食地图前端 - 本地开发环境"
echo "================================"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js (版本 14+)"
    exit 1
fi

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo "✅ npm 版本: $(npm --version)"
echo ""

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
    echo "✅ 依赖安装完成"
    echo ""
fi

# 检查配置文件
if [ ! -f "public/config.json.local" ]; then
    echo "⚙️  创建本地配置文件..."
    cp public/config.json public/config.json.local
    echo "📝 请编辑 public/config.json.local 文件，设置正确的配置值："
    echo "   - API_BASE_URL: 后端 API 地址"
    echo "   - AMAP_KEY: 高德地图 API 密钥"
    echo ""
    echo "配置文件位置: public/config.json.local"
    echo ""
    read -p "按回车键继续..."
fi

echo "🚀 启动开发服务器..."
echo "📍 应用将在 http://localhost:8080 启动"
echo "🔧 配置文件: public/config.json.local"
echo ""
echo "💡 提示："
echo "   - 修改代码后会自动热重载"
echo "   - 按 Ctrl+C 停止服务器"
echo ""

# 启动开发服务器
npm run serve
