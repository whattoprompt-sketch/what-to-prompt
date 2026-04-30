import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, RefreshCw, Lightbulb, CheckCircle2, Sparkles, ExternalLink, ChevronDown, ChevronUp, User, Globe, Target, Layout, BookOpen, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import PromptAnatomy from "@/components/PromptAnatomy";

interface WizardInputs {
  role?: string;
  task?: string;
  context?: string;
  requirements?: string;
  tone?: string;
  aiModel?: string;
  outputFormat?: string;
  failedAttempts?: string;
  exampleOutput?: string;
  readerUsageContext?: string;
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
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});

  const toggleBlock = (blockKey: string) => {
    setExpandedBlocks(prev => ({ ...prev, [blockKey]: !prev[blockKey] }));
  };

  // Parse the generated prompt into its 6 named blocks
  const BLOCK_KEYS = ["IDENTITY", "CONTEXT", "TASK", "FORMAT", "EXEMPLAR", "CONSTRAINT"] as const;
  type BlockKey = typeof BLOCK_KEYS[number];

  const parsePromptBlocks = (text: string): Record<BlockKey, string> | null => {
    const result = {} as Record<BlockKey, string>;
    let found = 0;
    for (let i = 0; i < BLOCK_KEYS.length; i++) {
      const key = BLOCK_KEYS[i];
      const header = `### [${key}]`;
      const start = text.indexOf(header);
      if (start === -1) continue;
      const contentStart = start + header.length;
      // Find where next block starts, or end of string
      const nextHeaders = BLOCK_KEYS.slice(i + 1).map(k => `### [${k}]`);
      let end = text.length;
      for (const nh of nextHeaders) {
        const pos = text.indexOf(nh, contentStart);
        if (pos !== -1 && pos < end) end = pos;
      }
      result[key] = text.slice(contentStart, end).trim();
      found++;
    }
    return found >= 4 ? result : null; // need at least 4 blocks to show annotated view
  };

  const BLOCK_META: Record<BlockKey, {
    label: string;
    icon: React.ElementType;
    accent: string;
    accentText: string;
    accentBg: string;
    technique: string;
    techniqueDesc: string;
    why: string;
    without: string;
    modify: string;
  }> = {
    IDENTITY: {
      label: "Identity",
      icon: User,
      accent: "border-violet-500",
      accentText: "text-violet-600 dark:text-violet-400",
      accentBg: "bg-violet-50 dark:bg-violet-950/40",
      technique: "Role Priming",
      techniqueDesc: "We specified a precise expert role with expertise markers, communication style, and operational context — not just a job title. This activates the model's training data associated with expert-level outputs in this specific domain.",
      why: "LLMs are trained on vast amounts of text written by real people. 'Senior marketing consultant' triggers a broad, average distribution. 'Direct response copywriter who has written for infomercials where every word is tested against conversion data' signals a very specific corpus — high-stakes persuasion writing. The model literally draws from different patterns. The operational context clause (the 'where every word costs money' part) is often more powerful than the title itself.",
      without: "Without role priming, the model defaults to its 'helpful assistant' persona — generically competent, deliberately cautious, optimized to avoid offending the statistically average user. You'll get polished mediocrity: correct sentences, weak decisions. The role block is the single highest-leverage change you can make to any prompt.",
      modify: "Try changing the operational context clause — the part that describes the environment and stakes. Swap 'infomercials where every word costs money' for 'academic journals where peer review is the only metric that matters.' The content will shift completely while the task stays identical. That's role priming in action. Specificity in the stakes clause is more powerful than specificity in the title.",
    },
    CONTEXT: {
      label: "Context",
      icon: Globe,
      accent: "border-blue-500",
      accentText: "text-blue-600 dark:text-blue-400",
      accentBg: "bg-blue-50 dark:bg-blue-950/40",
      technique: "Situation Grounding + Downstream Awareness",
      techniqueDesc: "This block gives the model the complete situational triangle: what's happening, who reads the output, and what they do with it. These three together prevent the model from filling context gaps with its own statistical assumptions.",
      why: "Without explicit context, the model writes for its internal 'most likely user' — a statistical average across all similar requests in training. Specifying audience, situation, and downstream use triangulates the target precisely. The 'This output will be used for' line is particularly powerful: it changes expected length, formality level, completeness requirements, and whether the model uses placeholders or writes fully.",
      without: "The model makes confident assumptions about your audience and use case — and those assumptions are always generic. For a product description, it assumes a general consumer. For an email, it assumes a corporate context. These defaults are optimized to be broadly acceptable, which means they're specifically wrong for most actual situations.",
      modify: "The highest-leverage modification is 'The audience for your output.' Change it from 'small business owners' to 'Series A investors' and the vocabulary, depth, and framing shift completely — same task, completely different output. The 'used for' field is your second lever: 'copy-paste directly' forces the model to produce complete, placeholder-free content, while 'first draft' gives it permission to be rougher but broader.",
    },
    TASK: {
      label: "Task",
      icon: Target,
      accent: "border-emerald-500",
      accentText: "text-emerald-600 dark:text-emerald-400",
      accentBg: "bg-emerald-50 dark:bg-emerald-950/40",
      technique: "Chain-of-Thought Decomposition",
      techniqueDesc: "Instead of a single instruction, the task is broken into sequential reasoning steps. Each step builds on the previous one, forcing the model to approach the problem in a structured way rather than generating output in one unguided pass.",
      why: "LLMs generate text token by token. When Step 1 instructs the model to identify emotional triggers before writing, the output of that analysis literally influences the token probabilities for everything that follows. This is chain-of-thought prompting applied at the instruction level. It mimics how a human expert actually works: research first, structure second, write third. Without it, the model collapses all sub-tasks into a single statistical prediction.",
      without: "Without decomposition, the model produces output in a single pass — which means it's simultaneously deciding what to say, how to structure it, and what words to use, all at once. Human experts never work this way. The result is output that sounds fluent but lacks strategic structure. Features get mentioned without being mapped to benefits. Conclusions appear before the reasoning that supports them.",
      modify: "The highest-leverage modification is changing what Step 1 asks the model to identify before writing. 'Identify the 3 strongest emotional triggers for this audience' and 'Identify the 3 most unique features of this product' produce structurally different outputs even with identical Step 2 and Step 3 instructions. Step 1 is the frame — everything else gets built inside it. Change the frame, change the output.",
    },
    FORMAT: {
      label: "Format",
      icon: Layout,
      accent: "border-amber-500",
      accentText: "text-amber-600 dark:text-amber-400",
      accentBg: "bg-amber-50 dark:bg-amber-950/40",
      technique: "Output Constraint Specification",
      techniqueDesc: "Exact section names, approximate lengths per section, and explicitly excluded elements eliminate all format interpretation. The phrase 'Structure your response exactly as follows' is one of the highest-signal instructions in prompt engineering — it tells the model this is a hard constraint, not a suggestion.",
      why: "Without format specification, the model generates the output structure it considers most 'typical' for the task — a statistical mode across similar outputs in its training data. Named sections with maximum lengths give the model hard boundaries it respects similarly to system-level constraints. The model also learns implicit rules: if you name a section 'Hook,' it understands that section needs to perform a specific rhetorical function.",
      without: "You get whatever format the model considers a typical example of the task — usually 2-3 paragraphs of flowing text with no structure. Even when the content is excellent, you can't control whether you get bullets or paragraphs, whether there's a headline, how long each section runs, or whether the model adds an unsolicited 'In conclusion' paragraph. Format chaos is the most common cause of outputs that need heavy editing.",
      modify: "'Do not include' is the single most underused lever in format specification. Most prompt engineers focus on what to include — the model's defaults already handle inclusions reasonably well. What it gets wrong are inclusions you don't want: pricing disclaimers, meta-commentary about the task, call-to-action boilerplate. Adding specific exclusions often improves output quality more than adding inclusions.",
    },
    EXEMPLAR: {
      label: "Exemplar",
      icon: BookOpen,
      accent: "border-rose-500",
      accentText: "text-rose-600 dark:text-rose-400",
      accentBg: "bg-rose-50 dark:bg-rose-950/40",
      technique: "Few-Shot Prompting",
      techniqueDesc: "Showing the model an example of target output quality before asking it to produce the output. The model reverse-engineers the style, register, and implicit quality standards from the example and applies them — learning by demonstration rather than description.",
      why: "LLMs learn by pattern matching at a deep level. When you provide an example, the model identifies stylistic patterns, vocabulary register, structural choices, sentence length norms, and implicit quality thresholds — then applies all of them simultaneously. This is more effective than describing these properties in words because the model is pattern-matching against something concrete rather than inferring an abstract target from description. One well-chosen example can override pages of stylistic instructions.",
      without: "Without an exemplar, the model interprets your written instructions at the level of their literal meaning — which is always less precise than you intend. 'Professional tone' means something different to the model than to you. 'Three concise bullet points' produces wildly varying bullet lengths. 'Engaging opening' triggers whatever the statistical average of engaging openings looks like in training data. An example anchors all of these ambiguities simultaneously.",
      modify: "The most powerful modification is swapping the exemplar style while keeping the task constant. Replace the current example with something in a completely different register — informal/punchy vs. formal/executive, data-dense vs. narrative, short vs. long-form. The entire output character shifts while following the same task instructions. This makes the exemplar the most direct style control you have — more direct than any adjective in a written instruction.",
    },
    CONSTRAINT: {
      label: "Constraint",
      icon: ShieldCheck,
      accent: "border-slate-500",
      accentText: "text-slate-600 dark:text-slate-400",
      accentBg: "bg-slate-50 dark:bg-slate-950/40",
      technique: "Hard/Soft Constraint Differentiation",
      techniqueDesc: "Constraints are split into non-negotiable rules (Hard) and strong preferences (Soft). This tells the model exactly where it has flexibility and where it doesn't — creating an explicit priority ordering it can use when the prompt is complex or the constraints are in tension.",
      why: "Without this separation, the model weights all instructions equally — which means it may compromise on a critical word count requirement to satisfy a style preference. Hard constraints signal inviolability the same way 'MUST' and 'NEVER' do in natural language. Soft constraints give the model permission to be contextually flexible. In long prompts with many requirements, this split is what prevents the model from making the wrong trade-offs.",
      without: "The model treats all instructions as equally weighted preferences. In a complex prompt, it picks and chooses what to honor based on its own weighting — which rarely matches yours. It may prioritize sounding professional over staying under 150 words. It may include a call-to-action because training data suggests that's 'good copywriting,' even when you've asked for no CTA. You lose control over which constraints are inviolable.",
      modify: "Move constraints between Hard and Soft to change the model's priority ordering. If the output keeps running too long, move 'maximum word count' from Soft to Hard — the model will sacrifice other elements to comply. If a style element is being over-constrained (the output feels mechanical), move it from Hard to Soft, giving the model flexibility to interpret it contextually. The position of a constraint often matters more than its wording.",
    },
  };

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
          tone: safePromptData.tone,
          output_format: safePromptData.outputFormat,
          failed_attempts: safePromptData.failedAttempts,
          example_output: safePromptData.exampleOutput,
          reader_usage_context: safePromptData.readerUsageContext,
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

              {/* Prompt Display — Annotated 6-Block Breakdown */}
              {(() => {
                const blocks = parsePromptBlocks(prompt);
                if (!blocks) {
                  // Fallback: raw display if prompt doesn't have the expected structure
                  return (
                    <Card className="border-2 shadow-card">
                      <CardContent className="pt-6 pb-6">
                        <pre className="text-sm font-mono whitespace-pre-wrap bg-muted/50 p-6 rounded-lg overflow-x-auto border-2 border-dashed">
                          {prompt}
                        </pre>
                      </CardContent>
                    </Card>
                  );
                }
                return (
                  <div className="space-y-3">
                    {BLOCK_KEYS.map((key) => {
                      const content = blocks[key];
                      if (!content) return null;
                      const meta = BLOCK_META[key];
                      const Icon = meta.icon;
                      const isExpanded = expandedBlocks[key] ?? false;
                      return (
                        <div key={key} className={`rounded-xl border-l-4 ${meta.accent} border border-border/60 overflow-hidden`}>
                          {/* Block header */}
                          <div className={`px-5 py-3 flex items-center gap-3 ${meta.accentBg}`}>
                            <Icon className={`w-4 h-4 flex-shrink-0 ${meta.accentText}`} />
                            <span className={`text-xs font-bold tracking-widest uppercase ${meta.accentText}`}>
                              {meta.label}
                            </span>
                          </div>
                          {/* Block content */}
                          <div className="px-5 py-4 bg-card">
                            <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed text-foreground/90">
                              {content}
                            </pre>
                          </div>
                          {/* Teaching panel toggle */}
                          <div className="border-t border-border/40">
                            <button
                              onClick={() => toggleBlock(key)}
                              className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-muted/40 transition-colors text-left group"
                              aria-expanded={isExpanded}
                            >
                              <div className="flex items-center gap-2">
                                <Lightbulb className={`w-3.5 h-3.5 ${meta.accentText}`} />
                                <span className={`text-xs font-semibold ${meta.accentText} group-hover:underline`}>
                                  Learn the technique
                                </span>
                              </div>
                              {isExpanded
                                ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                            </button>
                            {isExpanded && (
                              <div className={`border-t border-border/30 ${meta.accentBg}`}>
                                {/* Technique */}
                                <div className="px-5 pt-4 pb-3 space-y-1.5">
                                  <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Technique</p>
                                  <p className={`text-sm font-bold ${meta.accentText}`}>💡 {meta.technique}</p>
                                  <p className="text-sm text-muted-foreground leading-relaxed">{meta.techniqueDesc}</p>
                                </div>
                                {/* Why it works */}
                                <div className="px-5 py-3 space-y-1.5 border-t border-border/20">
                                  <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Why it works</p>
                                  <p className="text-sm text-muted-foreground leading-relaxed">{meta.why}</p>
                                </div>
                                {/* Without this */}
                                <div className="px-5 py-3 space-y-1.5 border-t border-border/20 bg-destructive/5">
                                  <p className="text-[10px] font-bold tracking-widest uppercase text-destructive/60">Without this</p>
                                  <p className="text-sm text-muted-foreground leading-relaxed">{meta.without}</p>
                                </div>
                                {/* How to modify */}
                                <div className="px-5 pt-3 pb-4 space-y-1.5 border-t border-border/20">
                                  <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">How to modify it</p>
                                  <p className="text-sm text-muted-foreground leading-relaxed">{meta.modify}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

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
