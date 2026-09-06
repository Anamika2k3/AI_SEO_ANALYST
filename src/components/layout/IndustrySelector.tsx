'use client';

import { INDUSTRIES } from "@/config/industries";
import { useData } from "@/contexts/DataContext";
import type { IndustryId } from "@/config/industries";

export default function IndustrySelector() {
  const { selectedIndustry, setSelectedIndustry } = useData();

  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <span className="font-medium text-slate-700">Industry</span>
      <select
        value={selectedIndustry}
        onChange={(e) => setSelectedIndustry(e.target.value as IndustryId)}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-500"
      >
        {INDUSTRIES.map((industry) => (
          <option key={industry.id} value={industry.id}>
            {industry.label}
          </option>
        ))}
      </select>
    </label>
  );
}
