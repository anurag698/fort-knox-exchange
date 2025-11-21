'use client';

import { Toaster as Sonner } from "sonner";
import { useTheme } from "next-themes";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = "system" } = useTheme();

    return (
        <Sonner
            theme={theme as ToasterProps["theme"]}
            className="toaster group"
            position="top-right"
            toastOptions={{
                classNames: {
                    toast:
                        "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-primary/20 group-[.toaster]:shadow-lg group-[.toaster]:backdrop-blur-sm",
                    description: "group-[.toast]:text-muted-foreground",
                    actionButton:
                        "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground hover:group-[.toast]:bg-primary/90",
                    cancelButton:
                        "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                    error: "group-[.toaster]:bg-destructive group-[.toaster]:text-destructive-foreground group-[.toaster]:border-destructive",
                    success: "group-[.toaster]:bg-green-500/10 group-[.toaster]:text-green-500 group-[.toaster]:border-green-500/20",
                    warning: "group-[.toaster]:bg-yellow-500/10 group-[.toaster]:text-yellow-500 group-[.toaster]:border-yellow-500/20",
                    info: "group-[.toaster]:bg-blue-500/10 group-[.toaster]:text-blue-500 group-[.toaster]:border-blue-500/20",
                },
            }}
            {...props}
        />
    );
};

export { Toaster };
