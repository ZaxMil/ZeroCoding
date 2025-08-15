import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CaptchaVerifyRequest {
  token: string;
  action?: string;
}

async function verifyCaptcha(token: string, remoteip?: string): Promise<boolean> {
  const secretKey = Deno.env.get('RECAPTCHA_SECRET_KEY');
  
  if (!secretKey) {
    console.error('RECAPTCHA_SECRET_KEY not configured');
    return false;
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
        ...(remoteip && { remoteip })
      }),
    });

    const result = await response.json();
    
    // Check if verification was successful and score is above threshold
    return result.success && (result.score === undefined || result.score >= 0.5);
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, action }: CaptchaVerifyRequest = await req.json();
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Missing captcha token" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Get client IP for verification
    const clientIP = req.headers.get('cf-connecting-ip') || 
                    req.headers.get('x-forwarded-for')?.split(',')[0] || 
                    req.headers.get('x-real-ip');

    const isValid = await verifyCaptcha(token, clientIP);
    
    return new Response(
      JSON.stringify({ 
        success: isValid,
        action: action || 'unknown'
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: isValid ? 200 : 400,
      }
    );

  } catch (error) {
    console.error("Error in verify-captcha:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});