
"use client";

import React, { useState, useEffect } from 'react';
import { Settings, User, Cpu, Brain, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export interface UserProfile {
  name: string;
  gender: string;
  about: string;
}

export interface AIConfig {
  personality: string;
}

interface SettingsDialogProps {
  onSave: (profile: UserProfile, ai: AIConfig) => void;
}

export function SettingsDialog({ onSave }: SettingsDialogProps) {
  const [profile, setProfile] = useState<UserProfile>({ name: 'Eli Monpress', gender: 'Other', about: 'The Creator' });
  const [ai, setAi] = useState<AIConfig>({ personality: 'Witty, smart, and slightly sarcastic assistant.' });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const savedProfile = localStorage.getItem('legacy_user_profile');
    const savedAI = localStorage.getItem('legacy_ai_config');
    if (savedProfile) setProfile(JSON.parse(savedProfile));
    if (savedAI) setAi(JSON.parse(savedAI));
  }, []);

  const handleSave = () => {
    localStorage.setItem('legacy_user_profile', JSON.stringify(profile));
    localStorage.setItem('legacy_ai_config', JSON.stringify(ai));
    onSave(profile, ai);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full bg-white/5 border border-white/10 hover:bg-primary/20 transition-all shadow-xl">
          <Settings className="w-5 h-5 text-primary" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-[#0a050d]/95 backdrop-blur-2xl border-primary/20 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary font-headline tracking-tighter text-2xl">
            <Cpu className="w-6 h-6" />
            CORE PERSONALIZATION
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-black text-accent uppercase tracking-widest border-b border-white/5 pb-2">
              <User className="w-4 h-4" /> User Identification
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Identity Name</Label>
                <Input 
                  value={profile.name} 
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Gender Spec</Label>
                <Input 
                  value={profile.gender} 
                  onChange={(e) => setProfile({...profile, gender: e.target.value})}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>About You</Label>
              <Textarea 
                value={profile.about} 
                onChange={(e) => setProfile({...profile, about: e.target.value})}
                placeholder="What should Legacy AI know about you?"
                className="bg-white/5 border-white/10 h-20 resize-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-black text-primary uppercase tracking-widest border-b border-white/5 pb-2">
              <Brain className="w-4 h-4" /> AI Personality Matrix
            </h3>
            <div className="space-y-2">
              <Label>Neural Directives</Label>
              <Textarea 
                value={ai.personality} 
                onChange={(e) => setAi({...ai, personality: e.target.value})}
                placeholder="Describe Legacy AI's tone and behavior..."
                className="bg-white/5 border-white/10 h-24 resize-none"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} className="w-full bg-primary hover:bg-primary/80 text-white font-headline gap-2">
            <Save className="w-4 h-4" /> APPLY DIRECTIVES
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
