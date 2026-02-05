"use client";

import { useState, useRef, useEffect } from "react";
import type { Fund } from "@/lib/types";

// ─── Text / Number / Date cell ──────────────────────────────────────────────

interface InlineCellProps {
  value: string | number | null;
  onSave: (value: string) => Promise<void>;
  type?: "text" | "number" | "date";
  displayFormat?: (value: string | number | null) => string;
}

export function InlineCell({ value, onSave, type = "text", displayFormat }: InlineCellProps) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const startEditing = () => {
    setInputValue(String(value ?? ""));
    setEditing(true);
  };

  const save = async () => {
    setEditing(false);
    if (inputValue !== String(value ?? "")) {
      await onSave(inputValue);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-full border px-1 py-0.5 text-sm"
      />
    );
  }

  return (
    <div
      onClick={startEditing}
      className="cursor-pointer hover:bg-gray-50 px-1 py-0.5 min-h-[24px] text-sm"
    >
      {displayFormat ? displayFormat(value) : (value ?? "—")}
    </div>
  );
}

// ─── Select cell ────────────────────────────────────────────────────────────

interface InlineSelectProps {
  value: string | null;
  options: { value: string; label: string }[];
  onSave: (value: string) => Promise<void>;
}

export function InlineSelect({ value, options, onSave }: InlineSelectProps) {
  const [editing, setEditing] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (editing) selectRef.current?.focus();
  }, [editing]);

  if (editing) {
    return (
      <select
        ref={selectRef}
        value={value ?? ""}
        onChange={async (e) => {
          setEditing(false);
          await onSave(e.target.value);
        }}
        onBlur={() => setEditing(false)}
        className="w-full border px-1 py-0.5 text-sm"
      >
        <option value="">—</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className="cursor-pointer hover:bg-gray-50 px-1 py-0.5 min-h-[24px] text-sm"
    >
      {options.find((o) => o.value === value)?.label ?? "—"}
    </div>
  );
}

// ─── Multi-select funds cell ────────────────────────────────────────────────

interface InlineFundsProps {
  fundIds: string[];
  allFunds: Fund[];
  onSave: (fundIds: string[]) => Promise<void>;
}

export function InlineFunds({ fundIds, allFunds, onSave }: InlineFundsProps) {
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState(fundIds);

  useEffect(() => {
    setSelected(fundIds);
  }, [fundIds]);

  const toggle = async (fundId: string) => {
    const next = selected.includes(fundId)
      ? selected.filter((id) => id !== fundId)
      : [...selected, fundId];
    setSelected(next);
    await onSave(next);
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-1 py-1 px-1">
        {allFunds.map((fund) => (
          <label
            key={fund.id}
            className="flex items-center gap-1.5 text-sm cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selected.includes(fund.id)}
              onChange={() => toggle(fund.id)}
            />
            {fund.name}
          </label>
        ))}
        <button
          onClick={() => setEditing(false)}
          className="text-xs text-gray-500 underline mt-1 text-left"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className="cursor-pointer hover:bg-gray-50 px-1 py-0.5 min-h-[24px] text-sm"
    >
      {allFunds
        .filter((f) => fundIds.includes(f.id))
        .map((f) => f.name)
        .join(", ") || "—"}
    </div>
  );
}
