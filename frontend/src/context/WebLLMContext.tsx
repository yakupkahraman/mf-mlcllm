"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { CreateWebWorkerMLCEngine, InitProgressReport, hasModelInCache } from "@mlc-ai/web-llm";

const MODEL_ID = "gemma-2b-it-q4f16_1-MLC";

type WebLLMContextType = {
  engine: any;
  isModelLoaded: boolean;
  isModelLoading: boolean;
  progressText: string;
  progressValue: number;
  loadModel: () => Promise<void>;
};

const WebLLMContext = createContext<WebLLMContextType | undefined>(undefined);

export function WebLLMProvider({ children }: { children: React.ReactNode }) {
  const [engine, setEngine] = useState<any>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [progressText, setProgressText] = useState("Model is not loaded");
  const [progressValue, setProgressValue] = useState(0);

  const loadModel = async () => {
    if (engine || isModelLoading) return;
    setIsModelLoading(true);
    setProgressText("Initializing WebLLM Engine...");
    
    try {
      const initProgressCallback = (report: InitProgressReport) => {
        setProgressText(report.text);
        setProgressValue(report.progress * 100);
      };

      const newEngine = await CreateWebWorkerMLCEngine(
        new Worker(new URL("../app/(app)/chat/worker.ts", import.meta.url), { type: "module" }),
        MODEL_ID,
        { initProgressCallback }
      );
      
      setEngine(newEngine);
      setProgressText("Model Loaded");
      setIsModelLoaded(true);
      setIsModelLoading(false);
    } catch (err) {
      console.error("Engine init error:", err);
      setProgressText("Error loading model. Check console.");
      setIsModelLoading(false);
    }
  };

  useEffect(() => {
    // Check if model is already in cache on mount
    hasModelInCache(MODEL_ID).then((isCached) => {
      if (isCached) {
        setProgressText("Model found in cache. Auto-loading...");
        loadModel();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <WebLLMContext.Provider
      value={{
        engine,
        isModelLoaded,
        isModelLoading,
        progressText,
        progressValue,
        loadModel,
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
