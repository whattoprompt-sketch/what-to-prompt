import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Target, BookOpen, Lightbulb, ArrowRight, ArrowLeft, CheckCircle2, SkipForward } from "lucide-react";
import PromptAnatomy from "@/components/PromptAnatomy";
import ExampleButton from "@/components/ExampleButton";
import TooltipModal from "@/components/TooltipModal";

interface PromptData {
  task: string;
  context: string;
  aiModel: string;
  tone: string;
  requirements: string;
  role: string;
}

const Wizard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [promptData, setPromptData] = useState<PromptData>({
    task: "",
    context: "",
    aiModel: "",
    tone: "",
    requirements: "",
    role: "",
  });

  const totalSteps = 6;

  // Calculate progress accounting for skipped tone step
  const calculateProgress = () => {
    if (currentStep <= 4) {
      return (currentStep / totalSteps) * 100;
    }
    // If tone was skipped (empty), show adjusted progress
    if (!promptData.tone && currentStep > 4) {
      return (currentStep / totalSteps) * 100;
    }
    return (currentStep / totalSteps) * 100;
  };

  const progress = calculateProgress();

  const steps = [
    {
      id: 1,
      icon: Target,
      title: t('wizard.step1.title'),
      subtitle: t('wizard.step1.subtitle'),
      field: "task",
      placeholder: t('wizard.step1.placeholder'),
      type: "textarea",
      learnMore: {
        title: t('wizard.step1.learnMoreTitle'),
        description: t('wizard.step1.learnMoreDesc'),
        examples: t('wizard.step1.examples', { returnObjects: true }) as string[],
      },
      learnMoreTrigger: t('wizard.step1.learnMoreTitle'),
      examples: t('wizard.step1.examples', { returnObjects: true }) as string[],
    },
    {
      id: 2,
      icon: BookOpen,
      title: t('wizard.step2.title'),
      subtitle: t('wizard.step2.subtitle'),
      field: "context",
      placeholder: t('wizard.step2.placeholder'),
      type: "textarea",
      learnMore: {
        title: t('wizard.step2.learnMoreTitle'),
        description: t('wizard.step2.learnMoreDesc'),
        examples: t('wizard.step2.examples', { returnObjects: true }) as string[],
      },
      learnMoreTrigger: t('wizard.step2.learnMoreTitle'),
      examples: t('wizard.step2.examples', { returnObjects: true }) as string[],
    },
    {
      id: 3,
      icon: Sparkles,
      title: t('wizard.step3.title'),
      subtitle: t('wizard.step3.subtitle'),
      field: "aiModel",
      type: "select",
      options: ["ChatGPT", "Claude", "Gemini", "Mistral", "Nous", "DeepSeek"],
      learnMore: {
        title: t('wizard.step3.learnMoreTitle'),
        description: t('wizard.step3.learnMoreDesc'),
        examples: [
          "ChatGPT — best for creative writing and conversational tasks",
          "Claude — ideal for long-form content and nuanced reasoning",
          "Gemini — strong with multimodal tasks and data analysis",
        ],
      },
      learnMoreTrigger: t('wizard.step3.learnMoreTitle'),
    },
    {
      id: 4,
      icon: Lightbulb,
      title: t('wizard.step4.title'),
      subtitle: t('wizard.step4.subtitle'),
      field: "tone",
      placeholder: t('wizard.step4.placeholder'),
      type: "input",
      optional: true,
      learnMore: {
        title: t('wizard.step4.learnMoreTitle'),
        description: t('wizard.step4.learnMoreDesc'),
        examples: t('wizard.step4.examples', { returnObjects: true }) as string[],
      },
      learnMoreTrigger: t('wizard.step4.learnMoreTitle'),
      examples: t('wizard.step4.examples', { returnObjects: true }) as string[],
    },
    {
      id: 5,
      icon: CheckCircle2,
      title: t('wizard.step5.title'),
      subtitle: t('wizard.step5.subtitle'),
      field: "requirements",
      placeholder: t('wizard.step5.placeholder'),
      type: "input",
      learnMore: {
        title: t('wizard.step5.learnMoreTitle'),
        description: t('wizard.step5.learnMoreDesc'),
        examples: t('wizard.step5.examples', { returnObjects: true }) as string[],
      },
      learnMoreTrigger: t('wizard.step5.learnMoreTitle'),
      examples: t('wizard.step5.examples', { returnObjects: true }) as string[],
    },
    {
      id: 6,
      icon: Target,
      title: t('wizard.step6.title'),
      subtitle: t('wizard.step6.subtitle'),
      field: "role",
      placeholder: t('wizard.step6.placeholder'),
      type: "input",
      learnMore: {
        title: t('wizard.step6.learnMoreTitle'),
        description: t('wizard.step6.learnMoreDesc'),
        examples: t('wizard.step6.examples', { returnObjects: true }) as string[],
      },
      learnMoreTrigger: t('wizard.step6.learnMoreTitle'),
      examples: t('wizard.step6.examples', { returnObjects: true }) as string[],
    },
  ];

  const currentStepData = steps[currentStep - 1];
  const Icon = currentStepData.icon;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate("/result", { state: { promptData } });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const updateField = (value: string) => {
    setPromptData({
      ...promptData,
      [currentStepData.field]: value,
    });
  };

  const fillExample = (example: string) => {
    updateField(example);
  };

  const isStepValid = () => {
    // Tone step (step 4) is optional
    if (currentStep === 4) return true;
    const value = promptData[currentStepData.field as keyof PromptData];
    return value && value.trim().length > 0;
  };

  const isOptionalStep = 'optional' in currentStepData && currentStepData.optional;

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 sm:py-10">
          <div className="grid lg:grid-cols-1 xl:grid-cols-[1fr,400px] gap-8 max-w-7xl mx-auto">
            {/* Main Form */}
            <div className="space-y-6 sm:space-y-8" role="form" aria-label={t('wizard.progress')}>
              {/* Progress */}
              <div className="space-y-3 px-1 sm:px-0">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">{t('wizard.progress')}</span>
                    <div className="flex items-center gap-2 text-primary font-bold text-lg sm:text-xl">
                      <Sparkles className="w-5 h-5" />
                      <span aria-live="polite">{Math.round(progress)}% {t('wizard.done')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground font-medium">
                    <CheckCircle2 className="w-4 h-4 text-primary" aria-hidden="true" />
                    {t('wizard.stepOf', { current: currentStep, total: totalSteps })}
                  </div>
                </div>
                <Progress value={progress} className="h-3 sm:h-4 bg-muted rounded-full overflow-hidden shadow-inner" aria-label={`Progress: ${Math.round(progress)}%`} />
              </div>

              {/* Question Card */}
              <Card className="border-2 shadow-elevated overflow-hidden rounded-2xl sm:rounded-3xl">
                <CardContent className="p-5 sm:p-8 md:p-10">
                  <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 mb-8">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 animate-scale-in shadow-lg border border-primary/10" aria-hidden="true">
                      <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                        {currentStepData.title}
                      </h2>
                      <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                        {currentStepData.subtitle}{" "}
                        {currentStepData.learnMore && (
                          <TooltipModal
                            title={currentStepData.learnMore.title}
                            description={currentStepData.learnMore.description}
                            examples={currentStepData.learnMore.examples}
                            triggerText={currentStepData.learnMoreTrigger}
                          />
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Input Field */}
                  <div className="space-y-3">
                    {currentStepData.type === "textarea" && (
                      <div className="relative">
                        <Textarea
                          placeholder={currentStepData.placeholder}
                          value={promptData[currentStepData.field as keyof PromptData]}
                          onChange={(e) => updateField(e.target.value)}
                          className="min-h-[140px] text-base resize-none border-2 focus:border-primary pr-20"
                          autoFocus
                          aria-label={currentStepData.title}
                          aria-describedby={`step-${currentStep}-hint`}
                        />
                        <div className="absolute bottom-3 right-3 flex gap-2" aria-hidden="true">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-primary" />
                          </div>
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Target className="w-4 h-4 text-primary" />
                          </div>
                        </div>
                      </div>
                    )}

                    {currentStepData.type === "input" && (
                      <Input
                        placeholder={currentStepData.placeholder}
                        value={promptData[currentStepData.field as keyof PromptData]}
                        onChange={(e) => updateField(e.target.value)}
                        className="text-base h-12 border-2 focus:border-primary"
                        autoFocus
                        aria-label={currentStepData.title}
                        aria-describedby={`step-${currentStep}-hint`}
                      />
                    )}

                    {currentStepData.type === "select" && (
                      <Select
                        value={promptData[currentStepData.field as keyof PromptData]}
                        onValueChange={updateField}
                      >
                        <SelectTrigger
                          className="text-base h-12 border-2 focus:border-primary"
                          aria-label={t('wizard.step3.selectPlaceholder')}
                        >
                          <SelectValue placeholder={t('wizard.step3.selectPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {currentStepData.options?.map((option) => (
                            <SelectItem key={option} value={option} className="text-base">
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <p id={`step-${currentStep}-hint`} className="sr-only">
                      {currentStepData.subtitle}
                    </p>

                    {/* Examples */}
                    {currentStepData.examples && currentStepData.examples.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          {t('wizard.buttons.inspiration')}
                        </p>
                        <div className="grid gap-2" role="list" aria-label="Example suggestions">
                          {currentStepData.examples.map((example, idx) => (
                            <ExampleButton
                              key={idx}
                              onClick={() => fillExample(example)}
                              label={example}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex gap-4">
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    size="lg"
                    className="flex-1"
                    aria-label={t('wizard.buttons.back')}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                    {t('wizard.buttons.back')}
                  </Button>
                )}
                {isOptionalStep && !promptData[currentStepData.field as keyof PromptData] && (
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    size="lg"
                    className="flex-1"
                    aria-label={t('wizard.buttons.skip')}
                  >
                    <SkipForward className="w-4 h-4 mr-2" aria-hidden="true" />
                    {t('wizard.buttons.skip')}
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  size="lg"
                  className="flex-1 font-semibold"
                  aria-label={currentStep === totalSteps ? t('wizard.buttons.generate') : t('wizard.buttons.continue')}
                >
                  {currentStep === totalSteps ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
                      {t('wizard.buttons.generate')}
                    </>
                  ) : (
                    <>
                      {t('wizard.buttons.continue')}
                      <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="hidden lg:block lg:sticky lg:top-8 h-fit">
              <PromptAnatomy promptData={promptData} currentStep={currentStep} />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Wizard;
