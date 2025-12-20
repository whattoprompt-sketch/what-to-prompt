import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, RefreshCw, Sparkles, CheckCircle2, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import PromptAnatomy from "@/components/PromptAnatomy";

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { promptData, expertPrompt: initialPrompt, explanation: initialExplanation, fromHistory } = location.state || {};
  const [showCelebration, setShowCelebration] = useState(!fromHistory);
  const [copied, setCopied] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [expertPrompt, setExpertPrompt] = useState(initialPrompt || "");
  const [explanation, setExplanation] = useState(initialExplanation || "");
  const [loading, setLoading] = useState(!initialPrompt);
  const [error, setError] = useState("");
  const [isSaved, setIsSaved] = useState(!!fromHistory);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowCelebration(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!promptData) {
    navigate("/");
    return null;
  }

  const saveSession = async (prompt: string, reason: string) => {
    if (!user || isSaved || fromHistory) return;

    try {
      console.log("Saving session to database...");
      const { error } = await supabase.from("prompt_sessions").insert({
        user_id: user.id,
        ai_model: promptData.aiModel || "ChatGPT",
        generated_prompt: prompt,
        explanation: reason,
        wizard_inputs: {
          role: promptData.role,
          task: promptData.task,
          context: promptData.context,
          constraints: promptData.requirements,
          tone: promptData.tone
        }
      });

      if (error) throw error;
      setIsSaved(true);
      console.log("Session saved successfully!");
    } catch (err: any) {
      console.error("Error saving session:", err.message);
    }
  };

  // Function to fetch the enhanced prompt from backend
  const fetchExpertPrompt = async () => {
    if (initialPrompt) return; // Don't fetch if we already have it (from history)

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      setLoading(true);
      setError("");

      console.log("🚀 [Frontend] Initiating API call to backend...");

      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${apiUrl}/api/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [],
          target_model: promptData.aiModel || "ChatGPT",
          mode: "visual",
          role: promptData.role,
          task: promptData.task,
          context: promptData.context,
          constraints: promptData.requirements,
          tone: promptData.tone
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setExpertPrompt(data.expert_prompt);
      setExplanation(data.explanation);

      // Remove direct save here to avoid race conditions. 
      // The new useEffect below handles saving once user + prompt are both ready.
    } catch (err: any) {
      console.error(err);
      if (err.name === 'AbortError') {
        setError("Request timed out. The AI service is taking too long.");
        toast.error("Generation timed out. Please try again.");
      } else {
        setError("Something went wrong. Please ensure the backend is running.");
        toast.error("Failed to connect to backend.");
      }
    } finally {
      setLoading(false);
      clearTimeout(timeoutId);
    }
  };

  const fetchingRef = useState(false); // Using state to track if we've already started fetching
  const [hasStartedFetch, setHasStartedFetch] = useState(false);

  useEffect(() => {
    if (promptData && !initialPrompt && !hasStartedFetch) {
      setHasStartedFetch(true);
      fetchExpertPrompt();
    }
  }, [promptData, user, hasStartedFetch]);

  // FIX: Reactive Save Effect 
  // Watch for when User AND ExpertPrompt are both available
  useEffect(() => {
    if (user && expertPrompt && explanation && !isSaved && !fromHistory) {
      saveSession(expertPrompt, explanation);
    }
  }, [user, expertPrompt, explanation, isSaved, fromHistory]);

  // Use the fetched prompt, or fall back to empty string while loading
  const prompt = expertPrompt;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    toast.success("Copied to clipboard!", {
      description: "Now paste it into your AI tool and watch the magic happen!",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefine = () => {
    navigate("/wizard", { state: { promptData } });
  };

  const handleExplain = () => {
    setShowExplanation(!showExplanation);
  };

  const aiUrls: Record<string, string> = {
    ChatGPT: "https://chat.openai.com",
    Claude: "https://claude.ai",
    Gemini: "https://gemini.google.com",
    Mistral: "https://chat.mistral.ai",
    Nous: "https://nous.chat",
    DeepSeek: "https://chat.deepseek.com",
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Celebration Banner */}
        {showCelebration && (
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-4 px-4 text-center animate-fade-in shadow-lg">
            <div className="flex items-center justify-center gap-2 font-semibold">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span>Success! Your prompt is ready to use</span>
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="grid lg:grid-cols-1 xl:grid-cols-[1fr,400px] gap-8 max-w-7xl mx-auto">
            {/* Main Content */}
            <div className="space-y-8 sm:space-y-10">
              {/* Header */}
              {loading ? (
                <div className="text-center py-20 space-y-6">
                  <div className="relative w-24 h-24 mx-auto">
                    <Sparkles className="w-24 h-24 text-primary animate-spin" />
                  </div>
                  <h2 className="text-3xl font-extrabold animate-pulse tracking-tight">Generating your masterpiece...</h2>
                  <p className="text-lg text-muted-foreground">The Alchemist is brewing your prompt.</p>
                </div>
              ) : error ? (
                <div className="text-center py-12 space-y-6 border-2 border-destructive/20 rounded-3xl bg-destructive/5 p-8 shadow-inner">
                  <h2 className="text-3xl font-extrabold text-destructive flex items-center justify-center gap-3">
                    <Sparkles className="w-8 h-8 rotate-180" />
                    Generation Failed
                  </h2>
                  <p className="text-foreground font-mono text-sm bg-muted/80 p-4 rounded-xl border-2 border-dashed">{error}</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      size="lg"
                      variant="default"
                      onClick={() => fetchExpertPrompt()}
                      className="px-8 font-bold"
                    >
                      <RefreshCw className="w-5 h-5 mr-2" />
                      Try Again
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => window.open('http://127.0.0.1:8000', '_blank')}
                      className="px-8 font-bold"
                    >
                      Check Backend Status
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 animate-fade-in text-center sm:text-left">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                    <span className="inline-flex items-center gap-3 sm:flex-row flex-col">
                      <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
                      Your Perfect Prompt is Ready! 🎉
                    </span>
                  </h1>
                  <p className="text-muted-foreground text-lg sm:text-xl font-medium max-w-2xl">
                    Copy this and paste it into <span className="text-primary font-bold">{promptData.aiModel || "your AI tool"}</span> for incredible results.
                  </p>
                </div>
              )}

              {/* Primary Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={handleCopy}
                  className={`font-bold h-14 sm:h-16 text-base sm:text-xl shadow-[0_20px_50px_-12px_rgba(59,130,246,0.3)] hover:shadow-primary/40 transition-all flex-1 rounded-2xl ${copied ? 'bg-green-600 hover:bg-green-700' : ''}`}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                      <span className="sm:hidden">Copy Prompt</span>
                      <span className="hidden sm:inline">Copy My Expert Prompt</span>
                    </>
                  )}
                </Button>
                {copied && promptData.aiModel && aiUrls[promptData.aiModel] && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => window.open(aiUrls[promptData.aiModel], "_blank")}
                    className="font-semibold h-14 text-base shadow-lg hover:shadow-xl transition-all flex-1 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    Open in {promptData.aiModel}
                    <Sparkles className="w-5 h-5 ml-2" />
                  </Button>
                )}
              </div>

              {/* Prompt Display */}
              <Card className="border-2 shadow-card">
                <CardContent className="pt-6 pb-6">
                  <pre className="text-sm font-mono whitespace-pre-wrap bg-muted/50 p-6 rounded-lg overflow-x-auto border-2 border-dashed">
                    {prompt}
                  </pre>
                </CardContent>
              </Card>

              {/* Secondary Actions */}
              <div className="flex flex-wrap gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={handleRefine}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refine Prompt
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExplain}
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  {showExplanation ? "Hide" : "Explain"} Prompt
                </Button>
              </div>

              {/* Explanation */}
              {showExplanation && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6 pb-6">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-primary" />
                      Understanding Your Prompt
                    </h3>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <div className="whitespace-pre-wrap font-medium text-foreground/90 leading-relaxed">
                        {explanation || "The Alchemist is generating your personal explanation..."}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tips */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6 pb-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Pro Tips for Best Results
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Paste the entire prompt — don't skip any sections</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>If you don't like the first response, click "regenerate" in your AI tool</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Save this prompt for reuse — you can tweak small details each time</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="hidden lg:block lg:sticky lg:top-8 h-fit">
              <PromptAnatomy promptData={promptData} currentStep={6} />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Result;
