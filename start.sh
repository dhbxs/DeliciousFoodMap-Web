#!/bin/bash

# 美食地图前端快速启动脚本

set -e

echo "🍕 美食地图前端部署脚本"
echo "=========================="

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

# 设置默认值
API_BASE_URL=${API_BASE_URL:-"http://localhost:8080"}
AMAP_KEY=${AMAP_KEY:-""}
PORT=${PORT:-"80"}
CONTAINER_NAME=${CONTAINER_NAME:-"delicious-food-map-web"}

echo "📋 配置信息："
echo "   API_BASE_URL: $API_BASE_URL"
echo "   AMAP_KEY: ${AMAP_KEY:0:10}..."
echo "   PORT: $PORT"
echo "   CONTAINER_NAME: $CONTAINER_NAME"
echo ""

# 停止并删除现有容器
if docker ps -a --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "🛑 停止现有容器..."
    docker stop $CONTAINER_NAME
    docker rm $CONTAINER_NAME
fi

# 构建镜像
echo "🔨 构建 Docker 镜像..."
docker build -t delicious-food-map-web .

# 运行容器
echo "🚀 启动容器..."
docker run -d \
  --name $CONTAINER_NAME \
  -p $PORT:80 \
  -e API_BASE_URL="$API_BASE_URL" \
  -e AMAP_KEY="$AMAP_KEY" \
  --restart unless-stopped \
  delicious-food-map-web

# 等待容器启动
echo "⏳ 等待容器启动..."
sleep 5

# 检查容器状态
if docker ps --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "✅ 容器启动成功！"
    echo ""
    echo "🌐 访问地址："
    echo "   http://localhost:$PORT"
    echo ""
    echo "🔍 查看日志："
    echo "   docker logs -f $CONTAINER_NAME"
    # echo ""
    # echo "🛑 停止服务："
    # echo "   docker stop $CONTAINER_NAME"
else
    echo "❌ 容器启动失败，请检查日志："
    echo "   docker logs $CONTAINER_NAME"
    exit 1
fi
