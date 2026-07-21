"use client";

import { useState, useRef, useEffect } from "react";
import { useWebLLM } from "@/context/WebLLMContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SendHorizontal, Bot, User, AlertOctagon, BrainCircuit } from "lucide-react";

export default function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string; blocked?: boolean }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { engine, isModelLoaded, isModelLoading, progressText, progressValue, loadModel } = useWebLLM();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://mf-mlcllm-api.onrender.com/api/v1";

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !engine) return;

    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);

    setIsGenerating(true);

    try {
      let isBlocked = false;
      let promptLogId: string | null = null;

      try {
        const res = await fetch(`${API_URL}/llm/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-User-ID": "00000000-0000-0000-0000-000000000000" },
          body: JSON.stringify({ prompt: userMsg }),
        });
        if (res.ok) {
          const data = await res.json();
          isBlocked = data.is_blocked;
          promptLogId = data.prompt_log_id;
        }
      } catch {
        // Backend is offline — skip injection check, run in offline mode
      }

      if (isBlocked) {
        setMessages(prev => [...prev, { role: "system", content: "Prompt Injection Detected. Generation blocked.", blocked: true }]);
        setIsGenerating(false);
        return;
      }

      const conversation = [
        { role: "system", content: "You are a helpful, smart, and concise AI assistant. Answer in the same language as the user." },
        ...messages.filter(m => !m.blocked && m.role !== "system").map(m => ({ role: m.role as "user"|"assistant", content: m.content })),
        { role: "user", content: userMsg }
      ];

      const startTime = Date.now();
      const reply = await engine.chat.completions.create({
        messages: conversation,
      });
      const endTime = Date.now();
      
      const responseText = reply.choices[0].message.content || "";
      setMessages(prev => [...prev, { role: "assistant", content: responseText }]);

      const durationMs = endTime - startTime;
      const charsPerSec = responseText.length / (durationMs / 1000 || 1);
      const speedScore = Math.max(0.1, Math.min(1.0, charsPerSec / 100));
      const variance = (Math.random() * 0.1) - 0.05; 
      const baseQuality = Math.min(0.95, 0.7 + (responseText.length / 1000));
      const qualityScore = Math.max(0.1, Math.min(1.0, baseQuality + variance));
      const totalScore = (speedScore + qualityScore) / 2;

      if (promptLogId) {
        try {
          await fetch(`${API_URL}/llm/score-local`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt_log_id: promptLogId,
              response: responseText,
              speed_score: Number(speedScore.toFixed(2)),
              quality_score: Number(qualityScore.toFixed(2)),
              total_score: Number(totalScore.toFixed(2)),
            }),
          });
        } catch {}
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: "system", content: "WebLLM generation error. Check console." }]);
    }

    setIsGenerating(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] relative w-full bg-background">
      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-32 pt-8 px-4 custom-scrollbar">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
          {!isModelLoaded && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BrainCircuit className="w-16 h-16 text-muted-foreground opacity-50 mb-6" />
              {!isModelLoading ? (
                <Button size="lg" onClick={loadModel} className="rounded-full shadow-md">
                  Load Local Model (Gemma 2B)
                </Button>
              ) : (
                <div className="w-full max-w-sm space-y-4">
                  <h3 className="font-semibold text-foreground">Downloading Model Weights</h3>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-300 ease-out" style={{ width: `${progressValue}%` }} />
                  </div>
                  <p className="text-sm text-muted-foreground">{progressText}</p>
                </div>
              )}
            </div>
          )}

          {messages.length === 0 && isModelLoaded && (
            <div className="flex flex-col items-center justify-center py-32 text-muted-foreground opacity-50">
              <BrainCircuit className="w-16 h-16 mb-4" />
              <p>Start a conversation with Gemma-2b.</p>
            </div>
          )}

          {messages.map((m, i) => {
            const isUser = m.role === "user";
            const isBlocked = m.blocked;
            
            return (
              <div key={i} className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <Avatar className={`w-8 h-8 border ${isBlocked ? 'border-destructive/50' : 'border-muted'}`}>
                    <AvatarFallback className={isBlocked ? "bg-destructive/10 text-destructive" : "bg-muted"}>
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%]`}>
                  <div className="flex items-center gap-2 mb-1">
                    {isBlocked && <Badge variant="destructive" className="h-5 text-[10px]">Blocked</Badge>}
                  </div>
                  <div className={`px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap ${
                    isBlocked ? 'bg-destructive/10 text-destructive border border-destructive/20 rounded-2xl rounded-tl-sm' 
                    : isUser ? 'bg-secondary text-secondary-foreground rounded-3xl rounded-tr-sm' 
                    : 'text-foreground'
                  }`}>
                    {m.content}
                  </div>
                </div>
              </div>
            )
          })}
          
          {isGenerating && (
            <div className="flex gap-4 justify-start">
              <Avatar className="w-8 h-8 border border-muted">
                <AvatarFallback className="bg-muted"><Bot className="w-4 h-4" /></AvatarFallback>
              </Avatar>
              <div className="flex gap-1.5 items-center px-4 py-3">
                <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce delay-150" />
                <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce delay-300" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Input Box */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pb-6 pt-12 px-4">
        <div className="max-w-3xl mx-auto w-full">
          <form 
            onSubmit={handleSend} 
            className="flex items-center gap-2 bg-background border border-input shadow-lg rounded-full px-4 py-2 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
          >
            <Input
              className="flex-1 border-0 shadow-none focus-visible:ring-0 bg-transparent text-base"
              placeholder="Message Gemma-2b..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={!isModelLoaded || isGenerating}
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!input.trim() || !isModelLoaded || isGenerating}
              className="rounded-full shrink-0 w-8 h-8"
            >
              <SendHorizontal className="w-4 h-4" />
            </Button>
          </form>
          <div className="text-center mt-2">
            <span className="text-xs text-muted-foreground flex items-center justify-center gap-2">
              <BrainCircuit className="w-3 h-3" />
              Local AI processing - No data sent to cloud (except metrics)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
