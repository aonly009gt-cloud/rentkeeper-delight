import { useState, useEffect } from 'react';
import liff from '@line/liff';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatMonth } from '@/types/rental';
import { Droplets, Zap, CheckCircle, AlertCircle, Loader2, Wrench, Camera } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import MaintenanceRequestForm from '@/components/MaintenanceRequestForm';
import { Button } from '@/components/ui/button';

interface BillData {
  tenant: { id: string; fullName: string; phone: string };
  room: { id: string; name: string; rent: number; previousMeter: number; currentMeter: number; waterCost: number; isPaid: boolean; billingMonth: string };
  bill: { electricityRate: number; elecUnits: number; elecCost: number; waterCost: number; previousBalance?: number; total: number; elecMeterPhoto?: string; waterMeterPhoto?: string; slipUrl?: string; slipStatus?: 'pending' | 'verified' | 'rejected'; slipUploadedAt?: string };
  settings: { dormName: string; bankName: string; accountNumber: string; accountName: string; qrCodeUrl: string; paymentDeadlineDays: number } | null;
}

type PageState = 'loading' | 'no-line' | 'not-registered' | 'bill';

export default function TenantBillPage() {
  const [state, setState] = useState<PageState>('loading');
  const [billData, setBillData] = useState<BillData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [uploadingSlip, setUploadingSlip] = useState(false);

  useEffect(() => {
    initLiff();
  }, []);

  const initLiff = async () => {
    const params = new URLSearchParams(window.location.search);
    const liffId = params.get('liffId') || import.meta.env.VITE_LINE_LIFF_ID;

    if (!liffId) {
      setState('no-line');
      setError('ไม่พบ LIFF ID กรุณาตรวจสอบการตั้งค่า หรือเข้าใช้งานผ่าน LINE ของหอพัก');
      return;
    }

    try {
      await liff.init({ liffId });

      if (!liff.isLoggedIn()) {
        liff.login();
        return;
      }

      const profile = await liff.getProfile();
      const lineUserId = profile.userId;

      // Fetch bill via edge function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const roomId = params.get('room_id') || '';

      const res = await fetch(
        `${supabaseUrl}/functions/v1/get-tenant-bill?line_user_id=${encodeURIComponent(lineUserId)}&room_id=${encodeURIComponent(roomId)}`,
        { headers: { 'apikey': supabaseKey } }
      );

      const result = await res.json();

      if (result.error === 'tenant_not_found') {
        setState('not-registered');
        return;
      }

      if (result.error) {
        setError(result.error);
        setState('no-line');
        return;
      }

      setBillData(result);
      setState('bill');
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
      setState('no-line');
    }
  };

  const handleSlipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !billData) return;
    const file = e.target.files[0];
    setUploadingSlip(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `slip-${billData.room.id}-${billData.room.billingMonth}-${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-slips')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('payment-slips')
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData.publicUrl;

      // Update bill record
      const { error: updateError } = await supabase
        .from('bills')
        .update({
          slip_url: publicUrl,
          slip_status: 'pending',
          slip_uploaded_at: new Date().toISOString()
        })
        .eq('room_id', billData.room.id)
        .eq('billing_month', billData.room.billingMonth);

      if (updateError) throw updateError;

      setBillData(prev => prev ? {
        ...prev,
        bill: {
          ...prev.bill,
          slipUrl: publicUrl,
          slipStatus: 'pending',
          slipUploadedAt: new Date().toISOString()
        }
      } : null);

    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการอัพโหลดสลิป');
    } finally {
      setUploadingSlip(false);
    }
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  if (state === 'no-line') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">ไม่สามารถเข้าใช้งานได้</h2>
        <p className="text-muted-foreground">{error || 'กรุณาเข้าใช้งานผ่าน LINE ของหอพัก'}</p>
      </div>
    );
  }

  if (state === 'not-registered') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <AlertCircle className="w-16 h-16 text-accent mb-4" />
        <h2 className="text-xl font-bold mb-2">ยังไม่ได้ลงทะเบียน</h2>
        <p className="text-muted-foreground">กรุณาติดต่อเจ้าของหอพักเพื่อลงทะเบียน LINE กับห้องของคุณ</p>
      </div>
    );
  }

  if (!billData) return null;

  const { room, bill, settings, tenant } = billData;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 pb-8">
        <h1 className="text-xl font-bold text-center">{settings?.dormName || 'หอพัก'}</h1>
        <p className="text-center text-sm opacity-80 mt-1">ใบแจ้งหนี้ประจำเดือน {formatMonth(room.billingMonth)}</p>
      </div>

      {/* Bill Card */}
      <div className="px-4 -mt-4">
        <div className="bg-card rounded-2xl border shadow-lg p-5 space-y-4">
          {/* Room & Tenant */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">{room.name}</h2>
              <p className="text-sm text-muted-foreground">👤 {tenant.fullName}</p>
            </div>
            <Badge className={room.isPaid ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}>
              {room.isPaid ? <><CheckCircle className="w-3 h-3 mr-1" />ชำระแล้ว</> : <><AlertCircle className="w-3 h-3 mr-1" />ค้างชำระ</>}
            </Badge>
          </div>

          {/* Billing Details */}
          <div className="bg-muted rounded-xl p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span>🏠 ค่าเช่า</span>
              <span className="font-medium">{formatCurrency(room.rent)} ฿</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-accent" /> ค่าไฟ ({room.previousMeter} → {room.currentMeter} = {bill.elecUnits} หน่วย × {bill.electricityRate}฿)
              </span>
              <span className="font-medium">{formatCurrency(bill.elecCost)} ฿</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-primary" /> ค่าน้ำ
              </span>
              <span className="font-medium">{formatCurrency(bill.waterCost)} ฿</span>
            </div>
            {(bill.previousBalance || 0) > 0 && (
              <div className="flex justify-between text-sm text-destructive">
                <span>ยอดยกมา (ค้างชำระ)</span>
                <span className="font-medium">{formatCurrency(bill.previousBalance!)} ฿</span>
              </div>
            )}
            <div className="border-t pt-3 flex justify-between font-bold text-lg">
              <span>💰 รวมทั้งสิ้น</span>
              <span className="text-primary">{formatCurrency(bill.total)} ฿</span>
            </div>
          </div>

          {/* Meter Photos */}
          {(bill.elecMeterPhoto || bill.waterMeterPhoto) && (
            <div className="grid grid-cols-2 gap-4">
              {bill.elecMeterPhoto && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">รูปมิเตอร์ไฟ</p>
                  <img src={bill.elecMeterPhoto} alt="Electric Meter" className="w-full h-32 object-cover rounded-lg border" />
                </div>
              )}
              {bill.waterMeterPhoto && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">รูปมิเตอร์น้ำ</p>
                  <img src={bill.waterMeterPhoto} alt="Water Meter" className="w-full h-32 object-cover rounded-lg border" />
                </div>
              )}
            </div>
          )}

          {/* Payment Info */}
          {settings && (settings.bankName || settings.qrCodeUrl) && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">🏦 ข้อมูลการชำระเงิน</h3>
              {settings.bankName && (
                <div className="text-sm space-y-0.5">
                  <p>ธนาคาร: <span className="font-medium">{settings.bankName}</span></p>
                  <p>เลขบัญชี: <span className="font-medium">{settings.accountNumber}</span></p>
                  <p>ชื่อบัญชี: <span className="font-medium">{settings.accountName}</span></p>
                </div>
              )}
              {settings.qrCodeUrl && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2">สแกน QR Code เพื่อชำระเงิน</p>
                  <img src={settings.qrCodeUrl} alt="QR Code" className="w-48 h-48 mx-auto rounded-xl object-contain" />
                </div>
              )}
            </div>
          )}

          {/* Slip Upload Area */}
          <div className="pt-4 border-t">
            {!billData.bill.slipUrl ? (
              <div className="text-center">
                <p className="text-sm font-semibold mb-2">อัพโหลดหลักฐานการโอนเงิน (สลิป)</p>
                <Label className={`cursor-pointer w-full flex items-center justify-center p-3 rounded-lg border-2 border-dashed ${uploadingSlip ? 'bg-muted' : 'border-primary text-primary hover:bg-primary/5'}`}>
                  {uploadingSlip ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : <div className="flex items-center gap-2"><Camera className="w-5 h-5" /> อัพโหลดสลิป</div>}
                  <input type="file" accept="image/*" className="hidden" onChange={handleSlipUpload} disabled={uploadingSlip} />
                </Label>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm font-semibold mb-2">สลิปการโอนเงิน</p>
                <img src={billData.bill.slipUrl} alt="Payment Slip" className="w-48 mx-auto rounded-xl object-contain border mb-2" />
                {billData.bill.slipStatus === 'pending' && <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300">รอการตรวจสอบ</Badge>}
                {billData.bill.slipStatus === 'verified' && <Badge className="bg-green-100 text-green-800 border-green-300">ตรวจสอบแล้ว ยอดถูกต้อง</Badge>}
                {billData.bill.slipStatus === 'rejected' && <Badge variant="destructive">สลิปไม่ถูกต้อง โปรดติดต่อเจ้าของ</Badge>}
              </div>
            )}
          </div>

          {/* Deadline */}
          <div className="text-center pt-2 border-t">
            <p className="text-sm font-semibold text-destructive">
              ⏰ กรุณาชำระภายใน {settings?.paymentDeadlineDays || 7} วัน
            </p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">ขอบคุณครับ/ค่ะ 🙏</p>
          </div>

          {/* Maintenance Button */}
          <div className="pt-2">
            <Button variant="outline" className="w-full text-amber-600 border-amber-300 hover:bg-amber-50" onClick={() => setMaintenanceOpen(true)}>
              <Wrench className="w-4 h-4 mr-2" /> แจ้งซ่อม / ร้องเรียน
            </Button>
          </div>
        </div>
      </div>

      <MaintenanceRequestForm
        open={maintenanceOpen}
        onClose={() => setMaintenanceOpen(false)}
        roomId={room.id}
        tenantId={tenant.id}
      />
    </div>
  );
}
