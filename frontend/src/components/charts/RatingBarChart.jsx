import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function RatingBarChart({ ratings = {} }) {
  const data = [
    { category: 'Teaching', score: ratings.teaching_quality || 0 },
    { category: 'Knowledge', score: ratings.subject_knowledge || 0 },
    { category: 'Communication', score: ratings.communication || 0 },
    { category: 'Doubts', score: ratings.doubt_clarification || 0 },
    { category: 'Interaction', score: ratings.classroom_interaction || 0 },
    { category: 'Punctuality', score: ratings.punctuality || 0 },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2.5 rounded-lg shadow-lg border border-slate-100 text-xs">
          <p className="font-semibold text-slate-800">{payload[0].payload.category}</p>
          <p className="text-sky-600 font-bold">Avg Rating: {payload[0].value} / 5.0 ⭐</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis
            dataKey="category"
            tick={{ fontSize: 11, fill: '#64748B' }}
            interval={0}
            angle={-20}
            textAnchor="end"
          />
          <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: '#64748B' }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="score" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => {
              let color = '#38BDF8';
              if (entry.score >= 4.0) color = '#10B981';
              else if (entry.score >= 3.0) color = '#0284C7';
              else if (entry.score >= 2.0) color = '#F59E0B';
              else if (entry.score > 0) color = '#EF4444';
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
