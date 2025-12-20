import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Target, Sparkles, Lightbulb, MapPin } from "lucide-react";

interface PromptData {
  task?: string;
  context?: string;
  aiModel?: string;
  tone?: string;
  role?: string;
  requirements?: string;
}

interface PromptAnatomyProps {
  promptData: PromptData;
  currentStep: number;
}

const PromptAnatomy = ({ promptData, currentStep }: PromptAnatomyProps) => {
  const { t } = useTranslation();

  const sections = useMemo(() => [
    {
      icon: Target,
      title: t('promptAnatomy.role'),
      description: t('promptAnatomy.roleDesc'),
      value: promptData.role ?? "",
      step: 6,
    },
    {
      icon: Sparkles,
      title: t('promptAnatomy.task'),
      description: t('promptAnatomy.taskDesc'),
      value: promptData.task ?? "",
      step: 1,
    },
    {
      icon: BookOpen,
      title: t('promptAnatomy.context'),
      description: t('promptAnatomy.contextDesc'),
      value: promptData.context ?? "",
      step: 2,
    },
    {
      icon: Sparkles,
      title: "Target AI",
      description: "Which AI model you're optimizing for",
      value: promptData.aiModel ?? "",
      step: 3,
    },
    {
      icon: MapPin,
      title: t('promptAnatomy.specialInstructions'),
      description: t('promptAnatomy.specialInstructionsDesc'),
      value: (promptData.requirements ?? "") || (promptData.tone ?? ""),
      step: 5,
    },
  ], [t, promptData]);

  return (
    <Card className="border-2" role="complementary" aria-label={t('promptAnatomy.title')}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" aria-hidden="true" />
          {t('promptAnatomy.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = currentStep >= section.step;
          const hasContent = section.value && section.value.trim().length > 0;

          return (
            <div
              key={section.title}
              className={`space-y-2 pb-4 border-b last:border-b-0 ${!isActive ? "opacity-50" : ""
                }`}
              role="listitem"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${hasContent ? "bg-primary text-primary-foreground" : "bg-accent text-primary"
                    }`}
                  aria-hidden="true"
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{section.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {section.description}
                  </p>
                </div>
              </div>
              {hasContent && (
                <div className="ml-10 text-sm bg-muted p-3 rounded-md">
                  <p className="line-clamp-3">{section.value}</p>
                </div>
              )}
            </div>
          );
        })}

        <div className="pt-4 space-y-2">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" aria-hidden="true" />
            {t('promptAnatomy.proTips')}
          </h3>
          <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc" role="list">
            <li>{t('promptAnatomy.tip1')}</li>
            <li>{t('promptAnatomy.tip2')}</li>
            <li>{t('promptAnatomy.tip3')}</li>
            <li>{t('promptAnatomy.tip4')}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PromptAnatomy;
