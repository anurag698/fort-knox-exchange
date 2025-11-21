"use client";

import { useUser } from "@/providers/azure-auth-provider";
import { TwoFactorVerificationModal } from "./two-factor-verification-modal";
import { useEffect, useState } from "react";

export function TwoFactorGuard() {
    const { requires2FA, verify2FA, signOut } = useUser();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setIsOpen(requires2FA);
    }, [requires2FA]);

    const handleVerify = async (code: string) => {
        const success = await verify2FA(code);
        if (success) {
            setIsOpen(false);
        }
        return success;
    };

    const handleCancel = () => {
        // If they cancel 2FA, we should probably sign them out or keep the modal open
        // For security, let's sign them out
        signOut();
        setIsOpen(false);
    };

    if (!requires2FA) return null;

    return (
        <TwoFactorVerificationModal
            isOpen={isOpen}
            onVerify={handleVerify}
            onCancel={handleCancel}
        />
    );
}
