"use client";

import Link from 'next/link';
import { Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // If already authenticated, redirect to /chat
    if (localStorage.getItem("auth")) {
      router.replace("/chat");
    } else {
      setIsChecking(false);
    }
  }, [router]);

  if (isChecking) {
    return <div className="min-h-screen bg-black" />;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
      {/* Navbar for Landing Page */}
      <header className="absolute top-0 w-full p-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-2 font-bold tracking-tighter text-xl">
          <Shield className="w-6 h-6" />
          <span>LLM Sec</span>
        </div>
        <Link href="/auth" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
          Sign In
        </Link>
      </header>

      {/* Vercel-like glowing triangle/center piece */}
      <div className="relative flex items-center justify-center w-full h-[300px] mb-8">
        <div className="absolute w-[400px] h-[400px] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-[100px] rounded-full mix-blend-screen" />
        <div className="absolute w-0 h-0 border-l-[60px] border-l-transparent border-r-[60px] border-r-transparent border-b-[100px] border-b-white opacity-90 drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]" />
      </div>

      <div className="z-10 flex flex-col items-center text-center px-4 max-w-3xl">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tighter leading-tight">
          Agentic Security <br /> Infrastructure
        </h1>
        <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-2xl font-light">
          Real-time WebLLM interaction with built-in Prompt Injection Detection engine. Ship safe and reliable AI agents instantly.
        </p>
        
        <Link 
          href="/auth" 
          className="px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-200 hover:scale-105 transition-all duration-300 flex items-center gap-2 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
        >
          Get Started
        </Link>
      </div>

      {/* Simple Footer */}
      <footer className="absolute bottom-6 text-gray-600 text-sm font-mono flex gap-8">
        <span>Protected by Regex Engine</span>
        <span>Runs locally on WebGPU</span>
      </footer>
    </div>
  );
}
