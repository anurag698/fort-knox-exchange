"use client";

import { Progress } from "@/components/ui/progress";
import { Check, X } from "lucide-react";

interface PasswordStrengthProps {
    password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
    const requirements = [
        { label: "At least 8 characters", met: password.length >= 8 },
        { label: "Contains number", met: /\d/.test(password) },
        { label: "Contains special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
        { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
        { label: "Contains lowercase letter", met: /[a-z]/.test(password) },
    ];

    const strength = requirements.filter((r) => r.met).length * 20;

    const getColor = (score: number) => {
        if (score <= 20) return "bg-red-500";
        if (score <= 40) return "bg-orange-500";
        if (score <= 60) return "bg-yellow-500";
        if (score <= 80) return "bg-blue-500";
        return "bg-green-500";
    };

    return (
        <div className="space-y-3 mt-2">
            <div className="flex justify-between text-xs mb-1">
                <span>Password Strength</span>
                <span className="font-medium">
                    {strength <= 20 ? "Weak" : strength <= 60 ? "Medium" : "Strong"}
                </span>
            </div>
            <Progress value={strength} className={`h-2 ${getColor(strength)}`} />

            <div className="grid grid-cols-2 gap-2 mt-2">
                {requirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                        {req.met ? (
                            <Check className="w-3 h-3 text-green-500" />
                        ) : (
                            <X className="w-3 h-3 text-muted-foreground" />
                        )}
                        <span className={req.met ? "text-foreground" : "text-muted-foreground"}>
                            {req.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
