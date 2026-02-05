"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InlineCell, InlineSelect } from "@/components/admin/inline-cells";
import {
  addInvestment,
  updateInvestmentField,
  deleteInvestment,
} from "@/lib/actions/investments";
import type { Fund } from "@/lib/types";

const TYPE_OPTIONS = [
  { value: "safe", label: "SAFE" },
  { value: "equity", label: "Equity" },
];

const STAGE_OPTIONS = [
  { value: "initial", label: "Initial" },
  { value: "follow_on", label: "Follow-on" },
];

const ROLE_OPTIONS = [
  { value: "lead", label: "Lead" },
  { value: "co_lead", label: "Co-Lead" },
  { value: "follow", label: "Follow" },
];

interface Investment {
  id: string;
  company_id: string;
  fund_id: string;
  investment_date: string | null;
  investment_type: string | null;
  stage: string | null;
  amount: number | null;
  ownership_percentage: number | null;
  role: string | null;
  post_money_valuation: number | null;
  companies: { name: string } | null;
}

interface Company {
  id: string;
  name: string;
}

interface Props {
  initialData: Investment[];
  funds: Fund[];
  companies: Company[];
}

export function InvestmentsTable({
  initialData,
  funds,
  companies,
}: Props) {
  const [investments, setInvestments] = useState<Investment[]>(initialData);
  const [addOpen, setAddOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Reminder dialog: shows company name after save
  const [reminder, setReminder] = useState<string | null>(null);

  const [form, setForm] = useState({
    company_id: "",
    fund_id: "",
    investment_date: "",
    investment_type: "",
    stage: "",
    amount: "",
    ownership_percentage: "",
    role: "",
    post_money_valuation: "",
  });

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAdd = async () => {
    setError(null);
    try {
      const newInvestment = await addInvestment(form);
      setInvestments([newInvestment, ...investments]);
      setAddOpen(false);
      // Show reminder with company name
      const companyName =
        companies.find((c) => c.id === form.company_id)?.name ?? "this company";
      setReminder(companyName);
      setForm({
        company_id: "",
        fund_id: "",
        investment_date: "",
        investment_type: "",
        stage: "",
        amount: "",
        ownership_percentage: "",
        role: "",
        post_money_valuation: "",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add investment"
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInvestment(id);
      setInvestments(investments.filter((inv) => inv.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setDeleteConfirm(null);
    }
  };

  const handleFieldSave = async (id: string, field: string, value: string) => {
    await updateInvestmentField(id, field, value);
    setInvestments(
      investments.map((inv) =>
        inv.id === id ? { ...inv, [field]: value } : inv
      )
    );
    showSaved();
    // Show reminder
    const inv = investments.find((i) => i.id === id);
    if (inv) setReminder(inv.companies?.name ?? "this company");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Investments</h1>
        <div className="flex items-center gap-4">
          {saved && <span className="text-sm text-gray-500">Saved</span>}
          <Button onClick={() => setAddOpen(true)}>+ Add Row</Button>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b">
              {[
                "Company",
                "Fund",
                "Date",
                "Type",
                "Stage",
                "Amount",
                "Ownership %",
                "Role",
                "Post-Money",
              ].map((h) => (
                <th
                  key={h}
                  className="text-xs font-medium text-gray-500 pb-2 px-1"
                >
                  {h}
                </th>
              ))}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {investments.map((inv) => (
              <tr key={inv.id} className="border-b border-gray-100">
                {/* Company -- read only after creation */}
                <td className="px-1 text-sm">
                  {inv.companies?.name ?? "—"}
                </td>
                {/* Fund -- read only after creation */}
                <td className="px-1 text-sm">
                  {funds.find((f) => f.id === inv.fund_id)?.name ?? "—"}
                </td>
                <td className="px-0">
                  <InlineCell
                    value={inv.investment_date}
                    type="date"
                    onSave={(val) =>
                      handleFieldSave(inv.id, "investment_date", val)
                    }
                  />
                </td>
                <td className="px-0">
                  <InlineSelect
                    value={inv.investment_type}
                    options={TYPE_OPTIONS}
                    onSave={(val) =>
                      handleFieldSave(inv.id, "investment_type", val)
                    }
                  />
                </td>
                <td className="px-0">
                  <InlineSelect
                    value={inv.stage}
                    options={STAGE_OPTIONS}
                    onSave={(val) => handleFieldSave(inv.id, "stage", val)}
                  />
                </td>
                <td className="px-0">
                  <InlineCell
                    value={inv.amount}
                    type="number"
                    onSave={(val) => handleFieldSave(inv.id, "amount", val)}
                  />
                </td>
                <td className="px-0">
                  <InlineCell
                    value={inv.ownership_percentage}
                    type="number"
                    onSave={(val) =>
                      handleFieldSave(inv.id, "ownership_percentage", val)
                    }
                  />
                </td>
                <td className="px-0">
                  <InlineSelect
                    value={inv.role}
                    options={ROLE_OPTIONS}
                    onSave={(val) => handleFieldSave(inv.id, "role", val)}
                  />
                </td>
                <td className="px-0">
                  <InlineCell
                    value={inv.post_money_valuation}
                    type="number"
                    onSave={(val) =>
                      handleFieldSave(inv.id, "post_money_valuation", val)
                    }
                  />
                </td>
                <td className="px-1">
                  <button
                    onClick={() => setDeleteConfirm(inv.id)}
                    className="text-xs text-gray-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Investment Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Investment</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <div>
              <Label>Company</Label>
              <select
                className="mt-1 w-full border px-2 py-1 text-sm"
                value={form.company_id}
                onChange={(e) =>
                  setForm({ ...form, company_id: e.target.value })
                }
              >
                <option value="">Select company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Fund</Label>
              <select
                className="mt-1 w-full border px-2 py-1 text-sm"
                value={form.fund_id}
                onChange={(e) => setForm({ ...form, fund_id: e.target.value })}
              >
                <option value="">Select fund</option>
                {funds.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                className="mt-1"
                value={form.investment_date}
                onChange={(e) =>
                  setForm({ ...form, investment_date: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <select
                  className="mt-1 w-full border px-2 py-1 text-sm"
                  value={form.investment_type}
                  onChange={(e) =>
                    setForm({ ...form, investment_type: e.target.value })
                  }
                >
                  <option value="">—</option>
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Stage</Label>
                <select
                  className="mt-1 w-full border px-2 py-1 text-sm"
                  value={form.stage}
                  onChange={(e) =>
                    setForm({ ...form, stage: e.target.value })
                  }
                >
                  <option value="">—</option>
                  {STAGE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Ownership %</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={form.ownership_percentage}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ownership_percentage: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Role</Label>
                <select
                  className="mt-1 w-full border px-2 py-1 text-sm"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="">—</option>
                  {ROLE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Post-Money Valuation</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={form.post_money_valuation}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      post_money_valuation: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={!form.company_id || !form.fund_id}
              >
                Add
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={deleteConfirm !== null}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Investment</DialogTitle>
          </DialogHeader>
          <p className="text-sm">Delete this investment?</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reminder Dialog -- shown after add or edit */}
      <Dialog open={reminder !== null} onOpenChange={() => setReminder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reminder</DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            Don&apos;t forget to update {reminder}&apos;s total ownership and
            invested amount on the Companies page if needed.
          </p>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setReminder(null)}>Got it</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
