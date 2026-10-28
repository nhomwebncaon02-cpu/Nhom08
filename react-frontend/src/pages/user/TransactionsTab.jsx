import React, { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../../api/axiosClient';
import { transactionApi } from '../../api/transactionApi';
import { walletApi } from '../../api/walletApi';
import api from '../../api/axiosClient';

const EMPTY_FILTERS = { FromDate: '', ToDate: '', CategoryId: '', Type: '' };
const now = new Date();
const TODAY = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

function formatAmount(amount, currency = 'VND') {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(Number(amount));
}

function dateOnly(value) {
  return value ? String(value).slice(0, 10) : '—';
}

export default function TransactionsTab({ onChanged }) {
  const [transactions, setTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [form, setForm] = useState({
    AccountId: '',
    CategoryId: '',
    Amount: '',
    TransactionDate: TODAY,
    Note: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadData = useCallback(async (activeFilters = {}, showLoading = true) => {
    if (showLoading) {
      setLoading(true);
      setError('');
    }
    try {
      const [transactionList, walletList, categoryList] = await Promise.all([
        transactionApi.list(activeFilters),
        walletApi.list(),
        api.get('/categories').then((response) => response.data),
      ]);
      setTransactions(transactionList);
      setWallets(walletList);
      setCategories(categoryList);
      setForm((current) => ({
        ...current,
        AccountId: current.AccountId || String(walletList[0]?.AccountId ?? ''),
        CategoryId: current.CategoryId || String(categoryList[0]?.categoryId ?? ''),
      }));
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Không thể tải dữ liệu giao dịch.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => loadData({}, false));
  }, [loadData]);

  const updateFilter = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    const query = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== ''),
    );
    loadData(query);
  };

  const submitTransaction = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);
    try {
      await transactionApi.create({
        ...form,
        AccountId: Number(form.AccountId),
        CategoryId: Number(form.CategoryId),
        Amount: Number(form.Amount),
      });
      setForm((current) => ({ ...current, Amount: '', Note: '' }));
      setNotice('Đã thêm giao dịch.');
      await loadData(
        Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '')),
      );
      onChanged?.();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Không thể lưu giao dịch.'));
    } finally {
      setSaving(false);
    }
  };

  const deleteTransaction = async (transactionId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) return;
    setError('');
    setNotice('');
    try {
      await transactionApi.remove(transactionId);
      setNotice('Đã xóa giao dịch.');
      await loadData(
        Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '')),
      );
      onChanged?.();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Không thể xóa giao dịch.'));
    }
  };

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-black text-slate-800">Sổ giao dịch</h2>
        <p className="mt-1 text-sm text-slate-500">Giao dịch chỉ hiển thị trong các ví của bạn.</p>
      </header>

      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}

      <form onSubmit={submitTransaction} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-2 xl:grid-cols-5">
        <label className="text-xs font-semibold text-slate-600">
          Ví
          <select required value={form.AccountId} onChange={(event) => setForm({ ...form, AccountId: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm">
            <option value="">Chọn ví</option>
            {wallets.map((wallet) => <option key={wallet.AccountId} value={wallet.AccountId}>{wallet.AccountName}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Danh mục
          <select required value={form.CategoryId} onChange={(event) => setForm({ ...form, CategoryId: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm">
            <option value="">Chọn danh mục</option>
            {categories.map((category) => <option key={category.categoryId} value={category.categoryId}>{category.categoryName} ({category.type === 'Income' ? 'Thu' : 'Chi'})</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Số tiền
          <input required min="0.01" step="0.01" type="number" value={form.Amount} onChange={(event) => setForm({ ...form, Amount: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm" />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Ngày
          <input required type="date" value={form.TransactionDate} onChange={(event) => setForm({ ...form, TransactionDate: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm" />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Ghi chú
          <input maxLength="255" value={form.Note} onChange={(event) => setForm({ ...form, Note: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm" placeholder="Không bắt buộc" />
        </label>
        <div className="md:col-span-2 xl:col-span-5">
          <button type="submit" disabled={saving || !wallets.length || !categories.length} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? 'Đang lưu…' : 'Thêm giao dịch'}
          </button>
        </div>
      </form>

      <form onSubmit={applyFilters} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-xs font-semibold text-slate-600">Từ ngày<input name="FromDate" type="date" value={filters.FromDate} onChange={updateFilter} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm" /></label>
        <label className="text-xs font-semibold text-slate-600">Đến ngày<input name="ToDate" type="date" value={filters.ToDate} onChange={updateFilter} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm" /></label>
        <label className="text-xs font-semibold text-slate-600">Danh mục<select name="CategoryId" value={filters.CategoryId} onChange={updateFilter} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"><option value="">Tất cả</option>{categories.map((category) => <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-600">Loại<select name="Type" value={filters.Type} onChange={updateFilter} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"><option value="">Thu và chi</option><option value="Income">Thu</option><option value="Expense">Chi</option></select></label>
        <div className="flex items-end gap-2"><button type="submit" className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-bold text-white">Lọc</button><button type="button" onClick={() => { setFilters(EMPTY_FILTERS); loadData(); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600">Xóa lọc</button></div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr><th className="p-3">Ngày</th><th className="p-3">Danh mục</th><th className="p-3">Ví</th><th className="p-3">Ghi chú</th><th className="p-3 text-right">Số tiền</th><th className="p-3 text-right">Thao tác</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan="6" className="p-6 text-center text-slate-500">Đang tải giao dịch…</td></tr>
              : transactions.length === 0 ? <tr><td colSpan="6" className="p-6 text-center text-slate-500">Chưa có giao dịch phù hợp.</td></tr>
                : transactions.map((transaction) => {
                  const isIncome = transaction.category?.type === 'Income';
                  return (
                    <tr key={transaction.TransactionId} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-600">{dateOnly(transaction.TransactionDate)}</td>
                      <td className="p-3 font-semibold text-slate-800">{transaction.category?.categoryName ?? '—'}</td>
                      <td className="p-3 text-slate-600">{transaction.account?.AccountName ?? '—'}</td>
                      <td className="p-3 text-slate-500">{transaction.Note || '—'}</td>
                      <td className={`p-3 text-right font-bold ${isIncome ? 'text-emerald-700' : 'text-rose-600'}`}>{isIncome ? '+' : '−'}{formatAmount(transaction.Amount, transaction.account?.Currency || 'VND')}</td>
                      <td className="p-3 text-right"><button type="button" onClick={() => deleteTransaction(transaction.TransactionId)} className="font-semibold text-rose-600 hover:text-rose-800">Xóa</button></td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
