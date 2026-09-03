import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const bio = formData.get('bio') as string;
    const imageFile = formData.get('image') as File | null;
    
    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
    const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
    const APP_ID = process.env.APP_ID;

    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID || !APP_ID) {
      return NextResponse.json({ error: 'Missing Meta credentials in environment variables (WHATSAPP_TOKEN, PHONE_NUMBER_ID, or APP_ID)' }, { status: 500 });
    }

    // 1. Update the "About" section
    if (bio) {
      const bioRes = await fetch(`https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/whatsapp_business_profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          about: bio
        })
      });
      const bioData = await bioRes.json();
      if (bioData.error) {
        console.error("Meta Bio Update Error:", bioData.error);
        return NextResponse.json({ error: 'Failed to update bio on Meta', details: bioData.error }, { status: 500 });
      }
    }

    // 2. Update Profile Picture if image is provided
    if (imageFile) {
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileLength = buffer.length;
      const fileType = imageFile.type;

      // Step 2a: Create Resumable Upload Session
      const uploadSessionRes = await fetch(`https://graph.facebook.com/v17.0/${APP_ID}/uploads?file_length=${fileLength}&file_type=${fileType}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`
        }
      });
      const uploadSessionData = await uploadSessionRes.json();
      
      if (uploadSessionData.error || !uploadSessionData.id) {
         console.error("Meta Upload Session Error:", uploadSessionData);
         return NextResponse.json({ error: 'Failed to create upload session', details: uploadSessionData }, { status: 500 });
      }

      const uploadSessionId = uploadSessionData.id;

      // Step 2b: Upload the actual file bytes
      const uploadRes = await fetch(`https://graph.facebook.com/v17.0/${uploadSessionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `OAuth ${WHATSAPP_TOKEN}`,
          'file_offset': '0'
        },
        body: buffer
      });
      const uploadData = await uploadRes.json();

      if (uploadData.error || !uploadData.h) {
         console.error("Meta File Upload Error:", uploadData);
         return NextResponse.json({ error: 'Failed to upload image file to Meta', details: uploadData }, { status: 500 });
      }

      const fileHandle = uploadData.h;

      // Step 2c: Set the uploaded file as the Profile Picture
      const dpUpdateRes = await fetch(`https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/whatsapp_business_profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          profile_picture_handle: fileHandle
        })
      });
      const dpUpdateData = await dpUpdateRes.json();

      if (dpUpdateData.error) {
         console.error("Meta DP Update Error:", dpUpdateData);
         return NextResponse.json({ error: 'Failed to set profile picture on Meta', details: dpUpdateData }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'WhatsApp Profile synced successfully!' });
  } catch (error: any) {
    console.error("Sync WhatsApp Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
