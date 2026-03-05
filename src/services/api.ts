import { supabase } from '@/integrations/supabase/client';
import type { Room, Settings } from '@/types/rental';
import { defaultSettings } from '@/types/rental';

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

const handleSupabaseError = (error: any, context: string): never => {
  console.error(`Error in ${context}:`, error);
  throw new AppError(
    error.message || 'เกิดข้อผิดพลาด',
    error.code,
    error.statusCode
  );
};

export const roomService = {
  async getAll(userId: string): Promise<Room[]> {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          *,
          bills (
            billing_month,
            previous_balance,
            elec_meter_photo,
            water_meter_photo,
            slip_url,
            slip_status,
            slip_uploaded_at
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) handleSupabaseError(error, 'roomService.getAll');

      if (!data) return [];

      return data.map((r: any) => {
        const currentBill = r.bills?.find((b: any) => b.billing_month === r.billing_month);
        return {
          id: r.id,
          name: r.name,
          tenantName: r.tenant_name || '',
          rent: Number(r.rent),
          previousMeter: Number(r.previous_meter),
          currentMeter: Number(r.current_meter),
          waterCost: Number(r.water_cost),
          isPaid: r.is_paid,
          billingMonth: r.billing_month,
          note: r.note || '',
          moveInDate: r.move_in_date || '',
          tenantPhone: r.tenant_phone || '',
          tenantIdCardNumber: r.tenant_id_card_number || '',
          occupantCount: r.occupant_count || 1,
          previousBalance: currentBill?.previous_balance || 0,
          tenantAddress: r.tenant_address || '',
          tenantEmergencyContact: r.tenant_emergency_contact || '',
          tenantEmergencyPhone: r.tenant_emergency_phone || '',
          elecMeterPhoto: currentBill?.elec_meter_photo || undefined,
          waterMeterPhoto: currentBill?.water_meter_photo || undefined,
          slipUrl: currentBill?.slip_url || undefined,
          slipStatus: currentBill?.slip_status || undefined,
          slipUploadedAt: currentBill?.slip_uploaded_at || undefined,
        };
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      handleSupabaseError(error, 'roomService.getAll');
    }
  },

  async create(userId: string, room: Omit<Room, 'id'>, electricityRate: number): Promise<Room | null> {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert({
          user_id: userId,
          name: room.name,
          tenant_name: room.tenantName,
          rent: room.rent,
          previous_meter: room.previousMeter,
          current_meter: room.currentMeter,
          water_cost: room.waterCost,
          is_paid: room.isPaid,
          billing_month: room.billingMonth,
          note: room.note,
          move_in_date: room.moveInDate,
          tenant_phone: room.tenantPhone,
          tenant_id_card_number: room.tenantIdCardNumber,
          occupant_count: room.occupantCount,
          tenant_address: room.tenantAddress,
          tenant_emergency_contact: room.tenantEmergencyContact,
          tenant_emergency_phone: room.tenantEmergencyPhone,
        } as any)
        .select()
        .single();

      if (error) handleSupabaseError(error, 'roomService.create');
      if (!data) return null;

      const r = data as any;
      const newRoom: Room = {
        id: r.id,
        name: r.name,
        tenantName: r.tenant_name || '',
        rent: Number(r.rent),
        previousMeter: Number(r.previous_meter),
        currentMeter: Number(r.current_meter),
        waterCost: Number(r.water_cost),
        isPaid: r.is_paid,
        billingMonth: r.billing_month,
        note: r.note || '',
        moveInDate: r.move_in_date || '',
        tenantPhone: r.tenant_phone || '',
        tenantIdCardNumber: r.tenant_id_card_number || '',
        occupantCount: r.occupant_count || 1,
        tenantAddress: r.tenant_address || '',
        tenantEmergencyContact: r.tenant_emergency_contact || '',
        tenantEmergencyPhone: r.tenant_emergency_phone || '',
        elecMeterPhoto: room.elecMeterPhoto,
        waterMeterPhoto: room.waterMeterPhoto,
        slipUrl: room.slipUrl,
        slipStatus: room.slipStatus,
        slipUploadedAt: room.slipUploadedAt,
      };

      const elecCost = (newRoom.currentMeter - newRoom.previousMeter) * electricityRate;
      const total = newRoom.rent + elecCost + newRoom.waterCost + (room.previousBalance || 0);

      const { error: billError } = await supabase.from('bills').insert({
        user_id: userId,
        room_id: r.id,
        room_name: newRoom.name,
        tenant_name: newRoom.tenantName,
        billing_month: newRoom.billingMonth,
        rent: newRoom.rent,
        previous_meter: newRoom.previousMeter,
        current_meter: newRoom.currentMeter,
        electricity_rate: electricityRate,
        electricity_cost: elecCost,
        water_cost: newRoom.waterCost,
        total: total,
        is_paid: newRoom.isPaid,
        previous_balance: 0,
        elec_meter_photo: room.elecMeterPhoto || null,
        water_meter_photo: room.waterMeterPhoto || null,
        slip_url: room.slipUrl || null,
        slip_status: room.slipStatus || null,
        slip_uploaded_at: room.slipUploadedAt || null,
      });

      if (billError) handleSupabaseError(billError, 'roomService.create (bill)');

      return newRoom;
    } catch (error) {
      if (error instanceof AppError) throw error;
      handleSupabaseError(error, 'roomService.create');
    }
  },

  async update(room: Room, userId: string, electricityRate: number): Promise<void> {
    try {
      const { error: roomError } = await supabase.from('rooms').update({
        name: room.name,
        tenant_name: room.tenantName,
        rent: room.rent,
        previous_meter: room.previousMeter,
        current_meter: room.currentMeter,
        water_cost: room.waterCost,
        is_paid: room.isPaid,
        note: room.note,
        move_in_date: room.moveInDate,
        tenant_phone: room.tenantPhone,
        tenant_id_card_number: room.tenantIdCardNumber,
        occupant_count: room.occupantCount,
        tenant_address: room.tenantAddress,
        tenant_emergency_contact: room.tenantEmergencyContact,
        tenant_emergency_phone: room.tenantEmergencyPhone,
      } as any).eq('id', room.id);

      if (roomError) handleSupabaseError(roomError, 'roomService.update');

      const { data: unpaidBills } = await supabase
        .from('bills')
        .select('total, previous_balance')
        .eq('room_id', room.id)
        .eq('is_paid', false)
        .lt('billing_month', room.billingMonth);

      const previous_balance = unpaidBills?.reduce((sum: number, b: any) => sum + Number(b.total || 0), 0) || 0;
      const elecCost = (room.currentMeter - room.previousMeter) * electricityRate;
      const total = room.rent + elecCost + room.waterCost + (room.previousBalance || 0);

      const { error: billError } = await supabase.from('bills').upsert({
        user_id: userId,
        room_id: room.id,
        billing_month: room.billingMonth,
        room_name: room.name,
        tenant_name: room.tenantName,
        rent: room.rent,
        previous_meter: room.previousMeter,
        current_meter: room.currentMeter,
        electricity_rate: electricityRate,
        electricity_cost: elecCost,
        water_cost: room.waterCost,
        total: total,
        is_paid: room.isPaid,
        previous_balance: previous_balance,
        elec_meter_photo: room.elecMeterPhoto || null,
        water_meter_photo: room.waterMeterPhoto || null,
        slip_url: room.slipUrl || null,
        slip_status: room.slipStatus || null,
        slip_uploaded_at: room.slipUploadedAt || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'room_id, billing_month' });

      if (billError) handleSupabaseError(billError, 'roomService.update (bill)');
    } catch (error) {
      if (error instanceof AppError) throw error;
      handleSupabaseError(error, 'roomService.update');
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('rooms').delete().eq('id', id);
      if (error) handleSupabaseError(error, 'roomService.delete');
    } catch (error) {
      if (error instanceof AppError) throw error;
      handleSupabaseError(error, 'roomService.delete');
    }
  },

  async togglePaid(id: string, isPaid: boolean): Promise<void> {
    try {
      const { error } = await supabase.from('rooms').update({ is_paid: isPaid }).eq('id', id);
      if (error) handleSupabaseError(error, 'roomService.togglePaid');
    } catch (error) {
      if (error instanceof AppError) throw error;
      handleSupabaseError(error, 'roomService.togglePaid');
    }
  },
};

