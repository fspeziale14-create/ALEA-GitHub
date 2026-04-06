// ================================================================
// ALEA — Redditività Menu
// Componente autonomo. Props ricevute da App.tsx.
// ================================================================

import { useState, useRef, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Upload, AlertCircle, ChevronDown,
  ChevronUp, BarChart2, Pencil, Check, X, Info, Filter,
  ArrowUpDown, PiggyBank, Package, Percent, Euro
} from 'lucide-react';
import { MENU_CATEGORIES, MENU_PRICES } from '../constants';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';

// ── TIPI ─────────────────────────────────────────────────────────

interface Supplier {
  name: string;
  qtyPerBox: number;
  pricePerBox: number;
  unit: string;
}

interface PurchaseRecord {
  qty: number;
  pricePerUnit: number;
  date: string;
  supplierName: string;
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  idealQty: number;
  currentQty: number;
  suppliers?: Supplier[];
  manualPricePerUnit?: number; // €/unità inserito manualmente se fornitore mancante
  purchaseHistory?: PurchaseRecord[];
}

// ── WAC: Costo Medio Ponderato ────────────────────────────────────
// Priorità: manuale > WAC da purchaseHistory > primo fornitore valido
export const calcWAC = (ing: Ingredient): number | null => {
  if (ing.manualPricePerUnit != null && ing.manualPricePerUnit > 0) {
    return ing.manualPricePerUnit;
  }
  if (ing.purchaseHistory && ing.purchaseHistory.length > 0) {
    const totalQty   = ing.purchaseHistory.reduce((s, r) => s + r.qty, 0);
    const totalSpend = ing.purchaseHistory.reduce((s, r) => s + r.qty * r.pricePerUnit, 0);
    if (totalQty > 0) return totalSpend / totalQty;
  }
  // Fallback: primo fornitore con prezzo valido
  const sup = ing.suppliers?.find(s => s.pricePerBox > 0 && s.qtyPerBox > 0);
  if (sup) return sup.pricePerBox / sup.qtyPerBox;
  return null;
};

// qty = quantità usata per porzione (nelle unità dell'ingrediente)
// portionsPerPiece = solo per unit='pz'/'conf': quante porzioni rende 1 pezzo IN QUESTO PIATTO (può essere <1 se servono più pezzi per 1 porzione)
interface RecipeRow {
  ingredientId: string;
  qty: number;
  unit?: string;
  portionsPerPiece?: number;
  pcs_yield?: number; // legacy, tenuto per retrocompatibilità
}

interface DishMargin {
  name: string;
  category: string;
  priceGross: number;       // prezzo cliente (IVA inclusa)
  ivaRate: number;          // 0.10 o 0.22
  priceNet: number;         // prezzo netto
  ingredientCost: number;   // costo totale ingredienti per porzione
  foodCostPct: number;      // ingredientCost / priceNet * 100
  marginNet: number;        // priceNet - ingredientCost
  marginPct: number;        // marginNet / priceNet * 100
  hasMissingCosts: boolean; // true se alcuni ingredienti senza prezzo
  frequency?: number;       // n° porzioni nel periodo importato
  score?: number;           // marginPct * frequency (indicatore sintetico)
}

type SortKey = 'name' | 'marginPct' | 'foodCostPct' | 'score' | 'frequency';
type SortDir = 'asc' | 'desc';

// ── IVA per categoria ────────────────────────────────────────────
// COCKTAILS & BEVERAGE: alcolici 22%, resto 10%
// Tutto il cibo: 10%
const getIvaRate = (category: string): number => {
  if (category === 'COCKTAILS & BEVERAGE') return 0.22;
  return 0.10;
};

// ── CALCOLO COSTO INGREDIENTI PER PIATTO ─────────────────────────
const isPieceUnit = (u: string) => u === 'pz' || u === 'conf';

const toBaseQty = (qty: number, fromUnit: string, baseUnit: string): number => {
  if (fromUnit === baseUnit) return qty;
  const factors: Record<string, number> = { g: 1, kg: 1000, ml: 1, cl: 10, l: 1000 };
  const fFrom = factors[fromUnit]; const fTo = factors[baseUnit];
  if (fFrom && fTo) return qty * fFrom / fTo;
  return qty;
};

