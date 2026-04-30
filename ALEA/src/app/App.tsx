import { prevediGiorno, prevediSettimana, calcolaAttendibilita, AttendibilitaResult, isShiftFinished, getMeteoItaliano, ST_STOR_STATS, getFestivitaAvviso } from './engine';
import { convocazione, convocazioneSettimanale, convocazioneCuochi, convocazioneCuochiSettimanale } from './engine';
import { MENU_CATEGORIES, MENU_PRICES, BEVERAGE_COURSES, weekDaysOrdered, mapDays } from './constants';
import { useState, useEffect } from 'react';
import React from 'react';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { Activity, Cloud, CloudRain, Users, TrendingUp, Sun, Moon, CalendarCheck, CheckCircle2, ClipboardCheck, UsersRound, Zap, CalendarDays, Clock, ChefHat, ConciergeBell, Plus, Trash2, AlertTriangle, PiggyBank, CalendarRange, Pencil, LayoutGrid, ArrowRightCircle, Utensils, Boxes, Loader2, Settings2, BookOpen, X, Check, XCircle, ChevronRight, Edit3, ChevronDown, ChevronUp, UserCog, CookingPot, ClipboardList, ArrowLeft, Star, History, BarChart2, Target, TrendingDown, ArrowUp, ArrowDown, Minus, Flame } from 'lucide-react';

import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { SidebarProvider, SidebarInset, SidebarTrigger } from './components/ui/sidebar';
import { DashboardSidebar } from './components/dashboard-sidebar';
import { MenuProfitability } from './components/menu-profitability';
import { StoricoView } from './components/storico-view';
import { SimulazioneView } from './components/simulazione-view';
import { ConsumiView } from './components/consumi-view';
import { DashboardView } from './DashboardView';
import { PianificazioneView } from './PianificazioneView';
import { ImpostazioniView } from './ImpostazioniView';
import { Separator } from './components/ui/separator';
import { AnimatePresence, motion } from 'motion/react';

