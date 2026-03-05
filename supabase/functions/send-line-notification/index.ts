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
    const { billId } = await req.json();

    if (!billId) {
      return new Response(JSON.stringify({ error: "billId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    // System-wide LINE Channel Access Token for sending messages
    const lineAccessToken = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");

    if (!lineAccessToken) {
      return new Response(JSON.stringify({ error: "LINE_CHANNEL_ACCESS_TOKEN is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the bill, room, and tenant info to find line_user_id
    const { data: bill, error: billError } = await supabase
      .from("bills")
      .select(`
        *,
        rooms (
          id,
          name,
          user_id,
          tenants (
            id,
            full_name,
            line_user_id
          )
        )
      `)
      .eq("id", billId)
      .single();

    if (billError || !bill) {
      return new Response(JSON.stringify({ error: "Bill not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const room = (bill as any).rooms;
    // Assume we notify the primary tenant or the first tenant with a LINE ID
    const tenants = room.tenants || [];
    const tenantWithLine = tenants.find((t: any) => t.line_user_id);

    if (!tenantWithLine) {
      return new Response(JSON.stringify({ error: "No tenant with LINE connection found for this room" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lineUserId = tenantWithLine.line_user_id;

    // Get owner's settings for dorm name and LIFF ID
    const { data: settings } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", room.user_id)
      .single();

    const dormName = settings?.dorm_name || "หอพัก";
    const liffId = settings?.liff_id;

    // Fallback: If no liffId is set in user_settings, use a central one if available in ENV
    const finalLiffId = liffId || Deno.env.get("DEFAULT_LIFF_ID");

    if (!finalLiffId) {
      return new Response(JSON.stringify({ error: "LIFF ID is not configured. Please set it in Settings." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const totalAmount = bill.total.toLocaleString("th-TH");
    const liffUrl = `https://liff.line.me/${finalLiffId}/tenant-bill?room_id=${room.id}`;

    // Construct LINE Flex Message
    const flexMessage = {
      to: lineUserId,
      messages: [
        {
          type: "flex",
          altText: `บิลค่าเช่าห้อง ${room.name} เดือน ${bill.billing_month}`,
          contents: {
            type: "bubble",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: dormName,
                  weight: "bold",
                  color: "#ffffff",
                  size: "lg"
                },
                {
                  type: "text",
                  text: "ใบแจ้งหนี้ค่าเช่า",
                  color: "#ffffff",
                  size: "sm",
                  margin: "md"
                }
              ],
              backgroundColor: "#2563eb",
              paddingAll: "16px"
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "ห้อง",
                      color: "#888888",
                      size: "sm",
                      flex: 4
                    },
                    {
                      type: "text",
                      text: room.name,
                      wrap: true,
                      color: "#111111",
                      size: "sm",
                      flex: 6,
                      align: "end",
                      weight: "bold"
                    }
                  ],
                  paddingBottom: "8px"
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "ประจำเดือน",
                      color: "#888888",
                      size: "sm",
                      flex: 4
                    },
                    {
                      type: "text",
                      text: bill.billing_month,
                      wrap: true,
                      color: "#111111",
                      size: "sm",
                      flex: 6,
                      align: "end"
                    }
                  ],
                  paddingBottom: "12px"
                },
                {
                  type: "separator",
                  margin: "sm"
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "ยอดรวมทั้งสิ้น",
                      color: "#111111",
                      size: "md",
                      flex: 4,
                      weight: "bold"
                    },
                    {
                      type: "text",
                      text: `฿${totalAmount}`,
                      wrap: true,
                      color: "#e11d48",
                      size: "lg",
                      flex: 6,
                      align: "end",
                      weight: "bold"
                    }
                  ],
                  paddingTop: "12px",
                  paddingBottom: "4px"
                }
              ],
              paddingAll: "20px"
            },
            footer: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "button",
                  action: {
                    type: "uri",
                    label: "ดูรายละเอียดบิล",
                    uri: liffUrl
                  },
                  style: "primary",
                  color: "#2563eb",
                  height: "md"
                }
              ],
              paddingAll: "16px"
            }
          }
        }
      ]
    };

    // Send push message to LINE Messaging API
    const lineResponse = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lineAccessToken}`
      },
      body: JSON.stringify(flexMessage)
    });

    if (!lineResponse.ok) {
      const errorText = await lineResponse.text();
      console.error("LINE API Error:", errorText);
      return new Response(JSON.stringify({ error: `Failed to send LINE message: ${errorText}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Function Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
