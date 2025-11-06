#!/bin/bash

# ngrok Webhook 启动脚本
# 用于快速启动 ngrok 并生成本地 webhook URL

echo "🔍 检查本地服务器状态..."

# 检查本地服务器是否运行
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "⚠️  警告: 本地服务器未运行在 http://localhost:3000"
    echo ""
    echo "请先启动开发服务器："
    echo "  npm run dev"
    echo ""
    read -p "是否继续启动 ngrok? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ 本地服务器正在运行"
fi

echo ""
echo "🚀 启动 ngrok..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 你的 Webhook URL 格式："
echo "   https://[ngrok域名].ngrok-free.app/api/webhooks/creem"
echo ""
echo "💡 提示："
echo "   - 启动后会在下方显示 Forwarding URL"
echo "   - 复制该 URL 并加上 /api/webhooks/creem"
echo "   - 在 Creem Dashboard → Settings → Webhooks 中配置"
echo "   - 访问 http://localhost:4040 查看请求详情"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 启动 ngrok
ngrok http 3000

