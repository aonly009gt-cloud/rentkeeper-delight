import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Globe, LogIn } from 'lucide-react';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = isLogin 
        ? await signIn(email, password)
        : await signUp(email, password);
      
      if (error) {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">🏘️</h1>
          <h2 className="text-xl font-bold mt-2">ห้องเช่าช่างพัฒน์ 371</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-xl border p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">อีเมล</label>
            <Input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">รหัสผ่าน</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading}
          >
            <LogIn className="w-5 h-5 mr-2" />
            {loading ? 'กำลังโหลด...' : isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:underline"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'ยังไม่มีบัญชี? สมัคร' : 'มีบัญชีแล้ว? เข้าสู่ระบบ'}
            </button>
          </div>
        </form>

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
