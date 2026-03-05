import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Room } from '@/types/rental';
import { useRental } from '@/contexts/RentalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RoomFormProps {
  open: boolean;
  onClose: () => void;
  editRoom?: Room | null;
}

export default function RoomForm({ open, onClose, editRoom }: RoomFormProps) {
  const { settings, addRoom, updateRoom, selectedMonth } = useRental();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: '',
    tenantName: '',
    rent: settings.defaultRent,
    previousMeter: 0,
    currentMeter: 0,
    waterCost: settings.defaultWaterCost,
    note: '',
    moveInDate: new Date().toISOString().split('T')[0],
    elecMeterPhoto: undefined as string | undefined,
    waterMeterPhoto: undefined as string | undefined,
  });

  const [elecUploading, setElecUploading] = useState(false);
  const [waterUploading, setWaterUploading] = useState(false);

  useEffect(() => {
    if (editRoom) {
      setForm({
        name: editRoom.name,
        tenantName: editRoom.tenantName,
        rent: editRoom.rent,
        previousMeter: editRoom.previousMeter,
        currentMeter: editRoom.currentMeter,
        waterCost: editRoom.waterCost,
        note: editRoom.note,
        moveInDate: editRoom.moveInDate || new Date().toISOString().split('T')[0],
        elecMeterPhoto: editRoom.elecMeterPhoto,
        waterMeterPhoto: editRoom.waterMeterPhoto,
      });
    } else {
      setForm({
        name: '',
        tenantName: '',
        rent: settings.defaultRent,
        previousMeter: 0,
        currentMeter: 0,
        waterCost: settings.defaultWaterCost,
        note: '',
        moveInDate: new Date().toISOString().split('T')[0],
        elecMeterPhoto: undefined,
        waterMeterPhoto: undefined,
      });
    }
  }, [editRoom, open, settings]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'elec' | 'water') => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    if (type === 'elec') setElecUploading(true);
    else setWaterUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('meter-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('meter-photos').getPublicUrl(fileName);
      update(type === 'elec' ? 'elecMeterPhoto' : 'waterMeterPhoto', data.publicUrl);
    } catch (err) {
      toast.error('อัพโหลดรูปภาพไม่สำเร็จ');
    } finally {
      if (type === 'elec') setElecUploading(false);
      else setWaterUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    // Validation: current meter must be >= previous meter
    if (Number(form.currentMeter) < Number(form.previousMeter)) {
      toast.error(t('form.meterError'));
      return;
    }

    if (editRoom) {
      updateRoom({
        ...editRoom,
        ...form,
        rent: Number(form.rent),
        previousMeter: Number(form.previousMeter),
        currentMeter: Number(form.currentMeter),
        waterCost: Number(form.waterCost),
      });
    } else {
      addRoom({
        ...form,
        rent: Number(form.rent),
        previousMeter: Number(form.previousMeter),
        currentMeter: Number(form.currentMeter),
        waterCost: Number(form.waterCost),
        isPaid: false,
        billingMonth: selectedMonth,
        moveInDate: form.moveInDate,
        tenantPhone: '',
        tenantIdCardNumber: '',
        occupantCount: 1,
        tenantAddress: '',
        tenantEmergencyContact: '',
        tenantEmergencyPhone: '',
      });
    }
    onClose();
  };

  const update = (field: string, value: string | number | undefined) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editRoom ? t('form.editRoom') : t('form.addRoom')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t('form.roomName')}</Label>
            <Input value={form.name} onChange={e => update('name', e.target.value)} placeholder={t('form.roomNamePlaceholder')} required />
          </div>
          <div>
            <Label>{t('form.tenantName')}</Label>
            <Input value={form.tenantName} onChange={e => update('tenantName', e.target.value)} placeholder={t('form.tenantNamePlaceholder')} />
          </div>
          <div>
            <Label>{t('form.rent')}</Label>
            <Input type="number" value={form.rent} onChange={e => update('rent', e.target.value)} min={0} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t('form.prevMeter')}</Label>
              <Input type="number" value={form.previousMeter} onChange={e => update('previousMeter', e.target.value)} min={0} />
            </div>
            <div>
              <Label className="flex justify-between">
                <span>{t('form.currMeter')}</span>
                <label className="cursor-pointer text-primary flex items-center gap-1 text-xs">
                  {elecUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />} ถ่ายรูป
                  <input type="file" accept="image/*" className="hidden" capture="environment" onChange={e => handlePhotoUpload(e, 'elec')} />
                </label>
              </Label>
              <Input type="number" value={form.currentMeter} onChange={e => update('currentMeter', e.target.value)} min={0} />
              {form.elecMeterPhoto && (
                <div className="mt-2 relative inline-block">
                  <img src={form.elecMeterPhoto} alt="Electric Meter" className="h-16 w-16 object-cover rounded-md border" />
                  <button type="button" onClick={() => update('elecMeterPhoto', undefined)} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div>
            <Label className="flex justify-between max-w-[50%]">
              <span>{t('form.waterCost')}</span>
              <label className="cursor-pointer text-primary flex items-center gap-1 text-xs">
                {waterUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />} ถ่ายรูป
                <input type="file" accept="image/*" className="hidden" capture="environment" onChange={e => handlePhotoUpload(e, 'water')} />
              </label>
            </Label>
            <Input type="number" value={form.waterCost} onChange={e => update('waterCost', e.target.value)} min={0} className="w-1/2" />
            {form.waterMeterPhoto && (
              <div className="mt-2 relative inline-block">
                <img src={form.waterMeterPhoto} alt="Water Meter" className="h-16 w-16 object-cover rounded-md border" />
                <button type="button" onClick={() => update('waterMeterPhoto', undefined)} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          <div>
            <Label>{t('form.note')}</Label>
            <Textarea value={form.note} onChange={e => update('note', e.target.value)} placeholder={t('form.notePlaceholder')} rows={2} />
          </div>
          <div>
            <Label>{t('form.moveInDate')}</Label>
            <Input type="date" value={form.moveInDate} onChange={e => update('moveInDate', e.target.value)} />
          </div>
          <Button type="submit" className="w-full">
            {editRoom ? t('form.save') : t('form.add')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
