import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRental } from '@/contexts/RentalContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Megaphone, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BroadcastDialogProps {
    open: boolean;
    onClose: () => void;
}

export default function BroadcastDialog({ open, onClose }: BroadcastDialogProps) {
    const { user } = useAuth();
    const { rooms } = useRental();
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Consider rooms with a tenant who has a LINE ID connected
    const tenantsWithLine = rooms.filter(r => r.tenantIdCardNumber || r.tenantPhone);
    // We don't have direct access to line_user_id in Room type, but we can just invoke the function 
    // and let the Edge Function find all tenants with LINE ID for this user.

    const handleSendBroadcast = async () => {
        if (!message.trim()) {
            toast.error('กรุณาระบุข้อความที่ต้องการประกาศ');
            return;
        }
        if (!user) return;

        setLoading(true);
        try {
            // 1. Save announcement to database
            const { error: dbError } = await supabase.from('announcements').insert({
                user_id: user.id,
                message: message.trim()
            });

            if (dbError) throw dbError;

            // 2. Trigger Edge Function to send LINE Broadcast
            // We will create this Edge Function 'send-broadcast' soon
            const { data, error: functionError } = await supabase.functions.invoke('send-broadcast', {
                body: { message: message.trim(), ownerId: user.id }
            });

            if (functionError) throw functionError;
            if (data?.error) throw new Error(data.error);

            toast.success('ส่งประกาศแจ้งเตือนลูกบ้านสำเร็จแล้ว');
            setMessage('');
            onClose();
        } catch (error: any) {
            console.error(error);
            toast.error('เกิดข้อผิดพลาดในการส่งประกาศ: ' + (error.message || ''));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-primary" /> ประกาศข่าวสาร (Broadcast)
                    </DialogTitle>
                    <DialogDescription>
                        ส่งข้อความแจ้งเตือนไปยังลูกบ้านทั้งหมดที่เชื่อมต่อ LINE แล้ว
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Textarea
                            placeholder="พิมพ์ข้อความประกาศที่นี่ เช่น แจ้งทำความสะอาด, ซ่อมบำรุง, กฎระเบียบใหม่..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[120px] resize-none"
                        />
                    </div>
                    <div className="bg-muted p-3 rounded-lg text-xs text-muted-foreground">
                        <p>💡 ข่าวสารจะถูกส่งไปยัง LINE ของลูกบ้านทันที (ส่งฟรีไม่มีค่าใช้จ่ายด้วย LINE Messaging API)</p>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose} disabled={loading}>ยกเลิก</Button>
                    <Button onClick={handleSendBroadcast} disabled={loading || !message.trim()} className="bg-primary hover:bg-primary/90">
                        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> กำลังส่ง...</> : <><Send className="w-4 h-4 mr-2" /> ส่งประกาศ</>}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
