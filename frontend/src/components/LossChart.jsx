import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export default function LossChart({ history, title = "Training Loss Curve" }) {
  if (!history || !Array.isArray(history) || history.length === 0) {
    return (
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 text-center text-slate-500 text-xs font-mono">
        No training history recorded yet. Run model training to view live loss graph.
      </div>
    );
  }

  // Format data for chart
  const chartData = history.map((item, idx) => {
    const epoch = item.epoch || idx + 1;
    const loss = item.loss !== undefined ? item.loss : item.average_loss !== undefined ? item.average_loss : 0;
    const prob = item.probability !== undefined ? item.probability : null;

    return {
      epoch,
      Loss: parseFloat(loss.toFixed(6)),
      ...(prob !== null ? { Probability: parseFloat(prob.toFixed(4)) } : {}),
    };
  });

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
          <span>📊 {title}</span>
        </h4>
        <span className="text-xs text-slate-400 font-mono">
          Total Epochs: {history.length}
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis dataKey="epoch" stroke="#94a3b8" tick={{ fontSize: 11 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#f8fafc',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
            <Line
              type="monotone"
              dataKey="Loss"
              stroke="#818cf8"
              strokeWidth={2.5}
              dot={{ fill: '#818cf8', r: 3 }}
              activeDot={{ r: 6 }}
            />
            {chartData[0].Probability !== undefined && (
              <Line
                type="monotone"
                dataKey="Probability"
                stroke="#34d399"
                strokeWidth={2}
                dot={{ fill: '#34d399', r: 2 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
