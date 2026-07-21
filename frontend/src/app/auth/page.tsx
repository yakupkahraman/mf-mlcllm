"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import Link from "next/link";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login by setting localStorage
    localStorage.setItem("auth", "true");
    router.push("/chat");
  };

  if (isChecking) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-pulse text-gray-500">Checking session...</div></div>;
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 font-sans relative overflow-hidden">
      {/* Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2 text-white font-bold tracking-tighter text-xl">
          <Shield className="w-6 h-6" />
          <span>LLM Sec</span>
        </Link>
      </div>

      <div className="bg-black border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-2xl relative z-10">
        <h2 className="text-2xl font-semibold text-white mb-2 text-center tracking-tight">
          {isLogin ? "Welcome back" : "Create an account"}
        </h2>
        <p className="text-sm text-gray-500 text-center mb-8">
          {isLogin ? "Enter your details to sign in to your account" : "Enter your details to create a new account"}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Name</label>
              <input
                type="text"
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/30 transition-colors"
                placeholder="John Doe"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          )}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Email</label>
            <input
              type="email"
              className="w-full bg-black border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/30 transition-colors"
              placeholder="hello@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Password</label>
            <input
              type="password"
              className="w-full bg-black border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/30 transition-colors"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-white text-black font-semibold py-2.5 rounded-lg hover:bg-gray-200 transition-colors mt-6 text-sm"
          >
            {isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <p className="text-gray-500 text-sm mt-6 text-center">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-white hover:underline">
            {isLogin ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}
