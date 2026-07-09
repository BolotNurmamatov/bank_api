"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/Sidebar";

const BANK_LOGOS: Record<string, string> = {
  aiyl: "https://abank.kg/img/logo_new.svg",
  optima: "https://upload.wikimedia.org/wikipedia/commons/c/c0/Logotip_OPTIMA-BANK.jpg",
  mbank: "https://mbank.kg/_next/static/media/logo.6cee92d7.svg",
  eldik: "https://eldik.kg/_next/image?url=https%3A%2F%2Feldik.kg%2Fmedia%2Fmain%2F%25D0%259B%25D0%25BE%25D0%25B3%25D0%25BE%25D1%2582%25D0%25B8%25D0%25BF_%25D0%25BE%25D1%2581%25D0%25BD%25D0%25BE%25D0%25B2%25D0%25BD%25D0%25BE%25D0%25B9_%25D0%25BA%25D1%258B%25D1%2580%25D0%25B3%25D1%258B%25D0%25B7%25D1%2587%25D0%25B0.png&w=768&q=75"
};

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  currency: string;
  balance: number;
  last_updated: string;
}

interface Bank {
  name: string;
  logo_name: string;
}

interface DashboardData {
  banks: Bank[];
  accounts: BankAccount[];
}

export default function BanksPage() {
  const { status } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount) + ' ' + currency;
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

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();

      const intervalId = setInterval(() => {
        fetchData();
      }, 60000);

      return () => clearInterval(intervalId);
    }
  }, [status]);

  if (status === "loading" || loading) {
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
    // Should be handled by layout/middleware, but just in case
    return <div>Access Denied</div>;
  }

  // Group accounts by bank name
  const groupedAccounts = data?.banks.map(bank => {
    return {
      bank,
      accounts: data.accounts.filter(a => a.bank_name === bank.name)
    };
  }) || [];

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <div className="header-row">
          <div>
            <h1 className="page-title">Банки</h1>
            <div className="page-subtitle">Детальная информация по расчетным счетам</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "32px", marginTop: "24px" }}>
          {groupedAccounts.map((group) => (
            <div key={group.bank.name} style={{ backgroundColor: "white", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                <img
                  src={BANK_LOGOS[group.bank.logo_name]}
                  alt={`${group.bank.name} logo`}
                  width={56}
                  height={56}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  style={{ borderRadius: '8px', objectFit: 'contain' }}
                />
                <h2 style={{ margin: 0, fontSize: "20px", color: "#1e293b" }}>{group.bank.name}</h2>
              </div>

              {group.accounts.length === 0 ? (
                <div style={{ color: "#64748b", padding: "16px 0" }}>Нет данных по счетам</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "12px 8px", color: "#64748b", fontWeight: 500 }}>Номер счета</th>
                      <th style={{ padding: "12px 8px", color: "#64748b", fontWeight: 500 }}>Валюта</th>
                      <th style={{ padding: "12px 8px", color: "#64748b", fontWeight: 500, textAlign: "right" }}>Остаток</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.accounts.map(acc => (
                      <tr key={acc.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "16px 8px", color: "#334155", fontFamily: "monospace", fontSize: "15px" }}>{acc.account_number}</td>
                        <td style={{ padding: "16px 8px", color: "#64748b" }}>{acc.currency}</td>
                        <td style={{ padding: "16px 8px", color: "#0f172a", fontWeight: 600, textAlign: "right" }}>
                          {formatCurrency(acc.balance, acc.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
