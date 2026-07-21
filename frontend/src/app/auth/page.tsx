"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    // Dummy login/register for now. In real app, call API.
    router.push("/chat");
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8 font-sans">
      <div className="bg-gray-900 border border-gray-800 p-8 rounded-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          {isLogin ? "Sign In" : "Create Account"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Name</label>
              <input
                type="text"
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gray-500"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gray-500"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gray-500"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-white text-black font-bold py-2 rounded-lg hover:bg-gray-200 transition-colors mt-4">
            {isLogin ? "Login" : "Register"}
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
