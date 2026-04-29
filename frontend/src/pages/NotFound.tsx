import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-9xl font-black text-primary/10 select-none">404</h1>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Oops! Page not found</h2>
          <p className="text-muted-foreground max-w-xs mx-auto">
            The page you're looking for doesn't exist or has been moved to another dimension.
          </p>
        </div>
        <Link to="/" className="inline-block">
          <Button size="lg" className="rounded-xl font-bold gap-2">
            <Home className="w-4 h-4" />
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