export const settingsService = {
  async get(userId: string): Promise<Settings> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        handleSupabaseError(error, 'settingsService.get');
      }

      if (!data) return defaultSettings;

      return {
        dormName: data.dorm_name || defaultSettings.dormName,
        defaultRent: Number(data.default_rent),
        electricityRate: Number(data.electricity_rate),
        defaultWaterCost: Number(data.default_water_cost),
        bankName: data.bank_name || '',
        accountNumber: data.account_number || '',
        accountName: data.account_name || '',
        qrCodeUrl: data.qr_code_url || '',
        billingDay: data.billing_day || 1,
        paymentDeadlineDays: data.payment_deadline_days || 7,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      handleSupabaseError(error, 'settingsService.get');
    }
  },

  async update(userId: string, settings: Settings): Promise<void> {
    try {
      const { error } = await supabase.from('user_settings').update({
        dorm_name: settings.dormName,
        default_rent: settings.defaultRent,
        electricity_rate: settings.electricityRate,
        default_water_cost: settings.defaultWaterCost,
        bank_name: settings.bankName,
        account_number: settings.accountNumber,
        account_name: settings.accountName,
        qr_code_url: settings.qrCodeUrl,
        billing_day: settings.billingDay,
        payment_deadline_days: settings.paymentDeadlineDays,
      }).eq('user_id', userId);

      if (error) handleSupabaseError(error, 'settingsService.update');
    } catch (error) {
      if (error instanceof AppError) throw error;
      handleSupabaseError(error, 'settingsService.update');
    }
  },
};
