"use client";

import { useEffect, useState } from "react";
import "./globals.css";

// Icons (using simple SVGs for demonstration)
const IconRefresh = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-10.27l-5.42 5.42"/></svg>
);
const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);
const IconWallet = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
);
const IconPie = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
);
const IconBank = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
);
const IconClock = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

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

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU').format(amount) + ' KGS';
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
      const res = await fetch("http://localhost:8000/api/v1/dashboard");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/dashboard/refresh", {
        method: "POST"
      });
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to refresh data:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <div style={{ padding: "40px", fontFamily: "sans-serif" }}>Загрузка данных...</div>;
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <IconBank />
          <span>Казначейство</span>
        </div>
        <ul className="sidebar-menu">
          <li className="sidebar-item active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
            Обзор остатков
          </li>
          <li className="sidebar-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            Банки
          </li>
          <li className="sidebar-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Отчеты
          </li>
          <li className="sidebar-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            Журнал запросов
          </li>
        </ul>
      </aside>

      <main className="main-content">
        <div className="header-row">
          <div>
            <h1 className="page-title">Обзор остатков</h1>
            <div className="page-subtitle">Консолидированная информация по остаткам на расчетных счетах (только KGS)</div>
          </div>
          <div className="header-actions">
            <span>Обновлено: {formatDate(data?.stats.last_updated || null)}</span>
            <button className="refresh-btn" onClick={handleRefresh} disabled={refreshing}>
              <IconRefresh />
              {refreshing ? 'Обновление...' : 'Обновить'}
            </button>
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
          <div className="stat-card">
            <div className="stat-icon"><IconClock /></div>
            <div className="stat-info">
              <span className="stat-title">Последнее обновление</span>
              <span className="stat-value" style={{ fontSize: "16px", marginTop: "12px" }}>{formatDate(data?.stats.last_updated || null)}</span>
              <span className="stat-subtitle">успешно</span>
            </div>
          </div>
        </div>

        <div className="banks-grid">
          {data?.banks.map(bank => (
            <div className="bank-card" key={bank.name}>
              <div className="bank-header">
                <div className="bank-logo">
                  {/* Simplistic logo representation */}
                  {bank.name}
                </div>
                <div className="bank-status">
                  <IconCheck /> {bank.status}
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
            <div className="section-title">Остатки по банкам <span style={{fontSize: "12px", color: "var(--text-secondary)", fontWeight: "normal"}}>(консолидировано, только KGS)</span></div>
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
                    <td><strong>{bank.name}</strong></td>
                    <td>{formatCurrency(bank.balance).replace(" KGS", "")}</td>
                    <td>{bank.account_count}</td>
                    <td>
                      <span className="bank-status" style={{display: "inline-flex", padding: "2px 6px"}}>
                        <IconCheck /> {bank.status}
                      </span>
                    </td>
                    <td>{formatDate(bank.last_updated).split(" ")[0]}</td>
                  </tr>
                ))}
                <tr style={{borderTop: "2px solid #ecf0f1", fontWeight: "bold"}}>
                  <td>Итого</td>
                  <td>{formatCurrency(data?.stats.total_balance || 0).replace(" KGS", "")}</td>
                  <td>{data?.stats.total_accounts || 0}</td>
                  <td>-</td>
                  <td>{formatDate(data?.stats.last_updated || null).split(" ")[0]}</td>
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
              <div className="info-icon"><strong style={{border: "1px solid currentColor", borderRadius: "50%", padding: "4px"}}>KGS</strong></div>
              <div className="info-text">Валюта отображения: KGS</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
