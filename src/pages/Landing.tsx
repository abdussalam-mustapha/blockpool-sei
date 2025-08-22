import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  Activity, 
  BarChart3, 
  Bot, 
  ChevronRight, 
  Eye, 
  Globe, 
  LineChart, 
  Lock, 
  Rocket, 
  Shield, 
  Sparkles, 
  TrendingUp,
  Zap,
  Github,
  MessageCircle,
  ExternalLink
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Activity className="h-6 w-6" />,
      title: "Real-Time Monitoring",
      description: "Live blockchain data streaming with instant updates on transactions, balances, and network activity."
    },
    {
      icon: <Bot className="h-6 w-6" />,
      title: "AI-Powered Automation",
      description: "Advanced AI assistant and agents providing intelligent insights, risk analysis, and wallet behavior patterns."
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Security Analysis",
      description: "Comprehensive risk scoring and security assessments for wallets and smart contracts."
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Advanced Charts",
      description: "Interactive visualizations and analytics dashboards for comprehensive blockchain insights."
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast",
      description: "Optimized performance with sub-second response times for all blockchain queries."
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Multi-Network",
      description: "Support for SEI mainnet, testnet, and devnet with seamless network switching."
    }
  ];

  const stats = [
    { label: "Transactions Analyzed", value: "2.4M+", icon: <TrendingUp className="h-5 w-5" /> },
    { label: "Wallets Monitored", value: "150K+", icon: <Eye className="h-5 w-5" /> },
    { label: "Risk Assessments", value: "500K+", icon: <Shield className="h-5 w-5" /> },
    { label: "AI Insights Generated", value: "1M+", icon: <Sparkles className="h-5 w-5" /> }
  ];

  return (
    <div className="min-h-screen bg-black text-foreground">
      {/* Header */}
      <header className="glass-card border-b border-green-500/30 sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-3">
              <img 
                src="/blockpool-logo.svg" 
                alt="Blockpool Logo" 
                className="w-8 h-8 md:w-10 md:h-10"
              />
              <div>
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">
                  Blockpool
                </h1>
                <p className="text-xs md:text-sm text-green-400/70 hidden sm:block">Advanced Blockchain Automation</p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/dashboard')}
              className="bg-green-500 hover:bg-green-600 text-black px-3 md:px-6 py-2 glow-green transition-all duration-300 text-sm md:text-base"
            >
              <span className="hidden sm:inline">Launch Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
              <ChevronRight className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="text-center max-w-4xl mx-auto">
          <Badge className="mb-4 md:mb-6 px-3 md:px-4 py-2 bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30 text-sm">
            <Rocket className="mr-2 h-3 w-3 md:h-4 md:w-4" />
            Powered by Sei-mcp-kit
          </Badge>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-white via-green-400 to-green-500 bg-clip-text text-transparent leading-tight">
            <span className="block">Next-Gen Blockchain</span>
            <span className="block text-green-400">Automation Platform</span>
          </h1>
          
          <p className="text-base md:text-xl text-gray-300 mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed px-4">
            Unlock the power of SEI blockchain with real-time monitoring, AI-driven insights, 
            comprehensive analytics snd Automation. Make informed decisions with live data at your fingertips.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
            <Button 
              size="lg" 
              onClick={() => navigate('/dashboard')}
              className="bg-green-500 hover:bg-green-600 text-black px-6 md:px-8 py-4 md:py-6 text-base md:text-lg glow-green transition-all duration-300 w-full sm:w-auto"
            >
              <Activity className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              Start Analyzing
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="px-6 md:px-8 py-4 md:py-6 text-base md:text-lg border-green-500/50 text-green-400 hover:bg-green-500/10 hover:border-green-500 w-full sm:w-auto"
            >
              <LineChart className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center glass-card hover:glow-green transition-all duration-300">
              <CardContent className="pt-4 md:pt-6 pb-4 md:pb-6">
                <div className="flex justify-center mb-2 md:mb-3 text-green-400">
                  {stat.icon}
                </div>
                <div className="text-xl md:text-3xl font-bold mb-1 text-white">{stat.value}</div>
                <div className="text-xs md:text-sm text-gray-400 px-1">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 md:px-6 py-16 md:py-20">
        <div className="text-center mb-12 md:mb-16">
          <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/30 text-sm">
            <Sparkles className="mr-2 h-3 w-3 md:h-4 md:w-4" />
            Powerful Features
          </Badge>
          <h2 className="text-2xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-green-400 bg-clip-text text-transparent px-4">
            Everything you need for blockchain analytics
          </h2>
          <p className="text-base md:text-xl text-gray-300 max-w-2xl mx-auto px-4">
            Comprehensive tools and insights to monitor, analyze, and understand blockchain activity like never before.
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="glass-card hover:glow-green transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-3 md:mb-4 text-green-400 group-hover:bg-green-500/30 transition-colors">
                  {feature.icon}
                </div>
                <CardTitle className="text-lg md:text-xl text-white">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm md:text-base leading-relaxed text-gray-300">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <Card className="glass-card bg-gradient-to-r from-green-500/10 via-green-500/5 to-green-500/10 border-green-500/30 glow-green">
          <CardContent className="text-center py-16">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-white to-green-400 bg-clip-text text-transparent">
                Ready to dive into SEI blockchain analytics?
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Join thousands of users who trust Blockpool for their blockchain monitoring and analysis needs.
              </p>
              <Button 
                size="lg" 
                onClick={() => navigate('/dashboard')}
                className="bg-green-500 hover:bg-green-600 text-black px-10 py-6 text-lg glow-green transition-all duration-300"
              >
                <Activity className="mr-2 h-5 w-5" />
                Launch Dashboard Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-green-500/30 glass-card">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img 
                src="/blockpool-logo.svg" 
                alt="Blockpool Logo" 
                className="w-8 h-8"
              />
              <div>
                <div className="font-semibold text-white">Blockpool</div>
                <div className="text-sm text-green-400/70">Advanced Blockchain Analytics</div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
              <div className="flex items-center space-x-6 text-sm text-gray-400">
                <span className="flex items-center hover:text-green-400 transition-colors">
                  <Lock className="mr-1 h-4 w-4" />
                  Secure & Private
                </span>
                <span className="flex items-center hover:text-green-400 transition-colors">
                  <Zap className="mr-1 h-4 w-4" />
                  Real-Time Data
                </span>
                <span className="flex items-center hover:text-green-400 transition-colors">
                  <Shield className="mr-1 h-4 w-4" />
                  Enterprise Grade
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <a 
                  href="https://github.com/abdussalam-mustapha/blockpool-sei" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-green-400 transition-colors"
                  title="GitHub"
                >
                  <Github className="h-5 w-5" />
                </a>
                <a 
                  href="https://x.com/blockpoolHQ" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-green-400 transition-colors"
                  title="Twitter/X"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a 
                  href="https://t.me/+xp5fkmRwMYplOTM0" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-green-400 transition-colors"
                  title="Telegram"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
                <a 
                  href="https://blockpool-sei.vercel.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-green-400 transition-colors"
                  title="Live App"
                >
                  <ExternalLink className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
