import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const examples = [
  {
    before: "Write a blog post about productivity",
    after: "As an experienced content strategist, write a 1,200-word blog post about productivity hacks for remote workers. Target audience: tech professionals aged 25-40. Tone: Professional yet approachable. Include 5 actionable tips with real examples."
  },
  {
    before: "Help me with marketing",
    after: "As a senior marketing consultant, create a 3-email welcome sequence for new subscribers to a meditation app. Audience: stressed professionals seeking work-life balance. Tone: Calm and empathetic. Each email should be 150-200 words with a clear CTA."
  },
  {
    before: "Make a social media post",
    after: "As a social media expert, create 5 Instagram captions for a sustainable fashion brand launching eco-friendly sneakers. Target: environmentally conscious millennials. Tone: Inspiring and authentic. Include relevant hashtags and emojis."
  },
  {
    before: "Explain this concept",
    after: "As a patient educator, explain quantum computing to a 12-year-old with no technical background. Use simple analogies from everyday life. Keep it under 300 words. Make it engaging and avoid jargon completely."
  },
  {
    before: "Create a sales email",
    after: "As a B2B sales expert, write a cold outreach email to CTOs of mid-sized tech companies introducing our cybersecurity solution. Tone: Professional and value-focused. Length: 150 words max. Include a clear meeting request CTA."
  }
];

const ExamplesCarousel = () => {
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
