import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";

interface ExampleButtonProps {
  onClick: () => void;
  label?: string;
}

const ExampleButton = ({ onClick, label = "Try an Example" }: ExampleButtonProps) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="w-full border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all"
    >
      <Lightbulb className="w-4 h-4 mr-2" />
      {label}
    </Button>
  );
};

export default ExampleButton;
