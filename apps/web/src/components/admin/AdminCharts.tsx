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
      <div className="flex h-56 w-full items-center justify-center rounded-none border border-[var(--border)] bg-[var(--bg-surface)] p-6 text-center font-mono text-xs tracking-wider text-[var(--text-muted)] uppercase">
        No revenue transactions recorded in this interval
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 100);
  const chartHeight = 180;
  const paddingX = 40;
  const paddingY = 20;

  return (
    <div className="relative rounded-none border border-[var(--border)] bg-[var(--bg-surface)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-mono text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
            Revenue Trajectory
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-[var(--text-muted)]">
            Daily consolidated revenue & order throughput
          </p>
        </div>
        {hovered && (
          <div className="rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 font-mono text-xs shadow-sm">
            <span className="text-[var(--text-secondary)]">{hovered.date}: </span>
            <span className="font-bold text-[var(--text-primary)] dark:text-[#e8ff00]">
              ₹{hovered.revenue.toLocaleString('en-IN')}
            </span>
            <span className="ml-1.5 text-[var(--text-muted)]">({hovered.orders} orders)</span>
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
                  stroke="currentColor"
                  className="text-[var(--border)]"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-[var(--text-muted)] font-mono text-[9px]"
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
                  className={
                    isHovered
                      ? 'fill-[#0a0a0a] dark:fill-[#e8ff00]'
                      : 'fill-[var(--text-secondary)] opacity-80 hover:opacity-100'
                  }
                  rx="0"
                />
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + paddingY + 14}
                  textAnchor="middle"
                  className="fill-[var(--text-muted)] font-mono text-[9px]"
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
  shipped: '#38bdf8', // Sky blue
  processing: '#e8ff00', // Volt yellow
  confirmed: '#f59e0b', // Amber
  pending: '#a0a0a0', // Gray
  cancelled: '#ff3b3b', // Red
};

export function OrderStatusDonutChart({ data }: { data: StatusBreakdown[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <div className="flex h-56 w-full items-center justify-center rounded-none border border-[var(--border)] bg-[var(--bg-surface)] p-6 text-center font-mono text-xs tracking-wider text-[var(--text-muted)] uppercase">
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
    <div className="rounded-none border border-[var(--border)] bg-[var(--bg-surface)] p-5">
      <h3 className="mb-4 font-mono text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
        Order Status Breakdown
      </h3>

      <div className="flex flex-col items-center justify-around gap-6 sm:flex-row">
        <div className="relative flex h-40 w-40 items-center justify-center">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="currentColor"
              className="text-[var(--border)]"
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
            <span className="font-mono text-xl font-bold text-[var(--text-primary)]">{total}</span>
            <span className="font-mono text-[9px] tracking-wider text-[var(--text-muted)] uppercase">
              Orders
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="w-full max-w-[180px] space-y-2">
          {data.map((item) => {
            const color = STATUS_COLORS[item.status.toLowerCase()] || '#a0a0a0';
            const pct = Math.round((item.count / total) * 100);
            return (
              <div
                key={item.status}
                className="flex items-center justify-between font-mono text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[var(--text-secondary)] capitalize">{item.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[var(--text-primary)]">{item.count}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">({pct}%)</span>
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
      <div className="flex h-56 w-full items-center justify-center rounded-none border border-[var(--border)] bg-[var(--bg-surface)] p-6 text-center font-mono text-xs tracking-wider text-[var(--text-muted)] uppercase">
        No item sales recorded yet
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="rounded-none border border-[var(--border)] bg-[var(--bg-surface)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-mono text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
          Top Selling Velocity
        </h3>
        <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase">
          Units & Revenue
        </span>
      </div>

      <div className="space-y-3.5">
        {data.map((prod, idx) => {
          const widthPct = Math.max(6, Math.round((prod.revenue / maxRevenue) * 100));
          return (
            <div key={prod.id || idx} className="space-y-1">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="max-w-[200px] truncate pr-2 font-medium text-[var(--text-primary)] sm:max-w-[260px]">
                  {prod.name}
                </span>
                <div className="flex items-center gap-3 text-right">
                  <span className="text-[11px] text-[var(--text-muted)]">{prod.quantity} sold</span>
                  <span className="font-bold text-[var(--text-primary)] dark:text-[#e8ff00]">
                    ₹{prod.revenue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-none border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                <div
                  className="h-full bg-[var(--text-primary)] transition-[width] duration-300 dark:bg-white"
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
