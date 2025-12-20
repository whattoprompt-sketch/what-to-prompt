import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, Chrome, ArrowRight, Github, CircleHelp } from "lucide-react";

const Auth = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mode, setMode] = useState<"login" | "signup">("login");
    const navigate = useNavigate();

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (mode === "signup") {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                toast.success("Check your email for the confirmation link!");
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                toast.success("Logged in successfully!");
                navigate("/");
            }
        } catch (error: any) {
            toast.error(error.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: window.location.origin,
                },
            });
            if (error) throw error;
        } catch (error: any) {
            toast.error(error.message || "Failed to start Google login");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background to-muted/20 p-4 relative overflow-hidden">
            {/* Background Decorative Elements - Light Aesthetic */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-100/50 rounded-full blur-[150px]" />
            </div>

            {/* Premium Light Card */}
            <Card className="w-full max-w-md z-10 border-muted/50 bg-background/80 backdrop-blur-xl shadow-elevated border-2 animate-in fade-in zoom-in duration-700 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden">
                <CardHeader className="space-y-2 p-6 sm:p-10 pb-4 sm:pb-6">
                    <div className="flex justify-center mb-4 sm:mb-6">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg border border-primary/10">
                            <CircleHelp className="w-10 h-10 text-primary group-hover:rotate-12 transition-transform" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl sm:text-4xl font-black text-center tracking-tight font-display text-foreground">
                        {mode === "login" ? "Welcome Back" : "Start Brewing"}
                    </CardTitle>
                    <CardDescription className="text-center text-muted-foreground text-base sm:text-lg font-medium">
                        {mode === "login"
                            ? "Log in to your alchemical workshop"
                            : "Create an account to start crafting expert prompts"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6 sm:p-10 pt-0 grid gap-6 sm:gap-8">
                    <Button
                        variant="outline"
                        className="w-full bg-background border-2 hover:border-primary/50 text-foreground h-14 sm:h-16 text-lg font-bold transition-all duration-300 group shadow-sm rounded-xl"
                        onClick={handleGoogleLogin}
                    >
                        <Chrome className="mr-3 h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                        Continue with Google
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t-2 border-muted" />
                        </div>
                        <div className="relative flex justify-center text-xs sm:text-sm uppercase tracking-widest font-bold">
                            <span className="bg-background px-4 text-muted-foreground/60">Or use email</span>
                        </div>
                    </div>

                    <form onSubmit={handleEmailAuth} className="grid gap-5">
                        <div className="grid gap-2">
                            <Label htmlFor="email" className="text-foreground/80 ml-2 font-bold text-sm sm:text-base italic">Email Address</Label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-4.5 sm:top-5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="your@email.com"
                                    className="pl-12 h-14 sm:h-16 bg-muted/20 border-2 border-transparent focus:border-primary/50 focus:ring-0 transition-all text-base sm:text-lg rounded-xl font-medium"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password" className="text-foreground/80 ml-2 font-bold text-sm sm:text-base italic">Password</Label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-4.5 sm:top-5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-12 h-14 sm:h-16 bg-muted/20 border-2 border-transparent focus:border-primary/50 focus:ring-0 transition-all text-base sm:text-lg rounded-xl font-medium"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <Button className="w-full h-14 sm:h-16 mt-4 font-black text-lg sm:text-xl shadow-[0_20px_50px_-12px_rgba(59,130,246,0.2)] hover:shadow-primary/30 active:scale-[0.98] transition-all bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl" disabled={loading}>
                            {loading ? "Magic in progress..." : (mode === "login" ? "Enter Workshop" : "Join the Guild")}
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center pb-8">
                    <p className="text-sm text-muted-foreground font-medium">
                        {mode === "login" ? "New to the workshop?" : "Already a member?"}{" "}
                        <button
                            onClick={() => setMode(mode === "login" ? "signup" : "login")}
                            className="text-primary hover:text-primary/70 hover:underline transition-all font-bold"
                        >
                            {mode === "login" ? "Create an account" : "Log in here"}
                        </button>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Auth;
