import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Code, Video, Sparkles, Globe, Clock } from "lucide-react";

const SeoSection = () => {
  return (
    <section className="py-24 bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main SEO Content */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 leading-tight">
            The Best <span className="text-primary">Sora2 Platform</span> for AI Video Generation in 2025
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed mb-8">
            Sora2 Studio 提供 <strong>原生音频的 AI 视频生成</strong>，支持文字与图片双模式输入，
            通过安全的 REST API 或可视化控制台在 45 秒内交付高清成片。无需复杂配置，即可把 Sora2 接入到任何产品或创作流程。
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <Card className="p-6 bg-card/50 backdrop-blur-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Sora2 Fast 渲染</h3>
              </div>
                <p className="text-muted-foreground text-sm">
                  采用优化后的 <strong>Sora2 Fast</strong> 编排流程，平均 30-45 秒即可输出及 8-16 秒、1080p 的视频，并同步生成环境音与对白。
                </p>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Code className="w-5 h-5 text-accent-foreground" />
                </div>
                <h3 className="text-lg font-semibold">Developer-First API</h3>
              </div>
                <p className="text-muted-foreground text-sm">
                  简洁的 <strong>REST API</strong> 与 webhooks，配套 TypeScript / Python SDK、Postman collection，轻松接入现有流水线与无代码工具。
                </p>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Globe className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold">全球分发与存储</h3>
              </div>
                <p className="text-muted-foreground text-sm">
                  成片自动上传至全球 CDN，提供签名 URL 与生命周期管理，满足高并发播放与企业合规需求。
                </p>
            </Card>
          </div>
        </div>

        {/* Use Cases & Keywords */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl font-bold mb-6">
              为什么团队选择 <span className="text-primary">Sora2</span>？
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center mt-1">
                  <Video className="w-3 h-3 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">面向开发者与工作室</h4>
                  <p className="text-sm text-muted-foreground">
                    提供直接的 Sora2 API 访问，无需额外的租户即可开通，多环境密钥、组织权限与请求日志一应俱全。
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center mt-1">
                  <Sparkles className="w-3 h-3 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">原生音频 + 多比例输出</h4>
                  <p className="text-sm text-muted-foreground">
                    支持文字/图片驱动生成，输出 16:9、9:16、1:1 等多种比例，并自动生成对白与环境音效，满足社媒与广告投放需求。
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center mt-1">
                  <Clock className="w-3 h-3 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">按使用量计费</h4>
                  <p className="text-sm text-muted-foreground">
                    采用透明的积分体系，免费额度即可体验，升级套餐后可享批量优惠与 SLA 保障。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold mb-4">Perfect for:</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  "产品团队",
                  "影视动画工作室", 
                  "营销与广告代理商",
                  "短视频与直播平台",
                  "教育培训企业",
                  "SaaS 创业公司",
                  "游戏与虚拟世界",
                  "AR/VR 创作者"
                ].map((useCase) => (
                  <Badge key={useCase} variant="secondary" className="text-xs">
                    {useCase}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Trending Keywords:</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  "sora2",
                  "sora 2 ai",
                  "sora video generator",
                  "sora2 text to video",
                  "sora2 api",
                  "ai video generator",
                  "text to video",
                  "image to video"
                ].map((keyword) => (
                  <Badge key={keyword} variant="outline" className="text-xs border-primary/30">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="bg-card/30 rounded-lg p-4 border border-primary/20">
              <h4 className="font-semibold mb-2 text-primary">🚀 2025 行业领先</h4>
              <p className="text-sm text-muted-foreground">
                被评为 <strong>最具创意的 Sora2 视频平台</strong>。超过 2,500 家企业与创作者已经在使用 Sora2 Studio 批量生成内容。
              </p>
            </div>
          </div>
        </div>

        {/* Long-tail SEO Content */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-muted/30 rounded-lg p-8">
            <h3 className="text-xl font-bold mb-4 text-center">
              如何使用 Sora2 生成 AI 视频
            </h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-muted-foreground">
              <div>
                <h4 className="font-semibold text-foreground mb-2">快速接入 Sora2 API</h4>
                <p className="mb-3">
                  使用我们封装的 Sora2 API，仅需一个 POST 请求即可提交文本或图片提示词，后端自动完成渲染、上传与结果轮询。
                </p>
                <p>
                  无需自行处理复杂的鉴权、队列或存储，我们提供鉴权、扩缩容、CDN、Webhook 全流程托管，让你把精力放在产品体验上。
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Sora2 Fast vs Sora2 High Fidelity</h4>
                <p className="mb-3">
                  选择 <strong>Sora2 Fast</strong> 获取最快的生成速度，适合社媒与批量内容；
                  而 <strong>Sora2 High Fidelity</strong> 专注于电影级细节和物理一致性，适合广告、品牌影片与长线项目。
                </p>
                <p>
                  两种模型都支持 16:9、9:16、1:1 等主流比例，并可输出 1080p 原生音频，完美适配社媒、营销、教育等多种场景。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SeoSection;
