import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Send, MessageSquare, CircleHelp, Linkedin, Instagram } from "lucide-react";
import { useTranslation } from "react-i18next";
import Footer from "@/components/Footer";

const Contact = () => {
  const { t } = useTranslation();

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12 animate-fade-in">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg">
                  <CircleHelp className="w-12 h-12 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 font-display">
                {t('contact.title')} <span className="text-primary">{t('contact.titleHighlight') || 'Connect'}</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('contact.subtitle')}
              </p>
            </div>

            {/* Contact Cards Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Email Card */}
              <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-elevated group">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{t('contact.emailCard.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {t('contact.emailCard.description')}
                  </p>
                  <a
                    href="mailto:contact@allensamuel.me"
                    className="group/link inline-flex items-center gap-2 text-primary font-medium hover:underline"
                  >
                    <Send className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                    {t('contact.emailCard.cta')}
                  </a>
                </CardContent>
              </Card>

              {/* Feedback Card */}
              <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-elevated group">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{t('contact.feedbackCard.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {t('contact.feedbackCard.description')}
                  </p>
                  <Button
                    variant="outline"
                    className="group/btn"
                    onClick={() => window.location.href = 'mailto:contact@allensamuel.me?subject=Feedback for What to Prompt'}
                  >
                    {t('contact.feedbackCard.cta')}
                    <Send className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Social Media Card */}
            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-elevated mb-8">
              <CardHeader>
                <CardTitle className="text-xl">{t('contact.socialCard.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {t('contact.socialCard.description')}
                </p>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 group"
                    onClick={() => window.open('https://www.linkedin.com/company/whattoprompt/', '_blank')}
                  >
                    <Linkedin className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    LinkedIn
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 group"
                    onClick={() => window.open('https://www.instagram.com/whattoprompt/', '_blank')}
                  >
                    <Instagram className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    Instagram
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Additional Info Card */}
            <Card className="border-2 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="pt-6 pb-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">{t('contact.moreInfo.title')}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t('contact.moreInfo.description')}
                  </p>
                  <Button
                    variant="default"
                    size="lg"
                    className="shadow-lg hover:shadow-xl transition-all hover:scale-105"
                    onClick={() => window.open('https://allensamuel.me/', '_blank')}
                  >
                    {t('contact.moreInfo.cta')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Contact;
