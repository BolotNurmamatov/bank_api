"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/Sidebar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface HistoryDataPoint {
  time_bucket: string;
  balances: Record<string, number>;
}

interface HistoryResponse {
  data: HistoryDataPoint[];
}

const BANK_COLORS: Record<string, string> = {
  "Элдик Банк": "#0284c7",  // Blue
  "Оптима Банк": "#dc2626", // Red
  "Айыл Банк": "#d97706",   // Orange
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'KGS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export default function ReportsPage() {
  const { status } = useSession();
  const [data, setData] = useState<HistoryDataPoint[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"hour" | "today" | "week" | "month">("today");
  const [refreshing, setRefreshing] = useState(false);

  // Download Filters
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  
  // Default dates: 7 days ago to today
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch('/api/backend-proxy?refresh=true', { method: 'POST' });
      await fetchData(timeRange);
    } catch (err) {
      console.error("Failed to force refresh", err);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchData = async (range: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?timeRange=${range}`);
      if (res.ok) {
        const json: HistoryResponse = await res.json();
        setData(json.data || []);
      }
      
      const accRes = await fetch(`/api/backend-proxy`);
      if (accRes.ok) {
        const accJson = await accRes.json();
        setAccounts(accJson.accounts || []);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchData(timeRange);
      
      const intervalId = setInterval(() => {
        fetchData(timeRange);
      }, 60000);
      
      return () => clearInterval(intervalId);
    }
  }, [status, timeRange]);

  if (status === "loading") {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <div style={{ color: '#666' }}>Загрузка...</div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <div>Access Denied</div>;
  }

  // Transform data for recharts
  const chartData = data.map(point => {
    const time = new Date(point.time_bucket);
    let displayTime = "";
    
    if (timeRange === "hour" || timeRange === "today") {
      displayTime = time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } else {
      displayTime = time.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    }

    return {
      time: displayTime,
      fullTime: time.toLocaleString('ru-RU'),
      ...point.balances
    };
  });

  // Extract all unique bank names present in the data to create lines
  const bankNames = Array.from(new Set(data.flatMap(d => Object.keys(d.balances))));

  const handleDownload = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (selectedBank) queryParams.append('bank', selectedBank);
      if (selectedAccount) queryParams.append('account', selectedAccount);
      if (dateFrom) queryParams.append('date_from', dateFrom);
      if (dateTo) queryParams.append('date_to', dateTo);

      // Log the action
      fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "download_data", 
          page_url: "/reports", 
          details: `User downloaded report for Bank: ${selectedBank || 'All'}, Account: ${selectedAccount || 'All'}, Date: ${dateFrom} to ${dateTo}` 
        })
      }).catch(err => console.error("Failed to log download", err));

      const res = await fetch(`/api/download?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Отчет_остатки_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Ошибка при скачивании данных");
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
      <main className="main-content">
        <div className="header-row">
          <div>
            <h1 className="page-title">Отчеты</h1>
            <div className="page-subtitle">Графики изменения остатков на счетах</div>
          </div>
        </div>

        <div style={{ marginTop: '24px', backgroundColor: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>Динамика остатков по банкам</h2>
            
            <div style={{ display: 'flex', gap: '8px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
              {(['hour', 'today', 'week', 'month'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  style={{
                    padding: '6px 12px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: timeRange === range ? 'white' : 'transparent',
                    boxShadow: timeRange === range ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    color: timeRange === range ? '#0f172a' : '#64748b',
                    fontWeight: timeRange === range ? 600 : 500,
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                >
                  {range === 'hour' ? 'Час' : range === 'today' ? 'Сегодня' : range === 'week' ? 'Неделя' : 'Месяц'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: '500px', width: '100%' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748b' }}>
                Загрузка данных графика...
              </div>
            ) : chartData.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748b' }}>
                Нет данных за выбранный период
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    domain={[-1000000, 'auto']}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}
                    labelFormatter={(label, payload) => payload[0]?.payload?.fullTime || label}
                    formatter={(value: any) => [formatCurrency(Number(value)), ""]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  {bankNames.map((bank, index) => (
                    <Line 
                      key={bank}
                      type="monotone" 
                      dataKey={bank} 
                      name={bank}
                      stroke={BANK_COLORS[bank] || `hsl(${index * 60}, 70%, 50%)`} 
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div style={{ marginTop: '24px', backgroundColor: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h2 style={{ margin: '0 0 24px 0', fontSize: '18px', color: '#1e293b' }}>Скачать данные</h2>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>Банк</label>
              <select 
                value={selectedBank} 
                onChange={(e) => {
                  setSelectedBank(e.target.value);
                  setSelectedAccount(""); // Reset account when bank changes
                }} 
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                <option value="">Все банки</option>
                {Array.from(new Set(accounts.map(a => a.bank_name))).map((b: any) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>Счет</label>
              <select 
                value={selectedAccount} 
                onChange={(e) => setSelectedAccount(e.target.value)} 
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                <option value="">Все счета</option>
                {accounts
                  .filter(a => selectedBank === "" || a.bank_name === selectedBank)
                  .map(a => (
                    <option key={a.account_number} value={a.account_number}>
                      {a.account_number} {a.currency && `(${a.currency})`}
                    </option>
                  ))
                }
              </select>
            </div>
            <div style={{ flex: '1', minWidth: '150px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>Дата с</label>
              <input 
                type="date" 
                value={dateFrom} 
                onChange={(e) => setDateFrom(e.target.value)} 
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} 
              />
            </div>
            <div style={{ flex: '1', minWidth: '150px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>Дата по</label>
              <input 
                type="date" 
                value={dateTo} 
                onChange={(e) => setDateTo(e.target.value)} 
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} 
              />
            </div>
            <button 
              onClick={handleDownload} 
              style={{ padding: '10px 24px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '500', cursor: 'pointer', height: '42px', boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.2)' }}
            >
              Скачать (Excel)
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
