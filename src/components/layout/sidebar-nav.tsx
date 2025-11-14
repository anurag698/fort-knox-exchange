
'use client';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { CandlestickChart, ArrowRightLeft, Repeat, Wallet, BookText, UserCog } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

const mainLinks = [
  { href: "/markets", label: "Markets", icon: CandlestickChart },
  { href: "/trade", label: "Trade", icon: ArrowRightLeft },
  { href: "/swap", label: "Swap", icon: Repeat },
  { href: "/portfolio", label: "Wallet", icon: Wallet },
  { href: "/ledger", label: "Ledger", icon: BookText },
];

const adminLink = { href: "/admin", label: "Admin", icon: UserCog };

export default function SidebarNav() {
    const pathname = usePathname();
    const { user } = useUser();
    const firestore = useFirestore();
    const userDocRef = useMemoFirebase(
      () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
      [firestore, user]
    );
    const { data: userProfile } = useDoc<UserProfile>(userDocRef);

    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow p-2">
                <SidebarMenu>
                    {mainLinks.map((link) => (
                        <SidebarMenuItem key={link.href}>
                            <Link href={link.href} passHref>
                                <SidebarMenuButton
                                    asChild
                                    isActive={pathname.startsWith(link.href)}
                                    tooltip={link.label}
                                >
                                    <div>
                                        <link.icon />
                                        <span>{link.label}</span>
                                    </div>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                    ))}
                    {userProfile?.isAdmin && (
                        <SidebarMenuItem>
                             <Link href={adminLink.href} passHref>
                                <SidebarMenuButton
                                    asChild
                                    isActive={pathname.startsWith(adminLink.href)}
                                    tooltip={adminLink.label}
                                >
                                    <div>
                                        <adminLink.icon />
                                        <span>{adminLink.label}</span>
                                    </div>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                    )}
                </SidebarMenu>
            </div>
        </div>
    );
}
