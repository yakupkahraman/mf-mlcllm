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
    <div className="flex flex-col h-[85vh] max-w-4xl mx-auto w-full">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
          <BrainCircuit className="w-6 h-6" /> Local Chat
        </h2>
        <Badge variant={isModelLoaded ? "default" : "secondary"} className={isModelLoaded ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}>
          {progressText}
        </Badge>
      </div>
      
      <Card className="flex-1 flex flex-col relative overflow-hidden bg-background shadow-2xl border-muted/50">
          
        {/* Overlay for loading model */}
        {!isModelLoaded && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center z-10">
            {!isModelLoading ? (
              <Button size="lg" onClick={loadModel} className="shadow-lg font-semibold px-8 py-6 text-lg">
                Load Local Model (Gemma 2B)
              </Button>
            ) : (
              <Card className="w-full max-w-md p-6 bg-card border-muted shadow-xl">
                <h3 className="font-bold mb-4 text-center text-foreground">Downloading Model Weights</h3>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-primary transition-all duration-300 ease-out" style={{ width: `${progressValue}%` }} />
                </div>
                <p className="text-sm text-muted-foreground text-center mb-4">{progressText}</p>
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-md flex items-start gap-2">
                  <AlertOctagon className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                  <p className="text-xs text-yellow-600/90 leading-relaxed">
                    This process will consume GPU RAM. Please do not close the tab during initialization.
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-6 custom-scrollbar">
          {messages.length === 0 && isModelLoaded && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
              <BrainCircuit className="w-16 h-16 mb-4" />
              <p>Start a conversation with Gemma-2b.</p>
            </div>
          )}

          {messages.map((m, i) => {
            const isUser = m.role === "user";
            const isBlocked = m.blocked;
            
            return (
              <div key={i} className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <Avatar className={`w-8 h-8 border ${isBlocked ? 'border-destructive/50' : isUser ? 'border-primary/20' : 'border-muted'}`}>
                  {isUser ? (
                    <AvatarFallback className="bg-primary/10 text-primary"><User className="w-4 h-4" /></AvatarFallback>
                  ) : (
                    <AvatarFallback className={isBlocked ? "bg-destructive/10 text-destructive" : "bg-muted"}><Bot className="w-4 h-4" /></AvatarFallback>
                  )}
                </Avatar>
                <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-muted-foreground">{isUser ? 'You' : 'Assistant'}</span>
                    {isBlocked && <Badge variant="destructive" className="h-5 text-[10px]">Blocked</Badge>}
                  </div>
                  <div className={`p-3 rounded-xl shadow-sm text-sm whitespace-pre-wrap leading-relaxed ${
                    isBlocked ? 'bg-destructive/10 text-destructive-foreground border border-destructive/20 rounded-tl-none' 
                    : isUser ? 'bg-primary text-primary-foreground rounded-tr-none' 
                    : 'bg-muted/50 border border-muted text-foreground rounded-tl-none'
                  }`}>
                    {m.content}
                  </div>
                </div>
              </div>
            )
          })}
          
          {isGenerating && (
            <div className="flex gap-4 flex-row">
              <Avatar className="w-8 h-8 border border-muted">
                <AvatarFallback className="bg-muted"><Bot className="w-4 h-4" /></AvatarFallback>
              </Avatar>
              <div className="bg-muted/50 border border-muted rounded-xl rounded-tl-none p-4 flex gap-1.5 items-center">
                <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce delay-150" />
                <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce delay-300" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border bg-card">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              className="flex-1 shadow-sm"
              placeholder="Message Gemma-2b..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={!isModelLoaded || isGenerating}
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!input.trim() || !isModelLoaded || isGenerating}
              className="shadow-sm"
            >
              <SendHorizontal className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
