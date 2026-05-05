import React from 'react';
import { AttendibilitaResult } from './engine';

function idx(i: number, total: number, navDir: number) { return navDir > 0 ? i : (total - 1 - i); }
function SI({ children, className, i = 0, navKey = 0, navDir = 1 }: { children: React.ReactNode; className?: string; i?: number; navKey?: number; navDir?: number }) {
  return (
    <div
      key={navKey}
      className={`alea-si${className ? ' ' + className : ''}`}
      style={{ animationDelay: `${i * 0.12}s`, ['--si-y' as any]: navDir > 0 ? '48px' : '-48px' }}
    >
      {children}
    </div>
  );
}

import {
  Users, CalendarRange, Boxes, ClipboardList, CookingPot,
  Plus, X, Check, Pencil, BookOpen, ChevronDown, ChevronUp, ChevronRight, ArrowLeft,
  Loader2, CalendarDays, LayoutGrid, CheckCircle2,
  ChefHat, Moon, Settings2, Sun, TrendingUp, AlertCircle, Upload,
  Flame, Trash2, UtensilsCrossed, Wrench, HelpCircle
} from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { Separator } from './components/ui/separator';
import { weekDaysOrdered, mapDays, MENU_CATEGORIES, MENU_PRICES } from './constants';

interface PianificazioneViewProps {
  isDinner: boolean;
  textColor: string; mutedText: string; cardBg: string;
  accentColor: string; accentBg: string;
  selectedDate: string;
  // pianificazione tabs
  planTab: 'sala' | 'inventario' | 'ricette' | 'cucina';
  setPlanTab: (v: 'sala' | 'inventario' | 'ricette' | 'cucina') => void;
  // staff
  weekGenerated: boolean; isGeneratingStaff: boolean;
  setWeekGenerated: (v: boolean) => void;
  weeklyStaffData: any[]; staffDateRange: { start: string; end: string };
  generateStaffPlan: () => void;
  // budget
  isGeneratingBudget: boolean; budgetGenerated: boolean; budgetData: any;
  budgetStartDate: string; setBudgetStartDate: (v: string) => void;
  budgetDuration: number; setBudgetDuration: (v: number) => void;
  showBudgetSettings: boolean; setShowBudgetSettings: (v: boolean) => void;
  generateBudgetPlan: () => void;
  // inventory
  ingredients: any[]; setIngredients: (fn: any) => void;
  recipes: Record<string, any[]>; setRecipes: (fn: any) => void;
  preparations: any[]; setPreparations: (fn: any) => void;
  // ingredient form
  newIngName: string; setNewIngName: (v: string) => void;
  newIngUnit: string; setNewIngUnit: (v: string) => void;
  newIngIdeal: string; setNewIngIdeal: (v: string) => void;
  newIngSupplierMode: 'new' | 'existing'; setNewIngSupplierMode: (v: 'new' | 'existing') => void;
  newIngSupplierName: string; setNewIngSupplierName: (v: string) => void;
  newIngQtyPerBox: string; setNewIngQtyPerBox: (v: string) => void;
  newIngBoxCount: string; setNewIngBoxCount: (v: string) => void;
  newIngSelectedSupplier: string; setNewIngSelectedSupplier: (v: string) => void;
  newIngEditingIdeal: boolean; setNewIngEditingIdeal: (v: boolean) => void;
  newIngPricePerBox: string; setNewIngPricePerBox: (v: string) => void;
  newIngEditingPrice: boolean; setNewIngEditingPrice: (v: boolean) => void;
  // recipe form
  editingRecipeDish: string | null; setEditingRecipeDish: (v: string | null) => void;
  editingRecipeIngId: string; setEditingRecipeIngId: (v: string) => void;
  editingRecipeQty: string; setEditingRecipeQty: (v: string) => void;
  editingRecipePcsYield: string; setEditingRecipePcsYield: (v: string) => void;
  ingredientSearchText: string; setIngredientSearchText: (v: string) => void;
  dropdownRect: DOMRect | null; setDropdownRect: (v: DOMRect | null) => void;
  // verify
  showVerifyForm: boolean; setShowVerifyForm: (v: boolean) => void;
  verifyValues: Record<string, string>; setVerifyValues: (fn: any) => void;
  importFeedback: { type: string; msg: string } | null; setImportFeedback: (v: any) => void;
  handleInventoryImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // prep form
  newPrepName: string; setNewPrepName: (v: string) => void;
  newPrepYieldQty: string; setNewPrepYieldQty: (v: string) => void;
  newPrepYieldUnit: string; setNewPrepYieldUnit: (v: string) => void;
  editingPrepId: string | null; setEditingPrepId: (v: string | null) => void;
  prepIngSearch: string; setPrepIngSearch: (v: string) => void;
  prepIngId: string; setPrepIngId: (v: string) => void;
  prepIngQty: string; setPrepIngQty: (v: string) => void;
  prepDropdownRect: DOMRect | null; setPrepDropdownRect: (v: DOMRect | null) => void;
  prepBatchQty: Record<string, string>; setPrepBatchQty: (fn: any) => void;
  newPrepIdealQty: string; setNewPrepIdealQty: (v: string) => void;
  newPrepEditingIdeal: boolean; setNewPrepEditingIdeal: (v: boolean) => void;
  // utils
  convertToUnit: (v: number, f: string, t: string) => number | null;
  isPieceUnit: (u: string) => boolean;
  isMeasuredUnit: (u: string) => boolean;
  setActiveView: (v: string) => void;
  // attendibilita & weekly
  getFestivitaAvviso: (d: string) => string | null;
  // prezzi menu
  menuPrices: Record<string, number>;
  setMenuPrices: (fn: any) => void;
  saveMenuPrice: (dishName: string, price: number) => Promise<void>;
  supabase: any;
  isLoggedIn: boolean;
  navKey?: number;
  navDir?: number;
}

