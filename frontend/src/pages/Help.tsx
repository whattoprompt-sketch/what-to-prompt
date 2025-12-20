import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Keyboard, BookOpen } from "lucide-react";
import Footer from "@/components/Footer";

const Help = () => {
  return (
    <>
      <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Help Center</h1>
            <p className="text-lg text-muted-foreground">
              Everything you need to master prompt engineering
            </p>
          </div>

          {/* Keyboard Shortcuts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-primary" />
                Keyboard Shortcuts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">Navigate to next step</span>
                  <kbd className="px-3 py-1 bg-muted rounded text-xs font-mono">Enter</kbd>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">Go back to previous step</span>
                  <kbd className="px-3 py-1 bg-muted rounded text-xs font-mono">Esc</kbd>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">Copy final prompt</span>
                  <kbd className="px-3 py-1 bg-muted rounded text-xs font-mono">Ctrl + C</kbd>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Start new prompt</span>
                  <kbd className="px-3 py-1 bg-muted rounded text-xs font-mono">Ctrl + N</kbd>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tutorial */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                How to Use Prompt Coach
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Step 1 */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">1. Define Your Goal</h3>
                  <p className="text-sm text-muted-foreground">
                    Start by clearly stating what you want to achieve. Be as specific as possible about your objective. The more detail you provide, the better the AI can understand and fulfill your needs.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4 border-2 border-dashed">
                    <p className="text-xs text-muted-foreground text-center">
                      [Screenshot placeholder: Goal definition step]
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">2. Provide Context</h3>
                  <p className="text-sm text-muted-foreground">
                    Give the AI important background information. This helps it understand your situation, audience, and any relevant constraints. Context is key to getting responses that truly fit your needs.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4 border-2 border-dashed">
                    <p className="text-xs text-muted-foreground text-center">
                      [Screenshot placeholder: Context input step]
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">3. Select Your AI Tool</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose which AI platform you'll be using. Different AIs have different strengths, and we'll optimize your prompt accordingly for maximum compatibility and effectiveness.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4 border-2 border-dashed">
                    <p className="text-xs text-muted-foreground text-center">
                      [Screenshot placeholder: AI selection step]
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">4. Set the Tone</h3>
                  <p className="text-sm text-muted-foreground">
                    Define how the AI should communicate. Whether professional, casual, technical, or creative - the tone shapes the entire response to match your audience and purpose.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4 border-2 border-dashed">
                    <p className="text-xs text-muted-foreground text-center">
                      [Screenshot placeholder: Tone selection step]
                    </p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">5. Add Requirements & Constraints</h3>
                  <p className="text-sm text-muted-foreground">
                    Specify any formatting requirements, content limits, or other constraints. This ensures the output meets your exact specifications and can be used immediately without modifications.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4 border-2 border-dashed">
                    <p className="text-xs text-muted-foreground text-center">
                      [Screenshot placeholder: Requirements step]
                    </p>
                  </div>
                </div>

                {/* Step 6 */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">6. Define the AI's Role</h3>
                  <p className="text-sm text-muted-foreground">
                    Tell the AI what role or expertise it should embody. This helps frame its perspective and approach, leading to responses that match the level of expertise and viewpoint you need.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4 border-2 border-dashed">
                    <p className="text-xs text-muted-foreground text-center">
                      [Screenshot placeholder: Role definition step]
                    </p>
                  </div>
                </div>

                {/* Final Step */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">7. Copy & Use Your Prompt</h3>
                  <p className="text-sm text-muted-foreground">
                    Once generated, copy your optimized prompt and paste it into your chosen AI tool. You can refine it further or use it as-is for immediate, high-quality results.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4 border-2 border-dashed">
                    <p className="text-xs text-muted-foreground text-center">
                      [Screenshot placeholder: Final result page with copy button]
                    </p>
                  </div>
                </div>
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

export default Help;
