import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const META_TOKEN = process.env.META_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

export async function POST(req: Request) {
  try {
    const { message, targetStatus } = await req.json();

    if (!message || !targetStatus) {
      return NextResponse.json({ error: 'Missing message or targetStatus' }, { status: 400 });
    }

    // Fetch leads matching the status
    const { data: leads } = await supabase.from('leads').select('phone').eq('status', targetStatus);
    
    if (!leads || leads.length === 0) {
      return NextResponse.json({ message: 'No leads found for this status', count: 0 }, { status: 200 });
    }

    let successCount = 0;

    // Send WhatsApp broadcast
    for (const lead of leads) {
      try {
        const response = await fetch(`https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${META_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: lead.phone,
            type: "text",
            text: { body: message }
          })
        });
        
        if (response.ok) {
          successCount++;
          // Update chat history so you can see it in dashboard
          await supabase.from('chat_history').insert({ phone: lead.phone, role: 'ai', message: `[Broadcast]: ${message}` });
        }
      } catch (err) {
        console.error('Failed to send to', lead.phone, err);
      }
    }

    return NextResponse.json({ message: 'Campaign sent', count: successCount }, { status: 200 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
