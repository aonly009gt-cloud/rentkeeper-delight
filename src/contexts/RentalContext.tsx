import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Room, Settings, defaultSettings, getCurrentMonth } from '@/types/rental';
import { useAuth } from '@/contexts/AuthContext';
import { roomService, settingsService, AppError } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

interface RentalContextType {
  rooms: Room[];
  settings: Settings;
  selectedMonth: string;
  loading: boolean;
  error: string | null;
  setSelectedMonth: (month: string) => void;
  addRoom: (room: Omit<Room, 'id'>) => Promise<void>;
  updateRoom: (room: Room) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
  togglePaid: (id: string) => Promise<void>;
  updateSettings: (settings: Settings) => Promise<void>;
  getMonthlyRooms: (month: string) => Room[];
  refreshData: () => Promise<void>;
}

const RentalContext = createContext<RentalContextType | undefined>(undefined);

export function RentalProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const showError = useCallback((message: string) => {
    setError(message);
    toast({
      title: 'เกิดข้อผิดพลาด',
      description: message,
      variant: 'destructive',
    });
  }, [toast]);

  const showSuccess = useCallback((message: string) => {
    toast({
      title: 'สำเร็จ',
      description: message,
      variant: 'default',
    });
  }, [toast]);

  const fetchRooms = useCallback(async () => {
    if (!user) {
      setRooms([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await roomService.getAll(user.id);
      setRooms(data);
    } catch (err) {
      if (err instanceof AppError) {
        showError(err.message);
      } else {
        showError('ไม่สามารถโหลดข้อมูลห้องได้');
      }
    } finally {
      setLoading(false);
    }
  }, [user, showError]);

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(defaultSettings);
      return;
    }
    try {
      const data = await settingsService.get(user.id);
      setSettings(data);
    } catch (err) {
      if (err instanceof AppError) {
        showError(err.message);
      } else {
        showError('ไม่สามารถโหลดการตั้งค่าได้');
      }
    }
  }, [user, showError]);

  const refreshData = useCallback(async () => {
    await Promise.all([fetchRooms(), fetchSettings()]);
  }, [fetchRooms, fetchSettings]);

  useEffect(() => {
    fetchRooms();
    fetchSettings();
  }, [fetchRooms, fetchSettings]);

  const addRoom = async (room: Omit<Room, 'id'>) => {
    try {
      if (!user) return;
      const newRoom = await roomService.create(user.id, room, settings.electricityRate);
      if (newRoom) {
        setRooms(prev => [...prev, newRoom]);
        showSuccess('เพิ่มห้องสำเร็จ');
      }
    } catch (err) {
      if (err instanceof AppError) {
        showError(err.message);
      } else {
        showError('ไม่สามารถเพิ่มห้องได้');
      }
      throw err;
    }
  };

  const updateRoom = async (room: Room) => {
    try {
      if (!user) return;
      await roomService.update(room, user.id, settings.electricityRate);
      setRooms(prev => prev.map(r => r.id === room.id ? room : r));
      showSuccess('อัปเดตห้องสำเร็จ');
    } catch (err) {
      if (err instanceof AppError) {
        showError(err.message);
      } else {
        showError('ไม่สามารถอัปเดตห้องได้');
      }
      throw err;
    }
  };

  const deleteRoom = async (id: string) => {
    try {
      await roomService.delete(id);
      setRooms(prev => prev.filter(r => r.id !== id));
      showSuccess('ลบห้องสำเร็จ');
    } catch (err) {
      if (err instanceof AppError) {
        showError(err.message);
      } else {
        showError('ไม่สามารถลบห้องได้');
      }
      throw err;
    }
  };

  const togglePaid = async (id: string) => {
    const room = rooms.find(r => r.id === id);
    if (!room) return;
    const newPaid = !room.isPaid;
    try {
      await roomService.togglePaid(id, newPaid);
      setRooms(prev => prev.map(r => r.id === id ? { ...r, isPaid: newPaid } : r));
    } catch (err) {
      if (err instanceof AppError) {
        showError(err.message);
      } else {
        showError('ไม่สามารถอัปเดตสถานะได้');
      }
      throw err;
    }
  };

  const updateSettings = async (s: Settings) => {
    try {
      if (!user) return;
      await settingsService.update(user.id, s);
      setSettings(s);
      showSuccess('บันทึกการตั้งค่าสำเร็จ');
    } catch (err) {
      if (err instanceof AppError) {
        showError(err.message);
      } else {
        showError('ไม่สามารถบันทึกการตั้งค่าได้');
      }
      throw err;
    }
  };

  const getMonthlyRooms = (month: string) => {
    return rooms.filter(r => r.billingMonth === month);
  };

  return (
    <RentalContext.Provider value={{
      rooms, settings, selectedMonth, loading, error, setSelectedMonth,
      addRoom, updateRoom, deleteRoom, togglePaid, updateSettings, getMonthlyRooms, refreshData
    }}>
      {children}
    </RentalContext.Provider>
  );
}

export function useRental() {
  const ctx = useContext(RentalContext);
  if (!ctx) throw new Error('useRental must be used within RentalProvider');
  return ctx;
}
