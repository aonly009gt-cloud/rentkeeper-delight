import { useState, useEffect } from 'react';
import { Room, formatCurrency, formatMonth } from '@/types/rental';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Loader2, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PaymentHistoryDialogProps {
    open: boolean;
    onClose: () => void;
    room: Room;
}

interface BillRecord {
    id: string;
    billing_month: string;
    total: number;
    is_paid: boolean;
    paid_at: string | null;
    payment_slip_url: string | null;
    previous_balance: number;
}

export default function PaymentHistoryDialog({ open, onClose, room }: PaymentHistoryDialogProps) {
    const { t } = useLanguage();
    const [bills, setBills] = useState<BillRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!open) return;
        const fetchHistory = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('bills')
                .select('id, billing_month, total, is_paid, paid_at, payment_slip_url, previous_balance')
                .eq('room_id', room.id)
                .order('billing_month', { ascending: false });

            if (data) {
                setBills(data);
            } else {
                console.error(error);
            }
            setLoading(false);
        };

        fetchHistory();
    }, [open, room.id]);

    return (
        <Dialog open={open} onOpenChange={(isOpen: boolean) => !isOpen && onClose()}>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>ประวัติการชำระเงิน</DialogTitle>
                    <DialogDescription>ห้อง {room.name} {room.tenantName ? `- ${room.tenantName}` : ''}</DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-3 mt-4">
                        {bills.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">ไม่มีประวัติการทำรายการ</p>
                        ) : (
                            bills.map((bill) => (
                                <div key={bill.id} className="bg-card border rounded-lg p-3 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-medium">{formatMonth(bill.billing_month)}</span>
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            ยอดรวม: {formatCurrency(bill.total + (bill.previous_balance || 0))} ฿
                                            {(bill.previous_balance || 0) > 0 && <span className="text-destructive text-xs ml-1">(รวมยอดยกมา {formatCurrency(bill.previous_balance)} ฿)</span>}
                                        </div>
                                        {bill.paid_at && (
                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                ชำระเมื่อ: {new Date(bill.paid_at).toLocaleDateString('th-TH')}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <Badge variant={bill.is_paid ? 'default' : 'destructive'} className={bill.is_paid ? 'bg-success hover:bg-success/90' : ''}>
                                            {bill.is_paid ? <><CheckCircle className="w-3 h-3 mr-1" /> ชำระแล้ว</> : <><AlertCircle className="w-3 h-3 mr-1" /> ค้างชำระ</>}
                                        </Badge>
                                        {bill.payment_slip_url && (
                                            <a href={bill.payment_slip_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                                                ดูสลิป
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
