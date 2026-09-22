import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { enrichProspect } from '@/lib/enrichment';

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
    generationConfig: { temperature: 0.6 }
  };
  
  if (isJson) {
    payload.generationConfig.responseMimeType = "application/json";
  }

  // Primary: gemini-3.6-flash (current production model)
  let res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  let data = await res.json();
  if (data.error) {
    // Fallback 1: gemini-3.5-flash-lite
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    data = await res.json();
    if (data.error) {
      // Fallback 2: gemini-3.5-flash
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      data = await res.json();
      if (data.error) {
        throw new Error(data.error.message || "Unknown Gemini API Error");
      }
    }
  }
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// Framework configurations with Dubai Real Estate copywriting psychology
function getFrameworkPrompt(framework: string, lead: any, enrichment: any) {
  const agency = lead.agency_name || 'your agency';
  const name = lead.name || 'there';
  const size = lead.agency_size || 'active';
  const tier = lead.outbound_tier || 'A';
  const offer = lead.recommended_offer || 'Instant WhatsApp lead response and CRM routing';
  const triggerHook = enrichment.triggerObservation || `Noticed ${agency}'s team presence on the DLD registry.`;
  const activeFocus = enrichment.activeAreas?.join(' / ') || 'Dubai Real Estate';

  switch (framework) {
    case 'qvc':
      return `You are writing a cold email using the proven QVC Framework (Question - Value - Call to Action).
Target: ${name} at ${agency}.
Details: Agency scale: ${size} brokers. Focus: ${activeFocus}. Trigger Hook: ${triggerHook}.

Structure (Strictly 3 sentences, max 60 words):
1. Question: A thoughtful, direct question about their speed to lead on Bayut/Property Finder portal inquiries (especially after-hours or on weekends).
2. Value: 1 punchy sentence explaining how Propnexaa auto-qualifies and responds to Dubai buyers on WhatsApp in 15 seconds.
3. CTA: A low-friction ask: "Worth sending a 45-second preview of how it works, or bad timing?"

Tone: Casual, executive peer-to-peer. NO marketing fluff, NO "I hope this email finds you well", NO exclamation marks. Sign off: "Sourav from Propnexaa".`;

    case 'pas':
      return `You are writing a cold email using the proven PAS Framework (Problem - Agitate - Solve).
Target: ${name} at ${agency}.
Details: Agency size: ${size} brokers. Recommended Offer: ${offer}. Trigger Hook: ${triggerHook}.

Structure (Under 4 sentences, max 75 words):
1. Problem: Dubai off-plan and secondary buyers inquire on 3+ agency listings at once.
2. Agitate: If agents take 20+ minutes to follow up, the buyer has already moved on with another broker.
3. Solve: Propnexaa acts as a 24/7 AI lead dispatcher that qualifies buyer budget & timeline on WhatsApp instantly.
4. Soft Ask: "Open to seeing if this could help ${agency} recover dropped portal leads?"

Tone: Honest, observant, non-salesy. Sign off: "Sourav from Propnexaa".`;

    case 'bab':
      return `You are writing a cold email using the proven BAB Framework (Before - After - Bridge).
Target: ${name} at ${agency}.
Details: Agency scale: ${size} brokers. Trigger Hook: ${triggerHook}. Focus: ${activeFocus}.

Structure (Under 4 sentences, max 75 words):
1. Before: Brokers losing 2+ hours daily manually chasing unresponsive portal leads and updating Excel.
2. After: Starting every morning with pre-qualified buyers booked straight into your agents' WhatsApp calendar.
3. Bridge: Propnexaa bridges that gap with automated Dubai lead qualification.
4. Soft Ask: "Mind if I share a 1-minute breakdown of how we set this up for Dubai teams?"

Tone: Clear, crisp contrast. Sign off: "Sourav from Propnexaa".`;

    case 'soft_offer':
      return `You are writing a cold email using the Permission-Based / Soft Offer Framework.
Target: ${name} at ${agency}.
Details: Scale: ${size} brokers. Trigger Hook: ${triggerHook}. Focus: ${activeFocus}.

Structure (Under 3 sentences, max 50 words):
1. Observation: Naturally weave in "${triggerHook}".
2. Offer: We put together a short 60-second video showing how Dubai agencies automate WhatsApp lead routing without replacing their CRM.
3. Permission Ask: "Mind if I drop the link here, or is ${agency} totally covered on lead response right now?"

Tone: Ultra-humble, respectful of their time, zero pressure. Sign off: "Sourav from Propnexaa".`;

    case 'dld_trigger':
    default:
      return `You are writing a cold email using the proven DLD Trigger & Observation Framework (Ranked #1 for Dubai Real Estate B2B).
Target: ${name} at ${agency}.
Details:
- DLD Scale: ${size} licensed brokers
- DLD Tier: ${tier}
- Recommended Offer: ${offer}
- Enriched Research Hook: ${triggerHook}
- Active Areas: ${activeFocus}

Structure (Under 4 sentences, max 70 words):
1. Personalized Trigger: Open directly with the observation "${triggerHook}" or mention their team scale naturally.
2. Tailored Pain Point: Based on whether they are a large team (coordinating lead routing and after-hours coverage) or solo/boutique (saving hours on manual qualification).
3. The Propnexaa Edge: Instant WhatsApp AI qualification + CRM dispatch tailored for Dubai brokers.
4. Low-Friction Ask: "Open to checking out a 60-second walkthrough tailored for ${agency}?"

Tone: Highly knowledgeable about the Dubai market, conversational, respectful. Absolutely NO generic sales jargon. Sign off: "Sourav from Propnexaa".`;
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const selectedFramework = url.searchParams.get('framework') || 'dld_trigger';

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
    const frameworksList = ['dld_trigger', 'qvc', 'pas', 'bab', 'soft_offer'];

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];

      // Determine framework (handle auto_rotate for A/B testing)
      const currentFramework = selectedFramework === 'auto_rotate' 
        ? frameworksList[i % frameworksList.length] 
        : selectedFramework;

      // 2. Autonomous ICP Research & Web Enrichment
      const enrichment = await enrichProspect({
        name: lead.name,
        agency_name: lead.agency_name,
        email: lead.email,
        website: lead.website,
        agency_size: lead.agency_size,
        outbound_tier: lead.outbound_tier,
        recommended_offer: lead.recommended_offer
      });

      // 3. Build Framework Prompt
      const frameworkPrompt = getFrameworkPrompt(currentFramework, lead, enrichment);
      const fullPrompt = `${frameworkPrompt}

Return ONLY a valid JSON object with exactly two keys:
{
  "email_body": "the actual email text...",
  "rationale": "1-2 sentences explaining why this framework was chosen and how the trigger was used"
}`;

      const aiResponseRaw = await generateWithGemini(fullPrompt, true);
      let aiResponse;
      try {
        aiResponse = JSON.parse(aiResponseRaw);
      } catch (e) {
        aiResponse = { 
          email_body: `Hi ${lead.name || ''},\n\nSaw your team at ${lead.agency_name || 'your agency'}. We help Dubai real estate brokers automate after-hours portal lead responses on WhatsApp within 15 seconds.\n\nWorth sending a 60-second video of how it works?\n\nBest,\nSourav from Propnexaa`, 
          rationale: `Fallback triggered under ${currentFramework.toUpperCase()} framework.` 
        };
      }

      const emailBody = aiResponse.email_body.trim();
      const aiRationale = `[Framework: ${currentFramework.toUpperCase()}] ` + (aiResponse.rationale?.trim() || '');

      // 4. Generate Force-Open, Trigger-Based Subject Line
      const subjectPrompt = `Generate a high-converting, non-spam cold email subject line for:
Recipient: ${lead.name}
Agency: ${lead.agency_name || 'Dubai Brokerage'}
Trigger context: ${enrichment.triggerObservation}
Framework: ${currentFramework}

Rules:
- Under 6 words maximum.
- Prefer all-lowercase or sentence-case (avoids marketing look).
- No spam trigger words ("Revolutionary", "Guaranteed", "Free", "Boost 10x").
- Examples of great patterns:
  "quick question about ${lead.agency_name || 'leads'}"
  "${lead.name || 'broker'}, after-hours leads at ${lead.agency_name || 'agency'}"
  "${lead.agency_name || 'team'} + whatsapp lead speed"
Return ONLY the raw subject line text without quotes.`;

      const emailSubjectRaw = await generateWithGemini(subjectPrompt, false);
      const emailSubject = emailSubjectRaw.trim().replace(/['"]/g, '') || `quick question for ${lead.name || lead.agency_name}`;

      // 5. Send Email via Gmail SMTP
      try {
        if (!lead.email || !lead.email.includes('@')) throw new Error("Invalid email address: " + lead.email);
        
        await transporter.sendMail({
          from: `"Sourav | Propnexaa" <${process.env.GMAIL_USER}>`,
          to: lead.email,
          subject: emailSubject,
          text: emailBody
        });

        // 6. Update lead status in Supabase
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

        results.push({ email: lead.email, status: 'sent', framework: currentFramework, subject: emailSubject });
      } catch (sendErr: any) {
        // Mark as failed so it doesn't block the queue forever
        await supabase
          .from('outreach_leads')
          .update({
            status: 'failed',
            ai_rationale: `[Framework: ${currentFramework.toUpperCase()}] Failed to send: ` + sendErr.message
          })
          .eq('id', lead.id);
        
        results.push({ email: lead.email, status: 'failed', error: sendErr.message, framework: currentFramework });
      }
    }

    return NextResponse.json({ 
      success: true, 
      framework_mode: selectedFramework,
      processed: results 
    });

  } catch (err: any) {
    console.error('Outreach error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
