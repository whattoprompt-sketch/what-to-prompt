import { Link, useLocation } from "react-router-dom";
import { CircleHelp, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import LanguageSelector from "./LanguageSelector";
import { Button } from "./ui/button";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

const Navigation = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isAuthPage = location.pathname === "/auth";
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
      <div className="px-6 md:px-12">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link to="/" className="flex items-center gap-2 font-bold hover:opacity-80 transition-opacity group">
            <CircleHelp className="w-6 h-6 sm:w-7 sm:h-7 text-primary group-hover:rotate-12 transition-transform" />
            <span className="font-display text-lg sm:text-xl md:text-2xl tracking-tighter">
              <span className="hidden xs:inline">What To Prompt</span>
              <span className="xs:hidden">What To Prompt</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3 sm:gap-4 md:gap-6">
            <Link
              to="/help"
              className="text-xs sm:text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              {t('nav.help')}
            </Link>
            <Link
              to="/templates"
              className="text-xs sm:text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              {t('nav.templates')}
            </Link>
            {user && (
              <Link
                to="/history"
                className="text-xs sm:text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
              >
                History
              </Link>
            )}
            <LanguageSelector />
            {user ? (
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-xs sm:text-sm">
                Sign Out
              </Button>
            ) : !isAuthPage ? (
              <Link to="/auth">
                <Button variant="default" size="sm" className="text-xs sm:text-sm">
                  Sign In
                </Button>
              </Link>
            ) : null}
          </div>

          {/* Mobile Menu */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSelector />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <CircleHelp className="w-5 h-5 text-primary" />
                    WTP
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  <Link
                    to="/help"
                    className="text-base font-medium text-foreground/70 hover:text-foreground transition-colors py-2"
                    onClick={() => setOpen(false)}
                  >
                    {t('nav.help')}
                  </Link>
                  <Link
                    to="/templates"
                    className="text-base font-medium text-foreground/70 hover:text-foreground transition-colors py-2"
                    onClick={() => setOpen(false)}
                  >
                    {t('nav.templates')}
                  </Link>
                  {user && (
                    <Link
                      to="/history"
                      className="text-base font-medium text-foreground/70 hover:text-foreground transition-colors py-2"
                      onClick={() => setOpen(false)}
                    >
                      History
                    </Link>
                  )}
                  <div className="mt-4 border-t pt-4">
                    {user ? (
                      <Button variant="outline" className="w-full" onClick={handleSignOut}>
                        Sign Out
                      </Button>
                    ) : !isAuthPage ? (
                      <Link to="/auth" onClick={() => setOpen(false)}>
                        <Button variant="default" className="w-full">
                          Sign In
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
