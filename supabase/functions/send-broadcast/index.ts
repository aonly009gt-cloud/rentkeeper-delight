import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, ownerId } = await req.json();

    if (!message || !ownerId) {
      return new Response(JSON.stringify({ error: "message and ownerId are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lineAccessToken = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");

    if (!lineAccessToken) {
      return new Response(JSON.stringify({ error: "LINE_CHANNEL_ACCESS_TOKEN is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all rooms for this owner with their tenants
    const { data: rooms, error: roomsError } = await supabase
      .from("rooms")
      .select(`
        id,
        tenants (
          id,
          line_user_id
        )
      `)
      .eq("user_id", ownerId);

    if (roomsError) {
      throw roomsError;
    }

    // Extract all unique line_user_ids
    const lineUserIds = new Set<string>();

    rooms?.forEach((room: any) => {
      room.tenants?.forEach((tenant: any) => {
        if (tenant.line_user_id) {
          lineUserIds.add(tenant.line_user_id);
        }
      });
    });

    const toArray = Array.from(lineUserIds);

    if (toArray.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No tenants connected to LINE found." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send LINE Multicast (max 500 users per request, but we assume it's under 500 for a dorm)
    // If it's over 500, we should chunk the array.
    const chunks = [];
    for (let i = 0; i < toArray.length; i += 500) {
      chunks.push(toArray.slice(i, i + 500));
    }

    let successCount = 0;

    for (const chunk of chunks) {
      const lineRes = await fetch("https://api.line.me/v2/bot/message/multicast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${lineAccessToken}`
        },
        body: JSON.stringify({
          to: chunk,
          messages: [
            {
              type: "text",
              text: `📢 ประกาศจากบ้านพัก/หอพัก:\n\n${message}`
            }
          ]
        })
      });

      if (!lineRes.ok) {
        const t = await lineRes.text();
        console.error("LINE API Error:", t);
        throw new Error(`LINE API responded with status ${lineRes.status}`);
      }

      successCount += chunk.length;
    }

    return new Response(JSON.stringify({ success: true, sentCount: successCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
