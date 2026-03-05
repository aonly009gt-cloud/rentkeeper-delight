import { useState } from 'react';
import { useRental } from '@/contexts/RentalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Room, formatMonth } from '@/types/rental';
import RoomCard from '@/components/RoomCard';
import RoomForm from '@/components/RoomForm';
import Layout from '@/components/Layout';
import { PageSkeleton } from '@/components/Skeleton';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

export default function Index() {
  const { rooms, selectedMonth, setSelectedMonth, settings, loading, error, refreshData } = useRental();
  const { t } = useLanguage();
  const [formOpen, setFormOpen] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);

  const monthlyRooms = rooms.filter(r => r.billingMonth === selectedMonth);
  const unpaidRooms = monthlyRooms.filter(r => !r.isPaid);

  const today = new Date();
  const isNearBillingDay = Math.abs(today.getDate() - settings.billingDay) <= 3;

  const changeMonth = (delta: number) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  if (loading) {
    return (
      <Layout>
        <PageSkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 fade-in">
        {/* Month Selector */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-bold">📅 {formatMonth(selectedMonth)}</h2>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => refreshData()}>
              <RefreshCw className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => changeMonth(1)}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Alerts */}
        {isNearBillingDay && unpaidRooms.length > 0 && (
          <div className="bg-accent/15 border border-accent/30 rounded-xl p-3 flex items-start gap-2 slide-up">
            <AlertTriangle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">{t('alert.billing')}</p>
              <p className="text-xs text-muted-foreground">
                {unpaidRooms.length} {t('alert.unpaid')}: {unpaidRooms.map(r => r.name).join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Room Grid */}
        {monthlyRooms.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {monthlyRooms.map(room => (
              <RoomCard
                key={room.id}
                room={room}
                onEdit={(r) => { setEditRoom(r); setFormOpen(true); }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-5xl mb-3">🏠</p>
            <p className="font-medium">{t('rooms.empty')}</p>
            <p className="text-sm mt-1">{t('rooms.addHint')}</p>
          </div>
        )}

        {/* FAB */}
        <Button
          onClick={() => { setEditRoom(null); setFormOpen(true); }}
          className="fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-lg z-50"
          size="icon"
        >
          <Plus className="w-6 h-6" />
        </Button>

        <RoomForm open={formOpen} onClose={() => { setFormOpen(false); setEditRoom(null); }} editRoom={editRoom} />
      </div>
    </Layout>
  );
}
