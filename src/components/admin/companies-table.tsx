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
import {
  InlineCell,
  InlineSelect,
  InlineFunds,
} from "@/components/admin/inline-cells";
import {
  addCompany,
  updateCompanyField,
  updateCompanyFunds,
  deleteCompany,
} from "@/lib/actions/companies";
import type { Fund } from "@/lib/types";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "exited", label: "Exited" },
  { value: "written_off", label: "Written Off" },
];

interface Company {
  id: string;
  name: string;
  sector: string | null;
  location: string | null;
  status: string;
  ownership_percentage: number | null;
  total_invested: number | null;
  website_url: string | null;
  company_funds: { fund_id: string }[];
}

interface Props {
  initialData: Company[];
  funds: Fund[];
}

export function CompaniesTable({ initialData, funds }: Props) {
  const [companies, setCompanies] = useState<Company[]>(initialData);
  const [addOpen, setAddOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    sector: "",
    location: "",
    status: "active",
    website_url: "",
  });
  const [formFunds, setFormFunds] = useState<string[]>([]);

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAdd = async () => {
    setError(null);
    try {
      const newCompany = await addCompany(form, formFunds);
      setCompanies([...companies, newCompany]);
      setAddOpen(false);
      setForm({ name: "", sector: "", location: "", status: "active", website_url: "" });
      setFormFunds([]);
      showSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add company");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCompany(id);
      setCompanies(companies.filter((c) => c.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setDeleteConfirm(null);
    }
  };

  const handleFieldSave = async (id: string, field: string, value: string) => {
    await updateCompanyField(id, field, value);
    setCompanies(
      companies.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
    showSaved();
  };

  const handleFundsSave = async (id: string, fundIds: string[]) => {
    await updateCompanyFunds(id, fundIds);
    setCompanies(
      companies.map((c) =>
        c.id === id
          ? { ...c, company_funds: fundIds.map((fund_id) => ({ fund_id })) }
          : c
      )
    );
    showSaved();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Companies</h1>
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
                "Name",
                "Funds",
                "Sector",
                "Location",
                "Status",
                "Ownership %",
                "Website",
              ].map((h) => (
                <th key={h} className="text-xs font-medium text-gray-500 pb-2 px-1">
                  {h}
                </th>
              ))}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} className="border-b border-gray-100">
                <td className="px-0">
                  <InlineCell
                    value={c.name}
                    onSave={(val) => handleFieldSave(c.id, "name", val)}
                  />
                </td>
                <td className="px-0">
                  <InlineFunds
                    fundIds={c.company_funds.map((cf) => cf.fund_id)}
                    allFunds={funds}
                    onSave={(ids) => handleFundsSave(c.id, ids)}
                  />
                </td>
                <td className="px-0">
                  <InlineCell
                    value={c.sector}
                    onSave={(val) => handleFieldSave(c.id, "sector", val)}
                  />
                </td>
                <td className="px-0">
                  <InlineCell
                    value={c.location}
                    onSave={(val) => handleFieldSave(c.id, "location", val)}
                  />
                </td>
                <td className="px-0">
                  <InlineSelect
                    value={c.status}
                    options={STATUS_OPTIONS}
                    onSave={(val) => handleFieldSave(c.id, "status", val)}
                  />
                </td>
                <td className="px-0">
                  <InlineCell
                    value={c.ownership_percentage}
                    type="number"
                    onSave={(val) =>
                      handleFieldSave(c.id, "ownership_percentage", val)
                    }
                  />
                </td>
                <td className="px-0">
                  <InlineCell
                    value={c.website_url}
                    onSave={(val) => handleFieldSave(c.id, "website_url", val)}
                  />
                </td>
                <td className="px-1">
                  <button
                    onClick={() => setDeleteConfirm(c.id)}
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

      {/* Add Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Company</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <div>
              <Label>Name</Label>
              <Input
                className="mt-1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Sector</Label>
              <Input
                className="mt-1"
                value={form.sector}
                onChange={(e) => setForm({ ...form, sector: e.target.value })}
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input
                className="mt-1"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div>
              <Label>Status</Label>
              <select
                className="mt-1 w-full border px-2 py-1 text-sm"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Website</Label>
              <Input
                className="mt-1"
                value={form.website_url}
                onChange={(e) =>
                  setForm({ ...form, website_url: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Funds</Label>
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
              <Button onClick={handleAdd} disabled={!form.name}>
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
            <DialogTitle>Delete Company</DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            Delete {companies.find((c) => c.id === deleteConfirm)?.name}? This
            will also remove fund associations.
          </p>
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
    </div>
  );
}
