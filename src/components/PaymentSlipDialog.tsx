import { useState, useRef } from 'react';
import { Room, calculateElectricity, calculateTotal } from '@/types/rental';
import { useRental } from '@/contexts/RentalContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle, Loader2, Image } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentSlipDialogProps {
  open: boolean;
  onClose: () => void;
  room: Room;
}

export default function PaymentSlipDialog({ open, onClose, room }: PaymentSlipDialogProps) {
  const { settings } = useRental();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error(t('tenant.fileTooLarge'));
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);

    try {
      // Upload slip to storage
      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/${room.id}/${room.billingMonth}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-slips')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get the URL
      const { data: urlData } = supabase.storage
        .from('payment-slips')
        .getPublicUrl(filePath);

      // Since bucket is private, use signed URL approach
      const { data: signedData } = await supabase.storage
        .from('payment-slips')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

      const slipUrl = signedData?.signedUrl || filePath;

      // Find or create bill record
      const elecCost = calculateElectricity(room.currentMeter, room.previousMeter, settings.electricityRate);
      const total = calculateTotal(room, settings.electricityRate);

      const { data: existingBill } = await supabase
        .from('bills')
        .select('id')
        .eq('room_id', room.id)
        .eq('billing_month', room.billingMonth)
        .single();

      if (existingBill) {
        await supabase.from('bills').update({
          payment_slip_url: slipUrl,
        }).eq('id', existingBill.id);
      } else {
        await supabase.from('bills').insert({
          user_id: user.id,
          room_id: room.id,
          room_name: room.name,
          tenant_name: room.tenantName,
          billing_month: room.billingMonth,
          rent: room.rent,
          previous_meter: room.previousMeter,
          current_meter: room.currentMeter,
          electricity_rate: settings.electricityRate,
          electricity_cost: elecCost,
          water_cost: room.waterCost,
          total,
          is_paid: false,
          payment_slip_url: slipUrl,
        });
      }

      setDone(true);
      toast.success(t('payment.uploadSuccess'));
    } catch (err) {
      console.error(err);
      toast.error(t('payment.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview('');
    setDone(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('payment.title')}</DialogTitle>
          <DialogDescription>{t('payment.description')}</DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="text-center py-6">
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-3" />
            <p className="font-semibold text-lg">{t('payment.submitted')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('payment.pendingReview')}</p>
            <Button onClick={handleClose} className="mt-4 w-full">{t('payment.close')}</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {preview ? (
              <div className="relative">
                <img src={preview} alt="Payment slip" className="w-full rounded-lg border max-h-64 object-contain" />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => inputRef.current?.click()}
                >
                  {t('payment.changeImage')}
                </Button>
              </div>
            ) : (
              <button
                onClick={() => inputRef.current?.click()}
                className="w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Image className="w-10 h-10" />
                <span className="text-sm font-medium">{t('payment.selectImage')}</span>
              </button>
            )}

            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full"
              size="lg"
            >
              {uploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('payment.uploading')}</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" /> {t('payment.submit')}</>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
