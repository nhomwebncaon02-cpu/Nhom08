import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

/** [Admin] Người dùng mới (cột) + số giao dịch (đường) theo tháng */
export default function AdminActivityChart({ data, height = 300 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis yAxisId="left" allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={36} />
        <YAxis yAxisId="right" orientation="right" allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={36} />
        <Tooltip />
        <Legend iconType="circle" />
        <Bar yAxisId="left" dataKey="newUsers" name="Người dùng mới" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={32} />
        <Line yAxisId="right" type="monotone" dataKey="transactions" name="Giao dịch" stroke="#059669" strokeWidth={2.5} dot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
