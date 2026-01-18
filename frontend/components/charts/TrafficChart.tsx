import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type TrafficChartProps = {
  data: Array<{
    zone: string;
    congestion: number;
  }>;
};

export default function TrafficChart({ data }: TrafficChartProps) {
  const chartData = data.map(item => {
    const rawValue = typeof item.congestion === 'string'
      ? Number(item.congestion)
      : item.congestion;
    const percent = rawValue <= 1 ? rawValue * 100 : rawValue;
    return {
      zone: item.zone.charAt(0).toUpperCase() + item.zone.slice(1),
      congestion: Number.isFinite(percent) ? Number(percent.toFixed(0)) : 0
    };
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Congestion by Zone</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis 
            dataKey="zone" 
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            label={{ value: 'Congestion %', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Bar 
            dataKey="congestion" 
            fill="#3b82f6" 
            radius={[4, 4, 0, 0]} 
            name="Congestion (%)"
            animationDuration={700}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
