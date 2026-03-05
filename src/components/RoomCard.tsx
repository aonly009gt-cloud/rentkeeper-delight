import { useState, useEffect } from 'react';
import { Room, calculateElectricity, calculateTotal, formatCurrency } from '@/types/rental';
import { useRental } from '@/contexts/RentalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Check, X, Pencil, Trash2, Zap, Droplets, Home, UserCircle, Users, FileCheck, Image, History, FileSignature, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import TenantDetailDialog from './TenantDetailDialog';
import PaymentHistoryDialog from './PaymentHistoryDialog';
import LeaseAgreementDialog from './LeaseAgreementDialog';
import InspectionDialog from './InspectionDialog';

interface RoomCardProps {
  room: Room;
  onEdit: (room: Room) => void;
}

export default function RoomCard({ room, onEdit }: RoomCardProps) {
  const { settings, togglePaid, deleteRoom } = useRental();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [tenantDialogOpen, setTenantDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [leaseDialogOpen, setLeaseDialogOpen] = useState(false);
  const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false);
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [slipDialogOpen, setSlipDialogOpen] = useState(false);
  const elecUnits = Math.max(0, room.currentMeter - room.previousMeter);
  const elecCost = calculateElectricity(room.currentMeter, room.previousMeter, settings.electricityRate);
  const total = calculateTotal(room, settings.electricityRate);

  // Check for pending payment slip
  useEffect(() => {
    if (!user) return;
    const fetchSlip = async () => {
      const { data } = await supabase
        .from('bills')
        .select('payment_slip_url, is_paid')
        .eq('room_id', room.id)
        .eq('billing_month', room.billingMonth)
        .single();
      if (data && data.payment_slip_url && !data.is_paid) {
        setSlipUrl(data.payment_slip_url);
      } else {
        setSlipUrl(null);
      }
    };
    fetchSlip();
  }, [room.id, room.billingMonth, room.isPaid, user]);

  return (
    <>
      <div className="bg-card rounded-xl border p-4 slide-up shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-card-foreground flex items-center gap-1.5">
              <Home className="w-4 h-4 text-primary" />
              {room.name}
            </h3>
            {room.tenantName && (
              <p className="text-sm text-muted-foreground mt-0.5">👤 {room.tenantName}</p>
            )}
            {room.occupantCount > 1 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Users className="w-3 h-3" /> {room.occupantCount} {t('tenant.people')}
              </p>
            )}
          </div>
          <Badge
            className={`cursor-pointer select-none ${room.isPaid
              ? 'bg-success text-success-foreground hover:bg-success/90'
              : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              }`}
            onClick={() => togglePaid(room.id)}
          >
            {room.isPaid ? <><Check className="w-3 h-3 mr-1" /> {t('room.paid')}</> : <><X className="w-3 h-3 mr-1" /> {t('room.unpaid')}</>}
          </Badge>
        </div>

        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('room.rent')}</span>
            <span className="font-medium">{formatCurrency(room.rent)} ฿</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-accent" /> {t('room.electricity')} ({elecUnits} {t('room.unit')} × {settings.electricityRate})
            </span>
            <span className="font-medium">{formatCurrency(elecCost)} ฿</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-primary" /> {t('room.water')}
            </span>
            <span className="font-medium">{formatCurrency(room.waterCost)} ฿</span>
          </div>
          <div className="border-t pt-1.5 mt-1.5 flex justify-between font-semibold text-base">
            <span>{t('room.total')}</span>
            <span className="text-primary">{formatCurrency(total)} ฿</span>
          </div>
        </div>

        {room.note && (
          <p className="text-xs text-muted-foreground mt-2 bg-muted rounded-lg px-2.5 py-1.5">📝 {room.note}</p>
        )}

        {slipUrl && (
          <div className="mt-2 p-2 bg-accent/10 border border-accent/30 rounded-lg">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-accent border-accent/50">
                <FileCheck className="w-3 h-3 mr-1" /> {t('payment.pending')}
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => setSlipDialogOpen(true)}>
                <Image className="w-3.5 h-3.5 mr-1" /> {t('payment.viewSlip')}
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          <Button variant="outline" size="sm" className="flex-none" onClick={() => onEdit(room)}>
            <Pencil className="w-3.5 h-3.5 mr-1" /> {t('room.edit')}
          </Button>
          <Button variant="outline" size="sm" className="flex-none" onClick={() => setTenantDialogOpen(true)}>
            <UserCircle className="w-3.5 h-3.5 mr-1" /> {t('tenant.info')}
          </Button>
          <Button variant="outline" size="sm" className="flex-none" onClick={() => setHistoryDialogOpen(true)}>
            <History className="w-3.5 h-3.5 mr-1" /> ประวัติ
          </Button>
          <Button variant="outline" size="sm" className="flex-none text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => setLeaseDialogOpen(true)}>
            <FileSignature className="w-3.5 h-3.5 mr-1" /> สัญญาเช่า
          </Button>
          <Button variant="outline" size="sm" className="flex-none text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" onClick={() => setInspectionDialogOpen(true)}>
            <ClipboardCheck className="w-3.5 h-3.5 mr-1" /> ตรวจห้อง
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground flex-none px-2"
            onClick={() => {
              if (confirm(t('room.deleteConfirm'))) deleteRoom(room.id);
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <TenantDetailDialog
        open={tenantDialogOpen}
        onClose={() => setTenantDialogOpen(false)}
        room={room}
      />

      <PaymentHistoryDialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        room={room}
      />

      <LeaseAgreementDialog
        open={leaseDialogOpen}
        onClose={() => setLeaseDialogOpen(false)}
        room={room}
      />

      <InspectionDialog
        open={inspectionDialogOpen}
        onClose={() => setInspectionDialogOpen(false)}
        room={room}
      />

      {/* Slip Viewer Dialog */}
      <Dialog open={slipDialogOpen} onOpenChange={setSlipDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('payment.viewSlip')}</DialogTitle>
            <DialogDescription>{room.name} - {room.tenantName}</DialogDescription>
          </DialogHeader>
          {slipUrl && (
            <img src={slipUrl} alt="Payment slip" className="w-full rounded-lg max-h-96 object-contain" />
          )}
          <Button onClick={() => {
            togglePaid(room.id);
            // Also update bill
            supabase.from('bills')
              .update({ is_paid: true, paid_at: new Date().toISOString() })
              .eq('room_id', room.id)
              .eq('billing_month', room.billingMonth)
              .then(() => {
                setSlipUrl(null);
                setSlipDialogOpen(false);
              });
          }} className="w-full">
            {t('payment.confirmPaid')}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}