// ── ANIMAZIONI STAGGER ───────────────────────────────────────
const pageStaggerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const staggerItemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } },
};
function PageStagger({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={pageStaggerVariants}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}
function SI({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  );
}

// ── SUPABASE ──────────────────────────────────────────────────
const supabase = createClient(
  'https://gcovbdxuvajsrovjvoex.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdjb3ZiZHh1dmFqc3Jvdmp2b2V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NTg2MDYsImV4cCI6MjA5MDAzNDYwNn0.-iBWJBiZy_smMH7-HAwOsUrYqZ5ShXkkggQNORGcFQ8'
);



// ========== TIPI E INTERFACCE ==========
type ShiftType = 'pranzo' | 'cena';
type AppRole = 'gestionale' | 'personale' | 'cucina' | null;

interface WeatherData { temp: number; precipitation_mm: number; condition: 'sunny' | 'rainy' | 'cloudy'; }

interface Reservation {
  id: string; date: string; shift: ShiftType; name: string; pax: number; time: string;
  phone?: string; isOutOfBounds?: boolean; isSeated?: boolean; tableId?: number;   
}

type TableStatus = 'free' | 'seated' | 'waiting' | 'served' | 'dirty';

interface OrderItem { name: string; note: string; category: string; course: string; }

interface Table {
  id: number;
  label: string;
  capacity: number;
  status: TableStatus;
  reservationName?: string;
  pax?: number;
  orderMode?: 'together' | 'courses';
  currentCourse?: number;
  totalCourses?: number;
  orders?: OrderItem[];
}


// ========== APP PRINCIPALE ==========
function App() {


  // ── CONVERSIONE UDM ─────────────────────────────────────────
  const convertToUnit = (value: number, fromUnit: string, toUnit: string): number | null => {
    if (fromUnit === toUnit) return value;
    const liquidGroup = ['ml', 'l', 'cl'];
    const weightGroup = ['g', 'kg'];
    const inLiquid = liquidGroup.includes(fromUnit) && liquidGroup.includes(toUnit);
    const inWeight = weightGroup.includes(fromUnit) && weightGroup.includes(toUnit);
    if (!inLiquid && !inWeight) return null; // incompatibili
    // Converti tutto in unità base (g o ml), poi verso target
    const toBase: Record<string, number> = { g: 1, kg: 1000, ml: 1, l: 1000, cl: 10 };
    const baseValue = value * toBase[fromUnit];
    return baseValue / toBase[toUnit];
  };
  const isPieceUnit = (u: string) => u === 'pz' || u === 'conf';
  const isMeasuredUnit = (u: string) => ['g', 'kg', 'ml', 'l', 'cl'].includes(u);

  // ====== AUTH & RUOLO ======
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [appRole, setAppRole] = useState<AppRole>(() => {
      try { return (localStorage.getItem('alea_role') as AppRole) || null; } catch { return null; }
  });
  const [userEmail, setUserEmail] = useState<string>('');

  // Controlla sessione Supabase all'avvio
  useEffect(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) { setIsLoggedIn(true); setUserEmail(session.user?.email ?? ''); }
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setIsLoggedIn(!!session);
          setUserEmail(session?.user?.email ?? '');
          if (!session) { setAppRole(null); try { localStorage.removeItem('alea_role'); } catch {} }
      });
      return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
      if (!loginEmail || !loginPassword) { setLoginError('Inserisci email e password.'); return; }
      setLoginLoading(true); setLoginError('');
      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
      setLoginLoading(false);
      if (error) setLoginError('Credenziali non valide. Riprova.');
  };

  const handleRegister = async () => {
      if (!loginEmail || !loginPassword) { setLoginError('Inserisci email e password.'); return; }
      if (loginPassword.length < 6) { setLoginError('La password deve essere di almeno 6 caratteri.'); return; }
      setLoginLoading(true); setLoginError('');
      const { error } = await supabase.auth.signUp({ email: loginEmail, password: loginPassword });
      setLoginLoading(false);
      if (error) {
          setLoginError(error.message === 'User already registered' ? 'Email già registrata. Prova ad accedere.' : 'Errore durante la registrazione. Riprova.');
      } else {
          setRegisterSuccess(true);
      }
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      setAppRole(null);
      try { localStorage.removeItem('alea_role'); } catch {}
  };

  // ====== NAVIGAZIONE ======
  const [activeView, setActiveView] = useState<string>("Dashboard");
  const [menuSubView, setMenuSubView] = useState<'landing' | 'inventario' | 'ricette' | 'redditività' | 'storico' | 'simulazione' | 'consumi'>('landing');

  // ── ANIMAZIONI NAVIGAZIONE ───────────────────────────────────
  const VIEW_ORDER = ["Dashboard", "Pianificazione", "Menu", "Recensioni", "Impostazioni"];
  const MENU_SUB_ORDER = ['landing', 'inventario', 'ricette', 'consumi', 'redditività', 'storico', 'simulazione'];

  const [navDirection, setNavDirection] = useState<1 | -1>(1);
  const [menuNavDirection, setMenuNavDirection] = useState<1 | -1>(1);

  const handleViewChange = (view: string) => {
    const prevIdx = VIEW_ORDER.indexOf(activeView);
    const nextIdx = VIEW_ORDER.indexOf(view);
    setNavDirection(nextIdx >= prevIdx ? 1 : -1);
    setActiveView(view);
    if (view !== "Menu") setMenuSubView('landing');
  };

  const handleMenuSubViewChange = (sub: typeof menuSubView) => {
    const prevIdx = MENU_SUB_ORDER.indexOf(menuSubView);
    const nextIdx = MENU_SUB_ORDER.indexOf(sub);
    setMenuNavDirection(nextIdx >= prevIdx ? 1 : -1);
    setMenuSubView(sub);
  };
  const [shift, setShift] = useState<ShiftType>('pranzo');
  const [bookedGuests, setBookedGuests] = useState<string>('');
  
  const todayStr = new Date().toLocaleDateString('en-CA'); 
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  
  // ====== PREVISIONE ======
  const [actualCovers, setActualCovers] = useState<string>('');
  const [finalBooked, setFinalBooked] = useState<string>(''); 
  const [predictedCovers, setPredictedCovers] = useState<number>(0);
  const [previsioneGiorno, setPrevisioneGiorno] = useState<any>(null);
  const [weather, setWeather] = useState<WeatherData>({ temp: 22, precipitation_mm: 0, condition: 'sunny' });
  
  // ====== IMPOSTAZIONI ======
  const [waiterRatio, setWaiterRatio] = useState<number>(() => {
      try { const s = localStorage.getItem('alea_settings'); return s ? JSON.parse(s).waiterRatio ?? 20 : 20; } catch { return 20; }
  });
  const [cookRatio, setCookRatio] = useState<number>(() => {
      try { const s = localStorage.getItem('alea_settings'); return s ? JSON.parse(s).cookRatio ?? 40 : 40; } catch { return 40; }
  });
  const [maxCapacity, setMaxCapacity] = useState<number>(() => {
      try { const s = localStorage.getItem('alea_settings'); return s ? JSON.parse(s).maxCapacity ?? 150 : 150; } catch { return 150; }
  });
  const [pranzoStart, setPranzoStart] = useState<string>(() => {
      try { const s = localStorage.getItem('alea_settings'); return s ? JSON.parse(s).pranzoStart ?? '12:00' : '12:00'; } catch { return '12:00'; }
  });
  const [pranzoEnd, setPranzoEnd] = useState<string>(() => {
      try { const s = localStorage.getItem('alea_settings'); return s ? JSON.parse(s).pranzoEnd ?? '15:30' : '15:30'; } catch { return '15:30'; }
  });
  const [cenaStart, setCenaStart] = useState<string>(() => {
      try { const s = localStorage.getItem('alea_settings'); return s ? JSON.parse(s).cenaStart ?? '19:00' : '19:00'; } catch { return '19:00'; }
  });
  const [cenaEnd, setCenaEnd] = useState<string>(() => {
      try { const s = localStorage.getItem('alea_settings'); return s ? JSON.parse(s).cenaEnd ?? '23:30' : '23:30'; } catch { return '23:30'; }
  });
  const [showDailyHours, setShowDailyHours] = useState(false);
  const [dailyHours, setDailyHours] = useState(() => {
      try {
          const s = localStorage.getItem('alea_settings');
          return s && JSON.parse(s).dailyHours
              ? JSON.parse(s).dailyHours
              : weekDaysOrdered.reduce((acc, day) => ({
                  ...acc,
                  [day]: { pStart: '12:00', pEnd: '15:30', cStart: '19:00', cEnd: '23:30', isClosed: false }
              }), {} as Record<string, any>);
      } catch {
          return weekDaysOrdered.reduce((acc, day) => ({
              ...acc,
              [day]: { pStart: '12:00', pEnd: '15:30', cStart: '19:00', cEnd: '23:30', isClosed: false }
          }), {} as Record<string, any>);
      }
  });

  const handleGlobalHourChange = (shiftType: 'pStart' | 'pEnd' | 'cStart' | 'cEnd', value: string) => {
      if (shiftType === 'pStart') setPranzoStart(value);
      if (shiftType === 'pEnd') setPranzoEnd(value);
      if (shiftType === 'cStart') setCenaStart(value);
      if (shiftType === 'cEnd') setCenaEnd(value);
      setDailyHours(prev => {
          const newDaily = { ...prev };
          weekDaysOrdered.forEach(day => { newDaily[day] = { ...newDaily[day], [shiftType]: value }; });
          return newDaily;
      });
  };

  const updateDailyHour = (day: string, field: string, value: string | boolean) => {
      setDailyHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };
  
  const getShiftHoursForDate = (dateStr: string) => {
      const d = new Date(dateStr); 
      const jsDay = d.getDay();
      const localDayIndex = jsDay === 0 ? 6 : jsDay - 1;
      return dailyHours[weekDaysOrdered[localDayIndex]];
  };

  const [hostMode, setHostMode] = useState<'fisso' | 'dinamico'>(() => {
      try { const s = localStorage.getItem('alea_settings'); return s ? JSON.parse(s).hostMode ?? 'fisso' : 'fisso'; } catch { return 'fisso'; }
  });
  const [hostRatio, setHostRatio] = useState<number>(() => {
      try { const s = localStorage.getItem('alea_settings'); return s ? JSON.parse(s).hostRatio ?? 50 : 50; } catch { return 50; }
  });
  // Form preparazioni
  const [prepTab, setPrepTab] = useState<'inventario' | 'ricette' | 'preparazioni'>('inventario');
  const [newPrepName, setNewPrepName] = useState('');
  const [newPrepYieldQty, setNewPrepYieldQty] = useState('');
  const [newPrepYieldUnit, setNewPrepYieldUnit] = useState('g');
  const [editingPrepId, setEditingPrepId] = useState<string | null>(null);
  const [prepIngSearch, setPrepIngSearch] = useState('');
  const [prepIngId, setPrepIngId] = useState('');
  const [prepIngQty, setPrepIngQty] = useState('');
  const [prepDropdownRect, setPrepDropdownRect] = useState<DOMRect | null>(null);
  const [prepBatchQty, setPrepBatchQty] = useState<Record<string, string>>({});
  const [newPrepIdealQty, setNewPrepIdealQty] = useState('');
  const [newPrepEditingIdeal, setNewPrepEditingIdeal] = useState(false);

  // ====== PRENOTAZIONI ======
  const [savedShifts, setSavedShifts] = useState<string[]>(() => {
      try {
          const stored = localStorage.getItem('alea_saved_shifts');
          return stored ? JSON.parse(stored) : [];
      } catch { return []; }
  });
  const [closedShifts, setClosedShifts] = useState<string[]>(() => {
      try {
          const stored = localStorage.getItem('alea_closed_shifts');
          return stored ? JSON.parse(stored) : [];
      } catch { return []; }
  });
  const [reservations, setReservations] = useState<Reservation[]>([
      
  ]);
  const [newResName, setNewResName] = useState('');
  const [newResPax, setNewResPax] = useState('');
  const [newResTime, setNewResTime] = useState('');
  const [newResPhone, setNewResPhone] = useState('');
  
  // ====== PIANIFICAZIONE ======
  
  const [weekGenerated, setWeekGenerated] = useState(false);
  const [isGeneratingStaff, setIsGeneratingStaff] = useState(false);
  const [weeklyStaffData, setWeeklyStaffData] = useState<any[]>([]);
  const [staffDateRange, setStaffDateRange] = useState({ start: '', end: '' });

  const [budgetStartDate, setBudgetStartDate] = useState<string>(() => {
      const tmrw = new Date(); 
      tmrw.setDate(tmrw.getDate() + 1); 
      return tmrw.toLocaleDateString('en-CA');
  });
  const [budgetDuration, setBudgetDuration] = useState<number>(7);
  const [showBudgetSettings, setShowBudgetSettings] = useState(false);
  const [isGeneratingBudget, setIsGeneratingBudget] = useState(false);
  const [budgetGenerated, setBudgetGenerated] = useState(false);
  const [budgetData, setBudgetData] = useState<any>(null);

  // ====== INVENTARIO ======
  // Ingredienti: { id, name, unit, idealQty, currentQty }
  const [ingredients, setIngredients] = useState<Array<{
      id: string; name: string; unit: string; idealQty: number; currentQty: number;
      suppliers?: Array<{ name: string; qtyPerBox: number; pricePerBox: number; unit: string }>;
      manualPricePerUnit?: number;
      // WAC: storico acquisti { qty in unità base, pricePerUnit in €/unità base, date }
      purchaseHistory?: Array<{ qty: number; pricePerUnit: number; date: string; supplierName: string }>;
  }>>([]);
  // Ricette: { dishName, ingredients: [{ ingredientId, qty, pcs_yield? }] }
  const [recipes, setRecipes] = useState<Record<string, Array<{ ingredientId: string; qty: number; pcs_yield?: number }>>>({});
  // Preparazioni interne: semi-lavorati fatti in casa
  const [preparations, setPreparations] = useState<Array<{
      id: string; name: string; yieldQty: number; yieldUnit: string;
      ingredients: Array<{ ingredientId: string; qty: number }>;
  }>>([]);
  // Form aggiunta ingrediente
  const [newIngName, setNewIngName] = useState('');
  const [newIngUnit, setNewIngUnit] = useState('g');
  const [newIngIdeal, setNewIngIdeal] = useState('');
  // Form fornitore
  const [newIngSupplierMode, setNewIngSupplierMode] = useState<'new' | 'existing'>('new');
  const [newIngSupplierName, setNewIngSupplierName] = useState('');
  const [newIngQtyPerBox, setNewIngQtyPerBox] = useState('');
  const [newIngBoxCount, setNewIngBoxCount] = useState('');
  const [newIngSelectedSupplier, setNewIngSelectedSupplier] = useState('');
  const [newIngEditingIdeal, setNewIngEditingIdeal] = useState(false);
  const [newIngPricePerBox, setNewIngPricePerBox] = useState('');
  const [newIngEditingPrice, setNewIngEditingPrice] = useState(false);
  // Ricetta in modifica
  const [editingRecipeDish, setEditingRecipeDish] = useState<string | null>(null);
  const [editingRecipeIngId, setEditingRecipeIngId] = useState('');
  const [editingRecipeQty, setEditingRecipeQty] = useState('');
  const [editingRecipePcsYield, setEditingRecipePcsYield] = useState('');
  const [ingredientSearchText, setIngredientSearchText] = useState('');
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);
  // Verifica quantità
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [verifyValues, setVerifyValues] = useState<Record<string, string>>({});
  const [importFeedback, setImportFeedback] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);
  // Tab pianificazione aggiornata
  const [planTab, setPlanTab] = useState<'sala' | 'inventario' | 'ricette' | 'cucina'>('sala');

  // ====== PREZZI MENU PERSONALIZZATI ======
  // Sovrascrivono MENU_PRICES per utente. Formato: { [dishName]: price }
  const [menuPrices, setMenuPrices] = useState<Record<string, number>>({});

  // Restituisce il prezzo di un piatto (custom > fallback MENU_PRICES > 0)
  const getDishPrice = (dishName: string): number =>
    menuPrices[dishName] ?? MENU_PRICES[dishName] ?? 0;

  // ====== TAVOLI (STATO CONDIVISO TRA GESTIONALE E PERSONALE) ======
  const [tables, setTables] = useState<Table[]>([
      { id: 1, label: 'Tavolo 1', capacity: 2, status: 'free' },
      { id: 2, label: 'Tavolo 2', capacity: 2, status: 'free' },
      { id: 3, label: 'Tavolo 3', capacity: 4, status: 'free' },
      { id: 4, label: 'Tavolo 4', capacity: 4, status: 'free' },
      { id: 5, label: 'Tavolo 5', capacity: 6, status: 'free' },
      { id: 6, label: 'Tavolo 6', capacity: 8, status: 'free' },
      { id: 7, label: 'Tavolo 7', capacity: 4, status: 'free' },
      { id: 8, label: 'Tavolo 8', capacity: 4, status: 'free' },
      { id: 9, label: 'Privé A', capacity: 10, status: 'free' },
      { id: 10, label: 'Privé B', capacity: 12, status: 'free' },
  ]);
  
  const [seatingReservation, setSeatingReservation] = useState<Reservation | null>(null);
  const [paidTables, setPaidTables] = useState<Set<number>>(new Set());
  // Conti emessi: { tableId, orders, total, reservationName, pax, label, paid }
  const [openBills, setOpenBills] = useState<Array<{
      tableId: number; label: string; orders: OrderItem[];
      total: number; reservationName?: string; pax?: number; paid: boolean;
  }>>([]);
  // Stato per "ordina altro": se true, nel drawer waiting riapre la comanda
  const [isAddingMore, setIsAddingMore] = useState(false);

  // ====== STATO CUCINA ======
  // Ogni ticket ha: tableId, label, orderMode, currentCourse, totalCourses, piatti (no bevande), timestamp
  const [kitchenTickets, setKitchenTickets] = useState<Array<{
      id: string; tableId: number; label: string; reservationName?: string;
      orderMode: 'together' | 'courses'; currentCourse: number; totalCourses: number;
      dishes: OrderItem[]; timestamp: number;
  }>>([]);
  const [selectedKitchenTicketId, setSelectedKitchenTicketId] = useState<string | null>(null);
  // Timer consegna: { tableId, deliverAt (timestamp ms) }
  const [pendingDeliveries, setPendingDeliveries] = useState<Array<{ tableId: number; deliverAt: number }>>([]);

  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [menuAvailability, setMenuAvailability] = useState<Record<string, Record<string, boolean>>>({});

  // ====== STATI COMANDA (DRAWER) ======
  const [activeTableId, setActiveTableId] = useState<number | null>(null);
  const [orderSetupPax, setOrderSetupPax] = useState<string>('');
  const [orderSetupMode, setOrderSetupMode] = useState<'together' | 'courses' | null>(null);
  const [tempOrders, setTempOrders] = useState<OrderItem[]>([]);
  const [editingNoteFor, setEditingNoteFor] = useState<number | null>(null);
  const [tempNoteText, setTempNoteText] = useState('');
  
  const [activeCourseTab, setActiveCourseTab] = useState<string | null>(null);
  const [activeMenuCategory, setActiveMenuCategory] = useState<string | null>(null);
  // Tick ogni secondo per aggiornare il countdown nel drawer (deve stare dopo activeTableId)
  const [_tick, setTick] = useState(0);

  // ====== EFFECTS ======
  useEffect(() => {
    const root = window.document.documentElement;
    if (shift === 'cena') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
  }, [shift]);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=45.5126&longitude=9.0954&hourly=temperature_2m,precipitation,weathercode&timezone=Europe%2FRome&forecast_days=14&past_days=14');
        if (response.ok) {
          const data = await response.json();
          const targetHour = shift === 'pranzo' ? '13:00' : '20:00';
          const timeIndex = data.hourly.time.indexOf(`${selectedDate}T${targetHour}`);
          if (timeIndex !== -1) {
            const code = data.hourly.weathercode[timeIndex];
            let condition: 'sunny' | 'rainy' | 'cloudy' = 'sunny';
            if (code === 0 || code === 1) condition = 'sunny';
            else if (code === 2 || code === 3 || (code >= 45 && code <= 48)) condition = 'cloudy';
            else condition = 'rainy';
            setWeather({ temp: Math.round(data.hourly.temperature_2m[timeIndex]), precipitation_mm: data.hourly.precipitation[timeIndex] || 0, condition });
          }
        }
      } catch (error) { 
          console.error("Errore meteo:", error); 
      }
    };
    fetchWeather();
  }, [selectedDate, shift]);

  // ====== TIMER CONSEGNA AUTOMATICA (ogni secondo controlla i pending) ======
  useEffect(() => {
      if (pendingDeliveries.length === 0) return;
      const interval = setInterval(() => {
          const now = Date.now();
          const expired = pendingDeliveries.filter(d => now >= d.deliverAt);
          if (expired.length === 0) return;

          // Avanza i tavoli scaduti a 'served'
          setTables(prev => prev.map(t => {
              if (expired.some(d => d.tableId === t.id) && t.status === 'waiting') {
                  return { ...t, status: 'served' };
              }
              return t;
          }));
          // Rimuovi i delivery scaduti
          setPendingDeliveries(prev => prev.filter(d => now < d.deliverAt));
      }, 1000);
      return () => clearInterval(interval);
  }, [pendingDeliveries]);

  // Tick ogni secondo per aggiornare il countdown nel drawer
  useEffect(() => {
      if (!activeTableId) return;
      const interval = setInterval(() => setTick(t => t + 1), 60000);
      return () => clearInterval(interval);
  }, [activeTableId]);

  // ====== PERSISTENZA LOCALSTORAGE ======
  // ====== PERSISTENZA SUPABASE — INVENTARIO ======
  // Carica da Supabase al login
  useEffect(() => {
      if (!isLoggedIn) return;
      const loadInventory = async () => {
          const userId = (await supabase.auth.getUser()).data.user?.id;
          if (!userId) return;

          const { data: ings } = await supabase
              .from('ingredients').select('data').eq('user_id', userId);
          if (ings && ings.length > 0) setIngredients(ings.map(r => r.data));

          const { data: recs } = await supabase
              .from('recipes').select('data').eq('user_id', userId).single();
          if (recs) setRecipes(recs.data);

          const { data: preps } = await supabase
              .from('preparations').select('data').eq('user_id', userId);
          if (preps && preps.length > 0) setPreparations(preps.map(r => r.data));
      };
      loadInventory();
  }, [isLoggedIn]);

  // Salva ingredients su Supabase
  useEffect(() => {
      if (!isLoggedIn) return;
      const save = async () => {
          const userId = (await supabase.auth.getUser()).data.user?.id;
          if (!userId) return;
          await supabase.from('ingredients').delete().eq('user_id', userId);
          if (ingredients.length > 0) {
              await supabase.from('ingredients').insert(
                  ingredients.map(ing => ({ id: ing.id, user_id: userId, data: ing }))
              );
          }
      };
      save();
  }, [ingredients]);

  // Salva recipes su Supabase
  useEffect(() => {
      if (!isLoggedIn) return;
      const save = async () => {
          const userId = (await supabase.auth.getUser()).data.user?.id;
          if (!userId) return;
          await supabase.from('recipes').upsert({ user_id: userId, data: recipes });
      };
      save();
  }, [recipes]);

  // Salva preparations su Supabase
  useEffect(() => {
      if (!isLoggedIn) return;
      const save = async () => {
          const userId = (await supabase.auth.getUser()).data.user?.id;
          if (!userId) return;
          await supabase.from('preparations').delete().eq('user_id', userId);
          if (preparations.length > 0) {
              await supabase.from('preparations').insert(
                  preparations.map(p => ({ id: p.id, user_id: userId, data: p }))
              );
          }
      };
      save();
  }, [preparations]);

  // Carica menuPrices da Supabase al login
  useEffect(() => {
      if (!isLoggedIn) return;
      const load = async () => {
          const userId = (await supabase.auth.getUser()).data.user?.id;
          if (!userId) return;
          const { data } = await supabase
              .from('menu_prices')
              .select('dish_name, price')
              .eq('user_id', userId);
          if (data && data.length > 0) {
              const map: Record<string, number> = {};
              data.forEach(r => { map[r.dish_name] = Number(r.price); });
              setMenuPrices(map);
          }
      };
      load();
  }, [isLoggedIn]);

  // Salva un singolo prezzo su Supabase (chiamata on-demand, non su ogni cambio stato)
  const saveMenuPrice = async (dishName: string, price: number) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return;
      await supabase.from('menu_prices').upsert(
          { user_id: userId, dish_name: dishName, price, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,dish_name' }
      );
  };

  useEffect(() => {
      try {
          localStorage.setItem('alea_settings', JSON.stringify({
              waiterRatio, cookRatio, maxCapacity,
              pranzoStart, pranzoEnd, cenaStart, cenaEnd,
              dailyHours, hostMode, hostRatio
          }));
      } catch {}
  }, [waiterRatio, cookRatio, maxCapacity, pranzoStart, pranzoEnd, cenaStart, cenaEnd, dailyHours]);

  // ====== GENERATORI ======
  const generateStaffPlan = async () => {
      setIsGeneratingStaff(true);
      await new Promise(r => setTimeout(r, 400));
      const curr = new Date(selectedDate + 'T12:00:00');
      const nextMonday = new Date(curr);
      nextMonday.setDate(curr.getDate() + ((7 - curr.getDay() + 1) % 7 || 7));
      const endDate = new Date(nextMonday);
      endDate.setDate(nextMonday.getDate() + 6);

      setStaffDateRange({
          start: nextMonday.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }),
          end: endDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
      });

      // Meteo placeholder per i 7 giorni (verrà migliorato con previsioni reali)
      const weatherWeek = Array.from({ length: 7 }, (_, i) => ({
          temp_pranzo: weather.temp, pioggia_pranzo: 0,
          temp_cena: weather.temp - 2, pioggia_cena: 0
      }));

      const startStr = nextMonday.toISOString().split('T')[0];
      let previsioni: any[] = [];
      try {
          previsioni = prevediSettimana(startStr, weatherWeek);
      } catch { previsioni = []; }

      const newWeeklyData = [];
      for (let i = 0; i < 7; i++) {
          const targetDate = new Date(nextMonday);
          targetDate.setDate(nextMonday.getDate() + i);
          const jsDay = targetDate.getDay();
          const isWeekend = jsDay === 0 || jsDay === 6;
          const prev = previsioni[i];
          const predP = prev ? prev.pranzo.media : (isWeekend ? 90 : 35);
          const predC = prev ? prev.cena.media : (isWeekend ? 160 : 55);
          const loP = prev ? prev.pranzo.lo : Math.round(predP * 0.8);
          const hiP = prev ? prev.pranzo.hi : Math.round(predP * 1.2);
          const loC = prev ? prev.cena.lo : Math.round(predC * 0.8);
          const hiC = prev ? prev.cena.hi : Math.round(predC * 1.2);
          const convP = convocazioneSettimanale(predP, loP, hiP, waiterRatio);
          const convC = convocazioneSettimanale(predC, loC, hiC, waiterRatio);
          const cuochiP = convocazioneCuochiSettimanale(predP, loP, hiP, cookRatio);
          const cuochiC = convocazioneCuochiSettimanale(predC, loC, hiC, cookRatio);
          const dataStr = targetDate.toISOString().split('T')[0];
          const attendibilita = calcolaAttendibilita(dataStr, ST_STOR_STATS);
          newWeeklyData.push({
              data: dataStr,
              dayName: mapDays[jsDay],
              shortDate: targetDate.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
              isWeekend,
              attendibilita,
              pranzo: {
                  predicted: predP, lo: loP, hi: hiP,
                  staff: { base: convP.cam_fissi, onCall: convP.cam_chiamata, messaggio: convP.messaggio, nota: convP.nota },
                  cuochi: cuochiP
              },
              cena: {
                  predicted: predC, lo: loC, hi: hiC,
                  staff: { base: convC.cam_fissi, onCall: convC.cam_chiamata, messaggio: convC.messaggio, nota: convC.nota },
                  cuochi: cuochiC
              }
          });
      }
      setWeeklyStaffData(newWeeklyData);
      setIsGeneratingStaff(false);
      setWeekGenerated(true);
  };

  const generateBudgetPlan = async () => {
      setIsGeneratingBudget(true);
      await new Promise(r => setTimeout(r, 500));
      const startDateObj = new Date(budgetStartDate);
      const weatherDays = Array.from({ length: budgetDuration }, () => ({
          temp_pranzo: weather.temp, pioggia_pranzo: 0,
          temp_cena: weather.temp - 2, pioggia_cena: 0
      }));

      let totPranzo = 0; let minPranzo = 0; let maxPranzo = 0;
      let totCena = 0; let minCena = 0; let maxCena = 0;

      for (let i = 0; i < budgetDuration; i++) {
          const targetDate = new Date(startDateObj);
          targetDate.setDate(startDateObj.getDate() + i);
          const dateStr = targetDate.toISOString().split('T')[0];
          const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6;
          let predP = isWeekend ? 85 : 30;
          let loP = Math.round(predP * 0.8); let hiP = Math.round(predP * 1.2);
          let predC = isWeekend ? 150 : 60;
          let loC = Math.round(predC * 0.8); let hiC = Math.round(predC * 1.2);
          try {
              const prev = prevediGiorno(dateStr, weatherDays[i]);
              predP = prev.pranzo.media; loP = prev.pranzo.lo; hiP = prev.pranzo.hi;
              predC = prev.cena.media; loC = prev.cena.lo; hiC = prev.cena.hi;
          } catch {}
          totPranzo += predP; minPranzo += loP; maxPranzo += hiP;
          totCena += predC; minCena += loC; maxCena += hiC;
      }

      const endDateObj = new Date(startDateObj);
      endDateObj.setDate(startDateObj.getDate() + budgetDuration - 1);
      setBudgetData({
          startDate: startDateObj.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }),
          endDate: endDateObj.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }),
          pranzo: { stimati: totPranzo, min: minPranzo, max: maxPranzo },
          cena: { stimati: totCena, min: minCena, max: maxCena },
          totaleGlobale: totPranzo + totCena
      });
      setIsGeneratingBudget(false);
      setBudgetGenerated(true);
      setShowBudgetSettings(false);
  };

  // ====== HANDLERS ======
  const handleCloseShift = () => {
    const CLOSED_VALUES = ['-', '/'];
    const isClosed =
      CLOSED_VALUES.includes(actualCovers.trim()) &&
      CLOSED_VALUES.includes(finalBooked.trim());

    if (!isClosed && (!actualCovers || !finalBooked)) return;

    const shiftKey = `${selectedDate}-${shift}`;
    if (!savedShifts.includes(shiftKey)) setSavedShifts(prev => {
        const next = [...prev, shiftKey];
        try { localStorage.setItem('alea_saved_shifts', JSON.stringify(next)); } catch {}
        return next;
    });

    if (isClosed) {
      // Marca come chiuso in localStorage — nessun dato mandato all'algoritmo
      if (!closedShifts.includes(shiftKey)) setClosedShifts(prev => {
          const next = [...prev, shiftKey];
          try { localStorage.setItem('alea_closed_shifts', JSON.stringify(next)); } catch {}
          return next;
      });
    } else {
      // Salva nello storico per migliorare le previsioni future
      const cp = shift === 'pranzo' ? parseInt(actualCovers) : 0;
      const cc = shift === 'cena' ? parseInt(actualCovers) : 0;
      const pp = shift === 'pranzo' ? parseInt(finalBooked) : 0;
      const pc = shift === 'cena' ? parseInt(finalBooked) : 0;
      try {
          salvaVerificaServizio(selectedDate, cp, cc, pp, pc, weather.temp, weather.temp - 2, weather.precipitation_mm, weather.precipitation_mm);
      } catch {}
    }

    setActualCovers('');
    setFinalBooked('');
  };


  // ====== IMPORT INVENTARIO DA FILE (CSV / XLSX / XLS / TSV) ======
  const handleInventoryImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = '';
      const ext = file.name.split('.').pop()?.toLowerCase();
      setImportFeedback({ type: 'info', msg: `Caricamento ${file.name}...` });

      const parseRows = (rows: string[][]): void => {
          if (rows.length < 2) { setImportFeedback({ type: 'error', msg: 'File vuoto o formato non riconosciuto.' }); return; }
          const header = rows[0].map(h => h.toLowerCase().trim());
          const nameIdx = header.findIndex(h => ['nome','ingrediente','name','ingredient','articolo','prodotto','descrizione'].some(k => h.includes(k)));
          const qtyIdx  = header.findIndex(h => ['quantità','quantita','qty','giacenza','disponibile','scorta','quantity','stock'].some(k => h.includes(k)));
          const unitIdx = header.findIndex(h => ['unità','unita','unit','um','misura'].some(k => h.includes(k)));
          if (nameIdx === -1) { setImportFeedback({ type: 'error', msg: 'Colonna "nome" o "ingrediente" non trovata. Controlla le intestazioni.' }); return; }
          if (qtyIdx  === -1) { setImportFeedback({ type: 'error', msg: 'Colonna "quantità" o "giacenza" non trovata. Controlla le intestazioni.' }); return; }
          let aggiornati = 0; let aggiunti = 0;
          const nuovi = [...ingredients];
          rows.slice(1).forEach(row => {
              const nome = row[nameIdx]?.trim();
              const qtyStr = row[qtyIdx]?.toString().replace(',', '.').trim();
              const unit = unitIdx >= 0 ? (row[unitIdx]?.trim() || 'g') : 'g';
              if (!nome || !qtyStr) return;
              const qty = parseFloat(qtyStr);
              if (isNaN(qty)) return;
              const idx = nuovi.findIndex(i => i.name.toLowerCase() === nome.toLowerCase());
              if (idx >= 0) { nuovi[idx] = { ...nuovi[idx], currentQty: qty }; aggiornati++; }
              else { nuovi.push({ id: Date.now().toString() + Math.random(), name: nome, unit, idealQty: qty, currentQty: qty }); aggiunti++; }
          });
          setIngredients(nuovi);
          setImportFeedback({ type: 'success', msg: `✅ ${aggiornati} aggiornati, ${aggiunti} aggiunti.` });
          setTimeout(() => setImportFeedback(null), 5000);
      };

      if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
          const reader = new FileReader();
          reader.onload = ev => {
              const text = ev.target?.result as string;
              const sep = ext === 'tsv' ? '\t' : (text.includes(';') ? ';' : ',');
              const rows = text.split('\n').filter(r => r.trim()).map(r => r.split(sep).map(c => c.replace(/^"|"$/g, '').trim()));
              parseRows(rows);
          };
          reader.readAsText(file, 'UTF-8');
      } else if (ext === 'xlsx' || ext === 'xls') {
          const reader = new FileReader();
          reader.onload = ev => {
              try {
                  const XLSX = (window as any).XLSX;
                  if (!XLSX) { setImportFeedback({ type: 'error', msg: 'Libreria Excel non disponibile. Usa CSV.' }); return; }
                  const data = new Uint8Array(ev.target?.result as ArrayBuffer);
                  const wb = XLSX.read(data, { type: 'array' });
                  const ws = wb.Sheets[wb.SheetNames[0]];
                  const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
                  parseRows(rows);
              } catch { setImportFeedback({ type: 'error', msg: 'Errore lettura Excel. Prova CSV.' }); }
          };
          reader.readAsArrayBuffer(file);
      } else {
          setImportFeedback({ type: 'error', msg: `Formato .${ext} non supportato. Usa CSV, XLSX o XLS.` });
      }
  };

  const addReservation = () => {
    if (!newResName || !newResPax || !newResTime) return;
    const currentDayHours = getShiftHoursForDate(selectedDate);
    const belongsToPranzo = isTimeInShift(newResTime, currentDayHours.pStart, currentDayHours.pEnd);
    const belongsToCena = isTimeInShift(newResTime, currentDayHours.cStart, currentDayHours.cEnd);
    let targetShift = shift; 
    let isOut = false;

    if (belongsToPranzo) targetShift = 'pranzo';
    else if (belongsToCena) targetShift = 'cena';
    else { targetShift = shift; isOut = true; }

    setReservations([...reservations, { 
        id: Date.now().toString(), date: selectedDate, shift: targetShift, name: newResName, 
        pax: parseInt(newResPax), time: newResTime, phone: newResPhone || undefined, isOutOfBounds: isOut, isSeated: false 
    }]);
    setNewResName(''); setNewResPax(''); setNewResTime(''); setNewResPhone('');
    if (targetShift !== shift && !isOut) {
        alert(`L'ora ${newResTime} è stata spostata nel turno di ${targetShift.toUpperCase()}.`);
    }
  };

  const deleteReservation = (id: string) => {
      setReservations(reservations.filter(r => r.id !== id));
  };

  // ====== LOGICA GESTIONE SALA ======
  const handleDragStart = (e: React.DragEvent, resId: string) => {
      e.dataTransfer.setData('resId', resId);
  };

  const handleDropOnTable = (e: React.DragEvent, tableId: number) => {
      e.preventDefault();
      const resId = e.dataTransfer.getData('resId');
      if (resId) assignReservationToTable(resId, tableId);
  };

  const assignReservationToTable = (resId: string, tableId: number) => {
      const table = tables.find(t => t.id === tableId);
      const res = reservations.find(r => r.id === resId);
      if (!table || !res || table.status !== 'free') return;

      setTables(tables.map(t => t.id === tableId ? { 
          ...t, 
          status: 'seated', 
          reservationName: res.name, 
          pax: res.pax 
      } : t));
      
      setReservations(reservations.map(r => r.id === resId ? { 
          ...r, 
          isSeated: true, 
          tableId: tableId 
      } : r));
      
      setSeatingReservation(null);
  };

  // GESTIONALE: click su tavolo apre drawer SENZA ordini (solo visualizza stato)
  // PERSONALE: click su tavolo apre drawer COMPLETO con ordini
  const handleTableClick = (tableId: number) => {
      const table = tables.find(t => t.id === tableId);
      if (!table) return;

      if (seatingReservation) {
          if (table.status !== 'free') { 
              alert("Tavolo occupato o da pulire!"); 
              return; 
          }
          assignReservationToTable(seatingReservation.id, tableId);
      } else {
          setActiveTableId(table.id);
          setOrderSetupPax(table.pax ? table.pax.toString() : '');
          setOrderSetupMode(table.orderMode || null);
          setTempOrders(table.orders || []);
          setActiveCourseTab(null);
          setActiveMenuCategory(null);
          setIsAddingMore(false);
      }
  };

  const closeDrawer = () => {
      setActiveTableId(null);
      setOrderSetupPax(''); 
      setOrderSetupMode(null); 
      setTempOrders([]); 
      setEditingNoteFor(null);
      setActiveCourseTab(null);
      setActiveMenuCategory(null);
      setIsAddingMore(false);
  };

  const seatTable = () => {
      if (!activeTableId) return;
      setTables(tables.map(t => t.id === activeTableId ? { 
          ...t, 
          status: 'seated', 
          pax: parseInt(orderSetupPax) || 2,
      } : t));
      closeDrawer();
  };

  const saveOrderToTable = (newStatus: TableStatus, overrideCourse?: number) => {
      if (!activeTableId) return;
      const tMode = orderSetupMode || 'together';
      const table = tables.find(t => t.id === activeTableId);

      // Calcola le portate realmente usate (solo quelle con almeno un piatto ordinato, escluse bevande)
      let activeTotalCourses = 1;
      const kitchenCourseSections = ['Antipasti', 'Primi', 'Secondi', 'Dolci'];
      if (tMode === 'courses') {
          const allSections = ['Antipasti', 'Primi', 'Secondi', 'Dolci', 'Bevande'];
          const usedCourses = allSections.filter(course => tempOrders.some(order => order.course === course));
          activeTotalCourses = Math.max(usedCourses.length, 1);
      }

      // Genera ticket cucina quando si manda in waiting
      if (newStatus === 'waiting') {
          const currentCourseNum = overrideCourse ?? 1;
          const reservation = reservations.find(r => r.tableId === activeTableId && r.isSeated);

          let dishesForKitchen: OrderItem[] = [];
          if (tMode === 'together') {
              // tutto insieme: solo i piatti, no bevande
              dishesForKitchen = tempOrders.filter(o => !BEVERAGE_COURSES.includes(o.course) && o.course !== 'Bevande');
          } else {
              // a portate: solo i piatti della portata corrente
              // la portata corrente corrisponde alla N-esima sezione NON-bevande con piatti
              const usedKitchenCourses = kitchenCourseSections.filter(c => tempOrders.some(o => o.course === c));
              const currentCourseName = usedKitchenCourses[currentCourseNum - 1];
              dishesForKitchen = currentCourseName
                  ? tempOrders.filter(o => o.course === currentCourseName)
                  : [];
          }

          if (dishesForKitchen.length > 0) {
              const newTicket = {
                  id: `${activeTableId}-${Date.now()}`,
                  tableId: activeTableId,
                  label: table?.label || `Tavolo ${activeTableId}`,
                  reservationName: reservation?.name || table?.reservationName,
                  orderMode: tMode,
                  currentCourse: currentCourseNum,
                  totalCourses: activeTotalCourses,
                  dishes: dishesForKitchen,
                  timestamp: Date.now(),
              };
              setKitchenTickets(prev => [...prev, newTicket]);
          }
      }

      setTables(tables.map(t => t.id === activeTableId ? { 
          ...t, 
          status: newStatus, 
          pax: parseInt(orderSetupPax) || t.pax,
          orderMode: tMode,
          orders: tempOrders,
          currentCourse: overrideCourse !== undefined ? overrideCourse : t.currentCourse,
          totalCourses: activeTotalCourses
      } : t));
      closeDrawer();
  };

  const advanceTableState = () => {
      const table = tables.find(t => t.id === activeTableId);
      if (!table) return;
      // Solo dirty -> free rimane manuale (Libera Tavolo)
      if (table.status === 'dirty') {
          setTables(tables.map(t => t.id === activeTableId ? { 
              id: t.id, label: t.label, capacity: t.capacity, status: 'free' 
          } : t));
          setPaidTables(prev => { const next = new Set(prev); next.delete(activeTableId!); return next; });
          closeDrawer();
      }
  };

  const addMenuItemToOrder = (itemName: string, category: string, course: string) => {
      setTempOrders([...tempOrders, { name: itemName, note: '', category, course }]);
  };

  const saveNote = (index: number) => {
      const newOrders = [...tempOrders];
      newOrders[index].note = tempNoteText;
      setTempOrders(newOrders);
      setEditingNoteFor(null);
  };

  const removeOrderItem = (index: number) => {
      setTempOrders(tempOrders.filter((_, i) => i !== index));
  };

  // ====== CONTO TAVOLI ======
  const calculateTableBill = (table: Table): number => {
      if (!table.orders) return 0;
      return table.orders.reduce((sum, order) => {
          const price = getDishPrice(order.name);
          return sum + price;
      }, 0);
  };

  const markTableAsPaid = (tableId: number) => {
      setPaidTables(prev => new Set([...prev, tableId]));
      setOpenBills(prev => {
          const bill = prev.find(b => b.tableId === tableId);
          if (!bill) return prev;
          const others = prev.filter(b => b.tableId !== tableId);
          return [...others, { ...bill, paid: true }];
      });
  };

  const unmarkTableAsPaid = (tableId: number) => {
      setPaidTables(prev => { const next = new Set(prev); next.delete(tableId); return next; });
      setOpenBills(prev => prev.map(b => b.tableId === tableId ? { ...b, paid: false } : b));
  };

  const dismissBill = (tableId: number) => {
      setOpenBills(prev => prev.filter(b => b.tableId !== tableId));
      setPaidTables(prev => { const next = new Set(prev); next.delete(tableId); return next; });
  };

  // Segna ticket cucina come uscito — avvia timer e scala ingredienti
  const dismissKitchenTicket = (ticketId: string) => {
      const ticket = kitchenTickets.find(t => t.id === ticketId);
      if (ticket) {
          const deliverAt = Date.now() + 20 * 1000; // 20 secondi (test)
          setPendingDeliveries(prev => {
              const others = prev.filter(d => d.tableId !== ticket.tableId);
              return [...others, { tableId: ticket.tableId, deliverAt }];
          });
          // Scala gli ingredienti per ogni piatto uscito
          setIngredients(prev => {
              const updated = [...prev];
              ticket.dishes.forEach(dish => {
                  const dishRecipe = recipes[dish.name] || [];
                  dishRecipe.forEach(({ ingredientId, qty }) => {
                      const idx = updated.findIndex(i => i.id === ingredientId);
                      if (idx !== -1) {
                          updated[idx] = { ...updated[idx], currentQty: Math.max(0, updated[idx].currentQty - qty) };
                      }
                  });
              });
              return updated;
          });
      }
      setKitchenTickets(prev => prev.filter(t => t.id !== ticketId));
      setSelectedKitchenTicketId(null);
  };

  const toggleMenuItem = (itemName: string) => {
      const shiftKey = `${selectedDate}-${shift}`;
      setMenuAvailability(prev => ({ 
          ...prev, 
          [shiftKey]: { 
              ...(prev[shiftKey] || {}), 
              [itemName]: !(prev[shiftKey]?.[itemName] !== false) 
          } 
      }));
  }

  // ====== CALCOLI GLOBALI ======
  useEffect(() => {
      // I prenotati lordi vengono dalla lista prenotazioni reale del turno
      const prenotatiLordiTurno = reservations
          .filter(r => r.date === selectedDate && r.shift === shift && !r.isOutOfBounds)
          .reduce((sum, r) => sum + r.pax, 0);
      // Se l'utente ha inserito un numero manuale maggiore, usiamo quello
      const prenotatiLordi = Math.max(prenotatiLordiTurno, parseInt(bookedGuests || '0'));
      try {
          const prev = prevediGiorno(
              selectedDate,
              { temp_pranzo: weather.temp, pioggia_pranzo: weather.precipitation_mm, temp_cena: weather.temp - 2, pioggia_cena: weather.precipitation_mm },
              prenotatiLordi,
              prenotatiLordi,
          );
          const media = shift === 'pranzo' ? prev.pranzo.media : prev.cena.media;
          setPredictedCovers(media);
          setPrevisioneGiorno(prev);
      } catch (err) {
          console.error('ALEA PREVISIONE ERRORE:', err);
          const d = new Date(selectedDate + 'T12:00:00');
          const basePred = (d.getDay() === 0 || d.getDay() === 6) ? (shift === 'cena' ? 140 : 80) : (shift === 'cena' ? 60 : 30);
          setPredictedCovers(Math.max(basePred, parseInt(bookedGuests || '0')));
      }
  }, [selectedDate, shift, bookedGuests, weather, reservations]);

  // Usa convocazione() dal modello (logica da motore_previsionale.py)
  const getStaffAdvice = (predicted: number, lo: number, hi: number) => {
      const conv = convocazione(predicted, lo, hi, waiterRatio);
      return { base: conv.cam_fissi, onCall: conv.cam_picco, messaggio: conv.messaggio, alternativa: conv.alternativa, tipo: conv.tipo };
  };
  const staffAdvice = previsioneGiorno
      ? getStaffAdvice(
          predictedCovers,
          shift === 'pranzo' ? previsioneGiorno.pranzo.lo : previsioneGiorno.cena.lo,
          shift === 'pranzo' ? previsioneGiorno.pranzo.hi : previsioneGiorno.cena.hi,
        )
      : { base: Math.max(1, Math.ceil(predictedCovers / waiterRatio)), onCall: 0, messaggio: '', alternativa: '', tipo: 'fissi' };

  // Logica cuochi giornaliera — tolleranza stretta, mai ambiguità
  const cookAdvice = previsioneGiorno
      ? convocazioneCuochi(
          predictedCovers,
          shift === 'pranzo' ? previsioneGiorno.pranzo.lo : previsioneGiorno.cena.lo,
          shift === 'pranzo' ? previsioneGiorno.pranzo.hi : previsioneGiorno.cena.hi,
          cookRatio
        )
      : { cuochi: Math.max(1, Math.ceil(predictedCovers / cookRatio)), messaggio: '', nota: '' };
  const suggestedHosts = Math.max(1, Math.ceil(predictedCovers / hostRatio));

  // ── ATTENDIBILITÀ GIORNALIERA ────────────────────────────────────
  // ST_STOR viene da engine.ts — nessuna duplicazione del JSON
  const dailyAttendibilita = calcolaAttendibilita(selectedDate, undefined, parseInt(bookedGuests || '0'));

  // ====== NOTIFICHE VERIFICA SERVIZIO ======
  // Prima data senza storico nel database: 2026-03-20
  const STORICO_FINE = '2026-03-19';
  const pastShiftsStatus = (() => {
      const result: { date: Date; status: string }[] = [];
      const start = new Date(STORICO_FINE + 'T12:00:00');
      start.setDate(start.getDate() + 1); // giorno dopo l'ultimo nel DB
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(23, 59, 59);
      const cur = new Date(start);
      while (cur <= yesterday) {
          const dateStr = cur.toLocaleDateString('en-CA');
          const hasPranzo = savedShifts.includes(`${dateStr}-pranzo`);
          const hasCena = savedShifts.includes(`${dateStr}-cena`);
          if (!hasPranzo && !hasCena) {
              result.push({ date: new Date(cur), status: 'missing_both' });
          } else if (!hasPranzo || !hasCena) {
              result.push({ date: new Date(cur), status: 'missing_one' });
          }
          cur.setDate(cur.getDate() + 1);
      }
      return result;
  })();

  // ====== VARIABILI GRAFICHE ======
  const today = new Date();
  const isToday = selectedDate === todayStr; 
  const currentHourMinutes = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
  const currentDayHours = getShiftHoursForDate(selectedDate);
  const targetShiftStart = shift === 'pranzo' ? currentDayHours.pStart : currentDayHours.cStart;
  const targetShiftEnd = shift === 'pranzo' ? currentDayHours.pEnd : currentDayHours.cEnd;
  
  const isTargetShiftClosed = (selectedDate < todayStr) || (isToday && isShiftFinished(currentHourMinutes, targetShiftStart, targetShiftEnd));
  const isShiftOngoing = isToday && !isShiftFinished(currentHourMinutes, targetShiftStart, targetShiftEnd);
  const isLockedByTime = selectedDate > todayStr || isShiftOngoing;
  
  const actualC = parseInt(actualCovers || '0');
  const finalB = parseInt(finalBooked || '0');

  // Rilevamento "ristorante chiuso": entrambi i campi contengono - o /
  const CLOSED_VALUES = ['-', '/'];
  const isClosedEntry =
    CLOSED_VALUES.includes(actualCovers.trim()) &&
    CLOSED_VALUES.includes(finalBooked.trim());

  // Caso misto: un campo ha simbolo e l'altro un valore numerico — non valido
  const isMixedEntry =
    (CLOSED_VALUES.includes(actualCovers.trim()) && !CLOSED_VALUES.includes(finalBooked.trim()) && finalBooked.trim() !== '') ||
    (CLOSED_VALUES.includes(finalBooked.trim()) && !CLOSED_VALUES.includes(actualCovers.trim()) && actualCovers.trim() !== '');

  const isLogicError = !isClosedEntry && !isMixedEntry && actualC > 0 && finalB > actualC;
  const isSaveDisabled =
    isMixedEntry ||
    isLockedByTime ||
    (!isClosedEntry && (!actualCovers || !finalBooked || isLogicError));
  const currentShiftSaved = savedShifts.includes(`${selectedDate}-${shift}`);
  const currentShiftClosed = closedShifts.includes(`${selectedDate}-${shift}`);

  const currentShiftReservations = reservations.filter(r => r.date === selectedDate && r.shift === shift);
  const incomingReservations = currentShiftReservations.filter(r => !r.isSeated && !r.isOutOfBounds);
  const totalRegisteredPax = currentShiftReservations.filter(r => !r.isOutOfBounds).reduce((sum, r) => sum + r.pax, 0);

  const isDinner = shift === 'cena';
  
  const bgColor = isDinner ? 'bg-[#0F172A]' : 'bg-[#F4F1EA]'; 
  const textColor = isDinner ? 'text-[#F4F1EA]' : 'text-[#2C2A28]'; 
  const mutedText = isDinner ? 'text-[#94A3B8]' : 'text-[#8C8A85]';
  const cardBg = isDinner ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#EAE5DA] shadow-sm';
  const accentColor = isDinner ? 'text-[#967D62]' : 'text-[#967D62]'; 
  const accentBg = isDinner ? 'bg-[#967D62]/10 border-[#967D62]/20' : 'bg-[#967D62]/10 border-[#967D62]/30';

  const formattedDate = new Date(selectedDate).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'long' });
  const mobileDate = new Date(selectedDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  const currentMenuState = menuAvailability[`${selectedDate}-${shift}`] || {};
  const activeTable = tables.find(t => t.id === activeTableId);

  const WeatherIconBig = weather.condition === 'rainy' 
    ? <CloudRain className={`w-14 h-14 ${accentColor}`} /> 
    : weather.condition === 'cloudy' 
      ? <Cloud className={`w-14 h-14 ${accentColor}`} /> 
      : <Sun className={`w-14 h-14 ${accentColor}`} />;

  // Determina se le comande sono abilitate (solo in PERSONALE)
  const canTakeOrders = appRole === 'personale';

  // ===================================================================
  // RENDER: MENU COMANDA (ACCORDION)
  // ===================================================================
  const renderOrderSections = () => {
      const sections = orderSetupMode === 'together' ? ['Piatti', 'Bevande'] : ['Antipasti', 'Primi', 'Secondi', 'Dolci', 'Bevande'];
      return (
          <div className="space-y-3">
              {sections.map(sec => {
                  const isOpen = activeCourseTab === sec;
                  return (
                      <div key={sec} className={`border rounded-xl overflow-hidden transition-all ${isDinner ? 'border-[#334155]' : 'border-[#EAE5DA]'}`}>
                          <button 
                              onClick={() => setActiveCourseTab(isOpen ? null : sec)} 
                              className={`w-full p-4 flex justify-between items-center font-bold text-sm tracking-widest uppercase transition-colors ${isOpen ? (isDinner ? 'bg-[#334155] text-[#F4F1EA]' : 'bg-gray-100 text-[#2C2A28]') : (isDinner ? 'bg-[#1E293B] text-[#94A3B8] hover:bg-[#334155]' : 'bg-white text-[#8C8A85] hover:bg-gray-50')}`}
                          >
                              {sec} {isOpen ? <ChevronUp className="w-5 h-5"/> : <Plus className="w-5 h-5"/>}
                          </button>
                          
                          {isOpen && (
                              <div className={`p-2 sm:p-4 space-y-4 ${isDinner ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
                                  {sec === 'Bevande' ? (
                                      <div className="flex flex-wrap gap-2">
                                          {MENU_CATEGORIES[7].items.map((item, idx) => {
                                              const isAvail = currentMenuState[item] !== false;
                                              return (
                                                  <button 
                                                      key={idx} disabled={!isAvail} onClick={() => addMenuItemToOrder(item, MENU_CATEGORIES[7].name, sec)}
                                                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${!isAvail ? 'opacity-30 cursor-not-allowed border-dashed' : (isDinner ? 'bg-[#1E293B] border-[#334155] text-[#F4F1EA] hover:border-[#967D62]' : 'bg-white border-[#EAE5DA] text-[#2C2A28] hover:border-[#967D62]')}`}
                                                  >
                                                      {item}
                                                  </button>
                                              );
                                          })}
                                      </div>
                                  ) : (
                                      MENU_CATEGORIES.slice(0, 7).map((cat, catIdx) => {
                                          const isCatOpen = activeMenuCategory === cat.name;
                                          return (
                                              <div key={catIdx} className={`rounded-lg overflow-hidden border ${isDinner ? 'border-[#334155] bg-[#1E293B]' : 'border-[#EAE5DA] bg-white'}`}>
                                                  <button 
                                                      onClick={() => setActiveMenuCategory(isCatOpen ? null : cat.name)}
                                                      className={`w-full p-3 text-left text-xs font-bold tracking-wider flex justify-between items-center ${isCatOpen ? accentColor : mutedText}`}
                                                  >
                                                      {cat.name} {isCatOpen ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                                                  </button>
                                                  {isCatOpen && (
                                                      <div className={`p-3 pt-0 flex flex-wrap gap-2`}>
                                                          {cat.items.map((item, itemIdx) => {
                                                              const isAvail = currentMenuState[item] !== false;
                                                              return (
                                                                  <button 
                                                                      key={itemIdx} disabled={!isAvail} onClick={() => addMenuItemToOrder(item, cat.name, sec)}
                                                                      className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${!isAvail ? 'opacity-30 cursor-not-allowed border-dashed' : (isDinner ? 'bg-[#0F172A] border-[#334155] text-[#F4F1EA] hover:border-[#967D62]' : 'bg-gray-50 border-[#EAE5DA] text-[#2C2A28] hover:border-[#967D62]')}`}
                                                                  >
                                                                      + {item}
                                                                  </button>
                                                              )
                                                          })}
                                                      </div>
                                                  )}
                                              </div>
                                          )
                                      })
                                  )}
                              </div>
                          )}
                      </div>
                  );
              })}
          </div>
      );
  }

  // ===================================================================
  // RENDER: MAPPA TAVOLI (condivisa tra gestionale e personale)
  // ===================================================================
  const renderTableMap = () => (
      <div className="flex-1 flex flex-col min-h-[400px]">
          <div className={`flex items-center justify-between p-3 sm:p-4 border-b rounded-t-2xl ${isDinner ? 'border-[#334155] bg-[#1E293B]' : 'border-[#EAE5DA] bg-white'}`}>
              <h3 className={`text-base sm:text-lg font-bold ${textColor} flex items-center gap-2`}><LayoutGrid className={`w-4 h-4 sm:w-5 sm:h-5 ${accentColor}`} /> Sala Interna</h3>
              <div className="flex flex-wrap justify-end items-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-medium">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Occupato</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-500"></div> In attesa</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#967D62]"></div> Servito</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-400"></div> Sparecchiare</span>
              </div>
          </div>
          
          <div className={`flex-1 p-4 sm:p-6 rounded-b-2xl border-x border-b overflow-y-auto ${isDinner ? 'border-[#334155] bg-[#0F172A]' : 'border-[#EAE5DA] bg-gray-50'}`}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {tables.map(table => (
                      <div 
                          key={table.id} onClick={() => handleTableClick(table.id)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDropOnTable(e, table.id)}
                          className={`flex flex-col items-center justify-center p-4 sm:p-6 rounded-xl cursor-pointer transition-all duration-200 relative group aspect-square
                              ${table.status === 'free' ? (isDinner ? 'bg-[#1E293B] border border-[#334155] text-[#94A3B8] hover:border-[#F4F1EA]' : 'bg-white border border-[#EAE5DA] text-[#8C8A85] hover:border-[#967D62]') : ''}
                              ${table.status === 'seated' ? (isDinner ? 'bg-amber-900/30 border border-amber-700/50 text-amber-400 shadow-md' : 'bg-amber-50 border border-amber-200 text-amber-700 shadow-md') : ''}
                              ${table.status === 'waiting' ? (isDinner ? 'bg-slate-700 text-[#F4F1EA] shadow-md border border-slate-600' : 'bg-slate-500 text-white shadow-md border border-slate-600') : ''}
                              ${table.status === 'served' ? (isDinner ? 'bg-[#967D62] text-[#F4F1EA] shadow-md hover:brightness-110' : 'bg-[#967D62] text-white shadow-md hover:brightness-110') : ''}
                              ${table.status === 'dirty' ? (isDinner ? 'bg-rose-900/40 border border-rose-800 text-rose-300' : 'bg-rose-100 border border-rose-200 text-rose-700') : ''}
                              ${seatingReservation && table.status === 'free' ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent animate-pulse' : ''}
                          `}
                      >
                          <span className="font-bold text-lg sm:text-xl text-center leading-tight">{table.status === 'free' ? table.label : (table.reservationName || 'Walk-in')}</span>
                          {table.status !== 'free' && (<span className="text-xs sm:text-sm font-medium opacity-80 mt-1 sm:mt-2 flex items-center gap-1"><UsersRound className="w-3 h-3 sm:w-4 sm:h-4"/> {table.pax}</span>)}
                          {table.status === 'waiting' && table.orderMode === 'courses' && table.currentCourse && (<span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mt-2 bg-black/20 px-2 py-0.5 rounded-full text-white">Portata {table.currentCourse}/{table.totalCourses}</span>)}
                          {table.status === 'dirty' && (<span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mt-2">Da sparecchiare</span>)}
                      </div>
                  ))}
              </div>
          </div>
      </div>
  );

  // ===================================================================
  // RENDER: PRENOTAZIONI LATERALI (condivise)
  // ===================================================================
  const renderReservationsSidebar = () => (
      <div className="w-full lg:w-72 xl:w-80 flex flex-col flex-shrink-0 z-0">
          <Card className={`h-full flex flex-col ${cardBg}`}>
              <CardHeader className="pb-3 border-b border-black/5 dark:border-white/5">
                  <CardTitle className={`text-base flex justify-between items-center ${textColor}`}>
                      Prenotazioni In Arrivo <span className="bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full text-xs font-mono">{incomingReservations.length}</span>
                  </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-y-auto">
                  {incomingReservations.length === 0 ? (
                      <div className={`p-8 text-center text-sm ${mutedText}`}>Nessun tavolo in attesa.</div>
                  ) : (
                      <div className="divide-y divide-black/5 dark:divide-white/5">
                          {incomingReservations.sort((a,b) => (a.time || "").localeCompare(b.time || "")).map(res => (
                              <div 
                                  key={res.id} draggable onDragStart={(e) => handleDragStart(e, res.id)}
                                  className={`p-4 transition-colors cursor-grab active:cursor-grabbing ${seatingReservation?.id === res.id ? (isDinner ? 'bg-[#334155]' : 'bg-[#F4F1EA]') : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                              >
                                  <div className="flex justify-between items-start mb-2">
                                      <div className="flex flex-col">
                                          <span className={`font-bold text-sm ${textColor}`}>{res.name}</span>
                                          <span className={`text-xs font-mono font-semibold ${accentColor}`}>{res.time}</span>
                                      </div>
                                      <div className={`flex items-center text-xs font-bold ${mutedText} bg-black/5 dark:bg-white/10 px-2 py-1 rounded-md`}><UsersRound className="w-3 h-3 mr-1" /> {res.pax}</div>
                                  </div>
                                  <div className="flex gap-2">
                                      <Button 
                                          size="sm" variant={seatingReservation?.id === res.id ? 'default' : 'outline'}
                                          className={`flex-1 mt-1 text-xs h-7 ${seatingReservation?.id === res.id ? (isDinner ? 'bg-[#967D62] text-[#F4F1EA] hover:bg-[#7A654E]' : 'bg-[#967D62] text-white hover:bg-[#7A654E]') : ''}`}
                                          onClick={() => setSeatingReservation(seatingReservation?.id === res.id ? null : res)}
                                      >
                                          {seatingReservation?.id === res.id ? 'Seleziona Tavolo' : 'Assegna'}
                                      </Button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </CardContent>
          </Card>
      </div>
  );

  // ===================================================================
  // RENDER: DRAWER COMANDA COMPLETO (solo PERSONALE)
  // ===================================================================
  const renderFullDrawer = () => {
      if (!activeTable) return null;
      return (
          <>
              <div className={`p-4 sm:p-6 border-b shrink-0 flex items-center justify-between ${isDinner ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#EAE5DA]'}`}>
                  <div>
                      <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${textColor}`}>{activeTable.label}</h2>
                      <p className={`text-xs sm:text-sm mt-0.5 ${mutedText}`}>{activeTable.status === 'free' ? 'Nuovo Tavolo' : activeTable.reservationName || 'Walk-in'}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={closeDrawer} className="rounded-full hover:bg-black/5 dark:hover:bg-white/5"><X className={`w-6 h-6 ${textColor}`} /></Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                  
                  {/* 1. SE TAVOLO LIBERO -> SCELTA PAX E OCCUPA */}
                  {activeTable.status === 'free' ? (
                      <div className="space-y-6 animate-in fade-in flex flex-col items-center justify-center h-full">
                          <div className="space-y-4 text-center">
                              <Label className={`text-sm font-bold uppercase tracking-wider ${mutedText}`}>Numero Persone</Label>
                              <div className="flex items-center justify-center gap-3">
                                  <Button variant="outline" size="icon" onClick={() => setOrderSetupPax(String(Math.max(1, parseInt(orderSetupPax || '1') - 1)))} className={`w-12 h-12 rounded-full ${isDinner ? 'border-[#334155] text-[#F4F1EA]' : ''}`}>-</Button>
                                  <Input type="number" min="1" value={orderSetupPax} onChange={e => setOrderSetupPax(e.target.value)} className={`w-24 text-center font-bold text-3xl h-16 rounded-2xl ${isDinner ? 'bg-[#1E293B] border-[#334155] text-[#F4F1EA]' : 'bg-white'}`} />
                                  <Button variant="outline" size="icon" onClick={() => setOrderSetupPax(String(parseInt(orderSetupPax || '1') + 1))} className={`w-12 h-12 rounded-full ${isDinner ? 'border-[#334155] text-[#F4F1EA]' : ''}`}>+</Button>
                              </div>
                          </div>
                      </div>
                      
                  /* 2. SE TAVOLO OCCUPATO (SEATED) MA MODALITA' NON SCELTA -> SCELTA MODALITA' */
                  ) : activeTable.status === 'seated' && !orderSetupMode ? (
                      <div className="space-y-6 animate-in fade-in flex flex-col items-center justify-center h-full">
                          <div className="text-center space-y-2 mb-4">
                              <h3 className={`text-xl font-bold ${textColor}`}>Tavolo Occupato ({activeTable.pax} pax)</h3>
                              <p className={mutedText}>Come desiderano ordinare?</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4 w-full">
                              <Button onClick={() => setOrderSetupMode('together')} className={`h-24 flex flex-col gap-2 border-2 rounded-2xl ${isDinner ? 'border-[#334155] bg-transparent text-[#94A3B8] hover:border-[#967D62] hover:text-[#F4F1EA]' : 'border-[#EAE5DA] bg-white text-[#8C8A85] hover:border-[#967D62] hover:text-[#2C2A28]'}`} variant="outline">
                                  <Utensils className="w-6 h-6" /><span className="text-sm font-bold">Tutto Insieme</span>
                              </Button>
                              <Button onClick={() => setOrderSetupMode('courses')} className={`h-24 flex flex-col gap-2 border-2 rounded-2xl ${isDinner ? 'border-[#334155] bg-transparent text-[#94A3B8] hover:border-[#967D62] hover:text-[#F4F1EA]' : 'border-[#EAE5DA] bg-white text-[#8C8A85] hover:border-[#967D62] hover:text-[#2C2A28]'}`} variant="outline">
                                  <LayoutGrid className="w-6 h-6" /><span className="text-sm font-bold">A Portate</span>
                              </Button>
                          </div>
                      </div>
                      
                  /* 3. SE TAVOLO OCCUPATO E MODALITA' SCELTA -> PRESA COMANDA */
                  ) : activeTable.status === 'seated' && orderSetupMode ? (
                      <div className="space-y-6 animate-in slide-in-from-right-4">
                          <div className={`p-4 rounded-xl border ${isDinner ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#EAE5DA]'}`}>
                              <div className="flex justify-between items-center mb-3">
                                  <h4 className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>Comanda Attuale ({tempOrders.length} Piatti)</h4>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isDinner ? 'bg-[#0F172A] text-[#94A3B8]' : 'bg-gray-100 text-[#8C8A85]'}`}>{orderSetupMode === 'courses' ? 'A Portate' : 'Tutto Insieme'}</span>
                              </div>
                              
                              {tempOrders.length === 0 ? (
                                  <p className={`text-sm italic ${mutedText}`}>Nessun piatto aggiunto.</p>
                              ) : (
                                  <div className="space-y-2">
                                      {tempOrders.map((order, idx) => (
                                          <div key={idx} className={`flex flex-col gap-1 pb-2 border-b last:border-0 ${isDinner ? 'border-[#334155]' : 'border-gray-100'}`}>
                                              <div className="flex justify-between items-start">
                                                  <div className="flex flex-col">
                                                      <span className={`font-semibold text-sm ${textColor}`}>{order.name}</span>
                                                      <span className={`text-[10px] font-bold ${accentColor} uppercase`}>{order.course}</span>
                                                  </div>
                                                  <div className="flex items-center gap-1">
                                                      <Button variant="ghost" size="icon" className="h-6 w-6 text-[#967D62]" onClick={() => { setEditingNoteFor(idx); setTempNoteText(order.note); }}><Edit3 className="w-3.5 h-3.5" /></Button>
                                                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => removeOrderItem(idx)}><X className="w-3.5 h-3.5" /></Button>
                                                  </div>
                                              </div>
                                              {editingNoteFor === idx ? (
                                                  <div className="flex gap-2 mt-1">
                                                      <Input value={tempNoteText} onChange={e => setTempNoteText(e.target.value)} placeholder="Note piatto..." className={`h-7 text-xs ${isDinner ? 'bg-[#0F172A] border-[#475569]' : ''}`} autoFocus />
                                                      <Button size="sm" className="h-7 px-2 bg-[#967D62] text-white hover:bg-[#7A654E]" onClick={() => saveNote(idx)}><Check className="w-3 h-3"/></Button>
                                                  </div>
                                              ) : order.note && (
                                                  <span className="text-xs text-orange-500 font-medium bg-orange-500/10 px-2 py-0.5 rounded-md w-fit">Note: {order.note}</span>
                                              )}
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
                          {renderOrderSections()}
                      </div>
                      
                  /* 4. SE TAVOLO IN ATTESA / SERVITO / DA SPARECCHIARE */
                  ) : (
                      <div className="flex flex-col items-center justify-center h-full space-y-5 pt-6 px-2">

                          {/* WAITING: ordine in cucina — gestito automaticamente */}
                          {activeTable.status === 'waiting' && !isAddingMore && (
                              <>
                                  <div className="bg-slate-500/20 text-slate-500 w-24 h-24 rounded-full flex items-center justify-center">
                                      <ChefHat className="w-12 h-12" />
                                  </div>
                                  <div className="text-center space-y-1">
                                      <h3 className={`text-2xl font-bold ${textColor}`}>Ordine in Cucina</h3>
                                      <p className={mutedText}>
                                          {activeTable.orderMode === 'courses'
                                              ? `Portata ${activeTable.currentCourse}/${activeTable.totalCourses} · La consegna verrà segnata automaticamente`
                                              : 'La consegna verrà segnata automaticamente'}
                                      </p>
                                  </div>
                                  {/* mostra conto secondi rimanenti se c'è un pending */}
                                  {(() => {
                                      const pending = pendingDeliveries.find(d => d.tableId === activeTable.id);
                                      if (!pending) return null;
                                      const secsLeft = Math.max(0, Math.ceil((pending.deliverAt - Date.now()) / 1000));
                                      return (
                                          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${isDinner ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                              <Clock className="w-4 h-4" />
                                              Consegna automatica tra {secsLeft}s
                                          </div>
                                      );
                                  })()}
                                  {/* Ordina Altro disponibile anche mentre è in cucina */}
                                  <button
                                      onClick={() => { setIsAddingMore(true); setActiveCourseTab(null); setActiveMenuCategory(null); }}
                                      className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${isDinner ? 'bg-[#1E293B] border border-[#334155] text-[#F4F1EA] hover:border-[#967D62] hover:text-[#967D62]' : 'bg-white border border-[#EAE5DA] text-[#2C2A28] hover:border-[#967D62] hover:text-[#967D62]'}`}
                                  >
                                      <Plus className="w-4 h-4" /> Ordina Altro (nuova portata)
                                  </button>
                              </>
                          )}

                          {/* WAITING + isAddingMore: menu per ordinare altra portata */}
                          {activeTable.status === 'waiting' && isAddingMore && (
                              <div className="w-full space-y-4">
                                  <div className={`p-3 rounded-xl border ${isDinner ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#EAE5DA]'}`}>
                                      <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${mutedText}`}>Nuova portata da aggiungere</h4>
                                      {tempOrders.length > 0 && (
                                          <div className="space-y-1 max-h-24 overflow-y-auto">
                                              {tempOrders.map((o, idx) => (
                                                  <div key={idx} className="flex justify-between items-center text-xs">
                                                      <span className={textColor}>{o.name}</span>
                                                      <Button variant="ghost" size="icon" className="h-5 w-5 text-red-400" onClick={() => removeOrderItem(idx)}><X className="w-3 h-3"/></Button>
                                                  </div>
                                              ))}
                                          </div>
                                      )}
                                  </div>
                                  {renderOrderSections()}
                              </div>
                          )}

                          {/* SERVED: tutto portato — il cameriere sceglie */}
                          {activeTable.status === 'served' && (
                              <>
                                  <div className="bg-[#967D62]/20 text-[#967D62] w-24 h-24 rounded-full flex items-center justify-center">
                                      <CheckCircle2 className="w-12 h-12" />
                                  </div>
                                  <div className="text-center space-y-1">
                                      <h3 className={`text-2xl font-bold ${textColor}`}>Tutto Portato</h3>
                                      <p className={mutedText}>Cosa vuoi fare?</p>
                                  </div>
                                  <div className="w-full grid grid-cols-1 gap-3 mt-2">
                                      <button
                                          onClick={() => { setIsAddingMore(true); setActiveCourseTab(null); setActiveMenuCategory(null); }}
                                          className={`flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm transition-all ${isDinner ? 'bg-[#1E293B] border border-[#334155] text-[#F4F1EA] hover:border-[#967D62] hover:text-[#967D62]' : 'bg-white border border-[#EAE5DA] text-[#2C2A28] hover:border-[#967D62] hover:text-[#967D62]'}`}
                                      >
                                          <Plus className="w-4 h-4" /> Ordina Altro
                                      </button>
                                  </div>
                              </>
                          )}

                          {/* SERVED + isAddingMore: menu per ordinare altro */}
                          {activeTable.status === 'served' && isAddingMore && (
                              <div className="w-full space-y-4">
                                  <div className={`p-3 rounded-xl border ${isDinner ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#EAE5DA]'}`}>
                                      <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${mutedText}`}>Cosa ordinano?</h4>
                                      {tempOrders.length > 0 && (
                                          <div className="space-y-1 max-h-24 overflow-y-auto">
                                              {tempOrders.map((o, idx) => (
                                                  <div key={idx} className="flex justify-between items-center text-xs">
                                                      <span className={textColor}>{o.name}</span>
                                                      <Button variant="ghost" size="icon" className="h-5 w-5 text-red-400" onClick={() => removeOrderItem(idx)}><X className="w-3 h-3"/></Button>
                                                  </div>
                                              ))}
                                          </div>
                                      )}
                                  </div>
                                  {renderOrderSections()}
                              </div>
                          )}

                          {/* DIRTY: da sparecchiare */}
                          {activeTable.status === 'dirty' && (
                              <>
                                  <div className="bg-rose-500/20 text-rose-500 w-24 h-24 rounded-full flex items-center justify-center">
                                      <Trash2 className="w-12 h-12" />
                                  </div>
                                  <div className="text-center space-y-1">
                                      <h3 className={`text-2xl font-bold ${textColor}`}>Sparecchiare</h3>
                                      <p className={mutedText}>Il tavolo è pronto per essere liberato.</p>
                                  </div>
                              </>
                          )}
                      </div>
                  )}
              </div>

              {/* FOOTER DEL DRAWER */}
              <div className={`p-4 sm:p-6 border-t shrink-0 ${isDinner ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#EAE5DA]'}`}>
                  {activeTable.status === 'free' ? (
                      <Button className={`w-full py-6 text-base font-bold shadow-md bg-[#967D62] hover:bg-[#7A654E] ${isDinner ? 'text-[#F4F1EA]' : 'text-white'}`} disabled={!orderSetupPax} onClick={seatTable}>
                          Salva e Occupa Tavolo <ChevronRight className="w-5 h-5 ml-2" />
                      </Button>
                  ) : activeTable.status === 'seated' ? (
                      <Button className={`w-full py-6 text-base font-bold shadow-md bg-[#967D62] hover:bg-[#7A654E] ${isDinner ? 'text-[#F4F1EA]' : 'text-white'}`} disabled={!orderSetupMode || tempOrders.length === 0} onClick={() => saveOrderToTable('waiting', 1)}>
                          Manda Ordine in Cucina <ChevronRight className="w-5 h-5 ml-2" />
                      </Button>
                  ) : (activeTable.status === 'waiting' || activeTable.status === 'served') && isAddingMore ? (
                      /* Footer per "ordina altro" */
                      <div className="flex gap-2">
                          <Button variant="outline" className={`flex-1 py-6 font-bold ${isDinner ? 'border-[#334155] text-[#94A3B8]' : 'border-[#EAE5DA] text-[#8C8A85]'}`} onClick={() => { setIsAddingMore(false); setTempOrders(activeTable.orders || []); }}>
                              Annulla
                          </Button>
                          <Button className="flex-1 py-6 text-base font-bold shadow-md bg-[#967D62] hover:bg-[#7A654E] text-white" disabled={tempOrders.length === 0} onClick={() => { saveOrderToTable('waiting', (activeTable.currentCourse || 0) + 1); setIsAddingMore(false); }}>
                              Manda in Cucina <ChevronRight className="w-5 h-5 ml-2" />
                          </Button>
                      </div>
                  ) : activeTable.status === 'waiting' ? (
                      /* Waiting senza isAddingMore: nessun bottone manuale, gestito dalla cucina */
                      <Button variant="outline" className={`w-full py-4 font-bold ${isDinner ? 'border-[#334155] text-[#94A3B8]' : 'border-[#EAE5DA] text-[#8C8A85]'}`} onClick={closeDrawer}>
                          Chiudi
                      </Button>
                  ) : activeTable.status === 'served' && !isAddingMore ? (
                      /* Served: bottone clienti alzati */
                      <Button className="w-full py-6 text-base font-bold shadow-md bg-rose-600 hover:bg-rose-700 text-white" onClick={() => {
                          setTables(tables.map(t => t.id === activeTableId ? { ...t, status: 'dirty' } : t));
                          // Emette il conto al momento in cui i clienti si alzano
                          const billOrders = activeTable.orders || [];
                          const reservation = reservations.find(r => r.tableId === activeTable.id && r.isSeated);
                          setOpenBills(prev => {
                              const others = prev.filter(b => b.tableId !== activeTable.id);
                              return [...others, {
                                  tableId: activeTable.id, label: activeTable.label,
                                  orders: billOrders,
                                  total: billOrders.reduce((s, o) => s + getDishPrice(o.name), 0),
                                  reservationName: reservation?.name || activeTable.reservationName,
                                  pax: activeTable.pax, paid: false,
                              }];
                          });
                          closeDrawer();
                      }}>
                          Clienti Alzati — Sparecchiare <ChevronRight className="w-5 h-5 ml-2" />
                      </Button>
                  ) : activeTable.status === 'dirty' ? (
                      <Button className="w-full py-6 text-base font-bold shadow-md bg-[#967D62] hover:bg-[#7A654E] text-white" onClick={advanceTableState}>
                          Libera Tavolo
                      </Button>
                  ) : (
                      <Button variant="outline" className={`w-full py-4 font-bold ${isDinner ? 'border-[#334155] text-[#94A3B8]' : 'border-[#EAE5DA] text-[#8C8A85]'}`} onClick={closeDrawer}>
                          Chiudi
                      </Button>
                  )}
              </div>
          </>
      );
  };

  // ===================================================================
  // RENDER: DRAWER GESTIONALE (solo visualizzazione + seat/libera, NO ordini)
  // ===================================================================
  const renderGestionaleDrawer = () => {
      if (!activeTable) return null;
      return (
          <>
              <div className={`p-4 sm:p-6 border-b shrink-0 flex items-center justify-between ${isDinner ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#EAE5DA]'}`}>
                  <div>
                      <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${textColor}`}>{activeTable.label}</h2>
                      <p className={`text-xs sm:text-sm mt-0.5 ${mutedText}`}>{activeTable.status === 'free' ? 'Tavolo Libero' : activeTable.reservationName || 'Walk-in'}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={closeDrawer} className="rounded-full hover:bg-black/5 dark:hover:bg-white/5"><X className={`w-6 h-6 ${textColor}`} /></Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                  {/* SE TAVOLO LIBERO -> solo pax + occupa (walk-in) */}
                  {activeTable.status === 'free' ? (
                      <div className="space-y-6 animate-in fade-in flex flex-col items-center justify-center h-full">
                          <div className="space-y-4 text-center">
                              <Label className={`text-sm font-bold uppercase tracking-wider ${mutedText}`}>Numero Persone (Walk-in)</Label>
                              <div className="flex items-center justify-center gap-3">
                                  <Button variant="outline" size="icon" onClick={() => setOrderSetupPax(String(Math.max(1, parseInt(orderSetupPax || '1') - 1)))} className={`w-12 h-12 rounded-full ${isDinner ? 'border-[#334155] text-[#F4F1EA]' : ''}`}>-</Button>
                                  <Input type="number" min="1" value={orderSetupPax} onChange={e => setOrderSetupPax(e.target.value)} className={`w-24 text-center font-bold text-3xl h-16 rounded-2xl ${isDinner ? 'bg-[#1E293B] border-[#334155] text-[#F4F1EA]' : 'bg-white'}`} />
                                  <Button variant="outline" size="icon" onClick={() => setOrderSetupPax(String(parseInt(orderSetupPax || '1') + 1))} className={`w-12 h-12 rounded-full ${isDinner ? 'border-[#334155] text-[#F4F1EA]' : ''}`}>+</Button>
                              </div>
                          </div>
                      </div>
                  ) : (
                      /* SE TAVOLO OCCUPATO / IN ATTESA / SERVITO / DA SPARECCHIARE -> solo visualizza stato */
                      <div className="flex flex-col items-center justify-center h-full space-y-6 pt-10">
                          <div className={`w-24 h-24 rounded-full flex items-center justify-center 
                              ${activeTable.status === 'seated' ? 'bg-amber-500/20 text-amber-500' : ''}
                              ${activeTable.status === 'waiting' ? 'bg-slate-500/20 text-slate-500' : ''} 
                              ${activeTable.status === 'served' ? 'bg-[#967D62]/20 text-[#967D62]' : ''} 
                              ${activeTable.status === 'dirty' ? 'bg-rose-500/20 text-rose-500' : ''}`}>
                              {activeTable.status === 'seated' ? <UsersRound className="w-12 h-12" /> :
                               activeTable.status === 'waiting' ? <ChefHat className="w-12 h-12" /> : 
                               activeTable.status === 'served' ? <CheckCircle2 className="w-12 h-12" /> : 
                               <Trash2 className="w-12 h-12" />}
                          </div>
                          <div className="text-center space-y-1">
                              <h3 className={`text-2xl font-bold ${textColor}`}>
                                  {activeTable.status === 'seated' ? `Occupato (${activeTable.pax} pax)` :
                                   activeTable.status === 'waiting' ? 'Ordine in Cucina' : 
                                   activeTable.status === 'served' ? 'Tavolo Servito' : 'Sparecchiare'}
                              </h3>
                              <p className={mutedText}>
                                  {activeTable.status === 'seated' ? 'In attesa di ordinazione dal personale' :
                                   activeTable.status === 'waiting' ? (activeTable.orderMode === 'courses' ? `Portata ${activeTable.currentCourse}/${activeTable.totalCourses}` : 'Servizio unico') :
                                   activeTable.status === 'served' ? 'Tutti i piatti consegnati' : 'In attesa di pulizia'}
                              </p>
                          </div>
                          {activeTable.orders && activeTable.orders.length > 0 && (
                              <div className={`w-full p-4 rounded-xl border ${isDinner ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#EAE5DA]'}`}>
                                  <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${mutedText}`}>Comanda ({activeTable.orders.length} piatti)</h4>
                                  <div className="space-y-1">
                                      {activeTable.orders.map((order, idx) => (
                                          <div key={idx} className={`text-sm ${textColor}`}>
                                              <span className="font-medium">{order.name}</span>
                                              {order.note && <span className="text-xs text-orange-500 ml-2">({order.note})</span>}
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          )}
                      </div>
                  )}
              </div>

              {/* FOOTER: solo seat per tavoli liberi, solo libera per dirty */}
              <div className={`p-4 sm:p-6 border-t shrink-0 ${isDinner ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#EAE5DA]'}`}>
                  {activeTable.status === 'free' ? (
                      <Button className={`w-full py-6 text-base font-bold shadow-md bg-[#967D62] hover:bg-[#7A654E] ${isDinner ? 'text-[#F4F1EA]' : 'text-white'}`} disabled={!orderSetupPax} onClick={seatTable}>
                          Accomoda Walk-in <ChevronRight className="w-5 h-5 ml-2" />
                      </Button>
                  ) : activeTable.status === 'dirty' ? (
                      <Button className={`w-full py-6 text-base font-bold shadow-md bg-[#967D62] hover:bg-[#7A654E] text-white`} onClick={advanceTableState}>
                          Libera Tavolo
                      </Button>
                  ) : (
                      <Button variant="outline" className={`w-full py-6 text-base font-bold ${isDinner ? 'border-[#334155] text-[#94A3B8]' : 'border-[#EAE5DA] text-[#8C8A85]'}`} onClick={closeDrawer}>
                          Chiudi
                      </Button>
                  )}
              </div>
          </>
      );
  };

  // ===================================================================
  // SCHERMATA 0: LOGIN / REGISTRAZIONE
  // ===================================================================
  if (!isLoggedIn) {
      return (
        <div className={`flex min-h-screen w-full items-center justify-center font-sans transition-all duration-700 ${bgColor}`}>
            <div className={`w-full max-w-md p-8 md:p-10 rounded-2xl shadow-xl border flex flex-col items-center relative overflow-hidden ${cardBg}`}>
              <div className="flex items-center justify-center gap-4 mb-8 w-full">
                <div className="flex aspect-square size-16 items-center justify-center rounded-2xl bg-[#F4F1EA] shrink-0 border border-[#EAE5DA]">
                  <img src="/alea-logo.jpeg" alt="ALEA Logo" className="w-[75%] h-[75%] object-contain" />
                </div>
                <svg viewBox="0 0 108 40" className={`h-12 w-auto ${isDinner ? 'text-[#F4F1EA]' : 'text-[#3E2723]'}`} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="square" strokeLinejoin="miter">
                  <polyline points="2,32 14,8 26,32" /><polyline points="34,8 34,32 50,32" /><polyline points="74,8 58,8 58,32 74,32" /><line x1="58" y1="20" x2="70" y2="20" /><polyline points="82,32 94,8 106,32" />
                </svg>
              </div>

              {registerSuccess ? (
                <div className="w-full text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className={`text-xl font-bold ${textColor}`}>Account creato!</h2>
                  <p className={`text-sm ${mutedText}`}>Controlla la tua email per confermare l'account, poi accedi.</p>
                  <Button onClick={() => { setAuthMode('login'); setRegisterSuccess(false); setLoginError(''); }} className="w-full h-12 mt-4 bg-[#967D62] hover:bg-[#7A654E] text-white font-semibold">
                    Vai al Login
                  </Button>
                </div>
              ) : (
                <>
                  <div className="text-center w-full space-y-2 mb-8">
                    <h1 className={`text-2xl font-bold tracking-tight ${textColor}`}>
                      {authMode === 'login' ? 'Bentornato' : 'Crea account'}
                    </h1>
                    <p className={`${mutedText} text-base`}>
                      {authMode === 'login' ? 'Accedi al pannello operativo.' : 'Registra un nuovo accesso ad ALEA.'}
                    </p>
                  </div>
                  <div className="w-full space-y-5">
                    <div className="space-y-2">
                      <Label className={`font-bold ${textColor}`}>Email</Label>
                      <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (authMode === 'login' ? handleLogin() : handleRegister())} placeholder="email@alea.it" className={`h-12 text-base shadow-sm focus-visible:ring-[#967D62]/50 ${isDinner ? 'bg-[#0F172A] border-[#334155] text-[#F4F1EA]' : 'bg-[#F4F1EA]/50 border-[#EAE5DA] text-[#2C2A28]'}`} />
                    </div>
                    <div className="space-y-2">
                      <Label className={`font-bold ${textColor}`}>Password</Label>
                      <Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (authMode === 'login' ? handleLogin() : handleRegister())} placeholder={authMode === 'register' ? 'Minimo 6 caratteri' : ''} className={`h-12 text-base tracking-widest shadow-sm focus-visible:ring-[#967D62]/50 ${isDinner ? 'bg-[#0F172A] border-[#334155] text-[#F4F1EA]' : 'bg-[#F4F1EA]/50 border-[#EAE5DA] text-[#2C2A28]'}`} />
                    </div>
                    {loginError && <p className="text-red-500 text-sm font-medium text-center">{loginError}</p>}
                  </div>
                  <Button
                    onClick={authMode === 'login' ? handleLogin : handleRegister}
                    disabled={loginLoading}
                    className={`w-full h-12 mt-8 font-semibold text-base shadow-md transition-all hover:shadow-lg bg-[#967D62] hover:bg-[#7A654E] disabled:opacity-60 ${isDinner ? 'text-[#F4F1EA]' : 'text-white'}`}
                  >
                    {loginLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (authMode === 'login' ? 'Accedi al Gestionale' : 'Crea Account')}
                  </Button>
                  <button
                    onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setLoginError(''); }}
                    className={`mt-4 text-sm ${accentColor} hover:underline`}
                  >
                    {authMode === 'login' ? 'Non hai un account? Registrati qui' : 'Hai già un account? Accedi'}
                  </button>
                </>
              )}
            </div>
        </div>
      );
  }

  // ===================================================================
  // SCHERMATA 1: SELEZIONE RUOLO (dopo login, prima di entrare)
  // ===================================================================
  if (appRole === null) {
      return (
        <div className={`flex min-h-screen w-full items-center justify-center font-sans transition-all duration-700 ${bgColor}`}>
            <div className="w-full max-w-3xl px-6">
                {/* HEADER CON LOGO */}
                <div className="flex flex-col items-center mb-12">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex aspect-square size-14 items-center justify-center rounded-2xl bg-[#F4F1EA] shrink-0 shadow-md border border-[#EAE5DA]">
                            <img src="/alea-logo.jpeg" alt="ALEA Logo" className="w-[75%] h-[75%] object-contain" />
                        </div>
                        <svg viewBox="0 0 108 40" className={`h-10 w-auto ${isDinner ? 'text-[#F4F1EA]' : 'text-[#3E2723]'}`} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="square" strokeLinejoin="miter">
                            <polyline points="2,32 14,8 26,32" /><polyline points="34,8 34,32 50,32" /><polyline points="74,8 58,8 58,32 74,32" /><line x1="58" y1="20" x2="70" y2="20" /><polyline points="82,32 94,8 106,32" />
                        </svg>
                    </div>
                    <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${textColor}`}>Seleziona Modalità</h1>
                    <p className={`${mutedText} mt-2 text-base`}>Scegli come accedere al sistema oggi.</p>
                </div>

                {/* CARDS SELEZIONE */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    
                    {/* GESTIONALE */}
                    <button
                        onClick={() => { setAppRole('gestionale'); setActiveView('Dashboard'); try { localStorage.setItem('alea_role','gestionale'); } catch {} }}
                        className={`group flex flex-col items-center justify-center p-8 sm:p-10 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl cursor-pointer ${isDinner ? 'border-[#334155] bg-[#1E293B] hover:border-[#967D62]' : 'border-[#EAE5DA] bg-white hover:border-[#967D62] shadow-sm'}`}
                    >
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-5 transition-colors ${isDinner ? 'bg-[#967D62]/10 group-hover:bg-[#967D62]/20' : 'bg-[#967D62]/10 group-hover:bg-[#967D62]/20'}`}>
                            <UserCog className={`w-10 h-10 ${accentColor}`} />
                        </div>
                        <h2 className={`text-xl font-bold tracking-tight mb-2 ${textColor}`}>Gestionale</h2>
                        <p className={`text-sm text-center leading-relaxed ${mutedText}`}>
                            Dashboard, previsioni, pianificazione, prenotazioni e impostazioni.
                        </p>
                    </button>

                    {/* PERSONALE — disabilitato */}
                    <div className={`relative flex flex-col items-center justify-center p-8 sm:p-10 rounded-2xl border-2 cursor-not-allowed select-none ${isDinner ? 'border-[#1E293B] bg-[#131C2A]' : 'border-[#E5E5E5] bg-[#F9F9F9] shadow-sm'}`}>
                        <span className={`absolute top-3 right-3 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${isDinner ? 'bg-[#1E293B] text-[#475569]' : 'bg-[#EEEEEE] text-[#AAAAAA]'}`}>In arrivo</span>
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-5 ${isDinner ? 'bg-[#1E293B]' : 'bg-[#EEEEEE]'}`}>
                            <ClipboardList className={`w-10 h-10 ${isDinner ? 'text-[#334155]' : 'text-[#CCCCCC]'}`} />
                        </div>
                        <h2 className={`text-xl font-bold tracking-tight mb-2 ${isDinner ? 'text-[#334155]' : 'text-[#BBBBBB]'}`}>Personale</h2>
                        <p className={`text-sm text-center leading-relaxed ${isDinner ? 'text-[#2D3748]' : 'text-[#CCCCCC]'}`}>
                            Gestione sala, ordini, comande e stato dei tavoli.
                        </p>
                    </div>

                    {/* CUCINA — disabilitato */}
                    <div className={`relative flex flex-col items-center justify-center p-8 sm:p-10 rounded-2xl border-2 cursor-not-allowed select-none ${isDinner ? 'border-[#1E293B] bg-[#131C2A]' : 'border-[#E5E5E5] bg-[#F9F9F9] shadow-sm'}`}>
                        <span className={`absolute top-3 right-3 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${isDinner ? 'bg-[#1E293B] text-[#475569]' : 'bg-[#EEEEEE] text-[#AAAAAA]'}`}>In arrivo</span>
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-5 ${isDinner ? 'bg-[#1E293B]' : 'bg-[#EEEEEE]'}`}>
                            <CookingPot className={`w-10 h-10 ${isDinner ? 'text-[#334155]' : 'text-[#CCCCCC]'}`} />
                        </div>
                        <h2 className={`text-xl font-bold tracking-tight mb-2 ${isDinner ? 'text-[#334155]' : 'text-[#BBBBBB]'}`}>Cucina</h2>
                        <p className={`text-sm text-center leading-relaxed ${isDinner ? 'text-[#2D3748]' : 'text-[#CCCCCC]'}`}>
                            Visualizza le comande in arrivo e gestisci le preparazioni in tempo reale.
                        </p>
                    </div>
                </div>

                {/* LOGOUT */}
                <div className="flex justify-center mt-8">
                    <Button variant="ghost" onClick={handleLogout} className={`text-sm ${mutedText} hover:text-red-500`}>
                        <ArrowRightCircle className="w-4 h-4 mr-2 rotate-180" /> Esci / Cambia Account
                    </Button>
                </div>
            </div>
        </div>
      );
  }

  // ===================================================================
  // SCHERMATA 2: CUCINA
  // ===================================================================
  if (appRole === 'cucina') {
      const selectedTicket = kitchenTickets.find(t => t.id === selectedKitchenTicketId);
      // Ordina per timestamp (prima chi ha ordinato prima)
      const sortedTickets = [...kitchenTickets].sort((a, b) => a.timestamp - b.timestamp);

      return (
        <div className={`w-full min-h-screen font-sans transition-colors duration-500 ${bgColor} flex flex-col`}>

          {/* HEADER CUCINA */}
          <header className={`relative flex min-h-16 shrink-0 items-center justify-between border-b px-4 sm:px-6 py-2 flex-wrap gap-2 ${bgColor} ${isDinner ? 'border-[#334155]' : 'border-[#EAE5DA]'}`}>
              <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex aspect-square size-7 sm:size-8 items-center justify-center rounded-lg bg-[#F4F1EA] shrink-0 shadow-sm border border-[#EAE5DA]">
                      <img src="/alea-logo.jpeg" alt="ALEA Logo" className="w-[75%] h-[75%] object-contain" />
                  </div>
                  <div className="flex items-center gap-2">
                      <svg viewBox="0 0 108 40" className={`h-3.5 sm:h-5 w-auto ${isDinner ? 'text-[#F4F1EA]' : 'text-[#3E2723]'}`} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="square" strokeLinejoin="miter">
                          <polyline points="2,32 14,8 26,32" /><polyline points="34,8 34,32 50,32" /><polyline points="74,8 58,8 58,32 74,32" /><line x1="58" y1="20" x2="70" y2="20" /><polyline points="82,32 94,8 106,32" />
                      </svg>
                      <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${isDinner ? 'bg-[#967D62]/20 text-[#967D62]' : 'bg-[#967D62]/15 text-[#7A654E]'}`}>Cucina</span>
                  </div>
              </div>
              <div className="flex items-center gap-2">
                  {/* badge con numero comande in attesa */}
                  {sortedTickets.length > 0 && (
                      <span className={`text-sm font-bold px-3 py-1 rounded-full ${isDinner ? 'bg-[#967D62]/20 text-[#967D62]' : 'bg-[#967D62]/15 text-[#7A654E]'}`}>
                          {sortedTickets.length} {sortedTickets.length === 1 ? 'comanda' : 'comande'} in attesa
                      </span>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setAppRole(null)} className={`text-xs ${mutedText} hover:text-red-500 px-2`}>
                      <ArrowRightCircle className="w-3.5 h-3.5 rotate-180" />
                  </Button>
              </div>
          </header>

          {/* CONTENUTO CUCINA */}
          <main className="flex-1 p-4 sm:p-6 w-full max-w-[1600px] mx-auto">

              {sortedTickets.length === 0 ? (
                  /* STATO VUOTO */
                  <div className={`flex flex-col items-center justify-center h-64 rounded-2xl border-2 border-dashed mt-4 ${isDinner ? 'border-[#334155]' : 'border-[#D1CCC0]'}`}>
                      <CookingPot className={`w-12 h-12 mb-3 ${mutedText}`} />
                      <p className={`font-bold text-lg ${mutedText}`}>Nessuna comanda in attesa</p>
                      <p className={`text-sm mt-1 ${mutedText}`}>Le nuove comande appariranno qui automaticamente.</p>
                  </div>
              ) : (
                  /* GRIGLIA COMANDE */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                      {sortedTickets.map((ticket, idx) => {
                          const isSelected = selectedKitchenTicketId === ticket.id;
                          const waitingMinutes = Math.floor((Date.now() - ticket.timestamp) / 60000);
                          const isUrgent = waitingMinutes >= 15;

                          return (
                              <div
                                  key={ticket.id}
                                  onClick={() => setSelectedKitchenTicketId(isSelected ? null : ticket.id)}
                                  className={`rounded-2xl border-2 cursor-pointer transition-all duration-200 overflow-hidden
                                      ${isSelected
                                          ? 'border-orange-500 shadow-lg shadow-orange-500/20 scale-[1.02]'
                                          : isUrgent
                                              ? (isDinner ? 'border-red-700 bg-red-950/30' : 'border-red-300 bg-red-50')
                                              : (isDinner ? 'border-[#334155] bg-[#1E293B] hover:border-[#967D62]' : 'border-[#EAE5DA] bg-white hover:border-[#967D62]')
                                      }`}
                              >
                                  {/* HEADER TICKET */}
                                  <div className={`px-4 py-3 flex items-center justify-between border-b
                                      ${isSelected
                                          ? 'bg-orange-500 border-orange-600'
                                          : isUrgent
                                              ? (isDinner ? 'bg-red-900/50 border-red-800' : 'bg-red-100 border-red-200')
                                              : (isDinner ? 'bg-[#0F172A] border-[#334155]' : 'bg-gray-50 border-[#EAE5DA]')
                                      }`}
                                  >
                                      <div>
                                          <span className={`font-bold text-base ${isSelected ? 'text-white' : textColor}`}>{ticket.label}</span>
                                          {ticket.reservationName && (
                                              <span className={`block text-xs ${isSelected ? 'text-orange-100' : mutedText}`}>{ticket.reservationName}</span>
                                          )}
                                      </div>
                                      <div className="text-right">
                                          {ticket.orderMode === 'courses' && (
                                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : (isDinner ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600')}`}>
                                                  Portata {ticket.currentCourse}/{ticket.totalCourses}
                                              </span>
                                          )}
                                          {ticket.orderMode === 'together' && (
                                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : (isDinner ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600')}`}>
                                                  Tutto insieme
                                              </span>
                                          )}
                                          <span className={`block text-[10px] mt-1 font-semibold ${isUrgent ? 'text-red-500' : (isSelected ? 'text-orange-100' : mutedText)}`}>
                                              {waitingMinutes === 0 ? 'Ora' : `${waitingMinutes} min fa`}
                                              {isUrgent && ' ⚠️'}
                                          </span>
                                      </div>
                                  </div>

                                  {/* LISTA PIATTI */}
                                  <div className="p-4 space-y-2">
                                      {ticket.dishes.map((dish, dIdx) => (
                                          <div key={dIdx} className={`flex items-start gap-2`}>
                                              <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${isSelected ? 'bg-orange-500 text-white' : (isDinner ? 'bg-[#334155] text-[#94A3B8]' : 'bg-gray-100 text-gray-500')}`}>{dIdx + 1}</span>
                                              <div className="flex-1 min-w-0">
                                                  <span className={`font-semibold text-sm ${textColor}`}>{dish.name}</span>
                                                  {dish.note && (
                                                      <span className="block text-xs text-orange-500 font-medium mt-0.5">⚠ {dish.note}</span>
                                                  )}
                                              </div>
                                          </div>
                                      ))}
                                  </div>

                                  {/* BOTTONE CONFERMA — appare solo se selezionato */}
                                  {isSelected && (
                                      <div className="px-4 pb-4">
                                          <Button
                                              onClick={(e) => { e.stopPropagation(); dismissKitchenTicket(ticket.id); }}
                                              className="w-full py-3 font-bold text-base bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-md"
                                          >
                                              <CheckCircle2 className="w-5 h-5 mr-2" />
                                              {ticket.orderMode === 'courses' && ticket.currentCourse < ticket.totalCourses
                                                  ? `Portata ${ticket.currentCourse} Uscita ✓`
                                                  : 'Comanda Uscita ✓'
                                              }
                                          </Button>
                                          <button onClick={(e) => { e.stopPropagation(); setSelectedKitchenTicketId(null); }} className={`w-full text-xs mt-2 py-1 ${mutedText} hover:text-red-500`}>
                                              Annulla selezione
                                          </button>
                                      </div>
                                  )}
                              </div>
                          );
                      })}
                  </div>
              )}
          </main>
        </div>
      );
  }

  // ===================================================================
  // SCHERMATA 3: PERSONALE (solo gestione sala con ordini)
  // ===================================================================
  if (appRole === 'personale') {
      return (
        <div className={`w-full overflow-hidden ${bgColor} transition-colors duration-500 min-h-screen font-sans relative`}>
          {/* HEADER PERSONALE */}
          <header className={`relative flex min-h-16 shrink-0 items-center justify-between border-b px-3 sm:px-6 py-2 flex-wrap gap-2 ${bgColor} ${isDinner ? 'border-[#334155]' : 'border-[#EAE5DA]'}`}>
              <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex aspect-square size-7 sm:size-8 items-center justify-center rounded-lg bg-[#F4F1EA] shrink-0 shadow-sm border border-[#EAE5DA]">
                      <img src="/alea-logo.jpeg" alt="ALEA Logo" className="w-[75%] h-[75%] object-contain" />
                  </div>
                  <div className="flex items-center gap-2">
                      <svg viewBox="0 0 108 40" className={`h-3.5 sm:h-4 md:h-6 w-auto ${isDinner ? 'text-[#F4F1EA]' : 'text-[#3E2723]'}`} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="square" strokeLinejoin="miter">
                          <polyline points="2,32 14,8 26,32" /><polyline points="34,8 34,32 50,32" /><polyline points="74,8 58,8 58,32 74,32" /><line x1="58" y1="20" x2="70" y2="20" /><polyline points="82,32 94,8 106,32" />
                      </svg>
                      <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${isDinner ? 'bg-[#967D62]/20 text-[#967D62]' : 'bg-[#967D62]/10 text-[#967D62]'}`}>Personale</span>
                  </div>
              </div>
              
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
                  <div className={`flex items-center px-2 sm:px-3 py-1.5 rounded-lg border shadow-sm ${isDinner ? 'bg-[#1E293B] border-[#334155] text-[#F4F1EA]' : 'bg-white border-[#EAE5DA] text-[#2C2A28]'}`}>
                      <CalendarDays className={`w-3.5 h-3.5 mr-1 sm:mr-1.5 ${accentColor}`} />
                      <span className="text-[11px] sm:text-sm font-semibold capitalize whitespace-nowrap">
                          <span className="md:hidden">{mobileDate}</span>
                          <span className="hidden md:inline">{formattedDate}</span>
                      </span>
                  </div>

                  <div className={`flex p-0.5 rounded-lg border ${isDinner ? 'bg-[#0F172A] border-[#334155]' : 'bg-black/5 border-[#EAE5DA]'}`}>
                      <button onClick={() => setShift('pranzo')} className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[11px] sm:text-sm font-medium transition-all ${shift === 'pranzo' ? 'bg-white text-[#967D62] shadow-sm' : `text-[#8C8A85] hover:text-[#2C2A28]`}`}>
                          <span className="flex items-center gap-1"><Sun className="w-3 h-3" /> <span className="hidden min-[360px]:inline">Pranzo</span></span>
                      </button>
                      <button onClick={() => setShift('cena')} className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[11px] sm:text-sm font-medium transition-all ${shift === 'cena' ? 'bg-[#334155] text-[#F4F1EA] shadow-sm border border-[#475569]' : `text-[#94A3B8] hover:text-[#E2E8F0]`}`}>
                          <span className="flex items-center gap-1"><Moon className="w-3 h-3" /> <span className="hidden min-[360px]:inline">Cena</span></span>
                      </button>
                  </div>

                  <Button variant="ghost" size="sm" onClick={() => setAppRole(null)} className={`text-xs ${mutedText} hover:text-red-500 px-2`}>
                      <ArrowRightCircle className="w-3.5 h-3.5 rotate-180" />
                  </Button>
              </div>
          </header>

          {/* CONTENUTO SALA PERSONALE */}
          <main className="w-full max-w-[1600px] mx-auto h-[calc(100vh-4rem)] flex flex-col relative overflow-hidden px-3 sm:px-6 md:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4">

              {/* TITOLO */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 mb-4 flex-shrink-0">
                  <div>
                      <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${textColor}`}>Gestione Sala</h1>
                      <p className={`${mutedText} mt-1 text-sm sm:text-base`}>Turno in corso: {shift.toUpperCase()} • {formattedDate}</p>
                  </div>
                  {seatingReservation && (
                      <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-lg animate-pulse text-xs sm:text-sm">
                          <span className="font-bold">Trascina su un tavolo per {seatingReservation.name} ({seatingReservation.pax} pax)</span>
                          <Button variant="ghost" size="sm" className="ml-1 sm:ml-2 h-6 hover:bg-blue-500/20" onClick={() => setSeatingReservation(null)}>Annulla</Button>
                      </div>
                  )}
              </div>

              {/* ZONA TAVOLI — prende tutto lo spazio rimanente, scrolla internamente */}
              <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 flex-1 min-h-0 overflow-hidden">
                  {renderTableMap()}
                  {renderReservationsSidebar()}
              </div>

              {/* ===== SEZIONE CONTO — sempre visibile, indipendente dai tavoli ===== */}
              <div className={`flex-shrink-0 mt-3 rounded-2xl border overflow-hidden ${isDinner ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#EAE5DA] shadow-sm'}`}>
                      <div className={`flex items-center gap-2 px-4 py-2 border-b ${isDinner ? 'border-[#334155]' : 'border-[#EAE5DA]'}`}>
                          <ClipboardList className={`w-4 h-4 ${accentColor}`} />
                          <h2 className={`text-sm font-bold uppercase tracking-wider ${textColor}`}>Conti Aperti</h2>
                          <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${isDinner ? 'bg-[#334155] text-[#94A3B8]' : 'bg-gray-100 text-[#8C8A85]'}`}>{openBills.filter(b => !b.paid).length} da pagare</span>
                      </div>
                      {openBills.length === 0 ? (
                          <div className={`px-4 py-3 text-xs ${mutedText}`}>Nessun conto aperto al momento.</div>
                      ) : (
                          <div className="overflow-x-auto">
                              <div className="flex gap-3 p-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                  {openBills.map(bill => (
                                      <div key={bill.tableId} className={`rounded-xl border p-3 flex-shrink-0 w-52 sm:w-auto transition-all ${bill.paid ? (isDinner ? 'opacity-60 bg-[#0F172A] border-[#334155]' : 'opacity-60 bg-gray-50 border-[#EAE5DA]') : (isDinner ? 'bg-[#0F172A] border-[#334155]' : 'bg-gray-50 border-[#EAE5DA]')}`}>
                                          <div className="flex items-start justify-between mb-1.5">
                                              <div>
                                                  <span className={`text-sm font-bold ${textColor}`}>{bill.label}</span>
                                                  {bill.reservationName && <span className={`block text-xs ${mutedText}`}>{bill.reservationName}{bill.pax ? ` · ${bill.pax} pax` : ''}</span>}
                                                  {!bill.reservationName && bill.pax && <span className={`block text-xs ${mutedText}`}>Walk-in · {bill.pax} pax</span>}
                                              </div>
                                              {/* X per chiudere — visibile solo se pagato */}
                                              {bill.paid && (
                                                  <button onClick={() => dismissBill(bill.tableId)} className={`ml-2 rounded-full p-0.5 hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-colors shrink-0`} title="Chiudi conto">
                                                      <X className="w-3.5 h-3.5" />
                                                  </button>
                                              )}
                                          </div>
                                          <div className="space-y-0.5 mb-2 max-h-16 overflow-y-auto">
                                              {bill.orders.map((order, idx) => (
                                                  <div key={idx} className="flex justify-between items-center text-xs gap-1">
                                                      <span className={`truncate ${bill.paid ? 'line-through opacity-40' : mutedText}`}>{order.name}</span>
                                                      <span className={`font-semibold shrink-0 ${bill.paid ? 'opacity-40' : accentColor}`}>{getDishPrice(order.name) > 0 ? `€${getDishPrice(order.name).toFixed(2)}` : '—'}</span>
                                                  </div>
                                              ))}
                                          </div>
                                          <div className={`pt-2 border-t flex items-center justify-between ${isDinner ? 'border-[#334155]' : 'border-[#EAE5DA]'}`}>
                                              <p className={`text-base font-bold ${bill.paid ? 'text-emerald-500' : textColor}`}>€ {bill.total.toFixed(2)}</p>
                                              {!bill.paid ? (
                                                  <Button onClick={() => markTableAsPaid(bill.tableId)} className="text-xs px-3 py-1 h-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg">
                                                      <Check className="w-3 h-3 mr-1" /> Pagato
                                                  </Button>
                                              ) : (
                                                  <span className="text-xs font-bold text-emerald-500">✓ Saldato</span>
                                              )}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>

              {/* OVERLAY + DRAWER COMANDA COMPLETO */}
              {activeTableId && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity" onClick={closeDrawer} />}
              <div className={`fixed top-0 right-0 h-full w-full sm:w-[450px] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${activeTableId ? 'translate-x-0' : 'translate-x-full'} ${isDinner ? 'bg-[#0F172A] border-l border-[#334155]' : 'bg-[#F4F1EA] border-l border-[#EAE5DA]'}`}>
                  {renderFullDrawer()}
              </div>
          </main>
        </div>
      );
  }

  // ===================================================================
  // SCHERMATA 4: GESTIONALE (tutto il sito originale, senza ordini in sala)
  // ===================================================================
  return (
    <div className={`w-full h-screen overflow-hidden ${bgColor} transition-colors duration-500 font-sans relative`}>
      <SidebarProvider defaultOpen={true} className="h-full">
        <DashboardSidebar activeView={activeView} onViewChange={handleViewChange} pastShiftsStatus={pastShiftsStatus} selectedDate={selectedDate} onSelectDate={setSelectedDate} onLogout={() => { setAppRole(null); }} appRole={appRole} userEmail={userEmail} />
        <SidebarInset className={`w-full h-full overflow-x-hidden overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] ${bgColor} transition-colors duration-500`}>
          
          {/* MODALE GESTIONE MENU */}
          <AnimatePresence>
          {isMenuModalOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              >
                  <motion.div
                    initial={{ scale: 0.92, opacity: 0, y: 12 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.92, opacity: 0, y: 12 }}
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                    className={`relative w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden ${isDinner ? 'bg-[#0F172A] border border-[#334155]' : 'bg-[#F4F1EA] border border-[#EAE5DA]'}`}
                  >
                      <div className={`flex items-center justify-between p-6 border-b shrink-0 ${isDinner ? 'border-[#334155] bg-[#1E293B]' : 'border-[#EAE5DA] bg-white'}`}>
                          <div>
                              <h2 className={`text-2xl font-bold tracking-tight ${textColor}`}>Gestione Disponibilità Menu</h2>
                              <p className={`${mutedText} text-sm mt-1`}>Modifiche valide solo per il turno: <span className="font-semibold text-[#967D62] uppercase">{shift}</span> del <span className="font-semibold text-[#967D62]">{formattedDate}</span>.</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => setIsMenuModalOpen(false)} className={`rounded-full ${isDinner ? 'hover:bg-[#334155] text-white' : 'hover:bg-gray-100'}`}><X className="w-6 h-6" /></Button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              {MENU_CATEGORIES.map((category, idx) => (
                                  <div key={idx} className="space-y-4">
                                      <h3 className={`text-sm font-bold uppercase tracking-widest pb-2 border-b ${isDinner ? 'text-[#94A3B8] border-[#334155]' : 'text-[#8C8A85] border-[#EAE5DA]'}`}>{category.name}</h3>
                                      <div className="flex flex-col gap-2">
                                          {category.items.map((item, itemIdx) => {
                                              const isAvailable = currentMenuState[item] !== false;
                                              return (
                                                  <div key={itemIdx} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${isAvailable ? (isDinner ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#EAE5DA]') : (isDinner ? 'bg-rose-950/20 border-rose-900/50' : 'bg-rose-50 border-rose-100')}`}>
                                                      <span className={`font-semibold text-sm ${isAvailable ? textColor : 'text-rose-600 dark:text-rose-400'}`}>{item}</span>
                                                      <button onClick={() => toggleMenuItem(item)} className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isAvailable ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400'}`}>
                                                          {isAvailable ? (<><Check className="w-3.5 h-3.5" /> Disponibile</>) : (<><XCircle className="w-3.5 h-3.5" /> Esaurito</>)}
                                                      </button>
                                                  </div>
                                              )
                                          })}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                      <div className={`p-4 border-t shrink-0 flex justify-end ${isDinner ? 'border-[#334155] bg-[#1E293B]' : 'border-[#EAE5DA] bg-white'}`}>
                          <Button onClick={() => setIsMenuModalOpen(false)} className={`px-8 font-semibold bg-[#967D62] hover:bg-[#7A654E] ${isDinner ? 'text-[#F4F1EA]' : 'text-white'}`}>Fatto</Button>
                      </div>
                  </motion.div>
              </motion.div>
          )}
          </AnimatePresence>
          <header className={`relative flex h-16 shrink-0 items-center justify-between border-b px-2 sm:px-4 ${bgColor} ${isDinner ? 'border-[#334155]' : 'border-[#EAE5DA]'}`}>
            <div className="flex items-center gap-2 sm:gap-3 z-10">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className={`h-4 hidden md:block ${isDinner ? 'bg-[#334155]' : 'bg-[#D1CCC0]'}`} />
                <div className="flex md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 items-center gap-2 sm:gap-3 md:gap-4">
                    <div className="flex aspect-square size-7 md:size-11 items-center justify-center rounded-lg bg-[#F4F1EA] shrink-0 shadow-sm border border-[#EAE5DA]">
                      <img src="/alea-logo.jpeg" alt="ALEA Logo" className="w-[75%] h-[75%] object-contain" />
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                      <svg viewBox="0 0 108 40" className={`h-3.5 sm:h-4 md:h-7 w-auto mt-0.5 ${isDinner ? 'text-[#F4F1EA]' : 'text-[#3E2723]'}`} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="square" strokeLinejoin="miter">
                        <polyline points="2,32 14,8 26,32" /><polyline points="34,8 34,32 50,32" /><polyline points="74,8 58,8 58,32 74,32" /><line x1="58" y1="20" x2="70" y2="20" /><polyline points="82,32 94,8 106,32" />
                      </svg>
                      <span className="text-[10px] md:text-sm px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-black/5 dark:bg-white/10 font-medium hidden lg:inline-flex items-center">Pilot Mode</span>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center justify-end z-10">
                {activeView !== "Gestione Sala" && (
                    <div className="flex items-center gap-1 sm:gap-2">
                        <div className={`flex items-center px-2 sm:px-4 py-1.5 rounded-lg border shadow-sm transition-colors ${isDinner ? 'bg-[#1E293B] border-[#334155] text-[#F4F1EA]' : 'bg-white border-[#EAE5DA] text-[#2C2A28]'}`}>
                            <CalendarDays className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${accentColor}`} />
                            <span className="text-xs sm:text-sm font-semibold capitalize whitespace-nowrap">
                                <span className="md:hidden">{mobileDate}</span>
                                <span className="hidden md:inline">{formattedDate}</span>
                            </span>
                        </div>

                        <div className={`flex p-0.5 sm:p-1 rounded-lg border ${isDinner ? 'bg-[#0F172A] border-[#334155]' : 'bg-black/5 border-[#EAE5DA]'}`}>
                            <button onClick={() => setShift('pranzo')} className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[11px] sm:text-sm font-medium transition-all ${shift === 'pranzo' ? 'bg-white text-[#967D62] shadow-sm' : `text-[#8C8A85] hover:text-[#2C2A28]`}`}>
                                <span className="flex items-center gap-1"><Sun className="w-3 h-3" /> <span className="hidden min-[380px]:inline">Pranzo</span></span>
                            </button>
                            <button onClick={() => setShift('cena')} className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[11px] sm:text-sm font-medium transition-all ${shift === 'cena' ? 'bg-[#334155] text-[#F4F1EA] shadow-sm border border-[#475569]' : `text-[#94A3B8] hover:text-[#E2E8F0]`}`}>
                                <span className="flex items-center gap-1"><Moon className="w-3 h-3" /> <span className="hidden min-[380px]:inline">Cena</span></span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
          </header>
          
          {/* ── ANIMATED VIEWS WRAPPER ─────────────────────────── */}
          <div style={{ position: 'relative', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <AnimatePresence mode="sync" initial={false} custom={navDirection}>
          <motion.div
            key={activeView}
            custom={navDirection}
            variants={{
              enter: (dir: number) => ({ y: dir > 0 ? '100%' : '-100%' }),
              center: { y: '0%' },
              exit: (dir: number) => ({ y: dir > 0 ? '-100%' : '100%' }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflowY: 'auto', overflowX: 'hidden' }}
            className="[&::-webkit-scrollbar]:hidden [scrollbar-width:none] flex flex-col"
          >

          {/* ========== GESTIONE SALA (GESTIONALE - senza ordini) ========== */}
          {activeView === "Gestione Sala" && (
             <main className="flex-1 p-4 sm:p-6 md:p-8 w-full max-w-[1600px] mx-auto h-[calc(100vh-4rem)] flex flex-col relative overflow-y-auto overflow-x-hidden">
                <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-4 sm:mb-6 flex-shrink-0 z-0">
                    <div>
                        <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${textColor}`}>Gestione Sala</h1>
                        <p className={`${mutedText} mt-1 text-sm sm:text-base`}>Turno in corso: {shift.toUpperCase()} • {formattedDate}</p>
                    </div>
                    {seatingReservation && (
                        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-lg animate-pulse text-xs sm:text-sm">
                            <span className="font-bold">Trascina su un tavolo per {seatingReservation.name} ({seatingReservation.pax} pax)</span>
                            <Button variant="ghost" size="sm" className="ml-1 sm:ml-2 h-6 hover:bg-blue-500/20" onClick={() => setSeatingReservation(null)}>Annulla</Button>
                        </div>
                    )}
                </div>

                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 flex-1 min-h-0 z-0">
                    {renderTableMap()}
                    {renderReservationsSidebar()}
                </div>

                {/* OVERLAY + DRAWER GESTIONALE (no ordini) */}
                {activeTableId && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity" onClick={closeDrawer} />}
                <div className={`fixed top-0 right-0 h-full w-full sm:w-[450px] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${activeTableId ? 'translate-x-0' : 'translate-x-full'} ${isDinner ? 'bg-[#0F172A] border-l border-[#334155]' : 'bg-[#F4F1EA] border-l border-[#EAE5DA]'}`}>
                    {renderGestionaleDrawer()}
                </div>
             </main>
          )}

          {/* ========== PIANIFICAZIONE ========== */}
          {activeView === "Pianificazione" && (
            <PageStagger className="flex-1 flex flex-col min-h-0">
            <SI className="flex-1 flex flex-col min-h-0">
            <PianificazioneView
              isDinner={isDinner} textColor={textColor} mutedText={mutedText}
              cardBg={cardBg} accentColor={accentColor} accentBg={accentBg}
              selectedDate={selectedDate}
              planTab={planTab} setPlanTab={setPlanTab}
              visibleTabs={['sala', 'cucina']}
              hideTabBar
              weekGenerated={weekGenerated} setWeekGenerated={setWeekGenerated} isGeneratingStaff={isGeneratingStaff}
              weeklyStaffData={weeklyStaffData} staffDateRange={staffDateRange}
              generateStaffPlan={generateStaffPlan}
              isGeneratingBudget={isGeneratingBudget} budgetGenerated={budgetGenerated}
              budgetData={budgetData} budgetStartDate={budgetStartDate}
              setBudgetStartDate={setBudgetStartDate} budgetDuration={budgetDuration}
              setBudgetDuration={setBudgetDuration} showBudgetSettings={showBudgetSettings}
              setShowBudgetSettings={setShowBudgetSettings} generateBudgetPlan={generateBudgetPlan}
              ingredients={ingredients} setIngredients={setIngredients}
              recipes={recipes} setRecipes={setRecipes}
              preparations={preparations} setPreparations={setPreparations}
              newIngName={newIngName} setNewIngName={setNewIngName}
              newIngUnit={newIngUnit} setNewIngUnit={setNewIngUnit}
              newIngIdeal={newIngIdeal} setNewIngIdeal={setNewIngIdeal}
              newIngSupplierMode={newIngSupplierMode} setNewIngSupplierMode={setNewIngSupplierMode}
              newIngSupplierName={newIngSupplierName} setNewIngSupplierName={setNewIngSupplierName}
              newIngQtyPerBox={newIngQtyPerBox} setNewIngQtyPerBox={setNewIngQtyPerBox}
              newIngBoxCount={newIngBoxCount} setNewIngBoxCount={setNewIngBoxCount}
              newIngSelectedSupplier={newIngSelectedSupplier} setNewIngSelectedSupplier={setNewIngSelectedSupplier}
              newIngEditingIdeal={newIngEditingIdeal} setNewIngEditingIdeal={setNewIngEditingIdeal}
              newIngPricePerBox={newIngPricePerBox} setNewIngPricePerBox={setNewIngPricePerBox}
              newIngEditingPrice={newIngEditingPrice} setNewIngEditingPrice={setNewIngEditingPrice}
              editingRecipeDish={editingRecipeDish} setEditingRecipeDish={setEditingRecipeDish}
              editingRecipeIngId={editingRecipeIngId} setEditingRecipeIngId={setEditingRecipeIngId}
              editingRecipeQty={editingRecipeQty} setEditingRecipeQty={setEditingRecipeQty}
              editingRecipePcsYield={editingRecipePcsYield} setEditingRecipePcsYield={setEditingRecipePcsYield}
              ingredientSearchText={ingredientSearchText} setIngredientSearchText={setIngredientSearchText}
              dropdownRect={dropdownRect} setDropdownRect={setDropdownRect}
              showVerifyForm={showVerifyForm} setShowVerifyForm={setShowVerifyForm}
              verifyValues={verifyValues} setVerifyValues={setVerifyValues}
              importFeedback={importFeedback} setImportFeedback={setImportFeedback}
              handleInventoryImport={handleInventoryImport}
              newPrepName={newPrepName} setNewPrepName={setNewPrepName}
              newPrepYieldQty={newPrepYieldQty} setNewPrepYieldQty={setNewPrepYieldQty}
              newPrepYieldUnit={newPrepYieldUnit} setNewPrepYieldUnit={setNewPrepYieldUnit}
              editingPrepId={editingPrepId} setEditingPrepId={setEditingPrepId}
              prepIngSearch={prepIngSearch} setPrepIngSearch={setPrepIngSearch}
              prepIngId={prepIngId} setPrepIngId={setPrepIngId}
              prepIngQty={prepIngQty} setPrepIngQty={setPrepIngQty}
              prepDropdownRect={prepDropdownRect} setPrepDropdownRect={setPrepDropdownRect}
              prepBatchQty={prepBatchQty} setPrepBatchQty={setPrepBatchQty}
              newPrepIdealQty={newPrepIdealQty} setNewPrepIdealQty={setNewPrepIdealQty}
              newPrepEditingIdeal={newPrepEditingIdeal} setNewPrepEditingIdeal={setNewPrepEditingIdeal}
              convertToUnit={convertToUnit} isPieceUnit={isPieceUnit} isMeasuredUnit={isMeasuredUnit}
              setActiveView={setActiveView}
              getFestivitaAvviso={getFestivitaAvviso}
              menuPrices={menuPrices} setMenuPrices={setMenuPrices} saveMenuPrice={saveMenuPrice}
              supabase={supabase} isLoggedIn={isLoggedIn}
            />
            </SI>
            </PageStagger>
          )}

          {/* ========== DASHBOARD + PRENOTAZIONI ========== */}
          {(activeView === "Dashboard" || activeView === "Prenotazioni") && (
            <DashboardView
              isDinner={isDinner} textColor={textColor} mutedText={mutedText}
              cardBg={cardBg} accentColor={accentColor} accentBg={accentBg} bgColor={bgColor}
              selectedDate={selectedDate} shift={shift}
              formattedDate={formattedDate} mobileDate={mobileDate}
              isToday={isToday} isTargetShiftClosed={isTargetShiftClosed}
              isShiftOngoing={isShiftOngoing} isLockedByTime={isLockedByTime}
              isSaveDisabled={isSaveDisabled} currentShiftSaved={currentShiftSaved}
              isClosedEntry={isClosedEntry} currentShiftClosed={currentShiftClosed}
              actualCovers={actualCovers} setActualCovers={setActualCovers}
              finalBooked={finalBooked} setFinalBooked={setFinalBooked}
              predictedCovers={predictedCovers} bookedGuests={bookedGuests}
              setBookedGuests={setBookedGuests} previsioneGiorno={previsioneGiorno}
              isLogicError={isLogicError} weather={weather}
              staffAdvice={staffAdvice} cookAdvice={cookAdvice}
              suggestedHosts={suggestedHosts} hostMode={hostMode}
              dailyAttendibilita={dailyAttendibilita}
              handleCloseShift={handleCloseShift} setActiveView={setActiveView}
              reservations={reservations} totalRegisteredPax={totalRegisteredPax}
              newResName={newResName} setNewResName={setNewResName}
              newResPax={newResPax} setNewResPax={setNewResPax}
              newResTime={newResTime} setNewResTime={setNewResTime}
              newResPhone={newResPhone} setNewResPhone={setNewResPhone}
              addReservation={addReservation} deleteReservation={deleteReservation}
              activeView={activeView}
              maxCapacity={maxCapacity}
              setIsMenuModalOpen={setIsMenuModalOpen}
            />
          )}

          {/* ========== IMPOSTAZIONI ========== */}
          {activeView === "Impostazioni" && (
            <ImpostazioniView
              isDinner={isDinner} textColor={textColor} mutedText={mutedText}
              cardBg={cardBg} accentColor={accentColor}
              waiterRatio={waiterRatio} setWaiterRatio={setWaiterRatio}
              cookRatio={cookRatio} setCookRatio={setCookRatio}
              maxCapacity={maxCapacity} setMaxCapacity={setMaxCapacity}
              hostMode={hostMode} setHostMode={setHostMode}
              hostRatio={hostRatio} setHostRatio={setHostRatio}
              pranzoStart={pranzoStart} setPranzoStart={setPranzoStart}
              pranzoEnd={pranzoEnd} setPranzoEnd={setPranzoEnd}
              cenaStart={cenaStart} setCenaStart={setCenaStart}
              cenaEnd={cenaEnd} setCenaEnd={setCenaEnd}
              showDailyHours={showDailyHours} setShowDailyHours={setShowDailyHours}
              dailyHours={dailyHours}
              handleGlobalHourChange={handleGlobalHourChange}
              updateDailyHour={updateDailyHour}
              setActiveView={setActiveView}
            />
          )}

          {/* ========== RECENSIONI (PLACEHOLDER) ========== */}
          {activeView === "Recensioni" && (
            <PageStagger className="flex-1 flex flex-col min-h-0">
            <main className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full">
              <div className="space-y-6">
                <SI>
                  <h1 className={`text-3xl font-bold tracking-tight ${textColor}`}>Recensioni</h1>
                  <p className={`${mutedText} mt-1`}>Collega le recensioni agli ordini per capire cosa viene apprezzato o criticato — e agisci direttamente sul menu.</p>
                </SI>
                <SI>
                <div className={`flex flex-col items-center justify-center py-24 rounded-2xl border-2 border-dashed ${isDinner ? 'border-[#334155] text-[#94A3B8]' : 'border-[#EAE5DA] text-[#8C8A85]'}`}>
                  <Star className="w-12 h-12 mb-4 opacity-30" />
                  <p className="text-lg font-semibold opacity-50">Coming Soon</p>
                  <p className="text-sm opacity-40 mt-1">La gestione recensioni sarà disponibile a breve.</p>
                </div>
                </SI>
              </div>
            </main>
            </PageStagger>
          )}

          {/* ========== MENU ========== */}
          {activeView === "Menu" && (
          <AnimatePresence mode="wait" initial={false} custom={menuNavDirection}>
          <motion.div
            key={menuSubView}
            custom={menuNavDirection}
            variants={{
              enter: (dir: number) => ({ opacity: 1, y: dir * 30 }),
              center: { opacity: 1, y: 0 },
              exit: (dir: number) => ({ opacity: 1, y: dir * -30 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="flex-1 flex flex-col min-h-0"
          >
          {menuSubView === 'landing' && (
            <main className="flex-1 flex flex-col p-6 md:p-8 max-w-6xl mx-auto w-full">
              <PageStagger className="flex-1 flex flex-col">
              <SI>
              <div>
                <h1 className={`text-3xl font-bold tracking-tight ${textColor}`}>Menu</h1>
                <p className={`${mutedText} mt-1`}>Gestisci magazzino, ricette e analisi della redditività.</p>
              </div>
              </SI>
              <div className="flex-1 flex items-center">
                <div className="w-full py-8 space-y-6">
                  {/* Helper per card uniforme */}
                  {([
                    // Riga 1
                    { key: 'inventario', title: 'Inventario & Magazzino', description: 'Ingredienti, fornitori, scorte ideali e importazione inventario.', icon: Boxes },
                    { key: 'ricette',    title: 'Ricette',                description: 'Gestisci le ricette dei piatti con ingredienti, dosi e preparazioni.',           icon: BookOpen },
                    { key: 'consumi',    title: 'Consumi Interni',        description: 'Scarti, pasti personale e consumi operativi. Analisi e statistiche.',              icon: Flame },
                    // Riga 2
                    { key: 'redditività', title: 'Redditività & Analisi', description: 'Analisi dei costi, margini di contribuzione e profittabilità del menu.', icon: PiggyBank },
                    { key: 'storico',     title: 'Storico Analisi',       description: "Consulta le analisi passate, confronta periodi e monitora l'evoluzione del menu.",  icon: History },
                    { key: 'simulazione', title: 'Simulazione',           description: 'Sandbox per simulare variazioni di prezzo, quantità e frequenze.',                   icon: Zap },
                  ] as { key: string; title: string; description: string; icon: React.ComponentType<any> }[]).reduce<React.ReactNode[][]>((rows, card, i) => {
                    const rowIdx = Math.floor(i / 3);
                    if (!rows[rowIdx]) rows[rowIdx] = [];
                    rows[rowIdx].push(
                      <motion.button
                        key={card.key}
                        layoutId={`menu-card-${card.key}`}
                        variants={staggerItemVariants}
                        onClick={() => handleMenuSubViewChange(card.key as any)}
                        whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ layout: { duration: 0.35, ease: [0.4, 0, 0.2, 1] }, default: { duration: 0.18 } }}
                        className={`group text-left p-8 rounded-2xl border flex flex-col ${
                          isDinner ? 'bg-[#1E293B] border-[#334155] hover:border-[#967D62]' : 'bg-[#FDFAF5] border-[#EAE5DA] hover:border-[#967D62] hover:bg-white'
                        }`}
                      >
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors ${
                          isDinner ? 'bg-[#967D62]/20 text-[#C4A882] group-hover:bg-[#967D62]/30' : 'bg-[#967D62]/10 text-[#967D62] group-hover:bg-[#967D62]/20'
                        }`}>
                          <card.icon className="w-8 h-8" />
                        </div>
                        <h3 className={`font-bold text-xl mb-2 ${textColor}`}>{card.title}</h3>
                        <p className={`text-sm leading-relaxed flex-1 ${mutedText}`}>{card.description}</p>
                        <div className={`flex items-center gap-1.5 mt-6 text-sm font-semibold ${isDinner ? 'text-[#C4A882]' : 'text-[#967D62]'}`}>
                          Apri <ChevronRight className="w-4 h-4" />
                        </div>
                      </motion.button>
                    );
                    return rows;
                  }, []).map((row, i) => (
                    <PageStagger key={i} className="grid grid-cols-1 md:grid-cols-3 gap-6">{row}</PageStagger>
                  ))}
                </div>
              </div>
              </PageStagger>
            </main>
          )}

          {/* ========== MENU / INVENTARIO ========== */}
          {menuSubView === 'inventario' && (
            <>
              <div className={`flex items-center gap-3 px-6 pt-6 pb-2 max-w-6xl mx-auto w-full`}>
                <button
                  onClick={() => handleMenuSubViewChange('landing')}
                  className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${isDinner ? 'text-[#C4A882] hover:text-[#F4F1EA]' : 'text-[#967D62] hover:text-[#2C2A28]'}`}
                >
                  <ArrowLeft className="w-4 h-4" /> Menu
                </button>
                <span className={`text-sm ${mutedText}`}>/</span>
                <span className={`text-sm font-semibold ${textColor}`}>Inventario & Magazzino</span>
              </div>
              <PianificazioneView
                isDinner={isDinner} textColor={textColor} mutedText={mutedText}
                cardBg={cardBg} accentColor={accentColor} accentBg={accentBg}
                selectedDate={selectedDate}
                planTab="inventario" setPlanTab={() => {}}
                hideTabBar hideHeader
                weekGenerated={weekGenerated} setWeekGenerated={setWeekGenerated} isGeneratingStaff={isGeneratingStaff}
                weeklyStaffData={weeklyStaffData} staffDateRange={staffDateRange}
                generateStaffPlan={generateStaffPlan}
                isGeneratingBudget={isGeneratingBudget} budgetGenerated={budgetGenerated}
                budgetData={budgetData} budgetStartDate={budgetStartDate}
                setBudgetStartDate={setBudgetStartDate} budgetDuration={budgetDuration}
                setBudgetDuration={setBudgetDuration} showBudgetSettings={showBudgetSettings}
                setShowBudgetSettings={setShowBudgetSettings} generateBudgetPlan={generateBudgetPlan}
                ingredients={ingredients} setIngredients={setIngredients}
                recipes={recipes} setRecipes={setRecipes}
                preparations={preparations} setPreparations={setPreparations}
                newIngName={newIngName} setNewIngName={setNewIngName}
                newIngUnit={newIngUnit} setNewIngUnit={setNewIngUnit}
                newIngIdeal={newIngIdeal} setNewIngIdeal={setNewIngIdeal}
                newIngSupplierMode={newIngSupplierMode} setNewIngSupplierMode={setNewIngSupplierMode}
                newIngSupplierName={newIngSupplierName} setNewIngSupplierName={setNewIngSupplierName}
                newIngQtyPerBox={newIngQtyPerBox} setNewIngQtyPerBox={setNewIngQtyPerBox}
                newIngBoxCount={newIngBoxCount} setNewIngBoxCount={setNewIngBoxCount}
                newIngSelectedSupplier={newIngSelectedSupplier} setNewIngSelectedSupplier={setNewIngSelectedSupplier}
                newIngEditingIdeal={newIngEditingIdeal} setNewIngEditingIdeal={setNewIngEditingIdeal}
                newIngPricePerBox={newIngPricePerBox} setNewIngPricePerBox={setNewIngPricePerBox}
                newIngEditingPrice={newIngEditingPrice} setNewIngEditingPrice={setNewIngEditingPrice}
                editingRecipeDish={editingRecipeDish} setEditingRecipeDish={setEditingRecipeDish}
                editingRecipeIngId={editingRecipeIngId} setEditingRecipeIngId={setEditingRecipeIngId}
                editingRecipeQty={editingRecipeQty} setEditingRecipeQty={setEditingRecipeQty}
                editingRecipePcsYield={editingRecipePcsYield} setEditingRecipePcsYield={setEditingRecipePcsYield}
                ingredientSearchText={ingredientSearchText} setIngredientSearchText={setIngredientSearchText}
                dropdownRect={dropdownRect} setDropdownRect={setDropdownRect}
                showVerifyForm={showVerifyForm} setShowVerifyForm={setShowVerifyForm}
                verifyValues={verifyValues} setVerifyValues={setVerifyValues}
                importFeedback={importFeedback} setImportFeedback={setImportFeedback}
                handleInventoryImport={handleInventoryImport}
                newPrepName={newPrepName} setNewPrepName={setNewPrepName}
                newPrepYieldQty={newPrepYieldQty} setNewPrepYieldQty={setNewPrepYieldQty}
                newPrepYieldUnit={newPrepYieldUnit} setNewPrepYieldUnit={setNewPrepYieldUnit}
                editingPrepId={editingPrepId} setEditingPrepId={setEditingPrepId}
                prepIngSearch={prepIngSearch} setPrepIngSearch={setPrepIngSearch}
                prepIngId={prepIngId} setPrepIngId={setPrepIngId}
                prepIngQty={prepIngQty} setPrepIngQty={setPrepIngQty}
                prepDropdownRect={prepDropdownRect} setPrepDropdownRect={setPrepDropdownRect}
                prepBatchQty={prepBatchQty} setPrepBatchQty={setPrepBatchQty}
              newPrepIdealQty={newPrepIdealQty} setNewPrepIdealQty={setNewPrepIdealQty}
              newPrepEditingIdeal={newPrepEditingIdeal} setNewPrepEditingIdeal={setNewPrepEditingIdeal}
                convertToUnit={convertToUnit} isPieceUnit={isPieceUnit} isMeasuredUnit={isMeasuredUnit}
                setActiveView={setActiveView}
                getFestivitaAvviso={getFestivitaAvviso}
                menuPrices={menuPrices} setMenuPrices={setMenuPrices} saveMenuPrice={saveMenuPrice}
                supabase={supabase} isLoggedIn={isLoggedIn}
              />
            </>
          )}

          {/* ========== MENU / RICETTE ========== */}
          {menuSubView === 'ricette' && (
            <>
              <div className={`flex items-center gap-3 px-6 pt-6 pb-2 max-w-6xl mx-auto w-full`}>
                <button
                  onClick={() => handleMenuSubViewChange('landing')}
                  className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${isDinner ? 'text-[#C4A882] hover:text-[#F4F1EA]' : 'text-[#967D62] hover:text-[#2C2A28]'}`}
                >
                  <ArrowLeft className="w-4 h-4" /> Menu
                </button>
                <span className={`text-sm ${mutedText}`}>/</span>
                <span className={`text-sm font-semibold ${textColor}`}>Ricette</span>
              </div>
              <PianificazioneView
                isDinner={isDinner} textColor={textColor} mutedText={mutedText}
                cardBg={cardBg} accentColor={accentColor} accentBg={accentBg}
                selectedDate={selectedDate}
                planTab="ricette" setPlanTab={() => {}}
                hideTabBar hideHeader
                weekGenerated={weekGenerated} setWeekGenerated={setWeekGenerated} isGeneratingStaff={isGeneratingStaff}
                weeklyStaffData={weeklyStaffData} staffDateRange={staffDateRange}
                generateStaffPlan={generateStaffPlan}
                isGeneratingBudget={isGeneratingBudget} budgetGenerated={budgetGenerated}
                budgetData={budgetData} budgetStartDate={budgetStartDate}
                setBudgetStartDate={setBudgetStartDate} budgetDuration={budgetDuration}
                setBudgetDuration={setBudgetDuration} showBudgetSettings={showBudgetSettings}
                setShowBudgetSettings={setShowBudgetSettings} generateBudgetPlan={generateBudgetPlan}
                ingredients={ingredients} setIngredients={setIngredients}
                recipes={recipes} setRecipes={setRecipes}
                preparations={preparations} setPreparations={setPreparations}
                newIngName={newIngName} setNewIngName={setNewIngName}
                newIngUnit={newIngUnit} setNewIngUnit={setNewIngUnit}
                newIngIdeal={newIngIdeal} setNewIngIdeal={setNewIngIdeal}
                newIngSupplierMode={newIngSupplierMode} setNewIngSupplierMode={setNewIngSupplierMode}
                newIngSupplierName={newIngSupplierName} setNewIngSupplierName={setNewIngSupplierName}
                newIngQtyPerBox={newIngQtyPerBox} setNewIngQtyPerBox={setNewIngQtyPerBox}
                newIngBoxCount={newIngBoxCount} setNewIngBoxCount={setNewIngBoxCount}
                newIngSelectedSupplier={newIngSelectedSupplier} setNewIngSelectedSupplier={setNewIngSelectedSupplier}
                newIngEditingIdeal={newIngEditingIdeal} setNewIngEditingIdeal={setNewIngEditingIdeal}
                newIngPricePerBox={newIngPricePerBox} setNewIngPricePerBox={setNewIngPricePerBox}
                newIngEditingPrice={newIngEditingPrice} setNewIngEditingPrice={setNewIngEditingPrice}
                editingRecipeDish={editingRecipeDish} setEditingRecipeDish={setEditingRecipeDish}
                editingRecipeIngId={editingRecipeIngId} setEditingRecipeIngId={setEditingRecipeIngId}
                editingRecipeQty={editingRecipeQty} setEditingRecipeQty={setEditingRecipeQty}
                editingRecipePcsYield={editingRecipePcsYield} setEditingRecipePcsYield={setEditingRecipePcsYield}
                ingredientSearchText={ingredientSearchText} setIngredientSearchText={setIngredientSearchText}
                dropdownRect={dropdownRect} setDropdownRect={setDropdownRect}
                showVerifyForm={showVerifyForm} setShowVerifyForm={setShowVerifyForm}
                verifyValues={verifyValues} setVerifyValues={setVerifyValues}
                importFeedback={importFeedback} setImportFeedback={setImportFeedback}
                handleInventoryImport={handleInventoryImport}
                newPrepName={newPrepName} setNewPrepName={setNewPrepName}
                newPrepYieldQty={newPrepYieldQty} setNewPrepYieldQty={setNewPrepYieldQty}
                newPrepYieldUnit={newPrepYieldUnit} setNewPrepYieldUnit={setNewPrepYieldUnit}
                editingPrepId={editingPrepId} setEditingPrepId={setEditingPrepId}
                prepIngSearch={prepIngSearch} setPrepIngSearch={setPrepIngSearch}
                prepIngId={prepIngId} setPrepIngId={setPrepIngId}
                prepIngQty={prepIngQty} setPrepIngQty={setPrepIngQty}
                prepDropdownRect={prepDropdownRect} setPrepDropdownRect={setPrepDropdownRect}
                prepBatchQty={prepBatchQty} setPrepBatchQty={setPrepBatchQty}
              newPrepIdealQty={newPrepIdealQty} setNewPrepIdealQty={setNewPrepIdealQty}
              newPrepEditingIdeal={newPrepEditingIdeal} setNewPrepEditingIdeal={setNewPrepEditingIdeal}
                convertToUnit={convertToUnit} isPieceUnit={isPieceUnit} isMeasuredUnit={isMeasuredUnit}
                setActiveView={setActiveView}
                getFestivitaAvviso={getFestivitaAvviso}
                menuPrices={menuPrices} setMenuPrices={setMenuPrices} saveMenuPrice={saveMenuPrice}
                supabase={supabase} isLoggedIn={isLoggedIn}
              />
            </>
          )}

          {/* ========== MENU / CONSUMI INTERNI ========== */}
          {menuSubView === 'consumi' && (
            <>
              <div className={`flex items-center gap-3 px-6 pt-6 pb-2 max-w-6xl mx-auto w-full`}>
                <button onClick={() => handleMenuSubViewChange('landing')} className={`flex items-center gap-1.5 text-sm font-medium ${mutedText} hover:${textColor} transition-colors`}>
                  <ArrowLeft className="w-4 h-4" /> Menu
                </button>
                <span className={mutedText}>/</span>
                <span className={`text-sm font-semibold ${textColor}`}>Consumi Interni</span>
              </div>
              <ConsumiView
                isDinner={isDinner}
                textColor={textColor}
                mutedText={mutedText}
                cardBg={isDinner ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#EAE5DA] shadow-sm'}
                accentColor={'text-[#967D62]'}
                supabase={supabase}
                isLoggedIn={isLoggedIn}
              />
            </>
          )}

          {/* ========== MENU / STORICO ========== */}
          {menuSubView === 'storico' && (
            <>
              <div className={`flex items-center gap-3 px-6 pt-6 pb-2 max-w-6xl mx-auto w-full`}>
                <button onClick={() => handleMenuSubViewChange('landing')} className={`flex items-center gap-1.5 text-sm font-medium ${mutedText} hover:${textColor} transition-colors`}>
                  <ArrowLeft className="w-4 h-4" /> Menu
                </button>
                <span className={mutedText}>/</span>
                <span className={`text-sm font-semibold ${textColor}`}>Storico Analisi</span>
              </div>
              <StoricoView
                isDinner={isDinner}
                textColor={textColor}
                mutedText={mutedText}
                cardBg={isDinner ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#EAE5DA] shadow-sm'}
                accentColor={'text-[#967D62]'}
                supabase={supabase}
                isLoggedIn={isLoggedIn}
              />
            </>
          )}

          {/* ========== MENU / SIMULAZIONE ========== */}
          {menuSubView === 'simulazione' && (
            <>
              <div className={`flex items-center gap-3 px-6 pt-6 pb-2 max-w-6xl mx-auto w-full`}>
                <button onClick={() => handleMenuSubViewChange('landing')} className={`flex items-center gap-1.5 text-sm font-medium ${mutedText} hover:${textColor} transition-colors`}>
                  <ArrowLeft className="w-4 h-4" /> Menu
                </button>
                <span className={mutedText}>/</span>
                <span className={`text-sm font-semibold ${textColor}`}>Simulazione</span>
              </div>
              <SimulazioneView
                isDinner={isDinner}
                textColor={textColor}
                mutedText={mutedText}
                cardBg={isDinner ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#EAE5DA] shadow-sm'}
                accentColor={'text-[#967D62]'}
                supabase={supabase}
                isLoggedIn={isLoggedIn}
              />
            </>
          )}

          {/* ========== MENU / REDDITIVITÀ ========== */}
          {menuSubView === 'redditività' && (
            <>
              <div className={`flex items-center gap-3 px-6 pt-6 pb-2 max-w-6xl mx-auto w-full`}>
                <button
                  onClick={() => handleMenuSubViewChange('landing')}
                  className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${isDinner ? 'text-[#C4A882] hover:text-[#F4F1EA]' : 'text-[#967D62] hover:text-[#2C2A28]'}`}
                >
                  <ArrowLeft className="w-4 h-4" /> Menu
                </button>
                <span className={`text-sm ${mutedText}`}>/</span>
                <span className={`text-sm font-semibold ${textColor}`}>Redditività & Analisi</span>
              </div>
              <MenuProfitability
                ingredients={ingredients}
                setIngredients={setIngredients}
                recipes={recipes}
                preparations={preparations}
                isDinner={isDinner}
                supabase={supabase}
                isLoggedIn={isLoggedIn}
              />
            </>
          )}
          </motion.div>
          </AnimatePresence>
          )}

          </motion.div>
          </AnimatePresence>
          </div>

        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

export default App;
