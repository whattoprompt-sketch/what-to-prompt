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
      className="w-full justify-start text-left h-auto py-3 px-4 whitespace-normal"
      onClick={onClick}
    >
      <Lightbulb className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
      <span className="line-clamp-2 md:line-clamp-1">{label}</span>
    </Button>
  );
};

export default ExampleButton;
