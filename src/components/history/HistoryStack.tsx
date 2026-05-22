
"use client";

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';

export type LogEntry = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  timestamp: Date;
};

interface HistoryStackProps {
  logs: LogEntry[];
}

export function HistoryStack({ logs }: HistoryStackProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top when new message arrives since top is latest (Pyramid order)
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="flex-1 w-full max-w-2xl mx-auto h-full overflow-hidden relative px-6">
      <ScrollArea ref={scrollRef} className="w-full h-full">
        <div className="flex flex-col gap-6 py-8">
          {logs.map((log) => (
            <div
              key={log.id}
              className={cn(
                "px-6 py-5 rounded-3xl border backdrop-blur-xl transition-all duration-500 animate-in slide-in-from-top-4 fade-in shadow-2xl",
                log.role === 'user' 
                  ? "bg-white/5 border-white/10 ml-auto max-w-[90%] text-right rounded-tr-none" 
                  : "bg-primary/10 border-primary/20 mr-auto max-w-[95%] rounded-tl-none",
              )}
            >
              <div className={cn("flex items-center gap-2 mb-3", log.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                <span className={cn("text-[10px] font-black tracking-widest uppercase", log.role === 'user' ? "text-accent" : "text-primary")}>
                  {log.role === 'user' ? 'Directives Received' : 'Legacy Response'}
                </span>
                <span className="text-[8px] text-white/20">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {log.imageUrl && (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-4 border border-white/10">
                  <Image src={log.imageUrl} alt="Neural Snapshot" fill className="object-cover" unoptimized />
                </div>
              )}
              <p className="text-sm sm:text-base leading-relaxed text-white/90 font-medium">{log.content}</p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
