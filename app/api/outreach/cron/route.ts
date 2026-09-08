import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder"
);
const supabase = getSupabase();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

async function generateWithGemini(prompt: string, isJson: boolean = false) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing in env vars.");

  const payload: any = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7 }
  };
  
  if (isJson) {
    payload.generationConfig.responseMimeType = "application/json";
  }

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message || "Unknown Gemini API Error");
  }
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export async function GET(req: Request) {
  try {
    // 1. Fetch 2 unsent leads
    const { data: leads, error } = await supabase
      .from('outreach_leads')
      .select('*')
      .eq('status', 'unsent')
      .limit(2);

    if (error || !leads || leads.length === 0) {
      return NextResponse.json({ message: 'No unsent leads found or error.' }, { status: 200 });
    }

    const results = [];

    for (const lead of leads) {
      // 2. Generate personalized email
      const prompt = `You are an expert sales rep for 'Propnexaa', a SaaS that automates lead-response and CRM workflows for real estate brokers. 
Write a highly personalized, friendly, and relatable cold email to a real estate professional.

Lead Details:
Name: ${lead.name}
Agency: ${lead.agency_name}
Agency Size: ${lead.agency_size || 'Unknown'} brokers
Tier: ${lead.outbound_tier || 'Unknown'}
Recommended Offer for them: ${lead.recommended_offer || 'Automated lead response and WhatsApp routing'}

Rules:
- Keep it under 4 sentences. Very short and punchy.
- Mention their agency name naturally.
- Use the "Recommended Offer" and "Agency Size" to tailor the pain point. For example, if they have a large team, mention managing large lead volumes. If small, mention saving time as a solo agent.
- DO NOT sound like a robot. Use a conversational, human tone.
- Sign off as "Sourav from Propnexaa".
- Return ONLY a JSON object with two keys:
{
  "email_body": "the actual email text...",
  "rationale": "1-2 sentences explaining why you wrote this email this way based on their agency size and offer"
}`;

      const aiResponseRaw = await generateWithGemini(prompt, true);
      let aiResponse;
      try {
        aiResponse = JSON.parse(aiResponseRaw);
      } catch (e) {
        aiResponse = { email_body: "Hi, let's talk about automating your real estate leads.", rationale: "Fallback due to parsing error." };
      }

      const emailBody = aiResponse.email_body.trim();
      const aiRationale = aiResponse.rationale.trim();

      const subjectPrompt = `Write a short, catchy, non-clickbaity email subject line for a cold outreach to ${lead.name} at ${lead.agency_name || 'their real estate agency'}. Max 6 words. Return ONLY the subject line text.`;
      const emailSubjectRaw = await generateWithGemini(subjectPrompt, false);
      const emailSubject = emailSubjectRaw.trim().replace(/['"]/g, '') || 'Quick question regarding lead automation';

      // 3. Send Email via Gmail
      try {
        if (!lead.email || !lead.email.includes('@')) throw new Error("Invalid email address: " + lead.email);
        
        await transporter.sendMail({
          from: `"Sourav | Propnexaa" <${process.env.GMAIL_USER}>`,
          to: lead.email,
          subject: emailSubject,
          text: emailBody
        });

        // 4. Update lead status in Supabase
        await supabase
          .from('outreach_leads')
          .update({
            status: 'sent',
            ai_generated_subject: emailSubject,
            ai_generated_body: emailBody,
            ai_rationale: aiRationale,
            sent_at: new Date().toISOString()
          })
          .eq('id', lead.id);

        results.push({ email: lead.email, status: 'sent' });
      } catch (sendErr: any) {
        // Mark as failed so it doesn't block the queue forever
        await supabase
          .from('outreach_leads')
          .update({
            status: 'failed',
            ai_rationale: "Failed to send: " + sendErr.message
          })
          .eq('id', lead.id);
        
        results.push({ email: lead.email, status: 'failed', error: sendErr.message });
      }
    }

    return NextResponse.json({ success: true, processed: results });

  } catch (err: any) {
    console.error('Outreach error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
