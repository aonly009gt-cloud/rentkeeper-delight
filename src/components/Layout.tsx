import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Settings, BarChart3, FileText, Wrench, Megaphone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import BroadcastDialog from './BroadcastDialog';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { t } = useLanguage();
  const [broadcastOpen, setBroadcastOpen] = useState(false);

  const navItems = [
    { path: '/', label: t('nav.rooms'), icon: Home },
    { path: '/invoice', label: t('nav.invoice'), icon: FileText },
    { path: '/report', label: t('nav.report'), icon: BarChart3 },
    { path: '/maintenance', label: 'แจ้งซ่อม', icon: Wrench },
    { path: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b no-print" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">{t('app.title')}</h1>
          <Button variant="outline" size="sm" onClick={() => setBroadcastOpen(true)} className="text-blue-600 border-blue-200 hover:bg-blue-50">
            <Megaphone className="w-4 h-4 mr-1.5" /> ประกาศ
          </Button>
        </div>
      </header>

      <BroadcastDialog open={broadcastOpen} onClose={() => setBroadcastOpen(false)} />

      {/* Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t z-40 no-print">
        <div className="max-w-5xl mx-auto flex">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex-1 flex flex-col items-center py-2.5 text-xs transition-colors ${isActive
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <item.icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-primary' : ''}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
