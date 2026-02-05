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
import { InlineCell, InlineFunds } from "@/components/admin/inline-cells";
import {
  addLP,
  updateLPField,
  updateLPFunds,
  deleteLP,
} from "@/lib/actions/lps";
import type { Fund } from "@/lib/types";

interface LP {
  id: string;
  email: string;
  name: string | null;
  organization: string | null;
  lp_fund_access: { fund_id: string }[];
  users: { last_login_at: string | null }[] | null;
}

interface Props {
  initialData: LP[];
  funds: Fund[];
}

export function LPsTable({ initialData, funds }: Props) {
  const [lps, setLPs] = useState<LP[]>(initialData);
  const [addOpen, setAddOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({ email: "", name: "", organization: "" });
  const [formFunds, setFormFunds] = useState<string[]>([]);

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAdd = async () => {
    setError(null);
    try {
      const newLP = await addLP(
        form.email,
        form.name,
        form.organization,
        formFunds
      );
      setLPs([...lps, newLP]);
      setAddOpen(false);
      setForm({ email: "", name: "", organization: "" });
      setFormFunds([]);
      showSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add LP");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLP(id);
      setLPs(lps.filter((lp) => lp.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete LP");
      setDeleteConfirm(null);
    }
  };

  const handleFieldSave = async (
    id: string,
    field: "name" | "organization",
    value: string
  ) => {
    await updateLPField(id, field, value);
    setLPs(lps.map((lp) => (lp.id === id ? { ...lp, [field]: value } : lp)));
    showSaved();
  };

  const handleFundsSave = async (id: string, fundIds: string[]) => {
    await updateLPFunds(id, fundIds);
    setLPs(
      lps.map((lp) =>
        lp.id === id
          ? { ...lp, lp_fund_access: fundIds.map((fund_id) => ({ fund_id })) }
          : lp
      )
    );
    showSaved();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">LPs</h1>
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
              <th className="text-xs font-medium text-gray-500 pb-2 px-1">
                Email
              </th>
              <th className="text-xs font-medium text-gray-500 pb-2 px-1">
                Name
              </th>
              <th className="text-xs font-medium text-gray-500 pb-2 px-1">
                Organization
              </th>
              <th className="text-xs font-medium text-gray-500 pb-2 px-1">
                Funds
              </th>
              <th className="text-xs font-medium text-gray-500 pb-2 px-1">
                Last Login
              </th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {lps.map((lp) => (
              <tr key={lp.id} className="border-b border-gray-100">
                <td className="px-1 py-0.5 text-sm">{lp.email}</td>
                <td className="px-0">
                  <InlineCell
                    value={lp.name}
                    onSave={(val) => handleFieldSave(lp.id, "name", val)}
                  />
                </td>
                <td className="px-0">
                  <InlineCell
                    value={lp.organization}
                    onSave={(val) =>
                      handleFieldSave(lp.id, "organization", val)
                    }
                  />
                </td>
                <td className="px-0">
                  <InlineFunds
                    fundIds={lp.lp_fund_access.map((fa) => fa.fund_id)}
                    allFunds={funds}
                    onSave={(ids) => handleFundsSave(lp.id, ids)}
                  />
                </td>
                <td className="px-1 text-sm text-gray-500">
                  {lp.users?.[0]?.last_login_at
                    ? new Date(lp.users[0].last_login_at).toLocaleDateString()
                    : "Never"}
                </td>
                <td className="px-1">
                  <button
                    onClick={() => setDeleteConfirm(lp.id)}
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

      {/* Add LP Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add LP</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <div>
              <Label>Email</Label>
              <Input
                className="mt-1"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Name</Label>
              <Input
                className="mt-1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Organization</Label>
              <Input
                className="mt-1"
                value={form.organization}
                onChange={(e) =>
                  setForm({ ...form, organization: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Fund Access</Label>
              <div className="flex gap-4 mt-1">
                {funds.map((fund) => (
                  <label
                    key={fund.id}
                    className="flex items-center gap-1.5 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formFunds.includes(fund.id)}
                      onChange={() =>
                        setFormFunds(
                          formFunds.includes(fund.id)
                            ? formFunds.filter((id) => id !== fund.id)
                            : [...formFunds, fund.id]
                        )
                      }
                    />
                    {fund.name}
                  </label>
                ))}
              </div>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={!form.email}>
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
            <DialogTitle>Remove LP</DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            Remove LP access for{" "}
            {lps.find((lp) => lp.id === deleteConfirm)?.email}?
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
