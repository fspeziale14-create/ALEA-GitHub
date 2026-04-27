// ================================================================
// ALEA — Consumi Interni
// Statistiche su scarti, pasti personale e consumi operativi.
// ================================================================

import { useState, useEffect, useMemo } from 'react';
import {
  Flame, Trash2, UtensilsCrossed, Wrench, HelpCircle,
  TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
  Calendar, BarChart2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

// ── TIPI ─────────────────────────────────────────────────────────

interface ExtraRecord {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  qty: number;
  unit: string;
  category: 'waste' | 'personale' | 'operativo' | 'altro';
  note: string | null;
  recorded_at: string;
  created_at: string;
}

interface ConsumiViewProps {
  isDinner: boolean;
  textColor: string;
  mutedText: string;
  cardBg: string;
  accentColor: string;
  supabase: any;
  isLoggedIn: boolean;
}

// ── HELPERS ───────────────────────────────────────────────────────

const categoryMeta = {
  waste:      { label: 'Scarto',            icon: Trash2,          color: 'text-rose-500',   bg: 'bg-rose-50 dark:bg-rose-950/20',   bar: '#EF4444' },
  personale:  { label: 'Pasto personale',   icon: UtensilsCrossed, color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-950/20', bar: '#F59E0B' },
  operativo:  { label: 'Consumo operativo', icon: Flame,           color: 'text-orange-500', bg: 'bg-orange-50',                     bar: '#F97316' },
  altro:      { label: 'Altro',             icon: HelpCircle,      color: 'text-slate-500',  bg: 'bg-slate-50',                      bar: '#94A3B8' },
};

const formatDate = (d: string) =>
  new Date(d + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });

// ── COMPONENTE ────────────────────────────────────────────────────

export function ConsumiView({
  isDinner, textColor, mutedText, cardBg, accentColor, supabase, isLoggedIn
}: ConsumiViewProps) {

  const divider  = isDinner ? 'border-[#334155]' : 'border-[#EAE5DA]';
  const rowHover = isDinner ? 'hover:bg-[#334155]/40' : 'hover:bg-[#F4F1EA]/60';

  const [records, setRecords] = useState<ExtraRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodDays, setPeriodDays] = useState<30 | 90 | 365>(30);
  const [showAll, setShowAll] = useState(false);

  // Carica tutti i record
  useEffect(() => {
    if (!isLoggedIn) return;
    const load = async () => {
      setLoading(true);
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) { setLoading(false); return; }
      const { data } = await supabase
        .from('extra_consumption')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false });
      if (data) setRecords(data as ExtraRecord[]);
      setLoading(false);
    };
    load();
  }, [isLoggedIn]);

  // Filtra per periodo selezionato
  const cutoff = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - periodDays);
    return d.toISOString().split('T')[0];
  }, [periodDays]);

  const filtered = useMemo(() =>
    records.filter(r => r.recorded_at >= cutoff),
    [records, cutoff]
  );

  // Top ingredienti per occorrenze nel periodo
  const topIngredients = useMemo(() => {
    const map: Record<string, { name: string; unit: string; total: number; count: number }> = {};
    filtered.forEach(r => {
      if (!map[r.ingredient_id]) map[r.ingredient_id] = { name: r.ingredient_name, unit: r.unit, total: 0, count: 0 };
      map[r.ingredient_id].total += r.qty;
      map[r.ingredient_id].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [filtered]);

  // Breakdown per categoria
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = { waste: 0, personale: 0, operativo: 0, altro: 0 };
    filtered.forEach(r => { map[r.category] = (map[r.category] ?? 0) + 1; });
    const total = filtered.length || 1;
    return Object.entries(map).map(([key, count]) => ({
      key: key as keyof typeof categoryMeta,
      count,
      pct: Math.round((count / total) * 100),
    })).filter(c => c.count > 0);
  }, [filtered]);

  // Trend mensile (ultimi 6 mesi)
  const monthlyTrend = useMemo(() => {
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = 0;
    }
    records.forEach(r => {
      const key = r.recorded_at.slice(0, 7);
      if (key in months) months[key]++;
    });
    return Object.entries(months).map(([month, count]) => ({
      month: new Date(month + '-01').toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }),
      count,
    }));
  }, [records]);

  // Trend: confronto ultimo mese vs precedente
  const trendDelta = useMemo(() => {
    if (monthlyTrend.length < 2) return null;
    const last = monthlyTrend[monthlyTrend.length - 1].count;
    const prev = monthlyTrend[monthlyTrend.length - 2].count;
    if (prev === 0) return null;
    return { delta: last - prev, pct: Math.round(((last - prev) / prev) * 100) };
  }, [monthlyTrend]);

  const chartColors = {
    grid: isDinner ? '#334155' : '#EAE5DA',
    tick: isDinner ? '#94A3B8' : '#8C8A85',
    tooltip: {
      backgroundColor: isDinner ? '#1E293B' : '#fff',
      border: `1px solid ${isDinner ? '#334155' : '#EAE5DA'}`,
      borderRadius: 8,
      fontSize: 12,
      color: isDinner ? '#F4F1EA' : '#2C2A28',
    },
  };

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
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className={`text-3xl font-bold tracking-tight ${textColor}`}>Consumi Interni</h1>
          <p className={`${mutedText} mt-1`}>Scarti, pasti personale e consumi operativi registrati in magazzino.</p>
        </div>
        {/* Selettore periodo */}
        <div className={`flex gap-1 p-1 rounded-xl border ${isDinner ? 'bg-[#0F172A] border-[#334155]' : 'bg-black/5 border-[#EAE5DA]'}`}>
          {([30, 90, 365] as const).map(d => (
            <button key={d} onClick={() => setPeriodDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                periodDays === d
                  ? (isDinner ? 'bg-[#967D62] text-white' : 'bg-white text-[#967D62] shadow-sm border border-[#EAE5DA]')
                  : `${mutedText} hover:text-[#967D62]`
              }`}>
              {d === 30 ? '30 giorni' : d === 90 ? '3 mesi' : '1 anno'}
            </button>
          ))}
        </div>
      </div>

      {records.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-20 gap-4 ${mutedText}`}>
          <Flame className="w-12 h-12 opacity-30" />
          <p className="text-sm text-center">Nessun consumo interno registrato ancora.<br />Usa il tasto "Registra consumi interni" in Magazzino.</p>
        </div>
      ) : (
        <>
          {/* KPI */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Registrazioni', val: filtered.length.toString(), sub: `negli ultimi ${periodDays} gg` },
              { label: 'Ingredienti coinvolti', val: new Set(filtered.map(r => r.ingredient_id)).size.toString(), sub: 'distinti' },
              { label: 'Categoria principale', val: categoryBreakdown[0] ? categoryMeta[categoryBreakdown[0].key].label : '—', sub: categoryBreakdown[0] ? `${categoryBreakdown[0].pct}% del totale` : '' },
              {
                label: 'Trend vs mese prec.',
                val: trendDelta ? `${trendDelta.delta >= 0 ? '+' : ''}${trendDelta.delta}` : '—',
                sub: trendDelta ? `${trendDelta.pct >= 0 ? '+' : ''}${trendDelta.pct}%` : 'dati insufficienti',
                color: trendDelta ? (trendDelta.delta <= 0 ? (isDinner ? 'text-emerald-400' : 'text-emerald-600') : (isDinner ? 'text-rose-400' : 'text-rose-600')) : undefined,
              },
            ].map((kpi, i) => (
              <div key={i} className={`p-4 rounded-xl border ${cardBg}`}>
                <p className={`text-xs font-semibold uppercase tracking-wider ${mutedText} mb-1`}>{kpi.label}</p>
                <p className={`text-2xl font-bold ${kpi.color ?? textColor}`}>{kpi.val}</p>
                <p className={`text-xs mt-0.5 ${mutedText}`}>{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Trend mensile */}
          <Card className={cardBg}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-base flex items-center gap-2 ${accentColor}`}>
                <BarChart2 className="w-4 h-4" /> Registrazioni per mese (ultimi 6 mesi)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyTrend} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: chartColors.tick }} />
                  <YAxis tick={{ fontSize: 11, fill: chartColors.tick }} allowDecimals={false} />
                  <Tooltip contentStyle={chartColors.tooltip} formatter={(v: any) => [v, 'Registrazioni']} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {monthlyTrend.map((_, i) => (
                      <Cell key={i} fill={i === monthlyTrend.length - 1 ? '#967D62' : (isDinner ? '#475569' : '#C8C2B8')} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top ingredienti */}
            <Card className={cardBg}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-base flex items-center gap-2 ${accentColor}`}>
                  <Flame className="w-4 h-4" /> Top ingredienti nel periodo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topIngredients.length === 0 ? (
                  <p className={`text-sm ${mutedText} py-4 text-center`}>Nessun dato nel periodo selezionato.</p>
                ) : (
                  <div className="space-y-2">
                    {topIngredients.map((ing, i) => {
                      const maxCount = topIngredients[0].count;
                      const barW = maxCount > 0 ? (ing.count / maxCount) * 100 : 0;
                      return (
                        <div key={ing.name} className="flex items-center gap-3">
                          <span className={`text-xs w-4 font-bold ${mutedText}`}>{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className={`text-sm font-medium truncate ${textColor}`}>{ing.name}</span>
                              <span className={`text-xs shrink-0 ml-2 ${mutedText}`}>{ing.count}× · {ing.total.toFixed(2)}{ing.unit}</span>
                            </div>
                            <div className={`h-1.5 rounded-full overflow-hidden ${isDinner ? 'bg-[#334155]' : 'bg-[#EAE5DA]'}`}>
                              <div className="h-full rounded-full bg-[#967D62]" style={{ width: `${barW}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Breakdown categoria */}
            <Card className={cardBg}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-base flex items-center gap-2 ${accentColor}`}>
                  <BarChart2 className="w-4 h-4" /> Per categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categoryBreakdown.length === 0 ? (
                  <p className={`text-sm ${mutedText} py-4 text-center`}>Nessun dato nel periodo selezionato.</p>
                ) : (
                  <div className="space-y-3">
                    {categoryBreakdown.map(cat => {
                      const meta = categoryMeta[cat.key];
                      const Icon = meta.icon;
                      return (
                        <div key={cat.key} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className={`w-4 h-4 ${meta.color}`} />
                              <span className={`text-sm font-medium ${textColor}`}>{meta.label}</span>
                            </div>
                            <span className={`text-sm font-bold ${textColor}`}>{cat.count} <span className={`text-xs font-normal ${mutedText}`}>({cat.pct}%)</span></span>
                          </div>
                          <div className={`h-2 rounded-full overflow-hidden ${isDinner ? 'bg-[#334155]' : 'bg-[#EAE5DA]'}`}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${cat.pct}%`, backgroundColor: meta.bar }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Log storico */}
          <Card className={cardBg}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className={`text-base flex items-center gap-2 ${accentColor}`}>
                  <Calendar className="w-4 h-4" /> Storico registrazioni
                </CardTitle>
                <span className={`text-xs ${mutedText}`}>{filtered.length} nel periodo</span>
              </div>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <p className={`text-sm ${mutedText} py-4 text-center`}>Nessuna registrazione nel periodo selezionato.</p>
              ) : (
                <div className="space-y-1">
                  {/* Header tabella */}
                  <div className={`grid grid-cols-[100px_1fr_90px_140px_1fr] gap-3 pb-2 border-b ${divider} text-xs font-bold uppercase tracking-wider ${mutedText}`}>
                    <span>Data</span>
                    <span>Ingrediente</span>
                    <span className="text-right">Qtà</span>
                    <span>Categoria</span>
                    <span>Nota</span>
                  </div>
                  {(showAll ? filtered : filtered.slice(0, 15)).map(r => {
                    const meta = categoryMeta[r.category];
                    const Icon = meta.icon;
                    return (
                      <div key={r.id} className={`grid grid-cols-[100px_1fr_90px_140px_1fr] gap-3 py-2 px-1 rounded-lg items-center ${rowHover} transition-colors`}>
                        <span className={`text-xs ${mutedText} shrink-0`}>{formatDate(r.recorded_at)}</span>
                        <span className={`text-sm font-medium truncate ${textColor}`}>{r.ingredient_name}</span>
                        <span className={`text-sm text-right shrink-0 font-mono ${textColor}`}>{r.qty}{r.unit}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${meta.color}`} />
                          <span className={`text-xs ${mutedText}`}>{meta.label}</span>
                        </div>
                        <span className={`text-xs ${mutedText} truncate`}>{r.note ?? '—'}</span>
                      </div>
                    );
                  })}
                  {filtered.length > 15 && (
                    <button
                      onClick={() => setShowAll(v => !v)}
                      className={`w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors ${accentColor} hover:opacity-70`}
                    >
                      {showAll ? <><ChevronUp className="w-3.5 h-3.5" /> Mostra meno</> : <><ChevronDown className="w-3.5 h-3.5" /> Mostra tutti ({filtered.length})</>}
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
