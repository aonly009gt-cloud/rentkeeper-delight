export interface Room {
  id: string;
  name: string;
  tenantName: string;
  rent: number;
  previousMeter: number;
  currentMeter: number;
  waterCost: number;
  isPaid: boolean;
  billingMonth: string; // YYYY-MM
  note: string;
  moveInDate: string; // YYYY-MM-DD วันเริ่มเช่า
  tenantPhone: string;
  tenantIdCardNumber: string;
  occupantCount: number;
  previousBalance?: number;
  tenantAddress: string;
  tenantEmergencyContact: string;
  tenantEmergencyPhone: string;
  elecMeterPhoto?: string;
  waterMeterPhoto?: string;
  slipUrl?: string;
  slipStatus?: 'pending' | 'verified' | 'rejected';
  slipUploadedAt?: string;
}

export interface Settings {
  dormName: string;
  defaultRent: number;
  electricityRate: number;
  defaultWaterCost: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  qrCodeUrl: string;
  billingDay: number;
  paymentDeadlineDays: number; // จำนวนวันที่ต้องชำระหลังวันเริ่มเช่า
}

export interface MonthlyRecord {
  month: string;
  totalIncome: number;
  totalRooms: number;
  paidRooms: number;
  unpaidRooms: number;
}

export const defaultSettings: Settings = {
  dormName: 'หอพักของฉัน',
  defaultRent: 3000,
  electricityRate: 8,
  defaultWaterCost: 100,
  bankName: '',
  accountNumber: '',
  accountName: '',
  qrCodeUrl: '',
  billingDay: 1,
  paymentDeadlineDays: 7,
};

export function calculateElectricity(current: number, previous: number, rate: number): number {
  const units = Math.max(0, current - previous);
  return units * rate;
}

export function calculateTotal(room: Room, electricityRate: number): number {
  const elec = calculateElectricity(room.currentMeter, room.previousMeter, electricityRate);
  return room.rent + elec + room.waterCost + (room.previousBalance || 0);
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('th-TH', { minimumFractionDigits: 0 });
}

export function formatMonth(month: string): string {
  const [year, m] = month.split('-');
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  return `${months[parseInt(m) - 1]} ${parseInt(year) + 543}`;
}
