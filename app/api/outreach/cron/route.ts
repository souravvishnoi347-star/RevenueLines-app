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

// Framework configurations with human-to-human Dubai Real Estate copywriting psychology
function getFrameworkPrompt(framework: string, lead: any, enrichment: any) {
  const agency = (lead.agency_name || 'your agency').replace(/L\.?L\.?C\.?/i, '').replace(/Brokerage/i, '').trim();
  const firstName = (lead.name || 'there').split(' ')[0] || 'there';
  const size = lead.agency_size || 'active';
  const tier = lead.outbound_tier || 'A';
  const offer = lead.recommended_offer || 'Instant WhatsApp lead response and CRM routing';
  const activeFocus = enrichment.activeAreas?.join(' & ') || 'Dubai';

  const baseRules = `
CRITICAL FORMATTING & SPACING RULES:
1. EVERY thought MUST be its own short paragraph separated by an empty blank line (\\n\\n).
2. Max 1 to 2 sentences per paragraph. NEVER output a single wall of text!
3. Total email must be under 60 words. Short, punchy, mobile-friendly.

STRICTLY BANNED PHRASES (SOUNDS LIKE A BOT):
- NEVER write "noticed [Agency] has an established team of X brokers registered on DLD"
- NEVER write "Propnexaa solves this with instant WhatsApp AI qualification..."
- NEVER write "I hope this email finds you well" or "As a premier agency..."
- NEVER use marketing jargon: "revolutionize", "cutting-edge", "game-changer", "synergy", "delighted".

HOW A REAL FOUNDER WRITES:
- Write like Sourav (founder) sending a quick note from his phone while between meetings.
- Casual peer-to-peer tone.
- Sign off naturally:
Best,
Sourav`;

  switch (framework) {
    case 'qvc':
      return `You are writing a cold email using the QVC framework (Question - Value - CTA).
Target: ${firstName} at ${agency}. Team scale: ${size}. Active areas: ${activeFocus}.
${baseRules}

Structure:
Paragraph 1: "Hey ${firstName},"
Paragraph 2 (Question): Ask a casual question about how ${agency} handles Property Finder / Bayut leads that come in after 8 PM or on weekends.
Paragraph 3 (Value): 1 sentence on how Propnexaa auto-qualifies and responds to Dubai buyers on WhatsApp in 15 seconds.
Paragraph 4 (CTA): "Worth a quick 2-minute look, or are you guys totally sorted on this?"
Paragraph 5: "Best,\\nSourav"`;

    case 'pas':
      return `You are writing a cold email using the PAS framework (Problem - Agitate - Solve).
Target: ${firstName} at ${agency}. Team scale: ${size}.
${baseRules}

Structure:
Paragraph 1: "Hey ${firstName},"
Paragraph 2 (Problem & Agitate): Point out that Dubai buyers message 3+ brokers at once, and taking 15+ minutes to reply usually means losing the deal.
Paragraph 3 (Solve): We built a lightweight WhatsApp automation that replies and qualifies buyers in 15 seconds.
Paragraph 4 (Soft Ask): "Open to seeing how it works for ${agency}, or bad timing?"
Paragraph 5: "Best,\\nSourav"`;

    case 'bab':
      return `You are writing a cold email using the BAB framework (Before - After - Bridge).
Target: ${firstName} at ${agency}. Team scale: ${size}.
${baseRules}

Structure:
Paragraph 1: "Hey ${firstName},"
Paragraph 2 (Contrast): Contrast agents wasting 2+ hours daily manually chasing cold portal inquiries vs. waking up with pre-qualified viewings already booked on WhatsApp.
Paragraph 3 (Bridge): That's exactly what we set up for Dubai brokerages.
Paragraph 4 (Ask): "Mind if I send over a 60-second video of how it routes to your agents?"
Paragraph 5: "Best,\\nSourav"`;

    case 'soft_offer':
      return `You are writing a cold email using the Permission-Based Soft Offer framework.
Target: ${firstName} at ${agency}. Team scale: ${size}.
${baseRules}

Structure:
Paragraph 1: "Hey ${firstName},"
Paragraph 2 (Observation & Offer): Saw your team over at ${agency}. We put together a short 1-minute breakdown showing how Dubai brokers auto-reply to portal leads on WhatsApp.
Paragraph 3 (Permission Ask): "Mind if I drop the link here, or are you guys totally good on lead response right now?"
Paragraph 4: "Best,\\nSourav"`;

    case 'dld_trigger':
    default:
      return `You are writing a cold email using the DLD Trigger & Observation framework.
Target: ${firstName} at ${agency}.
Scale Context: ${size} brokers. Recommended Offer: ${offer}. Focus: ${activeFocus}.
${baseRules}

Structure:
Paragraph 1: "Hey ${firstName},"
Paragraph 2 (Natural Trigger): Open with a natural peer observation — e.g. if large team: "Saw you guys have a pretty massive team over at ${agency}." Or if smaller: "Saw you're actively handling listings across ${activeFocus}."
Paragraph 3 (The Pain/Solution): "When portal inquiries hit after hours, leads usually sit on WhatsApp for hours. We built a workflow that qualifies Dubai buyers and routes them to the right agent in 15 seconds."
Paragraph 4 (Low-friction Ask): "Worth a quick 2-minute look, or are you guys totally sorted on this?"
Paragraph 5: "Best,\\nSourav"`;
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
  "email_body": "the actual email text with \\n\\n between every single paragraph",
  "rationale": "1 sentence why this angle was taken"
}`;

      const aiResponseRaw = await generateWithGemini(fullPrompt, true);
      let aiResponse;
      try {
        aiResponse = JSON.parse(aiResponseRaw);
      } catch (e) {
        const cleanName = (lead.name || 'there').split(' ')[0];
        const cleanAgency = (lead.agency_name || 'your agency').replace(/L\.?L\.?C\.?/i, '').trim();
        aiResponse = { 
          email_body: `Hey ${cleanName},\n\nSaw you guys over at ${cleanAgency}.\n\nQuick question — how is your team handling Property Finder leads that come in after hours right now?\n\nWe set up a simple WhatsApp automation that qualifies buyers in 15 seconds and routes them straight to the right broker.\n\nWorth a quick 2-minute look, or are you guys totally sorted on this?\n\nBest,\nSourav`, 
          rationale: `Fallback triggered under ${currentFramework.toUpperCase()} framework.` 
        };
      }

      // Ensure proper paragraph spacing (\n\n) even if AI grouped sentences
      let emailBody = aiResponse.email_body.trim();
      // If AI didn't include double newlines, enforce paragraph separation
      if (!emailBody.includes('\n\n')) {
        emailBody = emailBody.replace(/\.\s+([A-Z])/g, '.\n\n$1');
      }

      const aiRationale = `[Framework: ${currentFramework.toUpperCase()}] ` + (aiResponse.rationale?.trim() || '');

      // 4. Generate Natural, Force-Open Subject Line (Casual, 2-4 words, All Lowercase)
      const cleanAgency = (lead.agency_name || 'your agency').replace(/L\.?L\.?C\.?/i, '').trim().toLowerCase();
      const cleanFirstName = (lead.name || '').split(' ')[0].toLowerCase();

      const subjectPrompt = `Write a super casual, 2 to 4 word cold email subject line for:
Recipient: ${lead.name}
Agency: ${cleanAgency}

CRITICAL RULES:
- 2 to 4 words ONLY.
- ALL LOWERCASE.
- NO spam words, NO exclamation marks, NO hype.
- MUST look like an internal note or quick message from a peer, NOT a bot or database query.
- BANNED: NEVER say "on dld", "100 brokers", "boost sales", "synergy".
- Good examples:
  "quick question ${cleanFirstName}"
  "${cleanAgency} / lead speed"
  "quick question about ${cleanAgency}"
  "after-hours leads at ${cleanAgency}"
  "${cleanAgency} lead response"

Return ONLY the raw subject line text without quotes.`;

      const emailSubjectRaw = await generateWithGemini(subjectPrompt, false);
      let emailSubject = emailSubjectRaw.trim().toLowerCase().replace(/['"]/g, '').replace(/\.$/, '');
      if (!emailSubject || emailSubject.length > 35) {
        emailSubject = cleanAgency ? `quick question about ${cleanAgency}` : `quick question ${cleanFirstName}`;
      }

      // 5. Send Email via Gmail SMTP with pristine HTML paragraph formatting
      try {
        if (!lead.email || !lead.email.includes('@')) throw new Error("Invalid email address: " + lead.email);
        
        // Convert double-newlines into styled HTML paragraphs
        const htmlBody = emailBody
          .split(/\n\n+/)
          .map((para: string) => `<p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14.5px; line-height: 1.6; color: #1f2937;">${para.replace(/\n/g, '<br/>')}</p>`)
          .join('');

        await transporter.sendMail({
          from: `"Sourav" <${process.env.GMAIL_USER}>`,
          to: lead.email,
          subject: emailSubject,
          text: emailBody,
          html: htmlBody
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
