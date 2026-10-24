'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ISearchResponse } from '@aerosearch/shared';
import { ProductCard } from './ProductCard';
import { Search, Sparkles, Loader2, Command } from 'lucide-react';

export function SearchOmnibox() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [useSemantic, setUseSemantic] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {

      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault(); 
        inputRef.current?.focus();
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setQuery('');
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading, isError } = useQuery<ISearchResponse>({
    queryKey: ['search', debouncedQuery, useSemantic],
    queryFn: async () => {
      if (!debouncedQuery.trim()) throw new Error('Empty query');

      const url = new URL('http://localhost:3000/api/v1/search');
      url.searchParams.set('q', debouncedQuery);
      if (useSemantic) url.searchParams.set('useSemantic', 'true');

      const res = await fetch(url.toString(), {

        headers: { 'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '' } 
      });
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    },
    enabled: debouncedQuery.trim().length > 0,
    retry: false,
  });

  const hasResults = data?.status === 'success' && data.data.hits.length > 0;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {}
      <motion.div 
        layout
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/80 p-2 shadow-[0_0_50px_-12px_rgba(0,0,0,0.8)] backdrop-blur-2xl ring-1 ring-white/5"
      >
        <div className="flex items-center px-4 gap-3">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
          ) : (
            <Search className="h-5 w-5 text-zinc-500" />
          )}

          <input
            ref={inputRef}
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search laptops, accessories, or describe your issue..."
            className="w-full bg-transparent py-4 text-lg text-zinc-100 placeholder-zinc-600 focus:outline-none selection:bg-indigo-500/30"
          />

          <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-mono text-zinc-400">
            <Command className="h-3 w-3" /> <span>K</span>
          </div>
        </div>

        {}
        <div className="flex items-center justify-between border-t border-white/5 bg-zinc-950/50 px-4 py-3">
          <button
            onClick={() => setUseSemantic(!useSemantic)}
            className={`group flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              useSemantic 
                ? 'bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/30 shadow-[0_0_20px_-5px_rgba(99,102,241,0.4)]' 
                : 'bg-white/5 text-zinc-400 hover:text-zinc-200 ring-1 ring-white/5 hover:bg-white/10'
            }`}
          >
            <Sparkles className={`h-3.5 w-3.5 transition-transform group-hover:scale-110 ${useSemantic ? 'text-indigo-400' : 'text-zinc-500'}`} />
            pgvector AI Search
          </button>

          {data?.data && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-mono text-[10px] text-zinc-500">
              <strong className="text-zinc-300">{data.data.found}</strong> results in <strong className="text-zinc-300">{data.data.searchTimeMs}ms</strong>
            </motion.div>
          )}
        </div>
      </motion.div>

      {}
      <AnimatePresence mode="popLayout">
        {hasResults && (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {data.data.hits.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                source={data.data.source} 
                time={data.data.searchTimeMs} 
              />
            ))}
          </motion.div>
        )}

        {debouncedQuery && !isLoading && !hasResults && !isError && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-center py-12 text-zinc-500 text-sm font-mono"
          >
            No results found for "{debouncedQuery}"
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}