import { useState, useEffect } from 'react';
import { Room } from '@/types/rental';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ClipboardCheck, Plus, Camera, Trash2, Check, AlertTriangle, ArrowRight, X } from 'lucide-react';
import { toast } from 'sonner';

interface InspectionDialogProps {
    open: boolean;
    onClose: () => void;
    room: Room;
}

interface InspectionItem {
    id: string;
    name: string;
    status: 'good' | 'damaged';
    note: string;
    photo_url?: string;
}

const DEFAULT_ITEMS = [
    'ประตูหน้าห้อง / ลูกบิด',
    'เตียง / ที่นอน',
    'ตู้เสื้อผ้า',
    'โต๊ะเครื่องแป้ง / กระจก',
    'เครื่องปรับอากาศ',
    'พัดลม',
    'พื้นห้อง / ผนัง / เพดาน',
    'ห้องน้ำ / ชักโครก / อ่างล้างหน้า',
    'ระเบียง / ก๊อกน้ำ',
];

export default function InspectionDialog({ open, onClose, room }: InspectionDialogProps) {
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [inspections, setInspections] = useState<any[]>([]);

    // Create / Detail State
    const [currentInspection, setCurrentInspection] = useState<any>(null);
    const [type, setType] = useState<'move_in' | 'move_out'>('move_in');
    const [items, setItems] = useState<InspectionItem[]>([]);
    const [uploadingImage, setUploadingImage] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setView('list');
            fetchData();
        }
    }, [open, room.id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: tenantData } = await supabase
                .from('tenants')
                .select('id')
                .eq('room_id', room.id)
                .order('created_at', { ascending: false })
                .limit(1);

            const currentTenantId = tenantData?.[0]?.id || null;
            setTenantId(currentTenantId);

            const { data: inspectionData } = await supabase
                .from('inspections')
                .select('*, tenants(full_name)')
                .eq('room_id', room.id)
                .order('created_at', { ascending: false });

            setInspections(inspectionData || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = (type: 'move_in' | 'move_out') => {
        setType(type);
        setItems(DEFAULT_ITEMS.map(name => ({
            id: Math.random().toString(36).substr(2, 9),
            name,
            status: 'good',
            note: ''
        })));
        setView('create');
    };

    const handleViewDetail = (inspection: any) => {
        setCurrentInspection(inspection);
        setView('detail');
    };

    const addItem = () => {
        setItems([...items, {
            id: Math.random().toString(36).substr(2, 9),
            name: 'รายการใหม่',
            status: 'good',
            note: ''
        }]);
    };

    const updateItem = (id: string, updates: Partial<InspectionItem>) => {
        setItems(items.map(i => i.id === id ? { ...i, ...updates } : i));
    };

    const removeItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    const handleImageUpload = async (id: string, file: File) => {
        try {
            setUploadingImage(id);
            const fileExt = file.name.split('.').pop();
            const fileName = `inspect-${room.id}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('inspection-photos')
                .upload(fileName, file, { cacheControl: '3600', upsert: false });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from('inspection-photos')
                .getPublicUrl(fileName);

            updateItem(id, { photo_url: publicUrlData.publicUrl });
        } catch (error: any) {
            toast.error('อัพโหลดรูปภาพไม่สำเร็จ');
            console.error(error);
        } finally {
            setUploadingImage(null);
        }
    };

    const handleSave = async () => {
        if (!tenantId) {
            toast.error('ไม่มีข้อมูลผู้เช่าปัจจุบัน');
            return;
        }
        setSaving(true);
        try {
            const { error } = await supabase.from('inspections').insert({
                room_id: room.id,
                tenant_id: tenantId,
                type: type,
                items_json: items
            });
            if (error) throw error;
            toast.success('บันทึกการตรวจประเมินสำเร็จ');
            fetchData();
            setView('list');
        } catch (error: any) {
            toast.error('เกิดข้อผิดพลาด: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-[600px] h-[85vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b flex-none">
                    <div className="flex items-center gap-2">
                        {view !== 'list' && (
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setView('list')}>
                                &larr;
                            </Button>
                        )}
                        <DialogTitle className="flex items-center gap-2">
                            <ClipboardCheck className="w-5 h-5 text-primary" />
                            {view === 'list' && 'ประวัติการตรวจรับห้อง'}
                            {view === 'create' && (type === 'move_in' ? 'สร้างใบตรวจรับเข้า' : 'สร้างใบตรวจก่อนย้ายออก')}
                            {view === 'detail' && 'รายละเอียดการตรวจ'}
                        </DialogTitle>
                    </div>
                    <DialogDescription className={view !== 'list' ? 'ml-10' : ''}>
                        ห้อง {room.name} {room.tenantName ? `- ${room.tenantName}` : ''}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
                    ) : view === 'list' ? (
                        <div className="space-y-4">
                            <div className="flex gap-2 mb-4">
                                <Button className="flex-1" onClick={() => handleCreateNew('move_in')} disabled={!tenantId}>
                                    <Plus className="w-4 h-4 mr-1" /> ตรวจเข้าอยู่ (Move In)
                                </Button>
                                <Button variant="outline" className="flex-1" onClick={() => handleCreateNew('move_out')} disabled={!tenantId}>
                                    <Plus className="w-4 h-4 mr-1" /> ตรวจย้ายออก (Move Out)
                                </Button>
                            </div>

                            {!tenantId && (
                                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm mb-4 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    กรุณาเพิ่มข้อมูลผู้เช่า ก่อนทำรายการตรวจสภาพห้อง
                                </div>
                            )}

                            {inspections.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground border rounded-xl bg-muted/20">
                                    <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                                    <p>ยังไม่มีประวัติการตรวจสภาพห้อง</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {inspections.map((ins: any) => (
                                        <div key={ins.id} className="border rounded-xl p-3 flex items-center justify-between bg-card shrink-0 cursor-pointer hover:border-primary transition-colors" onClick={() => handleViewDetail(ins)}>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant={ins.type === 'move_in' ? 'default' : 'secondary'}>
                                                        {ins.type === 'move_in' ? 'ย้ายเข้า' : 'ย้ายออก'}
                                                    </Badge>
                                                    <span className="text-sm font-medium">{new Date(ins.created_at).toLocaleDateString('th-TH')}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">ผู้เช่า: {ins.tenants?.full_name || 'ไม่ระบุ'}</p>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : view === 'create' ? (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                {items.map((item, index) => (
                                    <div key={item.id} className="border rounded-xl p-4 bg-card shadow-sm space-y-3 relative group">
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1 space-y-3">
                                                <Input
                                                    value={item.name}
                                                    onChange={(e) => updateItem(item.id, { name: e.target.value })}
                                                    className="font-medium bg-transparent border-0 px-0 h-auto rounded-none border-b focus-visible:ring-0 focus-visible:border-primary"
                                                />
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        variant={item.status === 'good' ? 'default' : 'outline'}
                                                        size="sm"
                                                        className={item.status === 'good' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                                                        onClick={() => updateItem(item.id, { status: 'good' })}
                                                    >
                                                        <Check className="w-4 h-4 mr-1" /> ปกติ
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant={item.status === 'damaged' ? 'default' : 'outline'}
                                                        size="sm"
                                                        className={item.status === 'damaged' ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}
                                                        onClick={() => updateItem(item.id, { status: 'damaged' })}
                                                    >
                                                        <AlertTriangle className="w-4 h-4 mr-1" /> ชำรุด/มีตำหนิ
                                                    </Button>
                                                </div>
                                                <Textarea
                                                    placeholder="บันทึกเพิ่มเติม (เช่น รอยขีดข่วนจุดไหน)"
                                                    value={item.note}
                                                    onChange={(e) => updateItem(item.id, { note: e.target.value })}
                                                    className="text-sm min-h-[60px]"
                                                />
                                            </div>
                                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeItem(item.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        <div className="pt-2">
                                            {item.photo_url ? (
                                                <div className="relative inline-block">
                                                    <img src={item.photo_url} alt={item.name} className="h-24 object-cover rounded-lg border shadow-sm" />
                                                    <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 w-6 h-6 rounded-full" onClick={() => updateItem(item.id, { photo_url: undefined })}>
                                                        <X className="w-3 h-3 text-white" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Label className={`cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-dashed text-sm ${uploadingImage === item.id ? 'bg-muted' : 'text-primary border-primary/50 hover:bg-primary/5'}`}>
                                                    {uploadingImage === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                                                    {uploadingImage === item.id ? 'กำลังอัพโหลด...' : 'เพิ่มรูปภาพ'}
                                                    <input type="file" accept="image/*" className="hidden" disabled={uploadingImage === item.id} onChange={(e) => {
                                                        if (e.target.files && e.target.files[0]) {
                                                            handleImageUpload(item.id, e.target.files[0]);
                                                        }
                                                    }} />
                                                </Label>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Button variant="outline" className="w-full border-dashed" onClick={addItem}>
                                <Plus className="w-4 h-4 mr-1" /> เพิ่มรายการตรวจ
                            </Button>
                        </div>
                    ) : ( // view detail
                        <div className="space-y-4">
                            {currentInspection?.items_json?.map((item: any) => (
                                <div key={item.id} className="border rounded-xl p-4 bg-card">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="font-medium">{item.name}</p>
                                        <Badge variant={item.status === 'good' ? 'outline' : 'destructive'} className={item.status === 'good' ? 'text-green-600 border-green-600' : ''}>
                                            {item.status === 'good' ? 'ปกติ' : 'ชำรุด'}
                                        </Badge>
                                    </div>
                                    {item.note && <p className="text-sm text-muted-foreground bg-muted p-2 rounded-lg mb-2">{item.note}</p>}
                                    {item.photo_url && (
                                        <img src={item.photo_url} alt={item.name} className="h-32 object-cover rounded-lg border mt-2" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {view === 'create' && (
                    <div className="p-4 border-t bg-card mt-auto flex-none flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setView('list')} disabled={saving}>ยกเลิก</Button>
                        <Button className="flex-1" onClick={handleSave} disabled={saving || items.length === 0}>
                            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> กำลังบันทึก</> : 'บันทึกข้อมูล'}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
