import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wrench, CheckCircle, Clock, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface MaintenanceRequest {
    id: string;
    room_id: string;
    tenant_id: string | null;
    description: string;
    photo_url: string | null;
    status: string;
    created_at: string;
    rooms: { name: string };
    tenants: { full_name: string } | null;
}

export default function MaintenancePage() {
    const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('maintenance_requests')
            .select(`
        *,
        rooms(name),
        tenants(full_name)
      `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            toast.error('ไม่สามารถโหลดข้อมูลแจ้งซ่อมได้');
        } else {
            setRequests((data as any) || []);
        }
        setLoading(false);
    };

    const toggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'pending' ? 'done' : 'pending';
        const { error } = await supabase
            .from('maintenance_requests')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            toast.error('อัพเดทสถานะไม่สำเร็จ');
            return;
        }

        setRequests(prev => prev.map(req =>
            req.id === id ? { ...req, status: newStatus } : req
        ));
        toast.success(newStatus === 'done' ? 'ทำเครื่องหมายว่าซ่อมเสร็จแล้ว' : 'เปลี่ยนสถานะเป็นรอดำเนินการ');
    };

    return (
        <Layout>
            <div className="space-y-4 fade-in">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Wrench className="w-5 h-5 text-primary" /> แจ้งซ่อม
                    </h2>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-muted-foreground">กำลังโหลด...</div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground bg-card rounded-xl border">
                        <Wrench className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>ยังไม่มีรายการแจ้งซ่อม</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {requests.map(req => (
                            <div key={req.id} className="bg-card rounded-xl border p-4 shadow-sm flex flex-col sm:flex-row gap-4">
                                {req.photo_url ? (
                                    <div
                                        className="w-full sm:w-24 h-24 rounded-lg bg-muted bg-cover bg-center cursor-pointer flex-shrink-0"
                                        style={{ backgroundImage: `url(${req.photo_url})` }}
                                        onClick={() => setSelectedPhoto(req.photo_url)}
                                    />
                                ) : (
                                    <div className="w-full sm:w-24 h-24 rounded-lg bg-muted flex flex-col items-center justify-center text-muted-foreground flex-shrink-0">
                                        <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                                        <span className="text-xs">ไม่มีรูป</span>
                                    </div>
                                )}

                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-lg">{req.rooms?.name || 'ไม่ทราบห้อง'}</h3>
                                            <p className="text-sm text-muted-foreground">{req.tenants?.full_name || 'ไม่ทราบชื่อผู้เช่า'}</p>
                                        </div>
                                        <Badge variant={req.status === 'done' ? 'default' : 'destructive'} className={req.status === 'done' ? 'bg-success hover:bg-success/90' : ''}>
                                            {req.status === 'done' ? <><CheckCircle className="w-3 h-3 mr-1" />เสร็จสิ้น</> : <><Clock className="w-3 h-3 mr-1" />รอดำเนินการ</>}
                                        </Badge>
                                    </div>

                                    <p className="text-sm bg-muted/50 p-2 rounded-md">{req.description}</p>

                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(req.created_at).toLocaleString('th-TH')}
                                        </span>
                                        <Button
                                            variant={req.status === 'done' ? 'outline' : 'default'}
                                            size="sm"
                                            onClick={() => toggleStatus(req.id, req.status)}
                                        >
                                            {req.status === 'done' ? 'ยกเลิกสถานะเสร็จสิ้น' : 'ทำเครื่องหมายว่าเสร็จสิ้น'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>รูปภาพประกอบการแจ้งซ่อม</DialogTitle>
                    </DialogHeader>
                    {selectedPhoto && (
                        <img src={selectedPhoto} alt="Maintenance Issue" className="w-full h-auto rounded-lg object-contain max-h-[70vh]" />
                    )}
                </DialogContent>
            </Dialog>
        </Layout>
    );
}
