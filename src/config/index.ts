export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
  },
  line: {
    liffId: import.meta.env.VITE_LINE_LIFF_ID || '',
  },
  app: {
    name: 'ห้องเช่าช่างพัฒน์ 371',
    version: '1.0.0',
  },
  billing: {
    defaultDay: 1,
    defaultDeadlineDays: 7,
  },
};

export const routes = {
  home: '/',
  auth: '/auth',
  settings: '/settings',
  invoice: '/invoice',
  report: '/report',
  maintenance: '/maintenance',
  tenantBill: '/tenant-bill',
  lineRegister: '/line-register',
  lease: '/lease',
};
