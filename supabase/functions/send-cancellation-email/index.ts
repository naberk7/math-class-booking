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
    const { to, studentName, day, time } = await req.json()

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626;">❌ Rezervasyon İptal Edildi</h1>
        <p>Merhaba ${studentName},</p>
        <p>Matematik dersi rezervasyonunuz iptal edilmiştir.</p>
        
        <div style="background: #fee2e2; padding: 15px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #dc2626;">
          <h3 style="margin: 0 0 10px 0; color: #991b1b;">İptal Edilen Ders:</h3>
          <p style="margin: 5px 0;"><strong>Gün:</strong> ${day}</p>
          <p style="margin: 5px 0;"><strong>Saat:</strong> ${time}</p>
        </div>
        
        <p>Eğer bu iptal işlemi hatalıysa veya yeni bir randevu almak isterseniz lütfen bizimle iletişime geçin.</p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Matematik Dersi Randevu Sistemi</p>
      </div>
    `

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Matematik Dersi <info@berkayedis.com>',
        to: to,
        subject: `Ders Rezervasyonu İptal Edildi - ${day} ${time}`,
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

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-cancellation-email' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
