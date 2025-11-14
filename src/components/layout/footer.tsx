"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark, Settings, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const footerLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/settings", label: "Settings", icon: Settings },
];

export default function Footer() {
    const pathname = usePathname();

    return (
        <footer className="border-t bg-background/80 p-4 backdrop-blur-sm">
            <div className="container mx-auto flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Fort Knox Exchange</span>
                </div>
                <nav className="flex gap-4">
                     {footerLinks.map(link => (
                         <Link 
                            key={link.href}
                            href={link.href}
                            className={cn("text-muted-foreground hover:text-foreground", pathname === link.href && "text-primary")}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
                <div className="text-muted-foreground">
                    &copy; {new Date().getFullYear()} Fort Knox. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
