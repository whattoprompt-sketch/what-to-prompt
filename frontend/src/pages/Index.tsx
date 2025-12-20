import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Target, Zap, TrendingUp, ArrowRight, Wand2, Brain, Rocket, CircleHelp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import Footer from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const handleScroll = () => {
      const elements = document.querySelectorAll('.scroll-animate');
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight - 100;
        if (isVisible) {
          el.classList.add('animate-fade-in');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: Wand2,
      title: "Interactive Wizard",
      description: "Answer 5 simple questions in 2 minutes",
      outcome: "Get professional-grade prompts while learning prompt engineering",
    },
    {
      icon: Brain,
      title: "Learn as You Build",
      description: "See your prompt structure in real-time",
      outcome: "Understand what makes prompts work so you can improve them yourself",
    },
    {
      icon: Rocket,
      title: "Instant Results",
      description: "Copy and paste directly into any AI tool",
      outcome: "Start getting better AI responses in seconds, not hours",
    },
  ];

  const testimonials = [
    {
      text: "Improved my ChatGPT results by 10x. I finally understand how to talk to AI!",
      author: "Sarah Chen",
      role: "Content Marketer",
      rating: 5,
    },
    {
      text: "Used to spend 20 minutes crafting prompts. Now it takes 2 minutes and works better.",
      author: "Marcus Rodriguez",
      role: "Product Manager",
    },
    {
      text: "Game-changer for my freelance writing. Clients love the quality improvement.",
      author: "Jessica Park",
      role: "Freelance Writer",
    },
  ];

  const examplePrompts = [
    {
      before: "Write a blog post",
      after: "You are an expert content strategist. Write a 1200-word SEO-optimized blog post about sustainable living for environmentally-conscious millennials. Use a friendly, inspiring tone...",
      improvement: "3x more detailed responses",
    },
    {
      before: "Help me with marketing",
      after: "You are a senior marketing consultant. Analyze this product launch strategy and provide 5 specific improvements with expected ROI. Focus on digital channels...",
      improvement: "Actionable insights",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24 lg:py-32">
        {/* Hero Section */}
        <div className="text-center mb-16 sm:mb-20 animate-fade-in relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-6 sm:mb-8 leading-[1.1] font-display tracking-tight text-balance">
            {t('hero.title')}{" "}
            <span className="text-primary bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              {t('hero.titleHighlight')}
            </span>
            {" "}{t('hero.titleEnd')}
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-10 sm:mb-12 max-w-3xl mx-auto font-medium leading-relaxed px-4 text-balance">
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
            <Button
              size="lg"
              onClick={() => navigate("/wizard")}
              className="w-full sm:w-auto text-lg sm:text-xl px-8 sm:px-12 py-7 sm:py-8 h-auto shadow-[0_20px_50px_-12px_rgba(59,130,246,0.3)] hover:shadow-primary/40 transition-all hover:scale-105 group font-bold rounded-2xl"
            >
              <Sparkles className="w-5 h-5 sm:w-6 h-6 mr-2 group-hover:rotate-12 transition-transform" />
              {t('hero.cta')}
              <ArrowRight className="w-5 h-5 sm:w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mb-16 sm:mb-20 max-w-6xl mx-auto px-2 scroll-animate">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 font-display px-2">{t('howItWorks.title')}</h2>
            <p className="text-base sm:text-lg text-muted-foreground px-4">
              {t('howItWorks.subtitle')}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const stepKey = `step${index + 1}` as 'step1' | 'step2' | 'step3';
              return (
                <Card
                  key={index}
                  className="border-2 hover:border-primary/50 transition-all duration-500 hover:shadow-elevated hover:-translate-y-2 group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500" />
                  <CardContent className="pt-8 pb-8 relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <Icon className="w-7 h-7 text-primary" />
                      </div>
                      <span className="text-4xl font-bold text-primary/20">0{index + 1}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3 font-display">{t(`howItWorks.${stepKey}.title`)}</h3>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      {t(`howItWorks.${stepKey}.description`)}
                    </p>
                    <div className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm font-medium text-foreground leading-relaxed">
                        {t(`howItWorks.${stepKey}.outcome`)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Example Prompts */}
        <div id="examples" className="mb-16 sm:mb-20 max-w-6xl mx-auto px-2 scroll-animate">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 font-display px-2">{t('examples.title')}</h2>
            <p className="text-base sm:text-lg text-muted-foreground px-4">
              {t('examples.subtitle')}
            </p>
          </div>
          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {examplePrompts.map((example, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-elevated group overflow-hidden">
                <CardContent className="pt-6 pb-6">
                  <div className="space-y-5">
                    <div>
                      <div className="text-xs font-bold text-destructive mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center">❌</span>
                        Before (Generic)
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground italic border border-muted">
                        "{example.before}"
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-primary mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">✓</span>
                        After (Optimized)
                      </div>
                      <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 rounded-lg text-sm border-2 border-primary/30 group-hover:border-primary/50 transition-colors">
                        {example.after}
                      </div>
                      <Badge variant="secondary" className="mt-3 px-3 py-1">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {example.improvement}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>


      </div>

      <Footer />
    </div>
  );
};

export default Index;
