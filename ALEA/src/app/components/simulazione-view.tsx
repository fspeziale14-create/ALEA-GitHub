// ================================================================
// ALEA — Simulazione Sandbox
// Usa i dati di un periodo salvato per simulare variazioni
// di prezzo, quantità ingredienti e frequenza ordini.
// ================================================================

import { useState, useEffect, useMemo } from 'react';
import {
  ChevronDown, ChevronUp, RotateCcw, TrendingUp, TrendingDown,
  Minus, ArrowUp, ArrowDown, Star, AlertCircle, Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

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

// Valori simulati per un piatto
interface DishSim {
  price: number;       // prezzo vendita simulato
  ingCost: number;     // costo ingredienti simulato (scalato proporzionalmente)
  frequency: number;   // frequenza simulata
  ingScale: number;    // scala ingredienti 0.5–1.5 (1 = invariato)
}

interface SimulazioneViewProps {
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
  stella:   '⭐ Stella',
  promuovi: '📣 Da promuovere',
  rivedi:   '🔍 Da rivedere',
  valuta:   '💤 Da valutare',
};

const quadrantColor = (q: string, isDinner: boolean) => {
  if (q === 'stella')   return isDinner ? 'text-amber-400'   : 'text-amber-600';
  if (q === 'promuovi') return isDinner ? 'text-emerald-400' : 'text-emerald-600';
  if (q === 'rivedi')   return isDinner ? 'text-slate-400'   : 'text-slate-500';
  return isDinner ? 'text-rose-400' : 'text-rose-600';
};

// Calcola quadrante con le soglie mediana del periodo (fisse)
const computeQuadrant = (
  marginPct: number,
  frequency: number,
  medianMargin: number,
  medianFreq: number
): 'stella' | 'promuovi' | 'rivedi' | 'valuta' => {
  if (frequency >= medianFreq && marginPct >= medianMargin) return 'stella';
  if (frequency < medianFreq  && marginPct >= medianMargin) return 'promuovi';
  if (frequency >= medianFreq && marginPct < medianMargin)  return 'rivedi';
  return 'valuta';
};

const formatDate = (d: string) =>
  new Date(d + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });

// ── COMPONENTE PRINCIPALE ─────────────────────────────────────────

