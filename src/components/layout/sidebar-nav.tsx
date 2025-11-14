
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Landmark,
  Home,
  CandlestickChart,
  ArrowRightLeft,
  Settings,
  UserCog,
  BookText,
  Wallet,
  Repeat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from "@/lib/types";

const mainLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/markets", label: "Markets", icon: CandlestickChart },
  { href: "/trade", label: "Trade", icon: ArrowRightLeft },
  { href: "/swap", label: "Swap", icon: Repeat },
  { href: "/portfolio", label: "Wallet", icon: Wallet },
  { href: "/ledger", label: "Ledger", icon: BookText },
];

const adminLink = { href: "/admin", label: "Admin", icon: UserCog };
const settingsLink = { href: "/settings", label: "Settings", icon: Settings };


export default function SidebarNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();
  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile } = useDoc<UserProfile>(userDocRef);

  const renderLink = (link: typeof mainLinks[0]) => (
    <SidebarMenuItem key={link.href}>
      <SidebarMenuButton
        asChild
        isActive={pathname === link.href}
        className="justify-start"
      >
        <Link href={link.href}>
          <link.icon className={cn("shrink-0 size-4", pathname === link.href && "text-sidebar-primary-foreground")}/>
          <span className={cn("truncate", pathname === link.href && "text-sidebar-primary-foreground font-semibold")}>{link.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Landmark className="h-8 w-8 text-sidebar-primary" />
          <div className="flex flex-col">
            <h2 className="font-headline text-lg font-semibold leading-tight text-sidebar-foreground">Fort Knox</h2>
            <p className="text-xs text-muted-foreground">Exchange</p>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex-1 p-2">
        <SidebarMenu>{mainLinks.map(renderLink)}</SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
            {userProfile?.isAdmin && renderLink(adminLink)}
            {renderLink(settingsLink)}
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
