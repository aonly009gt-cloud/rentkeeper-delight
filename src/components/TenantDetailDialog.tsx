import { useState, useEffect, useCallback } from 'react';
import { Room } from '@/types/rental';
import { useRental } from '@/contexts/RentalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { User, Phone, CreditCard, Users, MapPin, ShieldAlert, Upload, Trash2, Image, Plus, ChevronDown, ChevronUp, Star, MessageCircle, Copy, Check as CheckIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Tenant {
  id: string;
  fullName: string;
  phone: string;
  idCardNumber: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  isPrimary: boolean;
  lineUserId: string;
}

interface TenantImages {
  [tenantId: string]: string[];
}

interface TenantDetailDialogProps {
  open: boolean;
  onClose: () => void;
  room: Room;
}

export default function TenantDetailDialog({ open, onClose, room }: TenantDetailDialogProps) {
  const { updateRoom } = useRental();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantImages, setTenantImages] = useState<TenantImages>({});
  const [expandedTenant, setExpandedTenant] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [liffId, setLiffId] = useState('');

  // Fetch LIFF ID from settings
  useEffect(() => {
    if (!user || !open) return;
    supabase.from('user_settings').select('liff_id').eq('user_id', user.id).single().then(({ data }) => {
      const dbLiffId = (data as any)?.liff_id;
      setLiffId(dbLiffId || import.meta.env.VITE_LINE_LIFF_ID || '');
    });
  }, [user, open]);

  const fetchTenants = useCallback(async () => {
    if (!user || !open) return;
    setLoading(true);
    const { data } = await supabase
      .from('tenants')
      .select('*')
      .eq('room_id', room.id)
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });
    if (data) {
      const mapped: Tenant[] = (data as any[]).map(d => ({
        id: d.id,
        fullName: d.full_name || '',
        phone: d.phone || '',
        idCardNumber: d.id_card_number || '',
        address: d.address || '',
        emergencyContact: d.emergency_contact || '',
        emergencyPhone: d.emergency_phone || '',
        isPrimary: d.is_primary || false,
        lineUserId: d.line_user_id || '',
      }));
      setTenants(mapped);
      if (mapped.length > 0 && !expandedTenant) {
        setExpandedTenant(mapped[0].id);
      }
      // Load images for all tenants
      const imgs: TenantImages = {};
      for (const ten of mapped) {
        imgs[ten.id] = await loadTenantImages(ten.id);
      }
      setTenantImages(imgs);
    }
    setLoading(false);
  }, [user, room.id, open]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const loadTenantImages = async (tenantId: string): Promise<string[]> => {
    if (!user) return [];
    const folderPath = `${user.id}/${room.id}/${tenantId}`;
    const { data } = await supabase.storage.from('tenant-documents').list(folderPath);
    if (data && data.length > 0) {
      return data
        .filter(f => f.name !== '.emptyFolderPlaceholder')
        .map(file => {
          const { data: urlData } = supabase.storage.from('tenant-documents').getPublicUrl(`${folderPath}/${file.name}`);
          return urlData.publicUrl;
        });
    }
    return [];
  };

  const addTenant = async () => {
    if (!user) return;
    const isPrimary = tenants.length === 0;
    const { data } = await supabase.from('tenants').insert({
      room_id: room.id,
      user_id: user.id,
      full_name: '',
      is_primary: isPrimary,
    } as any).select().single();
    if (data) {
      const d = data as any;
      const newTenant: Tenant = {
        id: d.id,
        fullName: '',
        phone: '',
        idCardNumber: '',
        address: '',
        emergencyContact: '',
        emergencyPhone: '',
        isPrimary: d.is_primary || false,
        lineUserId: '',
      };
      setTenants(prev => [...prev, newTenant]);
      setExpandedTenant(d.id);
      // Update room occupant count
      updateRoom({ ...room, occupantCount: tenants.length + 1 });
    }
  };

  const saveTenant = async (tenant: Tenant) => {
    await supabase.from('tenants').update({
      full_name: tenant.fullName,
      phone: tenant.phone,
      id_card_number: tenant.idCardNumber,
      address: tenant.address,
      emergency_contact: tenant.emergencyContact,
      emergency_phone: tenant.emergencyPhone,
      is_primary: tenant.isPrimary,
    } as any).eq('id', tenant.id);
    toast.success(t('tenant.saveSuccess'));
  };

  const deleteTenant = async (tenantId: string) => {
    if (!confirm(t('tenant.deleteConfirm'))) return;
    // Delete images
    if (user) {
      const folderPath = `${user.id}/${room.id}/${tenantId}`;
      const { data: files } = await supabase.storage.from('tenant-documents').list(folderPath);
      if (files && files.length > 0) {
        await supabase.storage.from('tenant-documents').remove(files.map(f => `${folderPath}/${f.name}`));
      }
    }
    await supabase.from('tenants').delete().eq('id', tenantId);
    setTenants(prev => {
      const updated = prev.filter(t => t.id !== tenantId);
      updateRoom({ ...room, occupantCount: updated.length });
      return updated;
    });
    setTenantImages(prev => {
      const copy = { ...prev };
      delete copy[tenantId];
      return copy;
    });
    toast.success(t('tenant.deleteSuccess'));
  };

  const handleUpload = async (tenantId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('tenant.fileTooLarge'));
      return;
    }
    setUploading(tenantId);
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}.${ext}`;
    const filePath = `${user.id}/${room.id}/${tenantId}/${fileName}`;
    const { error } = await supabase.storage.from('tenant-documents').upload(filePath, file);
    if (error) {
      toast.error(t('tenant.uploadError'));
    } else {
      toast.success(t('tenant.uploadSuccess'));
      const imgs = await loadTenantImages(tenantId);
      setTenantImages(prev => ({ ...prev, [tenantId]: imgs }));
    }
    setUploading(null);
    e.target.value = '';
  };

  const handleDeleteImage = async (tenantId: string, url: string) => {
    if (!user) return;
    const parts = url.split('/tenant-documents/');
    if (parts.length < 2) return;
    const path = decodeURIComponent(parts[1]);
    await supabase.storage.from('tenant-documents').remove([path]);
    const imgs = await loadTenantImages(tenantId);
    setTenantImages(prev => ({ ...prev, [tenantId]: imgs }));
    toast.success(t('tenant.deleteSuccess'));
  };

  const updateTenantField = (tenantId: string, field: keyof Tenant, value: string | boolean) => {
    setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, [field]: value } : t));
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {t('tenant.title')} - {room.name}
            <Badge variant="secondary" className="ml-auto">{tenants.length} {t('tenant.people')}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">{t('tenant.loading')}</div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>{t('tenant.noTenants')}</p>
            </div>
          ) : (
            tenants.map((tenant, idx) => {
              const isExpanded = expandedTenant === tenant.id;
              const images = tenantImages[tenant.id] || [];
              return (
                <div key={tenant.id} className="border rounded-xl overflow-hidden">
                  {/* Header */}
                  <button
                    className="w-full flex items-center gap-2 p-3 hover:bg-muted/50 transition-colors text-left"
                    onClick={() => setExpandedTenant(isExpanded ? null : tenant.id)}
                  >
                    {tenant.isPrimary && <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />}
                    <span className="font-medium flex-1">
                      {tenant.fullName || `${t('tenant.personLabel')} ${idx + 1}`}
                    </span>
                    {images.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <Image className="w-3 h-3 mr-1" />{images.length}
                      </Badge>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="p-3 pt-0 space-y-3">
                      <Separator />

                      {/* Basic Info */}
                      <div className="space-y-2">
                        <div>
                          <Label className="flex items-center gap-1 text-xs"><User className="w-3 h-3" /> {t('tenant.name')}</Label>
                          <Input value={tenant.fullName} onChange={e => updateTenantField(tenant.id, 'fullName', e.target.value)} placeholder={t('tenant.namePlaceholder')} className="h-9 text-sm" />
                        </div>
                        <div>
                          <Label className="flex items-center gap-1 text-xs"><Phone className="w-3 h-3" /> {t('tenant.phone')}</Label>
                          <Input value={tenant.phone} onChange={e => updateTenantField(tenant.id, 'phone', e.target.value)} placeholder="08x-xxx-xxxx" className="h-9 text-sm" />
                        </div>
                      </div>

                      {/* ID Card */}
                      <div className="space-y-2">
                        <div>
                          <Label className="flex items-center gap-1 text-xs"><CreditCard className="w-3 h-3" /> {t('tenant.idCardNumber')}</Label>
                          <Input value={tenant.idCardNumber} onChange={e => updateTenantField(tenant.id, 'idCardNumber', e.target.value)} placeholder="x-xxxx-xxxxx-xx-x" maxLength={17} className="h-9 text-sm" />
                        </div>

                        {/* Images */}
                        <div>
                          <Label className="flex items-center gap-1 text-xs"><Image className="w-3 h-3" /> {t('tenant.idCardImage')}</Label>
                          <div className="mt-1.5 space-y-1.5">
                            {images.map((url, i) => (
                              <div key={i} className="relative group rounded-lg overflow-hidden border">
                                <img src={url} alt={`ID ${i + 1}`} className="w-full h-32 object-cover" />
                                <Button
                                  variant="destructive" size="icon"
                                  className="absolute top-1.5 right-1.5 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleDeleteImage(tenant.id, url)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                            <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                              <Upload className="w-4 h-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {uploading === tenant.id ? t('tenant.uploading') : t('tenant.uploadIdCard')}
                              </span>
                              <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(tenant.id, e)} disabled={uploading === tenant.id} />
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Address */}
                      <div>
                        <Label className="flex items-center gap-1 text-xs"><MapPin className="w-3 h-3" /> {t('tenant.address')}</Label>
                        <Textarea value={tenant.address} onChange={e => updateTenantField(tenant.id, 'address', e.target.value)} placeholder={t('tenant.addressPlaceholder')} rows={2} className="text-sm" />
                      </div>

                      {/* Emergency */}
                      <div className="space-y-2">
                        <div>
                          <Label className="flex items-center gap-1 text-xs"><ShieldAlert className="w-3 h-3" /> {t('tenant.emergencyContact')}</Label>
                          <Input value={tenant.emergencyContact} onChange={e => updateTenantField(tenant.id, 'emergencyContact', e.target.value)} placeholder={t('tenant.emergencyContactPlaceholder')} className="h-9 text-sm" />
                        </div>
                        <div>
                          <Label className="flex items-center gap-1 text-xs">{t('tenant.emergencyPhone')}</Label>
                          <Input value={tenant.emergencyPhone} onChange={e => updateTenantField(tenant.id, 'emergencyPhone', e.target.value)} placeholder="08x-xxx-xxxx" className="h-9 text-sm" />
                        </div>
                      </div>

                      {/* LINE Connection */}
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1 text-xs">
                          <MessageCircle className="w-3 h-3 text-green-500" /> LINE
                        </Label>
                        {tenant.lineUserId ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs text-green-600 border-green-300 bg-green-50">
                              <CheckIcon className="w-3 h-3 mr-1" /> เชื่อมต่อ LINE แล้ว
                            </Badge>
                          </div>
                        ) : liffId ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-green-600 border-green-300 hover:bg-green-50"
                            onClick={() => {
                              const url = `${window.location.origin}/line-register?tenantId=${tenant.id}&liffId=${liffId}`;
                              navigator.clipboard.writeText(url);
                              setCopiedId(tenant.id);
                              setTimeout(() => setCopiedId(null), 2000);
                              toast.success('คัดลอกลิงก์ลงทะเบียน LINE แล้ว');
                            }}
                          >
                            {copiedId === tenant.id ? (
                              <><CheckIcon className="w-3.5 h-3.5 mr-1" /> คัดลอกแล้ว!</>
                            ) : (
                              <><Copy className="w-3.5 h-3.5 mr-1" /> คัดลอกลิงก์เชื่อมต่อ LINE</>
                            )}
                          </Button>
                        ) : (
                          <p className="text-xs text-muted-foreground">ตั้งค่า LIFF ID ในหน้าตั้งค่าก่อน</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" onClick={() => saveTenant(tenant)}>
                          {t('tenant.save')}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteTenant(tenant.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Add Tenant Button */}
          <Button variant="outline" className="w-full" onClick={addTenant}>
            <Plus className="w-4 h-4 mr-1.5" /> {t('tenant.addPerson')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
