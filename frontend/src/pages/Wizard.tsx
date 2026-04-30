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
import { Sparkles, Target, BookOpen, Lightbulb, CheckCircle2, SkipForward, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
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

interface AdvancedData {
  failedAttempts: string;
  outputFormat: string;
  exampleOutput: string;
  readerUsageContext: string;
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

  const [advancedData, setAdvancedData] = useState<AdvancedData>({
    failedAttempts: "",
    outputFormat: "",
    exampleOutput: "",
    readerUsageContext: "",
  });
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const totalSteps = 6;

  const advancedFilledCount = Object.values(advancedData).filter(v => v.trim().length > 0).length;

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
      placeholder: "Select an AI model",
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
      // Merge core + advanced data before navigating
      navigate("/result", { state: { promptData: { ...promptData, ...advancedData } } });
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
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-10">
          <div className="grid lg:grid-cols-1 xl:grid-cols-[1fr,400px] gap-4 sm:gap-8 max-w-7xl mx-auto">
            {/* Main Form */}
            <div className="space-y-4 sm:space-y-8" role="form" aria-label={t('wizard.progress')}>
              {/* Progress */}
              <div className="space-y-2 px-1 sm:px-0">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-[10px] sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">{t('wizard.progress')}</span>
                    <div className="flex items-center gap-2 text-primary font-bold text-base sm:text-xl">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span aria-live="polite">{Math.round(progress)}% {t('wizard.done')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm text-muted-foreground font-medium">
                    <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-primary" aria-hidden="true" />
                    {t('wizard.stepOf', { current: currentStep, total: totalSteps })}
                  </div>
                </div>
                <Progress value={progress} className="h-2 sm:h-3 sm:h-4 bg-muted rounded-full overflow-hidden shadow-inner" aria-label={`Progress: ${Math.round(progress)}%`} />
              </div>

              {/* Question Card */}
              <Card className="border-0 shadow-none bg-transparent sm:bg-card sm:border-2 sm:shadow-elevated overflow-hidden rounded-none sm:rounded-3xl">
                <CardContent className="p-0 sm:p-8 md:p-10">
                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-6 mb-4 sm:mb-8">
                    <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 animate-scale-in shadow-lg border border-primary/10" aria-hidden="true">
                      <Icon className="w-5 h-5 sm:w-8 sm:h-8 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1 sm:space-y-2">
                      <h2 className="text-lg sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                        {currentStepData.title}
                      </h2>
                      <p className="text-sm sm:text-lg text-muted-foreground leading-relaxed">
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
                          className="min-h-[100px] sm:min-h-[140px] text-sm sm:text-base resize-none border-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary rounded-xl"
                          autoFocus
                          aria-label={currentStepData.title}
                          aria-describedby={`step-${currentStep}-hint`}
                        />
                      </div>
                    )}

                    {currentStepData.type === "input" && (
                      <Input
                        placeholder={currentStepData.placeholder}
                        value={promptData[currentStepData.field as keyof PromptData]}
                        onChange={(e) => updateField(e.target.value)}
                        className="text-base h-12 border-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary rounded-xl"
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
                          className="w-full text-base h-12 border-2 focus:ring-0 focus:ring-offset-0 focus:border-primary rounded-xl"
                        >
                          <SelectValue placeholder={currentStepData.placeholder} />
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

              {/* Advanced Settings Panel */}
              <div className="border border-border/50 rounded-2xl overflow-hidden transition-all">
                <button
                  onClick={() => setAdvancedOpen(!advancedOpen)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors text-left group"
                  aria-expanded={advancedOpen}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary/60" />
                    <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                      Advanced settings — get a more precise prompt
                    </span>
                    {advancedFilledCount > 0 && !advancedOpen && (
                      <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-semibold">
                        {advancedFilledCount} applied
                      </span>
                    )}
                  </div>
                  {advancedOpen
                    ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                </button>

                {advancedOpen && (
                  <div className="px-5 pb-5 pt-2 space-y-5 border-t border-border/30 bg-muted/10">

                    {/* 1. What's failed before — highest value, first */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold">What's failed before?</label>
                      <p className="text-xs text-muted-foreground">We'll turn every failure into a hard prohibition in the generated prompt.</p>
                      <Textarea
                        value={advancedData.failedAttempts}
                        onChange={(e) => setAdvancedData({ ...advancedData, failedAttempts: e.target.value })}
                        placeholder="e.g., It gave me corporate jargon. The output was too generic. It listed features instead of benefits."
                        className="min-h-[68px] text-sm resize-none border-border/60 focus:border-primary"
                      />
                    </div>

                    {/* 2. Output format */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold">Output format</label>
                      <Select
                        value={advancedData.outputFormat}
                        onValueChange={(v) => setAdvancedData({ ...advancedData, outputFormat: v })}
                      >
                        <SelectTrigger className="text-sm h-10 border-border/60 focus:border-primary">
                          <SelectValue placeholder="How should the response be structured?" />
                        </SelectTrigger>
                        <SelectContent>
                          {["Bullet list", "Numbered steps", "Narrative paragraphs", "Table", "Mixed (headers + bullets)", "Let the AI decide"].map(opt => (
                            <SelectItem key={opt} value={opt} className="text-sm">{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 3. Example of good output */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold">Show an example of good output</label>
                      <p className="text-xs text-muted-foreground">Even a rough sketch — the AI will match this style and extend it.</p>
                      <Textarea
                        value={advancedData.exampleOutput}
                        onChange={(e) => setAdvancedData({ ...advancedData, exampleOutput: e.target.value })}
                        placeholder="e.g., Something like: '3 bullets, each starting with an action verb. Like: Build your network before you need it.'"
                        className="min-h-[68px] text-sm resize-none border-border/60 focus:border-primary"
                      />
                    </div>

                    {/* 4. Who reads it and what do they do with it */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold">Who reads this and what do they do with it?</label>
                      <Input
                        value={advancedData.readerUsageContext}
                        onChange={(e) => setAdvancedData({ ...advancedData, readerUsageContext: e.target.value })}
                        placeholder="e.g., My CEO — she'll use it in a board presentation. Or: I'll paste it directly into a client email."
                        className="text-sm h-10 border-border/60 focus:border-primary"
                      />
                    </div>

                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between gap-2 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border/50">
                {currentStep > 1 ? (
                  <Button variant="ghost" onClick={handleBack} className="pl-0 hover:bg-transparent hover:text-primary transition-colors">
                    <ChevronLeft className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="text-sm sm:text-base">{t('wizard.buttons.back')}</span>
                  </Button>
                ) : (
                  <div /> /* Spacer if no back button */
                )}

                <div className="flex items-center gap-2 sm:gap-3">
                  {isOptionalStep && !promptData[currentStepData.field as keyof PromptData] && (
                    <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground hover:text-primary text-sm sm:text-base px-2 sm:px-4">
                      <SkipForward className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="sm:hidden">Skip</span>
                      <span className="hidden sm:inline">{t('wizard.buttons.skip')}</span>
                    </Button>
                  )}
                  <Button onClick={handleNext} disabled={!isStepValid()} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 rounded-xl px-4 sm:px-8 py-2 sm:py-6 text-sm sm:text-lg font-medium transition-all hover:scale-105 active:scale-95">
                    <span className="mr-1 sm:mr-2">{currentStep === totalSteps ? t('wizard.buttons.generate') : t('wizard.buttons.continue')}</span>
                    {currentStep !== totalSteps && (
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="hidden lg:block lg:sticky lg:top-8 h-fit">
              <PromptAnatomy promptData={{ ...promptData, ...advancedData }} currentStep={currentStep} />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Wizard;
