// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // OPTIONS request için hızlı yanıt
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, studentName, bookings } = await req.json()

    // Email içeriğini hazırla
    let bookingsList = ''
    bookings.forEach((booking: any) => {
      bookingsList += `
        <div style="background: #f3f4f6; padding: 15px; margin: 10px 0; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0; color: #4f46e5;">${booking.day} - ${booking.time}</h3>
          <p style="margin: 5px 0;"><strong>Zoom Linki:</strong> <a href="${booking.zoomLink}">${booking.zoomLink}</a></p>
          <p style="margin: 5px 0;"><strong>Meeting ID:</strong> ${booking.meetingId}</p>
          <p style="margin: 5px 0;"><strong>Şifre:</strong> ${booking.password}</p>
        </div>
      `
    })

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4f46e5;">🎉 Rezervasyonunuz Onaylandı!</h1>
        <p>Merhaba ${studentName},</p>
        <p>Matematik dersi rezervasyonunuz başarıyla oluşturuldu. Aşağıda ders detaylarınızı bulabilirsiniz:</p>
        
        <h2 style="color: #1f2937;">Ders Detayları:</h2>
        ${bookingsList}
        
        <div style="background: #dbeafe; padding: 15px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #3b82f6;">
          <p style="margin: 0;"><strong>📌 Önemli Bilgiler:</strong></p>
          <ul style="margin: 10px 0;">
            <li>Her ders 45 dakika sürecektir</li>
            <li>Ders saatinden 5 dakika önce Zoom linkine tıklayarak bekleme odasına girebilirsiniz</li>
            <li>Herhangi bir sorunuz olursa lütfen yanıt verin</li>
          </ul>
        </div>
        
        <p>İyi dersler dilerim! 📚</p>
        <p style="color: #6b7280; font-size: 14px;">Matematik Dersi Randevu Sistemi</p>
      </div>
    `

    // Resend API ile mail gönder
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Matematik Dersi <onboarding@resend.dev>',
        to: [to, Deno.env.get('TEACHER_EMAIL')],
        subject: `Ders Rezervasyonu Onayı - ${studentName}`,
        html: emailHtml,
      }),
    })

    const data = await response.json()

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-booking-email' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
