"use client";

import { useState } from "react";
import ScreenerHeader from "./ScreenerHeader";
import SearchBar from "./SearchBar";
import QuickPresets, { PRESETS } from "./QuickPresets";
import FilterBuilder, { AVAILABLE_METRICS } from "./FilterBuilder";
import AddFilterModal from "./AddFilterModal";
import SaveScreenDialog from "./SaveScreenDialog";
import ResultsTable from "./ResultsTable";
import EmptyResults from "./EmptyResults";
import { screenerStocks } from "@/lib/screenerData";
import type { Filter, Stock, FilterMetric } from "./types";

interface ScreenerProps {
  onBack?: () => void;
  onViewStock?: (symbol: string) => void;
}

export default function Screener({ onBack, onViewStock }: ScreenerProps) {
  // Main states
  const [filters, setFilters] = useState<Filter[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("aiScore");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Modals state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [editingPresetName, setEditingPresetName] = useState<string | null>(null); // new

  // Load saved screens from localStorage
  const [savedScreens, setSavedScreens] = useState<{ name: string; filters: Filter[] }[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("insight_saved_screener_presets");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Manage dynamic filters
  const handleAddFilter = (metric: FilterMetric) => {
    const newFilter: Filter = {
      id: Math.random().toString(36).substr(2, 9),
      metricId: metric.id,
      operator: metric.type === "number" ? ">" : "=",
      value: metric.type === "number" ? 0 : "",
    };
    setFilters((prev) => [...prev, newFilter]);
    setSelectedPreset(null);
    setEditingPresetName(null); // clear editing state
  };

  const handleUpdateFilter = (id: string, updates: Partial<Filter>) => {
    setFilters((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
    setSelectedPreset(null);
    setEditingPresetName(null); // any modification clears edit mode
  };

  const handleRemoveFilter = (id: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== id));
    setSelectedPreset(null);
    setEditingPresetName(null);
  };

  const handleSelectPreset = (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (preset) {
      const compiledFilters: Filter[] = preset.filters.map((f) => ({
        id: Math.random().toString(36).substr(2, 9),
        ...f,
      }));
      setFilters(compiledFilters);
      setSelectedPreset(presetId);
      setEditingPresetName(null);
      return;
    }

    // Check saved screens
    const saved = savedScreens.find((s) => s.name === presetId);
    if (saved) {
      setFilters(saved.filters.map((f) => ({ ...f, id: Math.random().toString(36).substr(2, 9) })));
      setSelectedPreset(presetId);
      setEditingPresetName(null);
    }
  };

  const handleResetFilters = () => {
    setFilters([]);
    setSelectedPreset(null);
    setSearchQuery("");
    setEditingPresetName(null);
  };

  // Section 10: AI Natural Language Prompt Compiler
  const handleAIPrompt = (prompt: string) => {
    const lower = prompt.toLowerCase();
    const parsedFilters: Filter[] = [];

    // Parse sector
    if (lower.includes("it company") || lower.includes("it companies") || lower.includes("tech")) {
      parsedFilters.push({
        id: "ai-sector",
        metricId: "sector",
        operator: "=",
        value: "IT Services",
      });
    }
    if (lower.includes("bank") || lower.includes("financial")) {
      parsedFilters.push({
        id: "ai-sector",
        metricId: "sector",
        operator: "=",
        value: "Banking & Financials",
      });
    }

    // Parse P/E
    if (lower.includes("undervalued") || lower.includes("low pe") || lower.includes("cheap")) {
      parsedFilters.push({
        id: "ai-pe",
        metricId: "pe",
        operator: "<",
        value: 25,
      });
    }

    // Parse ROE
    if (lower.includes("high roe") || lower.includes("strong returns")) {
      parsedFilters.push({
        id: "ai-roe",
        metricId: "roe",
        operator: ">",
        value: 18,
      });
    }

    // Parse Growth
    if (lower.includes("growth") || lower.includes("growing")) {
      parsedFilters.push({
        id: "ai-growth",
        metricId: "revenueGrowth",
        operator: ">",
        value: 12,
      });
    }

    // Parse Debt
    if (lower.includes("low debt") || lower.includes("debt free")) {
      parsedFilters.push({
        id: "ai-debt",
        metricId: "debtEquity",
        operator: "<",
        value: 0.3,
      });
    }

    if (parsedFilters.length > 0) {
      setFilters(parsedFilters);
      setSelectedPreset(null);
      setEditingPresetName(null);
    } else {
      alert("AI was unable to extract specific criteria. Try: 'Find undervalued IT companies with high ROE'");
    }
  };

  // Handle Saved Screen - Save
  const handleSaveScreen = (name: string) => {
    // If editing, update the existing preset
    if (editingPresetName) {
      const updated = savedScreens.map((s) =>
        s.name === editingPresetName ? { name, filters } : s
      );
      setSavedScreens(updated);
      localStorage.setItem("insight_saved_screener_presets", JSON.stringify(updated));
      setSelectedPreset(name);
      setEditingPresetName(null);
      alert(`Preset "${name}" updated successfully.`);
    } else {
      // New save
      const updated = [...savedScreens, { name, filters }];
      setSavedScreens(updated);
      localStorage.setItem("insight_saved_screener_presets", JSON.stringify(updated));
      setSelectedPreset(name);
      alert(`Preset "${name}" saved successfully.`);
    }
  };

  // Delete preset
  const handleDeletePreset = (name: string) => {
    if (confirm(`Delete preset "${name}"?`)) {
      const updated = savedScreens.filter((s) => s.name !== name);
      setSavedScreens(updated);
      localStorage.setItem("insight_saved_screener_presets", JSON.stringify(updated));
      if (selectedPreset === name) {
        setSelectedPreset(null);
        setFilters([]);
      }
      if (editingPresetName === name) {
        setEditingPresetName(null);
      }
    }
  };

  // Edit preset: load filters and set editing mode
  const handleEditPreset = (name: string) => {
    const saved = savedScreens.find((s) => s.name === name);
    if (saved) {
      setFilters(saved.filters.map((f) => ({ ...f, id: Math.random().toString(36).substr(2, 9) })));
      setSelectedPreset(name);
      setEditingPresetName(name);
      // Open the save dialog pre-filled with the name
      setShowSaveDialog(true);
    }
  };

  // Handle Table Sorting
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDirection("desc");
    }
  };

  // Apply filters and search query to list of stocks
  const filteredStocks = (screenerStocks as Stock[]).filter((stock) => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSymbol = stock.symbol.toLowerCase().includes(q);
      const matchName = stock.name.toLowerCase().includes(q);
      if (!matchSymbol && !matchName) return false;
    }

    // 2. Active filters evaluation
    for (const filter of filters) {
      const metricValue = (stock as any)[filter.metricId];
      if (metricValue === undefined) continue;

      const filterVal = filter.value;

      if (typeof metricValue === "number") {
        const numVal = parseFloat(filterVal as string) || 0;
        switch (filter.operator) {
          case ">":
            if (metricValue <= numVal) return false;
            break;
          case "<":
            if (metricValue >= numVal) return false;
            break;
          case "=":
            if (metricValue !== numVal) return false;
            break;
          case ">=":
            if (metricValue < numVal) return false;
            break;
          case "<=":
            if (metricValue > numVal) return false;
            break;
        }
      } else {
        // String comparisons
        const sVal = String(filterVal).toLowerCase();
        const sMetric = String(metricValue).toLowerCase();
        if (filter.operator === "=") {
          if (!sMetric.includes(sVal)) return false;
        }
      }
    }

    return true;
  });

  // Apply sorting
  const sortedStocks = [...filteredStocks].sort((a, b) => {
    const valA = (a as any)[sortBy];
    const valB = (b as any)[sortBy];

    if (valA === undefined || valB === undefined) return 0;

    if (typeof valA === "number" && typeof valB === "number") {
      return sortDirection === "asc" ? valA - valB : valB - valA;
    } else {
      return sortDirection === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    }
  });

  return (
    <div className="relative min-h-screen px-6 pt-24 pb-20 text-white">
      {/* Background Glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/4 top-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-[160px]" />
        <div className="absolute right-1/4 top-60 h-96 w-96 rounded-full bg-blue-600/10 blur-[160px]" />
      </div>

      <div className="mx-auto max-w-7xl px-8 space-y-8">
        {/* Header */}
        <ScreenerHeader onBack={onBack} onSaveScreen={() => setShowSaveDialog(true)} />

        {/* Search & AI prompt */}
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAIPrompt={handleAIPrompt}
        />

        {/* Quick Presets */}
        <QuickPresets
          selectedPreset={selectedPreset}
          onSelectPreset={handleSelectPreset}
          customPresets={savedScreens.map((s) => s.name)}
          onDeletePreset={handleDeletePreset}
          onEditPreset={handleEditPreset}
        />

        {/* Filter Builder */}
        <FilterBuilder
          filters={filters}
          onUpdateFilter={handleUpdateFilter}
          onRemoveFilter={handleRemoveFilter}
          onAddFilterClick={() => setShowFilterModal(true)}
        />

        {/* Results table / Empty state */}
        {sortedStocks.length > 0 ? (
          <ResultsTable
            stocks={sortedStocks}
            onViewStock={onViewStock}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        ) : (
          <EmptyResults onReset={handleResetFilters} />
        )}
      </div>

      {/* Add Filter Modal */}
      <AddFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onSelectMetric={handleAddFilter}
        activeMetricIds={filters.map((f) => f.metricId)}
      />

      {/* Save Screen Dialog - now with editing support */}
      <SaveScreenDialog
        isOpen={showSaveDialog}
        onClose={() => {
          setShowSaveDialog(false);
          setEditingPresetName(null);
        }}
        onSave={handleSaveScreen}
        editingName={editingPresetName}
      />
    </div>
  );
}
