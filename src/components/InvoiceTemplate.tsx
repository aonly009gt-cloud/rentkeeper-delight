import { Room, calculateElectricity, calculateTotal, formatCurrency, formatMonth } from '@/types/rental';
import { useRental } from '@/contexts/RentalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Droplets, Zap, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface InvoiceTemplateProps {
  room: Room;
}

export default function InvoiceTemplate({ room }: InvoiceTemplateProps) {
  const { settings } = useRental();
  const { t } = useLanguage();
  const elecUnits = Math.max(0, room.currentMeter - room.previousMeter);
  const elecCost = calculateElectricity(room.currentMeter, room.previousMeter, settings.electricityRate);
  const total = calculateTotal(room, settings.electricityRate);

  const deadlineDays = settings.paymentDeadlineDays || 7;

  const handleVerifySlip = async (status: 'verified' | 'rejected') => {
    try {
      await supabase.from('bills').update({
        slip_status: status,
        is_paid: status === 'verified'
      }).eq('room_id', room.id).eq('billing_month', room.billingMonth);

      if (status === 'verified') {
        await supabase.from('rooms').update({ is_paid: true }).eq('id', room.id);
      } else {
        await supabase.from('rooms').update({ is_paid: false }).eq('id', room.id);
      }

      toast.success(status === 'verified' ? 'ยืนยันสลิปสำเร็จ (ตั้งค่าเป็นชำระแล้ว)' : 'ปฏิเสธสลิปแล้ว');
      // In a real app we would trigger a context refresh here or passed a callback
      window.location.reload();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  return (
    <div className="bg-zinc-950 text-zinc-100 p-8 rounded-2xl border border-amber-500/30 shadow-2xl max-w-md mx-auto relative overflow-hidden print:bg-white print:text-black print:border-gray-200" id="invoice-content">
      {/* Premium background decorative element */}
      <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700 opacity-80 print:hidden"></div>

      {room.isPaid && (
        <div className="absolute top-6 right-6 print:hidden z-10">
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 text-sm shadow-md">
            <CheckCircle className="w-4 h-4 mr-1.5 inline-block" /> ชำระแล้ว
          </Badge>
        </div>
      )}
      {/* Header & Logo */}
      <div className="text-center border-b border-amber-500/20 pb-6 mb-6">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20 print:shadow-none print:border print:border-black print:bg-none print:bg-white">
          <span className="text-2xl font-black text-zinc-950 print:text-black tracking-tighter">371</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-amber-500 print:text-black">{t('invoice.header')}</h2>
        <p className="text-lg font-medium text-zinc-300 print:text-gray-800 mt-1">{settings.dormName}</p>
        <p className="text-sm text-zinc-500 print:text-gray-500 mt-1 uppercase tracking-widest">{t('invoice.month')} {formatMonth(room.billingMonth)}</p>
      </div>

      {/* Room Info */}
      <div className="mb-6 space-y-2">
        <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 print:bg-gray-50 border border-white/5 print:border-gray-200">
          <span className="text-zinc-400 print:text-gray-500 text-sm uppercase tracking-wider">{t('invoice.room')}</span>
          <span className="font-bold text-xl text-amber-500 print:text-black">{room.name}</span>
        </div>
        {room.tenantName && (
          <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 print:bg-gray-50 border border-white/5 print:border-gray-200">
            <span className="text-zinc-400 print:text-gray-500 text-sm uppercase tracking-wider">{t('invoice.tenant')}</span>
            <span className="font-medium text-zinc-200 print:text-gray-800">{room.tenantName}</span>
          </div>
        )}
      </div>

      {/* Billing Details */}
      <div className="space-y-3 mb-6 px-2">
        <div className="flex justify-between text-sm py-1">
          <span className="text-zinc-300 print:text-gray-600">{t('room.rent')}</span>
          <span className="font-medium text-zinc-100 print:text-black">{formatCurrency(room.rent)} ฿</span>
        </div>
        <div className="flex justify-between text-sm py-1">
          <span className="flex items-center gap-2 text-zinc-300 print:text-gray-600">
            <Zap className="w-4 h-4 text-amber-500 print:text-gray-500" />
            <span>{t('room.electricity')} ({room.previousMeter} &rarr; {room.currentMeter} = {elecUnits} {t('room.unit')})</span>
          </span>
          <span className="font-medium text-zinc-100 print:text-black">{formatCurrency(elecCost)} ฿</span>
        </div>
        <div className="flex justify-between text-sm py-1">
          <span className="flex items-center gap-2 text-zinc-300 print:text-gray-600">
            <Droplets className="w-4 h-4 text-blue-400 print:text-gray-500" />
            {t('room.water')}
          </span>
          <span className="font-medium text-zinc-100 print:text-black">{formatCurrency(room.waterCost)} ฿</span>
        </div>
        {(room.previousBalance || 0) > 0 && (
          <div className="flex justify-between text-sm py-2 text-red-400 print:text-red-600 border-t border-red-500/20 mt-2">
            <span>ยอดยกมา (ค้างชำระ)</span>
            <span className="font-medium">{formatCurrency(room.previousBalance!)} ฿</span>
          </div>
        )}
      </div>

      {/* Total Summary */}
      <div className="bg-gradient-to-br from-amber-500 to-amber-600 print:bg-none print:bg-gray-100 print:border print:border-black rounded-xl p-5 mb-6 shadow-lg shadow-amber-500/20 print:shadow-none text-zinc-950 print:text-black relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/20 rounded-full blur-2xl print:hidden"></div>
        <div className="flex justify-between items-end relative z-10">
          <span className="text-sm font-bold uppercase tracking-wider opacity-90 pb-1">{t('invoice.totalAmount')}</span>
          <div className="text-right flex items-baseline gap-1">
            <span className="text-4xl font-black tracking-tighter">{formatCurrency(total)}</span>
            <span className="text-lg font-bold opacity-90">฿</span>
          </div>
        </div>
      </div>

      {/* Meter Photos */}
      {(room.elecMeterPhoto || room.waterMeterPhoto) && (
        <div className="mb-6 grid grid-cols-2 gap-4 border-t border-amber-500/20 pt-6">
          {room.elecMeterPhoto && (
            <div className="text-center group">
              <p className="text-xs text-zinc-400 print:text-gray-500 mb-2 uppercase tracking-wider">รูปมิเตอร์ไฟ</p>
              <img src={room.elecMeterPhoto} alt="Electric Meter" className="w-full h-32 object-cover rounded-xl border border-amber-500/20 group-hover:border-amber-500/50 transition-colors" />
            </div>
          )}
          {room.waterMeterPhoto && (
            <div className="text-center group">
              <p className="text-xs text-zinc-400 print:text-gray-500 mb-2 uppercase tracking-wider">รูปมิเตอร์น้ำ</p>
              <img src={room.waterMeterPhoto} alt="Water Meter" className="w-full h-32 object-cover rounded-xl border border-amber-500/20 group-hover:border-amber-500/50 transition-colors" />
            </div>
          )}
        </div>
      )}

      {/* Slip Photos & Verification */}
      {room.slipUrl && (
        <div className="mb-4 border-t pt-4 print:hidden">
          <h4 className="font-semibold text-sm mb-3">หลักฐานการโอนเงิน</h4>
          <div className="bg-muted/50 p-2 rounded-lg text-center">
            <img src={room.slipUrl} alt="Payment Slip" className="w-48 mx-auto rounded object-contain border mb-3 shadow-sm bg-white" />

            {room.slipStatus === 'pending' && (
              <div className="space-y-2">
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 w-full justify-center mb-2">รอการตรวจสอบ</Badge>
                <div className="flex gap-2 justify-center">
                  <Button size="sm" onClick={() => handleVerifySlip('verified')} className="bg-green-600 hover:bg-green-700 text-white">
                    <CheckCircle className="w-4 h-4 mr-1" /> อนุมัติสลิป
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleVerifySlip('rejected')} className="text-destructive border-destructive hover:bg-destructive/10">
                    <XCircle className="w-4 h-4 mr-1" /> ไม่อนุมัติ
                  </Button>
                </div>
              </div>
            )}
            {room.slipStatus === 'verified' && <Badge className="bg-green-100 text-green-800">ตรวจสอบแล้ว</Badge>}
            {room.slipStatus === 'rejected' && <Badge variant="destructive">สลิปไม่ถูกต้อง / ถูกปฏิเสธ</Badge>}
          </div>
        </div>
      )}

      {/* Payment Info */}
      {(settings.bankName || settings.qrCodeUrl) && (
        <div className="border-t border-amber-500/20 pt-6">
          <h4 className="font-semibold text-sm mb-4 text-amber-500 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            {t('invoice.paymentInfo')}
          </h4>

          <div className="flex flex-col md:flex-row gap-6 items-center flex-col-reverse md:flex-row md:items-start justify-between bg-white/5 print:bg-gray-50 p-5 rounded-xl border border-white/5 print:border-gray-200">
            {settings.bankName && (
              <div className="text-sm space-y-3 text-zinc-300 print:text-gray-700 flex-1 w-full">
                <div>
                  <p className="text-xs text-zinc-500 print:text-gray-500 uppercase tracking-wider mb-1 mt-1 font-bold">{t('invoice.bank')}</p>
                  <p className="font-bold text-base text-amber-400 print:text-black">{settings.bankName}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 print:text-gray-500 uppercase tracking-wider mb-1 mt-1 font-bold">{t('invoice.accountNo')}</p>
                  <p className="font-mono font-bold text-lg text-zinc-100 print:text-black bg-white/10 print:bg-white inline-block px-3 py-1 rounded-lg tracking-widest border border-white/5 print:border-gray-300">{settings.accountNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 print:text-gray-500 uppercase tracking-wider mb-1 mt-1 font-bold">{t('invoice.accountName')}</p>
                  <p className="font-medium text-zinc-100 print:text-black">{settings.accountName}</p>
                </div>
              </div>
            )}
            {settings.qrCodeUrl && (
              <div className="text-center shrink-0 w-full md:w-auto flex flex-col items-center">
                <div className="bg-white p-3 rounded-xl shadow-lg border border-amber-500/20 inline-block">
                  <img src={settings.qrCodeUrl} alt="QR Code PromptPay" className="w-32 h-32 object-contain" />
                </div>
                <p className="text-xs text-zinc-400 print:text-gray-800 mt-3 font-bold bg-white/10 print:bg-gray-200 px-3 py-1 rounded-full inline-block">{t('invoice.scanQR')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center mt-6 pt-6 border-t border-amber-500/20 text-xs text-zinc-400 print:text-gray-600">
        <div className="inline-flex items-center justify-center gap-1.5 bg-red-500/10 text-red-400 print:bg-red-50 print:text-red-700 font-bold px-4 py-2 rounded-full border border-red-500/20 mb-4 print:border-red-200">
          <span>⏰</span> {t('invoice.deadline', { days: deadlineDays })}
        </div>
        <p className="font-medium italic text-zinc-500 print:text-gray-500">{t('invoice.thanks')}</p>
      </div>
    </div>
  );
}
