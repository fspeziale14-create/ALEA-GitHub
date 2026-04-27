// ================================================================
// ALEA — Redditività Menu
// Componente autonomo. Props ricevute da App.tsx.
// ================================================================

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Upload, AlertCircle, ChevronDown,
  ChevronUp, BarChart2, Pencil, Check, X, Info, Filter,
  ArrowUpDown, PiggyBank, Package, Percent, Euro, Zap, Target, Eye, RefreshCw,
  Calendar, Save, Trash2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Cell } from 'recharts';
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
// Identifica le bevande per separarle dall'analisi food
const isBeverageCategory = (category: string) => category === 'COCKTAILS & BEVERAGE';

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

// ── Snapshot salvato ─────────────────────────────────────────────
interface DishSnapshot {
  name: string;
  category: string;
  score: number | null;
  marginPct: number;
  foodCostPct: number;
  frequency: number;
  priceNet: number;
  ingredientCost: number;
  hasMissingCosts: boolean;
  quadrant: 'stella' | 'promuovi' | 'rivedi' | 'valuta';
}
interface AnalysisSnapshot {
  id: string;
  label: string;
  period_start: string;
  period_end: string;
  created_at: string;
  data: {
    dishes: DishSnapshot[];
    kpi: { avgFoodCost: number; avgMargin: number; topDish: string; missingCount: number };
  };
}

