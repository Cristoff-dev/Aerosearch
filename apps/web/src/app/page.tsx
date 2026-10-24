import { SearchOmnibox } from "@/components/SearchOmnibox";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-6 md:p-24 overflow-hidden">
      {}
      <div className="pointer-events-none absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 blur-[120px] opacity-20">
        <div className="h-[300px] w-[600px] rounded-full bg-indigo-500 mix-blend-screen" />
      </div>

      <div className="z-10 w-full max-w-5xl flex-col flex gap-12 items-center">
        {}
        <div className="text-center space-y-5 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-mono text-zinc-400 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Operational Hybrid Systems
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-500">
            AeroSearch.
          </h1>
          
          <p className="max-w-2xl mx-auto text-base md:text-lg text-zinc-400 font-mono leading-relaxed">
            Zero-latency search engine. Combining <span className="text-zinc-200 font-medium">Redis</span> speed, <span className="text-zinc-200 font-medium">Typesense</span> precision, and <span className="text-zinc-200 font-medium">PostgreSQL</span> semantics.
          </p>
        </div>

        {}
        <div className="w-full mt-4">
          <SearchOmnibox />
        </div>
      </div>
    </main>
  );
}