// ================================================================
// ALEA — Storico Analisi
// Visualizza snapshot salvati, confronto tra due periodi.
// ================================================================

import { useState, useEffect, useMemo } from 'react';
import {
  Trash2, GitCompare, ChevronDown, ChevronUp, X,
  TrendingUp, TrendingDown, Minus, Star, Target,
  ArrowUp, ArrowDown, BarChart2, Calendar, AlertCircle, Check,
  Plus, LineChart as LineChartIcon, Zap, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MENU_CATEGORIES } from '../constants';

// ── TIPI ─────────────────────────────────────────────────────────

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
    recipes?: Record<string, Array<{ ingredientId: string; qty: number; unit?: string; portionsPerPiece?: number }>>;
  };
}

interface StoricoViewProps {
  isDinner: boolean;
  textColor: string;
  mutedText: string;
  cardBg: string;
  accentColor: string;
  supabase: any;
  isLoggedIn: boolean;
}

// ── HELPERS ───────────────────────────────────────────────────────
const isBeverageCategory = (category: string) => category === 'COCKTAILS & BEVERAGE';

const quadrantLabel: Record<string, string> = {
  stella: '⭐ Stella',
  promuovi: '📣 Da promuovere',
  rivedi: '🔍 Da rivedere',
  valuta: '💤 Da valutare',
};

const quadrantColor = (q: string, isDinner: boolean) => {
  if (q === 'stella')   return isDinner ? 'text-amber-400' : 'text-amber-600';
  if (q === 'promuovi') return isDinner ? 'text-emerald-400' : 'text-emerald-600';
  if (q === 'rivedi')   return isDinner ? 'text-slate-400' : 'text-slate-500';
  return isDinner ? 'text-rose-400' : 'text-rose-600';
};

const getCompareValue = (d: DishSnapshot, sort: 'score' | 'guadagno' | 'ricavo') => {
  if (sort === 'score')    return d.score ?? 0;
  if (sort === 'ricavo')   return d.priceNet * d.frequency;
  return (d.priceNet - d.ingredientCost) * d.frequency;
};

const getDetailValue = (d: DishSnapshot, sort: 'score' | 'guadagno' | 'ricavo') => {
  if (sort === 'score')    return d.score ?? 0;
  if (sort === 'ricavo')   return d.priceNet * d.frequency;
  return (d.priceNet - d.ingredientCost) * d.frequency;
};

const formatDate = (d: string) =>
  new Date(d + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });

// ── COMPONENTE PRINCIPALE ─────────────────────────────────────────

