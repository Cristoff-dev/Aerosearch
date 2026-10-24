'use client';

import { motion } from 'framer-motion';
import { IProduct } from '@aerosearch/shared';
import { SafeHighlight } from './SafeHighlight';
import { Cpu, Zap } from 'lucide-react';

interface ProductCardProps {
  product: IProduct & { _highlightResult?: any };
  source?: string;
  time?: number;
}

export function ProductCard({ product, source, time }: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="group relative flex flex-col justify-between rounded-xl border border-white/10 bg-zinc-900/40 p-5 shadow-lg backdrop-blur-md transition-all hover:border-indigo-500/30 hover:bg-zinc-900/60"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            {product.category}
          </span>
          <span className="font-mono text-sm font-semibold text-emerald-400">
            ${product.price.toFixed(2)}
          </span>
        </div>

        <h3 className="text-base font-medium text-zinc-100 group-hover:text-indigo-300 transition-colors">
          {product._highlightResult?.name?.value ? (
            <SafeHighlight htmlContent={product._highlightResult.name.value} />
          ) : (
            product.name
          )}
        </h3>

        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
          {product._highlightResult?.description?.value ? (
            <SafeHighlight htmlContent={product._highlightResult.description.value} />
          ) : (
            product.description
          )}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 font-mono text-[10px] text-zinc-500">
        <span className="flex items-center gap-1.5 uppercase">
          <Cpu className="h-3 w-3 text-indigo-400" />
          {source || 'engine'}
        </span>
        {time !== undefined && (
          <span className="flex items-center gap-1 text-zinc-400">
            <Zap className="h-3 w-3 text-amber-400" />
            {time}ms
          </span>
        )}
      </div>
    </motion.div>
  );
}