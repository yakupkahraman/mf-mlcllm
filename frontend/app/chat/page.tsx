"use client";

import { useState, useEffect, useRef } from "react";
import { CreateWebWorkerMLCEngine, MLCEngine, InitProgressReport } from "@mlc-ai/web-llm";

export default function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string; blocked?: boolean }[]>([]);
  const [engine, setEngine] = useState<any>(null);
  const [progress, setProgress] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

  useEffect(() => {
    async function init() {
      const initProgressCallback = (report: InitProgressReport) => {
        setProgress(report.text);
      };
      
      const newEngine = await CreateWebWorkerMLCEngine(
        new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
        "gemma-2b-it-q4f32_1-MLC",
        { initProgressCallback }
      );
      setEngine(newEngine);
      setProgress("Model Loaded");
    }
    init();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !engine) return;

    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);

    setIsGenerating(true);

    try {
      // 1. Submit for injection detection
      const res = await fetch(`${API_URL}/llm/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-ID": "00000000-0000-0000-0000-000000000000" },
        body: JSON.stringify({ prompt: userMsg }),
      });
      const data = await res.json();

      if (data.is_blocked) {
        setMessages(prev => [...prev, { role: "system", content: "🚨 WARNING: Prompt Injection Detected. Generation blocked.", blocked: true }]);
        setIsGenerating(false);
        return;
      }

      // 2. Generate with WebLLM
      const reply = await engine.chat.completions.create({
        messages: [{ role: "user", content: userMsg }],
      });
      
      const responseText = reply.choices[0].message.content;
      setMessages(prev => [...prev, { role: "assistant", content: responseText || "" }]);

      // 3. Score
      await fetch(`${API_URL}/llm/score-local`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt_log_id: data.prompt_log_id,
          response: responseText,
          speed_score: 0.9,
          quality_score: 0.85,
          total_score: 0.87,
        }),
      });

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: "system", content: "Error communicating with server." }]);
    }

    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 p-8 font-mono">
      <div className="max-w-4xl mx-auto flex flex-col h-[90vh]">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tighter text-white">Console</h1>
          <span className="text-sm bg-gray-800 px-3 py-1 rounded text-green-400">{progress || "Loading Model..."}</span>
        </div>
        
        <div className="flex-1 overflow-y-auto bg-gray-900 border border-gray-800 rounded-lg p-6 flex flex-col gap-4">
          {messages.map((m, i) => (
            <div key={i} className={`p-4 rounded-md ${m.role === "user" ? "bg-gray-800 self-end ml-12" : m.blocked ? "bg-red-900/50 border border-red-500 self-start mr-12 text-red-200" : "bg-black border border-gray-700 self-start mr-12"}`}>
              <p className="text-xs text-gray-500 mb-1 capitalize">{m.role}</p>
              <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
            </div>
          ))}
          {isGenerating && <div className="text-gray-500 animate-pulse">Generating...</div>}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-500"
            placeholder="Enter prompt..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            disabled={!engine || isGenerating}
          />
          <button 
            onClick={handleSend}
            disabled={!engine || isGenerating}
            className="bg-white text-black px-6 font-semibold rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
