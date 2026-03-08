import { supabase } from '@/integrations/supabase/client';
import type { Room, Settings } from '@/types/rental';
import { defaultSettings } from '@/types/rental';

export class AppError {
  constructor(
    public message: string,
    public code?: string
  ) {}
}

const mapRoomFromDb = (r: any): Room => ({
  id: r.id,
  name: r.name,
  tenantName: r.tenant_name || '',
  rent: r.rent || 0,
  previousMeter: r.previous_meter || 0,
  currentMeter: r.current_meter || 0,
  waterCost: r.water_cost || 0,
  isPaid: r.is_paid || false,
  billingMonth: r.billing_month || '',
  note: r.note || '',
  moveInDate: r.move_in_date || '',
  tenantPhone: r.tenant_phone || '',
  tenantIdCardNumber: r.tenant_id_card_number || '',
  occupantCount: r.occupant_count || 1,
  tenantAddress: r.tenant_address || '',
  tenantEmergencyContact: r.tenant_emergency_contact || '',
  tenantEmergencyPhone: r.tenant_emergency_phone || '',
});

const mapRoomToDb = (room: Partial<Room>) => ({
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
});

export const roomService = {
  async getAll(): Promise<Room[]> {
    const { data, error } = await supabase.from('rooms').select('*');
    if (error) throw new AppError(error.message);
    return (data || []).map(mapRoomFromDb);
  },

  async create(room: Omit<Room, 'id'>): Promise<Room> {
    const { data, error } = await supabase.from('rooms').insert(mapRoomToDb(room) as any).select().single();
    if (error) throw new AppError(error.message);
    return mapRoomFromDb(data);
  },

  async update(room: Room): Promise<void> {
    const { error } = await supabase.from('rooms').update(mapRoomToDb(room) as any).eq('id', room.id);
    if (error) throw new AppError(error.message);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('rooms').delete().eq('id', id);
    if (error) throw new AppError(error.message);
  },

  async togglePaid(id: string, isPaid: boolean): Promise<void> {
    const { error } = await supabase.from('rooms').update({ is_paid: isPaid }).eq('id', id);
    if (error) throw new AppError(error.message);
  },
};

export const settingsService = {
  async get(): Promise<Settings> {
    const { data, error } = await supabase.from('user_settings').select('*').limit(1).single();
    if (error || !data) return defaultSettings;
    return {
      dormName: data.dorm_name || defaultSettings.dormName,
      defaultRent: data.default_rent || defaultSettings.defaultRent,
      electricityRate: data.electricity_rate || defaultSettings.electricityRate,
      defaultWaterCost: data.default_water_cost || defaultSettings.defaultWaterCost,
      bankName: data.bank_name || '',
      accountNumber: data.account_number || '',
      accountName: data.account_name || '',
      qrCodeUrl: data.qr_code_url || '',
      billingDay: data.billing_day || 1,
      paymentDeadlineDays: data.payment_deadline_days || 7,
    };
  },

  async update(settings: Settings): Promise<void> {
    const { error } = await supabase.from('user_settings').upsert({
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
    } as any, { onConflict: 'user_id' });
    if (error) throw new AppError(error.message);
  },
};
