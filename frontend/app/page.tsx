import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 font-sans">
      <h1 className="text-5xl font-bold mb-6 tracking-tighter">LLM Monitor & Security</h1>
      <p className="text-gray-400 text-xl mb-12 max-w-2xl text-center">
        Real-time WebLLM interaction with built-in Prompt Injection Detection engine.
      </p>
      
      <div className="flex gap-4">
        <Link href="/auth" className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors">
          Get Started
        </Link>
        <Link href="/chat" className="px-6 py-3 border border-gray-700 text-white font-semibold rounded-lg hover:border-gray-500 transition-colors">
          Go to Console
        </Link>
      </div>
    </div>
  );
}
