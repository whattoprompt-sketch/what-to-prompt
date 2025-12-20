import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    History as HistoryIcon,
    Trash2,
    ChevronRight,
    MessageSquare,
    Search,
    Calendar,
    Sparkles,
    ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import Footer from "@/components/Footer";
import { format } from "date-fns";

interface PromptSession {
    id: string;
    user_id: string;
    ai_model: string;
    generated_prompt: string;
    explanation: string;
    wizard_inputs: any;
    created_at: string;
}

const HistoryPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState<PromptSession[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            toast.error("Please sign in to view your history");
            navigate("/auth");
            return;
        }
        fetchSessions(session.user.id);
    };

    const fetchSessions = async (userId: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("prompt_sessions")
                .select("*")
                .eq("user_id", userId)
                .is("deleted_at", null)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setSessions(data || []);
        } catch (error: any) {
            console.error("Error fetching sessions:", error.message);
            toast.error("Failed to load history");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkUser();
    }, []);

    const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        try {
            const { error } = await supabase
                .from("prompt_sessions")
                .update({ deleted_at: new Date().toISOString() })
                .eq("id", sessionId);

            if (error) throw error;

            setSessions(sessions.filter(s => s.id !== sessionId));
            toast.success("Past prompt deleted");
        } catch (error: any) {
            toast.error("Failed to delete prompt");
        }
    };

    const filteredSessions = sessions.filter(session => {
        const task = session.wizard_inputs?.task || "";
        const prompt = session.generated_prompt || "";
        return task.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prompt.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const handleSessionClick = (session: PromptSession) => {
        navigate("/result", {
            state: {
                promptData: {
                    role: session.wizard_inputs.role,
                    task: session.wizard_inputs.task,
                    context: session.wizard_inputs.context,
                    requirements: session.wizard_inputs.constraints,
                    tone: session.wizard_inputs.tone,
                    aiModel: session.ai_model,
                },
                expertPrompt: session.generated_prompt,
                explanation: session.explanation,
                fromHistory: true
            }
        });
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <div className="container mx-auto px-4 py-8 flex-1">
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate("/")}
                                className="pl-0 text-muted-foreground hover:text-primary transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Dashboard
                            </Button>
                            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                                <HistoryIcon className="w-8 h-8 text-primary" />
                                My Prompt History
                            </h1>
                            <p className="text-muted-foreground font-medium">
                                Access all your previously generated expert prompts.
                            </p>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search past prompts..."
                                className="pl-10 pr-4 py-2 bg-muted/50 border-2 border-transparent focus:border-primary/20 rounded-xl outline-none transition-all w-full sm:w-64"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-32 bg-muted/40 animate-pulse rounded-2xl border-2 border-dashed border-muted" />
                            ))}
                        </div>
                    ) : filteredSessions.length === 0 ? (
                        <Card className="border-2 border-dashed bg-muted/5 min-h-[300px] flex flex-col items-center justify-center text-center p-8 rounded-3xl">
                            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                                <MessageSquare className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">No past prompts found</h3>
                            <p className="text-muted-foreground max-w-xs mb-6 px-4">
                                {searchTerm ? "No results match your search." : "You haven't generated any prompts yet. Start creating with the Wizard!"}
                            </p>
                            {!searchTerm && (
                                <Button onClick={() => navigate("/wizard")} className="font-bold rounded-xl shadow-lg shadow-primary/20">
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Go to Wizard
                                </Button>
                            )}
                        </Card>
                    ) : (
                        <div className="grid gap-4 animate-fade-in">
                            {filteredSessions.map((session) => (
                                <Card
                                    key={session.id}
                                    className="group border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-elevated cursor-pointer overflow-hidden rounded-2xl"
                                    onClick={() => handleSessionClick(session)}
                                >
                                    <CardContent className="p-0">
                                        <div className="flex items-stretch min-h-[120px]">
                                            {/* Side color stripe */}
                                            <div className="w-2 bg-primary/20 group-hover:bg-primary transition-colors" />

                                            <div className="flex-1 p-5 sm:p-6 space-y-4">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-none font-bold">
                                                            {session.ai_model}
                                                        </Badge>
                                                        <div className="flex items-center text-xs text-muted-foreground font-medium">
                                                            <Calendar className="w-3.5 h-3.5 mr-1.5" />
                                                            {format(new Date(session.created_at), "MMM d, yyyy • h:mm a")}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:text-white hover:bg-destructive rounded-lg"
                                                            onClick={(e) => handleDelete(e, session.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                        <ChevronRight className="w-5 h-5 text-primary" />
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="font-bold text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                                                        {session.wizard_inputs?.task || "Untitled Prompt"}
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                                        {session.generated_prompt}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default HistoryPage;
