
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogOut, Settings, LogIn, Landmark, Home, CandlestickChart, ArrowRightLeft, Wallet, BookText, Repeat, UserCog, Database, Menu } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Link from 'next/link';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter, usePathname } from "next/navigation";
import { clearSession } from "@/app/actions";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/lib/types";


const mainLinks = [
  { href: "/markets", label: "Markets", icon: CandlestickChart },
  { href: "/trade/BTC-USDT", label: "Trade", icon: ArrowRightLeft },
  { href: "/swap", label: "Swap", icon: Repeat },
  { href: "/portfolio", label: "Wallet", icon: Wallet },
  { href: "/ledger", label: "Ledger", icon: BookText },
];

const adminLink = { href: "/admin", label: "Admin", icon: UserCog };
const seedDataLink = { href: "/seed-data", label: "Update Data", icon: Database };


export default function Header() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const firestore = useFirestore();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (firestore && user?.uid) {
        const fetchProfile = async () => {
          const userDocRef = doc(firestore, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
              const data = docSnap.data();
              if (data) {
                 setUserProfile({ ...data, id: docSnap.id } as UserProfile);
              }
          } else {
              setUserProfile(null);
          }
        };
        fetchProfile();
    }
  }, [firestore, user?.uid]);


  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
      await clearSession();
      router.push('/auth');
    }
  };

  const getAvatarFallback = () => {
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'FK';
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Landmark className="h-7 w-7 text-primary" />
          <div className="hidden flex-col md:flex">
            <h2 className="font-headline text-lg font-semibold leading-tight text-foreground">Fort Knox</h2>
            <p className="text-xs text-muted-foreground">Exchange</p>
          </div>
        </Link>
        
        <nav className="hidden items-center gap-2 md:flex">
          {mainLinks.map((link) => (
             <Button key={link.label} asChild variant="link" className={cn("text-sm font-medium", pathname.startsWith(link.href) ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
                <Link href={link.href}>{link.label}</Link>
             </Button>
          ))}
          {userProfile?.isAdmin && (
               <Button asChild variant="link" className={cn("text-sm font-medium", pathname.startsWith(adminLink.href) ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
                  <Link href={adminLink.href}>{adminLink.label}</Link>
               </Button>
          )}
        </nav>

      </div>

      <div className="flex items-center gap-4">
        {isUserLoading ? (
         <Avatar className="h-9 w-9 animate-pulse bg-muted rounded-full" />
        ) : user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                {user.photoURL ? (
                  <AvatarImage src={user.photoURL} alt="User avatar" />
                ) : userAvatar ? (
                  <AvatarImage src={userAvatar.imageUrl} alt="User avatar" data-ai-hint={userAvatar.imageHint} />
                ) : null}
                <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {userProfile?.username || user.email?.split('@')[0]}
                </p>              
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
             {userProfile?.isAdmin && (
                <>
                <DropdownMenuItem asChild>
                    <Link href={adminLink.href}>
                        <adminLink.icon className="mr-2 h-4 w-4" />
                        <span>{adminLink.label}</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={seedDataLink.href}>
                        <seedDataLink.icon className="mr-2 h-4 w-4" />
                        <span>{seedDataLink.label}</span>
                    </Link>
                </DropdownMenuItem>
                </>
             )}
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href="/auth">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Link>
          </Button>
        )}
         <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open main menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <nav className="grid gap-6 text-lg font-medium mt-8">
              {mainLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn("flex items-center gap-4 text-muted-foreground hover:text-foreground", pathname.startsWith(link.href) && "text-foreground")}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </Link>
              ))}
               {userProfile?.isAdmin && (
                 <Link
                    href={adminLink.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn("flex items-center gap-4 text-muted-foreground hover:text-foreground", pathname.startsWith(adminLink.href) && "text-foreground")}
                  >
                    <adminLink.icon className="h-5 w-5" />
                    {adminLink.label}
                  </Link>
               )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
