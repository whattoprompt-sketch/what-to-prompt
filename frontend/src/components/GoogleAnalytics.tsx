import { useEffect } from "react";
import { useLocation } from "react-router-dom";

declare global {
    interface Window {
        dataLayer: any[];
        gtag: (...args: any[]) => void;
    }
}

const GoogleAnalytics = () => {
    const location = useLocation();
    const gaId = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;

    useEffect(() => {
        if (!gaId) return;

        // Inject Script if not present
        const scriptId = "ga-script";
        if (!document.getElementById(scriptId)) {
            const script = document.createElement("script");
            script.id = scriptId;
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
            document.head.appendChild(script);

            window.dataLayer = window.dataLayer || [];
            window.gtag = function () {
                window.dataLayer.push(arguments);
            };
            window.gtag("js", new Date());
            window.gtag("config", gaId);
        }
    }, [gaId]);

    // Track Page Views on Route Change
    useEffect(() => {
        if (!gaId || !window.gtag) return;
        window.gtag("config", gaId, {
            page_path: location.pathname + location.search,
        });
    }, [location, gaId]);

    return null;
};

export default GoogleAnalytics;
