"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteUpdate } from "@/lib/actions/updates";
import type { Fund } from "@/lib/types";

interface Update {
  id: string;
  title: string;
  status: string;
  created_at: string;
  published_at: string | null;
  update_fund_visibility: { fund_id: string }[];
}

interface Props {
  initialData: Update[];
  funds: Fund[];
}

export function UpdatesList({ initialData, funds }: Props) {
  const [updates, setUpdates] = useState<Update[]>(initialData);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteUpdate(id);
      setUpdates(updates.filter((u) => u.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setDeleteConfirm(null);
    }
  };

  const getFundNames = (fundIds: string[]) =>
    funds
      .filter((f) => fundIds.includes(f.id))
      .map((f) => f.name)
      .join(", ");

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Updates</h1>
        <Button asChild>
          <Link href="/admin/updates/new">+ New Update</Link>
        </Button>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="flex flex-col gap-3">
        {updates.length === 0 && (
          <p className="text-sm text-gray-500">No updates yet.</p>
        )}
        {updates.map((u) => (
          <div
            key={u.id}
            className="border p-4 flex items-start justify-between"
          >
            <Link href={`/admin/updates/${u.id}`} className="flex-1">
              <p className="text-sm font-medium">{u.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {getFundNames(
                  u.update_fund_visibility.map((v) => v.fund_id)
                ) || "No funds"}
                {"  ·  "}
                {u.status === "published" ? "Published" : "Draft"}
                {"  ·  "}
                {new Date(u.created_at).toLocaleDateString()}
              </p>
            </Link>
            <button
              onClick={() => setDeleteConfirm(u.id)}
              className="text-xs text-gray-400 hover:text-red-600 ml-4"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Delete Confirmation */}
      <Dialog
        open={deleteConfirm !== null}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Update</DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            Delete "{updates.find((u) => u.id === deleteConfirm)?.title}"?
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
