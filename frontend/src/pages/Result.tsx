import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, RefreshCw, Lightbulb, CheckCircle2, Sparkles, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import PromptAnatomy from "@/components/PromptAnatomy";

interface WizardInputs {
  role?: string;
  task?: string;
  context?: string;
  requirements?: string;
  tone?: string;
  aiModel?: string;
}

interface ResultLocationState {
  promptData?: WizardInputs;
  expertPrompt?: string;
  explanation?: string;
  fromHistory?: boolean;
}

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    promptData,
    expertPrompt: initialPrompt,
    explanation: initialExplanation,
    fromHistory,
  } = (location.state as ResultLocationState) || {};

  // Safe access to promptData properties to avoid runtime errors if state is missing
  const safePromptData: WizardInputs = useMemo(() => promptData ?? {}, [promptData]);

  const [showCelebration, setShowCelebration] = useState(!fromHistory);
  const [copied, setCopied] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [user, setUser] = useState<User | null>(null);

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

  useEffect(() => {
    if (!promptData) {
      navigate("/");
    }
  }, [promptData, navigate]);


  const saveSession = useCallback(async (prompt: string, reason: string) => {
    if (!user || isSaved || fromHistory) return;

    try {
      console.log("Saving session to database...");
      const { error } = await supabase.from("prompt_sessions").insert({
        user_id: user.id,
        ai_model: safePromptData.aiModel || "ChatGPT",
        generated_prompt: prompt,
        explanation: reason,
        wizard_inputs: {
          role: safePromptData.role,
          task: safePromptData.task,
          context: safePromptData.context,
          constraints: safePromptData.requirements,
          tone: safePromptData.tone
        }
      });

      if (error) throw error;
      setIsSaved(true);
      console.log("Session saved successfully!");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error saving session:", errorMessage);
    }
  }, [user, isSaved, fromHistory, safePromptData]);

  const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  // Function to fetch the enhanced prompt from backend
  const fetchExpertPrompt = useCallback(async () => {
    if (initialPrompt) return; // Don't fetch if we already have it (from history)

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      setLoading(true);
      setError("");

      console.log("🚀 [Frontend] Initiating API call to backend...");

      const response = await fetch(`${apiUrl}/api/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [],
          target_model: safePromptData.aiModel || "ChatGPT",
          mode: "visual",
          role: safePromptData.role,
          task: safePromptData.task,
          context: safePromptData.context,
          constraints: safePromptData.requirements,
          tone: safePromptData.tone
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
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error && err.name === 'AbortError') {
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
  }, [initialPrompt, safePromptData, apiUrl]);

  const [hasStartedFetch, setHasStartedFetch] = useState(false);

  useEffect(() => {
    if (promptData && !initialPrompt && !hasStartedFetch) {
      setHasStartedFetch(true);
      fetchExpertPrompt();
    }
  }, [promptData, initialPrompt, hasStartedFetch, fetchExpertPrompt]);

  // FIX: Reactive Save Effect 
  // Watch for when User AND ExpertPrompt are both available
  useEffect(() => {
    if (user && expertPrompt && explanation && !isSaved && !fromHistory) {
      saveSession(expertPrompt, explanation);
    }
  }, [user, expertPrompt, explanation, isSaved, fromHistory, saveSession]);


  // Use the fetched prompt, or fall back to empty string while loading
  const prompt = expertPrompt;

  const handleCopy = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast.success("Copied to clipboard!", {
        description: "Now paste it into your AI tool and watch the magic happen!",
      });
      setTimeout(() => setCopied(false), 2000);
    }
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
    Perplexity: "https://www.perplexity.ai",
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
                      onClick={() => window.open(apiUrl, '_blank')}
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
                      Your Expert Prompt is Ready!
                    </span>
                  </h1>
                  <p className="text-muted-foreground text-lg sm:text-xl font-medium max-w-2xl">
                    Copy this and paste it into <span className="text-primary font-bold">{safePromptData.aiModel || "your AI tool"}</span> — it will generate the content for you.
                  </p>
                  <p className="text-sm text-muted-foreground/70 max-w-2xl bg-muted/40 border border-border/50 rounded-xl px-4 py-2.5 inline-block">
                    💡 This prompt instructs {safePromptData.aiModel || "the AI"} on exactly what to write. Paste it in and the AI will produce your final content.
                  </p>
                </div>
              )}

              {/* Primary Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={handleCopy}
                  className={`relative overflow-hidden font-bold h-auto py-4 sm:py-6 text-lg sm:text-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-95 transition-all flex-1 rounded-xl sm:rounded-2xl border border-white/10 ${copied ? 'bg-green-500 hover:bg-green-600' : 'bg-primary hover:bg-primary/90'}`}
                >
                  <div className="flex items-center justify-center gap-2 sm:gap-3 z-10">
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 sm:w-7 sm:h-7 animate-in zoom-in spin-in-50 duration-300" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5 sm:w-7 sm:h-7" />
                        <span className="sm:hidden">Copy Prompt</span>
                        <span className="hidden sm:inline">Copy My Expert Prompt</span>
                      </>
                    )}
                  </div>
                </Button>
                {copied && safePromptData.aiModel && aiUrls[safePromptData.aiModel] && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      const url = safePromptData.aiModel ? aiUrls[safePromptData.aiModel] : undefined;
                      if (url) window.open(url, '_blank');
                    }}
                    className="font-bold h-auto py-4 sm:py-6 text-lg sm:text-2xl shadow-lg border-2 border-primary/20 hover:border-primary hover:bg-primary/5 active:scale-95 transition-all flex-1 rounded-xl sm:rounded-2xl shrink-0 animate-in slide-in-from-left-2 fade-in duration-300"
                  >
                    Open in {safePromptData.aiModel}
                    <ExternalLink className="ml-2 w-5 h-5 sm:w-7 sm:h-7" />
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
              <PromptAnatomy promptData={safePromptData} currentStep={6} />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Result;
