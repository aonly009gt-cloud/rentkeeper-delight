import { useState, useEffect } from 'react';
import { useRental } from '@/contexts/RentalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { calculateTotal, formatCurrency, formatMonth, Room } from '@/types/rental';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ExpenseManager from './ExpenseManager';

export default function MonthlyReport() {
  const { rooms, settings } = useRental();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [bills, setBills] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchBills = async () => {
      const { data } = await supabase
        .from('bills')
        .select('billing_month, total, is_paid')
        .eq('user_id', user.id);
      if (data) setBills(data);

      const { data: expData } = await supabase
        .from('expenses')
        .select('date, amount')
        .eq('user_id', user.id);
      if (expData) setExpenses(expData);
    };
    fetchBills();
  }, [user]);

  const monthlyData: Record<string, { income: number; arrears: number; expenses: number; total: number }> = {};

  // Initialize with last 6 months to ensure they show up even if empty
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[m] = { income: 0, arrears: 0, expenses: 0, total: 0 };
  }

  bills.forEach(bill => {
    const m = bill.billing_month;
    if (!monthlyData[m]) monthlyData[m] = { income: 0, arrears: 0, expenses: 0, total: 0 };
    monthlyData[m].total++;
    if (bill.is_paid) {
      monthlyData[m].income += Number(bill.total);
    } else {
      monthlyData[m].arrears += Number(bill.total);
    }
  });

  expenses.forEach(exp => {
    const d = new Date(exp.date);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyData[m]) {
      monthlyData[m].expenses += Number(exp.amount);
    }
  });

  const incomeLabel = t('report.incomeLabel') || 'รายได้';
  const arrearsLabel = 'ยอดค้างชำระ';

  const chartData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, data]) => ({
      month: formatMonth(month),
      [incomeLabel]: data.income,
      [arrearsLabel]: data.arrears,
      'รายจ่าย': data.expenses,
      'กำไรสุทธิ': data.income - data.expenses,
    }));

  const cm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthRooms = rooms.filter((r: Room) => r.billingMonth === cm);

  const paidCount = currentMonthRooms.filter((r: Room) => r.isPaid).length;
  const unpaidCount = currentMonthRooms.filter((r: Room) => !r.isPaid).length;
  const totalIncome = currentMonthRooms
    .filter((r: Room) => r.isPaid)
    .reduce((sum: number, r: Room) => sum + calculateTotal(r, settings.electricityRate), 0);
  const pendingIncome = currentMonthRooms
    .filter((r: Room) => !r.isPaid)
    .reduce((sum: number, r: Room) => sum + calculateTotal(r, settings.electricityRate), 0);

  const currentMonthExpenses = expenses
    .filter((e: any) => e.date.startsWith(cm))
    .reduce((sum: number, e: any) => sum + Number(e.amount), 0);

  const netProfit = totalIncome - currentMonthExpenses;

  const occupiedRooms = rooms.filter((r: Room) => r.tenantName && r.tenantName.trim().length > 0).length;
  const occupancyRate = rooms.length > 0 ? Math.round((occupiedRooms / rooms.length) * 100) : 0;

  const pieData = [
    { name: t('room.paid'), value: paidCount, color: 'hsl(152, 60%, 42%)' },
    { name: t('room.unpaid'), value: unpaidCount, color: 'hsl(0, 72%, 51%)' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 fade-in">
      <h2 className="text-xl font-bold">{t('report.title')}</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-card rounded-xl border p-4 text-center">
          <p className="text-xs text-muted-foreground">{t('report.income')}เดือนนี้</p>
          <p className="text-xl font-bold text-primary mt-1">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 text-center">
          <p className="text-xs text-muted-foreground">รายจ่ายเดือนนี้</p>
          <p className="text-xl font-bold text-destructive mt-1">{formatCurrency(currentMonthExpenses)}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 text-center">
          <p className="text-xs text-muted-foreground">กำไรสุทธิ</p>
          <p className="text-xl font-bold text-success mt-1">{formatCurrency(netProfit)}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 text-center relative overflow-hidden group">
          <p className="text-xs text-muted-foreground">ยอดค้างชำระทั้งหมด</p>
          <p className="text-xl font-bold text-amber-500 mt-1">{formatCurrency(pendingIncome)}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 text-center">
          <p className="text-xs text-muted-foreground">อัตราการเช่า</p>
          <p className="text-xl font-bold text-accent mt-1">{occupancyRate}%</p>
        </div>
        <div className="bg-card rounded-xl border p-4 text-center">
          <p className="text-xs text-muted-foreground">{t('report.paidRooms')}</p>
          <p className="text-xl font-bold text-success mt-1">{paidCount} <span className="text-sm font-normal text-muted-foreground">/ {currentMonthRooms.length}</span></p>
        </div>
      </div>

      {/* Bar Chart */}
      {chartData.length > 0 && (
        <div className="bg-card rounded-xl border p-4">
          <h3 className="font-semibold mb-4">{t('report.chartIncome')}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" />
              <XAxis dataKey="month" fontSize={11} />
              <YAxis fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => [`${formatCurrency(value)} ฿`]} />
              <Bar dataKey={incomeLabel} fill="hsl(162, 47%, 42%)" radius={[4, 4, 0, 0]} name={incomeLabel} />
              <Bar dataKey={arrearsLabel} fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} name={arrearsLabel} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Pie Chart */}
      {pieData.length > 0 && (
        <div className="bg-card rounded-xl border p-4">
          <h3 className="font-semibold mb-4">{t('report.chartPayment')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {rooms.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-2">📭</p>
          <p>{t('report.noData')}</p>
        </div>
      )}

      {/* Expense Manager section */}
      {rooms.length > 0 && <ExpenseManager />}
    </div>
  );
}
