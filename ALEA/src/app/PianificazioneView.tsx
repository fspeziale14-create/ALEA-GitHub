import React from 'react';
import { AttendibilitaResult } from './engine';
import {
  Users, CalendarRange, Boxes, ClipboardList, CookingPot,
  Plus, X, Check, Pencil, BookOpen, ChevronDown, ChevronUp,
  Loader2, CalendarDays, LayoutGrid, CheckCircle2,
  ChefHat, Moon, Settings2, Sun, TrendingUp
} from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { Separator } from './components/ui/separator';
import { weekDaysOrdered, mapDays, MENU_CATEGORIES } from './constants';

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
}

export function PianificazioneView(props: PianificazioneViewProps) {
  const p = props;
  const {
    isDinner, textColor, mutedText, cardBg, accentColor, accentBg,
    planTab, setPlanTab, setActiveView,
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

  // MCM tra due interi
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
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

  return (
             <main className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full">
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                        <div>
                            <h1 className={`text-3xl font-bold tracking-tight ${textColor}`}>Pianificazione Strategica</h1>
                            <p className={`${mutedText} mt-1`}>Genera le previsioni AI basate su 14 mesi di storico puro e meteo.</p>
                        </div>
                        
                        {planTab === 'sala' ? (
                            <Button onClick={generateStaffPlan} disabled={isGeneratingStaff} className={`px-6 py-6 text-base font-semibold shadow-md disabled:opacity-70 bg-[#967D62] hover:bg-[#7A654E] ${isDinner ? 'text-[#F4F1EA]' : 'text-white'}`}>
                                {isGeneratingStaff ? (<Loader2 className="w-5 h-5 mr-2 animate-spin" />) : (<CalendarRange className="w-5 h-5 mr-2" />)}
                                Genera Turni Settimana
                            </Button>
                        ) : planTab === 'cucina' ? (
                            <Button onClick={generateBudgetPlan} disabled={isGeneratingBudget} className={`px-6 py-6 text-base font-semibold shadow-md disabled:opacity-70 bg-[#967D62] hover:bg-[#7A654E] ${isDinner ? 'text-[#F4F1EA]' : 'text-white'}`}>
                                {isGeneratingBudget ? (<Loader2 className="w-5 h-5 mr-2 animate-spin" />) : (<Boxes className="w-5 h-5 mr-2" />)}
                                Calcola Fabbisogno Periodo
                            </Button>
                        ) : null}

                    </div>

                    <div className={`flex flex-wrap gap-1 p-1 rounded-lg border w-fit mb-6 ${isDinner ? 'bg-[#0F172A] border-[#334155]' : 'bg-black/5 border-[#EAE5DA]'}`}>
                        {[
                            { key: 'sala',         label: 'Convocazioni Sala',  icon: Users },
                            { key: 'inventario',   label: 'Magazzino',           icon: ClipboardList },
                            { key: 'ricette',      label: 'Ricette',             icon: BookOpen },
                            { key: 'cucina',       label: 'Volumi e Budget',     icon: Boxes },
                        ].map(({ key, label, icon: Icon }) => (
                            <button key={key} onClick={() => setPlanTab(key as any)} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${planTab === key ? (isDinner ? 'bg-[#334155] text-[#F4F1EA] shadow-sm border border-[#475569]' : 'bg-white text-[#967D62] shadow-sm') : (isDinner ? 'text-[#94A3B8] hover:text-[#F4F1EA]' : 'text-[#8C8A85] hover:text-[#2C2A28]')}`}>
                                <Icon className="w-4 h-4" /> {label}
                            </button>
                        ))}
                    </div>

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
                                                        <select value={newIngUnit} onChange={e => setNewIngUnit(e.target.value)} className={`w-20 rounded-md border text-sm px-2 ${isDinner ? 'border-[#334155] bg-[#1E293B] text-[#F4F1EA]' : 'border-[#EAE5DA] bg-white text-[#2C2A28]'}`}>
                                                            {['g', 'kg', 'ml', 'l', 'cl', 'pz', 'conf'].map(u => <option key={u} value={u}>{u}</option>)}
                                                        </select>
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
                                                            <select value={newIngSelectedSupplier} onChange={e => setNewIngSelectedSupplier(e.target.value)} className={`w-full rounded-md border text-sm px-2 h-9 ${isDinner ? 'border-[#334155] bg-[#1E293B] text-[#F4F1EA]' : 'border-[#EAE5DA] bg-white text-[#2C2A28]'}`}>
                                                                <option value="">Seleziona fornitore</option>
                                                                {existingSuppliers.map(s => <option key={s.name} value={s.name}>{s.name} ({s.qtyPerBox}{s.unit || newIngUnit}/scatolone)</option>)}
                                                            </select>
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
                                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                                {/* Ingredienti acquistati */}
                                                {ingredients.map(ing => {
                                                    const pct = ing.idealQty > 0 ? (ing.currentQty / ing.idealQty) * 100 : 100;
                                                    const color = pct > 50 ? 'bg-emerald-500' : pct > 20 ? 'bg-amber-500' : 'bg-red-500';
                                                    return (
                                                        <div key={ing.id} className={`p-3 rounded-lg border ${isDinner ? 'bg-[#0F172A] border-[#334155]' : 'bg-gray-50 border-[#EAE5DA]'}`}>
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className={`font-semibold text-sm ${textColor}`}>{ing.name}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`text-sm font-mono ${pct < 20 ? 'text-red-500' : pct < 50 ? 'text-amber-500' : 'text-emerald-500'}`}>{floor2(ing.currentQty)}{ing.unit} / {floor2(ing.idealQty)}{ing.unit}</span>
                                                                    <button onClick={() => setIngredients(prev => prev.filter(i => i.id !== ing.id))} className="text-red-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                                                                </div>
                                                            </div>
                                                            <div className={`w-full h-1.5 rounded-full ${isDinner ? 'bg-[#334155]' : 'bg-gray-200'}`}>
                                                                <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
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

                                        {/* Verifica Quantità */}
                                        {ingredients.length > 0 && (
                                            <div className="pt-2">
                                                <Button onClick={() => { setShowVerifyForm(v => !v); setVerifyValues({}); }} variant="outline" className={`w-full ${isDinner ? 'border-[#334155] text-[#F4F1EA] hover:bg-[#334155]' : 'border-[#EAE5DA] hover:bg-gray-50'}`}>
                                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Verifica Quantità
                                                </Button>
                                                {showVerifyForm && (
                                                    <div className={`mt-3 p-4 rounded-xl border space-y-3 ${isDinner ? 'bg-[#0F172A] border-[#334155]' : 'bg-gray-50 border-[#EAE5DA]'}`}>
                                                        <h4 className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>Inserisci le quantità reali trovate</h4>
                                                        {ingredients.map(ing => (
                                                            <div key={ing.id} className="flex items-center gap-3">
                                                                <span className={`flex-1 text-sm ${textColor}`}>{ing.name}</span>
                                                                <Input type="number" placeholder={`${ing.currentQty}`} value={verifyValues[ing.id] || ''} onChange={e => setVerifyValues(prev => ({ ...prev, [ing.id]: e.target.value }))} className={`w-28 text-right ${isDinner ? 'border-[#334155] bg-[#1E293B]' : 'border-[#EAE5DA]'}`} />
                                                                <span className={`text-xs w-6 ${mutedText}`}>{ing.unit}</span>
                                                            </div>
                                                        ))}
                                                        <Button onClick={() => {
                                                            setIngredients(prev => prev.map(ing => {
                                                                const real = verifyValues[ing.id];
                                                                if (real === undefined || real === '') return ing;
                                                                return { ...ing, currentQty: Number(real) };
                                                            }));
                                                            setShowVerifyForm(false);
                                                            setVerifyValues({});
                                                        }} className="w-full bg-[#967D62] hover:bg-[#7A654E] text-white">
                                                            Salva Verifica
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Carica modulo dati */}
                                        <div className="pt-3 mt-1 border-t border-black/5 dark:border-white/5">
                                            {importFeedback && (
                                                <div className={`mb-2 px-3 py-2 rounded-lg text-xs font-medium ${
                                                    importFeedback.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400' :
                                                    importFeedback.type === 'error'   ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400' :
                                                    'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                                                }`}>{importFeedback.msg}</div>
                                            )}
                                            <label className={`flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg border border-dashed cursor-pointer text-xs font-medium transition-colors ${isDinner ? 'border-[#334155] text-[#94A3B8] hover:bg-[#334155]/30' : 'border-[#D1C9BC] text-[#8C8A85] hover:bg-gray-50'}`}>
                                                <Boxes className="w-3.5 h-3.5" />
                                                Carica modulo dati
                                                <span className={`text-[10px] ${mutedText}`}>(CSV, XLSX, XLS, TSV)</span>
                                                <input type="file" accept=".csv,.xlsx,.xls,.tsv,.txt" onChange={handleInventoryImport} className="hidden" />
                                            </label>
                                            <p className={`text-[10px] mt-1.5 text-center ${mutedText}`}>
                                                Il file deve avere colonne: <span className="font-mono">nome</span>, <span className="font-mono">quantità</span> (e opzionale <span className="font-mono">unità</span>).
                                            </p>
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
                                                <select value={newPrepYieldUnit} onChange={e => setNewPrepYieldUnit(e.target.value)} className={`w-20 rounded-md border text-sm px-2 h-9 ${isDinner ? 'border-[#334155] bg-[#1E293B] text-[#F4F1EA]' : 'border-[#EAE5DA] bg-white text-[#2C2A28]'}`}>
                                                    {['g', 'kg', 'ml', 'l', 'cl', 'pz', 'conf'].map(u => <option key={u} value={u}>{u}</option>)}
                                                </select>
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
                                            <div className="space-y-3 max-h-[500px] overflow-y-auto">
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
                                                                                    <select value={currentUnit} onChange={e => setPrepIngQty(`${qtyPart || ''}|${e.target.value}`)} className={`w-14 rounded-md border text-xs px-1 h-8 ${isDinner ? 'border-[#334155] bg-[#1E293B] text-[#F4F1EA]' : 'border-[#EAE5DA] bg-white text-[#2C2A28]'}`}>
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
                                    </CardContent>
                                </Card>

                            </div>
                        </div>
                    )}

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
                                                        <button onClick={() => setEditingRecipeDish(isEditing ? null : dish)} className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors ${isEditing ? (isDinner ? 'bg-[#334155] text-[#F4F1EA]' : 'bg-gray-100 text-[#2C2A28]') : (isDinner ? 'bg-[#1E293B] text-[#94A3B8] hover:bg-[#334155]' : 'bg-white text-[#8C8A85] hover:bg-gray-50')}`}>
                                                            <span>{dish}</span>
                                                            <span className="flex items-center gap-2">
                                                                {dishRecipe.length > 0 && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDinner ? 'bg-[#967D62]/20 text-[#967D62]' : 'bg-[#967D62]/10 text-[#967D62]'}`}>{dishRecipe.length} ing.</span>}
                                                                {isEditing ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                            </span>
                                                        </button>
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
                                                                                        <select value={editingRecipePcsYield || baseUnit} onChange={e => setEditingRecipePcsYield(e.target.value)} className={`w-14 rounded-md border text-xs px-1 h-8 ${isDinner ? 'border-[#334155] bg-[#1E293B] text-[#F4F1EA]' : 'border-[#EAE5DA] bg-white text-[#2C2A28]'}`}>
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
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {planTab === 'sala' && (
                        <>
                            {!weekGenerated ? (
                                <div className={`mt-8 text-center p-12 border-2 border-dashed rounded-2xl ${isDinner ? 'border-[#334155] bg-[#0F172A]' : 'border-[#EAE5DA] bg-gray-50'}`}>
                                    <Users className={`w-16 h-16 mx-auto mb-4 opacity-50 ${mutedText}`} />
                                    <h3 className={`text-lg font-bold ${textColor}`}>Nessuna settimana generata</h3>
                                    <p className={`${mutedText} mt-2`}>Premi il pulsante per generare la programmazione da Lunedì a Domenica.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className={`p-4 rounded-xl border ${accentBg} flex items-center justify-center`}>
                                        <span className={`font-bold ${accentColor} uppercase tracking-wider`}>Programmazione dal {staffDateRange.start} al {staffDateRange.end}</span>
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
                                    </CardContent>
                                )}
                            </Card>

                            {!budgetGenerated ? (
                                <div className={`mt-8 text-center p-12 border-2 border-dashed rounded-2xl ${isDinner ? 'border-[#334155] bg-[#0F172A]' : 'border-[#EAE5DA] bg-gray-50'}`}>
                                    <Boxes className={`w-16 h-16 mx-auto mb-4 opacity-50 ${mutedText}`} />
                                    <h3 className={`text-lg font-bold ${textColor}`}>Nessun budget calcolato</h3>
                                    <p className={`${mutedText} mt-2`}>Usa l'ingranaggio per scegliere le date, poi premi Calcola Fabbisogno.</p>
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
                </div>

                {/* ── Accesso secondario: Prenotazioni e Gestione Sala ── */}
                {planTab !== 'inventario' && planTab !== 'ricette' && (
                <div className={`flex items-center gap-3 pt-4 pb-2 px-1 border-t ${isDinner ? 'border-[#334155]' : 'border-[#EAE5DA]'}`}>
                    <button
                        onClick={() => setActiveView('Prenotazioni')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors whitespace-nowrap ${isDinner ? 'border-[#334155] text-[#94A3B8] hover:bg-[#334155] hover:text-[#F4F1EA]' : 'border-[#C4B9A8] text-[#967D62] hover:bg-[#EAE5DA] hover:text-[#2C2A28]'}`}
                    >
                        <CalendarDays className="w-4 h-4 shrink-0" />
                        <span>Prenotazioni</span>
                    </button>
                    <button
                        onClick={() => setActiveView('Gestione Sala')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors whitespace-nowrap ${isDinner ? 'border-[#334155] text-[#94A3B8] hover:bg-[#334155] hover:text-[#F4F1EA]' : 'border-[#C4B9A8] text-[#967D62] hover:bg-[#EAE5DA] hover:text-[#2C2A28]'}`}
                    >
                        <LayoutGrid className="w-4 h-4 shrink-0" />
                        <span>Gestione Sala</span>
                    </button>
                </div>
                )}
             </main>
  );
}
