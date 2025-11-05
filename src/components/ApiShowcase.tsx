import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Play, CheckCircle, Clock } from "lucide-react";

const ApiShowcase = () => {
  const codeExamples = {
    curl: `curl -X POST "https://aivido.ai/api/videos/generate" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "A serene sunset over calm ocean waves",
    "duration": 8,
    "aspect_ratio": "16:9",
    "quality": "fast"
  }'`,
    python: `import requests

headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}

data = {
    "prompt": "A serene sunset over calm ocean waves",
    "duration": 8,
    "aspect_ratio": "16:9",
    "quality": "fast"
}

response = requests.post(
    "https://aivido.ai/api/videos/generate",
    headers=headers,
    json=data
)

result = response.json()
print(f"Job ID: {result['job_id']}")`,
    javascript: `const response = await fetch('https://aivido.ai/api/videos/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'A serene sunset over calm ocean waves',
    duration: 8,
    aspect_ratio: '16:9',
    quality: 'fast'
  })
});

const result = await response.json();
console.log('Job ID:', result.job_id);`
  };

  const sampleVideos = [
    {
      prompt: "A serene sunset over calm ocean waves",
      duration: "6s",
      model: "Sora2 Fast",
      status: "completed",
      credits: 1.0
    },
    {
      prompt: "Futuristic city with flying cars at night",
      duration: "10s", 
      model: "Sora2 High Fidelity",
      status: "processing",
      credits: 1.8
    },
    {
      prompt: "Close-up of a blooming flower in timelapse",
      duration: "10s",
      model: "Sora2 Fast", 
      status: "completed",
      credits: 1.6
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* API Code Examples */}
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-4">
                <span className="text-primary">
                  Simple REST API
                </span>
              </h2>
              <p className="text-xl text-muted-foreground">
                Integrate Sora2 video generation in minutes with our developer-friendly API。
              </p>
            </div>

            <Card className="bg-secondary/50 border-border">
              <div className="p-6">
                <Tabs defaultValue="curl" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                    <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  </TabsList>
                  
                  {Object.entries(codeExamples).map(([lang, code]) => (
                    <TabsContent key={lang} value={lang}>
                      <div className="relative">
                        <pre className="bg-background/50 rounded-lg p-4 text-sm font-mono overflow-x-auto border border-border">
                          <code className="text-foreground">{code}</code>
                        </pre>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 hover:bg-primary/20"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </Card>

            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <Button variant="gradient">
                <Play className="w-4 h-4 mr-2" />
                Try Live Demo
              </Button>
              <Button variant="outline">
                View Full Documentation
              </Button>
            </div>
          </div>

          {/* Sample Results */}
          <div>
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-4">
                Sample Generations
              </h3>
              <p className="text-muted-foreground">
                See what others are creating with our API platform.
              </p>
            </div>

            <div className="space-y-4">
              {sampleVideos.map((video, index) => (
                <Card key={index} className="p-6 bg-card/50 backdrop-blur-sm border-border">
                  <div className="space-y-4">
                    {/* Video info */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-foreground mb-2">
                          "{video.prompt}"
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{video.duration}</span>
                          <span>•</span>
                          <span>{video.model}</span>
                          <span>•</span>
                          <span>{video.credits} credits</span>
                        </div>
                      </div>
                      
                      <Badge 
                        variant={video.status === 'completed' ? 'default' : 'secondary'}
                        className="ml-4"
                      >
                        {video.status === 'completed' ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <Clock className="w-3 h-3 mr-1" />
                        )}
                        {video.status}
                      </Badge>
                    </div>

                    {/* Mock video preview */}
                    <div className="aspect-video bg-secondary rounded-lg border border-border flex items-center justify-center">
                      {video.status === 'completed' ? (
                        <div className="text-center">
                          <Play className="w-12 h-12 text-primary mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Video Preview</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Generating...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <Card className="p-4 bg-card/30 border-border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">45s</div>
                  <div className="text-sm text-muted-foreground">Avg Generation Time</div>
                </div>
              </Card>
              <Card className="p-4 bg-card/30 border-border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">99.9%</div>
                  <div className="text-sm text-muted-foreground">API Uptime</div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ApiShowcase;
