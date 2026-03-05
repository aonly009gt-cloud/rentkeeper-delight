import { useState } from 'react';
import { useRental } from '@/contexts/RentalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatMonth, Room } from '@/types/rental';
import Layout from '@/components/Layout';
import InvoiceTemplate from '@/components/InvoiceTemplate';
import PaymentSlipDialog from '@/components/PaymentSlipDialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, ChevronLeft, ChevronRight, Upload, MessageCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function InvoicePage() {
  const { rooms, selectedMonth, setSelectedMonth } = useRental();
  const { t } = useLanguage();
  const monthlyRooms = rooms.filter((r: Room) => r.billingMonth === selectedMonth);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [sendingLine, setSendingLine] = useState(false);
  const [printMode, setPrintMode] = useState<'single' | 'batch'>('single');
  const selectedRoom = monthlyRooms.find((r: Room) => r.id === selectedRoomId);

  const handlePrintSingle = () => {
    setPrintMode('single');
    setTimeout(() => window.print(), 100);
  };

  const handlePrintBatch = () => {
    setPrintMode('batch');
    setTimeout(() => window.print(), 100);
  };

  const changeMonth = (delta: number) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleSendLine = async () => {
    if (!selectedRoom) return;
    setSendingLine(true);

    try {
      // First, get the bill ID for this room and month
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .select('id')
        .eq('room_id', selectedRoom.id)
        .eq('billing_month', selectedRoom.billingMonth)
        .single();

      if (billError || !billData) {
        toast.error('ไม่พบบิลสำหรับเดือนนี้ กรุณาบันทึกข้อมูลและลองอีกครั้ง');
        setSendingLine(false);
        return;
      }

      // Call edge function
      const { data, error } = await supabase.functions.invoke('send-line-notification', {
        body: { billId: billData.id }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('ส่งใบแจ้งหนี้ผ่าน LINE สำเร็จ');
    } catch (err: any) {
      console.error('Error sending LINE message:', err);
      toast.error(`ส่ง LINE ไม่สำเร็จ: ${err.message || 'เกิดข้อผิดพลาด'}`);
    } finally {
      setSendingLine(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-4 fade-in">
        {/* Month Selector */}
        <div className="flex items-center justify-between no-print">
          <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-bold">{t('invoice.title')} - {formatMonth(selectedMonth)}</h2>
          <Button variant="ghost" size="icon" onClick={() => changeMonth(1)}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Room Selector */}
        <div className="no-print">
          <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
            <SelectTrigger>
              <SelectValue placeholder={t('invoice.selectRoom')} />
            </SelectTrigger>
            <SelectContent>
              {monthlyRooms.map((room: Room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.name} {room.tenantName ? `- ${room.tenantName}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Non-Print UI Controls for Batch Print */}
        {monthlyRooms.length > 0 && !selectedRoom && (
          <div className="flex justify-center no-print my-8">
            <Button onClick={handlePrintBatch} size="lg" variant="outline" className="w-full max-w-md border-primary text-primary hover:bg-primary/5">
              <Printer className="w-5 h-5 mr-2" /> พิมพ์ใบแจ้งหนี้ทั้งหมด ({monthlyRooms.length} ห้อง)
            </Button>
          </div>
        )}

        {/* Single Invoice screen view */}
        {selectedRoom ? (
          <>
            <div className={`print:${printMode === 'batch' ? 'hidden' : 'block'}`}>
              <InvoiceTemplate room={selectedRoom} />
            </div>
            <div className="flex flex-col gap-2 no-print max-w-md mx-auto mt-6">
              <div className="flex gap-2">
                <Button onClick={handlePrintSingle} className="flex-1" size="lg">
                  <Printer className="w-4 h-4 mr-2" /> พิมพ์ใบนี้
                </Button>
                <Button onClick={handlePrintBatch} variant="secondary" className="flex-1" size="lg">
                  <Printer className="w-4 h-4 mr-2" /> พิมพ์ทั้งหมด
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSendLine}
                  variant="outline"
                  size="lg"
                  className="flex-1 text-green-600 border-green-300 hover:bg-green-50"
                  disabled={sendingLine}
                >
                  {sendingLine ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> กำลังส่ง...</>
                  ) : (
                    <><MessageCircle className="w-4 h-4 mr-2" /> ส่งบิลผ่าน LINE</>
                  )}
                </Button>
                <Button onClick={() => setPaymentDialogOpen(true)} variant="outline" size="lg" className="flex-1">
                  <Upload className="w-4 h-4 mr-2" /> {t('payment.notify')}
                </Button>
              </div>
            </div>
            <PaymentSlipDialog
              open={paymentDialogOpen}
              onClose={() => setPaymentDialogOpen(false)}
              room={selectedRoom}
            />
          </>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-5xl mb-3">🧾</p>
            {monthlyRooms.length > 0 ? (
              <p>{t('invoice.selectPrompt')}</p>
            ) : (
              <p>{t('invoice.noRooms')}</p>
            )}
          </div>
        )}

        {/* Batch Print View (Hidden on screen, visible during print) */}
        <div className={`hidden print:${printMode === 'batch' ? 'block' : 'hidden'}`}>
          <div className="flex flex-col">
            {monthlyRooms.map((r: Room, i: number) => (
              <div key={r.id} className={i < monthlyRooms.length - 1 ? "break-after-page mb-8" : ""}>
                <InvoiceTemplate room={r} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