const calcIngredientCost = (
  dishName: string,
  recipes: Record<string, RecipeRow[]>,
  ingredients: Ingredient[],
  preparations: MenuProfitabilityProps['preparations']
): { cost: number; hasMissing: boolean } => {
  const rows = recipes[dishName] || [];
  if (rows.length === 0) return { cost: 0, hasMissing: true };

  let total = 0;
  let hasMissing = false;

  rows.forEach(row => {
    const isPrep = row.ingredientId.startsWith('prep:');

    if (isPrep) {
      // ── Preparazione interna ──
      const prepId = row.ingredientId.replace('prep:', '');
      const prep = preparations.find(p => p.id === prepId);
      if (!prep || prep.yieldQty <= 0) { hasMissing = true; return; }

      // Costo totale di 1 batch della preparazione
      let prepCost = 0;
      let prepMissing = false;
      prep.ingredients.forEach(prepRow => {
        const ing = ingredients.find(i => i.id === prepRow.ingredientId);
        if (!ing) { prepMissing = true; return; }
        const ppu = calcWAC(ing);
        if (ppu == null) { prepMissing = true; return; }
        if (prepRow.portionsPerPiece && prepRow.portionsPerPiece > 0) {
          prepCost += ppu / prepRow.portionsPerPiece;
        } else {
          const qtyInBase = toBaseQty(prepRow.qty, prepRow.unit ?? ing.unit, ing.unit);
          prepCost += ppu * qtyInBase;
        }
      });
      if (prepMissing) { hasMissing = true; return; }

      // Costo per unità di resa (es. €/kg di preparazione)
      const costPerYieldUnit = prepCost / prep.yieldQty;

      // Quanto di questa preparazione usiamo in questo piatto
      if (row.portionsPerPiece && row.portionsPerPiece > 0) {
        total += costPerYieldUnit / row.portionsPerPiece;
      } else {
        const rowUnit = row.unit ?? prep.yieldUnit;
        const qtyInBase = toBaseQty(row.qty, rowUnit, prep.yieldUnit);
        total += costPerYieldUnit * qtyInBase;
      }
      return;
    }

    // ── Ingrediente normale ──
    const ing = ingredients.find(i => i.id === row.ingredientId);
    if (!ing) { hasMissing = true; return; }

    const pricePerUnit = calcWAC(ing);
    if (pricePerUnit == null) { hasMissing = true; return; }

    const effectivePpp = row.portionsPerPiece ?? (row.pcs_yield ? row.pcs_yield : undefined);
    if (isPieceUnit(ing.unit) && effectivePpp && effectivePpp > 0) {
      total += pricePerUnit / effectivePpp;
    } else {
      const rowUnit = row.unit ?? ing.unit;
      const qtyInBase = toBaseQty(row.qty, rowUnit, ing.unit);
      total += pricePerUnit * qtyInBase;
    }
  });

  return { cost: total, hasMissing };
};

// ── PROPS ─────────────────────────────────────────────────────────

interface MenuProfitabilityProps {
  ingredients: Ingredient[];
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  recipes: Record<string, RecipeRow[]>;
  preparations: Array<{ id: string; name: string; yieldQty: number; yieldUnit: string; ingredients: Array<{ ingredientId: string; qty: number; unit?: string; portionsPerPiece?: number }> }>;
  isDinner: boolean;
}

// ================================================================
// COMPONENTE PRINCIPALE
// ================================================================

