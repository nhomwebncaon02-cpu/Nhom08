import { useCallback, useEffect, useMemo, useState } from 'react';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import BudgetAlerts from './BudgetAlerts';
import { budgetApi, categoryApi, BUDGET_STATUS } from '../../api/budgetApi';
import { getErrorMessage } from '../../api/axiosClient';
import { categoryIcon, formatDate, formatVND, monthRange, toYMD } from '../../utils/format';

const emptyForm = () => {
  const { start, end } = monthRange(0);
  return { CategoryId: '', AmountLimit: '', StartDate: start, EndDate: end };
};

/** Tab "Hạn mức ngân sách": thiết lập ngân sách + cảnh báo + kiểm tra chặn vượt hạn mức */
export default function BudgetsTab({ onChanged }) {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('active'); // active | all

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Công cụ kiểm tra khoản chi (demo logic chặn vượt hạn mức)
  const [check, setCheck] = useState({ CategoryId: '', Amount: '', Date: toYMD(new Date()) });
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);

  const expenseCategories = useMemo(() => categories.filter((c) => c.type === 'Expense'), [categories]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [b, c] = await Promise.all([budgetApi.list(), categoryApi.list()]);
      setBudgets(b);
      setCategories(c);
    } catch (e) {
      setError(getErrorMessage(e, 'Không tải được ngân sách'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visibleBudgets = filter === 'active' ? budgets.filter((b) => b.IsActive) : budgets;
  const alerts = budgets.filter((b) => b.IsActive && b.Status !== 'ok');

  // ---------- Thêm / sửa ----------
  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (b) => {
    setEditing(b);
    setForm({ CategoryId: String(b.CategoryId), AmountLimit: String(b.AmountLimit), StartDate: b.StartDate, EndDate: b.EndDate });
    setFormError('');
    setModalOpen(true);
  };

  const applyPreset = (offset) => {
    const { start, end } = monthRange(offset);
    setForm((f) => ({ ...f, StartDate: start, EndDate: end }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const amount = Number(form.AmountLimit);
    if (!form.CategoryId) return setFormError('Vui lòng chọn danh mục');
    if (!amount || amount < 1000) return setFormError('Hạn mức tối thiểu 1.000đ');
    if (!form.StartDate || !form.EndDate) return setFormError('Vui lòng chọn khoảng thời gian');
    if (form.EndDate < form.StartDate) return setFormError('Ngày kết thúc phải sau ngày bắt đầu');

    const payload = {
      CategoryId: Number(form.CategoryId),
      AmountLimit: amount,
      StartDate: form.StartDate,
      EndDate: form.EndDate,
    };
    setSaving(true);
    setFormError('');
    try {
      if (editing) await budgetApi.update(editing.BudgetId, payload);
      else await budgetApi.create(payload);
      setModalOpen(false);
      await load();
      onChanged?.();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Lưu ngân sách thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await budgetApi.remove(deleting.BudgetId);
      setDeleting(null);
      await load();
      onChanged?.();
    } catch (err) {
      setError(getErrorMessage(err, 'Xoá ngân sách thất bại'));
      setDeleting(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ---------- Kiểm tra khoản chi ----------
  const handleCheck = async (e) => {
    e.preventDefault();
    if (!check.CategoryId || !Number(check.Amount)) {
      setCheckResult({ allowed: false, status: 'invalid', message: 'Chọn danh mục và nhập số tiền cần chi' });
      return;
    }
    setChecking(true);
    try {
      const res = await budgetApi.check({
        CategoryId: Number(check.CategoryId),
        Amount: Number(check.Amount),
        Date: check.Date,
      });
      setCheckResult(res);
    } catch (err) {
      setCheckResult({ allowed: false, status: 'invalid', message: getErrorMessage(err) });
    } finally {
      setChecking(false);
    }
  };

  const checkStyle = !checkResult
    ? ''
    : !checkResult.allowed
      ? 'bg-rose-50 border-rose-200 text-rose-700'
      : checkResult.status === 'warning'
        ? 'bg-amber-50 border-amber-200 text-amber-700'
        : 'bg-emerald-50 border-emerald-200 text-emerald-700';

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Hạn Mức Chi Tiêu (Budget)</h2>
          <p className="text-sm text-slate-500">Đặt hạn mức cho từng danh mục chi. Hệ thống cảnh báo khi dùng ≥ 80% và chặn khi vượt hạn mức.</p>
        </div>
        <button type="button" onClick={openCreate} className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-sm shrink-0">
          <i className="fa-solid fa-plus mr-1.5"></i> Thiết lập ngân sách
        </button>
      </div>

      <BudgetAlerts alerts={alerts} />

      {error && (
        <div role="alert" className="px-4 py-3 rounded-xl border bg-rose-50 text-rose-700 border-rose-200 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button type="button" onClick={load} className="font-bold underline">Thử lại</button>
        </div>
      )}

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit text-sm font-semibold">
        {[['active', 'Đang áp dụng'], ['all', 'Tất cả']].map(([k, label]) => (
          <button
            key={k} type="button" onClick={() => setFilter(k)}
            className={`px-4 py-1.5 rounded-lg ${filter === k ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-44 rounded-2xl bg-slate-200 animate-pulse" />)}
        </div>
      ) : visibleBudgets.length === 0 && !error ? (
        <div className="text-center py-14 bg-white rounded-2xl border border-dashed border-slate-300">
          <i className="fa-solid fa-bullseye text-4xl text-slate-300"></i>
          <p className="mt-3 font-semibold text-slate-600">
            {filter === 'active' ? 'Chưa có ngân sách nào đang áp dụng' : 'Bạn chưa thiết lập ngân sách nào'}
          </p>
          <button type="button" onClick={openCreate} className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold">+ Thiết lập ngân sách</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleBudgets.map((b) => {
            const st = BUDGET_STATUS[b.Status];
            return (
              <div key={b.BudgetId} className={`group p-5 bg-white rounded-2xl border shadow-sm space-y-3 ${b.Status === 'exceeded' ? 'border-rose-300' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                      <i className={`fa-solid ${categoryIcon(b.CategoryIcon)}`}></i>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{b.CategoryName}</h4>
                      <p className="text-[11px] text-slate-400">{formatDate(b.StartDate)} – {formatDate(b.EndDate)}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-60 group-hover:opacity-100">
                    <button type="button" onClick={() => openEdit(b)} title="Sửa" className="p-1.5 text-slate-500 hover:text-blue-600">
                      <i className="fa-solid fa-pen text-xs"></i>
                    </button>
                    <button type="button" onClick={() => setDeleting(b)} title="Xoá" className="p-1.5 text-slate-500 hover:text-rose-600">
                      <i className="fa-solid fa-trash text-xs"></i>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-slate-700">{formatVND(b.Spent)}</span>
                    <span className="text-slate-400">/ {formatVND(b.AmountLimit)}</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={b.Percent} aria-valuemin={0} aria-valuemax={100}>
                    <div className={`h-full rounded-full ${st.bar}`} style={{ width: `${Math.min(b.Percent, 100)}%` }} />
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className={`px-2 py-0.5 rounded-full font-bold ${st.badge}`}>{st.label} · {b.Percent}%</span>
                  <span className={b.Remaining < 0 ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                    {b.Remaining < 0 ? `Vượt ${formatVND(-b.Remaining)}` : `Còn ${formatVND(b.Remaining)}`}
                  </span>
                </div>
                {!b.IsActive && <p className="text-[11px] text-slate-400 italic">Ngoài thời gian áp dụng</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Kiểm tra khoản chi trước khi chi — minh hoạ logic chặn vượt hạn mức */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800">
          <i className="fa-solid fa-shield-halved text-rose-600 mr-2"></i>Kiểm tra trước khi chi
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">Nhập khoản chi dự định để xem có vượt hạn mức không. Khi tạo giao dịch, backend dùng cùng logic này để chặn.</p>
        <form onSubmit={handleCheck} className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-2 text-sm">
          <select
            value={check.CategoryId} onChange={(e) => { setCheck({ ...check, CategoryId: e.target.value }); setCheckResult(null); }}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
          >
            <option value="">— Danh mục chi —</option>
            {expenseCategories.map((c) => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
          </select>
          <input
            type="number" min="0" step="1000" placeholder="Số tiền" value={check.Amount}
            onChange={(e) => { setCheck({ ...check, Amount: e.target.value }); setCheckResult(null); }}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
          />
          <input
            type="date" value={check.Date} onChange={(e) => { setCheck({ ...check, Date: e.target.value }); setCheckResult(null); }}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
          />
          <button type="submit" disabled={checking} className="py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-60 text-white rounded-xl font-bold">
            {checking ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Kiểm tra'}
          </button>
        </form>
        {checkResult && (
          <div className={`mt-3 px-4 py-3 rounded-xl border text-sm ${checkStyle}`}>
            <b>{checkResult.allowed ? (checkResult.status === 'warning' ? '⚠️ Được phép, nhưng cần lưu ý' : '✅ Được phép chi') : '⛔ Bị chặn'}</b>
            <p className="mt-0.5">{checkResult.message}</p>
          </div>
        )}
      </div>

      {/* Modal thiết lập ngân sách */}
      <Modal open={modalOpen} title={editing ? 'Sửa ngân sách' : 'Thiết lập ngân sách'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSave} className="space-y-3 text-sm" noValidate>
          {formError && <div className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 text-xs whitespace-pre-line">{formError}</div>}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Danh mục chi</label>
            <select
              value={form.CategoryId} onChange={(e) => setForm({ ...form, CategoryId: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="">— Chọn danh mục —</option>
              {expenseCategories.map((c) => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
            </select>
            {expenseCategories.length === 0 && <p className="text-[11px] text-amber-600 mt-1">Chưa có danh mục chi nào. Hãy tạo danh mục trước.</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Hạn mức (VND)</label>
            <input
              type="number" min="1000" step="10000" inputMode="numeric" value={form.AmountLimit}
              onChange={(e) => setForm({ ...form, AmountLimit: e.target.value })}
              placeholder="VD: 3000000"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            {Number(form.AmountLimit) > 0 && <p className="text-[11px] text-slate-500 mt-1">= {formatVND(form.AmountLimit)}</p>}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-600">Thời gian áp dụng</label>
              <div className="flex gap-1">
                <button type="button" onClick={() => applyPreset(0)} className="px-2 py-0.5 text-[11px] rounded-md bg-slate-100 hover:bg-slate-200">Tháng này</button>
                <button type="button" onClick={() => applyPreset(1)} className="px-2 py-0.5 text-[11px] rounded-md bg-slate-100 hover:bg-slate-200">Tháng sau</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={form.StartDate} onChange={(e) => setForm({ ...form, StartDate: e.target.value })} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
              <input type="date" value={form.EndDate} min={form.StartDate} onChange={(e) => setForm({ ...form, EndDate: e.target.value })} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold">Huỷ</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-xl font-bold">
              {saving ? <i className="fa-solid fa-spinner fa-spin"></i> : editing ? 'Lưu thay đổi' : 'Lưu ngân sách'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Xoá ngân sách"
        message={deleting ? `Xoá ngân sách "${deleting.CategoryName}" (${formatDate(deleting.StartDate)} – ${formatDate(deleting.EndDate)})?` : ''}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
