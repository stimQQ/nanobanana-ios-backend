# API Testing Guide

## 🚀 Quick Test Methods

### 1. Dashboard (Visual Testing)
访问部署后的仪表板，实时查看API状态：
```
https://your-app.vercel.app/dashboard
```

仪表板显示：
- ✅ 系统整体健康状态
- ✅ 各服务运行状态（Supabase、API Core、Apple Auth）
- ✅ 响应时间监控
- ✅ 内存使用情况
- ✅ 所有API端点列表

### 2. 命令行测试

#### 基础健康检查
```bash
# 健康检查
curl https://your-app.vercel.app/api/health

# 详细状态
curl https://your-app.vercel.app/api/status | python3 -m json.tool

# 运行完整测试套件
curl https://your-app.vercel.app/api/test | python3 -m json.tool
```

#### 使用测试脚本
```bash
cd nextjs-backend/scripts

# 测试生产环境
./test-production.sh https://your-app.vercel.app

# 测试本地环境
./test-api.sh
```

### 3. Postman测试

1. **导入集合**：
   - 打开Postman
   - 点击 Import → 选择 `postman-collection.json`

2. **设置环境变量**：
   - 创建新环境
   - 设置 `baseUrl`: `https://your-app.vercel.app`
   - 设置 `authToken`: 从登录响应获取

3. **运行测试**：
   - 选择 "NanoBanana API" 集合
   - 点击 "Run Collection"
   - 查看测试结果

## 📊 API端点状态码说明

| 端点 | 正常状态码 | 说明 |
|------|------------|------|
| `/api/health` | 200 | 基础健康检查 |
| `/api/status` | 200/206/503 | 200=健康, 206=降级, 503=不健康 |
| `/api/test` | 200 | 测试套件通过 |
| `/api/auth/*` | 200/401 | 401=认证失败 |
| `/api/user/*` | 200/401 | 需要认证token |
| `/api/generate/image` | 200/402/500 | 402=积分不足 |

## 🔍 监控要点

### 部署后立即检查

1. **访问Dashboard**
   ```
   https://your-app.vercel.app/dashboard
   ```
   应该看到所有服务显示 "OPERATIONAL"

2. **检查环境变量**
   ```bash
   curl https://your-app.vercel.app/api/test | grep "Environment Variables"
   ```
   确保显示 "status: passed"

3. **数据库连接**
   ```bash
   curl https://your-app.vercel.app/api/status | grep "Supabase"
   ```
   确保显示 "operational"

### 常见问题诊断

#### ❌ Supabase连接失败
- 检查 `SUPABASE_SERVICE_KEY` 是否正确
- 检查 Supabase 项目是否在线
- 验证数据库表是否创建

#### ❌ API Core连接失败
- 检查 `APICORE_API_KEY` 是否有效
- 验证API配额是否充足

#### ❌ Apple Auth配置错误
- 确认所有Apple相关环境变量已设置
- 检查私钥格式是否正确

## 📱 iOS App测试

### 测试真实API调用

1. **获取JWT Token**：
```swift
// 使用真实Apple ID登录获取token
let token = loginResponse.token
```

2. **测试图片生成**：
```swift
// 文生图
POST /api/generate/image
Headers: Authorization: Bearer <token>
Body: {
    "prompt": "test image",
    "mode": "text-to-image"
}
```

3. **检查积分扣除**：
```swift
// 生成前后检查积分
GET /api/user/credits
```

## 🛠️ Vercel日志查看

1. 登录 [Vercel Dashboard](https://vercel.com)
2. 选择你的项目
3. 点击 "Functions" 标签
4. 查看实时日志和错误

## 📈 性能基准

正常响应时间：
- Health Check: < 100ms
- Status Check: < 500ms
- Image Generation: < 5000ms
- Database Query: < 200ms

## 🔄 持续监控

### 设置自动监控

1. **使用 UptimeRobot**：
   - 添加监控URL: `https://your-app.vercel.app/api/health`
   - 设置5分钟检查间隔

2. **使用 GitHub Actions**：
   ```yaml
   - name: Test Production API
     run: |
       curl -f https://your-app.vercel.app/api/health || exit 1
   ```

3. **Vercel Analytics**：
   - 在Vercel Dashboard启用Analytics
   - 监控API调用次数和错误率

## 💡 测试技巧

1. **快速健康检查**：
   ```bash
   curl -I https://your-app.vercel.app/api/health
   ```

2. **查看所有测试结果**：
   ```bash
   curl -s https://your-app.vercel.app/api/test | jq '.tests[] | {name, status, error}'
   ```

3. **监控响应时间**：
   ```bash
   curl -w "@curl-format.txt" -o /dev/null -s https://your-app.vercel.app/api/health
   ```

## 📞 获取帮助

如果API测试失败：
1. 查看 Dashboard 错误信息
2. 检查 Vercel Functions 日志
3. 运行 `/api/test` 获取详细诊断
4. 查看 GitHub Issues