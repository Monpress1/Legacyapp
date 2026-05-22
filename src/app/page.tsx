
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { LuminescentBlob } from '@/components/visualizer/LuminescentBlob';
import { HistoryStack, LogEntry } from '@/components/history/HistoryStack';
import { OmniInput } from '@/components/input/OmniInput';
import { SettingsDialog, UserProfile, AIConfig } from '@/components/settings/SettingsDialog';
import { automateDeviceFunctions } from '@/ai/flows/automate-device-functions';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { StartupChime } from '@/components/audio/StartupChime';
import { CallMode } from '@/components/call/CallMode';
import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LegacyAI() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isCallMode, setIsCallMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({ name: 'Eli Monpress', gender: 'Other', about: 'The Creator' });
  const [aiConfig, setAiConfig] = useState<AIConfig>({ personality: 'Witty, sophisticated, and loyal virtual companion.' });
  const [memory, setMemory] = useState<string[]>([]);
  const [hasSharedSecret, setHasSharedSecret] = useState(false);
  const [voicePreview, setVoicePreview] = useState('');
  
  const { toast } = useToast();
  const flashlightRef = useRef<boolean>(false);
  const recognitionRef = useRef<any>(null);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    
    // Strip emojis and actions
    const cleanText = text
      .replace(/\[ACTION:.*?\]/g, '')
      .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF])/g, '')
      .trim();
      
    if (!cleanText) return;
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  }, []);

  const addLog = useCallback((role: 'user' | 'assistant', content: string, imageUrl?: string) => {
    const cleanContent = content.replace(/\[ACTION:.*?\]/g, '').trim();
    if (!cleanContent && !imageUrl) return;
    
    setLogs(prev => {
      const newEntry: LogEntry = {
        id: uuidv4(),
        role,
        content: cleanContent,
        imageUrl,
        timestamp: new Date()
      };
      const newLogs = [newEntry, ...prev].slice(0, 50); 
      
      const memorySnippet = `${role}: ${cleanContent}`;
      setMemory(m => {
        const newMemory = [...m, memorySnippet].slice(-20);
        localStorage.setItem('legacy_memory', JSON.stringify(newMemory));
        return newMemory;
      });
      
      localStorage.setItem('legacy_logs', JSON.stringify(newLogs));
      return newLogs;
    });
  }, []);

  const handleDeviceAction = useCallback(async (actionStr: string) => {
    const [type, ...parts] = actionStr.split('|');
    switch (type.trim()) {
      case 'call': 
        toast({ title: "Initiating Link", description: `Connecting to ${parts[0]}...` });
        window.open(`tel:${parts[0]}`); 
        break;
      case 'message': 
        window.open(`sms:${parts[0]}?body=${encodeURIComponent(parts[1] || '')}`); 
        break;
      case 'open_app':
        toast({ title: "Opening App", description: `Launching ${parts[0]}...` });
        window.open(`https://www.google.com/search?q=${encodeURIComponent(parts[0])}&btnI=1`);
        break;
      case 'play_music':
        toast({ title: "Vocal Harmony", description: `Playing ${parts[0] || 'your music'}...` });
        window.open(`https://music.youtube.com/search?q=${encodeURIComponent(parts[0] || 'favorites')}`);
        break;
      case 'toggle_flashlight':
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          const track = stream.getVideoTracks()[0];
          flashlightRef.current = !flashlightRef.current;
          // @ts-ignore
          await track.applyConstraints({ advanced: [{ torch: flashlightRef.current }] });
        } catch (e) { 
          toast({ variant: "destructive", title: "Hardware Error", description: "Flashlight link denied." }); 
        }
        break;
    }
  }, [toast]);

  const handleCommand = async (input: string, imageData?: string) => {
    if (!input.trim() && !imageData) return;
    setIsProcessing(true);
    addLog('user', input, imageData);
    setVoicePreview(''); 

    try {
      const response = await automateDeviceFunctions({
        command: input,
        userContext: `Name: ${profile.name}, About: ${profile.about}`,
        aiPersonality: aiConfig.personality,
        memory: memory.slice(-20).join('; '),
        notificationHistory: '',
        hasSharedSecret,
        imageData
      });
      
      const actionMatch = response.match(/\[ACTION:(.*?)\]/);
      if (actionMatch) handleDeviceAction(actionMatch[1]);

      if (input.toLowerCase().includes('my secret is')) {
        setHasSharedSecret(true);
        localStorage.setItem('legacy_secret_shared', 'true');
      }

      addLog('assistant', response);
      speak(response);
    } catch (error) {
      addLog('assistant', "Neural link unstable. Recalibrating. ⚠️");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRecording = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ variant: "destructive", title: "Vocal Error", description: "Hardware doesn't support speech recognition." });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setVoicePreview(transcript);
      if (e.results[0].isFinal) {
        handleCommand(transcript);
        setVoicePreview('');
      }
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognition.start();
    recognitionRef.current = recognition;
  };

  useEffect(() => {
    setIsMounted(true);
    
    const savedProfile = localStorage.getItem('legacy_user_profile');
    const savedMemory = localStorage.getItem('legacy_memory');
    const savedLogs = localStorage.getItem('legacy_logs');
    const secretShared = localStorage.getItem('legacy_secret_shared');
    
    if (savedProfile) setProfile(JSON.parse(savedProfile));
    if (savedMemory) setMemory(JSON.parse(savedMemory));
    if (savedLogs) setLogs(JSON.parse(savedLogs));
    if (secretShared === 'true') setHasSharedSecret(true);

    const hour = new Date().getHours();
    let greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const userName = savedProfile ? JSON.parse(savedProfile).name : profile.name;
    
    setTimeout(() => {
      if (logs.length === 0) {
        const initialMsg = `${greeting}, ${userName}. System online. The legacy continues. 🌌`;
        addLog('assistant', initialMsg);
        speak(initialMsg);
      }
    }, 1500);
  }, []);

  if (!isMounted) return null;

  return (
    <main className="relative flex flex-col h-screen overflow-hidden bg-[#0a050d]">
      <Toaster />
      <StartupChime />
      
      <div className="fixed top-0 left-0 right-0 z-50 p-6 flex items-center justify-between bg-gradient-to-b from-[#0a050d] to-transparent">
        <div className="flex-1 flex justify-start">
          <SettingsDialog onSave={(p, a) => { setProfile(p); setAiConfig(a); }} />
        </div>
        
        <div className="flex-[2] flex flex-col items-center justify-center text-center">
          <h1 className="text-lg font-black uppercase tracking-[0.5em] text-primary/80 drop-shadow-[0_0_10px_rgba(157,78,237,0.5)]">
            LEGACY AI
          </h1>
          <p className="text-[10px] font-medium text-white/30 tracking-[0.2em] mt-1">
            THE ULTIMATE FRIEND AND ASSISTANT
          </p>
        </div>

        <div className="flex-1 flex justify-end gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsCallMode(true)} 
            className="rounded-full bg-white/5 border border-white/10 text-accent hover:bg-primary/20 transition-all shadow-xl"
          >
            <Phone className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {isCallMode && (
        <CallMode 
          onClose={() => setIsCallMode(false)} 
          profile={profile}
          aiConfig={aiConfig}
          onAddLog={addLog}
          chatHistory={logs.slice(0, 20)}
        />
      )}

      <section className="relative z-10 h-[25vh] mt-24 flex items-center justify-center">
        <LuminescentBlob isProcessing={isProcessing} isListening={isListening} />
      </section>

      <section className="relative z-20 flex-1 overflow-hidden">
        <HistoryStack logs={logs} />
      </section>

      <section className="relative z-50 pb-safe">
        <OmniInput 
          onSendMessage={handleCommand} 
          onToggleVoice={toggleRecording} 
          isListening={isListening} 
          isProcessing={isProcessing}
          voicePreview={voicePreview}
        />
      </section>
    </main>
  );
}
