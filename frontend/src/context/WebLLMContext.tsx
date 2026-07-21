"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { CreateWebWorkerMLCEngine, InitProgressReport } from "@mlc-ai/web-llm";

type WebLLMContextType = {
  engine: any;
  isModelLoaded: boolean;
  isModelLoading: boolean;
  progressText: string;
  progressValue: number;
};

const WebLLMContext = createContext<WebLLMContextType | undefined>(undefined);

export function WebLLMProvider({ children }: { children: React.ReactNode }) {
  const [engine, setEngine] = useState<any>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [progressText, setProgressText] = useState("Initializing Auto-Load...");
  const [progressValue, setProgressValue] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const loadModel = async () => {
      if (engine || isModelLoading) return; // Prevent double load
      setIsModelLoading(true);
      setProgressText("Initializing WebLLM Engine...");
      
      try {
        const initProgressCallback = (report: InitProgressReport) => {
          if (!isMounted) return;
          setProgressText(report.text);
          setProgressValue(report.progress * 100);
        };

        const newEngine = await CreateWebWorkerMLCEngine(
          new Worker(new URL("../app/(app)/chat/worker.ts", import.meta.url), { type: "module" }),
          "Llama-3-8B-Instruct-q4f32_1-MLC",
          { initProgressCallback }
        );
        
        if (isMounted) {
          setEngine(newEngine);
          setProgressText("Model Loaded Automatically");
          setIsModelLoaded(true);
          setIsModelLoading(false);
        }
      } catch (err) {
        console.error("Engine init error:", err);
        if (isMounted) {
          setProgressText("Error loading model. Check console.");
          setIsModelLoading(false);
        }
      }
    };

    loadModel();

    return () => {
      isMounted = false;
    };
  }, [engine]);

  return (
    <WebLLMContext.Provider
      value={{
        engine,
        isModelLoaded,
        isModelLoading,
        progressText,
        progressValue,
      }}
    >
      {children}
    </WebLLMContext.Provider>
  );
}

export function useWebLLM() {
  const context = useContext(WebLLMContext);
  if (context === undefined) {
    throw new Error("useWebLLM must be used within a WebLLMProvider");
  }
  return context;
}
