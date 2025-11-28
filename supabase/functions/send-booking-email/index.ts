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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== Mail fonksiyonu başladı ===')
    
    const { to, studentName, bookings } = await req.json()
    console.log('Gelen data:', { to, studentName, bookingsCount: bookings.length })

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const teacherEmail = Deno.env.get('TEACHER_EMAIL')
    
    console.log('API Key var mı:', !!resendApiKey)
    console.log('Teacher email:', teacherEmail)

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
            <li>Seans başlamadan önce sorularınızın bulunduğu PDF dosyası hazır olmalıdır!</li>
          </ul>
        </div>
        
        <p>Görüşmek üzere!📚 Ücret seans sırasında tahsil edilecektir.</p>
        <p>Başka bir randevu oluşturmak için randevu.berkayedis.com'u ziyaret edebilirsin!</p>
        <p style="color: #6b7280; font-size: 14px;">Berkay Ediş</p>
      </div>
    `

    console.log('Resend API çağrısı yapılıyor...')
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Matematik Dersi <info@berkayedis.com>',
        to: [to, teacherEmail],  // Artık herkese gönderebiliriz!
        subject: `Ders Rezervasyonu Onayı - ${studentName}`,
        html: emailHtml,
      }),
    })

    console.log('Resend status:', response.status)
    console.log('Resend status text:', response.statusText)
    
    const data = await response.json()
    console.log('Resend response:', JSON.stringify(data))

    if (!response.ok) {
      console.error('Resend hatası:', data)
      throw new Error(`Resend API error: ${JSON.stringify(data)}`)
    }

    console.log('=== Mail başarıyla gönderildi ===')

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error('=== HATA ===', error.message)
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
