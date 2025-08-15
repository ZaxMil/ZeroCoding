import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { ensureUniqueIndex, insertEventIdempotent } from "../_shared/ensure-constraints.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-paypal-transmission-id, x-paypal-cert-id, x-paypal-auth-algo, x-paypal-transmission-sig, x-paypal-transmission-time",
};

// PayPal webhook verification
async function verifyPayPalWebhook(req: Request): Promise<boolean> {
  const transmissionId = req.headers.get('x-paypal-transmission-id');
  const certId = req.headers.get('x-paypal-cert-id');
  const authAlgo = req.headers.get('x-paypal-auth-algo');
  const transmissionSig = req.headers.get('x-paypal-transmission-sig');
  const transmissionTime = req.headers.get('x-paypal-transmission-time');
  
  if (!transmissionId || !certId || !authAlgo || !transmissionSig || !transmissionTime) {
    console.error('Missing PayPal webhook headers');
    return false;
  }

  // In production, implement full PayPal webhook verification
  // For now, basic header validation
  return true;
}

// Initialize constraints at cold start
const supabaseService = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

// Ensure webhook constraints exist
await ensureUniqueIndex(supabaseService, 'webhook_events', 'event_id');
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook signature
    const isValid = await verifyPayPalWebhook(req);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Invalid webhook signature" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    
    const webhookData = await req.json();
    const eventId = webhookData.id || webhookData.event_id;
    
    console.log("PayPal webhook received:", webhookData.event_type, eventId);

    // Check for duplicate processing with idempotent insert
    const isNewEvent = await insertEventIdempotent(supabaseService, eventId);
    if (!isNewEvent) {
      return new Response(
        JSON.stringify({ status: "success", message: "duplicate event ignored" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Handle different PayPal webhook events
    if (webhookData.event_type === "CHECKOUT.ORDER.APPROVED") {
      const orderId = webhookData.resource.id;
      const customId = webhookData.resource.purchase_units[0]?.custom_id;
      
      if (!customId) {
        throw new Error("No custom_id found in webhook");
      }

      // Parse custom_id: format is user_id_package_id_timestamp
      const [userId, packageId] = customId.split('_');

      // Get the pending transaction
      const { data: pendingTransaction, error: fetchError } = await supabaseService
        .from("coin_transactions")
        .select("*")
        .eq("reference_id", orderId)
        .eq("user_id", userId)
        .eq("type", "purchase_pending")
        .single();

      if (fetchError || !pendingTransaction) {
        console.error("Pending transaction not found:", fetchError);
        throw new Error("Pending transaction not found");
      }

      // Update the transaction to completed
      const { error: updateError } = await supabaseService
        .from("coin_transactions")
        .update({
          type: "purchase",
          description: `PayPal coin purchase completed: ${pendingTransaction.amount} coins`,
          webhook_event_id: webhookData.id,
          metadata: {
            ...pendingTransaction.metadata,
            webhook_event_id: webhookData.id,
            completed_at: new Date().toISOString()
          }
        })
        .eq("id", pendingTransaction.id);

      if (updateError) {
        console.error("Failed to update transaction:", updateError);
        throw new Error("Failed to update transaction");
      }

      console.log(`Coins credited: ${pendingTransaction.amount} to user ${userId}`);
    }

    return new Response(
      JSON.stringify({ status: "success" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in paypal-coin-webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});