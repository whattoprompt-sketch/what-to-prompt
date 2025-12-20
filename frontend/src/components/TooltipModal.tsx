import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

interface TooltipModalProps {
  title: string;
  description: string;
  examples: string[];
  triggerText?: string;
}

const TooltipModal = ({ title, description, examples, triggerText }: TooltipModalProps) => {
  const { t } = useTranslation();
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button 
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          aria-label={triggerText || t('wizard.buttons.learnMore', 'Learn more')}
        >
          {triggerText || t('wizard.buttons.learnMore', 'Learn more')} <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby="modal-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
            {title}
          </DialogTitle>
          <DialogDescription id="modal-description" className="text-base pt-4 text-foreground/80">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        {examples.length > 0 && (
          <div className="space-y-3 mt-4" role="list" aria-label="Examples">
            <h4 className="font-semibold text-sm">{t('wizard.modal.examples', 'Examples')}:</h4>
            <div className="space-y-3">
              {examples.map((example, idx) => (
                <div key={idx} className="bg-primary/5 border border-primary/20 rounded-lg p-4" role="listitem">
                  <p className="text-sm">
                    <span className="text-primary font-semibold">{t('wizard.modal.example', 'Example')} {idx + 1}:</span>{" "}
                    {example}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-6">
          <DialogClose asChild>
            <Button className="w-full" size="lg">
              {t('wizard.modal.continueButton', 'Continue')}
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TooltipModal;
