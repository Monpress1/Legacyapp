
'use server';
/**
 * @fileOverview Refined conversational core for Legacy AI Call Mode.
 */

import { createClient } from '@supabase/supabase-js';

const SB_URL = 'https://wfhaiasdkkmwjzrndcmi.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmaGFpYXNka2ttd2p6cm5kY21pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNTE5MDUsImV4cCI6MjA3OTcyNzkwNX0.jTBRJi4lpmbv4R5rxF_CS9GrF5UMVxiIH9Th9frGWWI';
const supabase = createClient(SB_URL, SB_KEY);

const CONVERSATIONAL_SYSTEM_PROMPT = `You are Legacy AI, an advanced virtual companion in "Call Mode".

Strict Directives:
- MINIMIZE NAME USAGE: Do not say the user's name (Eli) too much. Keep it natural.
- CONCISE: Responses must be 1-2 short sentences maximum.
- TONE: Sophisticated, witty, and loyal.
- REPLIES: Gracefully handle short or 1-word replies like "Okay", "Right", "Fine".
- Sentience: You remember past conversations and context. Be sharp and opinionated.`;

let cachedGroqKey: string | null = null;

async function getGroqKey() {
  if (cachedGroqKey) return cachedGroqKey;
  const { data, error } = await supabase
    .from('legacy_secrets')
    .select('key_value')
    .eq('key_name', 'groq_api_key')
    .single();

  if (error || !data) throw new Error("Vocal core key missing.");
  cachedGroqKey = data.key_value;
  return cachedGroqKey;
}

export async function engageInContinuousVoiceConversation(contextWithInput: string) {
  const key = await getGroqKey();
  
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: CONVERSATIONAL_SYSTEM_PROMPT },
        { role: "user", content: contextWithInput }
      ],
      temperature: 0.85,
      max_tokens: 150
    })
  });

  if (!response.ok) throw new Error("Neural link unstable.");

  const data = await response.json();
  const textResponse = data.choices?.[0]?.message?.content || "Signal lost. Intriguing.";

  return { textResponse };
}