interface MenuProfitabilityProps {
  ingredients: Ingredient[];
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  recipes: Record<string, RecipeRow[]>;
  preparations: Array<{ id: string; name: string; yieldQty: number; yieldUnit: string; ingredients: Array<{ ingredientId: string; qty: number; unit?: string; portionsPerPiece?: number }> }>;
  isDinner: boolean;
  supabase: any;
  isLoggedIn: boolean;
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
  supabase,
  isLoggedIn,
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
  const [activeTab, setActiveTab] = useState<'margini' | 'portfolio' | 'ingredienti' | 'frequenze'>('margini');
  const [categoryFilters, setCategoryFilters] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('marginPct');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedDish, setExpandedDish] = useState<string | null>(null);
  const [hoveredBubble, setHoveredBubble] = useState<string | null>(null);
  // Simulazione riduzione quantità ingrediente (tab ingredienti)
  const [simReductions, setSimReductions] = useState<Record<string, number>>({}); // `dishName|ingId` -> % riduzione (10 o 20)
  const [openIngDishes, setOpenIngDishes] = useState<Set<string>>(new Set()); // dish names open in ingredienti tab

  // Prezzi manuali ingredienti (editing inline)
  const [editingIngId, setEditingIngId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>('');

  // Frequenze importate: { dishName -> count }
  const [frequencies, setFrequencies] = useState<Record<string, number>>({});
  const [freqPeriodLabel, setFreqPeriodLabel] = useState<string>('');
  const [freqImportMsg, setFreqImportMsg] = useState<{ type: 'ok' | 'err' | 'info'; msg: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const freqInputRef = useRef<HTMLInputElement>(null);
  const [bevPortfolioOpen, setBevPortfolioOpen] = useState(false);
  const [bevRankingOpen, setBevRankingOpen] = useState(false);
  const [rankingSort, setRankingSort] = useState<'score' | 'guadagno' | 'ricavo'>('score');

  // ── PERIODO SELEZIONE & SNAPSHOT ─────────────────────────────
  const [periodStart, setPeriodStart] = useState<string | null>(null);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [calendarStep, setCalendarStep] = useState<'start' | 'end'>('start');
  const [snapshots, setSnapshots] = useState<AnalysisSnapshot[]>([]);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Carica snapshots da Supabase al login
  useEffect(() => {
    if (!isLoggedIn) return;
    const load = async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return;
      const { data } = await supabase
        .from('analysis_snapshots')
        .select('*')
        .eq('user_id', userId)
        .order('period_start', { ascending: false });
      if (data) setSnapshots(data as AnalysisSnapshot[]);
    };
    load();
  }, [isLoggedIn]);

  // Chiudi calendario cliccando fuori
  useEffect(() => {
    if (!showCalendar) return;
    const handler = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCalendar]);

  // Date già occupate da snapshot esistenti
  const occupiedRanges = snapshots.map(s => ({ start: s.period_start, end: s.period_end }));

  const isDateOccupied = (dateStr: string): boolean => {
    return occupiedRanges.some(r => dateStr >= r.start && dateStr <= r.end);
  };

  const isDateInSelection = (dateStr: string): boolean => {
    if (!periodStart) return false;
    if (!periodEnd) return dateStr === periodStart;
    return dateStr >= periodStart && dateStr <= periodEnd;
  };

  const handleCalendarDayClick = (dateStr: string) => {
    if (isDateOccupied(dateStr)) return;
    if (calendarStep === 'start') {
      setPeriodStart(dateStr);
      setPeriodEnd(null);
      setCalendarStep('end');
    } else {
      if (dateStr < periodStart!) {
        setPeriodStart(dateStr);
        setCalendarStep('end');
        return;
      }
      // Check no occupied dates in range
      const hasConflict = occupiedRanges.some(r => !(dateStr < r.start || periodStart! > r.end));
      if (hasConflict) return;
      setPeriodEnd(dateStr);
      setShowCalendar(false);
      setCalendarStep('start');
    }
  };

  const periodLabel = periodStart && periodEnd
    ? `${periodStart.split('-').reverse().slice(0,2).join('/')} — ${periodEnd.split('-').reverse().slice(0,2).join('/')}`
    : null;

  // Determina quadrante di un piatto
  const getQuadrantForSnapshot = (dish: DishMargin, medianFreq: number, medianMargin: number): 'stella' | 'promuovi' | 'rivedi' | 'valuta' => {
    const freq = dish.frequency ?? 0;
    const margin = dish.marginPct;
    if (freq >= medianFreq && margin >= medianMargin) return 'stella';
    if (freq < medianFreq && margin >= medianMargin) return 'promuovi';
    if (freq >= medianFreq && margin < medianMargin) return 'rivedi';
    return 'valuta';
  };

  const handleSaveSnapshot = async () => {
    if (!periodStart || !periodEnd || !isLoggedIn) return;
    setSavingSnapshot(true);
    setSaveMsg(null);
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('Utente non trovato');

      // Calcola mediane per quadranti
      const dishesWithFreq = foodDishes.filter(d => (d.frequency ?? 0) > 0 && !d.hasMissingCosts);
      const freqs = dishesWithFreq.map(d => d.frequency ?? 0).sort((a, b) => a - b);
      const margins = dishesWithFreq.map(d => d.marginPct).sort((a, b) => a - b);
      const medianFreq = freqs.length ? freqs[Math.floor(freqs.length / 2)] : 0;
      const medianMargin = margins.length ? margins[Math.floor(margins.length / 2)] : 0;

      const dishSnapshots: DishSnapshot[] = allDishes.map(d => ({
        name: d.name,
        category: d.category,
        score: d.score ?? null,
        marginPct: d.marginPct,
        foodCostPct: d.foodCostPct,
        frequency: d.frequency ?? 0,
        priceNet: d.priceNet,
        ingredientCost: d.ingredientCost,
        hasMissingCosts: d.hasMissingCosts,
        quadrant: getQuadrantForSnapshot(d, medianFreq, medianMargin),
      }));

      const withCosts = allDishes.filter(d => !d.hasMissingCosts);
      const kpi = {
        avgFoodCost: withCosts.length ? withCosts.reduce((s, d) => s + d.foodCostPct, 0) / withCosts.length : 0,
        avgMargin: withCosts.length ? withCosts.reduce((s, d) => s + d.marginPct, 0) / withCosts.length : 0,
        topDish: withCosts.sort((a, b) => b.marginPct - a.marginPct)[0]?.name ?? '—',
        missingCount: allDishes.filter(d => d.hasMissingCosts).length,
      };

      // Serializza le ricette attuali nello snapshot
      // Salviamo solo i piatti che hanno almeno una riga ricetta
      const recipesSnapshot: Record<string, any[]> = {};
      Object.entries(recipes as Record<string, any[]>).forEach(([dish, rows]) => {
        if (rows && rows.length > 0) recipesSnapshot[dish] = rows;
      });

      const snapshot = {
        user_id: userId,
        label: periodLabel!,
        period_start: periodStart,
        period_end: periodEnd,
        data: { dishes: dishSnapshots, kpi, recipes: recipesSnapshot },
      };

      const { data: saved, error } = await supabase
        .from('analysis_snapshots')
        .insert(snapshot)
        .select()
        .single();

      if (error) throw error;

      // Scala magazzino: scala currentQty in base alle frequenze
      setIngredients((prev: Ingredient[]) => {
        const updated = [...prev];
        allDishes.forEach(dish => {
          const freq = dish.frequency ?? 0;
          if (freq === 0) return;
          const rows = (recipes as any)[dish.name] || [];
          rows.forEach((row: any) => {
            if (row.ingredientId.startsWith('prep:')) return; // skip prep per ora
            const idx = updated.findIndex(i => i.id === row.ingredientId);
            if (idx === -1) return;
            const ing = updated[idx];
            if (isPieceUnit(ing.unit)) {
              if (row.portionsPerPiece && row.portionsPerPiece > 0) {
                const consumed = freq / row.portionsPerPiece;
                updated[idx] = { ...ing, currentQty: Math.max(0, ing.currentQty - consumed) };
              }
            } else {
              const qtyInBase = toBaseQty(row.qty, row.unit ?? ing.unit, ing.unit);
              const consumed = qtyInBase * freq;
              updated[idx] = { ...ing, currentQty: Math.max(0, ing.currentQty - consumed) };
            }
          });
        });
        return updated;
      });

      setSnapshots(prev => [saved as AnalysisSnapshot, ...prev]);
      setFrequencies({});
      setFreqPeriodLabel('');
      setPeriodStart(null);
      setPeriodEnd(null);
      setSaveMsg({ type: 'ok', msg: 'Analisi salvata e magazzino aggiornato.' });
    } catch (err: any) {
      setSaveMsg({ type: 'err', msg: `Errore: ${err.message}` });
    } finally {
      setSavingSnapshot(false);
    }
  };

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

  // ── SPLIT FOOD / BEVANDE ─────────────────────────────────────
  const foodDishes     = allDishes.filter(d => !isBeverageCategory(d.category));
  const beverageDishes = allDishes.filter(d =>  isBeverageCategory(d.category));

  // ── FILTRO + SORT ─────────────────────────────────────────────
  // Se il filtro attivo include Cocktails, mostra anche le bevande
  // altrimenti usa solo foodDishes
  const hasBevFilter = categoryFilters.has('COCKTAILS & BEVERAGE');
  const filtered = (hasBevFilter ? allDishes : foodDishes).filter(d =>
    categoryFilters.size === 0 || categoryFilters.has(d.category)
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
  // KPI calcolati sui piatti filtrati (escluso costi mancanti che resta su tutti)
  const dishesWithCost = filtered.filter(d => !d.hasMissingCosts);
  const avgFoodCost = dishesWithCost.length > 0
    ? dishesWithCost.reduce((s, d) => s + d.foodCostPct, 0) / dishesWithCost.length : 0;
  const avgMargin   = dishesWithCost.length > 0
    ? dishesWithCost.reduce((s, d) => s + d.marginPct, 0) / dishesWithCost.length : 0;
  const topDish     = [...dishesWithCost].sort((a, b) => b.marginPct - a.marginPct)[0];
  const topScore    = [...allDishes.filter(d => d.score != null)].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
  const missingCount = foodDishes.filter(d => d.hasMissingCosts).length;

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
  const getRankingValue = (d: DishMargin, sort: 'score' | 'guadagno' | 'ricavo') => {
    if (sort === 'score')    return d.score ?? 0;
    if (sort === 'ricavo')   return d.priceNet * (d.frequency ?? 0);
    // guadagno netto = (prezzo - costo ingredienti) * frequenza
    return (d.priceNet - d.ingredientCost) * (d.frequency ?? 0);
  };
  const rankingDishes = [...foodDishes]
    .filter(d => d.score != null || d.frequency != null)
    .sort((a, b) => getRankingValue(b, rankingSort) - getRankingValue(a, rankingSort));
  const rankingBeverages = [...beverageDishes]
    .filter(d => d.score != null || d.frequency != null)
    .sort((a, b) => getRankingValue(b, rankingSort) - getRankingValue(a, rankingSort));
  const maxRankingValue = rankingDishes[0] ? getRankingValue(rankingDishes[0], rankingSort) : 1;

  // ── QUADRANTI PORTFOLIO ───────────────────────────────────────
  // Solo piatti FOOD con frequenza E margine calcolato (bevande separate)
  const portfolioDishes = foodDishes.filter(d => d.frequency != null && !d.hasMissingCosts);
  const beveragePortfolioDishes = beverageDishes.filter(d => d.frequency != null && !d.hasMissingCosts);
  const medianFreq = (() => {
    const sorted = [...portfolioDishes].sort((a, b) => (a.frequency ?? 0) - (b.frequency ?? 0));
    if (sorted.length === 0) return 0;
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? ((sorted[mid-1].frequency! + sorted[mid].frequency!) / 2) : sorted[mid].frequency!;
  })();
  const medianMargin = (() => {
    const sorted = [...portfolioDishes].sort((a, b) => a.marginPct - b.marginPct);
    if (sorted.length === 0) return 0;
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? ((sorted[mid-1].marginPct + sorted[mid].marginPct) / 2) : sorted[mid].marginPct;
  })();

  const getQuadrant = (d: DishMargin): 'stelle' | 'spingere' | 'rivedere' | 'valutare' => {
    const hiFreq = (d.frequency ?? 0) >= medianFreq;
    const hiMargin = d.marginPct >= medianMargin;
    if (hiFreq && hiMargin) return 'stelle';
    if (!hiFreq && hiMargin) return 'spingere';
    if (hiFreq && !hiMargin) return 'rivedere';
    return 'valutare';
  };

  const quadrantMeta = {
    stelle:   { label: 'Stelle',           color: 'text-emerald-500', bg: isDinner ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200', desc: 'Alto margine, alta frequenza — da tenere così', icon: '⭐' },
    spingere: { label: 'Da promuovere',    color: 'text-blue-500',    bg: isDinner ? 'bg-blue-500/10 border-blue-500/30'       : 'bg-blue-50 border-blue-200',       desc: 'Alto margine, poca visibilità — da comunicare di più', icon: '📣' },
    rivedere: { label: 'Da rivedere',      color: 'text-amber-500',   bg: isDinner ? 'bg-amber-500/10 border-amber-500/30'     : 'bg-amber-50 border-amber-200',     desc: 'Molto venduto ma margine basso — porzioni o costi', icon: '🔧' },
    valutare: { label: 'Da valutare',      color: 'text-rose-500',    bg: isDinner ? 'bg-rose-500/10 border-rose-500/30'       : 'bg-rose-50 border-rose-200',       desc: 'Basso margine e poche vendite — considerare revisione', icon: '❓' },
  };

  // Dati per grafico a bolle
  const bubbleData = portfolioDishes.map(d => ({
    name: d.name,
    x: d.frequency ?? 0,
    y: Math.round(d.marginPct * 10) / 10,
    z: Math.max(d.score ?? 1, 1),
    quadrant: getQuadrant(d),
    marginNet: d.marginNet,
    ingredientCost: d.ingredientCost,
  }));

  const bubbleColors: Record<string, string> = {
    stelle: '#10b981', spingere: '#3b82f6', rivedere: '#f59e0b', valutare: '#ef4444'
  };

  // Bevande ordinate per frequenza (solo ranking, no quadranti)
  const beverageByFreq = [...beverageDishes]
    .filter(d => (d.frequency ?? 0) > 0)
    .sort((a, b) => (b.frequency ?? 0) - (a.frequency ?? 0));

  // ── ANALISI INGREDIENTI (piatti "da rivedere") ────────────────
  const rivisitaDishes = portfolioDishes.filter(d => getQuadrant(d) === 'rivedere');

  // Per ogni piatto da rivedere, calcola il peso % di ogni ingrediente sul food cost
  const getIngBreakdown = (dishName: string) => {
    const rows = recipes[dishName] || [];
    const result: Array<{
      id: string; name: string; unit: string;
      costRow: number; pct: number; qty: number; rowUnit: string;
      isPrep: boolean;
    }> = [];
    let total = 0;
    rows.forEach(row => {
      const isPrep = row.ingredientId.startsWith('prep:');
      const prep = isPrep ? preparations.find(p => p.id === row.ingredientId.replace('prep:', '')) : null;
      const ing = !isPrep ? ingredients.find(i => i.id === row.ingredientId) : null;
      if (!ing && !prep) return;
      const ppu = isPrep ? null : calcWAC(ing!);
      const effectivePpp = row.portionsPerPiece ?? row.pcs_yield;
      let cost = 0;
      if (isPrep && prep) {
        let pc = 0; let pm = false;
        prep.ingredients.forEach(pr => {
          const pi = ingredients.find(i => i.id === pr.ingredientId);
          if (!pi) { pm = true; return; }
          const ppu2 = calcWAC(pi); if (!ppu2) { pm = true; return; }
          if (pr.portionsPerPiece && pr.portionsPerPiece > 0) pc += ppu2 / pr.portionsPerPiece;
          else pc += ppu2 * toBaseQty(pr.qty, pr.unit ?? pi.unit, pi.unit);
        });
        if (!pm) {
          const cpyu = pc / prep.yieldQty;
          if (effectivePpp && effectivePpp > 0) cost = cpyu / effectivePpp;
          else cost = cpyu * toBaseQty(row.qty, row.unit ?? prep.yieldUnit, prep.yieldUnit);
        }
      } else if (ppu != null) {
        if (effectivePpp && effectivePpp > 0) cost = ppu / effectivePpp;
        else cost = ppu * toBaseQty(row.qty, row.unit ?? ing!.unit, ing!.unit);
      }
      total += cost;
      result.push({
        id: isPrep ? row.ingredientId : ing!.id,
        name: isPrep ? prep!.name : ing!.name,
        unit: isPrep ? prep!.yieldUnit : ing!.unit,
        costRow: cost,
        pct: 0,
        qty: row.qty,
        rowUnit: row.unit ?? (isPrep ? prep!.yieldUnit : ing!.unit),
        isPrep,
      });
    });
    return result.map(r => ({ ...r, pct: total > 0 ? (r.costRow / total) * 100 : 0 }))
                 .sort((a, b) => b.costRow - a.costRow);
  };

  // Calcola risparmio simulato per riduzione quantità
  const simCost = (dishName: string, ingId: string, reduction: number): number => {
    const dish = allDishes.find(d => d.name === dishName);
    if (!dish) return 0;
    const rows = recipes[dishName] || [];
    let total = 0;
    rows.forEach(row => {
      const isPrep = row.ingredientId.startsWith('prep:');
      const prep = isPrep ? preparations.find(p => p.id === row.ingredientId.replace('prep:', '')) : null;
      const ing = !isPrep ? ingredients.find(i => i.id === row.ingredientId) : null;
      if (!ing && !prep) return;
      const ppu = isPrep ? null : calcWAC(ing!);
      const effectivePpp = row.portionsPerPiece ?? row.pcs_yield;
      const mult = row.ingredientId === ingId ? (1 - reduction / 100) : 1;
      let cost = 0;
      if (isPrep && prep) {
        let pc = 0; let pm = false;
        prep.ingredients.forEach(pr => {
          const pi = ingredients.find(i => i.id === pr.ingredientId);
          if (!pi) { pm = true; return; }
          const ppu2 = calcWAC(pi); if (!ppu2) { pm = true; return; }
          if (pr.portionsPerPiece && pr.portionsPerPiece > 0) pc += ppu2 / pr.portionsPerPiece;
          else pc += ppu2 * toBaseQty(pr.qty, pr.unit ?? pi.unit, pi.unit);
        });
        if (!pm) {
          const cpyu = pc / prep.yieldQty;
          if (effectivePpp && effectivePpp > 0) cost = (cpyu / effectivePpp) * mult;
          else cost = cpyu * toBaseQty(row.qty, row.unit ?? prep.yieldUnit, prep.yieldUnit) * mult;
        }
      } else if (ppu != null) {
        if (effectivePpp && effectivePpp > 0) cost = (ppu / effectivePpp) * mult;
        else cost = ppu * toBaseQty(row.qty, row.unit ?? ing!.unit, ing!.unit) * mult;
      }
      total += cost;
    });
    return total;
  };

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

      {/* TAB SELECTOR — griglia sempre a piena larghezza, 2x2 mobile, 1x4 desktop */}
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 rounded-xl border mb-6 w-full ${isDinner ? 'bg-[#0F172A] border-[#334155]' : 'bg-black/5 border-[#EAE5DA]'}`}>
        {[
          { key: 'margini',     label: 'Analisi Margini',  icon: BarChart2 },
          { key: 'frequenze',   label: 'Frequenze',         icon: TrendingUp },
          { key: 'portfolio',   label: 'Portfolio',         icon: Target },
          { key: 'ingredienti', label: 'Ingredienti',       icon: Package },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center justify-center gap-2 px-2 py-2.5 rounded-lg text-sm font-semibold transition-all w-full ${
              activeTab === key
                ? (isDinner ? 'bg-[#967D62] text-white shadow-sm' : 'bg-white text-[#967D62] shadow-sm border border-[#EAE5DA]')
                : `${mutedText} hover:text-[#967D62]`
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ============================================================
          TAB 1 — ANALISI MARGINI
      ============================================================ */}
      {activeTab === 'margini' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className={`w-4 h-4 ${mutedText}`} />
            {([
              { key: 'Tutte', label: 'Tutte' },
              { key: 'APPETIZERS', label: 'Appetizers' },
              { key: 'PASTA', label: 'Pasta' },
              { key: 'INSALATE', label: 'Insalate' },
              { key: 'SANDWICH DELLA BAIA', label: 'Sandwich' },
              { key: 'GLI SPECIAL DEL GOLFO', label: 'Special del Golfo' },
              { key: 'MAINS', label: 'Mains' },
              { key: 'SHARING & KIDS MENU', label: 'Sharing & Kids' },
              { key: 'DOLCI & GELATO', label: 'Dolci & Gelato' },
              { key: 'COCKTAILS & BEVERAGE', label: 'Cocktails' },
            ] as { key: string; label: string }[]).map(({ key, label }) => {
              const isTutte = key === 'Tutte';
              const isActive = isTutte
                ? categoryFilters.size === 0
                : categoryFilters.has(key);
              return (
                <button key={key} onClick={() => {
                  if (isTutte) {
                    setCategoryFilters(new Set());
                  } else {
                    setCategoryFilters(prev => {
                      const next = new Set(prev);
                      if (next.has(key)) next.delete(key);
                      else next.add(key);
                      return next;
                    });
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  isActive ? 'bg-[#967D62] text-white border-[#967D62]'
                    : (isDinner ? 'border-[#334155] text-[#94A3B8] hover:border-[#967D62]' : 'border-[#EAE5DA] text-[#8C8A85] hover:border-[#967D62]')
                }`}>{label}</button>
              );
            })}
          </div>
          {missingCount > 0 && (
            <div className={`flex items-start gap-3 p-3 rounded-lg border ${isDinner ? 'bg-amber-950/20 border-amber-800/40' : 'bg-amber-50 border-amber-200'}`}>
              <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className={`text-xs ${isDinner ? 'text-amber-300' : 'text-amber-700'}`}>
                <strong>{missingCount} piatti</strong> non hanno ancora tutti i costi inseriti.
                Espandi un piatto e clicca la matita accanto all'ingrediente per aggiungere il prezzo manualmente.
              </p>
            </div>
          )}
          <Card className={cardBg}>
            <div className={`flex items-center gap-3 px-4 py-2.5 border-b ${dividerCls} ${isDinner ? 'bg-[#0F172A]/40' : 'bg-[#F4F1EA]/40'} rounded-t-xl`}>
              <div className="flex-1"><SortBtn k="name" label="Piatto" /></div>
              <div className="hidden sm:block w-20 text-right"><span className={`text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Netto €</span></div>
              <div className="hidden md:block w-20 text-right"><span className={`text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Costo ing.</span></div>
              <div className="w-16 text-right"><SortBtn k="foodCostPct" label="FC%" /></div>
              <div className="w-20 text-right"><SortBtn k="marginPct" label="Margine" /></div>
              {Object.keys(frequencies).length > 0 && <div className="hidden lg:block w-16 text-right"><SortBtn k="frequency" label="Freq." /></div>}
              {Object.keys(frequencies).length > 0 && <div className="hidden lg:block w-20 text-right"><SortBtn k="score" label="Score" /></div>}
              <div className="w-5" />
            </div>
            <div>
              {sorted.length === 0
                ? <div className={`p-12 text-center ${mutedText}`}>Nessun piatto per questa categoria.</div>
                : sorted.map(renderDishRow)}
            </div>
          </Card>
        </div>
      )}

      {/* ============================================================
          TAB 2 — PORTFOLIO (Grafico a bolle + Quadranti)
      ============================================================ */}
      {activeTab === 'portfolio' && (
        <div className="space-y-6">
          {portfolioDishes.length < 3 ? (
            <div className={`flex flex-col items-center justify-center py-16 ${mutedText}`}>
              <Target className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">Importa le frequenze per vedere il portfolio</p>
              <p className="text-xs mt-1 opacity-70">Serve almeno la frequenza di vendita e i costi degli ingredienti</p>
            </div>
          ) : (
            <>
              {/* Grafico a bolle */}
              <Card className={cardBg}>
                <CardHeader className="pb-2">
                  <CardTitle className={`text-base ${textColor}`}>Portfolio piatti</CardTitle>
                  <p className={`text-xs ${mutedText}`}>
                    Asse X = frequenza vendita · Asse Y = margine netto % · Dimensione bolla = contributo totale al risultato
                    {medianFreq > 0 && <span className="ml-2">· Soglie: freq. mediana {medianFreq.toFixed(0)} · margine mediano {medianMargin.toFixed(1)}%</span>}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-[380px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDinner ? '#334155' : '#EAE5DA'} />
                        <XAxis
                          dataKey="x" type="number" name="Frequenza"
                          label={{ value: 'Frequenza ordini', position: 'insideBottom', offset: -10, fill: isDinner ? '#94A3B8' : '#8C8A85', fontSize: 11 }}
                          tick={{ fill: isDinner ? '#94A3B8' : '#8C8A85', fontSize: 11 }}
                        />
                        <YAxis
                          dataKey="y" type="number" name="Margine %"
                          label={{ value: 'Margine %', angle: -90, position: 'insideLeft', offset: 15, fill: isDinner ? '#94A3B8' : '#8C8A85', fontSize: 11 }}
                          tick={{ fill: isDinner ? '#94A3B8' : '#8C8A85', fontSize: 11 }}
                        />
                        <ZAxis dataKey="z" range={[40, 400]} />
                        {/* Linee soglia */}
                        <line x1="0%" x2="100%" y1={`${100 - ((medianMargin - 0) / 100) * 100}%`} y2={`${100 - ((medianMargin - 0) / 100) * 100}%`} stroke="#967D62" strokeDasharray="4 4" strokeOpacity={0.4} />
                        <Tooltip
                          cursor={{ strokeDasharray: '3 3' }}
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload;
                            const meta = quadrantMeta[d.quadrant as keyof typeof quadrantMeta];
                            return (
                              <div className={`p-3 rounded-xl border shadow-lg text-xs ${isDinner ? 'bg-[#1E293B] border-[#334155] text-[#F4F1EA]' : 'bg-white border-[#EAE5DA] text-[#2C2A28]'}`}>
                                <p className="font-bold text-sm mb-1">{d.name}</p>
                                <p className={meta.color}>{meta.icon} {meta.label}</p>
                                <p className={mutedText}>Margine: <span className={textColor}>{d.y}%</span></p>
                                <p className={mutedText}>Frequenza: <span className={textColor}>{d.x}</span></p>
                                <p className={mutedText}>Score: <span className="text-[#967D62] font-bold">{d.z.toFixed(0)}</span></p>
                              </div>
                            );
                          }}
                        />
                        <Scatter data={bubbleData} isAnimationActive={false}>
                          {bubbleData.map((entry, index) => (
                            <Cell key={index} fill={bubbleColors[entry.quadrant]} fillOpacity={0.75} stroke={bubbleColors[entry.quadrant]} strokeWidth={1} />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legenda */}
                  <div className="flex flex-wrap gap-3 mt-2 justify-center">
                    {(Object.entries(quadrantMeta) as [string, typeof quadrantMeta.stelle][]).map(([k, m]) => (
                      <div key={k} className="flex items-center gap-1.5 text-xs">
                        <div className="w-3 h-3 rounded-full" style={{ background: bubbleColors[k] }} />
                        <span className={mutedText}>{m.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quattro quadranti */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['stelle', 'spingere', 'rivedere', 'valutare'] as const).map(q => {
                  const meta = quadrantMeta[q];
                  const dishes = portfolioDishes.filter(d => getQuadrant(d) === q).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
                  return (
                    <Card key={q} className={`border ${meta.bg}`}>
                      <CardHeader className="pb-2">
                        <CardTitle className={`text-sm ${meta.color}`}>{meta.icon} {meta.label}</CardTitle>
                        <p className={`text-xs ${mutedText}`}>{meta.desc}</p>
                      </CardHeader>
                      <CardContent>
                        {dishes.length === 0 ? (
                          <p className={`text-xs italic ${mutedText}`}>Nessun piatto in questo quadrante</p>
                        ) : (
                          <div className="space-y-1.5">
                            {dishes.map(d => (
                              <div key={d.name} className={`flex items-center justify-between text-xs px-2 py-1.5 rounded-lg ${isDinner ? 'bg-black/20' : 'bg-white/60'}`}>
                                <span className={`font-medium truncate ${textColor}`}>{d.name}</span>
                                <div className="flex items-center gap-3 shrink-0 ml-2">
                                  <span className={mutedText}>{d.marginPct.toFixed(1)}%</span>
                                  <span className={mutedText}>{d.frequency} ord.</span>
                                  {d.score != null && <span className="text-[#967D62] font-bold">{d.score.toFixed(0)}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {/* ── RANKING BEVANDE PER FREQUENZA (collassabile) ── */}
          {beverageByFreq.length > 0 && (
            <div className={`rounded-xl border-2 ${isDinner ? 'border-[#475569]' : 'border-[#C8C2B8]'}`}>
              <button
                onClick={() => setBevPortfolioOpen(v => !v)}
                className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-colors font-semibold ${isDinner ? 'hover:bg-[#334155]/30' : 'hover:bg-[#F4F1EA]/60'}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${textColor}`}>🍹 Frequenze Bevande</span>
                  <span className={`text-xs ${mutedText}`}>Ranking per volume ordini — utile per la gestione scorte</span>
                </div>
                {bevPortfolioOpen ? <ChevronUp className={`w-4 h-4 ${mutedText}`} /> : <ChevronDown className={`w-4 h-4 ${mutedText}`} />}
              </button>
              {bevPortfolioOpen && (
                <div className={`border-t ${isDinner ? 'border-[#334155]' : 'border-[#EAE5DA]'}`}>
                  {beverageByFreq.map((d, idx) => {
                    const maxFreq = beverageByFreq[0]?.frequency ?? 1;
                    const barW = maxFreq > 0 ? ((d.frequency ?? 0) / maxFreq) * 100 : 0;
                    return (
                      <div key={d.name} className={`flex items-center gap-4 px-5 py-3 border-t ${isDinner ? 'border-[#334155]/50' : 'border-[#EAE5DA]'}`}>
                        <span className={`text-sm font-bold w-6 shrink-0 ${mutedText}`}>{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-sm font-semibold truncate ${textColor}`}>{d.name}</span>
                            <span className={`text-sm font-bold shrink-0 ml-2 ${textColor}`}>{d.frequency} ordini</span>
                          </div>
                          <div className={`h-1.5 rounded-full overflow-hidden ${isDinner ? 'bg-[#334155]' : 'bg-[#EAE5DA]'}`}>
                            <div className="h-full rounded-full bg-[#967D62]" style={{ width: `${barW}%` }} />
                          </div>
                        </div>
                        <span className={`text-xs shrink-0 ${mutedText}`}>{d.marginPct.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          TAB 3 — INGREDIENTI (analisi piatti da rivedere)
      ============================================================ */}
      {activeTab === 'ingredienti' && (
        <div className="space-y-6">
          {rivisitaDishes.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-16 ${mutedText}`}>
              <Package className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">
                {portfolioDishes.length === 0
                  ? 'Importa le frequenze nella tab Frequenze per abilitare questa analisi'
                  : 'Nessun piatto nel quadrante "Da rivedere" — ottimo!'}
              </p>
            </div>
          ) : (
            <>
              <div className={`flex items-start gap-3 p-4 rounded-xl border ${isDinner ? 'bg-[#967D62]/10 border-[#967D62]/30' : 'bg-[#967D62]/5 border-[#967D62]/20'}`}>
                <RefreshCw className="w-4 h-4 text-[#967D62] shrink-0 mt-0.5" />
                <p className={`text-sm ${textColor}`}>
                  Questi piatti sono <strong>molto venduti ma con margine basso</strong>. Per ognuno vedi quali ingredienti pesano di più sul costo, e simula cosa cambierebbe riducendo la quantità del <strong>10% o 20%</strong>.
                </p>
              </div>
              {rivisitaDishes.map(dish => {
                const breakdown = getIngBreakdown(dish.name);
                if (breakdown.length === 0) return null;
                const isOpen = openIngDishes.has(dish.name);

                // Calcola costo simulato combinando tutti i tagli attivi per questo piatto
                const activeCuts = breakdown.reduce((acc, row) => {
                  const key = `${dish.name}|${row.id}`;
                  const cut = simReductions[key];
                  if (cut && cut > 0) acc[row.id] = cut;
                  return acc;
                }, {} as Record<string, number>);
                const hasAnyCut = Object.keys(activeCuts).length > 0;

                // Ricalcola costo totale con tutti i tagli attivi contemporaneamente
                const combinedCost = (() => {
                  if (!hasAnyCut) return dish.ingredientCost;
                  const rows = recipes[dish.name] || [];
                  let total = 0;
                  rows.forEach(row => {
                    const isPrep = row.ingredientId.startsWith('prep:');
                    const prep = isPrep ? preparations.find(p => p.id === row.ingredientId.replace('prep:', '')) : null;
                    const ing = !isPrep ? ingredients.find(i => i.id === row.ingredientId) : null;
                    if (!ing && !prep) return;
                    const ppu = isPrep ? null : calcWAC(ing!);
                    const effectivePpp = row.portionsPerPiece ?? row.pcs_yield;
                    const cut = activeCuts[row.ingredientId];
                    const mult = cut ? (1 - cut / 100) : 1;
                    let cost = 0;
                    if (isPrep && prep) {
                      let pc = 0; let pm = false;
                      prep.ingredients.forEach(pr => {
                        const pi = ingredients.find(i => i.id === pr.ingredientId);
                        if (!pi) { pm = true; return; }
                        const ppu2 = calcWAC(pi); if (!ppu2) { pm = true; return; }
                        if (pr.portionsPerPiece && pr.portionsPerPiece > 0) pc += ppu2 / pr.portionsPerPiece;
                        else pc += ppu2 * toBaseQty(pr.qty, pr.unit ?? pi.unit, pi.unit);
                      });
                      if (!pm) {
                        const cpyu = pc / prep.yieldQty;
                        if (effectivePpp && effectivePpp > 0) cost = (cpyu / effectivePpp) * mult;
                        else cost = cpyu * toBaseQty(row.qty, row.unit ?? prep.yieldUnit, prep.yieldUnit) * mult;
                      }
                    } else if (ppu != null) {
                      if (effectivePpp && effectivePpp > 0) cost = (ppu / effectivePpp) * mult;
                      else cost = ppu * toBaseQty(row.qty, row.unit ?? ing!.unit, ing!.unit) * mult;
                    }
                    total += cost;
                  });
                  return total;
                })();

                const combinedMarginPct = dish.priceNet > 0 ? ((dish.priceNet - combinedCost) / dish.priceNet) * 100 : 0;
                const marginDelta = combinedMarginPct - dish.marginPct;

                return (
                  <Card key={dish.name} className={cardBg}>
                    {/* Header — sempre visibile, click per aprire/chiudere */}
                    <button
                      onClick={() => setOpenIngDishes(prev => {
                        const next = new Set(prev);
                        if (next.has(dish.name)) next.delete(dish.name); else next.add(dish.name);
                        return next;
                      })}
                      className={`w-full text-left border-b border-black/5 dark:border-white/5 transition-colors ${isDinner ? 'hover:bg-[#334155]/30' : 'hover:bg-gray-50'} rounded-t-xl`}
                    >
                      <div className="flex items-center justify-between p-4 pb-3">
                        <div>
                          <div className={`text-base font-bold ${textColor}`}>{dish.name}</div>
                          <div className={`text-xs ${mutedText} mt-0.5`}>{dish.category} · {breakdown.length} ingredienti</div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0 ml-4">
                          {/* Margine: attuale o combinato */}
                          <div className="text-right">
                            {hasAnyCut ? (
                              <>
                                <div className={`text-[10px] ${mutedText}`}>Margine simulato</div>
                                <div className="text-emerald-500 font-bold text-lg">{combinedMarginPct.toFixed(1)}%</div>
                                <div className="text-emerald-500 text-xs font-semibold">+{marginDelta.toFixed(1)}pp</div>
                              </>
                            ) : (
                              <>
                                <div className={`text-[10px] ${mutedText}`}>Margine attuale</div>
                                <div className="text-amber-500 font-bold text-lg">{dish.marginPct.toFixed(1)}%</div>
                                <div className={`text-xs ${mutedText}`}>FC €{dish.ingredientCost.toFixed(2)}</div>
                              </>
                            )}
                          </div>
                          {isOpen ? <ChevronUp className={`w-4 h-4 ${mutedText}`} /> : <ChevronDown className={`w-4 h-4 ${mutedText}`} />}
                        </div>
                      </div>
                    </button>

                    {/* Corpo collassabile */}
                    {isOpen && (
                      <CardContent className="pt-4 space-y-3">
                        {breakdown.map(row => {
                          const sim10 = simCost(dish.name, row.id, 10);
                          const sim20 = simCost(dish.name, row.id, 20);
                          const newMargin10 = dish.priceNet > 0 ? ((dish.priceNet - sim10) / dish.priceNet) * 100 : 0;
                          const newMargin20 = dish.priceNet > 0 ? ((dish.priceNet - sim20) / dish.priceNet) * 100 : 0;
                          const saving10 = dish.ingredientCost - sim10;
                          const saving20 = dish.ingredientCost - sim20;
                          const key = `${dish.name}|${row.id}`;
                          const activeReduction = simReductions[key] || 0;
                          return (
                            <div key={row.id} className={`p-3 rounded-xl border ${isDinner ? 'bg-[#0F172A] border-[#334155]' : 'bg-gray-50 border-[#EAE5DA]'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`font-semibold text-sm truncate ${textColor}`}>{row.name}</span>
                                  {row.isPrep && <span className="text-[10px] text-[#967D62] shrink-0">(prep.)</span>}
                                </div>
                                <div className="flex items-center gap-3 shrink-0 ml-2">
                                  <span className={`text-xs font-mono ${mutedText}`}>€{row.costRow.toFixed(3)}</span>
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${row.pct > 40 ? (isDinner ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-50 text-rose-600') : row.pct > 20 ? (isDinner ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-50 text-amber-700') : (isDinner ? 'bg-[#334155] text-[#94A3B8]' : 'bg-gray-100 text-gray-500')}`}>
                                    {row.pct.toFixed(0)}% del costo
                                  </span>
                                </div>
                              </div>
                              <div className={`w-full h-1.5 rounded-full mb-3 ${isDinner ? 'bg-[#334155]' : 'bg-gray-200'}`}>
                                <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${Math.min(100, row.pct)}%` }} />
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                {([0, 10, 20] as const).map(pct => {
                                  if (pct === 0) {
                                    // Bottone "nessun taglio" — visibile solo se c'è un taglio attivo
                                    if (activeReduction === 0) return null;
                                    return (
                                      <button key={0} onClick={() => setSimReductions(prev => { const n = {...prev}; delete n[key]; return n; })}
                                        className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${isDinner ? 'border-[#334155] text-[#94A3B8] hover:border-rose-500/50' : 'border-[#EAE5DA] text-[#8C8A85] hover:border-rose-400'}`}>
                                        Rimuovi taglio
                                      </button>
                                    );
                                  }
                                  const saving = pct === 10 ? saving10 : saving20;
                                  const newMargin = pct === 10 ? newMargin10 : newMargin20;
                                  const isActive = activeReduction === pct;
                                  return (
                                    <button key={pct}
                                      onClick={() => setSimReductions(prev => ({ ...prev, [key]: pct }))}
                                      className={`flex-1 text-left px-3 py-2 rounded-lg border text-xs transition-all ${
                                        isActive
                                          ? (isDinner ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400' : 'bg-emerald-50 border-emerald-300 text-emerald-700')
                                          : (isDinner ? 'border-[#334155] text-[#94A3B8] hover:border-[#967D62]/50' : 'border-[#EAE5DA] text-[#8C8A85] hover:border-[#967D62]/50')
                                      }`}>
                                      <div className="font-semibold">−{pct}% quantità</div>
                                      <div className={`mt-0.5 ${isActive ? '' : mutedText}`}>
                                        Risparmio: <span className="font-bold">€{saving.toFixed(3)}/porz.</span>
                                      </div>
                                      <div className={isActive ? '' : mutedText}>
                                        Margine sing.: <span className="font-bold">{newMargin.toFixed(1)}%</span>
                                        <span className="ml-1 text-emerald-500">+{(newMargin - dish.marginPct).toFixed(1)}pp</span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ============================================================
          TAB 2 — FREQUENZE
      ============================================================ */}
      {activeTab === 'frequenze' && (
        <div className="space-y-6">
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
            <CardContent className="space-y-4">

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => freqInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  isDragging ? 'border-[#967D62] bg-[#967D62]/10'
                    : isDinner ? 'border-[#334155] bg-[#0F172A]/40 hover:border-[#967D62]/60'
                    : 'border-[#D1CCC0] bg-[#F4F1EA]/40 hover:border-[#967D62]/60'
                }`}
              >
                <Upload className={`w-8 h-8 ${isDragging ? accent : mutedText}`} />
                <div className="text-center">
                  <p className={`text-sm font-semibold ${textColor}`}>Trascina il file qui o clicca per selezionare</p>
                  <p className={`text-xs mt-1 ${mutedText}`}>CSV · XLSX · XLS · JSON · TSV</p>
                </div>
                <input ref={freqInputRef} type="file" accept=".csv,.xlsx,.xls,.tsv,.txt,.json" onChange={handleFreqInputChange} className="hidden" />
              </div>

              {freqImportMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-xs font-medium ${
                  freqImportMsg.type === 'ok'  ? (isDinner ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/40' : 'bg-emerald-50 text-emerald-700 border border-emerald-200') :
                  freqImportMsg.type === 'err' ? (isDinner ? 'bg-rose-950/30 text-rose-400 border border-rose-800/40' : 'bg-rose-50 text-rose-700 border border-rose-200') :
                  (isDinner ? 'bg-blue-950/30 text-blue-400 border border-blue-800/40' : 'bg-blue-50 text-blue-700 border border-blue-200')
                }`}>
                  {freqImportMsg.type === 'ok' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Info className="w-3.5 h-3.5 shrink-0" />}
                  {freqImportMsg.msg}
                </div>
              )}

              {/* Esempio formato + selettore periodo */}
              <div className={`p-3 rounded-lg border ${isDinner ? 'bg-[#0F172A] border-[#334155]' : 'bg-gray-50 border-[#EAE5DA]'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Esempio compatto */}
                  <div className="flex-1">
                    <p className={`text-[10px] font-semibold uppercase tracking-wider ${mutedText} mb-2`}>Esempio formato accettato</p>
                    <div className={`font-mono text-xs ${textColor}`}>
                      <div className={`grid grid-cols-2 gap-4 pb-1 mb-1 border-b ${dividerCls} font-bold`}>
                        <span>piatto</span><span>quantità</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 opacity-70"><span>Bay burger</span><span>142</span></div>
                      <div className="grid grid-cols-2 gap-4 opacity-70"><span>Mojito</span><span>89</span></div>
                    </div>
                  </div>

                  {/* Separatore verticale */}
                  <div className={`hidden sm:block w-px self-stretch ${isDinner ? 'bg-[#334155]' : 'bg-[#EAE5DA]'}`} />

                  {/* Selettore periodo */}
                  <div className="flex-1 relative" ref={calendarRef}>
                    <p className={`text-[10px] font-semibold uppercase tracking-wider ${mutedText} mb-2`}>Periodo analisi</p>
                    <button
                      onClick={() => { setShowCalendar(v => !v); setCalendarStep('start'); }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors w-full ${
                        periodLabel
                          ? (isDinner ? 'border-[#967D62]/60 text-[#C4A882] bg-[#967D62]/10' : 'border-[#967D62]/60 text-[#967D62] bg-[#967D62]/5')
                          : (isDinner ? 'border-[#334155] text-[#94A3B8] hover:border-[#967D62]/40' : 'border-[#EAE5DA] text-[#8C8A85] hover:border-[#967D62]/40')
                      }`}
                    >
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-left truncate">
                        {periodLabel ?? (calendarStep === 'end' && periodStart ? `Da ${periodStart.split('-').reverse().slice(0,2).join('/')} — seleziona fine` : 'Seleziona periodo')}
                      </span>
                      {periodLabel && <span className={`text-[10px] ${mutedText}`}>Modifica</span>}
                    </button>
                    {periodLabel && (
                      <button onClick={() => { setPeriodStart(null); setPeriodEnd(null); }} className={`text-[10px] mt-1 ${mutedText} hover:text-rose-400 transition-colors`}>
                        Rimuovi periodo
                      </button>
                    )}

                    {/* Popup calendario */}
                    {showCalendar && (
                      <div className={`absolute z-50 mt-2 p-3 rounded-xl border shadow-xl ${isDinner ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#EAE5DA]'}`}
                        style={{ minWidth: 280 }}>
                        {/* Istruzione */}
                        <p className={`text-[10px] font-semibold uppercase tracking-wider mb-3 ${accent}`}>
                          {calendarStep === 'start' ? 'Seleziona data inizio' : 'Seleziona data fine'}
                        </p>
                        {/* Header mese */}
                        <div className="flex items-center justify-between mb-2">
                          <button onClick={() => setCalendarMonth(m => new Date(m.getFullYear(), m.getMonth()-1, 1))} className={`p-1 rounded hover:bg-black/5 ${mutedText}`}>
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className={`text-sm font-semibold ${textColor}`}>
                            {calendarMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                          </span>
                          <button onClick={() => setCalendarMonth(m => new Date(m.getFullYear(), m.getMonth()+1, 1))} className={`p-1 rounded hover:bg-black/5 ${mutedText}`}>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                        {/* Giorni della settimana */}
                        <div className="grid grid-cols-7 mb-1">
                          {['L','M','M','G','V','S','D'].map((d, i) => (
                            <div key={i} className={`text-center text-[10px] font-bold pb-1 ${mutedText}`}>{d}</div>
                          ))}
                        </div>
                        {/* Celle giorno */}
                        {(() => {
                          const year = calendarMonth.getFullYear();
                          const month = calendarMonth.getMonth();
                          const firstDay = new Date(year, month, 1);
                          // Monday-first: 0=Mon..6=Sun
                          const startOffset = (firstDay.getDay() + 6) % 7;
                          const daysInMonth = new Date(year, month+1, 0).getDate();
                          const cells: (number|null)[] = Array(startOffset).fill(null);
                          for (let d = 1; d <= daysInMonth; d++) cells.push(d);
                          while (cells.length % 7 !== 0) cells.push(null);
                          const weeks: (number|null)[][] = [];
                          for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i+7));
                          return weeks.map((week, wi) => (
                            <div key={wi} className="grid grid-cols-7">
                              {week.map((day, di) => {
                                if (!day) return <div key={di} />;
                                const mm = String(month+1).padStart(2,'0');
                                const dd = String(day).padStart(2,'0');
                                const dateStr = `${year}-${mm}-${dd}`;
                                const occupied = isDateOccupied(dateStr);
                                const inSel = isDateInSelection(dateStr);
                                const isStart = dateStr === periodStart;
                                const isEnd = dateStr === periodEnd;
                                return (
                                  <button
                                    key={di}
                                    disabled={occupied}
                                    onClick={() => handleCalendarDayClick(dateStr)}
                                    className={`relative h-8 w-full text-xs rounded-md transition-all ${
                                      occupied ? `opacity-30 cursor-not-allowed line-through ${mutedText}` :
                                      isStart || isEnd ? 'bg-[#967D62] text-white font-bold' :
                                      inSel ? (isDinner ? 'bg-[#967D62]/20 text-[#C4A882]' : 'bg-[#967D62]/10 text-[#967D62]') :
                                      (isDinner ? 'text-[#F4F1EA] hover:bg-[#334155]' : 'text-[#2C2A28] hover:bg-gray-100')
                                    }`}
                                  >
                                    {day}
                                  </button>
                                );
                              })}
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Riga azioni: Rimuovi dati + Salva analisi */}
              <div className={`flex gap-3 pt-1 border-t ${dividerCls}`}>
                <button
                  onClick={() => { setFrequencies({}); setFreqPeriodLabel(''); setPeriodStart(null); setPeriodEnd(null); setSaveMsg(null); }}
                  disabled={Object.keys(frequencies).length === 0}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    isDinner ? 'border-[#334155] text-rose-400 hover:bg-rose-950/20' : 'border-[#EAE5DA] text-rose-500 hover:bg-rose-50'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  Rimuovi dati
                </button>
                <button
                  onClick={handleSaveSnapshot}
                  disabled={!periodStart || !periodEnd || Object.keys(frequencies).length === 0 || savingSnapshot}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    isDinner ? 'bg-[#967D62] hover:bg-[#7A654E] text-white' : 'bg-[#967D62] hover:bg-[#7A654E] text-white'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  {savingSnapshot ? 'Salvataggio…' : 'Chiudi analisi e salva dati'}
                </button>
              </div>

              {saveMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-xs font-medium ${
                  saveMsg.type === 'ok'
                    ? (isDinner ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/40' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')
                    : (isDinner ? 'bg-rose-950/30 text-rose-400 border border-rose-800/40' : 'bg-rose-50 text-rose-700 border border-rose-200')
                }`}>
                  {saveMsg.type === 'ok' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                  {saveMsg.msg}
                </div>
              )}

            </CardContent>
          </Card>

          {/* Ranking compatto */}
          {rankingDishes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className={`text-sm font-bold uppercase tracking-wider ${textColor}`}>
                  Ranking — periodo: {freqPeriodLabel}
                </h3>
                {/* Selettore ordinamento */}
                <div className={`flex gap-1 p-1 rounded-lg border ${isDinner ? 'bg-[#0F172A] border-[#334155]' : 'bg-black/5 border-[#EAE5DA]'}`}>
                  {([
                    { key: 'score',    label: 'Score' },
                    { key: 'guadagno', label: 'Guadagno netto' },
                    { key: 'ricavo',   label: 'Ricavo lordo' },
                  ] as const).map(opt => (
                    <button key={opt.key} onClick={() => setRankingSort(opt.key)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                        rankingSort === opt.key
                          ? (isDinner ? 'bg-[#967D62] text-white' : 'bg-white text-[#967D62] shadow-sm border border-[#EAE5DA]')
                          : `${mutedText} hover:text-[#967D62]`
                      }`}
                    >{opt.label}</button>
                  ))}
                </div>
              </div>
              {rankingDishes.map((dish, idx) => {
                const val = getRankingValue(dish, rankingSort);
                const barW = maxRankingValue > 0 ? (val / maxRankingValue) * 100 : 0;
                const valLabel = rankingSort === 'score'
                  ? (dish.score != null ? dish.score.toFixed(0) : '—')
                  : `€${val.toFixed(0)}`;
                const valTitle = rankingSort === 'score' ? 'Score'
                  : rankingSort === 'guadagno' ? 'Guadagno netto'
                  : 'Ricavo lordo';
                return (
                  <div key={dish.name} className={`flex items-center gap-4 p-3 rounded-xl border ${cardBg}`}>
                    <div className={`w-7 text-center text-sm font-bold ${idx < 3 ? accent : mutedText}`}>{idx + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold ${textColor} truncate`}>{dish.name}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className={`flex-1 h-1.5 rounded-full ${isDinner ? 'bg-[#334155]' : 'bg-[#EAE5DA]'}`}>
                          <div className="h-full rounded-full bg-[#967D62] transition-all duration-500" style={{ width: `${barW}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right hidden sm:block">
                        <div className={`text-xs ${mutedText}`}>Margine</div>
                        <div className={`text-sm font-bold ${marginColor(dish.marginPct)}`}>{dish.hasMissingCosts ? '—' : `${dish.marginPct.toFixed(1)}%`}</div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <div className={`text-xs ${mutedText}`}>Ordini</div>
                        <div className={`text-sm font-bold ${textColor}`}>{dish.frequency ?? '—'}</div>
                      </div>
                      <div className="text-right min-w-[64px]">
                        <div className={`text-xs ${mutedText}`}>{valTitle}</div>
                        <div className={`text-base font-bold ${accent}`}>{valLabel}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── BEVANDE: ranking con score (coerente con la sezione frequenze) ── */}
          {rankingBeverages.length > 0 && (
            <div className={`rounded-xl border-2 ${isDinner ? 'border-[#475569]' : 'border-[#C8C2B8]'}`}>
              <button
                onClick={() => setBevRankingOpen(v => !v)}
                className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-colors font-semibold ${isDinner ? 'hover:bg-[#334155]/30' : 'hover:bg-[#F4F1EA]/60'}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${textColor}`}>🍹 Bevande</span>

                </div>
                {bevRankingOpen ? <ChevronUp className={`w-4 h-4 ${mutedText}`} /> : <ChevronDown className={`w-4 h-4 ${mutedText}`} />}
              </button>
              {bevRankingOpen && (
                <div className={`border-t ${isDinner ? 'border-[#334155]' : 'border-[#EAE5DA]'}`}>
                  {rankingBeverages.map((dish, idx) => {
                    const maxBevVal = rankingBeverages[0] ? getRankingValue(rankingBeverages[0], rankingSort) : 1;
                    const val = getRankingValue(dish, rankingSort);
                    const barW = maxBevVal > 0 ? (val / maxBevVal) * 100 : 0;
                    return (
                      <div key={dish.name} className={`flex items-center gap-4 px-5 py-3 border-t ${isDinner ? 'border-[#334155]/50' : 'border-[#EAE5DA]'}`}>
                        <span className={`text-sm font-bold w-6 shrink-0 ${mutedText}`}>{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-sm font-semibold truncate ${textColor}`}>{dish.name}</span>
                          </div>
                          <div className={`h-1.5 rounded-full overflow-hidden ${isDinner ? 'bg-[#334155]' : 'bg-[#EAE5DA]'}`}>
                            <div className="h-full rounded-full bg-[#967D62]" style={{ width: `${barW}%` }} />
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-right shrink-0">
                          <div>
                            <div className={`text-xs ${mutedText}`}>Margine</div>
                            <div className={`text-sm font-semibold ${textColor}`}>{dish.marginPct.toFixed(1)}%</div>
                          </div>
                          <div>
                            <div className={`text-xs ${mutedText}`}>Ordini</div>
                            <div className={`text-sm font-semibold ${textColor}`}>{dish.frequency ?? '—'}</div>
                          </div>
                          <div>
                            <div className={`text-xs ${mutedText}`}>{rankingSort === 'score' ? 'Score' : rankingSort === 'guadagno' ? 'Guadagno' : 'Ricavo'}</div>
                            <div className={`text-base font-bold ${accent}`}>{
                              rankingSort === 'score'
                                ? (dish.score != null ? dish.score.toFixed(0) : '—')
                                : `€${val.toFixed(0)}`
                            }</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
