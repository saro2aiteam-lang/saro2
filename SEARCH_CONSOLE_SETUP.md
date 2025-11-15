# Google & Bing Search Console 设置指南

## 前置准备

确保以下文件已正确配置：
- ✅ `app/sitemap.ts` - 网站地图已配置
- ✅ `public/robots.txt` - 已包含 sitemap 链接
- ✅ `app/layout.tsx` - 已支持验证 meta 标签

## 1. Google Search Console 设置

### 步骤 1: 添加网站
1. 访问 [Google Search Console](https://search.google.com/search-console)
2. 点击"添加属性"
3. 选择"网址前缀"方式，输入：`https://saro2.ai`

### 步骤 2: 验证网站所有权
Google 提供多种验证方式，推荐使用 **HTML 标签验证**：

1. 在验证页面选择"HTML 标签"方法
2. 复制 `content` 属性的值（例如：`abc123def456...`）
3. 在项目根目录的 `.env` 或 `.env.local` 文件中添加：
   ```bash
   GOOGLE_SITE_VERIFICATION=abc123def456...
   ```
4. 重新部署网站
5. 返回 Google Search Console 点击"验证"

### 步骤 3: 提交 Sitemap
1. 验证成功后，进入"索引" > "站点地图"
2. 点击"添加新的站点地图"
3. 输入：`https://saro2.ai/sitemap.xml`
4. 点击"提交"

### 步骤 4: 请求索引（可选）
1. 进入"网址检查"工具
2. 输入首页 URL：`https://saro2.ai`
3. 点击"请求编入索引"

## 2. Bing Webmaster Tools 设置

### 步骤 1: 添加网站
1. 访问 [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. 使用 Microsoft 账号登录
3. 点击"添加网站"
4. 输入：`https://saro2.ai`

### 步骤 2: 验证网站所有权
推荐使用 **Meta 标签验证**：

1. 在验证页面选择"HTML 元标记"方法
2. 复制 `content` 属性的值（例如：`1234567890ABCDEF...`）
3. 在项目根目录的 `.env` 或 `.env.local` 文件中添加：
   ```bash
   BING_VERIFICATION_CODE=1234567890ABCDEF...
   ```
4. 重新部署网站
5. 返回 Bing Webmaster Tools 点击"验证"

### 步骤 3: 提交 Sitemap
1. 验证成功后，进入"站点地图"
2. 点击"提交站点地图"
3. 输入：`https://saro2.ai/sitemap.xml`
4. 点击"提交"

## 3. 环境变量配置

在 `.env.local` 或生产环境变量中添加：

```bash
# Google Search Console 验证码
GOOGLE_SITE_VERIFICATION=your-google-verification-code

# Bing Webmaster Tools 验证码
BING_VERIFICATION_CODE=your-bing-verification-code
```

## 4. 验证配置

部署后，检查以下 URL 是否可访问：
- ✅ `https://saro2.ai/sitemap.xml` - 应返回 XML 格式的网站地图
- ✅ `https://saro2.ai/robots.txt` - 应包含 sitemap 链接

检查 HTML 源码中的验证标签：
- Google: `<meta name="google-site-verification" content="...">`
- Bing: `<meta name="msvalidate.01" content="...">`

## 5. 后续维护

### 定期检查
- 每周检查 Search Console 中的索引状态
- 关注"覆盖率"报告，修复任何错误
- 查看"性能"报告，了解搜索表现

### 更新 Sitemap
当添加新页面时，更新 `app/sitemap.ts` 文件，添加新 URL。

### 提交新内容
对于重要新页面，可以使用"网址检查"工具手动请求索引。

## 常见问题

**Q: 验证失败怎么办？**
- 确保环境变量已正确设置
- 确保网站已重新部署
- 清除浏览器缓存后重试
- 检查 meta 标签是否出现在页面源码中

**Q: Sitemap 提交后多久生效？**
- Google: 通常几小时到几天
- Bing: 通常几天到一周

**Q: 如何加快索引速度？**
- 确保网站内容质量高
- 定期更新内容
- 在社交媒体分享链接
- 使用"请求编入索引"功能

## 有用的链接

- [Google Search Console](https://search.google.com/search-console)
- [Bing Webmaster Tools](https://www.bing.com/webmasters)
- [Google SEO 指南](https://developers.google.com/search/docs/beginner/seo-starter-guide)
- [Bing SEO 指南](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a)








