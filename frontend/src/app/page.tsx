"use client";

import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import "./globals.css";

// Icons (using simple SVGs for demonstration)
const IconRefresh = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-10.27l-5.42 5.42" /></svg>
);
const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);
const IconWallet = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></svg>
);
const IconPie = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>
);
const IconBank = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
);
const IconClock = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);
const IconGoogle = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
);

const BANK_LOGOS: Record<string, string> = {
  aiyl: "https://abank.kg/img/logo_new.svg",
  optima: "https://upload.wikimedia.org/wikipedia/commons/c/c0/Logotip_OPTIMA-BANK.jpg",
  mbank: "https://mbank.kg/_next/static/media/logo.6cee92d7.svg",
  eldik: "https://eldik.kg/_next/image?url=https%3A%2F%2Feldik.kg%2Fmedia%2Fmain%2F%25D0%259B%25D0%25BE%25D0%25B3%25D0%25BE%25D1%2582%25D0%25B8%25D0%25BF_%25D0%25BE%25D1%2581%25D0%25BD%25D0%25BE%25D0%25B2%25D0%25BD%25D0%25BE%25D0%25B9_%25D0%25BA%25D1%258B%25D1%2580%25D0%25B3%25D1%258B%25D0%25B7%25D1%2587%25D0%25B0.png&w=768&q=75"
};

interface Bank {
  name: string;
  logo_name: string;
  status: string;
  account_count: number;
  balance: number;
  last_updated: string;
}

interface DashboardData {
  stats: {
    total_balance: number;
    total_banks_connected: number;
    total_accounts: number;
    last_updated: string | null;
  };
  banks: Bank[];
}

import { Sidebar } from "@/components/Sidebar";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount) + ' KGS';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Нет данных";
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/backend-proxy`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/backend-proxy`, {
        method: "POST"
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to refresh data:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();

      // Auto-refresh data every 60 seconds silently
      const intervalId = setInterval(() => {
        fetchData();
      }, 60000);

      return () => clearInterval(intervalId);
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <div style={{ color: '#666' }}>Авторизация...</div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
        <div style={{ backgroundColor: 'white', padding: '48px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', color: '#1e293b' }}>
            <IconBank />
          </div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#0f172a' }}>Добро пожаловать</h1>
          <p style={{ margin: '0 0 32px 0', color: '#64748b', fontSize: '15px' }}>Войдите используя корпоративный аккаунт для доступа к Казначейству</p>
          <button
            onClick={() => signIn('google')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', width: '100%', padding: '12px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', fontWeight: '500', color: '#334155', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            <IconGoogle />
            Войти через Google
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: "40px", fontFamily: "sans-serif" }}>Загрузка данных...</div>;
  }

  return (
    <div className="app-container">
      <Sidebar 
        lastUpdated={formatDate(data?.stats.last_updated || null)} 
        onRefresh={handleRefresh} 
        refreshing={refreshing} 
      />

      <main className="main-content">
        <div className="header-row">
          <div>
            <h1 className="page-title">
              Обзор остатков 
              {data?.stats.last_updated && (
                <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "normal", marginLeft: "12px" }}>
                  (на {formatDate(data.stats.last_updated)})
                </span>
              )}
            </h1>
            <div className="page-subtitle">Консолидированная информация по остаткам на расчетных счетах (только KGS)</div>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon"><IconWallet /></div>
            <div className="stat-info">
              <span className="stat-title">Общий остаток</span>
              <span className="stat-value">{formatCurrency(data?.stats.total_balance || 0)}</span>
              <span className="stat-subtitle">по всем банкам</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><IconPie /></div>
            <div className="stat-info">
              <span className="stat-title">Количество банков</span>
              <span className="stat-value">{data?.stats.total_banks_connected || 0}</span>
              <span className="stat-subtitle">подключено</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><IconBank /></div>
            <div className="stat-info">
              <span className="stat-title">Количество счетов</span>
              <span className="stat-value">{data?.stats.total_accounts || 0}</span>
              <span className="stat-subtitle">расчетных счетов</span>
            </div>
          </div>
        </div>

        <div className="banks-grid">
          {data?.banks.map(bank => (
            <div className="bank-card" key={bank.name}>
              <div className="bank-header">
                <div className="bank-logo" style={{ gap: '16px' }}>
                  <img
                    src={BANK_LOGOS[bank.logo_name]}
                    alt={`${bank.name} logo`}
                    width={66}
                    height={66}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    style={{ borderRadius: '8px', objectFit: 'contain' }}
                  />
                  <span style={{ fontSize: '20px' }}>{bank.name}</span>
                </div>
              </div>
              <div className="bank-balance-label">Общий остаток</div>
              <div className="bank-balance">{formatCurrency(bank.balance)}</div>
              <div className="bank-footer">
                Расчетных счетов: {bank.account_count}
              </div>
            </div>
          ))}
        </div>

        <div className="table-section">
          <div className="table-card">
            <div className="section-title">Остатки по банкам <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "normal" }}>(консолидировано, только KGS)</span></div>
            <table>
              <thead>
                <tr>
                  <th>Банк</th>
                  <th>Общий остаток (KGS)</th>
                  <th>Количество счетов</th>
                  <th>Статус</th>
                  <th>Последнее обновление</th>
                </tr>
              </thead>
              <tbody>
                {data?.banks.map(bank => (
                  <tr key={bank.name}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img
                          src={BANK_LOGOS[bank.logo_name]}
                          alt={`${bank.name} logo`}
                          width={24}
                          height={24}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          style={{ borderRadius: '4px', objectFit: 'contain' }}
                        />
                        <strong>{bank.name}</strong>
                      </div>
                    </td>
                    <td>{formatCurrency(bank.balance).replace(" KGS", "")}</td>
                    <td>{bank.account_count}</td>
                    <td>
                      <span className="bank-status" style={{ display: "inline-flex", padding: "2px 6px" }}>
                        <IconCheck /> {bank.status}
                      </span>
                    </td>
                    <td>{formatDate(bank.last_updated)}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: "2px solid #ecf0f1", fontWeight: "bold" }}>
                  <td>Итого</td>
                  <td>{formatCurrency(data?.stats.total_balance || 0).replace(" KGS", "")}</td>
                  <td>{data?.stats.total_accounts || 0}</td>
                  <td>-</td>
                  <td>{formatDate(data?.stats.last_updated || null)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="info-card">
            <div className="section-title">Информация</div>
            <div className="info-item">
              <div className="info-icon"><IconWallet /></div>
              <div className="info-text">Отображаются только расчетные счета в KGS</div>
            </div>
            <div className="info-item">
              <div className="info-icon"><IconRefresh /></div>
              <div className="info-text">Данные обновляются автоматически</div>
            </div>
            <div className="info-item">
              <div className="info-icon"><strong style={{ border: "1px solid currentColor", borderRadius: "50%", padding: "4px" }}>KGS</strong></div>
              <div className="info-text">Валюта отображения: KGS</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
