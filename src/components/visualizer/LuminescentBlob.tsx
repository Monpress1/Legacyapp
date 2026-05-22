"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface LuminescentBlobProps {
  isProcessing?: boolean;
  isListening?: boolean;
}

export function LuminescentBlob({ isProcessing, isListening }: LuminescentBlobProps) {
  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
      {/* Background Glow */}
      <div className={cn(
        "absolute w-48 h-48 rounded-full bg-primary/10 animate-blob-pulse transition-all duration-1000 blur-[60px]",
        isProcessing ? "scale-150 bg-primary/30" : "scale-100",
        isListening ? "bg-accent/20 scale-125" : ""
      )} />

      {/* Main Liquid Blob */}
      <svg className="w-64 h-64 filter drop-shadow-[0_0_30px_rgba(157,78,237,0.3)] overflow-visible">
        <defs>
          <filter id="liquid">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix 
              in="blur" 
              mode="matrix" 
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" 
              result="liquid" 
            />
            <feComposite in="SourceGraphic" in2="liquid" operator="atop" />
          </filter>
        </defs>
        
        <g filter="url(#liquid)">
          <circle 
            cx="128" 
            cy="128" 
            r={isListening ? 65 : 55} 
            className={cn(
              "fill-primary transition-all duration-500 ease-in-out",
              isProcessing ? "animate-pulse" : ""
            )}
          >
            <animate 
              attributeName="r" 
              values={isProcessing ? "55;70;55" : "55;60;55"} 
              dur="3s" 
              repeatCount="indefinite" 
            />
          </circle>
          <circle cx="108" cy="108" r="45" className="fill-primary/70">
            <animateTransform 
              attributeName="transform" 
              type="translate" 
              values="0,0; 15,10; 0,0" 
              dur="5s" 
              repeatCount="indefinite" 
            />
          </circle>
          <circle cx="148" cy="138" r="40" className="fill-accent/50">
            <animateTransform 
              attributeName="transform" 
              type="translate" 
              values="0,0; -12,-18; 0,0" 
              dur="7s" 
              repeatCount="indefinite" 
            />
          </circle>
        </g>
      </svg>

      {/* Core Node */}
      <div className="absolute z-10">
        <div className={cn(
          "w-2 h-2 rounded-full transition-all duration-300",
          isListening ? "bg-accent animate-ping" : "bg-white/40",
          isProcessing ? "bg-primary scale-125 shadow-[0_0_15px_#9d4edd]" : ""
        )} />
      </div>
    </div>
  );
}
