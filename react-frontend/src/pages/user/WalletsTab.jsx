import { useCallback, useEffect, useMemo, useState } from 'react';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { walletApi, WALLET_TYPES, walletTypeOf } from '../../api/walletApi';
import { getErrorMessage } from '../../api/axiosClient';
import { formatMoney } from '../../utils/format';

const EMPTY_FORM = { AccountName: '', AccountType: 'Cash', Balance: '', Currency: 'VND' };

/** Tab "Ví & Tài khoản": danh sách ví + thêm / sửa / xoá */
export default function WalletsTab({ onChanged }) {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // ví đang sửa, null = thêm mới
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setWallets(await walletApi.list());
    } catch (e) {
      setError(getErrorMessage(e, 'Không tải được danh sách ví'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Tổng số dư theo từng loại tiền
  const totals = useMemo(() => {
    const t = {};
    wallets.forEach((w) => {
      t[w.Currency || 'VND'] = (t[w.Currency || 'VND'] ?? 0) + Number(w.Balance);
    });
    return t;
  }, [wallets]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (w) => {
    setEditing(w);
    setForm({ AccountName: w.AccountName, AccountType: w.AccountType || 'Other', Balance: String(w.Balance), Currency: w.Currency || 'VND' });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const name = form.AccountName.trim();
    const balance = form.Balance === '' ? 0 : Number(form.Balance);
    if (!name) return setFormError('Vui lòng nhập tên ví');
    if (Number.isNaN(balance) || balance < 0) return setFormError('Số dư phải là số không âm');

    const payload = { AccountName: name, AccountType: form.AccountType, Balance: balance, Currency: form.Currency };
    setSaving(true);
    setFormError('');
    try {
      if (editing) await walletApi.update(editing.AccountId, payload);
      else await walletApi.create(payload);
      setModalOpen(false);
      await load();
      onChanged?.();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Lưu ví thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await walletApi.remove(deleting.AccountId);
      setDeleting(null);
      await load();
      onChanged?.();
    } catch (err) {
      setError(getErrorMessage(err, 'Xoá ví thất bại'));
      setDeleting(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Ví & Nguồn Tiền</h2>
          <p className="text-sm text-slate-500">Quản lý tiền mặt, tài khoản ngân hàng, thẻ và ví điện tử của bạn.</p>
        </div>
        <button type="button" onClick={openCreate} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm">
          <i className="fa-solid fa-plus mr-1.5"></i> Thêm ví
        </button>
      </div>

      {/* Tổng số dư */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 rounded-2xl text-white shadow-lg flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase text-blue-100">Tổng số dư</p>
          {Object.keys(totals).length === 0 ? (
            <p className="text-3xl font-black mt-1">{formatMoney(0)}</p>
          ) : (
            Object.entries(totals).map(([cur, sum]) => (
              <p key={cur} className="text-3xl font-black mt-1">{formatMoney(sum, cur)}</p>
            ))
          )}
        </div>
        <p className="text-sm text-blue-100">{wallets.length} ví</p>
      </div>

      {error && (
        <div role="alert" className="px-4 py-3 rounded-xl border bg-rose-50 text-rose-700 border-rose-200 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button type="button" onClick={load} className="font-bold underline">Thử lại</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 rounded-2xl bg-slate-200 animate-pulse" />)}
        </div>
      ) : wallets.length === 0 && !error ? (
        <div className="text-center py-14 bg-white rounded-2xl border border-dashed border-slate-300">
          <i className="fa-solid fa-wallet text-4xl text-slate-300"></i>
          <p className="mt-3 font-semibold text-slate-600">Bạn chưa có ví nào</p>
          <p className="text-sm text-slate-400">Tạo ví đầu tiên để bắt đầu ghi chép thu chi.</p>
          <button type="button" onClick={openCreate} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold">+ Tạo ví</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {wallets.map((w) => {
            const type = walletTypeOf(w.AccountType);
            return (
              <div key={w.AccountId} className="group p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-44 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type.color}`}>
                      <i className={`fa-solid ${type.icon}`}></i>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 leading-tight">{w.AccountName}</p>
                      <p className="text-[11px] font-bold uppercase text-slate-400">{type.label}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-60 group-hover:opacity-100">
                    <button type="button" onClick={() => openEdit(w)} title="Sửa ví" className="p-1.5 text-slate-500 hover:text-blue-600">
                      <i className="fa-solid fa-pen text-xs"></i>
                    </button>
                    <button type="button" onClick={() => setDeleting(w)} title="Xoá ví" className="p-1.5 text-slate-500 hover:text-rose-600">
                      <i className="fa-solid fa-trash text-xs"></i>
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Số dư</p>
                  <h3 className="text-2xl font-black text-slate-800">{formatMoney(w.Balance, w.Currency)}</h3>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal thêm / sửa ví */}
      <Modal open={modalOpen} title={editing ? 'Sửa ví' : 'Thêm ví mới'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSave} className="space-y-3 text-sm" noValidate>
          {formError && <div className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 text-xs whitespace-pre-line">{formError}</div>}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Tên ví</label>
            <input
              type="text" maxLength={100} autoFocus value={form.AccountName}
              onChange={(e) => setForm({ ...form, AccountName: e.target.value })}
              placeholder="VD: Ví tiền mặt, Vietcombank..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Loại ví</label>
            <div className="grid grid-cols-3 gap-2">
              {WALLET_TYPES.map((t) => (
                <button
                  key={t.value} type="button" onClick={() => setForm({ ...form, AccountType: t.value })}
                  className={`p-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 ${form.AccountType === t.value ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  <i className={`fa-solid ${t.icon}`}></i>{t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">{editing ? 'Số dư' : 'Số dư ban đầu'}</label>
              <input
                type="number" min="0" step="1000" inputMode="numeric" value={form.Balance}
                onChange={(e) => setForm({ ...form, Balance: e.target.value })}
                placeholder="0"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tiền tệ</label>
              <select
                value={form.Currency} onChange={(e) => setForm({ ...form, Currency: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="VND">VND</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold">Huỷ</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl font-bold">
              {saving ? <i className="fa-solid fa-spinner fa-spin"></i> : editing ? 'Lưu thay đổi' : 'Tạo ví'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Xoá ví"
        message={deleting ? `Xoá ví "${deleting.AccountName}"?\nToàn bộ giao dịch thuộc ví này cũng sẽ bị xoá và không thể khôi phục.` : ''}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
