# Vercel Environment Variables Configuration

## Required Environment Variables for Deployment

Add these environment variables in your Vercel project settings:

### 1. Supabase Configuration (必需)
```
NEXT_PUBLIC_SUPABASE_URL=https://xwwjacrqhnpqrmcvdhly.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3d2phY3JxaG5wcXJtY3ZkaGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5OTc4MTEsImV4cCI6MjA3MzU3MzgxMX0.dPXNy3ndxA3jbt0so1dh7whHzUtxEbqissNl8v6yYGA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3d2phY3JxaG5wcXJtY3ZkaGx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk5NzgxMSwiZXhwIjoyMDczNTczODExfQ.pJfvKa7Z81Zlxj187i99ZTUh1hvsFAAw385tfBdT8p8
```

### 2. Google Gemini AI Configuration (必需 - 用于图像生成)
```
GEMINI_API_KEY=AIzaSyDvjN4w54QMfvUF3TzMmpP6_H3pR-ngxhE
```

### 3. JWT Secret (必需 - 用于会话管理)
```
JWT_SECRET=MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgXC+wLo/G08kA6UULo4oimsw0Lvcfgoq13EuYrOyyDTygCgYIKoZIzj0DAQehRANCAAQNdHEJHwX/MMsUh3qSFtuc/W1NnmZYyF5k9z4W7XQ/AQnBmpd9NXdkk5dEVNbN80leJR+1fxU/95rGFV/zf/hQ
```

### 4. Apple Authentication (如果需要Apple登录)
```
APPLE_CLIENT_ID=com.sparksinc.nanobanana
APPLE_TEAM_ID=8224WGCM69
APPLE_KEY_ID=DCZL7DW8XR
APPLE_PRIVATE_KEY=MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgXC+wLo/G08kA6UULo4oimsw0Lvcfgoq13EuYrOyyDTygCgYIKoZIzj0DAQehRANCAAQNdHEJHwX/MMsUh3qSFtuc/W1NnmZYyF5k9z4W7XQ/AQnBmpd9NXdkk5dEVNbN80leJR+1fxU/95rGFV/zf/hQ
```

### 5. Google OAuth (可选 - 如果需要Google登录)
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=85523758539-mmka868bo5486mpmssjmlsm1o3l061q1.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### 6. Environment Configuration
```
NODE_ENV=production
```

### 7. APICore Configuration (如果使用其他AI服务)
```
APICORE_API_KEY=sk-uZ37YcpL8Cil4MBqJErYNpzgrIbM0W77r33I3mFyce1kjGZI
APICORE_BASE_URL=https://apicore.ai
```

## 设置步骤

1. 登录 Vercel Dashboard
2. 进入你的项目设置 (Settings)
3. 点击 "Environment Variables" 选项卡
4. 逐个添加上述环境变量
5. 确保选择正确的环境 (Production/Preview/Development)
6. 保存并重新部署

## 注意事项

- `NEXT_PUBLIC_` 前缀的变量会暴露给客户端，请确保不包含敏感信息
- 不带 `NEXT_PUBLIC_` 前缀的变量只在服务器端可用
- 部署后可以通过 Vercel Dashboard 查看和修改环境变量
- 修改环境变量后需要重新部署才能生效

## 验证部署

部署成功后，可以访问以下端点验证：
- `/api/health` - 检查服务健康状态
- `/api/status` - 检查环境变量配置状态