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

      {/* Animated Glowing Background Blobs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-[400px] z-0 pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-blob animation-delay-4000"></div>
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
