export const MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

export const DEFAULT_SETTINGS = {
  dormName: 'หอพักของฉัน',
  defaultRent: 3000,
  electricityRate: 8,
  defaultWaterCost: 100,
  billingDay: 1,
  paymentDeadlineDays: 7,
};

export const BILL_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
} as const;
