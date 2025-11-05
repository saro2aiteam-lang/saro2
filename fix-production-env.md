# 生产环境修复指南

## 🔧 Vercel 环境变量配置

在 Vercel Dashboard 中添加以下环境变量：

### 必需的环境变量
```
KIE_API_BASE_URL=https://api.kie.ai
KIE_API_KEY=your_kie_api_key
```

## 📋 操作步骤

1. **登录 Vercel Dashboard**
   - 访问：https://vercel.com/dashboard
   - 选择你的项目

2. **进入环境变量设置**
   - 点击项目 → Settings → Environment Variables

3. **添加环境变量**
   - 点击 "Add New"
   - 添加上述环境变量
   - 确保选择 "Production" 环境

4. **重新部署**
   - 点击 "Deployments" 标签
   - 点击 "Redeploy" 按钮
   - 或者推送代码触发自动部署

## 🔍 验证修复

部署完成后，检查：

1. **服务器日志**
   - 在 Vercel Dashboard → Functions 中查看日志
   - 应该看到 KIE API 调用成功的信息

2. **API 测试**
   - 访问：`https://your-domain.com/api/videos/status/{jobId}`
   - 应该返回正确的状态和视频URL

## 🚨 如果还有问题

检查以下可能的原因：

1. **API 密钥权限**
   - 确认 KIE API 密钥有正确的权限
   - 检查密钥是否过期

2. **网络访问**
   - 确认 Vercel 可以访问 `https://api.kie.ai`
   - 检查是否有防火墙限制

3. **API 限制**
   - 检查是否达到 KIE API 的调用限制
   - 查看 KIE Dashboard 的使用情况

## 📞 联系支持

如果问题持续存在，请提供：
- Vercel 函数日志
- KIE API 调用响应
- 具体的错误信息
