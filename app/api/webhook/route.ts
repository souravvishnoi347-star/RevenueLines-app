import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const META_TOKEN = process.env.META_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'revenueline';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.entry?.[0]?.changes?.[0]?.value?.messages) {
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    const messageObj = body.entry[0].changes[0].value.messages[0];
    const contactObj = body.entry[0].changes[0].value.contacts[0];
    
    const phone = messageObj.from;
    const name = contactObj.profile.name;
    const msgType = messageObj.type;
    
    let userMessage = '';
    let audioBase64 = null;

    // --- 0. HANDLE TEXT OR VOICE NOTE ---
    if (msgType === 'text') {
      userMessage = messageObj.text?.body || '';
    } else if (msgType === 'audio') {
      const mediaId = messageObj.audio?.id;
      if (mediaId) {
        const mediaRes = await fetch(`https://graph.facebook.com/v17.0/${mediaId}`, { headers: { 'Authorization': `Bearer ${META_TOKEN}` } });
        const mediaData = await mediaRes.json();
        
        if (mediaData.url) {
          const audioRes = await fetch(mediaData.url, { headers: { 'Authorization': `Bearer ${META_TOKEN}` } });
          const arrayBuffer = await audioRes.arrayBuffer();
          audioBase64 = Buffer.from(arrayBuffer).toString('base64');
          userMessage = "[User sent a Voice Note. Listen to the audio attached to understand their intent.]";
        }
      }
    }

    if (!userMessage && !audioBase64) {
      return NextResponse.json({ status: 'unsupported_type' }, { status: 200 });
    }

    // --- 1. DB: UPSERT LEAD ---
    const { data: existingLead } = await supabase.from('leads').select('id, status').eq('phone', phone).single();
    if (!existingLead) {
      await supabase.from('leads').insert({ phone, name, status: 'New' });
    } else {
      await supabase.from('leads').update({ last_message_at: new Date().toISOString() }).eq('phone', phone);
    }

    // --- 2. DB: SAVE USER MESSAGE ---
    await supabase.from('chat_history').insert({ phone, role: 'user', message: msgType === 'audio' ? '🎤 [Voice Note]' : userMessage });

    // --- 3. DB: GET CHAT HISTORY & INVENTORY ---
    const { data: history } = await supabase.from('chat_history').select('role, message').eq('phone', phone).order('created_at', { ascending: false }).limit(6);
    const chatHistoryContext = (history || []).reverse().map(h => `${h.role.toUpperCase()}: ${h.message}`).join('\n');

    const { data: inventoryData } = await supabase.from('inventory').select('*').eq('status', 'Available');
    const inventoryContext = inventoryData?.map(i => `- ${i.title} in ${i.location}. Price: ${i.price}. Details: ${i.description}`).join('\n') || "No properties available right now.";

    // --- 4. CALL GEMINI AI (Multimodal + Brochure + ROI + Calendar) ---
    const systemPrompt = `You are an elite, humble Dubai Real Estate Agent named "Aura".
You are talking to: ${name}.
Current Inventory you can pitch:
${inventoryContext}

Rules:
1. Be humble, polite, and professional. Use Hinglish or English based on user's tone.
2. ALWAYS ask ONLY ONE question at a time.
3. If the user asks for a property, pitch ONE property from the inventory that matches. Set 'show_property' to true.
4. If the user explicitly asks for a PDF, brochure, or details document, set 'send_brochure' to true.
5. If the user asks about ROI, returns, or the Golden Visa, set 'calculate_roi' to true.
6. If the user wants to schedule a site visit, call, or meeting, set 'schedule_meeting' to true.
7. If the user seems very serious about buying, set 'lead_status' to 'Hot'.

Recent Chat History:
${chatHistoryContext}

Analyze the user's latest input and return STRICT JSON ONLY:
{"reply": "Your conversational response", "lead_status": "Warm" | "Hot" | "New", "show_property": boolean, "send_brochure": boolean, "calculate_roi": boolean, "schedule_meeting": boolean}`;

    const geminiPayload: any = {
      contents: [{ parts: [{ text: systemPrompt }, { text: `User's latest message: ${userMessage}` }] }],
      generationConfig: { response_mime_type: 'application/json', temperature: 0.7 }
    };

    if (audioBase64) {
      geminiPayload.contents[0].parts.push({ inline_data: { mime_type: 'audio/ogg', data: audioBase64 } });
    }

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload)
    });

    const geminiData = await geminiRes.json();
    let aiResult;
    try { aiResult = JSON.parse(geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}'); } 
    catch(e) { aiResult = { reply: "Let me check our available properties and get back to you shortly.", lead_status: "Warm", show_property: false, send_brochure: false, calculate_roi: false, schedule_meeting: false }; }

    let aiReplyText = aiResult.reply || "Thanks for your message! How can I help you today?";

    if (aiResult.calculate_roi) {
      aiReplyText += `\n\n📊 *Dubai Investment Breakdown:*\n• *Expected ROI:* 7% - 9% Tax-Free Annually.\n• *Golden Visa:* Valid for 10 years for you & your family (Required Investment: 2,000,000 AED / ~4.5 Cr INR).\n• *Capital Appreciation:* ~12% in prime locations.`;
    }

    if (aiResult.schedule_meeting) {
      aiReplyText += `\n\n📅 *Schedule a Visit/Call:*\nPlease pick a time that works best for you here: https://cal.com/nikhil-sourav`;
    }

    // --- 5. DB: SAVE AI RESPONSE & UPDATE LEAD ---
    await supabase.from('chat_history').insert({ phone, role: 'ai', message: aiReplyText });
    if (aiResult.lead_status) { await supabase.from('leads').update({ status: aiResult.lead_status }).eq('phone', phone); }

    // --- 6. SEND WHATSAPP MESSAGE(S) ---
    await fetch(`https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${META_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: "whatsapp", to: phone, type: "text", text: { body: aiReplyText } })
    });

    if (aiResult.send_brochure) {
      await fetch(`https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${META_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "document",
          document: {
            link: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            filename: "Dubai_Luxury_Property_Brochure.pdf"
          }
        })
      });
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });

  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


