import { useState, useRef, useEffect } from 'react';
import { useRental } from '@/contexts/RentalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Save, Upload, Trash2, Globe, LogOut, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function SettingsPage() {
  const { settings, updateSettings } = useRental();
  const { t, language, setLanguage } = useLanguage();
  const { signOut, user } = useAuth();
  const [form, setForm] = useState({ ...settings });
  const [liffId, setLiffId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load LIFF ID
  useEffect(() => {
    if (user) {
      supabase.from('user_settings').select('liff_id').eq('user_id', user.id).single().then(({ data }) => {
        if (data) setLiffId((data as any).liff_id || '');
      });
    }
  }, [user]);

  const update = (field: string, value: string | number) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    updateSettings(form);
    // Save LIFF ID
    if (user) {
      await supabase.from('user_settings').update({ liff_id: liffId } as any).eq('user_id', user.id);
    }
    toast.success(t('settings.saveSuccess'));
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('settings.fileTooLarge'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      update('qrCodeUrl', ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Layout>
      <div className="space-y-6 fade-in max-w-md mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{t('settings.title')}</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === 'th' ? 'shan' : 'th')}
            className="flex items-center gap-1.5"
          >
            <Globe className="w-4 h-4" />
            {language === 'th' ? 'ไทใหญ่' : 'ไทย'}
          </Button>
        </div>

        {/* Dorm Info */}
        <div className="bg-card rounded-xl border p-4 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground">{t('settings.dormInfo')}</h3>
          <div>
            <Label>{t('settings.dormName')}</Label>
            <Input value={form.dormName} onChange={e => update('dormName', e.target.value)} />
          </div>
          <div>
            <Label>{t('settings.billingDay')}</Label>
            <Input type="number" value={form.billingDay} onChange={e => update('billingDay', Number(e.target.value))} min={1} max={31} />
          </div>
          <div>
            <Label>{t('settings.deadlineDays')}</Label>
            <Input type="number" value={form.paymentDeadlineDays} onChange={e => update('paymentDeadlineDays', Number(e.target.value))} min={1} max={30} />
          </div>
        </div>

        {/* Default Rates */}
        <div className="bg-card rounded-xl border p-4 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground">{t('settings.rates')}</h3>
          <div>
            <Label>{t('settings.defaultRent')}</Label>
            <Input type="number" value={form.defaultRent} onChange={e => update('defaultRent', Number(e.target.value))} min={0} />
          </div>
          <div>
            <Label>{t('settings.electricityRate')}</Label>
            <Input type="number" value={form.electricityRate} onChange={e => update('electricityRate', Number(e.target.value))} min={0} step={0.5} />
          </div>
          <div>
            <Label>{t('settings.waterCost')}</Label>
            <Input type="number" value={form.defaultWaterCost} onChange={e => update('defaultWaterCost', Number(e.target.value))} min={0} />
          </div>
        </div>

        {/* Bank Info */}
        <div className="bg-card rounded-xl border p-4 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground">{t('settings.bankInfo')}</h3>
          <div>
            <Label>{t('settings.bankName')}</Label>
            <Input value={form.bankName} onChange={e => update('bankName', e.target.value)} placeholder={t('settings.bankNamePlaceholder')} />
          </div>
          <div>
            <Label>{t('settings.accountNumber')}</Label>
            <Input value={form.accountNumber} onChange={e => update('accountNumber', e.target.value)} placeholder={t('settings.accountNumberPlaceholder')} />
          </div>
          <div>
            <Label>{t('settings.accountNameLabel')}</Label>
            <Input value={form.accountName} onChange={e => update('accountName', e.target.value)} placeholder={t('settings.accountNamePlaceholder')} />
          </div>

          {/* QR Code */}
          <div>
            <Label>{t('settings.qrCode')}</Label>
            <div className="mt-2 space-y-2">
              {form.qrCodeUrl && (
                <div className="relative inline-block">
                  <img src={form.qrCodeUrl} alt="QR Code" className="w-32 h-32 rounded-lg object-contain border" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 w-6 h-6"
                    onClick={() => update('qrCodeUrl', '')}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleQrUpload} />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-1" /> {t('settings.uploadQR')}
              </Button>
            </div>
          </div>
        </div>

        {/* LINE LIFF */}
        <div className="bg-card rounded-xl border p-4 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4 text-green-500" /> LINE LIFF
          </h3>
          <div>
            <Label>LIFF ID</Label>
            <Input value={liffId} onChange={e => setLiffId(e.target.value)} placeholder="xxxx-xxxxxxxx" />
            <p className="text-xs text-muted-foreground mt-1">
              สร้าง LIFF App ใน LINE Developers Console แล้วนำ LIFF ID มาใส่ที่นี่
            </p>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full" size="lg">
          <Save className="w-4 h-4 mr-2" /> {t('settings.save')}
        </Button>

        <Button onClick={signOut} variant="outline" className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground" size="lg">
          <LogOut className="w-4 h-4 mr-2" /> {t('settings.logout')}
        </Button>
      </div>
    </Layout>
  );
}
