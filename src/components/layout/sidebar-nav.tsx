
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
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/markets", label: "Markets", icon: CandlestickChart },
  { href: "/trade", label: "Trade", icon: ArrowRightLeft },
  { href: "/portfolio", label: "Wallet", icon: Wallet },
  { href: "/ledger", label: "Ledger", icon: BookText },
];

const bottomLinks = [
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function SidebarNav() {
  const pathname = usePathname();

  const renderLink = (link: typeof mainLinks[0]) => (
    <SidebarMenuItem key={link.href}>
      <SidebarMenuButton
        asChild
        isActive={pathname === link.href}
        tooltip={{ children: link.label, side: 'right', align: 'center' }}
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
        <SidebarMenu>{mainLinks.map(link => renderLink(link))}</SidebarMenu>
         <SidebarMenu className="mt-4 border-t border-sidebar-border pt-4">
            <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/admin')}
                tooltip={{ children: "Admin", side: 'right', align: 'center' }}
                className="justify-start"
            >
                <Link href="/admin">
                    <UserCog className={cn("shrink-0 size-4", pathname.startsWith('/admin') && "text-sidebar-primary-foreground")}/>
                    <span className={cn("truncate", pathname.startsWith('/admin') && "text-sidebar-primary-foreground font-semibold")}>Admin</span>
                </Link>
            </SidebarMenuButton>
             {pathname.startsWith('/admin') && (
                <div className="ml-4 mt-2 flex flex-col gap-1 border-l border-sidebar-border pl-4">
                     <SidebarMenuButton
                        asChild
                        size="sm"
                        isActive={pathname === '/admin'}
                        className="justify-start"
                     >
                        <Link href="/admin">Dashboard</Link>
                    </SidebarMenuButton>
                     <SidebarMenuButton
                        asChild
                        size="sm"
                        isActive={pathname.startsWith('/admin/users')}
                        className="justify-start"
                     >
                        <Link href="/admin/users">Users</Link>
                    </SidebarMenuButton>
                </div>
            )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>{bottomLinks.map(link => renderLink(link))}</SidebarMenu>
      </SidebarFooter>
    </>
  );
}
