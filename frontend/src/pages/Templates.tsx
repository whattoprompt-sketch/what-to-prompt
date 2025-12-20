import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import Footer from "@/components/Footer";

const Templates = () => {
  return (
    <>
      <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Templates</h1>
            <p className="text-lg text-muted-foreground">
              Pre-built prompt templates to get you started faster
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Coming Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We're working on creating useful prompt templates for various use cases. Check back soon!
              </p>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Templates;
