"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Shield, LayoutDashboard, Terminal, LogOut, Loader2 } from "lucide-react";
import { WebLLMProvider } from "@/context/WebLLMContext";
import { Button, buttonVariants } from "@/components/ui/button";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Simple auth guard
    const authStatus = localStorage.getItem("auth");
    if (!authStatus) {
      router.replace("/auth");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const handleSignOut = () => {
    localStorage.removeItem("auth");
    router.replace("/");
  };

  // Prevent flashing content while checking auth
  if (isAuthenticated === null) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <WebLLMProvider>
      <div className="min-h-screen bg-background text-foreground font-sans flex flex-col relative overflow-hidden">
        {/* Global Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />

        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
          <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-6">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2 text-foreground font-bold tracking-tighter">
                <Shield className="w-5 h-5 text-primary" />
                <span>LLM Sec</span>
              </Link>
              
              <nav className="flex items-center gap-2 text-sm font-medium">
                <Link 
                  href="/chat"
                  className={buttonVariants({ variant: pathname === "/chat" ? "secondary" : "ghost", size: "sm" })}
                >
                  <Terminal className="w-4 h-4 mr-2" />
                  Console
                </Link>
                <Link 
                  href="/dashboard"
                  className={buttonVariants({ variant: pathname === "/dashboard" ? "secondary" : "ghost", size: "sm" })}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center">
              <Button 
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-6xl mx-auto py-8 px-4">
          {children}
        </main>
      </div>
    </WebLLMProvider>
  );
}