export function MenuProfitability({
  ingredients,
  setIngredients,
  recipes,
  preparations,
  isDinner,
}: MenuProfitabilityProps) {

  // ── TEMA (consistente con App.tsx) ────────────────────────────
  const textColor  = isDinner ? 'text-[#F4F1EA]'  : 'text-[#2C2A28]';
  const mutedText  = isDinner ? 'text-[#94A3B8]'  : 'text-[#8C8A85]';
  const cardBg     = isDinner ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#EAE5DA] shadow-sm';
  const inputCls   = isDinner ? 'border-[#334155] bg-[#0F172A] text-[#F4F1EA]' : 'border-[#EAE5DA]';
  const accent     = 'text-[#967D62]';
  const accentBg   = isDinner ? 'bg-[#967D62]/15 border-[#967D62]/30' : 'bg-[#967D62]/10 border-[#967D62]/30';
  const rowHover   = isDinner ? 'hover:bg-[#334155]/40' : 'hover:bg-[#F4F1EA]/60';
  const dividerCls = isDinner ? 'border-[#334155]'      : 'border-[#EAE5DA]';

  // ── STATE ─────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'margini' | 'ranking'>('margini');
  const [categoryFilter, setCategoryFilter] = useState<string>('Tutte');
  const [sortKey, setSortKey] = useState<SortKey>('marginPct');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedDish, setExpandedDish] = useState<string | null>(null);

  // Prezzi manuali ingredienti (editing inline)
  const [editingIngId, setEditingIngId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>('');

  // Frequenze importate: { dishName -> count }
  const [frequencies, setFrequencies] = useState<Record<string, number>>({});
  const [freqPeriodLabel, setFreqPeriodLabel] = useState<string>('');
  const [freqImportMsg, setFreqImportMsg] = useState<{ type: 'ok' | 'err' | 'info'; msg: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const freqInputRef = useRef<HTMLInputElement>(null);

  // ── PIATTI ESCLUSI (non esistono nel menu reale) ─────────────
  const EXCLUDED_DISHES = new Set(['Caesar salad']);

  // ── SEPARAZIONE LOCALE PASTA/INSALATE (solo in questo componente)
  // La categoria PASTA & INSALATE viene divisa in due per i filtri e la tabella.
  // Il resto dell'app non viene toccato.
  const PASTA_ITEMS = new Set(["Spaghetti meatballs","Tagliolini jolly roger","Spaghetti all'astice","Rasta pasta"]);
  const INSALATE_ITEMS = new Set(['Chicken nuggets caesar salad','Gamberi al lime bowl','Quinoa salad','Gamberi coco loco caesar salad']);

  const resolveCategory = (catName: string, itemName: string): string => {
    if (catName !== 'PASTA & INSALATE') return catName;
    if (PASTA_ITEMS.has(itemName)) return 'PASTA';
    if (INSALATE_ITEMS.has(itemName)) return 'INSALATE';
    return catName; // fallback
  };

  // ── CALCOLA MARGINI PER TUTTI I PIATTI ───────────────────────
  const allDishes: DishMargin[] = MENU_CATEGORIES.flatMap(cat =>
    cat.items
      .filter(name => !EXCLUDED_DISHES.has(name))
      .map(name => {
        const category   = resolveCategory(cat.name, name);
        const priceGross = MENU_PRICES[name] ?? 0;
        const ivaRate    = getIvaRate(cat.name);
        const priceNet   = priceGross / (1 + ivaRate);
        const { cost, hasMissing } = calcIngredientCost(name, recipes, ingredients, preparations);
        const foodCostPct = priceNet > 0 && cost > 0 ? (cost / priceNet) * 100 : 0;
        const marginNet   = priceNet - cost;
        const marginPct   = priceNet > 0 ? (marginNet / priceNet) * 100 : 0;
        const frequency   = frequencies[name];
        const score       = frequency != null && marginPct > 0 ? marginPct * frequency : undefined;
        return {
          name, category,
          priceGross, ivaRate, priceNet,
          ingredientCost: cost, foodCostPct,
          marginNet, marginPct,
          hasMissingCosts: hasMissing || cost === 0,
          frequency, score,
        };
      })
  );

  // ── FILTRO + SORT ─────────────────────────────────────────────
  const filtered = allDishes.filter(d =>
    categoryFilter === 'Tutte' || d.category === categoryFilter
  );

  const sorted = [...filtered].sort((a, b) => {
    let va = 0; let vb = 0;
    if (sortKey === 'name') {
      return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }
    if (sortKey === 'marginPct')   { va = a.marginPct;      vb = b.marginPct; }
    if (sortKey === 'foodCostPct') { va = a.foodCostPct;    vb = b.foodCostPct; }
    if (sortKey === 'score')       { va = a.score ?? -1;    vb = b.score ?? -1; }
    if (sortKey === 'frequency')   { va = a.frequency ?? -1; vb = b.frequency ?? -1; }
    return sortDir === 'asc' ? va - vb : vb - va;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  // ── SAVE PREZZO MANUALE ───────────────────────────────────────
  const saveManualPrice = (ingId: string) => {
    const val = parseFloat(editingPrice);
    if (isNaN(val) || val < 0) { setEditingIngId(null); return; }
    setIngredients(prev => prev.map(i =>
      i.id === ingId ? { ...i, manualPricePerUnit: val } : i
    ));
    setEditingIngId(null);
  };

  // ── IMPORT FREQUENZE ──────────────────────────────────────────
  const parseFreqRows = useCallback((rows: string[][], fileName: string) => {
    if (rows.length < 2) {
      setFreqImportMsg({ type: 'err', msg: 'File vuoto o formato non riconosciuto.' });
      return;
    }
    const header = rows[0].map(h => h.toLowerCase().trim());
    const nameIdx = header.findIndex(h =>
      ['nome','piatto','dish','name','articolo','prodotto','descrizione','voce'].some(k => h.includes(k))
    );
    const qtyIdx = header.findIndex(h =>
      ['quantità','quantita','qty','pezzi','venduti','ordinati','count','frequenza','n°','numero'].some(k => h.includes(k))
    );
    // Prova a rilevare periodo da colonne
    const dateStartIdx = header.findIndex(h => ['dal','da','inizio','start','from'].some(k => h.includes(k)));
    const dateEndIdx   = header.findIndex(h => ['al','fine','end','to'].some(k => h.includes(k)));

    if (nameIdx === -1 || qtyIdx === -1) {
      setFreqImportMsg({ type: 'err', msg: 'Colonne "piatto" e "quantità" non trovate. Controlla le intestazioni.' });
      return;
    }

    const newFreq: Record<string, number> = {};
    let matched = 0; let unmatched = 0;
    let periodStart = ''; let periodEnd = '';

    rows.slice(1).forEach(row => {
      const rawName = row[nameIdx]?.trim();
      const rawQty  = row[qtyIdx]?.toString().replace(',', '.').trim();
      if (!rawName || !rawQty) return;
      const qty = parseInt(rawQty);
      if (isNaN(qty)) return;
      if (dateStartIdx >= 0 && !periodStart) periodStart = row[dateStartIdx]?.trim() ?? '';
      if (dateEndIdx   >= 0 && !periodEnd)   periodEnd   = row[dateEndIdx]?.trim()   ?? '';
      // Match case-insensitive contro menu
      const match = allDishes.find(d => d.name.toLowerCase() === rawName.toLowerCase());
      if (match) { newFreq[match.name] = (newFreq[match.name] ?? 0) + qty; matched++; }
      else unmatched++;
    });

    setFrequencies(prev => ({ ...prev, ...newFreq }));
    const period = periodStart && periodEnd ? `${periodStart} → ${periodEnd}` : fileName;
    setFreqPeriodLabel(period);
    const msg = `✅ ${matched} piatti abbinati${unmatched > 0 ? ` · ${unmatched} righe non abbinate` : ''}`;
    setFreqImportMsg({ type: 'ok', msg });
    setTimeout(() => setFreqImportMsg(null), 6000);
  }, [allDishes]);

  const handleFreqFile = useCallback((file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    setFreqImportMsg({ type: 'info', msg: `Caricamento ${file.name}...` });

    const parseText = (text: string) => {
      const sep = text.includes(';') ? ';' : (text.includes('\t') ? '\t' : ',');
      const rows = text.split('\n').filter(r => r.trim())
        .map(r => r.split(sep).map(c => c.replace(/^"|"$/g, '').trim()));
      parseFreqRows(rows, file.name);
    };

    if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
      const reader = new FileReader();
      reader.onload = ev => parseText(ev.target?.result as string);
      reader.readAsText(file, 'UTF-8');
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const XLSX = (window as any).XLSX;
          if (!XLSX) { setFreqImportMsg({ type: 'err', msg: 'Libreria Excel non disponibile. Usa CSV.' }); return; }
          const data = new Uint8Array(ev.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
          parseFreqRows(rows, file.name);
        } catch { setFreqImportMsg({ type: 'err', msg: 'Errore lettura Excel. Prova CSV.' }); }
      };
      reader.readAsArrayBuffer(file);
    } else if (ext === 'json') {
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const json = JSON.parse(ev.target?.result as string);
          const arr: string[][] = [];
          if (Array.isArray(json) && json.length > 0) {
            arr.push(Object.keys(json[0]));
            json.forEach((row: any) => arr.push(Object.values(row).map(String)));
          }
          parseFreqRows(arr, file.name);
        } catch { setFreqImportMsg({ type: 'err', msg: 'JSON non valido.' }); }
      };
      reader.readAsText(file, 'UTF-8');
    } else {
      setFreqImportMsg({ type: 'err', msg: `Formato .${ext} non supportato. Usa CSV, XLSX, XLS o JSON.` });
    }
  }, [parseFreqRows]);

  const handleFreqInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFreqFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFreqFile(file);
  };

  // ── STATISTICHE RIEPILOGATIVE ─────────────────────────────────
  const dishesWithCost = allDishes.filter(d => !d.hasMissingCosts);
  const avgFoodCost = dishesWithCost.length > 0
    ? dishesWithCost.reduce((s, d) => s + d.foodCostPct, 0) / dishesWithCost.length : 0;
  const avgMargin   = dishesWithCost.length > 0
    ? dishesWithCost.reduce((s, d) => s + d.marginPct, 0) / dishesWithCost.length : 0;
  const topDish     = [...dishesWithCost].sort((a, b) => b.marginPct - a.marginPct)[0];
  const topScore    = [...allDishes.filter(d => d.score != null)].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
  const missingCount = allDishes.filter(d => d.hasMissingCosts).length;

  // ── HELPER COLORI MARGINE ─────────────────────────────────────
  const marginColor = (pct: number) => {
    if (pct >= 65) return 'text-emerald-600 dark:text-emerald-400';
    if (pct >= 45) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };
  const marginBadge = (pct: number) => {
    if (pct >= 65) return isDinner ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-700';
    if (pct >= 45) return isDinner ? 'bg-amber-500/15 text-amber-400'    : 'bg-amber-50 text-amber-700';
    return isDinner ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-50 text-rose-700';
  };

  // ── COLONNE SORT HEADER ────────────────────────────────────────
  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => toggleSort(k)}
      className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors ${sortKey === k ? accent : mutedText} hover:${accent}`}
    >
      {label}
      <ArrowUpDown className="w-3 h-3 opacity-60" />
    </button>
  );

  // ── RIGA ESPANDIBILE ──────────────────────────────────────────
  const renderDishRow = (dish: DishMargin) => {
    const isOpen = expandedDish === dish.name;
    const dishRecipe = recipes[dish.name] || [];
    return (
      <div key={dish.name} className={`border-b last:border-0 ${dividerCls} transition-colors`}>
        <div
          className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none ${rowHover} transition-colors`}
          onClick={() => setExpandedDish(isOpen ? null : dish.name)}
        >
          {/* Nome */}
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-semibold truncate ${textColor}`}>{dish.name}</div>
            <div className={`text-xs ${mutedText} truncate`}>{dish.category}</div>
          </div>
          {/* Prezzo netto */}
          <div className="hidden sm:block w-20 text-right">
            <div className={`text-sm font-mono ${textColor}`}>€{dish.priceNet.toFixed(2)}</div>
            <div className={`text-[10px] ${mutedText}`}>netto IVA</div>
          </div>
          {/* Costo ingredienti */}
          <div className="hidden md:block w-20 text-right">
            {dish.hasMissingCosts ? (
              <span className={`text-xs flex items-center justify-end gap-1 ${mutedText}`}>
                <AlertCircle className="w-3 h-3 text-amber-500" /> —
              </span>
            ) : (
              <>
                <div className={`text-sm font-mono ${textColor}`}>€{dish.ingredientCost.toFixed(2)}</div>
                <div className={`text-[10px] ${mutedText}`}>food cost</div>
              </>
            )}
          </div>
          {/* Food cost % */}
          <div className="w-16 text-right">
            {dish.hasMissingCosts ? (
              <span className={`text-xs ${mutedText}`}>—</span>
            ) : (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${marginBadge(100 - dish.foodCostPct)}`}>
                {dish.foodCostPct.toFixed(0)}%
              </span>
            )}
          </div>
          {/* Margine % */}
          <div className="w-20 text-right">
            {dish.hasMissingCosts ? (
              <span className={`text-xs ${mutedText}`}>—</span>
            ) : (
              <div className={`text-sm font-bold ${marginColor(dish.marginPct)}`}>
                {dish.marginPct.toFixed(1)}%
              </div>
            )}
          </div>
          {/* Frequenza */}
          {Object.keys(frequencies).length > 0 && (
            <div className="hidden lg:block w-16 text-right">
              <div className={`text-sm font-mono ${textColor}`}>{dish.frequency ?? '—'}</div>
              <div className={`text-[10px] ${mutedText}`}>ordini</div>
            </div>
          )}
          {/* Score */}
          {Object.keys(frequencies).length > 0 && (
            <div className="hidden lg:block w-20 text-right">
              {dish.score != null ? (
                <div className={`text-sm font-bold ${accent}`}>{dish.score.toFixed(0)}</div>
              ) : (
                <span className={`text-xs ${mutedText}`}>—</span>
              )}
            </div>
          )}
          {/* Chevron */}
          <div className={`w-5 ${mutedText}`}>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {/* Dettaglio espanso */}
        {isOpen && (
          <div className={`px-4 pb-4 pt-1 ${isDinner ? 'bg-[#0F172A]/60' : 'bg-[#F4F1EA]/40'}`}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Prezzo lordo', val: `€${dish.priceGross.toFixed(2)}`, sub: `IVA ${(dish.ivaRate * 100).toFixed(0)}%` },
                { label: 'Prezzo netto', val: `€${dish.priceNet.toFixed(2)}`, sub: 'base di calcolo' },
                { label: 'Costo ingredienti', val: dish.hasMissingCosts ? '—' : `€${dish.ingredientCost.toFixed(2)}`, sub: dish.hasMissingCosts ? 'costi mancanti' : `FC ${dish.foodCostPct.toFixed(1)}%` },
                { label: 'Margine netto', val: dish.hasMissingCosts ? '—' : `€${dish.marginNet.toFixed(2)}`, sub: dish.hasMissingCosts ? '—' : `${dish.marginPct.toFixed(1)}%` },
              ].map(({ label, val, sub }) => (
                <div key={label} className={`p-3 rounded-lg border ${cardBg}`}>
                  <div className={`text-[10px] uppercase tracking-wider ${mutedText}`}>{label}</div>
                  <div className={`text-base font-bold mt-0.5 ${textColor}`}>{val}</div>
                  <div className={`text-[10px] ${mutedText}`}>{sub}</div>
                </div>
              ))}
            </div>

            {/* Ingredienti della ricetta */}
            {dishRecipe.length === 0 ? (
              <p className={`text-xs ${mutedText} italic`}>Nessuna ricetta inserita. Aggiungi gli ingredienti nella sezione Inventario.</p>
            ) : (
              <div className="space-y-2">
                <div className={`text-xs font-semibold uppercase tracking-wider ${mutedText} mb-1`}>Ingredienti ricetta</div>
                {dishRecipe.map(row => {
                  const isPrep = row.ingredientId.startsWith('prep:');
                  const prep = isPrep ? preparations.find(p => p.id === row.ingredientId.replace('prep:', '')) : null;
                  const ing = !isPrep ? ingredients.find(i => i.id === row.ingredientId) : null;
                  if (!ing && !prep) return null;

                  const displayName = isPrep ? prep!.name : ing!.name;
                  const baseUnit = isPrep ? prep!.yieldUnit : ing!.unit;
                  const pricePerUnit = isPrep ? null : calcWAC(ing!);
                  const isManual = !isPrep && ing!.manualPricePerUnit != null && ing!.manualPricePerUnit > 0;
                  const hasWAC = !isPrep && !isManual && ing!.purchaseHistory && ing!.purchaseHistory.length > 0;

                  const effectivePpp = row.portionsPerPiece ?? (row.pcs_yield ? row.pcs_yield : undefined);
                  const isPiece = isPieceUnit(baseUnit);

                  let costRow: number | null = null;
                  let qtyLabel = '';

                  if (isPrep) {
                    // Calcola costo prep per unità di resa
                    let prepCost = 0; let prepMissing = false;
                    prep!.ingredients.forEach(pr => {
                      const pi = ingredients.find(i => i.id === pr.ingredientId);
                      if (!pi) { prepMissing = true; return; }
                      const ppu = calcWAC(pi);
                      if (ppu == null) { prepMissing = true; return; }
                      if (pr.portionsPerPiece && pr.portionsPerPiece > 0) { prepCost += ppu / pr.portionsPerPiece; }
                      else { prepCost += ppu * toBaseQty(pr.qty, pr.unit ?? pi.unit, pi.unit); }
                    });
                    const cpyu = prepMissing ? null : prepCost / prep!.yieldQty;
                    if (effectivePpp && effectivePpp > 0) {
                      qtyLabel = effectivePpp >= 1 ? `1 ${baseUnit} → ${effectivePpp} porz.` : `${(1/effectivePpp).toFixed(2)} ${baseUnit} → 1 porz.`;
                      if (cpyu != null) costRow = cpyu / effectivePpp;
                    } else {
                      const rowUnit = row.unit ?? baseUnit;
                      const qtyInBase = toBaseQty(row.qty, rowUnit, baseUnit);
                      qtyLabel = `${row.qty}${rowUnit}`;
                      if (cpyu != null) costRow = cpyu * qtyInBase;
                    }
                  } else if (isPiece && effectivePpp && effectivePpp > 0) {
                    qtyLabel = effectivePpp >= 1 ? `1 ${baseUnit} → ${effectivePpp} porz.` : `${(1/effectivePpp).toFixed(2)} ${baseUnit} → 1 porz.`;
                    if (pricePerUnit != null) costRow = pricePerUnit / effectivePpp;
                  } else {
                    const rowUnit = row.unit ?? baseUnit;
                    qtyLabel = `${row.qty}${rowUnit}`;
                    if (pricePerUnit != null) costRow = pricePerUnit * toBaseQty(row.qty, rowUnit, baseUnit);
                  }

                  const isEditing = !isPrep && editingIngId === ing!.id;

                  return (
                    <div key={row.ingredientId} className={`flex items-center gap-3 p-2.5 rounded-lg border ${isDinner ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#EAE5DA]'}`}>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-medium ${textColor}`}>{displayName}</span>
                        {isPrep && <span className={`ml-1 text-[10px] text-[#967D62]`}>(prep.)</span>}
                        <span className={`ml-2 text-xs ${mutedText}`}>{qtyLabel}</span>
                      </div>
                      {/* Prezzo per unità: editabile inline solo per ingredienti normali */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <span className={`text-xs ${mutedText}`}>€/</span>
                            <Input
                              type="number"
                              step="0.001"
                              value={editingPrice}
                              onChange={e => setEditingPrice(e.target.value)}
                              className={`w-24 h-7 text-xs ${inputCls}`}
                              autoFocus
                              onKeyDown={e => { if (e.key === 'Enter') saveManualPrice(ing!.id); if (e.key === 'Escape') setEditingIngId(null); }}
                            />
                            <span className={`text-xs ${mutedText}`}>{ing.unit}</span>
                            <button onClick={() => saveManualPrice(ing.id)} className="text-emerald-500 hover:text-emerald-400"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setEditingIngId(null)} className={`${mutedText} hover:text-rose-400`}><X className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {isPrep ? (
                              <span className={`text-xs font-mono ${mutedText}`}>costo calcolato</span>
                            ) : pricePerUnit != null ? (
                              <span className={`text-xs font-mono ${mutedText}`}>€{pricePerUnit.toFixed(4)}/{ing!.unit}</span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-amber-500">
                                <AlertCircle className="w-3 h-3" /> prezzo mancante
                              </span>
                            )}
                            {isManual && <span className={`text-[10px] px-1.5 py-0.5 rounded ${isDinner ? 'bg-[#967D62]/20 text-[#967D62]' : 'bg-[#967D62]/10 text-[#967D62]'}`}>manuale</span>}
                            {hasWAC && <span className={`text-[10px] px-1.5 py-0.5 rounded ${isDinner ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>WAC ({ing!.purchaseHistory!.length} carichi)</span>}
                            {!isPrep && <button
                              onClick={e => { e.stopPropagation(); setEditingIngId(ing!.id); setEditingPrice(String(pricePerUnit ?? '')); }}
                              className={`${mutedText} hover:${accent} transition-colors`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>}
                          </div>
                        )}
                        {costRow != null && (
                          <span className={`text-xs font-semibold font-mono w-14 text-right ${textColor}`}>€{costRow.toFixed(3)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── RANKING TAB ───────────────────────────────────────────────
  const rankingDishes = [...allDishes]
    .filter(d => d.score != null || d.frequency != null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const maxScore = rankingDishes[0]?.score ?? 1;

  // ================================================================
  // RENDER
  // ================================================================

  return (
    <main className={`flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 w-full max-w-[1400px] mx-auto`}>
      {/* Titolo */}
      <div className="mb-6">
        <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${textColor}`}>Redditività Menu</h1>
        <p className={`${mutedText} mt-1 text-sm`}>Analisi margini, food cost e priorità commerciale dei piatti</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { icon: Percent, label: 'Food cost medio', val: dishesWithCost.length > 0 ? `${avgFoodCost.toFixed(1)}%` : '—', sub: `su ${dishesWithCost.length} piatti con dati` },
          { icon: TrendingUp, label: 'Margine medio', val: dishesWithCost.length > 0 ? `${avgMargin.toFixed(1)}%` : '—', sub: 'piatti con ricette complete' },
          { icon: Euro, label: 'Top margine', val: topDish ? `${topDish.marginPct.toFixed(1)}%` : '—', sub: topDish?.name ?? 'nessun dato' },
          { icon: AlertCircle, label: 'Costi mancanti', val: `${missingCount}`, sub: 'piatti senza prezzo ingredienti', warn: missingCount > 0 },
        ].map(({ icon: Icon, label, val, sub, warn }) => (
          <Card key={label} className={`${cardBg} ${warn && missingCount > 0 ? (isDinner ? 'border-amber-700/50' : 'border-amber-200') : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className={`text-[10px] uppercase tracking-wider font-semibold ${mutedText}`}>{label}</div>
                  <div className={`text-2xl font-bold mt-1 ${warn && missingCount > 0 ? 'text-amber-500' : textColor}`}>{val}</div>
                  <div className={`text-xs mt-0.5 ${mutedText} truncate max-w-[120px]`}>{sub}</div>
                </div>
                <div className={`p-2 rounded-lg ${accentBg}`}>
                  <Icon className={`w-4 h-4 ${warn && missingCount > 0 ? 'text-amber-500' : accent}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* TAB SELECTOR */}
      <div className={`flex gap-1 p-1 rounded-xl border mb-6 w-fit ${isDinner ? 'bg-[#0F172A] border-[#334155]' : 'bg-black/5 border-[#EAE5DA]'}`}>
        {[
          { key: 'margini',  label: 'Analisi Margini', icon: BarChart2 },
          { key: 'ranking',  label: 'Frequenze & Ranking', icon: TrendingUp },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === key
                ? (isDinner ? 'bg-[#967D62] text-white shadow-sm' : 'bg-white text-[#967D62] shadow-sm border border-[#EAE5DA]')
                : `${mutedText} hover:text-[#967D62]`
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ============================================================
          TAB 1 — ANALISI MARGINI
      ============================================================ */}
      {activeTab === 'margini' && (
        <div className="space-y-4">
          {/* Filtri */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className={`w-4 h-4 ${mutedText}`} />
            {([
              { key: 'Tutte',                    label: 'Tutte' },
              { key: 'APPETIZERS',               label: 'Appetizers' },
              { key: 'PASTA',                    label: 'Pasta' },
              { key: 'INSALATE',                 label: 'Insalate' },
              { key: 'SANDWICH DELLA BAIA',      label: 'Sandwich' },
              { key: 'GLI SPECIAL DEL GOLFO',    label: 'Special del Golfo' },
              { key: 'MAINS',                    label: 'Mains' },
              { key: 'SHARING & KIDS MENU',      label: 'Sharing & Kids' },
              { key: 'DOLCI & GELATO',           label: 'Dolci & Gelato' },
              { key: 'COCKTAILS & BEVERAGE',     label: 'Cocktails' },
            ] as { key: string; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setCategoryFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  categoryFilter === key
                    ? 'bg-[#967D62] text-white border-[#967D62]'
                    : (isDinner ? 'border-[#334155] text-[#94A3B8] hover:border-[#967D62]' : 'border-[#EAE5DA] text-[#8C8A85] hover:border-[#967D62]')
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Info costi mancanti */}
          {missingCount > 0 && (
            <div className={`flex items-start gap-3 p-3 rounded-lg border ${isDinner ? 'bg-amber-950/20 border-amber-800/40' : 'bg-amber-50 border-amber-200'}`}>
              <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className={`text-xs ${isDinner ? 'text-amber-300' : 'text-amber-700'}`}>
                <strong>{missingCount} piatti</strong> non hanno ancora tutti i costi inseriti.
                Espandi un piatto e clicca la matita accanto all'ingrediente per aggiungere il prezzo manualmente.
              </p>
            </div>
          )}

          {/* Tabella */}
          <Card className={cardBg}>
            {/* Header colonne */}
            <div className={`flex items-center gap-3 px-4 py-2.5 border-b ${dividerCls} ${isDinner ? 'bg-[#0F172A]/40' : 'bg-[#F4F1EA]/40'} rounded-t-xl`}>
              <div className="flex-1"><SortBtn k="name" label="Piatto" /></div>
              <div className="hidden sm:block w-20 text-right"><span className={`text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Netto €</span></div>
              <div className="hidden md:block w-20 text-right"><span className={`text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Costo ing.</span></div>
              <div className="w-16 text-right"><SortBtn k="foodCostPct" label="FC%" /></div>
              <div className="w-20 text-right"><SortBtn k="marginPct" label="Margine" /></div>
              {Object.keys(frequencies).length > 0 && (
                <div className="hidden lg:block w-16 text-right"><SortBtn k="frequency" label="Freq." /></div>
              )}
              {Object.keys(frequencies).length > 0 && (
                <div className="hidden lg:block w-20 text-right"><SortBtn k="score" label="Score" /></div>
              )}
              <div className="w-5" />
            </div>
            <div>
              {sorted.length === 0 ? (
                <div className={`p-12 text-center ${mutedText}`}>Nessun piatto per questa categoria.</div>
              ) : (
                sorted.map(renderDishRow)
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ============================================================
          TAB 2 — FREQUENZE & RANKING
      ============================================================ */}
      {activeTab === 'ranking' && (
        <div className="space-y-6">
          {/* Import frequenze */}
          <Card className={cardBg}>
            <CardHeader className="pb-3">
              <CardTitle className={`flex items-center gap-2 text-base ${textColor}`}>
                <Upload className={`w-4 h-4 ${accent}`} />
                Importa frequenze ordini
              </CardTitle>
              <p className={`text-xs ${mutedText}`}>
                Carica un file dalla cassa o da qualsiasi gestionale. Formati supportati: CSV, XLSX, XLS, JSON, TSV.
                Il file deve avere almeno una colonna <strong>piatto</strong> e una colonna <strong>quantità</strong>.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => freqInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#967D62] bg-[#967D62]/10'
                    : isDinner
                      ? 'border-[#334155] bg-[#0F172A]/40 hover:border-[#967D62]/60'
                      : 'border-[#D1CCC0] bg-[#F4F1EA]/40 hover:border-[#967D62]/60'
                }`}
              >
                <Upload className={`w-8 h-8 ${isDragging ? accent : mutedText}`} />
                <div className="text-center">
                  <p className={`text-sm font-semibold ${textColor}`}>Trascina il file qui o clicca per selezionare</p>
                  <p className={`text-xs mt-1 ${mutedText}`}>CSV · XLSX · XLS · JSON · TSV</p>
                </div>
                <input
                  ref={freqInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.tsv,.txt,.json"
                  onChange={handleFreqInputChange}
                  className="hidden"
                />
              </div>

              {/* Feedback import */}
              {freqImportMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-xs font-medium ${
                  freqImportMsg.type === 'ok'   ? (isDinner ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/40' : 'bg-emerald-50 text-emerald-700 border border-emerald-200') :
                  freqImportMsg.type === 'err'  ? (isDinner ? 'bg-rose-950/30 text-rose-400 border border-rose-800/40'          : 'bg-rose-50 text-rose-700 border border-rose-200') :
                  (isDinner ? 'bg-blue-950/30 text-blue-400 border border-blue-800/40' : 'bg-blue-50 text-blue-700 border border-blue-200')
                }`}>
                  {freqImportMsg.type === 'ok' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Info className="w-3.5 h-3.5 shrink-0" />}
                  {freqImportMsg.msg}
                </div>
              )}

              {/* Periodo rilevato */}
              {freqPeriodLabel && (
                <div className={`flex items-center gap-2 text-xs ${mutedText}`}>
                  <Package className="w-3.5 h-3.5" />
                  Periodo: <span className={`font-semibold ${textColor}`}>{freqPeriodLabel}</span>
                  <button onClick={() => { setFrequencies({}); setFreqPeriodLabel(''); }} className={`ml-auto text-xs text-rose-500 hover:text-rose-400 transition-colors`}>
                    Rimuovi dati
                  </button>
                </div>
              )}

              {/* Formato atteso */}
              <div className={`p-3 rounded-lg border ${isDinner ? 'bg-[#0F172A] border-[#334155]' : 'bg-gray-50 border-[#EAE5DA]'}`}>
                <p className={`text-[10px] font-semibold uppercase tracking-wider ${mutedText} mb-2`}>Esempio formato accettato</p>
                <div className={`font-mono text-xs ${textColor}`}>
                  <div className={`grid grid-cols-3 gap-4 pb-1 mb-1 border-b ${dividerCls} font-bold`}>
                    <span>piatto</span><span>quantità</span><span>dal</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 opacity-70">
                    <span>Bay burger</span><span>142</span><span>01/04</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 opacity-70">
                    <span>Mojito</span><span>89</span><span>01/04</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ranking */}
          {rankingDishes.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-16 ${mutedText}`}>
              <TrendingUp className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">Importa le frequenze per vedere il ranking</p>
              <p className="text-xs mt-1 opacity-70">L'indicatore combina margine % e volume ordini</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-bold uppercase tracking-wider ${textColor}`}>
                  Ranking per potenziale commerciale
                  {topScore && <span className={`ml-2 text-xs font-normal ${mutedText}`}>— periodo: {freqPeriodLabel}</span>}
                </h3>
                <span className={`text-xs ${mutedText}`}>Margine% × Frequenza</span>
              </div>

              {rankingDishes.map((dish, idx) => {
                const barW = maxScore > 0 ? ((dish.score ?? 0) / maxScore) * 100 : 0;
                return (
                  <div key={dish.name} className={`flex items-center gap-4 p-3 rounded-xl border ${cardBg}`}>
                    {/* Rank */}
                    <div className={`w-7 text-center text-sm font-bold ${idx < 3 ? accent : mutedText}`}>
                      {idx + 1}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold ${textColor} truncate`}>{dish.name}</div>
                      <div className="flex items-center gap-3 mt-1">
                        {/* Barra score */}
                        <div className={`flex-1 h-1.5 rounded-full ${isDinner ? 'bg-[#334155]' : 'bg-[#EAE5DA]'}`}>
                          <div
                            className="h-full rounded-full bg-[#967D62] transition-all duration-500"
                            style={{ width: `${barW}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    {/* Stats */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right hidden sm:block">
                        <div className={`text-xs ${mutedText}`}>Margine</div>
                        <div className={`text-sm font-bold ${marginColor(dish.marginPct)}`}>
                          {dish.hasMissingCosts ? '—' : `${dish.marginPct.toFixed(1)}%`}
                        </div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <div className={`text-xs ${mutedText}`}>Ordini</div>
                        <div className={`text-sm font-bold ${textColor}`}>{dish.frequency ?? '—'}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs ${mutedText}`}>Score</div>
                        <div className={`text-base font-bold ${accent}`}>
                          {dish.score != null ? dish.score.toFixed(0) : '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
