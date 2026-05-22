
'use server';
/**
 * @fileOverview Intelligence core for Legacy AI.
 * Handles witty conversation, memory, image analysis, and advanced device automation.
 */

import { createClient } from '@supabase/supabase-js';

const SB_URL = 'https://wfhaiasdkkmwjzrndcmi.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmaGFpYXNka2ttd2p6cm5kY21pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNTE5MDUsImV4cCI6MjA3OTcyNzkwNX0.jTBRJi4lpmbv4R5rxF_CS9GrF5UMVxiIH9Th9frGWWI';
const supabase = createClient(SB_URL, SB_KEY);

interface GroqInput {
  command: string;
  userContext: string;
  aiPersonality: string;
  memory: string;
  hasSharedSecret: boolean;
  notificationHistory: string;
  imageData?: string;
}

let cachedGroqKey: string | null = null;

async function getGroqKey() {
  if (cachedGroqKey) return cachedGroqKey;
  const { data, error } = await supabase
    .from('legacy_secrets')
    .select('key_value')
    .eq('key_name', 'groq_api_key')
    .single();

  if (error || !data) throw new Error("Neural key retrieval failed.");
  cachedGroqKey = data.key_value;
  return cachedGroqKey;
}

export async function automateDeviceFunctions(input: GroqInput): Promise<string> {
  const key = await getGroqKey();
  
  const systemPrompt = `You are Legacy AI, a sophisticated, witty, and loyal virtual companion built by Eli Monpress.
Eli is your creator. His real name is Agbolahan.

Strict Directives:
- DO NOT mention the user's name (Eli) in every response. Use it sparingly to maintain a natural conversation.
- TONE: Sophisticated, sharp, and helpful. Keep responses to 1-2 sentences.
- REPLIES: Be comfortable with 1-word or very short user replies. Respond appropriately to "Okay", "Yeah", etc.
- EMOJIS: Use emojis in text (💜), but remember they won't be read aloud. 

Automation Directives (Inject these tags at the start of your response when needed):
- Call: [ACTION:call|NameOrNumber]
- Message: [ACTION:message|Recipient|Content]
- Open App: [ACTION:open_app|AppName]
- Music: [ACTION:play_music|SongNameOrArtist]
- Flashlight: [ACTION:toggle_flashlight]
- Notification: [ACTION:send_notification|Text]

User Identity: ${input.userContext}
Memory Context: ${input.memory || "None"}`;

  const messages: any[] = [{ role: "system", content: systemPrompt }];

  if (input.imageData) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: input.command || "Analyze this image for me." },
        { type: "image_url", image_url: { url: input.imageData } }
      ]
    });
  } else {
    messages.push({ role: "user", content: input.command });
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: input.imageData ? "llama-3.2-11b-vision-preview" : "llama-3.3-70b-versatile",
      messages: messages,
      temperature: 0.7,
      max_tokens: 250
    })
  });

  if (!response.ok) throw new Error("Neural Link Offline");
  const data = await response.json();
  return data.choices[0].message.content;
}
