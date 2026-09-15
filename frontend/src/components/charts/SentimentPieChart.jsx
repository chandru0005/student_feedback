import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function SentimentPieChart({ data = [] }) {
  const COLORS = {
    Positive: '#10B981',
    Neutral: '#F59E0B',
    Negative: '#EF4444'
  };

  const chartData = data.filter(d => d.count > 0);

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400">
        <p className="text-sm">No sentiment data available</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white p-2.5 rounded-lg shadow-lg border border-slate-100 text-xs">
          <p className="font-semibold text-slate-800">{item.name}</p>
          <p className="text-slate-600">Submissions: <span className="font-bold">{item.count}</span></p>
          {item.percentage !== undefined && (
            <p className="text-slate-500">{item.percentage}% of total</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={4}
            dataKey="count"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#94A3B8'} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-xs text-slate-700 font-medium">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
