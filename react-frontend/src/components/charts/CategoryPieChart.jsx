import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatVND } from '../../utils/format';

export const PIE_COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#64748b'];

/** [Thành viên 4] Biểu đồ tròn chi tiêu theo danh mục. data: [{ name, total }] */
export default function CategoryPieChart({ data, height = 300 }) {
  // Gộp các danh mục nhỏ thành "Khác" để biểu đồ dễ đọc
  const top = data.slice(0, 7);
  const rest = data.slice(7).reduce((s, d) => s + d.total, 0);
  const chartData = rest > 0 ? [...top, { name: 'Khác', total: rest }] : top;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={chartData} dataKey="total" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2}>
          {chartData.map((entry, i) => (
            <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => formatVND(v)} />
        <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
