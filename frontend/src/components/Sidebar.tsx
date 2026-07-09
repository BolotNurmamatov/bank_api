import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const IconBank = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
);

export function Sidebar({
  lastUpdated,
  onRefresh,
  refreshing
}: {
  lastUpdated?: string | null;
  onRefresh?: () => void;
  refreshing?: boolean;
} = {}) {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <IconBank />
        <span>Казначейство</span>
      </div>
      <div style={{ padding: '0 24px', marginBottom: '24px', color: '#64748b', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span>{session?.user?.name}</span>
        <button onClick={() => signOut()} style={{ background: 'none', border: 'none', padding: '0', color: '#3b82f6', cursor: 'pointer', textAlign: 'left', fontSize: '12px' }}>Выйти</button>
      </div>
      <ul className="sidebar-menu">
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <li className={`sidebar-item ${pathname === '/' ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>
            Обзор остатков
          </li>
        </Link>
        <Link href="/banks" style={{ textDecoration: 'none', color: 'inherit' }}>
          <li className={`sidebar-item ${pathname === '/banks' ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
            Банки
          </li>
        </Link>
        <Link href="/reports" style={{ textDecoration: 'none', color: 'inherit' }}>
          <li className={`sidebar-item ${pathname === '/reports' ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
            Отчеты
          </li>
        </Link>
        <li className="sidebar-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
          Журнал запросов
        </li>
      </ul>
      
      {onRefresh && (
        <div style={{ padding: '24px', borderTop: '1px solid var(--border-color)', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            onClick={onRefresh} 
            disabled={refreshing}
            style={{ 
              width: '100%', 
              padding: '12px', 
              backgroundColor: refreshing ? '#94a3b8' : '#2563eb', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontWeight: 'bold', 
              fontSize: '15px', 
              cursor: refreshing ? 'not-allowed' : 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px',
              transition: 'background-color 0.2s',
              boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1)'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={refreshing ? "spin-animation" : ""}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
            {refreshing ? 'Обновляется...' : 'Обновить данные'}
          </button>
          {lastUpdated && (
            <div style={{ fontSize: '13px', color: '#64748b', textAlign: 'center' }}>
              Обновлено: <br/><strong style={{color: '#334155'}}>{lastUpdated}</strong>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
