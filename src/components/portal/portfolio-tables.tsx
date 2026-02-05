"use client";

import { useState, useMemo } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";

interface CompanyRow {
  name: string;
  sector: string | null;
  location: string | null;
  status: string;
  total_invested: number | null;
  ownership_percentage: number | null;
  first_investment_date: string | null;
  website_url: string | null;
}

interface InvestmentRow {
  company_name: string;
  investment_date: string | null;
  investment_type: string | null;
  stage: string | null;
  amount: number | null;
  ownership_percentage: number | null;
  role: string | null;
  post_money_valuation: number | null;
}

interface Props {
  fundName: string;
  companies: Record<string, unknown>[];
  investments: Record<string, unknown>[];
}

function formatMoney(val: number | null): string {
  if (val == null) return "—";
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${Math.round(val / 1_000)}K`;
  return `$${val.toLocaleString()}`;
}

const companyHelper = createColumnHelper<CompanyRow>();
const investmentHelper = createColumnHelper<InvestmentRow>();

const companyColumns = [
  companyHelper.accessor("name", {
    header: "Company",
    cell: (info) => info.getValue(),
  }),
  companyHelper.accessor("ownership_percentage", {
    header: "Current Ownership",
    cell: (info) => (info.getValue() != null ? `${info.getValue()}%` : "—"),
  }),
  companyHelper.accessor("total_invested", {
    header: "Total Invested",
    cell: (info) => formatMoney(info.getValue()),
  }),
  companyHelper.accessor("sector", {
    header: "Sector",
    cell: (info) => info.getValue() ?? "—",
  }),
  companyHelper.accessor("location", {
    header: "Location",
    cell: (info) => info.getValue() ?? "—",
  }),
  companyHelper.accessor("status", {
    header: "Status",
    cell: (info) => {
      const v = info.getValue();
      if (!v) return "—";
      return v.charAt(0).toUpperCase() + v.slice(1);
    },
  }),
  companyHelper.accessor("website_url", {
    header: "Website",
    cell: (info) => {
      const url = info.getValue();
      if (!url) return "—";
      try {
        const domain = new URL(url).hostname.replace(/^www\./, "");
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-black underline hover:text-gray-600"
          >
            {domain}
          </a>
        );
      } catch {
        return "—";
      }
    },
  }),
  companyHelper.accessor("first_investment_date", {
    header: "First Investment",
    cell: (info) =>
      info.getValue()
        ? new Date(info.getValue()!).toLocaleDateString()
        : "—",
  }),
];

const investmentColumns = [
  investmentHelper.accessor("company_name", {
    header: "Company",
    cell: (info) => info.getValue(),
  }),
  investmentHelper.accessor("investment_date", {
    header: "Date",
    cell: (info) =>
      info.getValue()
        ? new Date(info.getValue()!).toLocaleDateString()
        : "—",
  }),
  investmentHelper.accessor("investment_type", {
    header: "Type",
    cell: (info) => (info.getValue() ? info.getValue()!.toUpperCase() : "—"),
  }),
  investmentHelper.accessor("stage", {
    header: "Stage",
    cell: (info) => {
      const v = info.getValue();
      if (!v) return "—";
      return v === "follow_on" ? "Follow-on" : "Initial";
    },
  }),
  investmentHelper.accessor("amount", {
    header: "Amount",
    cell: (info) => formatMoney(info.getValue()),
  }),
  investmentHelper.accessor("ownership_percentage", {
    header: "Ownership %",
    cell: (info) => (info.getValue() != null ? `${info.getValue()}%` : "—"),
  }),
  investmentHelper.accessor("role", {
    header: "Role",
    cell: (info) => {
      const v = info.getValue();
      if (!v) return "—";
      return v === "co_lead"
        ? "Co-Lead"
        : v.charAt(0).toUpperCase() + v.slice(1);
    },
  }),
  investmentHelper.accessor("post_money_valuation", {
    header: "Post-Money",
    cell: (info) => formatMoney(info.getValue()),
  }),
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SortableTable({ data, columns, initialSorting = [] }: { data: any[]; columns: ColumnDef<any>[]; initialSorting?: SortingState }) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (table.getRowModel().rows.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-12">No data available.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={`text-left border p-2 font-medium bg-gray-50 ${
                    header.column.getCanSort() ? "cursor-pointer select-none" : ""
                  }`}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() === "asc"
                    ? " ↑"
                    : header.column.getIsSorted() === "desc"
                      ? " ↓"
                      : ""}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="border p-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PortfolioTables({ fundName, companies, investments }: Props) {
  const [activeTab, setActiveTab] = useState<"companies" | "investments">(
    "companies"
  );

  const companyData: CompanyRow[] = useMemo(
    () =>
      companies
        .map((c) => ({
          name: String(c.name),
          sector: c.sector as string | null,
          location: c.location as string | null,
          status: String(c.status),
          total_invested: c.total_invested as number | null,
          ownership_percentage: c.ownership_percentage as number | null,
          first_investment_date: c.first_investment_date as string | null,
          website_url: c.website_url as string | null,
        }))
        .sort((a, b) => {
          if (!a.first_investment_date) return 1;
          if (!b.first_investment_date) return -1;
          return b.first_investment_date.localeCompare(a.first_investment_date);
        }),
    [companies]
  );

  const investmentData: InvestmentRow[] = useMemo(
    () =>
      investments.map((i) => ({
        company_name: String(
          (i.companies as { name?: string })?.name ?? "Unknown"
        ),
        investment_date: i.investment_date as string | null,
        investment_type: i.investment_type as string | null,
        stage: i.stage as string | null,
        amount: i.amount as number | null,
        ownership_percentage: i.ownership_percentage as number | null,
        role: i.role as string | null,
        post_money_valuation: i.post_money_valuation as number | null,
      })),
    [investments]
  );

  return (
    <div className="py-8">
      <h1 className="text-4xl font-light tracking-tight text-center mb-8">
        {fundName}
      </h1>
      <div className="flex justify-center gap-8 border-b mb-6">
        <button
          className={`pb-2 text-sm ${
            activeTab === "companies"
              ? "font-medium text-black border-b-2 border-black"
              : "text-gray-400"
          }`}
          onClick={() => setActiveTab("companies")}
        >
          Companies
        </button>
        <button
          className={`pb-2 text-sm ${
            activeTab === "investments"
              ? "font-medium text-black border-b-2 border-black"
              : "text-gray-400"
          }`}
          onClick={() => setActiveTab("investments")}
        >
          Investments
        </button>
      </div>
      {activeTab === "companies" ? (
        <SortableTable
          data={companyData}
          columns={companyColumns as ColumnDef<any>[]}
          initialSorting={[{ id: "first_investment_date", desc: false }]}
        />
      ) : (
        <SortableTable data={investmentData} columns={investmentColumns as ColumnDef<any>[]} />
      )}
    </div>
  );
}
