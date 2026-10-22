'use client';

import React, { useState } from 'react';

// ============================================================================
// 1. REVENUE OVER TIME CHART (Responsive SVG Bar / Line Chart)
// ============================================================================
interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}

export function RevenueTimelineChart({ data }: { data: RevenuePoint[] }) {
  const [hovered, setHovered] = useState<RevenuePoint | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-56 w-full items-center justify-center rounded border border-[#1f1f1f] bg-[#111111] p-6 text-center font-mono text-xs uppercase tracking-wider text-[#71717a]">
        No revenue transactions recorded in this interval
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 100);
  const chartHeight = 180;
  const paddingX = 40;
  const paddingY = 20;

  return (
    <div className="relative rounded border border-[#1f1f1f] bg-[#111111] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#f5f5f5]">
            Revenue Trajectory
          </h3>
          <p className="font-mono text-[11px] text-[#71717a] mt-0.5">
            Daily consolidated revenue & order throughput
          </p>
        </div>
        {hovered && (
          <div className="rounded border border-[#e8ff00]/40 bg-[#181818] px-2.5 py-1 font-mono text-xs">
            <span className="text-[#a0a0a0]">{hovered.date}: </span>
            <span className="font-bold text-[#e8ff00]">₹{hovered.revenue.toLocaleString('en-IN')}</span>
            <span className="text-[#71717a] ml-1.5">({hovered.orders} orders)</span>
          </div>
        )}
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${Math.max(600, data.length * 48)} ${chartHeight + paddingY * 2}`}
          className="w-full min-w-[500px] overflow-visible"
          role="img"
          aria-label="Revenue over time chart"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = paddingY + chartHeight * (1 - pct);
            const val = Math.round(maxRevenue * pct);
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={Math.max(600, data.length * 48) - 10}
                  y2={y}
                  stroke="#1f1f1f"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-[#52525b] font-mono text-[9px]"
                >
                  ₹{val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((d, idx) => {
            const barWidth = 22;
            const usableWidth = Math.max(600, data.length * 48) - paddingX - 20;
            const step = usableWidth / data.length;
            const x = paddingX + idx * step + (step - barWidth) / 2;
            const barHeight = Math.max(4, (d.revenue / maxRevenue) * chartHeight);
            const y = paddingY + (chartHeight - barHeight);
            const isHovered = hovered?.date === d.date;

            return (
              <g
                key={d.date}
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => setHovered(d)}
                onMouseLeave={() => setHovered(null)}
              >
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={isHovered ? '#e8ff00' : '#ffffff'}
                  opacity={isHovered ? 1 : 0.85}
                  rx="1"
                />
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + paddingY + 14}
                  textAnchor="middle"
                  className="fill-[#71717a] font-mono text-[9px]"
                >
                  {d.date.slice(5)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ============================================================================
// 2. ORDER STATUS DISTRIBUTION (Accessible Donut Chart)
// ============================================================================
interface StatusBreakdown {
  status: string;
  count: number;
}

const STATUS_COLORS: Record<string, string> = {
  delivered: '#22c55e', // Green
  shipped: '#38bdf8',   // Sky blue
  processing: '#e8ff00',// Volt yellow
  confirmed: '#f59e0b', // Amber
  pending: '#a0a0a0',   // Gray
  cancelled: '#ff3b3b', // Red
};

export function OrderStatusDonutChart({ data }: { data: StatusBreakdown[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <div className="flex h-56 w-full items-center justify-center rounded border border-[#1f1f1f] bg-[#111111] p-6 text-center font-mono text-xs uppercase tracking-wider text-[#71717a]">
        No active orders recorded
      </div>
    );
  }

  // Calculate SVG arc paths
  const radius = 55;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;
  let accumulatedAngle = 0;

  return (
    <div className="rounded border border-[#1f1f1f] bg-[#111111] p-5">
      <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#f5f5f5] mb-4">
        Order Status Breakdown
      </h3>

      <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
        <div className="relative flex h-40 w-40 items-center justify-center">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="#1f1f1f"
              strokeWidth={strokeWidth}
            />
            {data.map((item) => {
              const fraction = item.count / total;
              const strokeDasharray = `${fraction * circumference} ${circumference}`;
              const strokeDashoffset = -accumulatedAngle * circumference;
              accumulatedAngle += fraction;
              const color = STATUS_COLORS[item.status.toLowerCase()] || '#a0a0a0';

              return (
                <circle
                  key={item.status}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-[stroke-dasharray] duration-300"
                />
              );
            })}
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="font-mono text-xl font-bold text-[#f5f5f5]">{total}</span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#71717a]">Orders</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 w-full max-w-[180px]">
          {data.map((item) => {
            const color = STATUS_COLORS[item.status.toLowerCase()] || '#a0a0a0';
            const pct = Math.round((item.count / total) * 100);
            return (
              <div key={item.status} className="flex items-center justify-between font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="capitalize text-[#a0a0a0]">{item.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#f5f5f5]">{item.count}</span>
                  <span className="text-[10px] text-[#52525b]">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. TOP SELLING PRODUCTS (Horizontal Bar Chart)
// ============================================================================
interface TopProduct {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
}

export function TopProductsChart({ data }: { data: TopProduct[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-56 w-full items-center justify-center rounded border border-[#1f1f1f] bg-[#111111] p-6 text-center font-mono text-xs uppercase tracking-wider text-[#71717a]">
        No item sales recorded yet
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="rounded border border-[#1f1f1f] bg-[#111111] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#f5f5f5]">
          Top Selling Velocity
        </h3>
        <span className="font-mono text-[10px] uppercase text-[#71717a]">Units & Revenue</span>
      </div>

      <div className="space-y-3.5">
        {data.map((prod, idx) => {
          const widthPct = Math.max(6, Math.round((prod.revenue / maxRevenue) * 100));
          return (
            <div key={prod.id || idx} className="space-y-1">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="truncate pr-2 font-medium text-[#f5f5f5] max-w-[200px] sm:max-w-[260px]">
                  {prod.name}
                </span>
                <div className="flex items-center gap-3 text-right">
                  <span className="text-[11px] text-[#71717a]">{prod.quantity} sold</span>
                  <span className="font-bold text-[#e8ff00]">₹{prod.revenue.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="h-2 w-full rounded-none bg-[#181818] overflow-hidden">
                <div
                  className="h-full bg-[#ffffff] transition-[width] duration-300"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
