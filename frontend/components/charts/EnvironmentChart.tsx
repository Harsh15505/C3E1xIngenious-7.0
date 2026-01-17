import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type EnvironmentChartProps = {
  data: Array<{
    timestamp: string;
    temperature: number;
    aqi: number;
  }>;
};

export default function EnvironmentChart({ data }: EnvironmentChartProps) {
  // Transform and limit data
  const chartData = data
    .filter(item => typeof item.temperature === 'number' && typeof item.aqi === 'number')
    .slice(-24)
    .map(item => ({
      time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temp: Number(item.temperature.toFixed(1)),
      aqi: item.aqi
    }));

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Temperature & AQI (Last 24 Hours)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 10 }}
            stroke="#6b7280"
          />
          <YAxis 
            yAxisId="left"
            tick={{ fontSize: 12 }}
            stroke="#f97316"
            label={{ value: 'Temp °C', angle: -90, position: 'insideLeft' }}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right"
            tick={{ fontSize: 12 }}
            stroke="#ef4444"
            label={{ value: 'AQI', angle: 90, position: 'insideRight' }}
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
            yAxisId="left"
            type="monotone" 
            dataKey="temp" 
            stroke="#f97316" 
            strokeWidth={2}
            dot={false}
            name="Temperature (°C)"
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="aqi" 
            stroke="#ef4444" 
            strokeWidth={2}
            dot={false}
            name="AQI"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
