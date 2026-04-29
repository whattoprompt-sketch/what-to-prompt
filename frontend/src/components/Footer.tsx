import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { CircleHelp } from "lucide-react";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="py-4 sm:py-6 border-t mt-8 sm:mt-12 bg-muted/10">
      <div className="px-6 md:px-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-8">
            <Link to="/" className="flex items-center gap-2 group decoration-primary hover:underline underline-offset-4">
              <CircleHelp className="w-5 h-5 text-primary group-hover:rotate-12 transition-transform" />
              <span className="font-bold text-sm sm:text-base font-display tracking-tight">What To Prompt</span>
            </Link>
            <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
              {t('nav.contact')}
            </Link>
          </div>
          <div className="text-center md:text-right space-y-1">
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              © {new Date().getFullYear()} What To Prompt. All rights reserved.
            </p>

          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
