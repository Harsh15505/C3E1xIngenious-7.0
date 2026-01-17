import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type RiskTrendChartProps = {
  data: Array<{
    timestamp: string;
    risk_score: number;
  }>;
};

export default function RiskTrendChart({ data }: RiskTrendChartProps) {
  // Transform data for recharts
  const chartData = data.map(item => ({
    time: new Date(item.timestamp).toLocaleDateString(),
    risk: (item.risk_score * 100).toFixed(1)
  }));

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Score Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            label={{ value: 'Risk %', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="risk" 
            stroke="#f97316" 
            strokeWidth={2}
            dot={{ fill: '#f97316', r: 4 }}
            activeDot={{ r: 6 }}
            name="Risk Score"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
