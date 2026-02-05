"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InlineCell } from "@/components/admin/inline-cells";
import { getMetrics, updateMetric, addQuarter } from "@/lib/actions/metrics";
import type { Fund, FundMetrics } from "@/lib/types";

const METRIC_DEFS = [
  { key: "tvpi", label: "TVPI" },
  { key: "dpi", label: "DPI" },
  { key: "moic", label: "MOIC" },
  { key: "irr", label: "IRR" },
  { key: "fund_size", label: "Fund Size" },
  { key: "capital_called", label: "Capital Called" },
  { key: "invested_capital", label: "Invested Capital" },
  { key: "capital_distributed", label: "Capital Distributed" },
  { key: "dry_powder", label: "Dry Powder" },
  { key: "num_investments", label: "# Investments" },
  { key: "primary_investments", label: "# Primary" },
  { key: "follow_on_investments", label: "# Follow-on" },
  { key: "median_initial_check", label: "Median Check" },
  { key: "median_initial_valuation", label: "Median Valuation" },
];

function getNextQuarter(metrics: FundMetrics[]) {
  if (metrics.length === 0)
    return { quarter: 1, year: new Date().getFullYear() };
  const last = metrics[metrics.length - 1];
  return last.quarter === 4
    ? { quarter: 1, year: last.year + 1 }
    : { quarter: last.quarter + 1, year: last.year };
}

interface Props {
  funds: Fund[];
  initialMetrics: FundMetrics[];
  initialFundId: string;
}

export function MetricsSheet({
  funds,
  initialMetrics,
  initialFundId,
}: Props) {
  const [selectedFundId, setSelectedFundId] = useState(initialFundId);
  const [metrics, setMetrics] = useState<FundMetrics[]>(initialMetrics);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = getNextQuarter(metrics);
  const [newQuarter, setNewQuarter] = useState(next.quarter);
  const [newYear, setNewYear] = useState(next.year);

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleFundChange = async (fundId: string) => {
    setSelectedFundId(fundId);
    setLoading(true);
    const data = await getMetrics(fundId);
    setMetrics(data);
    setLoading(false);
  };

  const handleCellSave = async (
    metricId: string,
    field: string,
    value: string
  ) => {
    await updateMetric(metricId, field, value);
    setMetrics((prev) =>
      prev.map((m) =>
        m.id === metricId
          ? { ...m, [field]: value === "" ? null : Number(value) }
          : m
      )
    );
    showSaved();
  };

  const handleAddQuarter = async () => {
    setError(null);
    try {
      const newMetric = await addQuarter(selectedFundId, newQuarter, newYear);
      setMetrics([...metrics, newMetric]);
      setAddOpen(false);
      showSaved();
      // Advance defaults for next time
      const advanced =
        newQuarter === 4
          ? { quarter: 1, year: newYear + 1 }
          : { quarter: newQuarter + 1, year: newYear };
      setNewQuarter(advanced.quarter);
      setNewYear(advanced.year);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add quarter");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Fund Metrics</h1>
        <div className="flex items-center gap-4">
          {saved && <span className="text-sm text-gray-500">Saved</span>}
          <Button onClick={() => setAddOpen(true)}>+ Add Quarter</Button>
        </div>
      </div>

      {/* Fund tabs */}
      <div className="flex gap-2 mb-4">
        {funds.map((fund) => (
          <button
            key={fund.id}
            onClick={() => handleFundChange(fund.id)}
            className={`text-sm px-3 py-1 border ${
              selectedFundId === fund.id
                ? "font-semibold border-black"
                : "border-gray-300"
            }`}
          >
            {fund.name}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {loading ? (
        <p className="text-sm">Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b">
                <th className="text-xs font-medium text-gray-500 pb-2 pr-4 min-w-[180px] sticky left-0 bg-white z-10">
                  Metric
                </th>
                {metrics.map((m) => (
                  <th
                    key={m.id}
                    className="text-xs font-medium text-gray-500 pb-2 px-3 min-w-[120px]"
                  >
                    Q{m.quarter} {m.year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRIC_DEFS.map(({ key, label }) => (
                <tr key={key} className="border-b border-gray-100">
                  <td className="text-sm py-3 pr-4 sticky left-0 bg-white">{label}</td>
                  {metrics.map((m) => (
                    <td key={m.id} className="px-2 py-2">
                      <InlineCell
                        value={
                          m[key as keyof FundMetrics] as number | null
                        }
                        type="number"
                        onSave={(val) => handleCellSave(m.id, key, val)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Quarter Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Quarter</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <div>
              <Label>Quarter</Label>
              <select
                className="mt-1 w-full border px-2 py-1 text-sm"
                value={newQuarter}
                onChange={(e) => setNewQuarter(Number(e.target.value))}
              >
                {[1, 2, 3, 4].map((q) => (
                  <option key={q} value={q}>
                    Q{q}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Year</Label>
              <select
                className="mt-1 w-full border px-2 py-1 text-sm"
                value={newYear}
                onChange={(e) => setNewYear(Number(e.target.value))}
              >
                {Array.from({ length: 11 }, (_, i) => 2020 + i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddQuarter}>Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