export function PianificazioneView(props: PianificazioneViewProps) {
  const p = props;
  const {
    isDinner, textColor, mutedText, cardBg, accentColor, accentBg,
    planTab, setPlanTab, setActiveView,
    hideHeader = false,
    hideTabBar = false,
    visibleTabs,
    navKey = 0,
    navDir = 1,
  } = p;

  // Aliases usati nel JSX originale
  const ingredients = p.ingredients;
  const setIngredients = p.setIngredients;
  const recipes = p.recipes;
  const setRecipes = p.setRecipes;
  const preparations = p.preparations;
  const setPreparations = p.setPreparations;
  const convertToUnit = p.convertToUnit;
  const isPieceUnit = p.isPieceUnit;
  const isMeasuredUnit = p.isMeasuredUnit;
  const menuPrices = p.menuPrices;
  const setMenuPrices = p.setMenuPrices;
  const saveMenuPrice = p.saveMenuPrice;
  const supabase = p.supabase;
  const isLoggedIn = p.isLoggedIn;
  const newIngName = p.newIngName; const setNewIngName = p.setNewIngName;
  const newIngUnit = p.newIngUnit; const setNewIngUnit = p.setNewIngUnit;
  const newIngIdeal = p.newIngIdeal; const setNewIngIdeal = p.setNewIngIdeal;
  const newIngSupplierMode = p.newIngSupplierMode; const setNewIngSupplierMode = p.setNewIngSupplierMode;
  const newIngSupplierName = p.newIngSupplierName; const setNewIngSupplierName = p.setNewIngSupplierName;
  const newIngQtyPerBox = p.newIngQtyPerBox; const setNewIngQtyPerBox = p.setNewIngQtyPerBox;
  const newIngBoxCount = p.newIngBoxCount; const setNewIngBoxCount = p.setNewIngBoxCount;
  const newIngSelectedSupplier = p.newIngSelectedSupplier; const setNewIngSelectedSupplier = p.setNewIngSelectedSupplier;
  const newIngEditingIdeal = p.newIngEditingIdeal; const setNewIngEditingIdeal = p.setNewIngEditingIdeal;
  const newIngPricePerBox = p.newIngPricePerBox; const setNewIngPricePerBox = p.setNewIngPricePerBox;
  const newIngEditingPrice = p.newIngEditingPrice; const setNewIngEditingPrice = p.setNewIngEditingPrice;
  const editingRecipeDish = p.editingRecipeDish; const setEditingRecipeDish = p.setEditingRecipeDish;
  const editingRecipeIngId = p.editingRecipeIngId; const setEditingRecipeIngId = p.setEditingRecipeIngId;
  const editingRecipeQty = p.editingRecipeQty; const setEditingRecipeQty = p.setEditingRecipeQty;
  const editingRecipePcsYield = p.editingRecipePcsYield; const setEditingRecipePcsYield = p.setEditingRecipePcsYield;
  const ingredientSearchText = p.ingredientSearchText; const setIngredientSearchText = p.setIngredientSearchText;
  const dropdownRect = p.dropdownRect; const setDropdownRect = p.setDropdownRect;
  const showVerifyForm = p.showVerifyForm; const setShowVerifyForm = p.setShowVerifyForm;
  const verifyValues = p.verifyValues; const setVerifyValues = p.setVerifyValues;
  const importFeedback = p.importFeedback; const setImportFeedback = p.setImportFeedback;
  const handleInventoryImport = p.handleInventoryImport;
  const newPrepName = p.newPrepName; const setNewPrepName = p.setNewPrepName;
  const newPrepYieldQty = p.newPrepYieldQty; const setNewPrepYieldQty = p.setNewPrepYieldQty;
  const newPrepYieldUnit = p.newPrepYieldUnit; const setNewPrepYieldUnit = p.setNewPrepYieldUnit;
  const editingPrepId = p.editingPrepId; const setEditingPrepId = p.setEditingPrepId;
  const prepIngSearch = p.prepIngSearch; const setPrepIngSearch = p.setPrepIngSearch;
  const prepIngId = p.prepIngId; const setPrepIngId = p.setPrepIngId;
  const prepIngQty = p.prepIngQty; const setPrepIngQty = p.setPrepIngQty;
  const prepDropdownRect = p.prepDropdownRect; const setPrepDropdownRect = p.setPrepDropdownRect;
  const prepBatchQty = p.prepBatchQty; const setPrepBatchQty = p.setPrepBatchQty;
  const newPrepIdealQty = p.newPrepIdealQty; const setNewPrepIdealQty = p.setNewPrepIdealQty;
  const newPrepEditingIdeal = p.newPrepEditingIdeal; const setNewPrepEditingIdeal = p.setNewPrepEditingIdeal;
  const weekGenerated = p.weekGenerated; const isGeneratingStaff = p.isGeneratingStaff;
  const setWeekGenerated = p.setWeekGenerated;
  const weeklyStaffData = p.weeklyStaffData; const staffDateRange = p.staffDateRange;
  const generateStaffPlan = p.generateStaffPlan;
  const isGeneratingBudget = p.isGeneratingBudget; const budgetGenerated = p.budgetGenerated;
  const budgetData = p.budgetData; const budgetStartDate = p.budgetStartDate;
  const setBudgetStartDate = p.setBudgetStartDate; const budgetDuration = p.budgetDuration;
  const setBudgetDuration = p.setBudgetDuration; const showBudgetSettings = p.showBudgetSettings;
  const setShowBudgetSettings = p.setShowBudgetSettings; const generateBudgetPlan = p.generateBudgetPlan;
  const getFestivitaAvviso = p.getFestivitaAvviso;

  // Ritorna le UdM compatibili (multipli/sottomultipli) per una UdM base dell'inventario
  const getCompatibleUnits = (baseUnit: string): string[] => {
    if (['g', 'kg'].includes(baseUnit)) return ['g', 'kg'];
    if (['ml', 'cl', 'l'].includes(baseUnit)) return ['ml', 'cl', 'l'];
    if (['pz', 'conf'].includes(baseUnit)) return ['pz', 'conf'];
    return [baseUnit];
  };

  // Modalità input pz/conf: 'pezziPerPorzione' = "per 1 porzione servono N pz", 'porzioniPerPezzo' = "con 1 pz faccio N porzioni" (default)
  const [pieceInputMode, setPieceInputMode] = React.useState<'porzioniPerPezzo' | 'pezziPerPorzione'>('porzioniPerPezzo');

  // State per editing prezzo piatto
  const [editingPriceDish, setEditingPriceDish] = React.useState<string | null>(null);

  // ── MODALE CONSUMI EXTRA ──────────────────────────────────────
  const [showExtraModal, setShowExtraModal] = React.useState(false);
  const [extraIngId, setExtraIngId] = React.useState<string>('');
  const [extraQty, setExtraQty] = React.useState<string>('');
  const [extraCategory, setExtraCategory] = React.useState<'waste' | 'personale' | 'operativo' | 'altro'>('waste');
  const [extraNote, setExtraNote] = React.useState<string>('');
  const [extraDate, setExtraDate] = React.useState<string>(new Date().toISOString().split('T')[0]);
  const [extraUnit, setExtraUnit] = React.useState<string>('');

  // Unità compatibili per un'UdM base (multipli e sottomultipli)
  const getCompatibleUnitsFor = (unit: string): string[] => {
    if (unit === 'kg' || unit === 'g')   return ['g', 'kg'];
    if (unit === 'l' || unit === 'ml' || unit === 'cl') return ['ml', 'cl', 'l'];
    if (unit === 'pz' || unit === 'conf') return [unit]; // solo se stessa
    return [unit];
  };

  // Converti qty da extraUnit a unità base dell'ingrediente per scalare correttamente
  const convertExtraQtyToBase = (qty: number, fromUnit: string, toUnit: string): number => {
    if (fromUnit === toUnit) return qty;
    // g ↔ kg
    if (fromUnit === 'g'  && toUnit === 'kg') return qty / 1000;
    if (fromUnit === 'kg' && toUnit === 'g')  return qty * 1000;
    // ml ↔ cl ↔ l
    if (fromUnit === 'ml' && toUnit === 'cl') return qty / 10;
    if (fromUnit === 'ml' && toUnit === 'l')  return qty / 1000;
    if (fromUnit === 'cl' && toUnit === 'ml') return qty * 10;
    if (fromUnit === 'cl' && toUnit === 'l')  return qty / 100;
    if (fromUnit === 'l'  && toUnit === 'ml') return qty * 1000;
    if (fromUnit === 'l'  && toUnit === 'cl') return qty * 100;
    return qty;
  };
  const [extraSaving, setExtraSaving] = React.useState(false);
  const [extraMsg, setExtraMsg] = React.useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [extraIngDropOpen, setExtraIngDropOpen] = React.useState(false);
  // Dropdown states for magazzino selects
  const [ingUnitDropOpen, setIngUnitDropOpen] = React.useState(false);
  const [ingSupplierDropOpen, setIngSupplierDropOpen] = React.useState(false);
  const [prepUnitDropOpen, setPrepUnitDropOpen] = React.useState(false);
  const ingUnitRef = React.useRef<HTMLDivElement>(null);
  const ingSupplierRef = React.useRef<HTMLDivElement>(null);
  const prepUnitRef = React.useRef<HTMLDivElement>(null);
  const [extraIngSearch, setExtraIngSearch] = React.useState('');
  const extraIngRef = React.useRef<HTMLDivElement>(null);
  const extraFileRef = React.useRef<HTMLInputElement>(null);
  const [extraImportMsg, setExtraImportMsg] = React.useState<{ type: 'ok' | 'err' | 'warn'; msg: string } | null>(null);

  const extraCategories = [
    { key: 'waste' as const,      label: 'Scarto',             icon: Trash2,          color: 'text-rose-500' },
    { key: 'personale' as const,  label: 'Pasto personale',    icon: UtensilsCrossed, color: 'text-amber-500' },
    { key: 'operativo' as const,  label: 'Consumo operativo',  icon: Flame,           color: 'text-orange-500' },
    { key: 'altro' as const,      label: 'Altro',              icon: HelpCircle,      color: 'text-slate-500' },
  ];

  const handleSaveExtra = async () => {
    if (!extraIngId || !extraQty || Number(extraQty) <= 0) return;
    setExtraSaving(true);
    setExtraMsg(null);
    try {
      const ing = ingredients.find((i: any) => i.id === extraIngId);
      if (!ing) throw new Error('Ingrediente non trovato');
      const rawQty = Number(extraQty);
      const usedUnit = extraUnit || ing.unit;
      // Converti alla unità base dell'ingrediente per scalare correttamente
      const qtyInBase = convertExtraQtyToBase(rawQty, usedUnit, ing.unit);
      // Scala currentQty
      setIngredients((prev: any[]) => prev.map((i: any) =>
        i.id === extraIngId ? { ...i, currentQty: (i.currentQty ?? 0) - qtyInBase } : i
      ));
      // Salva su Supabase se loggato
      if (isLoggedIn && supabase) {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (userId) {
          await supabase.from('extra_consumption').insert({
            user_id: userId,
            ingredient_id: ing.id,
            ingredient_name: ing.name,
            qty: rawQty,
            unit: usedUnit,
            category: extraCategory,
            note: extraNote.trim() || null,
            recorded_at: extraDate,
          });
        }
      }
      setExtraMsg({ type: 'ok', msg: `Registrato: −${qty}${ing.unit} di ${ing.name}.` });
      setExtraQty('');
      setExtraNote('');
    } catch (err: any) {
      setExtraMsg({ type: 'err', msg: `Errore: ${err.message}` });
    } finally {
      setExtraSaving(false);
    }
  };

  // Converti showVerifyForm in modale
  const [showVerifyModal, setShowVerifyModal] = React.useState(false);
  const [verifySnapshots, setVerifySnapshots] = React.useState<any[]>([]);
  const [verifySnapshotId, setVerifySnapshotId] = React.useState<string>('__auto__'); // __auto__ = più recente
  const [verifyThreshold, setVerifyThreshold] = React.useState(5); // % soglia normalità
  const [verifyPhase, setVerifyPhase] = React.useState<'input' | 'analysis'>('input');
  const [verifySnapDropOpen, setVerifySnapDropOpen] = React.useState(false);
  const verifySnapRef = React.useRef<HTMLDivElement>(null);

  // Carica snapshots quando si apre la modale verifica
  const loadVerifySnapshots = async () => {
    if (!isLoggedIn || !supabase) return;
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;
    const { data } = await supabase
      .from('analysis_snapshots')
      .select('id, label, period_start, period_end, data')
      .eq('user_id', userId)
      .order('period_start', { ascending: false });
    if (data) setVerifySnapshots(data);
  };

  // Chiudi dropdown snapshot cliccando fuori
  React.useEffect(() => {
    if (!verifySnapDropOpen) return;
    const handler = (e: MouseEvent) => {
      if (verifySnapRef.current && !verifySnapRef.current.contains(e.target as Node)) {
        setVerifySnapDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [verifySnapDropOpen]);

  // Calcola analisi scostamento per gli ingredienti modificati
  const computeVerifyAnalysis = () => {
    const modified = Object.entries(verifyValues).filter(([, v]) => v !== '');
    if (modified.length === 0) return [];

    // Scegli snapshot: selezionato o più recente
    const snap = verifySnapshotId === '__auto__'
      ? verifySnapshots[0] // già ordinati per period_start desc
      : verifySnapshots.find(s => s.id === verifySnapshotId);

    return modified.map(([ingId, realStr]) => {
      const ing = ingredients.find((i: any) => i.id === ingId);
      if (!ing) return null;
      const theoretical = ing.currentQty;
      const real = Number(realStr);
      const diff = real - theoretical; // negativo = hai meno del previsto
      const diffPct = theoretical > 0 ? (Math.abs(diff) / theoretical) * 100 : 0;
      const isSignificant = diffPct > verifyThreshold;

      // Stima per piatto: quali piatti usano questo ingrediente e quanto
      let dishBreakdown: Array<{ dish: string; qtyPerPortion: number; unit: string; frequency: number; total: number }> = [];
      if (snap) {
        const snapDishes = snap.data?.dishes ?? [];
        const snapRecipes = snap.data?.recipes ?? {};
        Object.entries(snapRecipes as Record<string, any[]>).forEach(([dishName, rows]) => {
          rows.forEach((row: any) => {
            if (row.ingredientId !== ingId) return;
            const snapDish = snapDishes.find((d: any) => d.name === dishName);
            const freq = snapDish?.frequency ?? 0;
            const qtyPer = row.portionsPerPiece ? 1 / row.portionsPerPiece : row.qty;
            dishBreakdown.push({
              dish: dishName,
              qtyPerPortion: qtyPer,
              unit: row.unit ?? ing.unit,
              frequency: freq,
              total: qtyPer * freq,
            });
          });
        });
        dishBreakdown = dishBreakdown.filter(d => d.frequency > 0).sort((a, b) => b.total - a.total);
      }

      // Scostamento medio per piatto: diff distribuito proporzionalmente
      const totalExpected = dishBreakdown.reduce((s, d) => s + d.total, 0);
      const dishWithDelta = dishBreakdown.map(d => ({
        ...d,
        share: totalExpected > 0 ? d.total / totalExpected : 0,
        avgDeltaPerPortion: totalExpected > 0 && d.frequency > 0
          ? (diff * (d.total / totalExpected)) / d.frequency
          : 0,
      }));

      return {
        ingId, ingName: ing.name, unit: ing.unit,
        theoretical, real, diff, diffPct,
        isSignificant,
        hasSnapshot: !!snap,
        snapshotLabel: snap ? snap.label : null,
        isAutoSnap: verifySnapshotId === '__auto__',
        dishes: dishWithDelta,
      };
    }).filter(Boolean);
  };
  const [editingPriceValue, setEditingPriceValue] = React.useState<string>('');

  // Chiudi dropdown ingrediente cliccando fuori
  React.useEffect(() => {
    if (!extraIngDropOpen) return;
    const handler = (e: MouseEvent) => {
      if (extraIngRef.current && !extraIngRef.current.contains(e.target as Node)) {
        setExtraIngDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [extraIngDropOpen]);

  // Close dropdowns on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ingUnitRef.current && !ingUnitRef.current.contains(e.target as Node)) setIngUnitDropOpen(false);
      if (ingSupplierRef.current && !ingSupplierRef.current.contains(e.target as Node)) setIngSupplierDropOpen(false);
      if (prepUnitRef.current && !prepUnitRef.current.contains(e.target as Node)) setPrepUnitDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Handler import file consumi
  const handleExtraImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) throw new Error('File vuoto o senza dati.');
        const header = lines[0].toLowerCase().split(/[,;\t]/);
        const nameIdx  = header.findIndex(h => h.includes('nome') || h.includes('ingrediente'));
        const qtyIdx   = header.findIndex(h => h.includes('quant') || h.includes('qty'));
        const dateIdx  = header.findIndex(h => h.includes('data') || h.includes('date'));
        const catIdx   = header.findIndex(h => h.includes('causa') || h.includes('categ'));
        const noteIdx  = header.findIndex(h => h.includes('nota') || h.includes('note'));
        if (nameIdx === -1 || qtyIdx === -1) throw new Error('Colonne "nome" e "quantità" obbligatorie.');
        const VALID_CATS: Record<string, 'waste'|'personale'|'operativo'|'altro'> = {
          'scarto': 'waste', 'waste': 'waste', 'spreco': 'waste',
          'personale': 'personale', 'pasto': 'personale', 'staff': 'personale',
          'operativo': 'operativo', 'pulizia': 'operativo', 'cucina': 'operativo',
        };
        let saved = 0; let skipped = 0;
        const userId = isLoggedIn && supabase ? (await supabase.auth.getUser()).data.user?.id : null;
        const ingUpdates: Record<string, number> = {};
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(/[,;\t]/);
          const rawName = cols[nameIdx]?.trim();
          const rawQty  = parseFloat(cols[qtyIdx]?.trim() ?? '');
          if (!rawName || isNaN(rawQty) || rawQty <= 0) { skipped++; continue; }
          const ing = ingredients.find((x: any) => x.name.toLowerCase() === rawName.toLowerCase());
          if (!ing) { skipped++; continue; }
          const rawDate = dateIdx >= 0 ? cols[dateIdx]?.trim() : '';
          const recordedAt = rawDate && /\d{4}-\d{2}-\d{2}/.test(rawDate) ? rawDate : new Date().toISOString().split('T')[0];
          const rawCat = catIdx >= 0 ? cols[catIdx]?.trim().toLowerCase() : '';
          const category: 'waste'|'personale'|'operativo'|'altro' = VALID_CATS[rawCat] ?? 'altro';
          const note = noteIdx >= 0 ? cols[noteIdx]?.trim() || null : null;
          ingUpdates[ing.id] = (ingUpdates[ing.id] ?? 0) + rawQty;
          if (userId && supabase) {
            await supabase.from('extra_consumption').insert({
              user_id: userId, ingredient_id: ing.id, ingredient_name: ing.name,
              qty: rawQty, unit: ing.unit, category, note, recorded_at: recordedAt,
            });
          }
          saved++;
        }
        setIngredients((prev: any[]) => prev.map((i: any) =>
          ingUpdates[i.id] !== undefined ? { ...i, currentQty: (i.currentQty ?? 0) - ingUpdates[i.id] } : i
        ));
        setExtraImportMsg({ type: saved > 0 && skipped === 0 ? 'ok' : 'warn', msg: `Importate ${saved} registrazioni.${skipped > 0 ? ` ${skipped} righe saltate (ingrediente non trovato o dati mancanti).` : ''}` });
      } catch (err: any) {
        setExtraImportMsg({ type: 'err', msg: `Errore: ${err.message}` });
      }
    };
    reader.readAsText(file);
  };

  // MCM tra due interi
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);

  // Formatta un valore con la sua unità, convertendo automaticamente per evitare decimali < 1
  const formatQtyAuto = (val: number, unit: string): string => {
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : val > 0 ? '+' : '';
    if (unit === 'kg' && abs < 1 && abs > 0) return `${sign}${(abs * 1000).toFixed(0)}g`;
    if (unit === 'l'  && abs < 1 && abs > 0) return `${sign}${(abs * 1000).toFixed(0)}ml`;
    if (unit === 'cl' && abs < 1 && abs > 0) return `${sign}${(abs * 10).toFixed(0)}ml`;
    if (abs < 0.01 && abs > 0) return `${sign}${(abs * 1000).toFixed(2)}m${unit}`;
    return `${sign}${abs.toFixed(abs < 10 ? 3 : 1)}${unit}`;
  };

  // Formatta delta per piatto in pz/conf: invece di frazioni mostra rapporto intero
  const formatPieceDelta = (deltaPerPortion: number, unit: string, totalPortions: number): string => {
    if (Math.abs(deltaPerPortion) < 0.0001) return '~0';
    const abs = Math.abs(deltaPerPortion);
    const sign = deltaPerPortion < 0 ? '-' : '+';
    if (abs >= 1) return `${sign}${abs.toFixed(1)} ${unit}/p`;
    // Converti in "ogni N porzioni serve 1 pz in più/meno"
    const portionsPerPiece = Math.round(1 / abs);
    const direction = deltaPerPortion < 0 ? 'in meno' : 'in più';
    return `ogni ~${portionsPerPiece} p: 1 ${unit} ${direction}`;
  };
  const lcm = (a: number, b: number): number => (a * b) / gcd(a, b);

  // Dato un ingrediente a pz/conf, calcola il MCM di tutti i denominatori (portionsPerPiece)
  // tra ricette e preparazioni, per normalizzare a una frazione comune
  const getPieceMcm = (ingredientId: string): number => {
    const denominators: number[] = [];
    // Scansiona tutte le ricette
    Object.values(recipes).forEach(rows => {
      rows.forEach((row: any) => {
        if (row.ingredientId === ingredientId && row.portionsPerPiece && row.portionsPerPiece > 0) {
          denominators.push(Math.round(row.portionsPerPiece));
        }
      });
    });
    // Scansiona tutte le preparazioni
    preparations.forEach(prep => {
      prep.ingredients.forEach((row: any) => {
        if (row.ingredientId === ingredientId && row.portionsPerPiece && row.portionsPerPiece > 0) {
          denominators.push(Math.round(row.portionsPerPiece));
        }
      });
    });
    if (denominators.length === 0) return 1;
    return denominators.reduce((acc, d) => lcm(acc, d), 1);
  };

  // Per un ingrediente a pz/conf: quante "parti MCM" usa 1 porzione del piatto
  // portionsPerPiece=5 significa "1 conf fa 5 porzioni" → 1 porzione usa mcm/5 parti
  const getPiecePartsPerPortion = (ingredientId: string, portionsPerPiece: number): number => {
    const m = getPieceMcm(ingredientId);
    return m / Math.round(portionsPerPiece);
  };

  // State locale per tracciare quale prep ha il dropdown ingrediente aperto (separato da editingPrepId)
  const [activePrepIngDropdownId, setActivePrepIngDropdownId] = React.useState<string | null>(null);
  // State locale per tenere aperte le preparazioni (tendina) — di default tutte chiuse
  const [openPrepIds, setOpenPrepIds] = React.useState<Set<string>>(new Set());

  // Converte qty da fromUnit a baseUnit per normalizzare. Usa convertToUnit se disponibile, fallback manuale.
  const normalizeToBase = (qty: number, fromUnit: string, baseUnit: string): number => {
    if (fromUnit === baseUnit) return qty;
    const converted = convertToUnit(qty, fromUnit, baseUnit);
    if (converted !== null) return converted;
    // fallback manuale
    const factors: Record<string, number> = { g: 1, kg: 1000, ml: 1, cl: 10, l: 1000 };
    const fFrom = factors[fromUnit]; const fTo = factors[baseUnit];
    if (fFrom && fTo) return qty * fFrom / fTo;
    return qty;
  };

  // Arrotonda per difetto a 2 decimali (evita valori brutti tipo 0.99999)
  const floor2 = (n: number) => Math.floor(n * 100) / 100;

  // ── REF per input file import ────────────────────────────────────
  const ingImportRef = React.useRef<HTMLInputElement>(null);
  const prepImportRef = React.useRef<HTMLInputElement>(null);
  const recipeImportRef = React.useRef<HTMLInputElement>(null);

  // Feedback separato per i tre import
  const [ingImportMsg, setIngImportMsg] = React.useState<{ type: 'ok' | 'err' | 'warn'; msg: string } | null>(null);
  const [prepImportMsg, setPrepImportMsg] = React.useState<{ type: 'ok' | 'err' | 'warn'; msg: string } | null>(null);
  const [recipeImportMsg, setRecipeImportMsg] = React.useState<{ type: 'ok' | 'err' | 'warn'; msg: string } | null>(null);

  // ── IMPORT INGREDIENTI ───────────────────────────────────────────
  // Formato atteso: ingredienti.json — array di oggetti con campi:
  // name, unit, idealQty, suppliers[{name, qtyPerBox, pricePerBox, unit}]
  const handleIngImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result as string;
        const data = JSON.parse(raw);
        if (!Array.isArray(data)) throw new Error('Il file deve essere un array JSON.');
        const VALID_UNITS = ['g', 'kg', 'ml', 'cl', 'l', 'pz', 'conf'];
        let added = 0; let skipped = 0;
        const newItems: any[] = [];
        data.forEach((item: any, idx: number) => {
          if (!item.name || typeof item.name !== 'string') { skipped++; return; }
          const unit = item.unit && VALID_UNITS.includes(item.unit) ? item.unit : 'g';
          const idealQty = typeof item.idealQty === 'number' ? item.idealQty : 0;
          const suppliers = Array.isArray(item.suppliers)
            ? item.suppliers.map((s: any) => ({
                name: String(s.name ?? ''),
                qtyPerBox: Number(s.qtyPerBox ?? 0),
                pricePerBox: Number(s.pricePerBox ?? 0),
                unit: VALID_UNITS.includes(s.unit) ? s.unit : unit,
              })).filter((s: any) => s.name)
            : [];
          newItems.push({
            id: `imp-${Date.now()}-${idx}`,
            name: item.name.trim(),
            unit,
            idealQty,
            currentQty: typeof item.currentQty === 'number' ? item.currentQty : 0,
            suppliers,
            purchaseHistory: [],
          });
          added++;
        });
        if (added === 0) throw new Error('Nessun ingrediente valido trovato nel file.');
        setIngredients((prev: any[]) => {
          const updated = [...prev];
          let added = 0, merged = 0;

          newItems.forEach((item: any) => {
            const existingIdx = updated.findIndex(
              (i: any) => i.name.toLowerCase() === item.name.toLowerCase()
            );

            if (existingIdx === -1) {
              // Nuovo ingrediente — aggiunge normalmente
              updated.push(item);
              added++;
            } else {
              // Ingrediente esistente — merge
              const existing = { ...updated[existingIdx] };

              // Aggiunge currentQty se presente nel file
              if (typeof item.currentQty === 'number' && item.currentQty > 0) {
                existing.currentQty = (existing.currentQty ?? 0) + item.currentQty;
              }

              // Aggiorna idealQty solo se il file fornisce un valore diverso
              if (typeof item.idealQty === 'number' && item.idealQty > 0 &&
                  item.idealQty !== existing.idealQty) {
                existing.idealQty = item.idealQty;
              }

              // Merge fornitori
              if (Array.isArray(item.suppliers) && item.suppliers.length > 0) {
                const existingSuppliers = [...(existing.suppliers ?? [])];
                item.suppliers.forEach((newS: any) => {
                  const sIdx = existingSuppliers.findIndex(
                    (s: any) => s.name.toLowerCase() === newS.name.toLowerCase()
                  );
                  if (sIdx === -1) {
                    // Fornitore nuovo — aggiunge
                    existingSuppliers.push(newS);
                  } else {
                    // Fornitore esistente — aggiorna prezzo solo se diverso
                    const existingS = { ...existingSuppliers[sIdx] };
                    if (newS.pricePerBox > 0 && newS.pricePerBox !== existingS.pricePerBox) {
                      existingS.pricePerBox = newS.pricePerBox;
                    }
                    if (newS.qtyPerBox > 0 && newS.qtyPerBox !== existingS.qtyPerBox) {
                      existingS.qtyPerBox = newS.qtyPerBox;
                    }
                    existingSuppliers[sIdx] = existingS;
                  }
                });
                existing.suppliers = existingSuppliers;
              }

              updated[existingIdx] = existing;
              merged++;
            }
          });

          const parts = [];
          if (added > 0) parts.push(`${added} nuov${added === 1 ? 'o' : 'i'} ingrediente${added === 1 ? '' : 'i'} aggiunti`);
          if (merged > 0) parts.push(`${merged} aggiornati`);
          if (skipped > 0) parts.push(`${skipped} voci non valide saltate`);
          const msg = parts.join(', ') + '.';
          setIngImportMsg({ type: skipped > 0 ? 'warn' : 'ok', msg });

          return updated;
        });
      } catch (err: any) {
        setIngImportMsg({ type: 'err', msg: `Errore: ${err.message}` });
      }
    };
    reader.readAsText(file);
  };

  // ── IMPORT PREPARAZIONI ──────────────────────────────────────────
  // Formato atteso: preparazioni.json — array di oggetti con campi:
  // name, yieldQty, yieldUnit, idealQty, ingredients[{ingredientName, qty, unit}]
  const handlePrepImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result as string;
        const data = JSON.parse(raw);
        if (!Array.isArray(data)) throw new Error('Il file deve essere un array JSON.');
        const VALID_UNITS = ['g', 'kg', 'ml', 'cl', 'l', 'pz', 'conf'];
        let added = 0; let skipped = 0; let missingIngs: string[] = [];
        const newPreps: any[] = [];
        data.forEach((item: any, idx: number) => {
          if (!item.name || typeof item.name !== 'string') { skipped++; return; }
          const yieldQty = Number(item.yieldQty ?? 0);
          const yieldUnit = VALID_UNITS.includes(item.yieldUnit) ? item.yieldUnit : 'g';
          const idealQty = typeof item.idealQty === 'number' ? item.idealQty : 0;
          const prepIngredients: any[] = [];
          if (Array.isArray(item.ingredients)) {
            item.ingredients.forEach((row: any) => {
              const ingName = String(row.ingredientName ?? '').trim();
              const ing = ingredients.find((i: any) => i.name.toLowerCase() === ingName.toLowerCase());
              if (!ing) { missingIngs.push(ingName); return; }
              const unit = VALID_UNITS.includes(row.unit) ? row.unit : ing.unit;
              prepIngredients.push({
                ingredientId: ing.id,
                qty: Number(row.qty ?? 0),
                unit,
                ...(row.portionsPerPiece != null ? { portionsPerPiece: Number(row.portionsPerPiece) } : {}),
              });
            });
          }
          newPreps.push({
            id: `prep-imp-${Date.now()}-${idx}`,
            name: item.name.trim(),
            yieldQty,
            yieldUnit,
            idealQty,
            currentQty: 0,
            ingredients: prepIngredients,
          });
          added++;
        });
        if (added === 0) throw new Error('Nessuna preparazione valida trovata nel file.');
        setPreparations((prev: any[]) => {
          const existing = new Set(prev.map((p: any) => p.name.toLowerCase()));
          const toAdd = newPreps.filter(p => !existing.has(p.name.toLowerCase()));
          const dupes = newPreps.length - toAdd.length;
          const uniqueMissing = [...new Set(missingIngs)];
          let msg = `Importate ${toAdd.length} preparazioni.`;
          if (dupes > 0) msg += ` ${dupes} già presenti ignorate.`;
          if (uniqueMissing.length > 0) msg += ` Ingredienti non trovati: ${uniqueMissing.slice(0, 5).join(', ')}${uniqueMissing.length > 5 ? '…' : ''}.`;
          if (skipped > 0) msg += ` ${skipped} voci non valide saltate.`;
          const type = dupes > 0 || uniqueMissing.length > 0 || skipped > 0 ? 'warn' : 'ok';
          setPrepImportMsg({ type, msg });
          return [...prev, ...toAdd];
        });
      } catch (err: any) {
        setPrepImportMsg({ type: 'err', msg: `Errore: ${err.message}` });
      }
    };
    reader.readAsText(file);
  };

  // ── IMPORT RICETTE ───────────────────────────────────────────────
  // Formato atteso: ricette.json — oggetto {nomePiatto: [{ingredientName, qty, unit, portionsPerPiece?}]}
  // ingredientName può essere "prep:NomePreparazione" per usare una preparazione
  const handleRecipeImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result as string;
        const data = JSON.parse(raw);
        if (typeof data !== 'object' || Array.isArray(data)) throw new Error('Il file deve essere un oggetto JSON con chiavi = nomi piatto.');
        const VALID_UNITS = ['g', 'kg', 'ml', 'cl', 'l', 'pz', 'conf'];
        let importedDishes = 0; let skippedRows = 0; let missingRefs: string[] = [];
        const newRecipes: Record<string, any[]> = {};
        Object.entries(data).forEach(([dishName, rows]: [string, any]) => {
          if (!Array.isArray(rows)) return;
          const recipeRows: any[] = [];
          rows.forEach((row: any) => {
            const refName = String(row.ingredientName ?? '').trim();
            const isPrep = refName.startsWith('prep:');
            const lookupName = isPrep ? refName.replace('prep:', '').trim() : refName;
            let resolvedId: string | null = null;
            if (isPrep) {
              const prep = preparations.find((p: any) => p.name.toLowerCase() === lookupName.toLowerCase());
              if (prep) resolvedId = `prep:${prep.id}`;
            } else {
              const ing = ingredients.find((i: any) => i.name.toLowerCase() === lookupName.toLowerCase());
              if (ing) resolvedId = ing.id;
            }
            if (!resolvedId) { missingRefs.push(refName); skippedRows++; return; }
            const unit = VALID_UNITS.includes(row.unit) ? row.unit : 'g';
            recipeRows.push({
              ingredientId: resolvedId,
              qty: Number(row.qty ?? 0),
              unit,
              ...(row.portionsPerPiece != null ? { portionsPerPiece: Number(row.portionsPerPiece) } : {}),
            });
          });
          if (recipeRows.length > 0) {
            newRecipes[dishName] = recipeRows;
            importedDishes++;
          }
        });
        if (importedDishes === 0) throw new Error('Nessuna ricetta valida trovata nel file.');
        setRecipes((prev: Record<string, any[]>) => {
          const merged = { ...prev, ...newRecipes };
          const uniqueMissing = [...new Set(missingRefs)];
          let msg = `Importate ${importedDishes} ricette.`;
          if (skippedRows > 0) msg += ` ${skippedRows} righe saltate (ingrediente/prep non trovato): ${uniqueMissing.slice(0, 4).join(', ')}${uniqueMissing.length > 4 ? '…' : ''}.`;
          setRecipeImportMsg({ type: skippedRows > 0 ? 'warn' : 'ok', msg });
          return merged;
        });
      } catch (err: any) {
        setRecipeImportMsg({ type: 'err', msg: `Errore: ${err.message}` });
      }
    };
    reader.readAsText(file);
  };

  // Helper UI per i messaggi di feedback import
  const ImportMsg = ({ msg }: { msg: { type: 'ok' | 'err' | 'warn'; msg: string } | null }) => {
    if (!msg) return null;
    const cls = msg.type === 'ok'
      ? (isDinner ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/40' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
      : msg.type === 'err'
      ? (isDinner ? 'bg-rose-950/30 text-rose-400 border-rose-800/40' : 'bg-rose-50 text-rose-700 border-rose-200')
      : (isDinner ? 'bg-amber-950/30 text-amber-400 border-amber-800/40' : 'bg-amber-50 text-amber-700 border-amber-200');
    const Icon = msg.type === 'ok' ? Check : msg.type === 'err' ? X : AlertCircle;
    return (
      <div className={`flex items-start gap-2 p-3 rounded-lg border text-xs font-medium ${cls}`}>
        <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>{msg.msg}</span>
      </div>
    );
  };

  return (
    <>
             <main className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full">
                <div className="space-y-6">
                    <SI i={idx(0, 3, navDir)} navKey={navKey} navDir={navDir}>
                    {!hideHeader && (
                    <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                        <div>
                            <h1 className={`text-3xl font-bold tracking-tight ${textColor}`}>Pianificazione Strategica</h1>
                            <p className={`${mutedText} mt-1`}>Genera le previsioni AI basate su 14 mesi di storico puro e meteo.</p>
                        </div>
                        {planTab !== 'sala' && (
                            <button
                                onClick={() => setPlanTab('sala')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all hover:shadow-sm
                                    ${isDinner
                                        ? 'bg-[#1E293B] border-[#334155] text-[#C4A882] hover:border-[#967D62]'
                                        : 'bg-white border-[#C4B9A8] text-[#967D62] hover:border-[#967D62]'
                                    }`}
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Previsione settimanale
                            </button>
                        )}
                    </div>
                    )}
                    </SI>
                    <SI i={idx(1, 3, navDir)} navKey={navKey} navDir={navDir}>
                    {planTab === 'inventario' && (
                        <div className="space-y-6">
                            {/* RIGA DUE COLONNE: Magazzino + Ricette */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                {/* ===== COLONNA 1: MAGAZZINO ===== */}
                                <Card className={cardBg}>
                                    <CardHeader>
                                        <CardTitle className={`flex items-center gap-2 ${textColor}`}><ClipboardList className={`w-5 h-5 ${accentColor}`} /> Magazzino</CardTitle>
                                        <CardDescription className={mutedText}>Inserisci gli ingredienti con quantità ideale e attuale.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Form aggiunta ingrediente */}
                                        <div className={`p-4 rounded-xl border space-y-3 ${isDinner ? 'bg-[#0F172A] border-[#334155]' : 'bg-gray-50 border-[#EAE5DA]'}`}>
                                            <h4 className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>Aggiungi Ingrediente</h4>
                                            {/* Riga 1: Nome + UDM */}
                                            <div className="flex gap-2">
                                                <Input placeholder="Nome (es. Farina)" value={newIngName} onChange={e => { setNewIngName(e.target.value); setNewIngSupplierMode('new'); setNewIngSelectedSupplier(''); }} className={`flex-1 ${isDinner ? 'border-[#334155] bg-[#1E293B]' : 'border-[#EAE5DA]'}`} />
                                                {(() => {
                                                    const existingForUnit = ingredients.find(i => i.name.toLowerCase() === newIngName.toLowerCase());
                                                    // Blocca UDM solo se fornitore esistente
                                                    if (existingForUnit && newIngSupplierMode === 'existing') {
                                                        const selSupplier = existingForUnit.suppliers?.find(s => s.name === newIngSelectedSupplier);
                                                        const displayUnit = selSupplier?.unit || existingForUnit.unit;
                                                        return (
                                                            <div className={`w-20 h-9 flex items-center justify-center rounded-md border text-sm font-semibold ${isDinner ? 'border-[#334155] bg-[#0F172A] text-[#94A3B8]' : 'border-[#EAE5DA] bg-gray-100 text-[#8C8A85]'}`}>
                                                                {displayUnit}
                                                            </div>
                                                        );
                                                    }
                                                    return (
                                                        <div className="relative" ref={ingUnitRef}>
                                                          <button type="button" onClick={() => setIngUnitDropOpen(v => !v)}
                                                            className={`flex items-center justify-between gap-1 px-2 py-1.5 rounded-xl border text-sm font-semibold w-20 transition-colors ${isDinner ? 'border-[#334155] bg-[#1E293B] text-[#F4F1EA] hover:border-[#967D62]/40' : 'border-[#EAE5DA] bg-white text-[#2C2A28] hover:border-[#967D62]/40'}`}>
                                                            <span>{newIngUnit}</span>
                                                            <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${ingUnitDropOpen ? 'rotate-180' : ''}`} />
                                                          </button>
                                                          {ingUnitDropOpen && (
                                                            <div className={`absolute z-50 mt-1 right-0 rounded-xl border shadow-xl overflow-hidden ${isDinner ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#EAE5DA]'}`}>
                                                              {['g','kg','ml','l','cl','pz','conf'].map(u => (
                                                                <button key={u} type="button"
                                                                  onClick={() => { setNewIngUnit(u); setIngUnitDropOpen(false); }}
                                                                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${u === newIngUnit ? (isDinner ? 'bg-[#967D62]/20 text-[#F4F1EA]' : 'bg-[#967D62]/10 text-[#967D62]') : (isDinner ? 'text-[#F4F1EA] hover:bg-[#334155]/40' : 'text-[#2C2A28] hover:bg-[#F4F1EA]/60')}`}>
                                                                  {u}
                                                                </button>
                                                              ))}
                                                            </div>
                                                          )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                            {/* Avviso misto pz / misurabile */}
                                            {(() => {
                                                const existingForWarn = ingredients.find(i => i.name.toLowerCase() === newIngName.toLowerCase());
                                                if (!existingForWarn) return null;
                                                const origUnit = existingForWarn.unit;
                                                const weightGroup = ['g', 'kg'];
                                                const liquidGroup = ['ml', 'l', 'cl'];
                                                const isOrigWeight = weightGroup.includes(origUnit);
                                                const isOrigLiquid = liquidGroup.includes(origUnit);
                                                const isNewWeight = weightGroup.includes(newIngUnit);
                                                const isNewLiquid = liquidGroup.includes(newIngUnit);
                                                if (isPieceUnit(origUnit) && !isPieceUnit(newIngUnit)) {
                                                    return <p className="text-xs text-red-500 font-medium">⚠ Questo ingrediente è a pezzi/confezioni — non puoi aggiungere quantità in {newIngUnit}.</p>;
                                                }
                                                if (!isPieceUnit(origUnit) && isPieceUnit(newIngUnit)) {
                                                    return <p className="text-xs text-red-500 font-medium">⚠ Questo ingrediente è registrato in {origUnit} — non puoi aggiungere quantità a pezzi/confezioni.</p>;
                                                }
                                                if (isOrigWeight && isNewLiquid) {
                                                    return <p className="text-xs text-red-500 font-medium">⚠ Questo ingrediente è registrato in {origUnit} (peso) — non puoi aggiungere quantità in {newIngUnit} (volume).</p>;
                                                }
                                                if (isOrigLiquid && isNewWeight) {
                                                    return <p className="text-xs text-red-500 font-medium">⚠ Questo ingrediente è registrato in {origUnit} (volume) — non puoi aggiungere quantità in {newIngUnit} (peso).</p>;
                                                }
                                                return null;
                                            })()}
                                            {/* Riga 2: Fornitore */}
                                            {(() => {
                                                const existingIng = ingredients.find(i => i.name.toLowerCase() === newIngName.toLowerCase());
                                                const existingSuppliers = existingIng?.suppliers || [];
                                                const selectedSupplierData = existingSuppliers.find(s => s.name === newIngSelectedSupplier);
                                                return (
                                                    <div className="space-y-2">
                                                        <Label className={`text-xs ${mutedText}`}>Fornitore</Label>
                                                        <div className="flex gap-1 mb-1 flex-wrap">
                                                            {existingSuppliers.length > 0 && (
                                                                <button onClick={() => { setNewIngSupplierMode('existing'); setNewIngBoxCount(''); }} className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${newIngSupplierMode === 'existing' ? 'bg-[#967D62] text-white border-[#967D62]' : (isDinner ? 'border-[#334155] text-[#94A3B8]' : 'border-[#EAE5DA] text-[#8C8A85]')}`}>Esistente</button>
                                                            )}
                                                            <button onClick={() => { setNewIngSupplierMode('new'); setNewIngSelectedSupplier(''); setNewIngBoxCount(''); }} className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${newIngSupplierMode === 'new' ? 'bg-[#967D62] text-white border-[#967D62]' : (isDinner ? 'border-[#334155] text-[#94A3B8]' : 'border-[#EAE5DA] text-[#8C8A85]')}`}>Nuovo</button>
                                                        </div>
                                                        {(newIngSupplierMode === 'new' || existingSuppliers.length === 0) ? (
                                                            <Input placeholder="Nome fornitore" value={newIngSupplierName} onChange={e => setNewIngSupplierName(e.target.value)} className={`w-full ${isDinner ? 'border-[#334155] bg-[#1E293B]' : 'border-[#EAE5DA]'}`} />
                                                        ) : (
                                                            <div className="relative" ref={ingSupplierRef}>
                                                              <button type="button" onClick={() => setIngSupplierDropOpen(v => !v)}
                                                                className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${newIngSelectedSupplier ? (isDinner ? 'border-[#967D62]/60 bg-[#967D62]/10 text-[#F4F1EA]' : 'border-[#967D62]/60 bg-[#967D62]/5 text-[#2C2A28]') : (isDinner ? 'border-[#334155] text-[#94A3B8] hover:border-[#967D62]/40' : 'border-[#EAE5DA] text-[#8C8A85] hover:border-[#967D62]/40')}`}>
                                                                <span className="truncate">{newIngSelectedSupplier || 'Seleziona fornitore'}</span>
                                                                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${ingSupplierDropOpen ? 'rotate-180' : ''}`} />
                                                              </button>
                                                              {ingSupplierDropOpen && (
                                                                <div className={`absolute z-50 mt-1 w-full rounded-xl border shadow-xl overflow-hidden ${isDinner ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#EAE5DA]'}`}>
                                                                  <button type="button" onClick={() => { setNewIngSelectedSupplier(''); setIngSupplierDropOpen(false); }}
                                                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${!newIngSelectedSupplier ? (isDinner ? 'bg-[#967D62]/20 text-[#F4F1EA]' : 'bg-[#967D62]/10 text-[#967D62]') : (isDinner ? 'text-[#94A3B8] hover:bg-[#334155]/40' : 'text-[#8C8A85] hover:bg-[#F4F1EA]/60')}`}>
                                                                    Seleziona fornitore
                                                                  </button>
                                                                  {existingSuppliers.map(s => (
                                                                    <button key={s.name} type="button"
                                                                      onClick={() => { setNewIngSelectedSupplier(s.name); setIngSupplierDropOpen(false); }}
                                                                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${s.name === newIngSelectedSupplier ? (isDinner ? 'bg-[#967D62]/20 text-[#F4F1EA]' : 'bg-[#967D62]/10 text-[#967D62]') : (isDinner ? 'text-[#F4F1EA] hover:bg-[#334155]/40' : 'text-[#2C2A28] hover:bg-[#F4F1EA]/60')}`}>
                                                                      <span className="font-semibold">{s.name}</span>
                                                                      <span className={`ml-2 text-xs ${isDinner ? 'text-[#94A3B8]' : 'text-[#8C8A85]'}`}>({s.qtyPerBox}{s.unit || newIngUnit}/scatolone)</span>
                                                                    </button>
                                                                  ))}
                                                                </div>
                                                              )}
                                                            </div>
                                                        )}
                                                        {(newIngSupplierMode === 'new' || existingSuppliers.length === 0) && (
                                                            <div className="flex gap-2 items-end">
                                                                <div className="flex-1 space-y-1">
                                                                    <Label className={`text-xs ${mutedText}`}>Qtà in 1 scatolone</Label>
                                                                    <div className="flex items-center gap-1">
                                                                        <Input type="number" placeholder={`Es. 25`} value={newIngQtyPerBox} onChange={e => setNewIngQtyPerBox(e.target.value)} className={isDinner ? 'border-[#334155] bg-[#1E293B]' : 'border-[#EAE5DA]'} />
                                                                        <span className={`text-xs whitespace-nowrap ${mutedText}`}>{newIngUnit}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex-1 space-y-1">
                                                                    <Label className={`text-xs ${mutedText}`}>Prezzo scatolone</Label>
                                                                    <div className="flex items-center gap-1">
                                                                        <span className={`text-xs ${mutedText}`}>€</span>
                                                                        <Input type="number" placeholder="Es. 18.50" value={newIngPricePerBox} onChange={e => setNewIngPricePerBox(e.target.value)} className={isDinner ? 'border-[#334155] bg-[#1E293B]' : 'border-[#EAE5DA]'} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {newIngSupplierMode === 'existing' && existingSuppliers.length > 0 && (() => {
                                                            const existingPrice = selectedSupplierData?.pricePerBox;
                                                            return (
                                                                <div className="space-y-1">
                                                                    <Label className={`text-xs ${mutedText}`}>Prezzo scatolone</Label>
                                                                    {!newIngEditingPrice ? (
                                                                        <div className={`flex items-center gap-2 h-9 px-3 rounded-md border ${isDinner ? 'border-[#334155] bg-[#1E293B]' : 'border-[#EAE5DA] bg-gray-100'}`}>
                                                                            <span className={`text-xs ${mutedText}`}>€</span>
                                                                            <span className={`flex-1 text-sm ${mutedText}`}>{existingPrice?.toFixed(2) ?? '—'}</span>
                                                                            <button onClick={() => { setNewIngEditingPrice(true); setNewIngPricePerBox(String(existingPrice ?? '')); }} className={`${mutedText} hover:text-[#967D62] transition-colors`}><Pencil className="w-3.5 h-3.5" /></button>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-1">
                                                                            <span className={`text-xs ${mutedText}`}>€</span>
                                                                            <Input type="number" placeholder="Es. 18.50" value={newIngPricePerBox} onChange={e => setNewIngPricePerBox(e.target.value)} className={isDinner ? 'border-[#334155] bg-[#1E293B]' : 'border-[#EAE5DA]'} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                        {/* Riga 4: Numero scatoloni + Qt ideale + bottone */}
                                                        <div className="flex gap-2 items-end">
                                                            <div className="space-y-1">
                                                                <Label className={`text-xs ${mutedText}`}>N° scatoloni</Label>
                                                                <Input type="number" placeholder="Es. 3" value={newIngBoxCount} onChange={e => setNewIngBoxCount(e.target.value)} className={`w-24 ${isDinner ? 'border-[#334155] bg-[#1E293B]' : 'border-[#EAE5DA]'}`} />
                                                            </div>
                                                            <div className="flex-1 space-y-1">
                                                                <Label className={`text-xs ${mutedText}`}>Quantità ideale</Label>
                                                                {(() => {
                                                                    const isExisting = ingredients.some(i => i.name.toLowerCase() === newIngName.toLowerCase());
                                                                    const existingIdeal = ingredients.find(i => i.name.toLowerCase() === newIngName.toLowerCase())?.idealQty;
                                                                    if (isExisting && !newIngEditingIdeal) {
                                                                        return (
                                                                            <div className={`flex items-center gap-2 h-9 px-3 rounded-md border ${isDinner ? 'border-[#334155] bg-[#1E293B]' : 'border-[#EAE5DA] bg-gray-100'}`}>
                                                                                <span className={`flex-1 text-sm ${mutedText}`}>{existingIdeal}{newIngUnit}</span>
                                                                                <button onClick={() => { setNewIngEditingIdeal(true); setNewIngIdeal(String(existingIdeal)); }} className={`${mutedText} hover:text-[#967D62] transition-colors`}><Pencil className="w-3.5 h-3.5" /></button>
                                                                            </div>
                                                                        );
                                                                    }
                                                                    return <Input type="number" placeholder="Es. 5000" value={newIngIdeal} onChange={e => setNewIngIdeal(e.target.value)} className={isDinner ? 'border-[#334155] bg-[#1E293B]' : 'border-[#EAE5DA]'} />;
                                                                })()}
                                                            </div>
                                                            <Button onClick={() => {
                                                                const qtyPerBox = newIngSupplierMode === 'existing' && selectedSupplierData ? selectedSupplierData.qtyPerBox : Number(newIngQtyPerBox);
                                                                const boxes = Number(newIngBoxCount);
                                                                const supplierName = newIngSupplierMode === 'existing' ? newIngSelectedSupplier : newIngSupplierName;
                                                                const effectivePricePerBox = newIngSupplierMode === 'existing' && !newIngEditingPrice && selectedSupplierData
                                                                    ? selectedSupplierData.pricePerBox
                                                                    : Number(newIngPricePerBox);
                                                                const isExistingIng = ingredients.some(i => i.name.toLowerCase() === newIngName.toLowerCase());
                                                                const effectiveIdeal = isExistingIng && !newIngEditingIdeal
                                                                    ? String(ingredients.find(i => i.name.toLowerCase() === newIngName.toLowerCase())?.idealQty || '')
                                                                    : newIngIdeal;
                                                                if (!newIngName || !effectiveIdeal || !boxes || !qtyPerBox || !supplierName || !effectivePricePerBox) return;
                                                                const existingIngForConv = ingredients.find(i => i.name.toLowerCase() === newIngName.toLowerCase());
                                                                const origUnit = existingIngForConv?.unit || newIngUnit;
                                                                const wg = ['g','kg']; const lq = ['ml','l','cl'];
                                                                const incompatible = existingIngForConv && (
                                                                    (isPieceUnit(origUnit) && !isPieceUnit(newIngUnit)) ||
                                                                    (!isPieceUnit(origUnit) && isPieceUnit(newIngUnit)) ||
                                                                    (wg.includes(origUnit) && lq.includes(newIngUnit)) ||
                                                                    (lq.includes(origUnit) && wg.includes(newIngUnit))
                                                                );
                                                                if (incompatible) return;
                                                                const rawQty = qtyPerBox * boxes;
                                                                const supplierUnit = newIngSupplierMode === 'existing' && selectedSupplierData?.unit ? selectedSupplierData.unit : newIngUnit;
                                                                const converted = existingIngForConv ? convertToUnit(rawQty, supplierUnit, origUnit) : rawQty;
                                                                const totalQty = converted !== null ? converted : rawQty;
                                                                const existingIdx = ingredients.findIndex(i => i.name.toLowerCase() === newIngName.toLowerCase());
                                                                const pricePerBaseUnit = qtyPerBox > 0 ? effectivePricePerBox / qtyPerBox : 0;
                                                                const purchaseRecord = { qty: totalQty, pricePerUnit: pricePerBaseUnit, date: new Date().toISOString().split('T')[0], supplierName };
                                                                if (existingIdx >= 0) {
                                                                    setIngredients(prev => prev.map((ing, idx) => {
                                                                        if (idx !== existingIdx) return ing;
                                                                        const updatedSuppliers = ing.suppliers || [];
                                                                        const supIdx = updatedSuppliers.findIndex(s => s.name === supplierName);
                                                                        const newSuppliers = supIdx >= 0
                                                                            ? updatedSuppliers.map(s => s.name === supplierName ? { ...s, pricePerBox: effectivePricePerBox } : s)
                                                                            : [...updatedSuppliers, { name: supplierName, qtyPerBox, pricePerBox: effectivePricePerBox, unit: newIngUnit }];
                                                                        const updatedIdeal = newIngEditingIdeal && newIngIdeal ? Number(newIngIdeal) : Number(effectiveIdeal) || ing.idealQty;
                                                                        return { ...ing, currentQty: ing.currentQty + totalQty, idealQty: updatedIdeal, suppliers: newSuppliers, purchaseHistory: [...(ing.purchaseHistory || []), purchaseRecord] };
                                                                    }));
                                                                } else {
                                                                    const id = Date.now().toString();
                                                                    setIngredients(prev => [...prev, { id, name: newIngName, unit: newIngUnit, idealQty: Number(effectiveIdeal), currentQty: totalQty, suppliers: [{ name: supplierName, qtyPerBox, pricePerBox: effectivePricePerBox, unit: newIngUnit }], purchaseHistory: [purchaseRecord] }]);
                                                                }
                                                                setNewIngName(''); setNewIngIdeal(''); setNewIngSupplierName(''); setNewIngQtyPerBox(''); setNewIngBoxCount(''); setNewIngSelectedSupplier(''); setNewIngSupplierMode('new'); setNewIngEditingIdeal(false); setNewIngPricePerBox(''); setNewIngEditingPrice(false);
                                                            }} className="bg-[#967D62] hover:bg-[#7A654E] text-white px-4">
                                                                <Plus className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* Lista ingredienti + preparazioni */}
                                        {ingredients.length === 0 && preparations.length === 0 ? (
                                            <p className={`text-sm text-center py-4 ${mutedText}`}>Nessun ingrediente inserito.</p>
                                        ) : (
                                            <div className="space-y-2 max-h-80 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                                {/* Ingredienti acquistati */}
                                                {ingredients.map(ing => {
                                                    const isNegative = ing.currentQty < 0;
                                                    const pct = isNegative ? 0 : ing.idealQty > 0 ? (ing.currentQty / ing.idealQty) * 100 : 100;
                                                    const color = isNegative ? 'bg-amber-500' : pct > 50 ? 'bg-emerald-500' : pct > 20 ? 'bg-amber-500' : 'bg-red-500';
                                                    const borderCls = isNegative
                                                      ? (isDinner ? 'bg-[#0F172A] border-amber-700/50' : 'bg-amber-50/50 border-amber-200')
                                                      : (isDinner ? 'bg-[#0F172A] border-[#334155]' : 'bg-gray-50 border-[#EAE5DA]');
                                                    return (
                                                        <div key={ing.id} className={`p-3 rounded-lg border ${borderCls}`}>
                                                            <div className="flex justify-between items-center mb-1">
                                                                <div className="flex items-center gap-1.5">
                                                                    {isNegative && <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                                                                    <span className={`font-semibold text-sm ${textColor}`}>{ing.name}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`text-sm font-mono ${isNegative ? 'text-amber-500' : pct < 20 ? 'text-red-500' : pct < 50 ? 'text-amber-500' : 'text-emerald-500'}`}>{isPieceUnit(ing.unit) ? Math.floor(ing.currentQty) : floor2(ing.currentQty)}{ing.unit} / {floor2(ing.idealQty)}{ing.unit}</span>
                                                                    <button onClick={() => setIngredients(prev => prev.filter(i => i.id !== ing.id))} className="text-red-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                                                                </div>
                                                            </div>
                                                            <div className={`w-full h-1.5 rounded-full ${isDinner ? 'bg-[#334155]' : 'bg-gray-200'}`}>
                                                                <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {/* Preparazioni interne */}
                                                {preparations.length > 0 && (
                                                    <>
                                                        <p className={`text-[10px] font-bold uppercase tracking-wider pt-1 ${mutedText}`}>Preparazioni</p>
                                                        {preparations.map(prep => (
                                                            <div key={prep.id} className={`p-3 rounded-lg border ${isDinner ? 'bg-[#0F172A] border-[#334155]/60' : 'bg-[#967D62]/5 border-[#967D62]/20'}`}>
                                                                <div className="flex items-center gap-1.5">
                                                                    <CookingPot className={`w-3.5 h-3.5 text-[#967D62]`} />
                                                                    <span className={`font-semibold text-sm ${textColor}`}>{prep.name}</span>
                                                                    <span className={`ml-1 text-xs ${mutedText}`}>— {prep.yieldQty}{prep.yieldUnit}/batch</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {/* Registra consumo + Verifica Quantità */}
                                        {ingredients.length > 0 && (
                                            <div className="pt-2 space-y-2">
                                                <Button
                                                    onClick={() => { setShowExtraModal(true); setExtraMsg(null); setExtraIngId(''); setExtraQty(''); setExtraNote(''); setExtraDate(new Date().toISOString().split('T')[0]); setExtraCategory('waste'); }}
                                                    className={`w-full font-semibold ${isDinner ? 'bg-[#967D62] hover:bg-[#7A654E] text-[#F4F1EA]' : 'bg-[#B89A80] hover:bg-[#967D62] text-white'}`}
                                                >
                                                    <Flame className="w-4 h-4 mr-2" /> Registra consumi interni
                                                </Button>
                                                <Button onClick={() => { setShowVerifyModal(true); setVerifyValues({}); setVerifyPhase('input'); loadVerifySnapshots(); }} className={`w-full font-semibold ${isDinner ? 'bg-[#967D62] hover:bg-[#7A654E] text-[#F4F1EA]' : 'bg-[#B89A80] hover:bg-[#967D62] text-white'}`}>
                                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Verifica Quantità
                                                </Button>
                                            </div>
                                        )}

                                        {/* Import ingredienti da JSON */}
                                        <div className="pt-3 mt-1 border-t border-black/5 dark:border-white/5 space-y-2">
                                            <ImportMsg msg={ingImportMsg} />
                                            <button
                                                onClick={() => { setIngImportMsg(null); ingImportRef.current?.click(); }}
                                                className={`flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg border border-dashed cursor-pointer text-xs font-medium transition-colors ${isDinner ? 'border-[#334155] text-[#94A3B8] hover:bg-[#334155]/30' : 'border-[#D1C9BC] text-[#8C8A85] hover:bg-gray-50'}`}
                                            >
                                                <Upload className="w-3.5 h-3.5" />
                                                Importa ingredienti
                                                <span className={`text-[10px] ${mutedText}`}>(ingredienti.json)</span>
                                            </button>
                                            <input ref={ingImportRef} type="file" accept=".json" onChange={handleIngImport} className="hidden" />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* ===== COLONNA 2: PREPARAZIONI ===== */}
                                <Card className={cardBg}>
                                    <CardHeader>
                                        <CardTitle className={`flex items-center gap-2 ${textColor}`}><CookingPot className={`w-5 h-5 ${accentColor}`} /> Preparazioni Interne</CardTitle>
                                        <CardDescription className={mutedText}>Semi-lavorati fatti in casa. Definisci la ricetta e usala come ingrediente nei piatti.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Form nuova preparazione */}
                                        <div className={`p-4 rounded-xl border space-y-3 ${isDinner ? 'bg-[#0F172A] border-[#334155]' : 'bg-gray-50 border-[#EAE5DA]'}`}>
                                            <h4 className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>{editingPrepId ? 'Modifica Preparazione' : 'Nuova Preparazione'}</h4>
                                            <div className="flex gap-2">
                                                <Input placeholder="Nome (es. Maionese, Salsa BBQ)" value={newPrepName} onChange={e => setNewPrepName(e.target.value)} className={`flex-1 ${isDinner ? 'border-[#334155] bg-[#1E293B]' : 'border-[#EAE5DA]'}`} />
                                            </div>
                                            <div className="flex gap-2 items-end">
                                                <div className="flex-1 space-y-1">
                                                    <Label className={`text-xs ${mutedText}`}>Resa (quantità prodotta per batch)</Label>
                                                    <Input type="number" placeholder="Es. 500" value={newPrepYieldQty} onChange={e => setNewPrepYieldQty(e.target.value)} className={isDinner ? 'border-[#334155] bg-[#1E293B]' : 'border-[#EAE5DA]'} />
                                                </div>
                                                <div className="relative" ref={prepUnitRef}>
                                                  <button type="button" onClick={() => setPrepUnitDropOpen(v => !v)}
                                                    className={`flex items-center justify-between gap-1 px-2 py-2 rounded-xl border text-sm font-semibold w-20 transition-colors ${isDinner ? 'border-[#334155] bg-[#1E293B] text-[#F4F1EA] hover:border-[#967D62]/40' : 'border-[#EAE5DA] bg-white text-[#2C2A28] hover:border-[#967D62]/40'}`}>
                                                    <span>{newPrepYieldUnit}</span>
                                                    <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${prepUnitDropOpen ? 'rotate-180' : ''}`} />
                                                  </button>
                                                  {prepUnitDropOpen && (
                                                    <div className={`absolute z-50 mt-1 right-0 rounded-xl border shadow-xl overflow-hidden ${isDinner ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#EAE5DA]'}`}>
                                                      {['g','kg','ml','l','cl','pz','conf'].map(u => (
                                                        <button key={u} type="button"
                                                          onClick={() => { setNewPrepYieldUnit(u); setPrepUnitDropOpen(false); }}
                                                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${u === newPrepYieldUnit ? (isDinner ? 'bg-[#967D62]/20 text-[#F4F1EA]' : 'bg-[#967D62]/10 text-[#967D62]') : (isDinner ? 'text-[#F4F1EA] hover:bg-[#334155]/40' : 'text-[#2C2A28] hover:bg-[#F4F1EA]/60')}`}>
                                                          {u}
                                                        </button>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                            </div>
                                            <Button onClick={() => {
                                                if (!newPrepName || !newPrepYieldQty) return;
                                                if (editingPrepId) {
                                                    setPreparations(prev => prev.map(p => p.id === editingPrepId ? { ...p, name: newPrepName, yieldQty: Number(newPrepYieldQty), yieldUnit: newPrepYieldUnit } : p));
                                                    setEditingPrepId(null);
                                                } else {
                                                    setPreparations(prev => [...prev, { id: Date.now().toString(), name: newPrepName, yieldQty: Number(newPrepYieldQty), yieldUnit: newPrepYieldUnit, currentQty: 0, idealQty: 0, ingredients: [] }]);
                                                }
                                                setNewPrepName(''); setNewPrepYieldQty(''); setNewPrepIdealQty(''); setNewPrepEditingIdeal(false);
                                            }} className="w-full bg-[#967D62] hover:bg-[#7A654E] text-white">
                                                <Plus className="w-4 h-4 mr-2" />
                                                {editingPrepId ? 'Aggiorna' : 'Crea Preparazione'}
                                            </Button>
                                        </div>
                                        {/* Lista preparazioni */}
                                        {preparations.length === 0 ? (
                                            <p className={`text-sm text-center py-4 ${mutedText}`}>Nessuna preparazione inserita.</p>
                                        ) : (
                                            <div className="space-y-3 max-h-[500px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                                {preparations.map(prep => {
                                                    const costPerUnit = (() => {
                                                        if (prep.yieldQty === 0) return null;
                                                        let total = 0; let missing = false;
                                                        prep.ingredients.forEach(row => {
                                                            const ing = ingredients.find(i => i.id === row.ingredientId);
                                                            if (!ing) { missing = true; return; }
                                                            let ppu: number | null = null;
                                                            if (ing.manualPricePerUnit != null && ing.manualPricePerUnit > 0) {
                                                                ppu = ing.manualPricePerUnit;
                                                            } else if (ing.purchaseHistory && ing.purchaseHistory.length > 0) {
                                                                const tq = ing.purchaseHistory.reduce((s: number, r: any) => s + r.qty, 0);
                                                                const ts = ing.purchaseHistory.reduce((s: number, r: any) => s + r.qty * r.pricePerUnit, 0);
                                                                if (tq > 0) ppu = ts / tq;
                                                            } else {
                                                                const sup = ing.suppliers?.find(s => s.pricePerBox > 0 && s.qtyPerBox > 0);
                                                                if (sup) ppu = sup.pricePerBox / sup.qtyPerBox;
                                                            }
                                                            if (ppu == null) { missing = true; return; }
                                                            if ((row as any).portionsPerPiece && (row as any).portionsPerPiece > 0) {
                                                                // Ingrediente a pz/conf: costo per porzione = ppu / portionsPerPiece
                                                                total += ppu / (row as any).portionsPerPiece;
                                                            } else {
                                                                const qtyInBase = normalizeToBase(row.qty, row.unit ?? ing.unit, ing.unit);
                                                                total += ppu * qtyInBase;
                                                            }
                                                        });
                                                        return missing ? null : total / prep.yieldQty;
                                                    })();
                                                    return (
                                                        <div key={prep.id} className={`rounded-xl border overflow-hidden ${isDinner ? 'border-[#334155]' : 'border-[#EAE5DA]'}`}>
                                                            {/* Header: sempre visibile, click per aprire/chiudere */}
                                                            <button
                                                                onClick={() => setOpenPrepIds(prev => {
                                                                    const next = new Set(prev);
                                                                    if (next.has(prep.id)) { next.delete(prep.id); } else { next.add(prep.id); }
                                                                    return next;
                                                                })}
                                                                className={`w-full flex items-center justify-between p-3 text-left transition-colors ${isDinner ? 'bg-[#1E293B] hover:bg-[#334155]' : 'bg-white hover:bg-gray-50'}`}
                                                            >
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    <span className={`font-semibold text-sm ${textColor}`}>{prep.name}</span>
                                                                    <span className={`text-xs ${mutedText}`}>Resa: {prep.yieldQty}{prep.yieldUnit}</span>
                                                                    {costPerUnit != null && <span className={`text-xs font-mono text-[#967D62]`}>€{costPerUnit.toFixed(4)}/{prep.yieldUnit}</span>}
                                                                </div>
                                                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                                                    <button onClick={e => { e.stopPropagation(); setEditingPrepId(prep.id); setNewPrepName(prep.name); setNewPrepYieldQty(String(prep.yieldQty)); setNewPrepYieldUnit(prep.yieldUnit); setNewPrepIdealQty(''); setNewPrepEditingIdeal(false); }} className={`${mutedText} hover:text-[#967D62]`}><Pencil className="w-3.5 h-3.5" /></button>
                                                                    <button onClick={e => { e.stopPropagation(); setPreparations(prev => prev.filter(p => p.id !== prep.id)); }} className="text-red-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                                                                    {openPrepIds.has(prep.id) ? <ChevronUp className={`w-4 h-4 ${mutedText}`} /> : <ChevronDown className={`w-4 h-4 ${mutedText}`} />}
                                                                </div>
                                                            </button>
                                                            {/* Corpo collassabile */}
                                                            {openPrepIds.has(prep.id) && (
                                                            <div className={`p-3 space-y-2 ${isDinner ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
                                                                {prep.ingredients.map(row => {
                                                                    const ing = ingredients.find(i => i.id === row.ingredientId);
                                                                    return ing ? (
                                                                        <div key={row.ingredientId} className="flex items-center justify-between text-xs">
                                                                            <span className={textColor}>{ing.name}</span>
                                                                            <div className="flex items-center gap-2">
                                                                                {row.portionsPerPiece
                                                                                    ? row.portionsPerPiece >= 1
                                                                                        ? <span className={mutedText}>1 {row.unit ?? ing.unit} → {row.portionsPerPiece % 1 === 0 ? row.portionsPerPiece : row.portionsPerPiece.toFixed(2)} porz.</span>
                                                                                        : <span className={mutedText}>{(1/row.portionsPerPiece) % 1 === 0 ? Math.round(1/row.portionsPerPiece) : (1/row.portionsPerPiece).toFixed(2)} {row.unit ?? ing.unit} → 1 porz.</span>
                                                                                    : <span className={mutedText}>{row.qty}{row.unit ?? ing.unit}</span>
                                                                                }
                                                                                <button onClick={() => setPreparations(prev => prev.map(p => p.id === prep.id ? { ...p, ingredients: p.ingredients.filter(r => r.ingredientId !== row.ingredientId) } : p))} className="text-red-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                                                                            </div>
                                                                        </div>
                                                                    ) : null;
                                                                })}
                                                                <div className="flex gap-2 pt-1">
                                                                    <div className="flex-1 relative">
                                                                        <Input
                                                                            placeholder="Cerca ingrediente..."
                                                                            value={prepIngId && ingredients.find(i => i.id === prepIngId) ? ingredients.find(i => i.id === prepIngId)!.name : (activePrepIngDropdownId === prep.id ? prepIngSearch : '')}
                                                                            onChange={e => { setPrepIngSearch(e.target.value); setPrepIngId(''); }}
                                                                            onFocus={e => { setActivePrepIngDropdownId(prep.id); setPrepDropdownRect(e.currentTarget.getBoundingClientRect()); }}
                                                                            onBlur={() => setTimeout(() => { setPrepDropdownRect(null); }, 150)}
                                                                            className={`text-xs ${isDinner ? 'border-[#334155] bg-[#1E293B] text-[#F4F1EA]' : 'border-[#EAE5DA] bg-white'}`}
                                                                        />
                                                                        {prepDropdownRect && activePrepIngDropdownId === prep.id && !prepIngId && prepIngSearch && (
                                                                            <div className={`fixed z-[9999] rounded-lg border shadow-xl overflow-y-auto ${isDinner ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#EAE5DA]'}`} style={{ top: prepDropdownRect.bottom + 4, left: prepDropdownRect.left, width: prepDropdownRect.width, maxHeight: 180 }}>
                                                                                {ingredients.filter(i => !prep.ingredients.some(r => r.ingredientId === i.id) && i.name.toLowerCase().includes(prepIngSearch.toLowerCase())).map(i => (
                                                                                    <button key={i.id} onMouseDown={e => { e.preventDefault(); setPrepIngId(i.id); setPrepIngSearch(''); setPrepDropdownRect(null); }} className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${isDinner ? 'text-[#F4F1EA] hover:bg-[#334155]' : 'text-[#2C2A28] hover:bg-gray-50'}`}>
                                                                                        {i.name} <span className={mutedText}>({i.unit})</span>
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {(() => {
                                                                        const selIng = prepIngId ? ingredients.find(i => i.id === prepIngId) : null;
                                                                        const baseUnit = selIng?.unit ?? '';
                                                                        const isPiece = baseUnit ? isPieceUnit(baseUnit) : false;
                                                                        const compatUnits = baseUnit ? getCompatibleUnits(baseUnit) : [];
                                                                        const [qtyPart, unitPart] = (activePrepIngDropdownId === prep.id ? prepIngQty : '').split('|');
                                                                        const currentUnit = unitPart || baseUnit;
                                                                        if (isPiece) {
                                                                            return (
                                                                                <div className="flex flex-col gap-1 min-w-[130px]">
                                                                                    <div className="flex items-center gap-1">
                                                                                        <span className={`text-[10px] ${mutedText}`}>
                                                                                            {pieceInputMode === 'porzioniPerPezzo'
                                                                                                ? `Con 1 ${baseUnit} faccio`
                                                                                                : `Per 1 porzione servono`}
                                                                                        </span>
                                                                                        <button
                                                                                            onClick={() => { setPieceInputMode(m => m === 'porzioniPerPezzo' ? 'pezziPerPorzione' : 'porzioniPerPezzo'); setPrepIngQty(''); }}
                                                                                            className={`${mutedText} hover:text-[#967D62] transition-colors`}
                                                                                            title="Inverti logica"
                                                                                        >⇄</button>
                                                                                    </div>
                                                                                    <div className="flex gap-1 items-center">
                                                                                        <Input type="number" min="0.1" step="0.1" placeholder="Es. 5" value={qtyPart || ''} onChange={e => setPrepIngQty(`${e.target.value}|${baseUnit}`)} className={`w-14 text-xs ${isDinner ? 'border-[#334155] bg-[#1E293B]' : 'border-[#EAE5DA]'}`} />
                                                                                        <span className={`text-[10px] ${mutedText}`}>{pieceInputMode === 'porzioniPerPezzo' ? 'porz.' : baseUnit}</span>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        }
                                                                        return (
                                                                            <div className="flex gap-1 items-center">
                                                                                <Input type="number" placeholder="Qty" value={qtyPart || ''} onChange={e => setPrepIngQty(`${e.target.value}|${currentUnit || baseUnit}`)} className={`w-16 text-xs ${isDinner ? 'border-[#334155] bg-[#1E293B]' : 'border-[#EAE5DA]'}`} />
                                                                                {compatUnits.length > 1 ? (
                                                                                    <select value={currentUnit} onChange={e => setPrepIngQty(`${qtyPart || ''}|${e.target.value}`)} className={`w-14 rounded-xl border text-xs px-1 py-1.5 cursor-pointer ${isDinner ? 'border-[#334155] bg-[#1E293B] text-[#F4F1EA]' : 'border-[#EAE5DA] bg-white text-[#2C2A28]'}`}>
                                                                                        {compatUnits.map(u => <option key={u} value={u}>{u}</option>)}
                                                                                    </select>
                                                                                ) : (
                                                                                    <span className={`text-xs w-8 ${mutedText}`}>{baseUnit}</span>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                    <button onClick={() => {
                                                                        const validId = ingredients.find(i => i.id === prepIngId)?.id;
                                                                        const rawQtyStr = activePrepIngDropdownId === prep.id ? prepIngQty : '';
                                                                        const [qtyPart, unitPart] = rawQtyStr.split('|');
                                                                        if (!validId || !qtyPart) return;
                                                                        const selIng = ingredients.find(i => i.id === prepIngId);
                                                                        const baseUnit = selIng?.unit ?? '';
                                                                        const isPiece = isPieceUnit(baseUnit);
                                                                        if (isPiece) {
                                                                            const val = Number(qtyPart);
                                                                            if (val <= 0) return;
                                                                            const portionsPerPiece = pieceInputMode === 'porzioniPerPezzo' ? val : 1 / val;
                                                                            setPreparations(prev => prev.map(p => p.id === prep.id ? { ...p, ingredients: [...p.ingredients, { ingredientId: validId, qty: 0, unit: baseUnit, portionsPerPiece }] } : p));
                                                                        } else {
                                                                            const selectedUnit = unitPart || baseUnit;
                                                                            setPreparations(prev => prev.map(p => p.id === prep.id ? { ...p, ingredients: [...p.ingredients, { ingredientId: validId, qty: Number(qtyPart), unit: selectedUnit }] } : p));
                                                                        }
                                                                        setPrepIngId(''); setPrepIngQty(''); setPrepIngSearch(''); setActivePrepIngDropdownId(null);
                                                                    }} className="px-2 py-1 rounded-md bg-[#967D62] text-white text-xs font-bold hover:bg-[#7A654E]">
                                                                        <Plus className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {/* Import preparazioni da JSON */}
                                        <div className="pt-3 mt-1 border-t border-black/5 dark:border-white/5 space-y-2">
                                            <ImportMsg msg={prepImportMsg} />
                                            <button
                                                onClick={() => { setPrepImportMsg(null); prepImportRef.current?.click(); }}
                                                className={`flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg border border-dashed cursor-pointer text-xs font-medium transition-colors ${isDinner ? 'border-[#334155] text-[#94A3B8] hover:bg-[#334155]/30' : 'border-[#D1C9BC] text-[#8C8A85] hover:bg-gray-50'}`}
                                            >
                                                <Upload className="w-3.5 h-3.5" />
                                                Importa preparazioni
                                                <span className={`text-[10px] ${mutedText}`}>(preparazioni.json)</span>
                                            </button>
                                            <input ref={prepImportRef} type="file" accept=".json" onChange={handlePrepImport} className="hidden" />
                                        </div>
                                    </CardContent>
                                </Card>

                            </div>
                        </div>
                    )}
                    </SI>

                    <SI i={idx(1, 3, navDir)} navKey={navKey} navDir={navDir}>
                    {planTab === 'ricette' && (
                        <div className="space-y-6">
                            <Card className={cardBg}>
                                <CardHeader>
                                    <CardTitle className={`flex items-center gap-2 ${textColor}`}><BookOpen className={`w-5 h-5 ${accentColor}`} /> Ricette dei Piatti</CardTitle>
                                    <CardDescription className={mutedText}>Per ogni piatto del menu, indica gli ingredienti e le preparazioni usate con le quantità per porzione.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {ingredients.length === 0 ? (
                                        <p className={`text-sm text-center py-4 ${mutedText}`}>Aggiungi prima gli ingredienti nel Magazzino.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {MENU_CATEGORIES.flatMap(cat => cat.items).map(dish => {
                                                const dishRecipe = recipes[dish] || [];
                                                const isEditing = editingRecipeDish === dish;
                                                return (
                                                    <div key={dish} className={`rounded-lg border overflow-hidden ${isDinner ? 'border-[#334155]' : 'border-[#EAE5DA]'}`}>
                                                        <div className={`flex items-center text-sm font-semibold transition-colors ${isEditing ? (isDinner ? 'bg-[#334155]' : 'bg-gray-100') : (isDinner ? 'bg-[#1E293B]' : 'bg-white')}`}>
                                                            {/* Nome piatto — click per aprire/chiudere ricetta */}
                                                            <button onClick={() => setEditingRecipeDish(isEditing ? null : dish)} className={`flex-1 flex items-center justify-between px-4 py-2.5 text-left transition-colors ${isEditing ? (isDinner ? 'text-[#F4F1EA]' : 'text-[#2C2A28]') : (isDinner ? 'text-[#94A3B8] hover:text-[#F4F1EA]' : 'text-[#8C8A85] hover:text-[#2C2A28]')}`}>
                                                                <span>{dish}</span>
                                                                <span className="flex items-center gap-2">
                                                                    {dishRecipe.length > 0 && <span className={`text-[10px] font-bold w-10 h-10 flex items-center justify-center rounded-full shrink-0 ${isDinner ? 'bg-[#967D62]/20 text-[#967D62]' : 'bg-[#967D62]/10 text-[#967D62]'}`}>{dishRecipe.length}<br/>ing.</span>}
                                                                    {isEditing ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                                </span>
                                                            </button>
                                                            {/* Prezzo vendita — inline edit con matita/salva */}
                                                            <div className={`flex items-center gap-1.5 px-4 border-l ${isDinner ? 'border-[#334155]' : 'border-[#EAE5DA]'} shrink-0 min-w-[100px] justify-end`}>
                                                                {editingPriceDish === dish ? (
                                                                    <>
                                                                        <span className={`text-sm font-semibold ${mutedText}`}>€</span>
                                                                        <input
                                                                            type="number"
                                                                            step="0.1"
                                                                            min="0"
                                                                            value={editingPriceValue}
                                                                            onChange={e => setEditingPriceValue(e.target.value)}
                                                                            onKeyDown={e => {
                                                                                if (e.key === 'Enter') {
                                                                                    const val = parseFloat(editingPriceValue);
                                                                                    if (!isNaN(val) && val > 0) {
                                                                                        setMenuPrices((prev: Record<string,number>) => ({ ...prev, [dish]: val }));
                                                                                        saveMenuPrice(dish, val);
                                                                                    }
                                                                                    setEditingPriceDish(null);
                                                                                }
                                                                                if (e.key === 'Escape') setEditingPriceDish(null);
                                                                            }}
                                                                            autoFocus
                                                                            className={`w-24 text-sm text-right rounded-md px-2 py-1.5 border font-mono ${isDinner ? 'bg-[#0F172A] border-[#334155] text-[#F4F1EA]' : 'bg-white border-[#EAE5DA] text-[#2C2A28]'}`}
                                                                        />
                                                                        <button
                                                                            onClick={() => {
                                                                                const val = parseFloat(editingPriceValue);
                                                                                if (!isNaN(val) && val > 0) {
                                                                                    setMenuPrices((prev: Record<string,number>) => ({ ...prev, [dish]: val }));
                                                                                    saveMenuPrice(dish, val);
                                                                                }
                                                                                setEditingPriceDish(null);
                                                                            }}
                                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors bg-emerald-500 hover:bg-emerald-600 text-white"
                                                                        >
                                                                            <Check className="w-3.5 h-3.5" /> Salva
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setEditingPriceDish(null)}
                                                                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${isDinner ? 'bg-[#334155] text-[#94A3B8] hover:bg-[#475569]' : 'bg-gray-100 text-[#8C8A85] hover:bg-gray-200'}`}
                                                                        >
                                                                            <X className="w-3.5 h-3.5" /> Annulla
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span className={`text-sm font-mono font-semibold ${menuPrices[dish] ? accentColor : mutedText}`}>
                                                                            €{((menuPrices[dish] ?? (MENU_PRICES as Record<string,number>)[dish]) ?? 0).toFixed(2)}
                                                                        </span>
                                                                        <button
                                                                            onClick={() => {
                                                                                setEditingPriceDish(dish);
                                                                                setEditingPriceValue(String(menuPrices[dish] ?? (MENU_PRICES as Record<string,number>)[dish] ?? ''));
                                                                            }}
                                                                            className={`${mutedText} hover:text-[#967D62] transition-colors ml-1`}
                                                                            title="Modifica prezzo"
                                                                        >
                                                                            <Pencil className="w-3 h-3" />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {isEditing && (
                                                            <div className={`p-3 space-y-2 ${isDinner ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
                                                                {dishRecipe.map(({ ingredientId, qty, unit: rowUnit, portionsPerPiece }: any) => {
                                                                    const isPrep = ingredientId.startsWith('prep:');
                                                                    const prepObj = isPrep ? preparations.find(p => p.id === ingredientId.replace('prep:', '')) : null;
                                                                    const ing = !isPrep ? ingredients.find(i => i.id === ingredientId) : null;
                                                                    const displayName = isPrep ? prepObj?.name : ing?.name;
                                                                    const baseUnit = rowUnit ?? (isPrep ? prepObj?.yieldUnit : ing?.unit);
                                                                    const isPiece = baseUnit ? isPieceUnit(baseUnit) : false;
                                                                    if (!displayName) return null;
                                                                    return (
                                                                        <div key={ingredientId} className="flex items-center justify-between text-xs">
                                                                            <span className={textColor}>
                                                                                {displayName}
                                                                                {isPrep && <span className={`ml-1 text-[10px] text-[#967D62]`}>(prep.)</span>}
                                                                            </span>
                                                                            <div className="flex items-center gap-2">
                                                                                {isPiece && portionsPerPiece
                                                                                    ? portionsPerPiece >= 1
                                                                                        ? <span className={mutedText}>1 {baseUnit} → {portionsPerPiece % 1 === 0 ? portionsPerPiece : portionsPerPiece.toFixed(2)} porz.</span>
                                                                                        : <span className={mutedText}>{(1/portionsPerPiece) % 1 === 0 ? 1/portionsPerPiece : (1/portionsPerPiece).toFixed(2)} {baseUnit} → 1 porz.</span>
                                                                                    : <span className={mutedText}>{qty}{baseUnit}</span>
                                                                                }
                                                                                <button onClick={() => setRecipes(prev => ({ ...prev, [dish]: (prev[dish] || []).filter(r => r.ingredientId !== ingredientId) }))} className="text-red-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                                <div className="flex gap-2 pt-1">
                                                                    <div className="flex-1 relative">
                                                                        <Input
                                                                            placeholder="Cerca ingrediente o preparazione..."
                                                                            value={editingRecipeIngId
                                                                                ? (editingRecipeIngId.startsWith('prep:')
                                                                                    ? (preparations.find(p => p.id === editingRecipeIngId.replace('prep:', ''))?.name ?? ingredientSearchText)
                                                                                    : (ingredients.find(i => i.id === editingRecipeIngId)?.name ?? ingredientSearchText))
                                                                                : ingredientSearchText}
                                                                            onChange={e => { setIngredientSearchText(e.target.value); setEditingRecipeIngId(''); }}
                                                                            onFocus={e => setDropdownRect(e.currentTarget.getBoundingClientRect())}
                                                                            onBlur={() => setTimeout(() => setDropdownRect(null), 150)}
                                                                            className={`text-xs ${isDinner ? 'border-[#334155] bg-[#1E293B] text-[#F4F1EA]' : 'border-[#EAE5DA] bg-white text-[#2C2A28]'}`}
                                                                        />
                                                                        {dropdownRect && !editingRecipeIngId && ingredientSearchText && (() => {
                                                                            const filteredIngs = ingredients.filter(i => !recipes[dish]?.some(r => r.ingredientId === i.id) && i.name.toLowerCase().includes(ingredientSearchText.toLowerCase()));
                                                                            const filteredPreps = preparations.filter(p => !recipes[dish]?.some(r => r.ingredientId === 'prep:' + p.id) && p.name.toLowerCase().includes(ingredientSearchText.toLowerCase()));
                                                                            if (filteredIngs.length === 0 && filteredPreps.length === 0) return null;
                                                                            return (
                                                                                <div className={`fixed z-[9999] rounded-lg border shadow-xl overflow-y-auto ${isDinner ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#EAE5DA]'}`} style={{ top: dropdownRect.bottom + 4, left: dropdownRect.left, width: dropdownRect.width, maxHeight: 200 }}>
                                                                                    {filteredPreps.length > 0 && <div className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${mutedText} border-b ${isDinner ? 'border-[#334155]' : 'border-[#EAE5DA]'}`}>Preparazioni</div>}
                                                                                    {filteredPreps.map(p => (
                                                                                        <button key={'prep:'+p.id} onMouseDown={e => { e.preventDefault(); setEditingRecipeIngId('prep:' + p.id); setIngredientSearchText(''); setDropdownRect(null); }} className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${isDinner ? 'text-[#F4F1EA] hover:bg-[#334155]' : 'text-[#2C2A28] hover:bg-gray-50'}`}>
                                                                                            {p.name} <span className={`text-[#967D62]`}>({p.yieldUnit}) — prep.</span>
                                                                                        </button>
                                                                                    ))}
                                                                                    {filteredIngs.length > 0 && <div className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${mutedText} border-b ${isDinner ? 'border-[#334155]' : 'border-[#EAE5DA]'}`}>Ingredienti</div>}
                                                                                    {filteredIngs.map(i => (
                                                                                        <button key={i.id} onMouseDown={e => { e.preventDefault(); setEditingRecipeIngId(i.id); setIngredientSearchText(''); setDropdownRect(null); }} className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${isDinner ? 'text-[#F4F1EA] hover:bg-[#334155]' : 'text-[#2C2A28] hover:bg-gray-50'}`}>
                                                                                            {i.name} <span className={mutedText}>({i.unit})</span>
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                    {(() => {
                                                                        const isPrep = editingRecipeIngId && editingRecipeIngId.startsWith('prep:');
                                                                        const selIng = editingRecipeIngId && !isPrep ? ingredients.find(i => i.id === editingRecipeIngId) : null;
                                                                        const selPrep = isPrep ? preparations.find(p => p.id === editingRecipeIngId.replace('prep:', '')) : null;
                                                                        const baseUnit = selIng?.unit ?? selPrep?.yieldUnit ?? '';
                                                                        const isPiece = isPieceUnit(baseUnit);
                                                                        const compatUnits = baseUnit ? getCompatibleUnits(baseUnit) : [];
                                                                        if (isPiece) {
                                                                            return (
                                                                                <div className="flex flex-col gap-1 min-w-[130px]">
                                                                                    <div className="flex items-center gap-1">
                                                                                        <span className={`text-[10px] ${mutedText}`}>
                                                                                            {pieceInputMode === 'porzioniPerPezzo'
                                                                                                ? `Con 1 ${baseUnit} faccio`
                                                                                                : `Per 1 porzione servono`}
                                                                                        </span>
                                                                                        <button
                                                                                            onClick={() => { setPieceInputMode(m => m === 'porzioniPerPezzo' ? 'pezziPerPorzione' : 'porzioniPerPezzo'); setEditingRecipeQty(''); }}
                                                                                            className={`${mutedText} hover:text-[#967D62] transition-colors`}
                                                                                            title="Inverti logica"
                                                                                        >⇄</button>
                                                                                    </div>
                                                                                    <div className="flex gap-1 items-center">
                                                                                        <Input type="number" min="0.1" step="0.1" placeholder="Es. 5" value={editingRecipeQty} onChange={e => setEditingRecipeQty(e.target.value)} className={`w-16 text-xs ${isDinner ? 'border-[#334155] bg-[#1E293B]' : 'border-[#EAE5DA]'}`} />
                                                                                        <span className={`text-xs ${mutedText}`}>{pieceInputMode === 'porzioniPerPezzo' ? 'porzioni' : baseUnit}</span>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        }
                                                                        return (
                                                                            <div className="flex flex-col gap-1">
                                                                                <div className="flex gap-1 items-center">
                                                                                    <Input type="number" placeholder="Qty" value={editingRecipeQty} onChange={e => setEditingRecipeQty(e.target.value)} className={`w-16 text-xs ${isDinner ? 'border-[#334155] bg-[#1E293B]' : 'border-[#EAE5DA]'}`} />
                                                                                    {compatUnits.length > 1 ? (
                                                                                        <select value={editingRecipePcsYield || baseUnit} onChange={e => setEditingRecipePcsYield(e.target.value)} className={`w-14 rounded-xl border text-xs px-1 py-1.5 cursor-pointer ${isDinner ? 'border-[#334155] bg-[#1E293B] text-[#F4F1EA]' : 'border-[#EAE5DA] bg-white text-[#2C2A28]'}`}>
                                                                                            {compatUnits.map(u => <option key={u} value={u}>{u}</option>)}
                                                                                        </select>
                                                                                    ) : (
                                                                                        <span className={`text-xs w-8 ${mutedText}`}>{baseUnit}</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                    <button onClick={() => {
                                                                        const isPrep = editingRecipeIngId.startsWith('prep:');
                                                                        const prepObj = isPrep ? preparations.find(p => p.id === editingRecipeIngId.replace('prep:', '')) : null;
                                                                        const ingObj = !isPrep ? ingredients.find(i => i.id === editingRecipeIngId) : null;
                                                                        const validId = isPrep ? (prepObj ? editingRecipeIngId : null) : ingObj?.id;
                                                                        if (!validId || !editingRecipeQty) return;
                                                                        const baseUnit = ingObj?.unit ?? prepObj?.yieldUnit ?? '';
                                                                        const isPiece = isPieceUnit(baseUnit);
                                                                        if (isPiece) {
                                                                            const val = Number(editingRecipeQty);
                                                                            if (val <= 0) return;
                                                                            // Se modalità "pezziPerPorzione": per 1 porzione servono val pz → portionsPerPiece = 1/val
                                                                            const portionsPerPiece = pieceInputMode === 'porzioniPerPezzo' ? val : 1 / val;
                                                                            setRecipes(prev => ({ ...prev, [dish]: [...(prev[dish] || []), { ingredientId: validId, qty: 0, unit: baseUnit, portionsPerPiece }] }));
                                                                        } else {
                                                                            const selectedUnit = editingRecipePcsYield || baseUnit;
                                                                            setRecipes(prev => ({ ...prev, [dish]: [...(prev[dish] || []), { ingredientId: validId, qty: Number(editingRecipeQty), unit: selectedUnit }] }));
                                                                        }
                                                                        setEditingRecipeIngId(''); setEditingRecipeQty(''); setEditingRecipePcsYield(''); setIngredientSearchText('');
                                                                    }} className="px-2 py-1 rounded-md bg-[#967D62] text-white text-xs font-bold hover:bg-[#7A654E] self-end">
                                                                        <Plus className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {/* Import ricette da JSON */}
                                    <div className="pt-3 mt-1 border-t border-black/5 dark:border-white/5 space-y-2">
                                        <ImportMsg msg={recipeImportMsg} />
                                        <button
                                            onClick={() => { setRecipeImportMsg(null); recipeImportRef.current?.click(); }}
                                            className={`flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg border border-dashed cursor-pointer text-xs font-medium transition-colors ${isDinner ? 'border-[#334155] text-[#94A3B8] hover:bg-[#334155]/30' : 'border-[#D1C9BC] text-[#8C8A85] hover:bg-gray-50'}`}
                                        >
                                            <Upload className="w-3.5 h-3.5" />
                                            Importa ricette
                                            <span className={`text-[10px] ${mutedText}`}>(ricette.json)</span>
                                        </button>
                                        <input ref={recipeImportRef} type="file" accept=".json" onChange={handleRecipeImport} className="hidden" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    </SI>

                    <SI i={idx(1, 3, navDir)} navKey={navKey} navDir={navDir}>
                    {planTab === 'sala' && (
                        <>
                            {!weekGenerated ? (
                                // ── CTA GRANDE: genera settimana ──────────────────────
                                <button
                                    onClick={isGeneratingStaff ? undefined : generateStaffPlan}
                                    disabled={isGeneratingStaff}
                                    className={`w-full mt-2 group relative overflow-hidden rounded-2xl border-2 transition-all duration-200
                                        ${isGeneratingStaff ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5'}
                                        ${isDinner
                                            ? 'border-[#334155] bg-[#1E293B] hover:border-[#967D62]'
                                            : 'border-[#EAE5DA] bg-white hover:border-[#967D62]'
                                        }`}
                                >
                                    <div className="flex flex-col items-center justify-center py-16 px-8 gap-5">
                                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-colors
                                            ${isGeneratingStaff
                                                ? (isDinner ? 'bg-[#967D62]/20' : 'bg-[#967D62]/10')
                                                : (isDinner ? 'bg-[#967D62]/20 group-hover:bg-[#967D62]/30' : 'bg-[#967D62]/10 group-hover:bg-[#967D62]/20')
                                            }`}>
                                            {isGeneratingStaff
                                                ? <Loader2 className="w-9 h-9 text-[#967D62] animate-spin" />
                                                : <CalendarRange className="w-9 h-9 text-[#967D62]" />
                                            }
                                        </div>
                                        <div className="text-center">
                                            <h3 className={`text-xl font-bold mb-1.5 ${textColor}`}>
                                                {isGeneratingStaff ? 'Generazione in corso…' : 'Genera Turni Settimana'}
                                            </h3>
                                            <p className={`text-sm ${mutedText}`}>
                                                {isGeneratingStaff
                                                    ? 'Calcolo previsioni AI su 14 mesi di storico e meteo.'
                                                    : 'Ottimizza la programmazione da Lunedì a Domenica basandosi sullo storico AI e le previsioni meteo.'}
                                            </p>
                                        </div>
                                        {!isGeneratingStaff && (
                                            <div className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-colors
                                                bg-[#967D62] text-white group-hover:bg-[#7A654E]`}>
                                                Genera ora
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ) : (
                                <div className="space-y-4">
                                    <div className={`p-4 rounded-xl border ${accentBg} flex items-center justify-between`}>
                                        <span className={`font-bold ${accentColor} uppercase tracking-wider`}>Programmazione dal {staffDateRange.start} al {staffDateRange.end}</span>
                                        <button
                                            onClick={() => setWeekGenerated(false)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors
                                                ${isDinner ? 'bg-[#334155] text-[#F4F1EA] hover:bg-[#475569]' : 'bg-white border border-[#C4B9A8] text-[#967D62] hover:bg-[#F4F1EA]'}`}
                                        >
                                            <X className="w-4 h-4" />
                                            Chiudi
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {weeklyStaffData.map((dayData, idx) => {
                                            const avviso = getFestivitaAvviso(dayData.data || '');
                                            const att: AttendibilitaResult = dayData.attendibilita ?? { livello: 'buona', motivazione: '', colore: 'bg-yellow-400', coloreBar: '#facc15' };
                                            const livelloLabel = att.livello.charAt(0).toUpperCase() + att.livello.slice(1);
                                            return (
                                            <Card key={idx} className={`${cardBg} overflow-hidden flex flex-col`}>
                                                <CardHeader className="pb-3 border-b border-black/5 dark:border-white/5">
                                                    <CardTitle className={`flex justify-between items-center ${textColor}`}>
                                                        <div className="flex flex-col">
                                                            <span>{dayData.dayName}</span>
                                                            <span className={`text-xs font-normal ${mutedText}`}>{dayData.shortDate}</span>
                                                        </div>
                                                        {dayData.isWeekend && (<span className={`text-[10px] ${isDinner ? 'bg-[#967D62] text-[#F4F1EA]' : 'bg-[#967D62] text-white'} px-2 py-0.5 rounded-full uppercase`}>Weekend</span>)}
                                                    </CardTitle>
                                                    {avviso && (
                                                        <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                                                            <p className="text-xs text-amber-700 dark:text-amber-400 leading-snug">{avviso}</p>
                                                        </div>
                                                    )}
                                                </CardHeader>
                                                <CardContent className="p-0 flex-1 flex flex-col">

                                                    {/* ── PRANZO ─────────────────────────────── */}
                                                    <div className="p-4 border-b border-black/5 dark:border-white/5">
                                                        <div className={`flex items-center gap-2 text-sm font-bold mb-3 ${accentColor}`}><Sun className="w-4 h-4" /> PRANZO</div>
                                                        <div className="space-y-1.5">
                                                            <div className="flex justify-between items-center text-sm">
                                                                <span className={mutedText}>Previsti</span>
                                                                <span className={`font-bold ${textColor}`}>{dayData.pranzo.predicted ?? '—'} <span className={`text-xs font-normal ${mutedText}`}>({dayData.pranzo.lo}–{dayData.pranzo.hi})</span></span>
                                                            </div>

                                                            {/* Personale */}
                                                            <div className={`pt-1.5 mt-1.5 border-t ${isDinner ? 'border-white/5' : 'border-black/5'}`}>
                                                                <div className={`flex items-center gap-1.5 mb-1.5 text-xs font-bold uppercase tracking-wider ${mutedText}`}>
                                                                    <Users className="w-3 h-3" /> Personale
                                                                </div>
                                                                <div className="flex justify-between items-center text-sm">
                                                                    <span className={mutedText}>Turno Base</span>
                                                                    <span className={`font-bold ${textColor}`}>{dayData.pranzo.staff.base} Fissi</span>
                                                                </div>
                                                                {dayData.pranzo.staff.onCall > 0 && (
                                                                    <div className="flex justify-between items-center text-sm bg-black/5 dark:bg-white/5 px-2 py-1.5 rounded-md mt-1">
                                                                        <span className={`${accentColor} font-semibold flex items-center gap-1`}><TrendingUp className="w-3 h-3" /> Rinforzo Picco</span>
                                                                        <span className={`font-bold ${accentColor}`}>+{dayData.pranzo.staff.onCall} Chiamata</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Cucina */}
                                                            {dayData.pranzo.cuochi && (
                                                                <div className={`pt-1.5 mt-1 border-t ${isDinner ? 'border-white/5' : 'border-black/5'}`}>
                                                                    <div className={`flex items-center gap-1.5 mb-1.5 text-xs font-bold uppercase tracking-wider ${mutedText}`}>
                                                                        <ChefHat className="w-3 h-3" /> Cucina
                                                                    </div>
                                                                    <div className="flex justify-between items-center text-sm">
                                                                        <span className={mutedText}>Turno Cucina</span>
                                                                        <span className={`font-bold ${textColor}`}>{dayData.pranzo.cuochi.messaggio}</span>
                                                                    </div>
                                                                    {dayData.pranzo.cuochi.nota ? (
                                                                        <p className={`text-xs mt-1 ${accentColor}`}>{dayData.pranzo.cuochi.nota}</p>
                                                                    ) : null}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* ── CENA ───────────────────────────────── */}
                                                    <div className="p-4 flex-1">
                                                        <div className={`flex items-center gap-2 text-sm font-bold mb-3 ${accentColor}`}><Moon className="w-4 h-4" /> CENA</div>
                                                        <div className="space-y-1.5">
                                                            <div className="flex justify-between items-center text-sm">
                                                                <span className={mutedText}>Previsti</span>
                                                                <span className={`font-bold ${textColor}`}>{dayData.cena.predicted ?? '—'} <span className={`text-xs font-normal ${mutedText}`}>({dayData.cena.lo}–{dayData.cena.hi})</span></span>
                                                            </div>

                                                            {/* Personale */}
                                                            <div className={`pt-1.5 mt-1.5 border-t ${isDinner ? 'border-white/5' : 'border-black/5'}`}>
                                                                <div className={`flex items-center gap-1.5 mb-1.5 text-xs font-bold uppercase tracking-wider ${mutedText}`}>
                                                                    <Users className="w-3 h-3" /> Personale
                                                                </div>
                                                                <div className="flex justify-between items-center text-sm">
                                                                    <span className={mutedText}>Turno Base</span>
                                                                    <span className={`font-bold ${textColor}`}>{dayData.cena.staff.base} Fissi</span>
                                                                </div>
                                                                {dayData.cena.staff.onCall > 0 && (
                                                                    <div className="flex justify-between items-center text-sm bg-black/5 dark:bg-white/5 px-2 py-1.5 rounded-md mt-1">
                                                                        <span className={`${accentColor} font-semibold flex items-center gap-1`}><TrendingUp className="w-3 h-3" /> Rinforzo Picco</span>
                                                                        <span className={`font-bold ${accentColor}`}>+{dayData.cena.staff.onCall} Chiamata</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Cucina */}
                                                            {dayData.cena.cuochi && (
                                                                <div className={`pt-1.5 mt-1 border-t ${isDinner ? 'border-white/5' : 'border-black/5'}`}>
                                                                    <div className={`flex items-center gap-1.5 mb-1.5 text-xs font-bold uppercase tracking-wider ${mutedText}`}>
                                                                        <ChefHat className="w-3 h-3" /> Cucina
                                                                    </div>
                                                                    <div className="flex justify-between items-center text-sm">
                                                                        <span className={mutedText}>Turno Cucina</span>
                                                                        <span className={`font-bold ${textColor}`}>{dayData.cena.cuochi.messaggio}</span>
                                                                    </div>
                                                                    {dayData.cena.cuochi.nota ? (
                                                                        <p className={`text-xs mt-1 ${accentColor}`}>{dayData.cena.cuochi.nota}</p>
                                                                    ) : null}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* ── BARRA ATTENDIBILITÀ ─────────────────── */}
                                                    <div className="mt-auto">
                                                        <div className={`px-4 py-2 flex items-center justify-between border-t ${isDinner ? 'border-white/5' : 'border-black/5'}`}>
                                                            <span className={`text-[10px] font-semibold uppercase tracking-wider ${mutedText}`}>Attendibilità</span>
                                                            <span className="text-[10px] font-bold" style={{ color: att.coloreBar }}>{livelloLabel}</span>
                                                        </div>
                                                        <div title={att.motivazione} className="h-1.5 w-full rounded-b-lg" style={{ backgroundColor: att.coloreBar }} />
                                                    </div>

                                                </CardContent>
                                            </Card>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    </SI>

                    <SI i={idx(1, 3, navDir)} navKey={navKey} navDir={navDir}>
                    {planTab === 'cucina' && (
                        <div className="space-y-6">
                            <Card className={cardBg}>
                                <CardHeader className="pb-3 border-b border-black/5 dark:border-white/5 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className={`text-lg ${textColor}`}>Impostazioni Periodo Ordine</CardTitle>
                                        <CardDescription className={mutedText}>Seleziona da quando e per quanti giorni calcolare la spesa.</CardDescription>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setShowBudgetSettings(!showBudgetSettings)} className={`${showBudgetSettings ? (isDinner ? 'bg-[#967D62] text-[#F4F1EA]' : 'bg-[#967D62] text-white') : ''}`}>
                                        <Settings2 className="w-5 h-5" />
                                    </Button>
                                </CardHeader>
                                {showBudgetSettings && (
                                    <CardContent className="pt-6 flex flex-col sm:flex-row gap-6 items-end">
                                        <div className="space-y-2 w-full sm:w-auto">
                                            <Label className={textColor}>Data Inizio Periodo</Label>
                                            <Input type="date" value={budgetStartDate} onChange={e => setBudgetStartDate(e.target.value)} className={isDinner ? 'border-[#334155] bg-[#0F172A] [color-scheme:dark]' : 'border-[#EAE5DA] bg-white'} />
                                        </div>
                                        <div className="space-y-2 w-full sm:w-32">
                                            <Label className={textColor}>Durata (Giorni)</Label>
                                            <Input type="number" min="1" max="30" value={budgetDuration} onChange={e => setBudgetDuration(parseInt(e.target.value))} className={isDinner ? 'border-[#334155] bg-[#0F172A]' : 'border-[#EAE5DA] bg-white'} />
                                        </div>
                                        <Button onClick={generateBudgetPlan} disabled={isGeneratingBudget} className={`shrink-0 px-5 py-2.5 font-semibold shadow-sm disabled:opacity-70 bg-[#967D62] hover:bg-[#7A654E] ${isDinner ? 'text-[#F4F1EA]' : 'text-white'}`}>
                                            {isGeneratingBudget ? (<Loader2 className="w-4 h-4 mr-2 animate-spin" />) : (<Boxes className="w-4 h-4 mr-2" />)}
                                            Calcola Fabbisogno
                                        </Button>
                                    </CardContent>
                                )}
                            </Card>

                            {!budgetGenerated ? (
                                <div className={`mt-8 text-center p-12 border-2 border-dashed rounded-2xl ${isDinner ? 'border-[#334155] bg-[#0F172A]' : 'border-[#EAE5DA] bg-gray-50'}`}>
                                    <Boxes className={`w-16 h-16 mx-auto mb-4 opacity-50 ${mutedText}`} />
                                    <h3 className={`text-lg font-bold ${textColor}`}>Nessun budget calcolato</h3>
                                    <p className={`${mutedText} mt-2`}>Apri le impostazioni con l'ingranaggio, imposta le date e premi Calcola Fabbisogno.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="text-center pb-4">
                                        <h2 className={`text-2xl font-bold ${textColor}`}>Volumi dal {budgetData.startDate} al {budgetData.endDate}</h2>
                                        <p className={mutedText}>Totale aggregato per i prossimi {budgetDuration} giorni</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className={`p-8 rounded-2xl border-2 ${isDinner ? 'border-[#334155] bg-[#1E293B]' : 'border-[#EAE5DA] bg-white shadow-sm'}`}>
                                            <div className={`flex items-center justify-center gap-2 text-xl font-black mb-6 ${accentColor}`}><Sun className="w-6 h-6" /> FABBISOGNO PRANZO</div>
                                            <div className="flex flex-col items-center text-center mb-8">
                                                <span className={`text-6xl font-black tracking-tighter tabular-nums ${textColor}`}>{budgetData.pranzo.stimati}</span>
                                                <span className={`uppercase font-bold tracking-widest text-sm mt-2 ${mutedText}`}>Coperti Previsti</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-4 rounded-xl flex flex-col items-center">
                                                    <span className={`${mutedText} text-xs font-bold uppercase tracking-wider`}>Coperti Minimi</span>
                                                    <span className={`${textColor} text-2xl font-black mt-1`}>{budgetData.pranzo.min}</span>
                                                </div>
                                                <div className={`${accentBg} p-4 rounded-xl flex flex-col items-center`}>
                                                    <span className={`${accentColor} text-xs font-bold uppercase tracking-wider`}>Coperti Massimi</span>
                                                    <span className={`${accentColor} text-2xl font-black mt-1`}>{budgetData.pranzo.max}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`p-8 rounded-2xl border-2 ${isDinner ? 'border-[#334155] bg-[#1E293B]' : 'border-[#EAE5DA] bg-white shadow-sm'}`}>
                                            <div className={`flex items-center justify-center gap-2 text-xl font-black mb-6 ${accentColor}`}><Moon className="w-6 h-6" /> FABBISOGNO CENA</div>
                                            <div className="flex flex-col items-center text-center mb-8">
                                                <span className={`text-6xl font-black tracking-tighter tabular-nums ${textColor}`}>{budgetData.cena.stimati}</span>
                                                <span className={`uppercase font-bold tracking-widest text-sm mt-2 ${mutedText}`}>Coperti Previsti</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-4 rounded-xl flex flex-col items-center">
                                                    <span className={`${mutedText} text-xs font-bold uppercase tracking-wider`}>Coperti Minimi</span>
                                                    <span className={`${textColor} text-2xl font-black mt-1`}>{budgetData.cena.min}</span>
                                                </div>
                                                <div className={`${accentBg} p-4 rounded-xl flex flex-col items-center`}>
                                                    <span className={`${accentColor} text-xs font-bold uppercase tracking-wider`}>Coperti Massimi</span>
                                                    <span className={`${accentColor} text-2xl font-black mt-1`}>{budgetData.cena.max}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-center mt-6">
                                        <div className={`px-8 py-4 rounded-full border-2 flex items-center justify-center ${isDinner ? 'border-[#334155] bg-[#1E293B]' : 'border-[#EAE5DA] bg-gray-50'}`}>
                                            <span className={`text-sm uppercase font-bold tracking-widest mr-4 ${mutedText}`}>Impatto Globale Stimato:</span>
                                            <span className={`text-2xl font-black ${textColor}`}>{budgetData.totaleGlobale} Coperti totali</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    </SI>
                </div>

                {/* -- Accesso secondario: card stile Menu -- */}
                <SI i={idx(2, 3, navDir)} navKey={navKey} navDir={navDir}>
                {planTab !== 'inventario' && planTab !== 'ricette' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                    {/* Prenotazioni — disabilitata */}
                    <div className={`relative text-left p-6 rounded-2xl border transition-all duration-200 cursor-not-allowed opacity-50
                        ${isDinner ? 'bg-[#1E293B] border-[#334155]' : 'bg-[#FDFAF5] border-[#EAE5DA]'}`}>
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4
                            ${isDinner ? 'bg-[#967D62]/20 text-[#C4A882]' : 'bg-[#967D62]/10 text-[#967D62]'}`}>
                            <CalendarDays className="w-5 h-5" />
                        </div>
                        <h3 className={`font-bold text-base mb-1.5 ${textColor}`}>Prenotazioni</h3>
                        <p className={`text-sm leading-relaxed ${mutedText}`}>Gestisci le prenotazioni del ristorante per pranzo e cena.</p>
                        <span className={`inline-block mt-4 text-xs font-bold px-2.5 py-1 rounded-full ${isDinner ? 'bg-[#334155] text-[#94A3B8]' : 'bg-black/5 text-[#8C8A85]'}`}>
                            Coming Soon
                        </span>
                    </div>

                    {/* Gestione Sala — disabilitata */}
                    <div className={`relative text-left p-6 rounded-2xl border transition-all duration-200 cursor-not-allowed opacity-50
                        ${isDinner ? 'bg-[#1E293B] border-[#334155]' : 'bg-[#FDFAF5] border-[#EAE5DA]'}`}>
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4
                            ${isDinner ? 'bg-[#967D62]/20 text-[#C4A882]' : 'bg-[#967D62]/10 text-[#967D62]'}`}>
                            <LayoutGrid className="w-5 h-5" />
                        </div>
                        <h3 className={`font-bold text-base mb-1.5 ${textColor}`}>Gestione Sala</h3>
                        <p className={`text-sm leading-relaxed ${mutedText}`}>Mappa tavoli, stato coperti e coordinamento in tempo reale.</p>
                        <span className={`inline-block mt-4 text-xs font-bold px-2.5 py-1 rounded-full ${isDinner ? 'bg-[#334155] text-[#94A3B8]' : 'bg-black/5 text-[#8C8A85]'}`}>
                            Coming Soon
                        </span>
                    </div>

                    {/* Volumi e Budget — attiva */}
                    <button
                        onClick={() => setPlanTab('cucina')}
                        className={`group text-left p-6 rounded-2xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5
                            ${isDinner
                                ? 'bg-[#1E293B] border-[#334155] hover:border-[#967D62]'
                                : 'bg-[#FDFAF5] border-[#EAE5DA] hover:border-[#967D62] hover:bg-white'
                            }`}>
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-colors
                            ${isDinner ? 'bg-[#967D62]/20 text-[#C4A882] group-hover:bg-[#967D62]/30' : 'bg-[#967D62]/10 text-[#967D62] group-hover:bg-[#967D62]/20'}`}>
                            <Boxes className="w-5 h-5" />
                        </div>
                        <h3 className={`font-bold text-base mb-1.5 ${textColor}`}>Volumi e Budget</h3>
                        <p className={`text-sm leading-relaxed ${mutedText}`}>Calcola il fabbisogno ingredienti e il budget su un periodo personalizzabile.</p>
                        <div className={`flex items-center gap-1 mt-4 text-xs font-semibold ${isDinner ? 'text-[#C4A882]' : 'text-[#967D62]'}`}>
                            Apri <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                    </button>
                </div>
                )}
                </SI>
             </main>

      {/* ════════════════════════════════════════════════════════
          MODALE — REGISTRA CONSUMO EXTRA
      ════════════════════════════════════════════════════════ */}
      {showExtraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowExtraModal(false)}>
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          {/* Pannello */}
          <div
            className={`relative w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden ${isDinner ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#EAE5DA]'}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDinner ? 'border-[#334155]' : 'border-[#EAE5DA]'}`}>
              <div>
                <h2 className={`text-lg font-bold ${textColor}`}>Registra consumi interni</h2>
                <p className={`text-xs mt-0.5 ${mutedText}`}>Scarti, pasti personale, consumi operativi. Scala la giacenza automaticamente.</p>
              </div>
              <button onClick={() => setShowExtraModal(false)} className={`p-1.5 rounded-lg transition-colors ${isDinner ? 'hover:bg-[#334155] text-[#94A3B8]' : 'hover:bg-gray-100 text-[#8C8A85]'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">

              {/* Selezione ingrediente — dropdown styled */}
              <div>
                <Label className={`text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2 block`}>Ingrediente</Label>
                <div className="relative" ref={extraIngRef}>
                  <button
                    type="button"
                    onClick={() => { setExtraIngDropOpen(v => !v); setExtraIngSearch(''); }}
                    className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                      extraIngId
                        ? (isDinner ? 'border-[#967D62]/60 bg-[#967D62]/10 text-[#F4F1EA]' : 'border-[#967D62]/60 bg-[#967D62]/5 text-[#2C2A28]')
                        : (isDinner ? 'border-[#334155] text-[#94A3B8] hover:border-[#967D62]/40' : 'border-[#EAE5DA] text-[#8C8A85] hover:border-[#967D62]/40')
                    }`}
                  >
                    <span className="truncate">
                      {extraIngId
                        ? (() => { const ing = ingredients.find((i: any) => i.id === extraIngId); return ing ? `${ing.name} (${ing.currentQty}${ing.unit})` : '—'; })()
                        : '— Seleziona ingrediente —'}
                    </span>
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${extraIngDropOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {extraIngDropOpen && (
                    <div className={`absolute z-50 mt-1 w-full rounded-xl border shadow-xl overflow-hidden ${isDinner ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#EAE5DA]'}`}>
                      <div className="p-2">
                        <input
                          type="text"
                          value={extraIngSearch}
                          onChange={e => setExtraIngSearch(e.target.value)}
                          placeholder="Cerca ingrediente…"
                          autoFocus
                          className={`w-full px-3 py-2 rounded-lg border text-sm ${isDinner ? 'bg-[#0F172A] border-[#334155] text-[#F4F1EA] placeholder:text-[#475569]' : 'border-[#EAE5DA] placeholder:text-gray-400'}`}
                        />
                      </div>
                      <div className="max-h-52 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {[...ingredients]
                          .sort((a: any, b: any) => a.name.localeCompare(b.name))
                          .filter((ing: any) => ing.name.toLowerCase().includes(extraIngSearch.toLowerCase()))
                          .map((ing: any) => (
                            <button
                              key={ing.id}
                              type="button"
                              onClick={() => { setExtraIngId(ing.id); setExtraUnit(ing.unit); setExtraIngDropOpen(false); setExtraIngSearch(''); }}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                ing.id === extraIngId
                                  ? (isDinner ? 'bg-[#967D62]/20 text-[#F4F1EA]' : 'bg-[#967D62]/10 text-[#967D62]')
                                  : (isDinner ? 'text-[#F4F1EA] hover:bg-[#334155]/40' : 'text-[#2C2A28] hover:bg-[#F4F1EA]/60')
                              }`}
                            >
                              <span className="font-medium">{ing.name}</span>
                              <span className={`ml-2 text-xs ${mutedText}`}>giacenza: {ing.currentQty}{ing.unit}</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quantità + unità + data */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className={`text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2 block`}>Quantità</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={extraQty}
                      onChange={e => setExtraQty(e.target.value)}
                      placeholder="Es. 0.5"
                      className={`flex-1 ${isDinner ? 'border-[#334155] bg-[#0F172A]' : 'border-[#EAE5DA]'}`}
                    />
                    {extraIngId && (() => {
                      const ing = ingredients.find((i: any) => i.id === extraIngId);
                      const units = ing ? getCompatibleUnitsFor(ing.unit) : [];
                      return units.length > 1 ? (
                        <select
                          value={extraUnit || ing?.unit || ''}
                          onChange={e => setExtraUnit(e.target.value)}
                          className={`px-3 py-2 rounded-xl border text-sm font-semibold cursor-pointer ${isDinner ? 'bg-[#0F172A] border-[#334155] text-[#F4F1EA]' : 'bg-white border-[#EAE5DA] text-[#2C2A28]'}`}
                        >
                          {units.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      ) : (
                        <span className={`flex items-center px-3 text-sm font-semibold ${mutedText}`}>{ing?.unit}</span>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <Label className={`text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2 block`}>Data</Label>
                  <Input
                    type="date"
                    value={extraDate}
                    onChange={e => setExtraDate(e.target.value)}
                    className={`${isDinner ? 'border-[#334155] bg-[#0F172A] [color-scheme:dark]' : 'border-[#EAE5DA]'}`}
                  />
                </div>
              </div>

              {/* Categoria */}
              <div>
                <Label className={`text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2 block`}>Categoria</Label>
                <div className="grid grid-cols-2 gap-2">
                  {extraCategories.map(cat => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.key}
                        onClick={() => setExtraCategory(cat.key)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                          extraCategory === cat.key
                            ? 'bg-[#967D62] text-white border-[#967D62]'
                            : (isDinner ? 'border-[#334155] text-[#94A3B8] hover:border-[#967D62]/40' : 'border-[#EAE5DA] text-[#8C8A85] hover:border-[#967D62]/40')
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${extraCategory === cat.key ? 'text-white' : cat.color}`} />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nota */}
              <div>
                <Label className={`text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2 block`}>Nota (opzionale)</Label>
                <Input
                  value={extraNote}
                  onChange={e => setExtraNote(e.target.value)}
                  placeholder="Es. Contenitore caduto, pasto chef…"
                  className={`${isDinner ? 'border-[#334155] bg-[#0F172A]' : 'border-[#EAE5DA]'}`}
                />
              </div>

              {/* Import da file */}
              <div className={`pt-1 border-t ${isDinner ? 'border-[#334155]' : 'border-[#EAE5DA]'}`}>
                <p className={`text-xs font-semibold uppercase tracking-wider ${mutedText} mb-2`}>Oppure importa da file</p>
                {extraImportMsg && (
                  <div className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium mb-2 ${
                    extraImportMsg.type === 'ok'  ? (isDinner ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/40' : 'bg-emerald-50 text-emerald-700 border border-emerald-200') :
                    extraImportMsg.type === 'err' ? (isDinner ? 'bg-rose-950/30 text-rose-400 border border-rose-800/40' : 'bg-rose-50 text-rose-700 border border-rose-200') :
                    (isDinner ? 'bg-amber-950/30 text-amber-400 border border-amber-800/40' : 'bg-amber-50 text-amber-700 border border-amber-200')
                  }`}>
                    {extraImportMsg.type === 'ok' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                    {extraImportMsg.msg}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => { setExtraImportMsg(null); extraFileRef.current?.click(); }}
                  className={`flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-xl border border-dashed text-xs font-medium transition-colors ${isDinner ? 'border-[#334155] text-[#94A3B8] hover:bg-[#334155]/30' : 'border-[#D1C9BC] text-[#8C8A85] hover:bg-gray-50'}`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Importa CSV / TSV
                  <span className={`text-[10px] ${mutedText}`}>(nome, quantità, data, causa, nota)</span>
                </button>
                <input ref={extraFileRef} type="file" accept=".csv,.tsv,.txt" onChange={e => { handleExtraImport(e); }} className="hidden" />
                <p className={`text-[10px] mt-1 ${mutedText}`}>Il file viene salvato automaticamente — non serve premere Registra.</p>
              </div>

              {/* Feedback */}
              {extraMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-xs font-medium ${
                  extraMsg.type === 'ok'
                    ? (isDinner ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/40' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')
                    : (isDinner ? 'bg-rose-950/30 text-rose-400 border border-rose-800/40' : 'bg-rose-50 text-rose-700 border border-rose-200')
                }`}>
                  {extraMsg.type === 'ok' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                  {extraMsg.msg}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`flex gap-3 px-6 py-4 border-t ${isDinner ? 'border-[#334155]' : 'border-[#EAE5DA]'}`}>
              <Button onClick={() => setShowExtraModal(false)} variant="outline" className={`flex-1 ${isDinner ? 'border-[#334155] text-[#94A3B8]' : 'border-[#EAE5DA]'}`}>
                Chiudi
              </Button>
              <Button
                onClick={handleSaveExtra}
                disabled={!extraIngId || !extraQty || Number(extraQty) <= 0 || extraSaving}
                className="flex-1 bg-[#967D62] hover:bg-[#7A654E] text-white disabled:opacity-40"
              >
                {extraSaving ? 'Salvataggio…' : 'Registra'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          MODALE — VERIFICA QUANTITÀ
      ════════════════════════════════════════════════════════ */}
      {showVerifyModal && (() => {
        const analysis = verifyPhase === 'analysis' ? computeVerifyAnalysis() : [];
        const modifiedCount = Object.values(verifyValues).filter(v => v !== '').length;
        const divCls = isDinner ? 'border-[#334155]' : 'border-[#EAE5DA]';
        const selectedSnap = verifySnapshotId === '__auto__' ? verifySnapshots[0] : verifySnapshots.find(s => s.id === verifySnapshotId);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setShowVerifyModal(false); setVerifyPhase('input'); }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
              className={`relative w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden ${isDinner ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#EAE5DA]'}`}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`flex items-center justify-between px-6 py-4 border-b ${divCls}`}>
                <div>
                  <h2 className={`text-lg font-bold ${textColor}`}>Verifica Quantità</h2>
                  <p className={`text-xs mt-0.5 ${mutedText}`}>
                    {verifyPhase === 'input'
                      ? 'Inserisci le quantità reali trovate in magazzino. Lascia vuoto per non modificare.'
                      : `Analisi scostamenti — ${modifiedCount} ingredient${modifiedCount === 1 ? 'e' : 'i'} modificat${modifiedCount === 1 ? 'o' : 'i'}`}
                  </p>
                </div>
                <button onClick={() => { setShowVerifyModal(false); setVerifyPhase('input'); }} className={`p-1.5 rounded-lg transition-colors ${isDinner ? 'hover:bg-[#334155] text-[#94A3B8]' : 'hover:bg-gray-100 text-[#8C8A85]'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {verifyPhase === 'input' ? (
                <>
                  {/* Selezione periodo + soglia */}
                  <div className={`px-6 pt-4 pb-3 border-b ${divCls} space-y-3`}>
                    {/* Periodo */}
                    {verifySnapshots.length > 0 && (
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`text-xs font-semibold uppercase tracking-wider shrink-0 ${mutedText}`}>Periodo di confronto</span>
                        <div className="relative flex-1 min-w-[200px]" ref={verifySnapRef}>
                          <button
                            onClick={() => setVerifySnapDropOpen(v => !v)}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
                              isDinner ? 'border-[#334155] text-[#F4F1EA] hover:border-[#967D62]/40' : 'border-[#EAE5DA] text-[#2C2A28] hover:border-[#967D62]/40'
                            }`}
                          >
                            <span className="truncate">
                              {verifySnapshotId === '__auto__'
                                ? `Automatico${selectedSnap ? ` (${selectedSnap.label})` : ' — nessuno disponibile'}`
                                : selectedSnap ? selectedSnap.label : '—'}
                            </span>
                            <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${verifySnapDropOpen ? 'rotate-180' : ''}`} />
                          </button>
                          {verifySnapDropOpen && (
                            <div className={`absolute z-50 mt-1 w-full rounded-xl border shadow-xl overflow-hidden ${isDinner ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#EAE5DA]'}`}>
                              <button onClick={() => { setVerifySnapshotId('__auto__'); setVerifySnapDropOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-xs transition-colors ${verifySnapshotId === '__auto__' ? (isDinner ? 'bg-[#967D62]/20 text-[#F4F1EA]' : 'bg-[#967D62]/10 text-[#967D62]') : (isDinner ? 'text-[#F4F1EA] hover:bg-[#334155]/40' : 'text-[#2C2A28] hover:bg-[#F4F1EA]/60')}`}>
                                <span className="font-semibold">Automatico</span>
                                <span className={`ml-2 ${mutedText}`}>usa il più recente disponibile</span>
                              </button>
                              {verifySnapshots.map(s => (
                                <button key={s.id} onClick={() => { setVerifySnapshotId(s.id); setVerifySnapDropOpen(false); }}
                                  className={`w-full text-left px-4 py-2.5 text-xs transition-colors ${s.id === verifySnapshotId ? (isDinner ? 'bg-[#967D62]/20 text-[#F4F1EA]' : 'bg-[#967D62]/10 text-[#967D62]') : (isDinner ? 'text-[#F4F1EA] hover:bg-[#334155]/40' : 'text-[#2C2A28] hover:bg-[#F4F1EA]/60')}`}>
                                  <span className="font-semibold">{s.label}</span>
                                  <span className={`ml-2 ${mutedText}`}>{s.period_start} → {s.period_end}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {/* Soglia */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-semibold uppercase tracking-wider shrink-0 ${mutedText}`}>Soglia normalità</span>
                        <input type="range" min={1} max={20} step={1} value={verifyThreshold}
                          onChange={e => setVerifyThreshold(Number(e.target.value))}
                          className={`flex-1 h-1 rounded-full appearance-none cursor-pointer accent-[#967D62] ${isDinner ? '[&::-webkit-slider-runnable-track]:bg-[#475569]' : '[&::-webkit-slider-runnable-track]:bg-[#B8B2A8]'} [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-[#967D62]`}
                        />
                        <span className={`text-xs font-bold w-8 shrink-0 text-right ${textColor}`}>{verifyThreshold}%</span>
                      </div>
                      <p className={`text-xs ${mutedText}`}>Scostamenti sotto questa soglia sono considerati normali</p>
                    </div>
                  </div>

                  {/* Lista ingredienti */}
                  <div className={`px-6 py-3 space-y-2 max-h-[50vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}>
                    {ingredients.map((ing: any) => (
                      <div key={ing.id} className="flex items-center gap-3">
                        <span className={`flex-1 text-sm ${textColor}`}>{ing.name}</span>
                        <span className={`text-xs ${mutedText} w-24 text-right`}>{Math.round(ing.currentQty * 100) / 100}{ing.unit}</span>
                        <Input
                          type="number"
                          placeholder="Reale"
                          value={verifyValues[ing.id] || ''}
                          onChange={e => setVerifyValues((prev: any) => ({ ...prev, [ing.id]: e.target.value }))}
                          className={`w-24 text-right ${isDinner ? 'border-[#334155] bg-[#0F172A]' : 'border-[#EAE5DA]'}`}
                        />
                        <span className={`text-xs w-6 ${mutedText}`}>{ing.unit}</span>
                      </div>
                    ))}
                  </div>

                  {/* Footer fase 1 */}
                  <div className={`flex gap-3 px-6 py-4 border-t ${divCls}`}>
                    <Button onClick={() => { setShowVerifyModal(false); setVerifyPhase('input'); setVerifyValues({}); }} variant="outline" className={`flex-1 ${isDinner ? 'border-[#334155] text-[#94A3B8]' : 'border-[#EAE5DA]'}`}>
                      Annulla
                    </Button>
                    <Button
                      disabled={modifiedCount === 0}
                      onClick={() => setVerifyPhase('analysis')}
                      variant="outline"
                      className={`flex-1 disabled:opacity-40 ${isDinner ? 'border-[#334155] text-[#F4F1EA]' : 'border-[#EAE5DA]'}`}
                    >
                      Analisi scostamenti ({modifiedCount})
                    </Button>
                    <Button
                      disabled={modifiedCount === 0}
                      onClick={() => {
                        setIngredients((prev: any) => prev.map((ing: any) => {
                          const real = verifyValues[ing.id];
                          if (real === undefined || real === '') return ing;
                          return { ...ing, currentQty: Number(real) };
                        }));
                        setShowVerifyModal(false);
                        setVerifyPhase('input');
                        setVerifyValues({});
                      }}
                      className="flex-1 bg-[#967D62] hover:bg-[#7A654E] text-white disabled:opacity-40"
                    >
                      Salva Verifica
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Fase 2: analisi scostamenti */}
                  <div className={`px-6 py-4 space-y-4 max-h-[65vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}>
                    {/* Badge periodo usato */}
                    {selectedSnap && (
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                        verifySnapshotId === '__auto__'
                          ? (isDinner ? 'bg-amber-950/20 border border-amber-800/30 text-amber-400' : 'bg-amber-50 border border-amber-100 text-amber-700')
                          : (isDinner ? 'bg-[#967D62]/10 border border-[#967D62]/20 text-[#C4A882]' : 'bg-[#967D62]/5 border border-[#967D62]/20 text-[#7A4F3A]')
                      }`}>
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {verifySnapshotId === '__auto__'
                          ? `Stima basata sul periodo più recente disponibile: "${selectedSnap.label}". Le frequenze potrebbero non corrispondere al periodo attuale.`
                          : `Analisi basata sul periodo: "${selectedSnap.label}"`}
                      </div>
                    )}
                    {!selectedSnap && (
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${isDinner ? 'bg-[#334155]/40 text-[#94A3B8]' : 'bg-gray-50 text-[#8C8A85]'}`}>
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        Nessun periodo salvato disponibile — mostro solo lo scostamento grezzo senza analisi per piatto.
                      </div>
                    )}

                    {analysis.map((item: any) => {
                      const isNeg = item.diff < 0;
                      const isSignif = item.isSignificant;
                      const diffColor = !isSignif ? mutedText : isNeg
                        ? (isDinner ? 'text-rose-400' : 'text-rose-600')
                        : (isDinner ? 'text-emerald-400' : 'text-emerald-600');

                      return (
                        <div key={item.ingId} className={`p-4 rounded-xl border space-y-3 ${
                          isSignif
                            ? (isNeg ? (isDinner ? 'border-rose-800/40 bg-rose-950/10' : 'border-rose-100 bg-rose-50/50') : (isDinner ? 'border-emerald-800/40 bg-emerald-950/10' : 'border-emerald-100 bg-emerald-50/50'))
                            : (isDinner ? 'border-[#334155] bg-[#0F172A]/40' : 'border-[#EAE5DA] bg-gray-50/50')
                        }`}>
                          {/* Riga principale */}
                          <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div>
                              <span className={`font-semibold text-sm ${textColor}`}>{item.ingName}</span>
                              {!isSignif && <span className={`ml-2 text-xs ${mutedText}`}>nella norma (±{verifyThreshold}%)</span>}
                            </div>
                            <div className="flex items-center gap-4 text-right shrink-0">
                              <div>
                                <p className={`text-[10px] ${mutedText}`}>Teorico</p>
                                <p className={`text-sm font-bold ${textColor}`}>{formatQtyAuto(item.theoretical, item.unit).replace(/^[+-]/, '')}</p>
                              </div>
                              <div>
                                <p className={`text-[10px] ${mutedText}`}>Reale</p>
                                <p className={`text-sm font-bold ${textColor}`}>{formatQtyAuto(item.real, item.unit).replace(/^[+-]/, '')}</p>
                              </div>
                              <div>
                                <p className={`text-[10px] ${mutedText}`}>Diff.</p>
                                <p className={`text-sm font-bold ${diffColor}`}>{formatQtyAuto(item.diff, item.unit)} ({item.diffPct.toFixed(1)}%)</p>
                              </div>
                            </div>
                          </div>

                          {/* Breakdown per piatto */}
                          {isSignif && item.dishes.length > 0 && (
                            <div className={`pt-2 border-t ${isDinner ? 'border-[#334155]/60' : 'border-black/5'} space-y-1`}>
                              <p className={`text-[10px] font-semibold uppercase tracking-wider ${mutedText} mb-1.5`}>Distribuzione scostamento per piatto</p>
                              {item.dishes.slice(0, 5).map((d: any) => (
                                <div key={d.dish} className="flex items-center justify-between gap-3">
                                  <span className={`text-xs truncate flex-1 ${textColor}`}>{d.dish}</span>
                                  <span className={`text-xs ${mutedText} shrink-0`}>{formatQtyAuto(d.qtyPerPortion, d.unit).replace(/^[+-]/,'')}/p × {d.frequency} ord.</span>
                                  <span className={`text-xs font-semibold shrink-0 ${diffColor}`}>
                                    {(['pz','conf'].includes(d.unit))
                                      ? formatPieceDelta(d.avgDeltaPerPortion, d.unit, d.frequency)
                                      : formatQtyAuto(d.avgDeltaPerPortion, d.unit) + '/p'}
                                  </span>
                                </div>
                              ))}
                              {item.dishes.length > 5 && <p className={`text-[10px] ${mutedText}`}>+ altri {item.dishes.length - 5} piatti</p>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer fase 2 */}
                  <div className={`flex gap-3 px-6 py-4 border-t ${divCls}`}>
                    <Button onClick={() => setVerifyPhase('input')} variant="outline" className={`flex-1 ${isDinner ? 'border-[#334155] text-[#94A3B8]' : 'border-[#EAE5DA]'}`}>
                      ← Modifica valori
                    </Button>
                    <Button
                      onClick={() => {
                        setIngredients((prev: any) => prev.map((ing: any) => {
                          const real = verifyValues[ing.id];
                          if (real === undefined || real === '') return ing;
                          return { ...ing, currentQty: Number(real) };
                        }));
                        setShowVerifyModal(false);
                        setVerifyPhase('input');
                        setVerifyValues({});
                      }}
                      className="flex-1 bg-[#967D62] hover:bg-[#7A654E] text-white"
                    >
                      Salva Verifica
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}
    </>
  );
}
