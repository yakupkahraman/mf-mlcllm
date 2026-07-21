"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Shield, LayoutDashboard, Terminal, LogOut } from "lucide-react";

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
    return <div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-pulse text-gray-500">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen bg-black text-gray-200 font-sans flex flex-col relative overflow-hidden">
      {/* Global Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-white/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-white font-bold tracking-tighter">
              <Shield className="w-5 h-5" />
              <span>LLM Sec</span>
            </Link>
            
            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link 
                href="/chat" 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${pathname === "/chat" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
              >
                <Terminal className="w-4 h-4" />
                Console
              </Link>
              <Link 
                href="/dashboard" 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${pathname === "/dashboard" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center">
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto py-8">
        {children}
      </main>
    </div>
  );
}
