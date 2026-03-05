import { useState, useEffect } from 'react';
import { Room } from '@/types/rental';
import { useRental } from '@/contexts/RentalContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Send, CheckCircle, ExternalLink, PenTool } from 'lucide-react';
import { toast } from 'sonner';

interface LeaseAgreementDialogProps {
    open: boolean;
    onClose: () => void;
    room: Room;
}

export default function LeaseAgreementDialog({ open, onClose, room }: LeaseAgreementDialogProps) {
    const { settings } = useRental();
    const [loading, setLoading] = useState(true);
    const [lease, setLease] = useState<any>(null);
    const [tenantId, setTenantId] = useState<string | null>(null);

    useEffect(() => {
        if (open) fetchLeaseData();
    }, [open, room.id]);

    const fetchLeaseData = async () => {
        setLoading(true);
        try {
            // 1. Get tenant ID constraint
            const { data: tenantData } = await supabase
                .from('tenants')
                .select('id')
                .eq('room_id', room.id)
                .order('created_at', { ascending: false })
                .limit(1);

            const currentTenantId = tenantData?.[0]?.id;
            setTenantId(currentTenantId || null);

            if (currentTenantId) {
                // 2. Get Lease
                const { data: leaseData } = await supabase
                    .from('leases')
                    .select('*')
                    .eq('room_id', room.id)
                    .eq('tenant_id', currentTenantId)
                    .single();

                setLease(leaseData || null);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateLease = async () => {
        if (!tenantId) {
            toast.error('ไม่พบข้อมูลผู้เช่า กรุณาตั้งชื่อผู้เช่าก่อน');
            return;
        }

        try {
            setLoading(true);

            const contractText = `สัญญาเช่าห้องพักเลขที่ ${room.name}
ทำขึ้นที่: ${settings.dormName}
ผู้ให้เช่า: ${settings.accountName || 'เจ้าของหอพัก'}
ผู้เช่า: ${room.tenantName}
เบอร์โทรศัพท์: ${room.tenantPhone}
อัตราค่าเช่า: ${room.rent} บาท / เดือน
วันที่เข้าอยู่: ${room.moveInDate || '-'}

ผู้เช่าตกลงปฏิบัติตามกฎระเบียบของหอพักทุกประการ และยินยอมชำระค่าเช่าตามกำหนด`;

            const { data, error } = await supabase.from('leases').insert({
                room_id: room.id,
                tenant_id: tenantId,
                contract_text: contractText,
            }).select().single();

            if (error) throw error;
            setLease(data);
            toast.success('สร้างสัญญาเช่าสำเร็จ');
        } catch (error: any) {
            toast.error('เกิดข้อผิดพลาดในการสร้างสัญญา: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenLeaseLink = () => {
        if (!lease) return;
        const url = `${window.location.origin}/lease?lease_id=${lease.id}`;
        window.open(url, '_blank');
    };

    const handleCopyLink = () => {
        if (!lease) return;
        const url = `${window.location.origin}/lease?lease_id=${lease.id}`;
        navigator.clipboard.writeText(url);
        toast.success('คัดลอกลิงก์สำเร็จ นำไปส่งให้ผู้เช่าได้เลย');
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" /> สัญญาเช่าอิเล็กทรอนิกส์
                    </DialogTitle>
                    <DialogDescription>
                        ห้อง {room.name} - ผู้เช่า: {room.tenantName || 'ไม่ระบุ'}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : !tenantId ? (
                        <div className="text-center py-6 text-muted-foreground border rounded-xl bg-muted/30">
                            <p>กรุณาเพิ่มข้อมูลผู้เช่า (ชื่อและข้อมูลติดต่อ) ให้เรียบร้อยก่อนสร้างสัญญาเช่า</p>
                        </div>
                    ) : !lease ? (
                        <div className="text-center py-6 border rounded-xl bg-muted/20">
                            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                            <p className="text-sm text-foreground mb-4">ยังไม่ได้สร้างสัญญาเช่าสำหรับผู้เช่ารายนี้</p>
                            <Button onClick={handleGenerateLease}>
                                <PenTool className="w-4 h-4 mr-2" /> สร้างร่างสัญญาเช่า
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 border rounded-lg bg-card shadow-sm">
                                <div>
                                    <p className="text-sm font-semibold">สถานะสัญญาเช่า</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">แก้ไขล่าสุด: {new Date(lease.created_at).toLocaleDateString('th-TH')}</p>
                                </div>
                                {lease.signature_url ? (
                                    <Badge className="bg-success text-success-foreground">
                                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> เซ็นแล้ว
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                                        รอผู้เช่าเซ็น
                                    </Badge>
                                )}
                            </div>

                            {lease.signature_url && (
                                <div className="border rounded-lg p-3 bg-muted/30 text-center">
                                    <p className="text-xs text-muted-foreground mb-2">ลายเซ็นอิเล็กทรอนิกส์</p>
                                    <img src={lease.signature_url} alt="Signature" className="max-h-24 mx-auto border bg-white rounded" />
                                    <p className="text-xs text-muted-foreground mt-2">ประทับเวลา: {new Date(lease.signed_at).toLocaleString('th-TH')}</p>
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                <Button variant="outline" className="w-full flex justify-between" onClick={handleOpenLeaseLink}>
                                    <span>ดูเอกสารสัญญาฉบับเต็ม</span>
                                    <ExternalLink className="w-4 h-4" />
                                </Button>

                                {!lease.signature_url && (
                                    <Button className="w-full flex justify-between bg-primary text-primary-foreground" onClick={handleCopyLink}>
                                        <span>คัดลอกลิงก์ส่งให้ผู้เช่าเซ็นผ่าน LINE</span>
                                        <Send className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