export function SimulazioneView({
  isDinner, textColor, mutedText, cardBg, accentColor, supabase, isLoggedIn
}: SimulazioneViewProps) {

  const divider  = isDinner ? 'border-[#334155]' : 'border-[#EAE5DA]';
  const rowHover = isDinner ? 'hover:bg-[#334155]/40' : 'hover:bg-[#F4F1EA]/60';
  const inputCls = isDinner ? 'bg-[#0F172A] border-[#334155] text-[#F4F1EA]' : 'bg-white border-[#EAE5DA] text-[#2C2A28]';
  const sliderCls = `w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#967D62]`;

  // ── STATE ─────────────────────────────────────────────────────
  const [snapshots, setSnapshots] = useState<AnalysisSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>('');
  const [expandedDish, setExpandedDish] = useState<string | null>(null);
  const [simDropOpen, setSimDropOpen] = useState(false);
  const [simBevOpen, setSimBevOpen] = useState(false);
  // Mappa nome piatto → valori simulati (solo piatti modificati)
  const [simValues, setSimValues] = useState<Record<string, DishSim>>({});

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

  const snapshot = snapshots.find(s => s.id === selectedId) ?? null;

  // Reset simulazione quando si cambia periodo
  useEffect(() => { setSimValues({}); setExpandedDish(null); }, [selectedId]);

  // ── CALCOLI BASE PERIODO ────────────────────────────────────
  const baseMedians = useMemo(() => {
    if (!snapshot) return { margin: 0, freq: 0 };
    const withFreq = snapshot.data.dishes.filter(d => d.frequency > 0 && !d.hasMissingCosts);
    const margins = [...withFreq].map(d => d.marginPct).sort((a, b) => a - b);
    const freqs   = [...withFreq].map(d => d.frequency).sort((a, b) => a - b);
    const mid = (arr: number[]) => arr.length ? arr[Math.floor(arr.length / 2)] : 0;
    return { margin: mid(margins), freq: mid(freqs) };
  }, [snapshot]);

  // ── VALORE SIMULATO PER UN PIATTO ──────────────────────────
  const getSimDish = (dish: DishSnapshot): DishSim => {
    if (simValues[dish.name]) return simValues[dish.name];
    return {
      price:     dish.priceNet,
      ingCost:   dish.ingredientCost,
      frequency: dish.frequency,
      ingScale:  1,
    };
  };

  const updateSim = (dishName: string, field: keyof DishSim, value: number) => {
    setSimValues(prev => {
      const dish = snapshot!.data.dishes.find(d => d.name === dishName)!;
      const current = prev[dishName] ?? {
        price:     dish.priceNet,
        ingCost:   dish.ingredientCost,
        frequency: dish.frequency,
        ingScale:  1,
      };
      const updated = { ...current, [field]: value };
      // Se scale ingredienti cambia, ricalcola ingCost proporzionalmente
      if (field === 'ingScale') {
        updated.ingCost = dish.ingredientCost * value;
      }
      return { ...prev, [dishName]: updated };
    });
  };

  const resetDish = (dishName: string) => {
    setSimValues(prev => {
      const next = { ...prev };
      delete next[dishName];
      return next;
    });
  };

  // ── TOTALI SIMULATI ────────────────────────────────────────
  const totals = useMemo(() => {
    if (!snapshot) return null;
    let baseRevenue = 0, baseMarginTotal = 0;
    let simRevenue = 0, simMarginTotal = 0;
    let baseCovers = 0, simCovers = 0;

    snapshot.data.dishes.forEach(dish => {
      if (dish.hasMissingCosts) return;
      const sim = getSimDish(dish);
      const baseMargin = dish.priceNet - dish.ingredientCost;
      const simMarginVal = sim.price - sim.ingCost;

      baseRevenue     += dish.priceNet * dish.frequency;
      baseMarginTotal += baseMargin    * dish.frequency;
      baseCovers      += dish.frequency;

      simRevenue      += sim.price    * sim.frequency;
      simMarginTotal  += simMarginVal * sim.frequency;
      simCovers       += sim.frequency;
    });

    return {
      baseRevenue, baseMarginTotal, baseCovers,
      simRevenue,  simMarginTotal,  simCovers,
      revenueDiff: simRevenue      - baseRevenue,
      marginDiff:  simMarginTotal  - baseMarginTotal,
      coversDiff:  simCovers       - baseCovers,
    };
  }, [snapshot, simValues]);

  const modifiedCount = Object.keys(simValues).length;

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

      {/* Header */}
      <div>
        <h1 className={`text-3xl font-bold tracking-tight ${textColor}`}>Simulazione</h1>
        <p className={`${mutedText} mt-1`}>Modifica prezzo, quantità ingredienti e frequenza ordini per vedere l'impatto sugli incassi a parità di periodo.</p>
      </div>

      {/* Selezione periodo */}
      <Card className={cardBg}>
        <CardContent className="pt-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <p className={`text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>Periodo di riferimento</p>
              {snapshots.length === 0 ? (
                <p className={`text-sm ${mutedText}`}>Nessun periodo salvato. Carica le frequenze in Redditività e salva una prima analisi.</p>
              ) : (
                <div className="relative" style={{ maxWidth: 480 }}>
                  <button
                    onClick={() => setSimDropOpen(v => !v)}
                    className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                      snapshot
                        ? (isDinner ? 'border-[#967D62]/60 bg-[#967D62]/10 text-[#F4F1EA]' : 'border-[#967D62]/60 bg-[#967D62]/5 text-[#2C2A28]')
                        : (isDinner ? 'border-[#334155] text-[#94A3B8] hover:border-[#967D62]/40' : 'border-[#EAE5DA] text-[#8C8A85] hover:border-[#967D62]/40')
                    }`}
                  >
                    <span className="truncate">
                      {snapshot ? `${snapshot.label} (${formatDate(snapshot.period_start)} → ${formatDate(snapshot.period_end)})` : '— Seleziona un periodo —'}
                    </span>
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${simDropOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {simDropOpen && (
                    <div className={`absolute z-50 mt-1 w-full rounded-xl border shadow-xl overflow-hidden ${isDinner ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#EAE5DA]'}`}>
                      {snapshots.map(s => (
                        <button
                          key={s.id}
                          onClick={() => { setSelectedId(s.id); setSimDropOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            s.id === selectedId
                              ? (isDinner ? 'bg-[#967D62]/20 text-[#F4F1EA]' : 'bg-[#967D62]/10 text-[#967D62]')
                              : (isDinner ? 'text-[#F4F1EA] hover:bg-[#334155]/40' : 'text-[#2C2A28] hover:bg-[#F4F1EA]/60')
                          }`}
                        >
                          <span className="font-semibold">{s.label}</span>
                          <span className={`ml-2 text-xs ${mutedText}`}>{formatDate(s.period_start)} → {formatDate(s.period_end)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {snapshot && modifiedCount > 0 && (
              <button
                onClick={() => setSimValues({})}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${isDinner ? 'border-[#334155] text-[#94A3B8] hover:text-rose-400 hover:border-rose-800/40' : 'border-[#EAE5DA] text-[#8C8A85] hover:text-rose-500 hover:border-rose-200'}`}
              >
                <RotateCcw className="w-4 h-4" />
                Reset tutto ({modifiedCount} modificat{modifiedCount === 1 ? 'o' : 'i'})
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {snapshot && (
        <>
          {/* KPI simulati vs reali */}
          {totals && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                {
                  label: 'Ricavi totali',
                  base: `€${totals.baseRevenue.toFixed(0)}`,
                  sim:  `€${totals.simRevenue.toFixed(0)}`,
                  diff: totals.revenueDiff,
                  fmt: (v: number) => `${v >= 0 ? '+' : ''}€${v.toFixed(0)}`,
                  good: (v: number) => v >= 0,
                },
                {
                  label: 'Margine totale',
                  base: `€${totals.baseMarginTotal.toFixed(0)}`,
                  sim:  `€${totals.simMarginTotal.toFixed(0)}`,
                  diff: totals.marginDiff,
                  fmt: (v: number) => `${v >= 0 ? '+' : ''}€${v.toFixed(0)}`,
                  good: (v: number) => v >= 0,
                },
                {
                  label: 'Coperti simulati',
                  base: `${totals.baseCovers}`,
                  sim:  `${totals.simCovers}`,
                  diff: totals.coversDiff,
                  fmt: (v: number) => `${v >= 0 ? '+' : ''}${v}`,
                  good: (v: number) => v >= 0,
                },
              ].map(kpi => {
                const isGood = kpi.good(kpi.diff);
                const DiffIcon = kpi.diff === 0 ? Minus : kpi.diff > 0 ? ArrowUp : ArrowDown;
                const diffColor = kpi.diff === 0 ? mutedText
                  : isGood
                  ? (isDinner ? 'text-emerald-400' : 'text-emerald-600')
                  : (isDinner ? 'text-rose-400' : 'text-rose-600');
                return (
                  <div key={kpi.label} className={`p-4 rounded-xl border ${cardBg}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${mutedText} mb-1`}>{kpi.label}</p>
                    <p className={`text-2xl font-bold ${textColor}`}>{kpi.sim}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs ${mutedText}`}>Base: {kpi.base}</span>
                      <span className={`flex items-center gap-0.5 text-xs font-bold ${diffColor}`}>
                        <DiffIcon className="w-3 h-3" />{kpi.fmt(kpi.diff)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Info soglie */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${isDinner ? 'bg-[#0F172A] border-[#334155] text-[#94A3B8]' : 'bg-gray-50 border-[#EAE5DA] text-[#8C8A85]'}`}>
            <Info className="w-3.5 h-3.5 shrink-0" />
            Soglie quadrante fisse del periodo — Margine mediana: <strong className={textColor}>{baseMedians.margin.toFixed(1)}%</strong>, Frequenza mediana: <strong className={textColor}>{baseMedians.freq.toFixed(0)}</strong>
          </div>

          {/* Lista piatti */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className={`text-sm font-bold uppercase tracking-wider ${mutedText}`}>
                Piatti — {snapshot.data.dishes.filter(d => !isBeverageCategory(d.category)).length} piatti food
              </h2>
              {modifiedCount > 0 && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isDinner ? 'bg-[#967D62]/20 text-[#C4A882]' : 'bg-[#967D62]/10 text-[#967D62]'}`}>
                  {modifiedCount} modificat{modifiedCount === 1 ? 'o' : 'i'}
                </span>
              )}
            </div>

            {snapshot.data.dishes.filter(d => !isBeverageCategory(d.category)).map(dish => {
              const sim = getSimDish(dish);
              const isModified = !!simValues[dish.name];
              const isExpanded = expandedDish === dish.name;

              const simMarginPct = sim.price > 0
                ? ((sim.price - sim.ingCost) / sim.price) * 100
                : 0;
              const simScore = simMarginPct * sim.frequency;
              const simQuadrant = computeQuadrant(simMarginPct, sim.frequency, baseMedians.margin, baseMedians.freq);
              const quadrantChanged = simQuadrant !== dish.quadrant;

              const marginDiff  = simMarginPct - dish.marginPct;
              const freqDiff    = sim.frequency - dish.frequency;
              const scoreDiff   = simScore - (dish.score ?? 0);

              return (
                <Card key={dish.name} className={`${cardBg} ${isModified ? (isDinner ? 'ring-1 ring-[#967D62]/40' : 'ring-1 ring-[#967D62]/30') : ''}`}>
                  {/* Riga piatto */}
                  <div
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${rowHover} rounded-xl transition-colors`}
                    onClick={() => setExpandedDish(isExpanded ? null : dish.name)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold text-sm ${textColor}`}>{dish.name}</span>
                        {isModified && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isDinner ? 'bg-[#967D62]/20 text-[#C4A882]' : 'bg-[#967D62]/10 text-[#967D62]'}`}>modificato</span>}
                      </div>
                      <span className={`text-xs ${mutedText}`}>{dish.category}</span>
                    </div>

                    {/* Mini KPI inline */}
                    {!dish.hasMissingCosts && (
                      <div className="hidden sm:flex items-center gap-4 shrink-0 text-right">
                        {/* Prezzo */}
                        <div>
                          <p className={`text-[10px] ${mutedText}`}>Prezzo</p>
                          <p className={`text-sm font-bold ${textColor}`}>€{sim.price.toFixed(2)}</p>
                          {isModified && sim.price !== dish.priceNet && (
                            <p className={`text-[10px] ${sim.price > dish.priceNet ? (isDinner ? 'text-emerald-400' : 'text-emerald-600') : (isDinner ? 'text-rose-400' : 'text-rose-600')}`}>
                              {sim.price > dish.priceNet ? '+' : ''}{(sim.price - dish.priceNet).toFixed(2)}
                            </p>
                          )}
                        </div>
                        {/* Margine */}
                        <div>
                          <p className={`text-[10px] ${mutedText}`}>Margine</p>
                          <p className={`text-sm font-bold ${simMarginPct >= 60 ? (isDinner ? 'text-emerald-400' : 'text-emerald-600') : simMarginPct >= 40 ? accentColor : (isDinner ? 'text-rose-400' : 'text-rose-600')}`}>
                            {simMarginPct.toFixed(1)}%
                          </p>
                          {isModified && Math.abs(marginDiff) >= 0.1 && (
                            <p className={`text-[10px] ${marginDiff > 0 ? (isDinner ? 'text-emerald-400' : 'text-emerald-600') : (isDinner ? 'text-rose-400' : 'text-rose-600')}`}>
                              {marginDiff > 0 ? '+' : ''}{marginDiff.toFixed(1)}pp
                            </p>
                          )}
                        </div>
                        {/* Score */}
                        <div>
                          <p className={`text-[10px] ${mutedText}`}>Score</p>
                          <p className={`text-sm font-bold ${accentColor}`}>{simScore.toFixed(0)}</p>
                          {isModified && Math.abs(scoreDiff) >= 1 && (
                            <p className={`text-[10px] ${scoreDiff > 0 ? accentColor : (isDinner ? 'text-rose-400' : 'text-rose-600')}`}>
                              {scoreDiff > 0 ? '+' : ''}{scoreDiff.toFixed(0)}
                            </p>
                          )}
                        </div>
                        {/* Quadrante */}
                        <div>
                          <p className={`text-[10px] ${mutedText}`}>Quadrante</p>
                          <p className={`text-xs font-semibold ${quadrantColor(simQuadrant, isDinner)}`}>{quadrantLabel[simQuadrant]}</p>
                          {quadrantChanged && (
                            <p className={`text-[10px] line-through ${mutedText}`}>{quadrantLabel[dish.quadrant]}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {dish.hasMissingCosts && (
                      <span className={`text-xs ${mutedText} shrink-0 flex items-center gap-1`}>
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Costi mancanti
                      </span>
                    )}

                    {isModified && (
                      <button onClick={e => { e.stopPropagation(); resetDish(dish.name); }}
                        className={`p-1.5 rounded-lg text-xs shrink-0 transition-colors ${isDinner ? 'text-[#94A3B8] hover:text-rose-400' : 'text-[#8C8A85] hover:text-rose-500'}`}
                        title="Reset piatto">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isExpanded ? <ChevronUp className={`w-4 h-4 shrink-0 ${mutedText}`} /> : <ChevronDown className={`w-4 h-4 shrink-0 ${mutedText}`} />}
                  </div>

                  {/* Pannello slider */}
                  {isExpanded && !dish.hasMissingCosts && (
                    <div className={`px-4 pb-4 border-t ${divider} pt-4 space-y-5`}>

                      {/* Slider prezzo vendita */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className={`text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Prezzo di vendita (IVA incl.)</label>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${textColor}`}>€{sim.price.toFixed(2)}</span>
                            {sim.price !== dish.priceNet && (
                              <span className={`text-xs font-semibold ${sim.price > dish.priceNet ? (isDinner ? 'text-emerald-400' : 'text-emerald-600') : (isDinner ? 'text-rose-400' : 'text-rose-600')}`}>
                                ({sim.price > dish.priceNet ? '+' : ''}{(sim.price - dish.priceNet).toFixed(2)})
                              </span>
                            )}
                          </div>
                        </div>
                        <input type="range"
                          min={Math.max(0.5, dish.priceNet * 0.5)}
                          max={dish.priceNet * 2}
                          step={0.1}
                          value={sim.price}
                          onChange={e => updateSim(dish.name, 'price', parseFloat(e.target.value))}
                          className={sliderCls}
                        />
                        <div className={`flex justify-between text-[10px] ${mutedText} mt-0.5`}>
                          <span>-50%</span>
                          <span className={accentColor}>Base: €{dish.priceNet.toFixed(2)}</span>
                          <span>+100%</span>
                        </div>
                      </div>

                      {/* Slider scala ingredienti */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className={`text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Quantità ingredienti</label>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${textColor}`}>{(sim.ingScale * 100).toFixed(0)}%</span>
                            <span className={`text-xs ${mutedText}`}>(costo: €{sim.ingCost.toFixed(3)})</span>
                            {sim.ingScale !== 1 && (
                              <span className={`text-xs font-semibold ${sim.ingScale < 1 ? (isDinner ? 'text-emerald-400' : 'text-emerald-600') : (isDinner ? 'text-rose-400' : 'text-rose-600')}`}>
                                ({sim.ingScale < 1 ? '' : '+'}{((sim.ingScale - 1) * 100).toFixed(0)}%)
                              </span>
                            )}
                          </div>
                        </div>
                        <input type="range"
                          min={0.5}
                          max={1.5}
                          step={0.01}
                          value={sim.ingScale}
                          onChange={e => updateSim(dish.name, 'ingScale', parseFloat(e.target.value))}
                          className={sliderCls}
                        />
                        <div className={`flex justify-between text-[10px] ${mutedText} mt-0.5`}>
                          <span>-50%</span>
                          <span className={accentColor}>Base</span>
                          <span>+50%</span>
                        </div>
                      </div>

                      {/* Slider frequenza */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className={`text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Frequenza ordini</label>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${textColor}`}>{sim.frequency} ordini</span>
                            {sim.frequency !== dish.frequency && (
                              <span className={`text-xs font-semibold ${sim.frequency > dish.frequency ? (isDinner ? 'text-emerald-400' : 'text-emerald-600') : (isDinner ? 'text-rose-400' : 'text-rose-600')}`}>
                                ({sim.frequency > dish.frequency ? '+' : ''}{sim.frequency - dish.frequency})
                              </span>
                            )}
                          </div>
                        </div>
                        <input type="range"
                          min={0}
                          max={Math.max(dish.frequency * 3, 10)}
                          step={1}
                          value={sim.frequency}
                          onChange={e => updateSim(dish.name, 'frequency', parseInt(e.target.value))}
                          className={sliderCls}
                        />
                        <div className={`flex justify-between text-[10px] ${mutedText} mt-0.5`}>
                          <span>0</span>
                          <span className={accentColor}>Base: {dish.frequency}</span>
                          <span>×3</span>
                        </div>
                      </div>

                      {/* Preview risultato piatto */}
                      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl border ${isDinner ? 'bg-[#0F172A] border-[#334155]' : 'bg-gray-50 border-[#EAE5DA]'}`}>
                        {[
                          { label: 'Food Cost',  val: `${dish.ingredientCost > 0 ? ((sim.ingCost / sim.price) * 100).toFixed(1) : '—'}%`,   base: `${dish.foodCostPct.toFixed(1)}%`   },
                          { label: 'Margine',    val: `${simMarginPct.toFixed(1)}%`,                                                           base: `${dish.marginPct.toFixed(1)}%`    },
                          { label: 'Score',      val: simScore.toFixed(0),                                                                     base: `${(dish.score ?? 0).toFixed(0)}` },
                          { label: 'Quadrante',  val: quadrantLabel[simQuadrant],                                                              base: quadrantLabel[dish.quadrant],       isQuadrant: true },
                        ].map(kpi => (
                          <div key={kpi.label}>
                            <p className={`text-[10px] font-semibold uppercase tracking-wider ${mutedText} mb-0.5`}>{kpi.label}</p>
                            <p className={`text-sm font-bold ${'isQuadrant' in kpi ? quadrantColor(simQuadrant, isDinner) : textColor}`}>{kpi.val}</p>
                            {kpi.val !== kpi.base && (
                              <p className={`text-[10px] line-through ${mutedText}`}>{kpi.base}</p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Hint salto di categoria */}
                      {simQuadrant !== 'stella' && (
                        <div className={`text-xs p-3 rounded-lg border ${isDinner ? 'bg-[#0F172A] border-[#334155] text-[#94A3B8]' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                          {simQuadrant === 'promuovi' && <>Per diventare <strong>⭐ Stella</strong> serve aumentare la frequenza oltre <strong>{baseMedians.freq.toFixed(0)}</strong> ordini (ora: {sim.frequency}).</>}
                          {simQuadrant === 'rivedi'   && <>Per diventare <strong>⭐ Stella</strong> serve portare il margine sopra <strong>{baseMedians.margin.toFixed(1)}%</strong> (ora: {simMarginPct.toFixed(1)}%).</>}
                          {simQuadrant === 'valuta'   && <>Per diventare <strong>⭐ Stella</strong> servono sia margine {'>'} <strong>{baseMedians.margin.toFixed(1)}%</strong> che frequenza {'>'} <strong>{baseMedians.freq.toFixed(0)}</strong>.</>}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
          {/* Bevande — sezione separata collassabile */}
          {snapshot.data.dishes.some(d => isBeverageCategory(d.category)) && (
            <div className={`rounded-xl border ${isDinner ? 'border-[#334155]' : 'border-[#EAE5DA]'}`}>
              <button
                onClick={() => setSimBevOpen(v => !v)}
                className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-colors ${isDinner ? 'hover:bg-[#334155]/30' : 'hover:bg-[#F4F1EA]/60'}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${textColor}`}>🍹 Bevande</span>
                  <span className={`text-xs ${mutedText}`}>Simulazione separata dal food</span>
                </div>
                {simBevOpen ? <ChevronUp className={`w-4 h-4 ${mutedText}`} /> : <ChevronDown className={`w-4 h-4 ${mutedText}`} />}
              </button>
              {simBevOpen && (
                <div className={`border-t ${isDinner ? 'border-[#334155]' : 'border-[#EAE5DA]'} space-y-2 p-3`}>
                  {snapshot.data.dishes.filter(d => isBeverageCategory(d.category)).map(dish => {
                    const sim = getSimDish(dish);
                    const isModified = !!simValues[dish.name];
                    const isExpanded = expandedDish === dish.name;
                    const simMarginPct = sim.price > 0 ? ((sim.price - sim.ingCost) / sim.price) * 100 : 0;
                    const simScore = simMarginPct * sim.frequency;
                    return (
                      <Card key={dish.name} className={`${cardBg} ${isModified ? (isDinner ? 'ring-1 ring-[#967D62]/40' : 'ring-1 ring-[#967D62]/30') : ''}`}>
                        <div
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${rowHover} rounded-xl transition-colors`}
                          onClick={() => setExpandedDish(isExpanded ? null : dish.name)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold text-sm ${textColor}`}>{dish.name}</span>
                              {isModified && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isDinner ? 'bg-[#967D62]/20 text-[#C4A882]' : 'bg-[#967D62]/10 text-[#967D62]'}`}>modificato</span>}
                            </div>
                          </div>
                          <div className="hidden sm:flex items-center gap-4 shrink-0 text-right">
                            <div>
                              <p className={`text-[10px] ${mutedText}`}>Prezzo</p>
                              <p className={`text-sm font-bold ${textColor}`}>€{sim.price.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className={`text-[10px] ${mutedText}`}>Margine</p>
                              <p className={`text-sm font-bold ${accentColor}`}>{simMarginPct.toFixed(1)}%</p>
                            </div>
                            <div>
                              <p className={`text-[10px] ${mutedText}`}>Ordini</p>
                              <p className={`text-sm font-bold ${textColor}`}>{sim.frequency}</p>
                            </div>
                          </div>
                          {isModified && (
                            <button onClick={e => { e.stopPropagation(); resetDish(dish.name); }}
                              className={`p-1.5 rounded-lg text-xs shrink-0 transition-colors ${isDinner ? 'text-[#94A3B8] hover:text-rose-400' : 'text-[#8C8A85] hover:text-rose-500'}`}>
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isExpanded ? <ChevronUp className={`w-4 h-4 shrink-0 ${mutedText}`} /> : <ChevronDown className={`w-4 h-4 shrink-0 ${mutedText}`} />}
                        </div>
                        {isExpanded && (
                          <div className={`px-4 pb-4 border-t ${isDinner ? 'border-[#334155]' : 'border-[#EAE5DA]'} pt-4 space-y-4`}>
                            {/* Solo prezzo e frequenza per le bevande */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className={`text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Prezzo di vendita</label>
                                <span className={`text-sm font-bold ${textColor}`}>€{sim.price.toFixed(2)}</span>
                              </div>
                              <input type="range" min={Math.max(0.5, dish.priceNet * 0.5)} max={dish.priceNet * 2} step={0.1} value={sim.price}
                                onChange={e => updateSim(dish.name, 'price', parseFloat(e.target.value))}
                                className={`w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#967D62]`} />
                              <div className={`flex justify-between text-[10px] ${mutedText} mt-0.5`}>
                                <span>-50%</span><span className={accentColor}>Base: €{dish.priceNet.toFixed(2)}</span><span>+100%</span>
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className={`text-xs font-semibold uppercase tracking-wider ${mutedText}`}>Frequenza ordini</label>
                                <span className={`text-sm font-bold ${textColor}`}>{sim.frequency} ordini</span>
                              </div>
                              <input type="range" min={0} max={Math.max(dish.frequency * 3, 10)} step={1} value={sim.frequency}
                                onChange={e => updateSim(dish.name, 'frequency', parseInt(e.target.value))}
                                className={`w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#967D62]`} />
                              <div className={`flex justify-between text-[10px] ${mutedText} mt-0.5`}>
                                <span>0</span><span className={accentColor}>Base: {dish.frequency}</span><span>×3</span>
                              </div>
                            </div>
                            <div className={`flex items-center gap-6 p-3 rounded-xl border ${isDinner ? 'bg-[#0F172A] border-[#334155]' : 'bg-gray-50 border-[#EAE5DA]'}`}>
                              <div><p className={`text-[10px] ${mutedText}`}>Margine</p><p className={`text-sm font-bold ${accentColor}`}>{simMarginPct.toFixed(1)}%</p></div>
                              <div><p className={`text-[10px] ${mutedText}`}>Score</p><p className={`text-sm font-bold ${accentColor}`}>{simScore.toFixed(0)}</p></div>
                              <div><p className={`text-[10px] ${mutedText}`}>Ricavo</p><p className={`text-sm font-bold ${textColor}`}>€{(sim.price * sim.frequency).toFixed(0)}</p></div>
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
