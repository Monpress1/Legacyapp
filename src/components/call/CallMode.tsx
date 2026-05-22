
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mic, MicOff, PhoneOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LuminescentBlob } from '@/components/visualizer/LuminescentBlob';
import { engageInContinuousVoiceConversation } from '@/ai/flows/continuous-voice-conversation';
import { UserProfile, AIConfig } from '@/components/settings/SettingsDialog';
import { LogEntry } from '@/components/history/HistoryStack';
import { cn } from '@/lib/utils';

interface CallModeProps {
  onClose: () => void;
  profile: UserProfile;
  aiConfig: AIConfig;
  onAddLog: (role: 'user' | 'assistant', content: string) => void;
  chatHistory: LogEntry[];
}

export function CallMode({ onClose, profile, aiConfig, onAddLog, chatHistory }: CallModeProps) {
  const [status, setStatus] = useState<'listening' | 'speaking' | 'thinking' | 'idle'>('idle');
  const [transcript, setTranscript] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isComponentMounted = useRef(true);
  
  const localSessionMemory = useRef<string[]>(
    [...chatHistory].reverse().map(l => `${l.role}: ${l.content}`)
  );

  const stopEverything = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try { 
        // Detach handlers before stopping to prevent "aborted" error callbacks from firing
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop(); 
      } catch(e) {}
      recognitionRef.current = null;
    }
  }, []);

  const handleAIResponse = async (userText: string) => {
    if (!userText.trim()) {
      setStatus('idle');
      return;
    }
    
    setStatus('thinking');
    onAddLog('user', userText);
    localSessionMemory.current.push(`user: ${userText}`);

    try {
      const context = localSessionMemory.current.slice(-20).join('\n');
      const { textResponse } = await engageInContinuousVoiceConversation(`${context}\n\nUSER SPEECH: ${userText}`);
      speak(textResponse);
    } catch (error) {
      speak("Neural link unstable. Recalibrating.");
    }
  };

  const startManualListening = useCallback(() => {
    if (!isComponentMounted.current || isMuted) return;
    
    // Interrupt AI if it's speaking
    stopEverything();
    setTranscript('');
    setStatus('listening');

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = (e: any) => {
      const currentTranscript = e.results[0][0].transcript;
      setTranscript(currentTranscript);
      
      if (e.results[0].isFinal) {
        handleAIResponse(currentTranscript);
      }
    };

    recognition.onerror = (e: any) => {
      // Suppress 'aborted' and 'no-speech' to avoid annoying dev overlays while maintaining loop fluency
      if (isComponentMounted.current) {
        setStatus('idle');
      }
    };

    recognition.onend = () => {
      if (isComponentMounted.current && status === 'listening' && !transcript) {
        setStatus('idle');
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      if (isComponentMounted.current) setStatus('idle');
    }
  }, [isMuted, stopEverything, status, transcript]);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined') return;
    
    stopEverything();
    setStatus('speaking');
    onAddLog('assistant', text);
    localSessionMemory.current.push(`assistant: ${text}`);

    // Filter emojis and actions from speech synthesis
    const cleanText = text
      .replace(/\[ACTION:.*?\]/g, '')
      .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF])/g, '')
      .trim();

    if (!cleanText) {
      setStatus('idle');
      // Auto-listen loop
      setTimeout(() => {
        if (isComponentMounted.current) startManualListening();
      }, 300);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    utterance.onend = () => {
      if (isComponentMounted.current) {
        setStatus('idle');
        // Auto-activate microphone after 0.3 seconds for semi-handsfree conversation
        setTimeout(() => {
          if (isComponentMounted.current) {
            startManualListening();
          }
        }, 300);
      }
    };
    window.speechSynthesis.speak(utterance);
  }, [onAddLog, stopEverything, startManualListening]);

  useEffect(() => {
    isComponentMounted.current = true;
    
    const greetings = [
      "I'm here, Eli. Tap when you're ready to talk.",
      "Connection established. I'm listening on your command.",
      "Vocal link secure. Waiting for your directive.",
      "Systems at peak performance. Ready when you are."
    ];
    
    const initialMsg = greetings[Math.floor(Math.random() * greetings.length)];
    speak(initialMsg);

    return () => {
      isComponentMounted.current = false;
      stopEverything();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a050d] flex flex-col items-center justify-between p-8 animate-in fade-in zoom-in duration-500">
      <div className="w-full flex justify-between items-center bg-white/5 p-4 rounded-3xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-3 h-3 rounded-full shadow-[0_0_10px_#9d4edd]",
            status === 'listening' ? "bg-primary animate-pulse" : "bg-accent/40"
          )} />
          <span className="text-[10px] uppercase font-black tracking-[0.3em] text-white/40">Vocal Link Active</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white/20 hover:text-white rounded-full"><X /></Button>
      </div>

      <div 
        className="flex-1 flex flex-col items-center justify-center gap-12 w-full cursor-pointer active:scale-95 transition-transform"
        onClick={status !== 'thinking' ? startManualListening : undefined}
      >
        <div className="relative transform scale-125">
          <LuminescentBlob isProcessing={status === 'thinking'} isListening={status === 'listening'} />
        </div>
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter drop-shadow-2xl transition-all duration-500">
            {status === 'listening' ? 'LISTENING' : status === 'thinking' ? 'THINKING' : status === 'speaking' ? 'SPEAKING' : 'READY'}
          </h2>
          <div className="h-10 flex items-center justify-center">
            <p className="text-accent/60 italic text-lg max-w-sm mx-auto line-clamp-2 px-6">
              {transcript ? `"${transcript}"` : (status === 'idle' ? "Tap to speak..." : '')}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm flex items-center justify-around pb-16">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={startManualListening} 
          className={cn(
            "rounded-full w-16 h-16 border-none transition-all shadow-2xl", 
            status === 'listening' ? "bg-primary text-white scale-110" : "bg-white/5 text-white"
          )}
        >
          {isMuted ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
        </Button>
        <Button onClick={onClose} className="rounded-full w-24 h-24 bg-red-600 hover:bg-red-700 shadow-[0_0_50px_rgba(220,38,38,0.5)] transition-all flex items-center justify-center">
          <PhoneOff className="w-10 h-10 text-white" />
        </Button>
        <Button variant="outline" size="icon" className="rounded-full w-16 h-16 bg-white/5 border-none text-white shadow-2xl">
          <Volume2 className="w-7 h-7" />
        </Button>
      </div>
    </div>
  );
}