export function StoricoView({
  isDinner, textColor, mutedText, cardBg, accentColor, supabase, isLoggedIn
}: StoricoViewProps) {

  const divider  = isDinner ? 'border-[#334155]' : 'border-[#EAE5DA]';
  const rowHover = isDinner ? 'hover:bg-[#334155]/40' : 'hover:bg-[#F4F1EA]/60';

  const [activeTab, setActiveTab] = useState<'periodi' | 'confronto' | 'trend'>('periodi');
  const [snapshots, setSnapshots] = useState<AnalysisSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailSort, setDetailSort] = useState<'score' | 'guadagno' | 'ricavo'>('score');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Confronto
  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);
  const [compareDropA, setCompareDropA] = useState(false);
  const [compareDropB, setCompareDropB] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [compareSort, setCompareSort] = useState<'score' | 'guadagno' | 'ricavo'>('score');

  // Trend: piatti selezionati per i grafici
  const [trendDishes, setTrendDishes] = useState<string[]>([]);
  const [trendDropdownOpen, setTrendDropdownOpen] = useState(false);
  const [trendSearch, setTrendSearch] = useState('');

  // Palette colori per le linee
  const TREND_COLORS = [
    '#967D62', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#06B6D4', '#F97316', '#84CC16', '#EC4899',
  ];

  // Carica snapshots
  useEffect(() => {
    if (!isLoggedIn) return;
    const load = async () => {
      setLoading(true);
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) { setLoading(false); return; }
      const { data } = await supabase
        .from('analysis_snapshots')
        .select('*')
        .eq('user_id', userId)
        .order('period_start', { ascending: false });
      if (data) setSnapshots(data as AnalysisSnapshot[]);
      setLoading(false);
    };
    load();
  }, [isLoggedIn]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) { setDeletingId(null); return; }
    await supabase.from('analysis_snapshots').delete().eq('id', id).eq('user_id', userId);
    setSnapshots(prev => prev.filter(s => s.id !== id));
    setConfirmDeleteId(null);
    setDeletingId(null);
    if (compareA === id) setCompareA(null);
    if (compareB === id) setCompareB(null);
  };

  // ── CONFRONTO ────────────────────────────────────────────────
  const snapshotA = snapshots.find(s => s.id === compareA);
  const snapshotB = snapshots.find(s => s.id === compareB);

  const buildComparison = () => {
    if (!snapshotA || !snapshotB) return null;
    const dishesA = snapshotA.data.dishes;
    const dishesB = snapshotB.data.dishes;
    const allNames = Array.from(new Set([...dishesA.map(d => d.name), ...dishesB.map(d => d.name)]));

    return allNames.map(name => {
      const a = dishesA.find(d => d.name === name);
      const b = dishesB.find(d => d.name === name);
      if (!a || !b) return null; // piatto non presente in entrambi
      const marginDiff = b.marginPct - a.marginPct;
      const freqDiff = b.frequency - a.frequency;
      const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
      const quadrantChanged = a.quadrant !== b.quadrant;
      // Mostra solo se c'è qualcosa di interessante
      if (Math.abs(marginDiff) < 0.5 && Math.abs(freqDiff) < 2 && !quadrantChanged) return null;
      return { name, category: a.category, a, b, marginDiff, freqDiff, scoreDiff, quadrantChanged };
    }).filter(Boolean) as Array<{
      name: string; category: string;
      a: DishSnapshot; b: DishSnapshot;
      marginDiff: number; freqDiff: number; scoreDiff: number; quadrantChanged: boolean;
    }>;
  };

  const comparison = (showComparison && compareA && compareB) ? buildComparison() : null;

  // ── TREND HELPERS ────────────────────────────────────────────
  // Snapshots ordinati cronologicamente per i grafici
  const chronoSnapshots = [...snapshots].sort((a, b) => a.period_start.localeCompare(b.period_start));

  // Tutti i nomi piatto presenti in almeno uno snapshot
  const allDishNames = Array.from(new Set(
    snapshots.flatMap(s => s.data.dishes.map(d => d.name))
  )).sort();

  // Costruisce serie dati per un piatto e una metrica
  const buildSeries = (dishName: string, metric: 'frequency' | 'marginPct' | 'score') => {
    return chronoSnapshots.map(snap => {
      const dish = snap.data.dishes.find(d => d.name === dishName);
      const val = dish
        ? metric === 'score' ? (dish.score ?? null) : dish[metric]
        : null;
      return {
        period: snap.label,
        value: val != null ? parseFloat(val.toFixed(1)) : null,
      };
    });
  };

  // Dati per grafico: array di oggetti { period, [dishName]: value }
  const buildChartData = (metric: 'frequency' | 'marginPct' | 'score') => {
    if (trendDishes.length === 0) return [];
    return chronoSnapshots.map(snap => {
      const point: Record<string, any> = { period: snap.label };
      trendDishes.forEach(name => {
        const dish = snap.data.dishes.find(d => d.name === name);
        if (dish) {
          const val = metric === 'score' ? dish.score : dish[metric];
          point[name] = val != null ? parseFloat((val as number).toFixed(1)) : null;
        }
      });
      return point;
    });
  };

  // Rileva correlazioni prezzo-frequenza
  const detectCorrelations = () => {
    if (chronoSnapshots.length < 2) return [];
    const results: Array<{ dish: string; periodA: string; periodB: string; priceDiff: number; freqDiff: number; type: 'positive' | 'negative' }> = [];
    for (let i = 1; i < chronoSnapshots.length; i++) {
      const prev = chronoSnapshots[i - 1];
      const curr = chronoSnapshots[i];
      prev.data.dishes.forEach(dPrev => {
        const dCurr = curr.data.dishes.find(d => d.name === dPrev.name);
        if (!dCurr) return;
        const priceDiff = dCurr.priceNet - dPrev.priceNet;
        const freqDiff = dCurr.frequency - dPrev.frequency;
        // Solo se prezzo è cambiato E frequenza è cambiata in modo significativo
        if (Math.abs(priceDiff) < 0.1 || Math.abs(freqDiff) < 3) return;
        const type = (priceDiff < 0 && freqDiff > 0) || (priceDiff > 0 && freqDiff < 0) ? 'positive' : 'negative';
        results.push({ dish: dPrev.name, periodA: prev.label, periodB: curr.label, priceDiff, freqDiff, type });
      });
    }
    return results;
  };

  const correlations = detectCorrelations();

  // ── RILEVAMENTO TREND AUTOMATICO ────────────────────────────
  // Parte dagli ultimi 3 periodi, poi estende indietro finché il trend continua
  const autoTrends = useMemo(() => {
    if (chronoSnapshots.length < 3) return [];
    const allNames = Array.from(new Set(chronoSnapshots.flatMap(s => s.data.dishes.map(d => d.name))));
    const metricLabels = { frequency: 'frequenza ordini', marginPct: 'margine %', ingredientCost: 'costo ingredienti' };

    const results: Array<{
      name: string; category: string;
      metric: 'frequency' | 'marginPct' | 'ingredientCost';
      metricLabel: string; direction: 'up' | 'down';
      values: Array<{ period: string; value: number }>;
      pctChange: number; periodsCount: number;
    }> = [];

    allNames.forEach(name => {
      const cat = chronoSnapshots[chronoSnapshots.length - 1].data.dishes.find(d => d.name === name)?.category ?? '';

      (['frequency', 'marginPct', 'ingredientCost'] as const).forEach(metric => {
        // Build full series for this metric
        const fullSeries = chronoSnapshots.map(s => {
          const d = s.data.dishes.find(dd => dd.name === name);
          return d ? { period: s.label, value: d[metric] as number } : null;
        }).filter(Boolean) as Array<{ period: string; value: number }>;

        if (fullSeries.length < 3) return;

        // Check last 3 first
        const last3 = fullSeries.slice(-3);
        const isUpLast3   = last3[0].value < last3[1].value && last3[1].value < last3[2].value;
        const isDownLast3 = last3[0].value > last3[1].value && last3[1].value > last3[2].value;
        if (!isUpLast3 && !isDownLast3) return;

        const direction = isUpLast3 ? 'up' : 'down';

        // Extend backwards: how many consecutive periods confirm the same trend?
        let startIdx = fullSeries.length - 3;
        while (startIdx > 0) {
          const prev = fullSeries[startIdx - 1];
          const curr = fullSeries[startIdx];
          const continues = direction === 'up' ? prev.value < curr.value : prev.value > curr.value;
          if (!continues) break;
          startIdx--;
        }

        const trendSeries = fullSeries.slice(startIdx);
        const first = trendSeries[0].value;
        const last  = trendSeries[trendSeries.length - 1].value;
        if (first === 0) return;
        const pctChange = ((last - first) / Math.abs(first)) * 100;
        if (Math.abs(pctChange) < 5) return;

        results.push({
          name, category: cat,
          metric, metricLabel: metricLabels[metric],
          direction,
          values: trendSeries,
          pctChange,
          periodsCount: trendSeries.length,
        });
      });
    });

    return results.sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange));
  }, [chronoSnapshots]);

  // Nomi filtrati per dropdown trend
  const filteredDishNames = allDishNames.filter(n =>
    n.toLowerCase().includes(trendSearch.toLowerCase()) && !trendDishes.includes(n)
  );

  // ── RENDER ────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full">
        <div className={`flex items-center justify-center py-20 ${mutedText}`}>Caricamento…</div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold tracking-tight ${textColor}`}>Storico Analisi</h1>
          <p className={`${mutedText} mt-1`}>
            {snapshots.length === 0
              ? 'Nessun periodo salvato. Carica le frequenze nella tab Redditività e salva la prima analisi.'
              : `${snapshots.length} period${snapshots.length === 1 ? 'o' : 'i'} salvat${snapshots.length === 1 ? 'o' : 'i'}.`}
          </p>
        </div>

      </div>

      {/* ── TAB SELECTOR ── */}
      <div className={`grid grid-cols-3 gap-1 p-1 rounded-xl border ${isDinner ? 'bg-[#0F172A] border-[#334155]' : 'bg-black/5 border-[#EAE5DA]'}`}>
        {([
          { key: 'periodi',   label: 'Periodi',   icon: Calendar },
          { key: 'confronto', label: 'Confronto', icon: GitCompare },
          { key: 'trend',     label: 'Trend',     icon: LineChartIcon },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center justify-center gap-2 px-2 py-2.5 rounded-lg text-sm font-semibold transition-all w-full ${
              activeTab === key
                ? (isDinner ? 'bg-[#967D62] text-white shadow-sm' : 'bg-white text-[#967D62] shadow-sm border border-[#EAE5DA]')
                : `${mutedText} hover:text-[#967D62]`
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" /><span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── SELEZIONE CONFRONTO ── */}
      {activeTab === 'confronto' && (
        <Card className={cardBg}>
          <CardContent className="pt-5 space-y-4">
            <p className={`text-sm font-semibold ${textColor}`}>
              Seleziona due periodi da confrontare — il primo è il riferimento (A), il secondo è quello più recente (B).
            </p>
            {snapshots.length < 2 ? (
              <p className={`text-sm ${mutedText}`}>Servono almeno 2 periodi salvati per il confronto.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(['A', 'B'] as const).map(side => {
                    const selectedId = side === 'A' ? compareA : compareB;
                    const otherId = side === 'A' ? compareB : compareA;
                    const selected = snapshots.find(s => s.id === selectedId);
                    const [openDrop, setOpenDrop] = [
                      side === 'A' ? compareDropA : compareDropB,
                      side === 'A' ? setCompareDropA : setCompareDropB,
                    ];
                    return (
                      <div key={side} className="relative">
                        <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${accentColor}`}>Periodo {side}</p>
                        <button
                          onClick={() => setOpenDrop(!openDrop)}
                          className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                            selected
                              ? (isDinner ? 'border-[#967D62]/60 bg-[#967D62]/10 text-[#F4F1EA]' : 'border-[#967D62]/60 bg-[#967D62]/5 text-[#2C2A28]')
                              : (isDinner ? 'border-[#334155] text-[#94A3B8] hover:border-[#967D62]/40' : 'border-[#EAE5DA] text-[#8C8A85] hover:border-[#967D62]/40')
                          }`}
                        >
                          <span className="truncate">{selected ? `${selected.label} (${formatDate(selected.period_start)} → ${formatDate(selected.period_end)})` : '— Seleziona —'}</span>
                          <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${openDrop ? 'rotate-180' : ''}`} />
                        </button>
                        {openDrop && (
                          <div className={`absolute z-50 mt-1 w-full rounded-xl border shadow-xl overflow-hidden ${isDinner ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#EAE5DA]'}`}>
                            {snapshots.map(s => {
                              const isOther = s.id === otherId;
                              return (
                                <button
                                  key={s.id}
                                  disabled={isOther}
                                  onClick={() => {
                                    side === 'A' ? setCompareA(s.id) : setCompareB(s.id);
                                    setShowComparison(false);
                                    setOpenDrop(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                    isOther ? `opacity-30 cursor-not-allowed ${mutedText}` :
                                    s.id === selectedId ? (isDinner ? 'bg-[#967D62]/20 text-[#F4F1EA]' : 'bg-[#967D62]/10 text-[#967D62]') :
                                    (isDinner ? `text-[#F4F1EA] ${rowHover}` : `text-[#2C2A28] ${rowHover}`)
                                  }`}
                                >
                                  <span className="font-semibold">{s.label}</span>
                                  <span className={`ml-2 text-xs ${mutedText}`}>{formatDate(s.period_start)} → {formatDate(s.period_end)}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button
                  disabled={!compareA || !compareB}
                  onClick={() => { setCompareDropA(false); setCompareDropB(false); setShowComparison(true); }}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    isDinner ? 'bg-[#967D62] hover:bg-[#7A654E] text-white' : 'bg-[#967D62] hover:bg-[#7A654E] text-white'
                  }`}
                >
                  <GitCompare className="w-4 h-4" />
                  Confronta periodi
                </button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── RISULTATI CONFRONTO ── */}
      {activeTab === 'confronto' && showComparison && compareA && compareB && comparison && (
        <div className="space-y-4">
          {/* KPI confronto */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Food Cost A', val: `${snapshotA!.data.kpi.avgFoodCost.toFixed(1)}%`, diff: snapshotB!.data.kpi.avgFoodCost - snapshotA!.data.kpi.avgFoodCost, lowerIsBetter: true },
              { label: 'Food Cost B', val: `${snapshotB!.data.kpi.avgFoodCost.toFixed(1)}%`, diff: snapshotB!.data.kpi.avgFoodCost - snapshotA!.data.kpi.avgFoodCost, lowerIsBetter: true },
              { label: 'Margine A', val: `${snapshotA!.data.kpi.avgMargin.toFixed(1)}%`, diff: snapshotB!.data.kpi.avgMargin - snapshotA!.data.kpi.avgMargin, lowerIsBetter: false },
              { label: 'Margine B', val: `${snapshotB!.data.kpi.avgMargin.toFixed(1)}%`, diff: snapshotB!.data.kpi.avgMargin - snapshotA!.data.kpi.avgMargin, lowerIsBetter: false },
            ].map((kpi, i) => {
              const improved = kpi.lowerIsBetter ? kpi.diff < 0 : kpi.diff > 0;
              const DiffIcon = kpi.diff === 0 ? Minus : kpi.diff > 0 ? ArrowUp : ArrowDown;
              const diffColor = kpi.diff === 0 ? mutedText : improved ? (isDinner ? 'text-emerald-400' : 'text-emerald-600') : (isDinner ? 'text-rose-400' : 'text-rose-600');
              return (
                <div key={i} className={`p-4 rounded-xl border ${cardBg}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${mutedText} mb-1`}>{kpi.label}</p>
                  <p className={`text-2xl font-bold ${textColor}`}>{kpi.val}</p>
                  {i >= 2 && (
                    <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${diffColor}`}>
                      <DiffIcon className="w-3 h-3" />
                      {Math.abs(kpi.diff).toFixed(1)}pp
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tabella differenze piatti */}
          <Card className={cardBg}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-base ${textColor}`}>
                Variazioni significative — {comparison.length} piatt{comparison.length === 1 ? 'o' : 'i'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {comparison.length === 0 ? (
                <p className={`text-sm ${mutedText} py-4 text-center`}>Nessuna variazione significativa tra i due periodi.</p>
              ) : (
                <div className="space-y-2">
                  {/* Selettore metrica */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs ${mutedText}`}>Ordina e visualizza per:</span>
                    <div className={`flex gap-1 p-0.5 rounded-lg border ${isDinner ? 'bg-[#0F172A] border-[#334155]' : 'bg-black/5 border-[#EAE5DA]'}`}>
                      {([
                        { key: 'score',    label: 'Score' },
                        { key: 'guadagno', label: 'Guadagno' },
                        { key: 'ricavo',   label: 'Ricavo' },
                      ] as const).map(opt => (
                        <button key={opt.key} onClick={() => setCompareSort(opt.key)}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                            compareSort === opt.key
                              ? (isDinner ? 'bg-[#967D62] text-white' : 'bg-white text-[#967D62] shadow-sm border border-[#EAE5DA]')
                              : `${mutedText} hover:text-[#967D62]`
                          }`}>{opt.label}</button>
                      ))}
                    </div>
                  </div>
                  {/* Header */}
                  <div className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 pb-2 border-b ${divider} text-xs font-bold uppercase tracking-wider ${mutedText}`}>
                    <span>Piatto</span>
                    <span className="text-right w-20">Margine</span>
                    <span className="text-right w-16">Ordini</span>
                    <span className="text-right w-20">{compareSort === 'score' ? 'Score' : compareSort === 'guadagno' ? 'Guadagno' : 'Ricavo'}</span>
                    <span className="text-right w-28">Quadrante</span>
                  </div>
                  {[...comparison]
                    .sort((a, b) => Math.abs(getCompareValue(b.b, compareSort) - getCompareValue(b.a, compareSort)) - Math.abs(getCompareValue(a.b, compareSort) - getCompareValue(a.a, compareSort)))
                    .map(c => {
                    const marginUp = c.marginDiff > 0;
                    const freqUp = c.freqDiff > 0;
                    const metricDiff = getCompareValue(c.b, compareSort) - getCompareValue(c.a, compareSort);
                    const metricUp = metricDiff > 0;
                    const metricLabel = compareSort === 'score'
                      ? `${metricDiff > 0 ? '+' : ''}${metricDiff.toFixed(0)}`
                      : `${metricDiff > 0 ? '+' : ''}€${metricDiff.toFixed(0)}`;
                    const metricBase = compareSort === 'score'
                      ? `${getCompareValue(c.a, compareSort).toFixed(0)} → ${getCompareValue(c.b, compareSort).toFixed(0)}`
                      : `€${getCompareValue(c.a, compareSort).toFixed(0)} → €${getCompareValue(c.b, compareSort).toFixed(0)}`;
                    return (
                      <div key={c.name} className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 py-2.5 px-1 rounded-lg items-center ${rowHover} transition-colors`}>
                        <div>
                          <p className={`text-sm font-semibold ${textColor}`}>{c.name}</p>
                          <p className={`text-xs ${mutedText}`}>{c.category}</p>
                        </div>
                        {/* Margine */}
                        <div className="text-right w-20">
                          <p className={`text-sm font-bold ${marginUp ? (isDinner ? 'text-emerald-400' : 'text-emerald-600') : (isDinner ? 'text-rose-400' : 'text-rose-600')}`}>
                            {c.marginDiff > 0 ? '+' : ''}{c.marginDiff.toFixed(1)}pp
                          </p>
                          <p className={`text-xs ${mutedText}`}>{c.a.marginPct.toFixed(1)}% → {c.b.marginPct.toFixed(1)}%</p>
                        </div>
                        {/* Ordini */}
                        <div className="text-right w-16">
                          <p className={`text-sm font-bold ${freqUp ? (isDinner ? 'text-emerald-400' : 'text-emerald-600') : c.freqDiff < 0 ? (isDinner ? 'text-rose-400' : 'text-rose-600') : mutedText}`}>
                            {c.freqDiff > 0 ? '+' : ''}{c.freqDiff}
                          </p>
                          <p className={`text-xs ${mutedText}`}>{c.a.frequency} → {c.b.frequency}</p>
                        </div>
                        {/* Metrica selezionata */}
                        <div className="text-right w-20">
                          <p className={`text-sm font-bold ${metricUp ? accentColor : metricDiff < 0 ? (isDinner ? 'text-rose-400' : 'text-rose-600') : mutedText}`}>
                            {metricLabel}
                          </p>
                          <p className={`text-xs ${mutedText}`}>{metricBase}</p>
                        </div>
                        {/* Quadrante */}
                        <div className="text-right w-28">
                          {c.quadrantChanged ? (
                            <div>
                              <p className={`text-xs font-semibold ${quadrantColor(c.b.quadrant, isDinner)}`}>{quadrantLabel[c.b.quadrant]}</p>
                              <p className={`text-[10px] line-through ${mutedText}`}>{quadrantLabel[c.a.quadrant]}</p>
                            </div>
                          ) : (
                            <p className={`text-xs ${quadrantColor(c.a.quadrant, isDinner)}`}>{quadrantLabel[c.a.quadrant]}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── LISTA PERIODI ── */}
      {activeTab === 'periodi' && snapshots.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-20 gap-4 ${mutedText}`}>
          <BarChart2 className="w-12 h-12 opacity-30" />
          <p className="text-sm">Nessuna analisi salvata ancora.</p>
        </div>
      ) : activeTab === 'periodi' ? (
        <div className="space-y-3">
          <h2 className={`text-sm font-bold uppercase tracking-wider ${mutedText}`}>Periodi salvati</h2>
          {snapshots.map(snap => {
            const isExpanded = expandedId === snap.id;
            const dishes = snap.data.dishes;
            const stelle = dishes.filter(d => d.quadrant === 'stella');
            const rivedi = dishes.filter(d => d.quadrant === 'rivedi');
            const promuovi = dishes.filter(d => d.quadrant === 'promuovi');
            return (
              <Card key={snap.id} className={cardBg}>
                {/* Header periodo */}
                <div className={`flex items-center gap-3 px-5 py-4 cursor-pointer ${rowHover} rounded-xl transition-colors`}
                  onClick={() => setExpandedId(isExpanded ? null : snap.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`font-bold text-base ${textColor}`}>{snap.label}</span>
                      <span className={`text-xs ${mutedText}`}>
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {formatDate(snap.period_start)} → {formatDate(snap.period_end)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                      <span className={`text-xs ${mutedText}`}>FC medio: <span className={`font-semibold ${textColor}`}>{snap.data.kpi.avgFoodCost.toFixed(1)}%</span></span>
                      <span className={`text-xs ${mutedText}`}>Margine medio: <span className={`font-semibold ${textColor}`}>{snap.data.kpi.avgMargin.toFixed(1)}%</span></span>
                      <span className={`text-xs ${mutedText}`}>Top: <span className={`font-semibold ${accentColor}`}>{snap.data.kpi.topDish}</span></span>
                      {snap.data.kpi.missingCount > 0 && (
                        <span className={`text-xs text-amber-500`}>{snap.data.kpi.missingCount} costi mancanti</span>
                      )}
                    </div>
                  </div>
                  {/* Pillole quadranti */}
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isDinner ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>⭐ {stelle.length}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isDinner ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>📣 {promuovi.length}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isDinner ? 'bg-slate-700/40 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>🔍 {rivedi.length}</span>
                  </div>
                  {/* Tasto elimina */}
                  <button
                    onClick={e => { e.stopPropagation(); setConfirmDeleteId(snap.id); }}
                    className={`p-1.5 rounded-lg transition-colors shrink-0 ${isDinner ? 'text-[#94A3B8] hover:text-rose-400 hover:bg-rose-950/20' : 'text-[#8C8A85] hover:text-rose-500 hover:bg-rose-50'}`}
                    title="Elimina periodo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {isExpanded ? <ChevronUp className={`w-4 h-4 shrink-0 ${mutedText}`} /> : <ChevronDown className={`w-4 h-4 shrink-0 ${mutedText}`} />}
                </div>

                {/* Confirm delete */}
                {confirmDeleteId === snap.id && (
                  <div className={`mx-4 mb-3 px-4 py-3 rounded-lg border flex items-center gap-3 ${isDinner ? 'bg-rose-950/20 border-rose-800/40' : 'bg-rose-50 border-rose-200'}`}>
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <p className={`text-sm flex-1 ${isDinner ? 'text-rose-300' : 'text-rose-700'}`}>Eliminare questo periodo? L'azione è irreversibile.</p>
                    <button onClick={() => handleDelete(snap.id)} disabled={deletingId === snap.id}
                      className="px-3 py-1.5 rounded-md bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-colors disabled:opacity-50">
                      {deletingId === snap.id ? '…' : 'Elimina'}
                    </button>
                    <button onClick={() => setConfirmDeleteId(null)} className={`p-1 rounded ${mutedText} hover:${textColor}`}><X className="w-4 h-4" /></button>
                  </div>
                )}

                {/* Dettaglio espanso */}
                {isExpanded && (
                  <CardContent className={`pt-0 border-t ${divider}`}>
                    <div className="space-y-4 pt-4">
                      {/* Tabella piatti */}
                      <div className="space-y-1">
                          {/* Selettore ordinamento */}
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                          <span className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>Piatti food</span>
                          <div className={`flex gap-1 p-0.5 rounded-lg border ${isDinner ? 'bg-[#0F172A] border-[#334155]' : 'bg-black/5 border-[#EAE5DA]'}`}>
                            {([
                              { key: 'score',    label: 'Score' },
                              { key: 'guadagno', label: 'Guadagno' },
                              { key: 'ricavo',   label: 'Ricavo' },
                            ] as const).map(opt => (
                              <button key={opt.key} onClick={() => setDetailSort(opt.key)}
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                                  detailSort === opt.key
                                    ? (isDinner ? 'bg-[#967D62] text-white' : 'bg-white text-[#967D62] shadow-sm border border-[#EAE5DA]')
                                    : `${mutedText} hover:text-[#967D62]`
                                }`}
                              >{opt.label}</button>
                            ))}
                          </div>
                        </div>
                        <div className={`hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 pb-2 border-b ${divider} text-xs font-bold uppercase tracking-wider ${mutedText}`}>
                          <span>Piatto</span>
                          <span className="text-right w-16">Margine</span>
                          <span className="text-right w-16">Ordini</span>
                          <span className="text-right w-20">{detailSort === 'score' ? 'Score' : detailSort === 'guadagno' ? 'Guadagno' : 'Ricavo'}</span>
                          <span className="text-right w-24">Quadrante</span>
                        </div>
                        {dishes
                          .filter(d => !isBeverageCategory(d.category))
                          .sort((a, b) => getDetailValue(b, detailSort) - getDetailValue(a, detailSort))
                          .map(d => {
                            const val = getDetailValue(d, detailSort);
                            const valLabel = detailSort === 'score'
                              ? (d.score != null ? d.score.toFixed(0) : '—')
                              : `€${val.toFixed(0)}`;
                            return (
                          <div key={d.name} className={`py-2 px-1 rounded-lg ${rowHover} transition-colors`}>
                            {/* Mobile: stacked */}
                            <div className="flex items-center justify-between gap-2 sm:hidden">
                              <div className="min-w-0 flex-1">
                                <p className={`text-sm font-medium truncate ${textColor}`}>{d.name}</p>
                                <p className={`text-[10px] ${mutedText}`}>{d.category}</p>
                              </div>
                              <div className="flex items-center gap-3 shrink-0 text-right">
                                <div>
                                  <p className={`text-xs ${mutedText}`}>Margine</p>
                                  <p className={`text-sm font-bold ${d.hasMissingCosts ? mutedText : d.marginPct >= 60 ? (isDinner ? 'text-emerald-400' : 'text-emerald-600') : d.marginPct >= 40 ? accentColor : (isDinner ? 'text-rose-400' : 'text-rose-600')}`}>{d.hasMissingCosts ? '—' : `${d.marginPct.toFixed(1)}%`}</p>
                                </div>
                                <div>
                                  <p className={`text-xs ${mutedText}`}>{detailSort === 'score' ? 'Score' : detailSort === 'guadagno' ? 'Guad.' : 'Ric.'}</p>
                                  <p className={`text-sm font-bold ${accentColor}`}>{valLabel}</p>
                                </div>
                              </div>
                            </div>
                            {/* Desktop: grid */}
                            <div className={`hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center`}>
                              <div>
                                <p className={`text-sm font-medium ${textColor}`}>{d.name}</p>
                                <p className={`text-xs ${mutedText}`}>{d.category}</p>
                              </div>
                              <p className={`text-sm font-bold text-right w-16 ${d.hasMissingCosts ? mutedText : d.marginPct >= 60 ? (isDinner ? 'text-emerald-400' : 'text-emerald-600') : d.marginPct >= 40 ? accentColor : (isDinner ? 'text-rose-400' : 'text-rose-600')}`}>{d.hasMissingCosts ? '—' : `${d.marginPct.toFixed(1)}%`}</p>
                              <p className={`text-sm font-bold text-right w-16 ${textColor}`}>{d.frequency > 0 ? d.frequency : '—'}</p>
                              <p className={`text-sm font-bold text-right w-20 ${accentColor}`}>{valLabel}</p>
                              <p className={`text-xs font-semibold text-right w-24 ${quadrantColor(d.quadrant, isDinner)}`}>{quadrantLabel[d.quadrant]}</p>
                            </div>
                          </div>
                            );
                          })}
                      </div>
                      {/* Bevande nello storico — solo ranking frequenza */}
                      {dishes.some(d => isBeverageCategory(d.category)) && (
                        <div className={`mt-4 pt-3 border-t ${divider}`}>
                          <p className={`text-xs font-bold uppercase tracking-wider ${mutedText} mb-2`}>🍹 Frequenze Bevande</p>
                          {dishes
                            .filter(d => isBeverageCategory(d.category))
                            .sort((a, b) => b.frequency - a.frequency)
                            .map((d, idx) => {
                              const maxFreq = dishes.filter(x => isBeverageCategory(x.category)).reduce((m, x) => Math.max(m, x.frequency), 1);
                              const barW = (d.frequency / maxFreq) * 100;
                              return (
                                <div key={d.name} className="flex items-center gap-3 py-1.5 px-1">
                                  <span className={`text-xs w-5 shrink-0 font-bold ${mutedText}`}>{idx + 1}</span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                      <span className={`text-sm font-medium truncate ${textColor}`}>{d.name}</span>
                                      <span className={`text-sm font-bold shrink-0 ml-2 ${textColor}`}>{d.frequency > 0 ? d.frequency : '—'}</span>
                                    </div>
                                    <div className={`h-1 rounded-full overflow-hidden ${isDinner ? 'bg-[#334155]' : 'bg-[#EAE5DA]'}`}>
                                      <div className="h-full rounded-full bg-[#967D62]/60" style={{ width: `${barW}%` }} />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      ) : null}

      {/* ── TAB TREND ── */}
      {activeTab === 'trend' && (
        <div className="space-y-6">
          {chronoSnapshots.length < 3 ? (
            <div className={`flex flex-col items-center justify-center py-16 gap-3 ${mutedText}`}>
              <LineChartIcon className="w-10 h-10 opacity-30" />
              <p className="text-sm text-center">Servono almeno <span className="font-semibold">3 periodi</span> per visualizzare i trend.<br />Hai {chronoSnapshots.length} period{chronoSnapshots.length === 1 ? 'o' : 'i'} salvat{chronoSnapshots.length === 1 ? 'o' : 'i'}.</p>
            </div>
          ) : (
            <>
              {/* Selettore piatti stile gestione disponibilità */}
              <Card className={cardBg}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <CardTitle className={`text-base flex items-center gap-2 ${accentColor}`}>
                      <Plus className="w-4 h-4" /> Seleziona piatti da graficare
                    </CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      {trendDishes.length > 0 && (
                        <button onClick={() => setTrendDishes([])} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${isDinner ? 'border-[#334155] text-rose-400 hover:bg-rose-950/20' : 'border-[#EAE5DA] text-rose-500 hover:bg-rose-50'}`}>
                          Rimuovi tutti
                        </button>
                      )}
                      {trendDishes.map((name, i) => (
                        <span key={name} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: TREND_COLORS[i % TREND_COLORS.length] }}>
                          {name}
                          <button onClick={() => setTrendDishes(prev => prev.filter(d => d !== name))} className="hover:opacity-70 ml-0.5">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={trendSearch}
                    onChange={e => setTrendSearch(e.target.value)}
                    placeholder="Cerca piatto…"
                    className={`w-full px-3 py-2 rounded-xl border text-sm mt-2 ${isDinner ? 'bg-[#0F172A] border-[#334155] text-[#F4F1EA] placeholder:text-[#475569]' : 'border-[#EAE5DA] placeholder:text-gray-400'}`}
                  />
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4 max-h-[50vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {MENU_CATEGORIES.filter(cat => cat.name !== 'COCKTAILS & BEVERAGE').map(cat => {
                      const catDishes = cat.items.filter(name =>
                        allDishNames.includes(name) &&
                        name.toLowerCase().includes(trendSearch.toLowerCase())
                      );
                      if (catDishes.length === 0) return null;
                      return (
                        <div key={cat.name}>
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${mutedText} mb-2`}>{cat.name}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {catDishes.map(name => {
                              const isSelected = trendDishes.includes(name);
                              const colorIdx = trendDishes.indexOf(name);
                              return (
                                <div key={name} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${
                                  isSelected
                                    ? (isDinner ? 'border-[#967D62]/60 bg-[#967D62]/10' : 'border-[#967D62]/60 bg-[#967D62]/5')
                                    : (isDinner ? 'border-[#334155] bg-[#0F172A]/40' : 'border-[#EAE5DA] bg-white')
                                }`}>
                                  <div className="flex items-center gap-2 min-w-0">
                                    {isSelected && (
                                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: TREND_COLORS[colorIdx % TREND_COLORS.length] }} />
                                    )}
                                    <span className={`text-sm font-medium truncate ${textColor}`}>{name}</span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      if (isSelected) {
                                        setTrendDishes(prev => prev.filter(d => d !== name));
                                      } else if (trendDishes.length < 10) {
                                        setTrendDishes(prev => [...prev, name]);
                                      }
                                    }}
                                    disabled={!isSelected && trendDishes.length >= 10}
                                    className={`text-xs px-3 py-1 rounded-lg font-semibold shrink-0 ml-2 transition-colors disabled:opacity-30 ${
                                      isSelected
                                        ? (isDinner ? 'bg-rose-900/30 text-rose-400 hover:bg-rose-900/50' : 'bg-rose-50 text-rose-600 hover:bg-rose-100')
                                        : (isDinner ? 'bg-[#967D62]/20 text-[#C4A882] hover:bg-[#967D62]/30' : 'bg-[#967D62]/10 text-[#967D62] hover:bg-[#967D62]/20')
                                    }`}
                                  >
                                    {isSelected ? 'Rimuovi' : 'Aggiungi'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {trendDishes.length > 0 && (() => {
                const freqData = buildChartData('frequency');
                const marginData = buildChartData('marginPct');
                const scoreData = buildChartData('score');

                const chartProps = {
                  margin: { top: 5, right: 20, left: 0, bottom: 5 },
                };
                const axisProps = {
                  tick: { fontSize: 11, fill: isDinner ? '#94A3B8' : '#8C8A85' },
                  stroke: isDinner ? '#334155' : '#EAE5DA',
                };
                const gridProps = {
                  strokeDasharray: '3 3',
                  stroke: isDinner ? '#334155' : '#EAE5DA',
                };
                const tooltipStyle = {
                  backgroundColor: isDinner ? '#1E293B' : '#fff',
                  border: `1px solid ${isDinner ? '#334155' : '#EAE5DA'}`,
                  borderRadius: 8,
                  fontSize: 12,
                  color: isDinner ? '#F4F1EA' : '#2C2A28',
                };

                return (
                  <div className="space-y-6">
                    {/* Grafico Frequenze */}
                    <Card className={cardBg}>
                      <CardHeader className="pb-2">
                        <CardTitle className={`text-base flex items-center gap-2 ${accentColor}`}>
                          <TrendingUp className="w-4 h-4" /> Frequenze ordini
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={260}>
                          <LineChart data={freqData} {...chartProps}>
                            <CartesianGrid {...gridProps} />
                            <XAxis dataKey="period" {...axisProps} />
                            <YAxis {...axisProps} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(v: any, name: string) => [`${v} ordini`, name]} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            {trendDishes.map((name, i) => (
                              <Line key={name} type="monotone" dataKey={name} stroke={TREND_COLORS[i % TREND_COLORS.length]}
                                strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Grafico Margine% */}
                    <Card className={cardBg}>
                      <CardHeader className="pb-2">
                        <CardTitle className={`text-base flex items-center gap-2 ${accentColor}`}>
                          <BarChart2 className="w-4 h-4" /> Margine %
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={260}>
                          <LineChart data={marginData} {...chartProps}>
                            <CartesianGrid {...gridProps} />
                            <XAxis dataKey="period" {...axisProps} />
                            <YAxis unit="%" {...axisProps} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(v: any, name: string) => [`${v}%`, name]} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            {trendDishes.map((name, i) => (
                              <Line key={name} type="monotone" dataKey={name} stroke={TREND_COLORS[i % TREND_COLORS.length]}
                                strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Grafico Score */}
                    <Card className={cardBg}>
                      <CardHeader className="pb-2">
                        <CardTitle className={`text-base flex items-center gap-2 ${accentColor}`}>
                          <Zap className="w-4 h-4" /> Score (Margine% × Frequenza)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={260}>
                          <LineChart data={scoreData} {...chartProps}>
                            <CartesianGrid {...gridProps} />
                            <XAxis dataKey="period" {...axisProps} />
                            <YAxis {...axisProps} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(v: any, name: string) => [v, name]} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            {trendDishes.map((name, i) => (
                              <Line key={name} type="monotone" dataKey={name} stroke={TREND_COLORS[i % TREND_COLORS.length]}
                                strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Correlazioni prezzo */}
                    {correlations.filter(c => trendDishes.includes(c.dish)).length > 0 && (
                      <Card className={cardBg}>
                        <CardHeader className="pb-2">
                          <CardTitle className={`text-base flex items-center gap-2 ${accentColor}`}>
                            <Zap className="w-4 h-4" /> Possibili correlazioni prezzo → frequenza
                          </CardTitle>
                          <p className={`text-xs ${mutedText}`}>Rilevate quando il prezzo è cambiato e la frequenza ha risposto in modo significativo nello stesso periodo.</p>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {correlations.filter(c => trendDishes.includes(c.dish)).map((c, i) => (
                              <div key={i} className={`flex items-center gap-4 p-3 rounded-lg border ${isDinner ? 'bg-[#0F172A] border-[#334155]' : 'bg-gray-50 border-[#EAE5DA]'}`}>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-semibold ${accentColor} truncate`}>{c.dish}</p>
                                  <p className={`text-xs ${mutedText}`}>{c.periodA} → {c.periodB}</p>
                                </div>
                                <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.priceDiff < 0 ? (isDinner ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (isDinner ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-50 text-rose-600')}`}>
                                  Prezzo {c.priceDiff > 0 ? '+' : ''}{c.priceDiff.toFixed(2)}€
                                </div>
                                <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.freqDiff > 0 ? (isDinner ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (isDinner ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-50 text-rose-600')}`}>
                                  Ordini {c.freqDiff > 0 ? '+' : ''}{c.freqDiff}
                                </div>
                                <div className={`text-xs ${c.type === 'positive' ? (isDinner ? 'text-emerald-400' : 'text-emerald-600') : (isDinner ? 'text-amber-400' : 'text-amber-600')} font-semibold hidden sm:block`}>
                                  {c.type === 'positive' ? '↔ correlazione attesa' : '↔ correlazione inversa'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                );
              })()}

              {/* Trend automatici rilevati */}
              {autoTrends.length > 0 && (
                <Card className={cardBg}>
                  <CardHeader className="pb-2">
                    <CardTitle className={`text-base flex items-center gap-2 ${accentColor}`}>
                      <TrendingUp className="w-4 h-4" /> Tendenze rilevate automaticamente
                    </CardTitle>
                    <p className={`text-xs ${mutedText}`}>
                      Piatti con variazione costante negli ultimi 3 periodi. Aggiornato ad ogni nuovo periodo salvato.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {autoTrends.map((t, i) => {
                        const isUp = t.direction === 'up';
                        const isGoodUp = t.metric === 'marginPct' || t.metric === 'frequency';
                        const isPositive = isUp ? isGoodUp : !isGoodUp;
                        const color = isPositive
                          ? (isDinner ? 'text-emerald-400' : 'text-emerald-600')
                          : (isDinner ? 'text-rose-400' : 'text-rose-600');
                        const bg = isPositive
                          ? (isDinner ? 'bg-emerald-950/20 border-emerald-800/30' : 'bg-emerald-50 border-emerald-100')
                          : (isDinner ? 'bg-rose-950/20 border-rose-800/30' : 'bg-rose-50 border-rose-100');
                        const Icon = isUp ? TrendingUp : TrendingDown;
                        return (
                          <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${bg}`}>
                            <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${color}`} />
                            <div className="flex-1 min-w-0">
                              <p className={`font-semibold text-sm ${textColor} truncate`}>{t.name}</p>
                              <p className={`text-xs ${mutedText}`}>{t.category}</p>
                              <p className={`text-xs font-semibold mt-0.5 ${color}`}>
                                {isUp ? '▲' : '▼'} {t.metricLabel} &nbsp;
                                <span className={`font-normal ${mutedText}`}>{t.pctChange > 0 ? '+' : ''}{t.pctChange.toFixed(1)}% · {(t as any).periodsCount ?? t.values.length} periodi consecutivi</span>
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                if (!trendDishes.includes(t.name) && trendDishes.length < 10) {
                                  setTrendDishes(prev => [...prev, t.name]);
                                }
                              }}
                              disabled={trendDishes.includes(t.name)}
                              className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0 ${
                                isDinner ? 'border-[#334155] text-[#94A3B8] hover:border-[#967D62]/60 hover:text-[#C4A882]' : 'border-[#EAE5DA] text-[#8C8A85] hover:border-[#967D62]/60 hover:text-[#967D62]'
                              }`}
                            >
                              + Grafico
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

            </>
          )}
        </div>
      )}
    </main>
  );
}
