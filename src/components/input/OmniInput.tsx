
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

interface OmniInputProps {
  onSendMessage: (msg: string, imageData?: string) => void;
  onToggleVoice: () => void;
  isListening: boolean;
  isProcessing: boolean;
  voicePreview?: string;
}

export function OmniInput({ onSendMessage, onToggleVoice, isListening, isProcessing, voicePreview }: OmniInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync preview into input field for visibility
  useEffect(() => {
    if (voicePreview) {
      setInputValue(voicePreview);
    }
  }, [voicePreview]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (inputValue.trim() || selectedImage) {
      onSendMessage(inputValue, selectedImage || undefined);
      setInputValue(''); // Clear input box instantly
      setSelectedImage(null);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-6 pb-10 bg-gradient-to-t from-[#0a050d] via-[#0a050d]/95 to-transparent z-50">
      <div className="max-w-3xl mx-auto flex flex-col gap-3">
        {selectedImage && (
          <div className="relative self-start mb-2 group animate-in slide-in-from-bottom-2">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border border-primary/30 shadow-2xl">
              <Image src={selectedImage} alt="Preview" fill className="object-cover" unoptimized />
            </div>
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-3 -right-3 bg-red-500 rounded-full p-1.5 text-white shadow-xl hover:bg-red-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 focus-within:border-primary/50 transition-all backdrop-blur-3xl shadow-inner">
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              onClick={() => fileInputRef.current?.click()}
              className="text-white/40 hover:text-primary transition-colors h-10 w-10"
            >
              <ImageIcon className="w-5 h-5" />
            </Button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageChange} 
            />
            
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isListening ? "Listening..." : "Provide Directive..."}
              disabled={isProcessing}
              className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-white placeholder:text-white/20 text-base h-11"
            />
            
            <Button 
              type="submit" 
              variant="ghost" 
              size="icon" 
              className="text-primary hover:text-accent hover:bg-transparent transition-colors h-10 w-10"
              disabled={(!inputValue.trim() && !selectedImage) || isProcessing}
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>

          <Button
            onClick={onToggleVoice}
            size="icon"
            disabled={isProcessing}
            className={`rounded-2xl w-14 h-14 shadow-2xl transition-all duration-300 ${
              isListening 
                ? "bg-accent text-[#0a050d] animate-pulse scale-110 shadow-[0_0_20px_rgba(179,179,255,0.5)]" 
                : "bg-primary text-white hover:bg-primary/90 hover:scale-105"
            }`}
          >
            <Mic className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
