import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useTranslation } from "react-i18next";

const ExamplesCarousel = () => {
  const { t } = useTranslation();

  const examples = [
    { before: t("examples.example1.before"), after: t("examples.example1.after") },
    { before: t("examples.example2.before"), after: t("examples.example2.after") },
    { before: t("examples.example3.before"), after: t("examples.example3.after") },
    { before: t("examples.example4.before"), after: t("examples.example4.after") },
    { before: t("examples.example5.before"), after: t("examples.example5.after") },
  ];

  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      plugins={[
        Autoplay({
          delay: 5000,
        }),
      ]}
      className="w-full"
    >
      <CarouselContent>
        {examples.map((example, index) => (
          <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
            <Card className="h-full border-2 hover:border-primary transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">❌ Before</p>
                  <p className="text-sm text-muted-foreground italic">{example.before}</p>
                </div>
                <div className="border-t pt-4">
                  <p className="text-xs font-semibold text-primary mb-2">✅ After</p>
                  <p className="text-sm">{example.after}</p>
                </div>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden md:flex" />
      <CarouselNext className="hidden md:flex" />
    </Carousel>
  );
};

export default ExamplesCarousel;
