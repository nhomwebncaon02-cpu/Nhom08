import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import WalletsTab from './user/WalletsTab';
import BudgetsTab from './user/BudgetsTab';
import BudgetAlerts from './user/BudgetAlerts';
import { walletApi } from '../api/walletApi';
import { transactionApi } from '../api/transactionApi';
import TransactionsTab from './user/TransactionsTab';
import { getErrorMessage } from '../api/axiosClient';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth(); // user lấy từ JWT session (ProtectedRoute đã đảm bảo đã đăng nhập)
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [stats, setStats] = useState({ totalBalance: 0, totalIncome: 0, totalExpense: 0, totalGoal: 0 });
  const [goals, setGoals] = useState([]);
  const [dashboardError, setDashboardError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0); // tăng lên khi ví/ngân sách thay đổi -> tải lại tổng quan

  const loadData = useCallback(async (user) => {
    try {
      const [wallets, allTransactions] = await Promise.all([walletApi.list(), transactionApi.list()]);
      const vndWalletIds = new Set(
        wallets.filter((wallet) => (wallet.Currency || 'VND') === 'VND').map((wallet) => wallet.AccountId),
      );
      const month = new Date().toISOString().slice(0, 7);
      const monthTransactions = allTransactions.filter(
        (transaction) => String(transaction.TransactionDate).slice(0, 7) === month && vndWalletIds.has(transaction.AccountId),
      );
      const totalBalance = wallets
        .filter((wallet) => (wallet.Currency || 'VND') === 'VND')
        .reduce((sum, wallet) => sum + Number(wallet.Balance), 0);
      const totalIncome = monthTransactions
        .filter((transaction) => transaction.category?.type === 'Income')
        .reduce((sum, transaction) => sum + Number(transaction.Amount), 0);
      const totalExpense = monthTransactions
        .filter((transaction) => transaction.category?.type === 'Expense')
        .reduce((sum, transaction) => sum + Number(transaction.Amount), 0);

      const allGoals = JSON.parse(localStorage.getItem('SM_GOALS') || '[]')
        .filter((goal) => goal.UserId === user.UserId);
      const totalGoal = allGoals.reduce((sum, goal) => sum + Number(goal.CurrentAmount || 0), 0);
      setDashboardError('');
      setGoals(allGoals);
      setStats({ totalBalance, totalIncome, totalExpense, totalGoal });
    } catch (error) {
      setDashboardError(getErrorMessage(error, 'Không thể tải dữ liệu tổng quan.'));
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return undefined;
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return loadData(currentUser);
      return undefined;
    });
    return () => {
      active = false;
    };
  }, [currentUser, refreshKey, loadData]);

  const handleDataChanged = () => setRefreshKey((k) => k + 1);

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      logout();
      navigate('/auth', { replace: true });
    }
  };

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 lg:px-8 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-xl shadow-md shadow-emerald-500/30">
              <i className="fa-solid fa-wallet"></i>
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-800">SmartMoney</span>
              <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">USER</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
              {(currentUser?.FullName || '?').charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight">{currentUser?.FullName}</p>
              <p className="text-[11px] text-slate-400">{currentUser?.Email}</p>
            </div>
            <button onClick={handleLogout} title="Đăng xuất" className="text-slate-400 hover:text-rose-600 p-1.5">
              <i className="fa-solid fa-arrow-right-from-bracket text-base"></i>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 space-y-2">
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Menu Cá Nhân</p>
            <nav className="space-y-1">
              <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold ${activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                <i className="fa-solid fa-chart-pie text-emerald-600"></i> Tổng quan
              </button>
              <button onClick={() => setActiveTab('wallets')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold ${activeTab === 'wallets' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                <i className="fa-solid fa-wallet text-blue-600"></i> Ví & Tài khoản
              </button>
              <button onClick={() => setActiveTab('transactions')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold ${activeTab === 'transactions' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                <i className="fa-solid fa-receipt text-purple-600"></i> Sổ giao dịch
              </button>
              <button onClick={() => setActiveTab('budgets')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold ${activeTab === 'budgets' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                <i className="fa-solid fa-bullseye text-rose-600"></i> Hạn mức ngân sách
              </button>
              <button onClick={() => setActiveTab('goals')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold ${activeTab === 'goals' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                <i className="fa-solid fa-piggy-bank text-amber-600"></i> Mục tiêu tiết kiệm
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {dashboardError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{dashboardError}</p>}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 to-teal-700 p-6 rounded-3xl text-white shadow-xl">
                <div>
                  <h2 className="text-2xl font-black">Xin chào, {currentUser?.FullName}! 👋</h2>
                  <p className="text-emerald-100 text-sm mt-1">Chúc bạn một ngày quản lý chi tiêu hiệu quả.</p>
                </div>
              </div>

              {/* Cảnh báo ngân sách (Budget Alerts) */}
              <BudgetAlerts refreshKey={refreshKey} onViewAll={() => setActiveTab('budgets')} />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase">Tổng Số Dư</span>
                  <h3 className="text-2xl font-black text-slate-800 mt-2">{formatVND(stats.totalBalance)}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase">Tổng Thu Tháng</span>
                  <h3 className="text-2xl font-black text-blue-600 mt-2">+{formatVND(stats.totalIncome)}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase">Tổng Chi Tháng</span>
                  <h3 className="text-2xl font-black text-rose-600 mt-2">-{formatVND(stats.totalExpense)}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase">Tích Lũy Tiết Kiệm</span>
                  <h3 className="text-2xl font-black text-amber-600 mt-2">{formatVND(stats.totalGoal)}</h3>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VÍ & TÀI KHOẢN */}
          {activeTab === 'wallets' && <WalletsTab onChanged={handleDataChanged} />}

          {/* TAB 3: GIAO DỊCH */}
          {activeTab === 'transactions' && <TransactionsTab onChanged={handleDataChanged} />}

          {/* TAB 4: HẠN MỨC NGÂN SÁCH */}
          {activeTab === 'budgets' && <BudgetsTab onChanged={handleDataChanged} />}

          {/* TAB 5: MỤC TIÊU TIẾT KIỆM */}
          {activeTab === 'goals' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-slate-800">Mục Tiêu Tiết Kiệm (Goals)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {goals.map(g => (
                  <div key={g.GoalId} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <h4 className="font-bold text-slate-800 text-sm">{g.GoalName}</h4>
                    <p className="text-xs text-amber-600 font-bold">Đã đạt: {formatVND(g.CurrentAmount)} / {formatVND(g.TargetAmount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;