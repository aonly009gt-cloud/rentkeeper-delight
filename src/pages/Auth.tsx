import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Globe, MessageCircle } from 'lucide-react';
import { useState } from 'react';

export default function AuthPage() {
  const { signInWithLine } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleLineLogin = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithLine();
      if (error) {
        alert("ข้อผิดพลาด: " + (error.message || error));
        toast.error(error.message || 'เข้าสู่ระบบด้วย LINE ไม่สำเร็จ กรุณาลองใหม่');
        setLoading(false);
      } else {
        setTimeout(() => {
          // If stuck on loading after success, force reload
          window.location.reload();
        }, 3000);
      }
    } catch (err: any) {
      alert("ข้อผิดพลาดระบบ: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">🏘️</h1>
          <h2 className="text-xl font-bold mt-2">{t('app.title')}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            เข้าสู่ระบบเพื่อจัดการห้องเช่า
          </p>
        </div>

        <div className="bg-card rounded-xl border p-6 space-y-6 flex flex-col items-center">
          <div className="bg-[#00B900]/10 p-4 rounded-full mb-2">
            <MessageCircle className="w-10 h-10 text-[#00B900]" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg">เข้าสู่ระบบด้วย LINE</h3>
            <p className="text-sm text-muted-foreground">
              สะดวก ปลอดภัย ไม่ต้องจำรหัสผ่าน
            </p>
          </div>

          <Button
            onClick={handleLineLogin}
            className="w-full bg-[#00B900] hover:bg-[#00B900]/90 text-white"
            size="lg"
            disabled={loading}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            {loading ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่ระบบด้วย LINE'}
          </Button>
        </div>

        <div className="flex items-center justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === 'th' ? 'shan' : 'th')}
          >
            <Globe className="w-4 h-4 mr-1" />
            {language === 'th' ? 'ไทใหญ่' : 'ไทย'}
          </Button>
        </div>
      </div>
    </div>
  );
}
