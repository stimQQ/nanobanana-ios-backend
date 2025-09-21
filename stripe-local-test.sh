#!/bin/bash

# Stripe CLI 本地测试脚本

echo "📦 安装Stripe CLI (如果还没安装)..."
# macOS
brew install stripe/stripe-cli/stripe

echo "🔑 登录Stripe..."
stripe login

echo "🔄 转发webhook到本地..."
echo "这将给你一个临时的webhook密钥用于本地测试"
stripe listen --forward-to localhost:3000/api/stripe/webhook

# 密钥会显示类似：
# Ready! Your webhook signing secret is whsec_xxxxx
# 将这个密钥添加到.env.local的STRIPE_WEBHOOK_SECRET