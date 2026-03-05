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
    const url = new URL(req.url);
    const lineUserId = url.searchParams.get("line_user_id");
    const roomId = url.searchParams.get("room_id");

    if (!lineUserId) {
      return new Response(JSON.stringify({ error: "line_user_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find tenant by line_user_id
    let tenantQuery = supabase
      .from("tenants")
      .select("*, rooms(*)")
      .eq("line_user_id", lineUserId);

    if (roomId) {
      tenantQuery = tenantQuery.eq("room_id", roomId);
    }

    const { data: tenants, error: tenantError } = await tenantQuery;

    if (tenantError || !tenants || tenants.length === 0) {
      return new Response(JSON.stringify({ error: "tenant_not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tenant = tenants[0];
    const room = (tenant as any).rooms;

    if (!room) {
      return new Response(JSON.stringify({ error: "room_not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get owner settings
    const { data: settings } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", room.user_id)
      .single();

    // Get bills for this room
    const { data: bills } = await supabase
      .from("bills")
      .select("*")
      .eq("room_id", room.id)
      .order("billing_month", { ascending: false })
      .limit(12);

    // Calculate current bill from room data
    const electricityRate = settings?.electricity_rate || 8;
    const elecUnits = Math.max(0, room.current_meter - room.previous_meter);
    const elecCost = elecUnits * electricityRate;

    const currentBill = bills?.find((b: any) => b.billing_month === room.billing_month);
    const previousBalance = currentBill?.previous_balance || 0;
    const elecMeterPhoto = currentBill?.elec_meter_photo || null;
    const waterMeterPhoto = currentBill?.water_meter_photo || null;
    const slipUrl = currentBill?.slip_url || null;
    const slipStatus = currentBill?.slip_status || null;
    const slipUploadedAt = currentBill?.slip_uploaded_at || null;

    const total = room.rent + elecCost + room.water_cost + previousBalance;

    return new Response(JSON.stringify({
      tenant: {
        id: tenant.id,
        fullName: tenant.full_name,
        phone: tenant.phone,
      },
      room: {
        id: room.id,
        name: room.name,
        rent: room.rent,
        previousMeter: room.previous_meter,
        currentMeter: room.current_meter,
        waterCost: room.water_cost,
        isPaid: room.is_paid,
        billingMonth: room.billing_month,
      },
      bill: {
        electricityRate,
        elecUnits,
        elecCost,
        waterCost: room.water_cost,
        previousBalance,
        total,
        elecMeterPhoto,
        waterMeterPhoto,
        slipUrl,
        slipStatus,
        slipUploadedAt,
      },
      settings: settings ? {
        dormName: settings.dorm_name,
        bankName: settings.bank_name,
        accountNumber: settings.account_number,
        accountName: settings.account_name,
        qrCodeUrl: settings.qr_code_url,
        paymentDeadlineDays: settings.payment_deadline_days,
      } : null,
      bills: bills || [],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
