import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Instantiate supabase lazily or handle empty string
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

async function generateWithGemini(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing in env vars.");

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7 }
    })
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
      const prompt = `You are an outreach expert for 'Propnexaa', a real estate lead automation SaaS in the UAE. 
Write a highly personalized, friendly, and relatable cold email to a real estate professional.
Lead Name: ${lead.name}
Agency Name: ${lead.agency_name || 'their real estate agency'}

Rules:
- Keep it under 4 sentences. Very short and punchy.
- Mention their agency name naturally.
- The goal is to ask if they are open to a quick 10-min chat about automating their lead qualification and CRM entries.
- Sign off as "Sourav from Propnexaa".
- Return ONLY the email body. No subject line.`;

      const subjectPrompt = `Write a short, catchy, non-clickbaity email subject line for a cold outreach to ${lead.name} at ${lead.agency_name || 'their real estate agency'}. Max 6 words. Return ONLY the subject line text.`;

      const emailBody = (await generateWithGemini(prompt)).trim();
      const emailSubjectRaw = await generateWithGemini(subjectPrompt);
      const emailSubject = emailSubjectRaw.trim().replace(/['"]/g, '') || 'Quick question regarding lead automation';

      // 3. Send Email via Gmail
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
          sent_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      results.push({ email: lead.email, status: 'sent' });
    }

    return NextResponse.json({ success: true, processed: results });

  } catch (err: any) {
    console.error('Outreach error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
