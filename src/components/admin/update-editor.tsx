"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createUpdate,
  saveUpdate,
  publishUpdate,
  unpublishUpdate,
} from "@/lib/actions/updates";
import type { Fund } from "@/lib/types";

interface ExistingUpdate {
  id: string;
  title: string;
  body: string;
  status: string;
  fundIds: string[];
}

interface Props {
  funds: Fund[];
  initialUpdate?: ExistingUpdate;
}

export function UpdateEditor({ funds, initialUpdate }: Props) {
  const router = useRouter();
  const isNew = !initialUpdate;

  const [title, setTitle] = useState(initialUpdate?.title ?? "");
  const [body, setBody] = useState(initialUpdate?.body ?? "");
  const [fundIds, setFundIds] = useState<string[]>(
    initialUpdate?.fundIds ?? []
  );
  const [status, setStatus] = useState(initialUpdate?.status ?? "draft");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleFund = (fundId: string) => {
    setFundIds(
      fundIds.includes(fundId)
        ? fundIds.filter((id) => id !== fundId)
        : [...fundIds, fundId]
    );
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setError(null);
    try {
      if (isNew) {
        const created = await createUpdate(title, body, fundIds);
        // Navigate to the edit page so subsequent saves hit the right ID
        router.replace(`/admin/updates/${created.id}`);
      } else {
        await saveUpdate(initialUpdate.id, title, body, fundIds);
      }
      showSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setSaving(true);
    setError(null);
    try {
      // Save content first if new
      if (isNew) {
        const created = await createUpdate(title, body, fundIds);
        await publishUpdate(created.id);
        router.replace(`/admin/updates/${created.id}`);
      } else {
        await saveUpdate(initialUpdate.id, title, body, fundIds);
        await publishUpdate(initialUpdate.id);
      }
      setStatus("published");
      showSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setSaving(false);
    }
  };

  const handleUnpublish = async () => {
    if (!initialUpdate) return;
    setSaving(true);
    setError(null);
    try {
      await unpublishUpdate(initialUpdate.id);
      setStatus("draft");
      showSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unpublish");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" asChild>
          <a href="/admin/updates">← Back</a>
        </Button>
        <h1 className="text-2xl font-semibold">
          {isNew ? "New Update" : "Edit Update"}
        </h1>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {/* Title */}
      <div className="mb-4">
        <Label>Title</Label>
        <Input
          className="mt-1"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Update title"
        />
      </div>

      {/* Fund visibility */}
      <div className="mb-4">
        <Label>Visible to</Label>
        <div className="flex gap-4 mt-1">
          {funds.map((fund) => (
            <label
              key={fund.id}
              className="flex items-center gap-1.5 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={fundIds.includes(fund.id)}
                onChange={() => toggleFund(fund.id)}
              />
              {fund.name}
            </label>
          ))}
        </div>
      </div>

      {/* Markdown editor + live preview side by side */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <Label>Content (Markdown)</Label>
          <textarea
            className="mt-1 w-full border px-3 py-2 text-sm h-64 resize-none font-mono"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your update in markdown..."
          />
        </div>
        <div>
          <Label>Preview</Label>
          <div className="mt-1 border px-3 py-2 h-64 overflow-y-auto text-sm prose prose-sm max-w-none">
            {body ? (
              <ReactMarkdown>{body}</ReactMarkdown>
            ) : (
              <p className="text-gray-400 italic">Preview will appear here</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={saving || !title}
          >
            {saving ? "Saving..." : "Save Draft"}
          </Button>
          {status === "draft" ? (
            <Button onClick={handlePublish} disabled={saving || !title}>
              {saving ? "Publishing..." : "Publish"}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleUnpublish}
              disabled={saving}
            >
              Unpublish
            </Button>
          )}
        </div>
        {saved && <span className="text-sm text-gray-500">Saved</span>}
      </div>
    </div>
  );
}
