import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { compactVND, formatVND } from '../../utils/format';

/** [Thành viên 4] Biểu đồ cột thu/chi theo tháng. data: [{ label, income, expense }] */
export default function IncomeExpenseChart({ data, height = 300 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis tickFormatter={compactVND} tickLine={false} axisLine={false} fontSize={12} width={56} />
        <Tooltip formatter={(v) => formatVND(v)} cursor={{ fill: 'rgba(15,23,42,0.04)' }} />
        <Legend iconType="circle" />
        <Bar dataKey="income" name="Thu" fill="#059669" radius={[6, 6, 0, 0]} maxBarSize={28} />
        <Bar dataKey="expense" name="Chi" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
