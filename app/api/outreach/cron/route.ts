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

  // Primary: gemini-3.5-flash-lite (fastest, high rate limit availability)
  let res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  let data = await res.json();
  if (data.error) {
    // Fallback 1: gemini-3.6-flash
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
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

// Framework configurations with Lavender.ai 40-word psychology and live web research
function getFrameworkPrompt(framework: string, lead: any, enrichment: any) {
  const agency = (lead.agency_name || 'your agency').replace(/L\.?L\.?C\.?/i, '').replace(/Brokerage/i, '').trim();
  const firstName = (lead.name || 'there').split(' ')[0] || 'there';
  const size = lead.agency_size || 'active';
  const tier = lead.outbound_tier || 'A';
  const offer = lead.recommended_offer || 'Instant WhatsApp lead response and CRM routing';
  const activeFocus = enrichment.activeAreas?.join(' & ') || 'Dubai';
  const liveResearch = enrichment.liveResearchSnippet;

  const baseRules = `
LAVENDER.AI WORLD-CLASS 40-WORD COPYWRITING RULES:
1. STRICT WORD COUNT: Must be between 30 and 45 words MAXIMUM. No exceptions.
2. READING LEVEL: 5th-grade simple English.
3. FORMATTING: Every single thought MUST be on its own line with double line-breaks (\\n\\n). NEVER combine sentences into a single paragraph!
4. ONLY ONE QUESTION: Exactly 1 question in the entire email (the soft closing ask).
5. BANNED BOT PHRASES:
   - NEVER write "noticed [Agency] has an established team of X brokers registered on DLD"
   - NEVER write "Propnexaa solves this with..."
   - NEVER write "I hope this email finds you well"
   - NO marketing buzzwords ("revolutionize", "cutting-edge", "game-changer", "synergy").
6. SIGN-OFF:
Best,
Sourav`;

  let researchInstruction = '';
  if (liveResearch) {
    researchInstruction = `LIVE WEB DISCOVERY ABOUT ${firstName.toUpperCase()} / ${agency.toUpperCase()}: "${liveResearch}".
Naturally weave this exact real fact into paragraph 2 as the personal icebreaker!`;
  }

  switch (framework) {
    case 'qvc':
      return `Write a 35-word cold email using QVC (Question - Value - CTA).
Target: ${firstName} at ${agency}. Team scale: ${size}. Active areas: ${activeFocus}.
${researchInstruction}
${baseRules}

Structure:
Paragraph 1: "Hey ${firstName},"
Paragraph 2 (The Question): Quick question — how is ${agency} handling Property Finder inquiries that come in after 8 PM?
Paragraph 3 (The Value): We set up a simple WhatsApp flow for Dubai brokers that replies and qualifies buyers in 15 seconds.
Paragraph 4 (The Ask): "Worth a quick 2-minute look, or are you guys totally sorted on this?"
Paragraph 5: "Best,\\nSourav"`;

    case 'pas':
      return `Write a 38-word cold email using PAS (Problem - Agitate - Solve).
Target: ${firstName} at ${agency}. Team scale: ${size}.
${researchInstruction}
${baseRules}

Structure:
Paragraph 1: "Hey ${firstName},"
Paragraph 2 (Problem & Agitate): Dubai portal buyers message 3+ brokers at once, and waiting 15+ minutes usually means the deal is lost.
Paragraph 3 (Solve): We built a lightweight WhatsApp automation that qualifies buyer budget & timeline in 15 seconds.
Paragraph 4 (The Ask): "Open to seeing how it works for ${agency}, or bad timing?"
Paragraph 5: "Best,\\nSourav"`;

    case 'bab':
      return `Write a 38-word cold email using BAB (Before - After - Bridge).
Target: ${firstName} at ${agency}. Team scale: ${size}.
${researchInstruction}
${baseRules}

Structure:
Paragraph 1: "Hey ${firstName},"
Paragraph 2 (Contrast): Instead of chasing cold portal inquiries on WhatsApp all day, brokers can wake up with verified investor viewings already booked.
Paragraph 3 (Bridge): That's the exact lead workflow we set up for Dubai teams.
Paragraph 4 (The Ask): "Mind if I share a 60-second video of how it routes to your agents?"
Paragraph 5: "Best,\\nSourav"`;

    case 'soft_offer':
      return `Write a 35-word Permission-Based Soft Offer email.
Target: ${firstName} at ${agency}. Team scale: ${size}.
${researchInstruction}
${baseRules}

Structure:
Paragraph 1: "Hey ${firstName},"
Paragraph 2 (Observation & Offer): Saw your team over at ${agency}. We put together a short 1-minute breakdown showing how Dubai brokers auto-reply to portal leads on WhatsApp.
Paragraph 3 (Permission Ask): "Mind if I drop the link here, or are you guys totally covered on lead response right now?"
Paragraph 4: "Best,\\nSourav"`;

    case 'dld_trigger':
    default:
      return `Write a 38-word cold email using the DLD Trigger & Live Web Intelligence framework.
Target: ${firstName} at ${agency}.
Scale Context: ${size} brokers. Recommended Offer: ${offer}. Focus: ${activeFocus}.
${researchInstruction}
${baseRules}

Structure:
Paragraph 1: "Hey ${firstName},"
Paragraph 2 (Live Trigger): ${liveResearch ? `Reference: "${liveResearch.slice(0, 100)}"` : `Saw you guys have a team of ${size} brokers over at ${agency}.`}
Paragraph 3 (The Pain Point): When portal leads hit after hours, they usually sit on WhatsApp for hours. We built a workflow that qualifies buyers in 15 seconds.
Paragraph 4 (The Low-Friction Ask): "Worth a quick 2-minute look, or are you guys totally sorted on this?"
Paragraph 5: "Best,\\nSourav"`;
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const selectedFramework = url.searchParams.get('framework') || 'dld_trigger';
    const action = url.searchParams.get('action') || 'send_queue'; // 'send_queue' | 'send_followup'

    // 1. Fetch leads based on action
    let query = supabase.from('outreach_leads').select('*');
    if (action === 'send_followup') {
      // Fetch leads that were sent and ready for step 2 bump
      query = query.eq('status', 'sent').lt('sequence_step', 3).limit(2);
    } else {
      // Default: fetch unsent leads for Step 1
      query = query.eq('status', 'unsent').limit(2);
    }

    const { data: leads, error } = await query;

    if (error || !leads || leads.length === 0) {
      return NextResponse.json({ 
        message: action === 'send_followup' 
          ? 'No leads currently pending follow-up sequence.' 
          : 'No unsent leads found in the queue.' 
      }, { status: 200 });
    }

    const results = [];
    const frameworksList = ['dld_trigger', 'qvc', 'pas', 'bab', 'soft_offer'];

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      const currentStep = lead.sequence_step || 1;
      const firstName = (lead.name || 'there').split(' ')[0];
      const cleanAgency = (lead.agency_name || 'your agency').replace(/L\.?L\.?C\.?/i, '').trim();

      let emailSubject = '';
      let emailBody = '';
      let nextStep = currentStep;
      let aiRationale = '';

      // Handle Follow-Up Sequence (Step 2: 1-Line Threaded Bump, Step 3: Breakup)
      if (action === 'send_followup' && currentStep >= 1) {
        const baseSubject = lead.ai_generated_subject || `quick question ${firstName.toLowerCase()}`;
        emailSubject = baseSubject.toLowerCase().startsWith('re:') ? baseSubject : `Re: ${baseSubject}`;

        if (currentStep === 1) {
          // Step 2: Threaded 1-Line Bump (Day 3/4)
          emailBody = `Hey ${firstName},\n\nQuick bump on this — wanted to see if your team is open to a 60-second video of that WhatsApp routing flow, or should I leave you be?\n\nBest,\nSourav`;
          nextStep = 2;
          aiRationale = `[Sequence Step 2: Threaded Bump] Follow-up sent on same thread.`;
        } else {
          // Step 3: Permission Breakup Email (Day 7/8)
          emailBody = `Hey ${firstName},\n\nAssuming after-hours lead response isn't a priority for ${cleanAgency} right now.\n\nWon't bug you again — but if anything changes, you know where to find me.\n\nBest,\nSourav`;
          nextStep = 3;
          aiRationale = `[Sequence Step 3: Breakup Note] Polite close-out email sent.`;
        }
      } else {
        // Step 1: Initial Hyper-Personalized Trigger Email
        const currentFramework = selectedFramework === 'auto_rotate' 
          ? frameworksList[i % frameworksList.length] 
          : selectedFramework;

        // Autonomous Web & Domain Intelligence Research
        const enrichment = await enrichProspect({
          name: lead.name,
          agency_name: lead.agency_name,
          email: lead.email,
          website: lead.website,
          agency_size: lead.agency_size,
          outbound_tier: lead.outbound_tier,
          recommended_offer: lead.recommended_offer
        });

        const frameworkPrompt = getFrameworkPrompt(currentFramework, lead, enrichment);
        const fullPrompt = `${frameworkPrompt}

Return ONLY a valid JSON object:
{
  "email_body": "the actual email text with \\n\\n between every single paragraph",
  "rationale": "1 sentence explaining the angle taken and research fact used"
}`;

        const aiResponseRaw = await generateWithGemini(fullPrompt, true);
        let aiResponse;
        try {
          aiResponse = JSON.parse(aiResponseRaw);
        } catch (e) {
          aiResponse = { 
            email_body: `Hey ${firstName},\n\nSaw you guys over at ${cleanAgency}.\n\nQuick question — how is your team handling Property Finder leads that come in after hours right now?\n\nWe set up a simple WhatsApp automation that qualifies buyers in 15 seconds and routes them straight to the right broker.\n\nWorth a quick 2-minute look, or are you guys totally sorted on this?\n\nBest,\nSourav`, 
            rationale: `Fallback triggered under ${currentFramework.toUpperCase()} framework.` 
          };
        }

        emailBody = aiResponse.email_body.trim();
        if (!emailBody.includes('\n\n')) {
          emailBody = emailBody.replace(/\.\s+([A-Z])/g, '.\n\n$1');
        }

        const researchBadge = enrichment.source === 'live_web_research' 
          ? `[Live Web Research: "${enrichment.liveResearchSnippet?.slice(0, 75)}..."] ` 
          : '';
        aiRationale = `${researchBadge}[Framework: ${currentFramework.toUpperCase()}] ` + (aiResponse.rationale?.trim() || '');

        // Natural, Force-Open Subject Line (2-4 words, lowercase)
        const subjectPrompt = `Write a super casual, 2 to 4 word cold email subject line for:
Recipient: ${lead.name}
Agency: ${cleanAgency.toLowerCase()}

Rules:
- 2 to 4 words ONLY.
- ALL LOWERCASE.
- Looks like a peer note: e.g. "quick question ${firstName.toLowerCase()}", "${cleanAgency.toLowerCase()} / lead speed", "after-hours leads at ${cleanAgency.toLowerCase()}".
Return ONLY the raw subject line text without quotes.`;

        const emailSubjectRaw = await generateWithGemini(subjectPrompt, false);
        emailSubject = emailSubjectRaw.trim().toLowerCase().replace(/['"]/g, '').replace(/\.$/, '');
        if (!emailSubject || emailSubject.length > 32) {
          emailSubject = `quick question about ${cleanAgency.toLowerCase()}`;
        }
        nextStep = 1;
      }

      // 5. Send Email via Gmail SMTP with Threading & Styled HTML
      try {
        if (!lead.email || !lead.email.includes('@')) throw new Error("Invalid email address: " + lead.email);
        
        const htmlBody = emailBody
          .split(/\n\n+/)
          .map((para: string) => `<p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14.5px; line-height: 1.6; color: #1f2937;">${para.replace(/\n/g, '<br/>')}</p>`)
          .join('');

        const mailOptions: any = {
          from: `"Sourav" <${process.env.GMAIL_USER}>`,
          to: lead.email,
          subject: emailSubject,
          text: emailBody,
          html: htmlBody
        };

        // Threaded reply headers if follow-up
        if (lead.message_id) {
          mailOptions.inReplyTo = lead.message_id;
          mailOptions.references = lead.message_id;
        }

        const sendInfo = await transporter.sendMail(mailOptions);

        // 6. Update lead status in Supabase
        await supabase
          .from('outreach_leads')
          .update({
            status: 'sent',
            sequence_step: nextStep,
            message_id: sendInfo.messageId || lead.message_id || null,
            ai_generated_subject: emailSubject,
            ai_generated_body: emailBody,
            ai_rationale: aiRationale,
            sent_at: new Date().toISOString()
          })
          .eq('id', lead.id);

        results.push({ 
          email: lead.email, 
          status: 'sent', 
          step: nextStep,
          subject: emailSubject 
        });
      } catch (sendErr: any) {
        await supabase
          .from('outreach_leads')
          .update({
            status: 'failed',
            ai_rationale: `Failed: ` + sendErr.message
          })
          .eq('id', lead.id);
        
        results.push({ email: lead.email, status: 'failed', error: sendErr.message });
      }
    }

    return NextResponse.json({ 
      success: true, 
      action,
      processed: results 
    });

  } catch (err: any) {
    console.error('Outreach error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
