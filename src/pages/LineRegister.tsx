import { useState, useEffect } from 'react';
import liff from '@line/liff';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

type PageState = 'loading' | 'success' | 'error' | 'no-liff';

export default function LineRegisterPage() {
  const [state, setState] = useState<PageState>('loading');
  const [message, setMessage] = useState('');
  const [roomName, setRoomName] = useState('');

  useEffect(() => {
    register();
  }, []);

  const register = async () => {
    const params = new URLSearchParams(window.location.search);
    const tenantId = params.get('tenantId');
    const liffId = params.get('liffId') || import.meta.env.VITE_LINE_LIFF_ID;

    if (!tenantId || !liffId) {
      setState('error');
      setMessage('ลิงก์ไม่ถูกต้อง กรุณาติดต่อเจ้าของหอพัก');
      return;
    }

    try {
      await liff.init({ liffId });

      if (!liff.isLoggedIn()) {
        liff.login();
        return;
      }

      const profile = await liff.getProfile();
      const lineUserId = profile.userId;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const res = await fetch(`${supabaseUrl}/functions/v1/register-line-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
        },
        body: JSON.stringify({ tenantId, lineUserId }),
      });

      const result = await res.json();

      if (result.success) {
        setState('success');
        setRoomName(result.roomName || '');
        setMessage(`ลงทะเบียนสำเร็จ! คุณ ${result.tenantName || ''}`);
      } else {
        setState('error');
        setMessage(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (err: any) {
      setState('error');
      setMessage(err.message || 'เกิดข้อผิดพลาด');
    }
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">กำลังลงทะเบียน LINE...</p>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <CheckCircle className="w-20 h-20 text-success mb-4" />
        <h2 className="text-2xl font-bold mb-2">ลงทะเบียนสำเร็จ! ✅</h2>
        <p className="text-muted-foreground text-lg">{message}</p>
        {roomName && <p className="text-muted-foreground mt-1">ห้อง: {roomName}</p>}
        <p className="text-sm text-muted-foreground mt-4">
          คุณสามารถดูใบแจ้งหนี้ผ่าน LINE ได้แล้ว
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
      <AlertCircle className="w-16 h-16 text-destructive mb-4" />
      <h2 className="text-xl font-bold mb-2">เกิดข้อผิดพลาด</h2>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
