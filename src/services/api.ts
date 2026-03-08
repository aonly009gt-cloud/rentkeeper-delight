import type { Room, Settings } from '@/types/rental';
import { defaultSettings } from '@/types/rental';

const STORAGE_KEYS = {
  rooms: 'rentkeeper_rooms',
  settings: 'rentkeeper_settings',
};

export class AppError {
  constructor(
    public message: string,
    public code?: string
  ) {}
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const roomService = {
  async getAll(): Promise<Room[]> {
    await delay(100);
    const data = localStorage.getItem(STORAGE_KEYS.rooms);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  async create(room: Omit<Room, 'id'>): Promise<Room> {
    await delay(100);
    const rooms = await this.getAll();
    const newRoom: Room = {
      ...room,
      id: crypto.randomUUID(),
    };
    rooms.push(newRoom);
    localStorage.setItem(STORAGE_KEYS.rooms, JSON.stringify(rooms));
    return newRoom;
  },

  async update(room: Room): Promise<void> {
    await delay(100);
    const rooms = await this.getAll();
    const index = rooms.findIndex(r => r.id === room.id);
    if (index >= 0) {
      rooms[index] = room;
      localStorage.setItem(STORAGE_KEYS.rooms, JSON.stringify(rooms));
    }
  },

  async delete(id: string): Promise<void> {
    await delay(100);
    const rooms = await this.getAll();
    const filtered = rooms.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.rooms, JSON.stringify(filtered));
  },

  async togglePaid(id: string, isPaid: boolean): Promise<void> {
    await delay(100);
    const rooms = await this.getAll();
    const index = rooms.findIndex(r => r.id === id);
    if (index >= 0) {
      rooms[index].isPaid = isPaid;
      localStorage.setItem(STORAGE_KEYS.rooms, JSON.stringify(rooms));
    }
  },
};

export const settingsService = {
  async get(): Promise<Settings> {
    await delay(100);
    const data = localStorage.getItem(STORAGE_KEYS.settings);
    if (!data) return defaultSettings;
    try {
      return { ...defaultSettings, ...JSON.parse(data) };
    } catch {
      return defaultSettings;
    }
  },

  async update(settings: Settings): Promise<void> {
    await delay(100);
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  },
};
