"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { FundMetrics } from "@/lib/types";

interface Props {
  fundName: string;
  metrics: FundMetrics[];
}

const METRIC_DEFS = [
  { key: "tvpi", label: "TVPI", format: "ratio" },
  { key: "dpi", label: "DPI", format: "ratio" },
  { key: "moic", label: "MOIC", format: "ratio" },
  { key: "irr", label: "IRR (%)", format: "percent" },
  { key: "fund_size", label: "Fund Size", format: "money" },
  { key: "capital_called", label: "Capital Called", format: "money" },
  { key: "invested_capital", label: "Invested Capital", format: "money" },
  {
    key: "capital_distributed",
    label: "Capital Distributed",
    format: "money",
  },
  { key: "dry_powder", label: "Dry Powder", format: "money" },
  { key: "num_investments", label: "# Investments", format: "int" },
  { key: "primary_investments", label: "# Primary", format: "int" },
  { key: "follow_on_investments", label: "# Follow-on", format: "int" },
  { key: "median_initial_check", label: "Med. Check", format: "money" },
  {
    key: "median_initial_valuation",
    label: "Med. Valuation",
    format: "money",
  },
] as const;

const TABLE_ROWS: { key: string; label: string; format: string }[] = [
  { key: "as_of_date", label: "As of", format: "date" },
  ...METRIC_DEFS,
];

function formatValue(value: unknown, format: string): string {
  if (value == null) return "—";
  if (format === "date") {
    return new Date(String(value)).toLocaleDateString();
  }
  const n = Number(value);
  if (format === "ratio") return n.toFixed(2);
  if (format === "percent") return `${n.toFixed(1)}%`;
  if (format === "int") return String(Math.round(n));
  if (format === "money") {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
    return `$${n.toLocaleString()}`;
  }
  return String(value);
}

export function FundStats({ fundName, metrics }: Props) {
  const [selectedMetric, setSelectedMetric] = useState("tvpi");

  const chartData = metrics.map((m) => ({
    label: `Q${m.quarter} ${m.year}`,
    value: m[selectedMetric as keyof FundMetrics] as number | null,
  }));

  return (
    <div className="py-8">
      <h1 className="text-4xl font-light tracking-tight text-center mb-10">
        {fundName}
      </h1>

      {/* Chart */}
      <div className="mb-10">
        <div className="flex justify-center mb-4">
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="text-sm border border-gray-200 px-3 py-1 bg-white"
          >
            {METRIC_DEFS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#000"
              dot={{ r: 3 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Metrics Table */}
      {metrics.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">
          No metrics data available.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left border p-2 font-medium bg-gray-50">
                  Metric
                </th>
                {metrics.map((m) => (
                  <th
                    key={m.id}
                    className="text-right border p-2 font-medium bg-gray-50"
                  >
                    Q{m.quarter} {m.year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TABLE_ROWS.map((row) => (
                <tr key={row.key}>
                  <td className="border p-2 font-medium">{row.label}</td>
                  {metrics.map((m) => (
                    <td key={m.id} className="border p-2 text-right">
                      {formatValue(
                        m[row.key as keyof FundMetrics],
                        row.format
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
