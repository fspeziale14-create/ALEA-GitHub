import { useState } from 'react';
import { motion } from 'motion/react';

const pageStaggerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};
const si = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as any } },
};
function PS({ children, className }: { children: React.ReactNode; className?: string }) {
  return <motion.div variants={pageStaggerVariants} initial="hidden" animate="show" className={className}>{children}</motion.div>;
}
function SI({ children, className }: { children: React.ReactNode; className?: string }) {
  return <motion.div variants={si} className={className}>{children}</motion.div>;
}

import {
  Activity, Cloud, CloudRain, Users, TrendingUp, Sun, Moon,
  CalendarCheck, CheckCircle2, ClipboardCheck, UsersRound, Zap,
  CalendarDays, Clock, ChefHat, ConciergeBell, Plus, Trash2,
  AlertTriangle, PiggyBank, Pencil, ArrowRightCircle, Utensils,
  Loader2, Settings2, BookOpen, X, Check, XCircle, ChevronRight,
  Edit3, ChevronDown, ChevronUp, UserCog, CookingPot, ClipboardList
} from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { Separator } from './components/ui/separator';
import { MENU_PRICES } from './constants';
import { getMeteoItaliano } from './engine';

interface DashboardViewProps {
  // theme
  isDinner: boolean;
  textColor: string; mutedText: string; cardBg: string;
  accentColor: string; accentBg: string; bgColor: string;
  // date/shift
  selectedDate: string; shift: 'pranzo' | 'cena';
  formattedDate: string; mobileDate: string;
  isToday: boolean; isTargetShiftClosed: boolean; isShiftOngoing: boolean;
  isLockedByTime: boolean; isSaveDisabled: boolean; currentShiftSaved: boolean;
  isClosedEntry?: boolean;
  currentShiftClosed?: boolean;
  // covers & booking
  actualCovers: string; setActualCovers: (v: string) => void;
  finalBooked: string; setFinalBooked: (v: string) => void;
  predictedCovers: number; bookedGuests: string; setBookedGuests: (v: string) => void;
  previsioneGiorno: any;
  isLogicError: boolean;
  // weather
  weather: { temp: number; precipitation_mm: number; condition: string };
  // staff
  staffAdvice: any; cookAdvice: any; suggestedHosts: number; hostMode: string;
  dailyAttendibilita: any;
  // handlers
  handleCloseShift: () => void;
  setActiveView: (v: string) => void;
  // reservations
  reservations: any[]; totalRegisteredPax: number;
  newResName: string; setNewResName: (v: string) => void;
  newResPax: string; setNewResPax: (v: string) => void;
  newResTime: string; setNewResTime: (v: string) => void;
  newResPhone: string; setNewResPhone: (v: string) => void;
  addReservation: () => void;
  deleteReservation: (id: string) => void;
  activeView: string;
  maxCapacity?: number;
  setIsMenuModalOpen?: (v: boolean) => void;
}

export function DashboardView(props: DashboardViewProps) {
  const {
    isDinner = false,
    textColor = 'text-[#2C2A28]',
    mutedText = 'text-[#8C8A85]',
    cardBg = 'bg-white border-[#EAE5DA] shadow-sm',
    accentColor = 'text-[#967D62]',
    accentBg = 'bg-[#967D62]/10 border-[#967D62]/30',
    bgColor = 'bg-[#F4F1EA]',
    selectedDate = new Date().toLocaleDateString('en-CA'),
    shift = 'pranzo',
    formattedDate = '',
    mobileDate = '',
    isToday = false,
    isTargetShiftClosed = false,
    isLockedByTime = false,
    isSaveDisabled = true,
    currentShiftSaved = false,
    isClosedEntry = false,
    currentShiftClosed = false,
    actualCovers = '', setActualCovers = () => {},
    finalBooked = '', setFinalBooked = () => {},
    predictedCovers = 0,
    bookedGuests = '', setBookedGuests = () => {},
    previsioneGiorno = null,
    isLogicError = false,
    weather = { temp: 20, precipitation_mm: 0, condition: 'sunny' },
    staffAdvice = { base: 2, onCall: 0, tipo: 'fissi', messaggio: '', alternativa: '' },
    cookAdvice = { cuochi: 1, messaggio: '', nota: '' },
    suggestedHosts = 1,
    hostMode = 'fisso',
    dailyAttendibilita = { livello: 'buona', motivazione: '', colore: 'bg-yellow-400', coloreBar: '#facc15' },
    handleCloseShift = () => {},
    setActiveView = () => {},
    reservations = [],
    totalRegisteredPax = 0,
    newResName = '', setNewResName = () => {},
    newResPax = '', setNewResPax = () => {},
    newResTime = '', setNewResTime = () => {},
    newResPhone = '', setNewResPhone = () => {},
    addReservation = () => {},
    deleteReservation = () => {},
    activeView = 'Dashboard',
    isShiftOngoing = false,
    maxCapacity = 150,
    setIsMenuModalOpen = () => {},
  } = props;

  const WeatherIconBig = weather.condition === 'rainy'
    ? <CloudRain className={`w-14 h-14 ${accentColor}`} />
    : weather.condition === 'cloudy'
      ? <Cloud className={`w-14 h-14 ${accentColor}`} />
      : <Sun className={`w-14 h-14 ${accentColor}`} />;

  const currentShiftReservations = reservations.filter((r: any) => r.date === selectedDate && r.shift === shift);
  const incomingReservations = currentShiftReservations.filter((r: any) => !r.isSeated && !r.isOutOfBounds);

  if (activeView === 'Prenotazioni') return (
             <main className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full">
                <PS className="space-y-8">
                <SI>
                <div className="flex flex-col gap-2 sm:gap-1">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${textColor}`}>Gestione Prenotazioni</h1>
                            <div className={`flex items-center px-3 py-1 rounded-full border ${isDinner ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#EAE5DA]'} shadow-sm`}>
                                <UsersRound className={`w-3.5 h-3.5 mr-1.5 ${isDinner ? 'text-[#F4F1EA]' : 'text-[#967D62]'}`} />
                                <span className={`text-sm font-bold ${textColor}`}>{totalRegisteredPax} <span className="font-medium opacity-70 text-xs ml-0.5">coperti</span></span>
                            </div>
                        </div>
                        <p className={`${mutedText} text-sm sm:text-base`}>Turno di {shift} del {formattedDate}</p>
                </div>
                </SI>

                <SI>
                    <Card className={cardBg}>
                        <CardHeader><CardTitle className={`text-lg ${textColor}`}>Nuova Prenotazione (Manuale)</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex flex-col md:flex-row gap-4 items-end">
                                <div className="flex-1 space-y-2 w-full">
                                    <Label className={textColor}>Nome Cliente</Label>
                                    <Input placeholder="Es. Tavolo Rossi" value={newResName} onChange={e => setNewResName(e.target.value)} className={isDinner ? 'border-[#334155] bg-[#0F172A]' : 'border-[#EAE5DA]'} />
                                </div>
                                <div className="w-full md:w-36 space-y-2">
                                    <Label className={textColor}>Telefono</Label>
                                    <Input type="tel" placeholder="Es. 333 1234567" value={newResPhone} onChange={e => setNewResPhone(e.target.value)} className={isDinner ? 'border-[#334155] bg-[#0F172A]' : 'border-[#EAE5DA]'} />
                                </div>
                                <div className="w-full md:w-24 space-y-2">
                                    <Label className={textColor}>Persone</Label>
                                    <Input type="number" min="1" placeholder="0" value={newResPax} onChange={e => setNewResPax(e.target.value)} className={isDinner ? 'border-[#334155] bg-[#0F172A]' : 'border-[#EAE5DA]'} />
                                </div>
                                <div className="w-full md:w-32 space-y-2">
                                    <Label className={textColor}>Orario</Label>
                                    <Input type="time" value={newResTime} onChange={e => setNewResTime(e.target.value)} className={isDinner ? 'border-[#334155] bg-[#0F172A] [color-scheme:dark]' : 'border-[#EAE5DA]'} />
                                </div>
                                <div className="flex flex-col w-full md:w-auto mt-2 md:mt-0">
                                    <Button onClick={addReservation} disabled={isTargetShiftClosed || !newResName || !newResPax || !newResTime} className={`disabled:opacity-50 bg-[#967D62] hover:bg-[#7A654E] ${isDinner ? 'text-[#F4F1EA]' : 'text-white'}`}>
                                        <Plus className="w-4 h-4 mr-2" /> Aggiungi
                                    </Button>
                                </div>
                            </div>
                            {isTargetShiftClosed && (<p className="text-red-500 text-xs mt-3 font-semibold text-right">⚠️ Impossibile aggiungere: il turno per l'orario inserito è già chiuso.</p>)}
                        </CardContent>
                    </Card>
                </SI>

                <SI>
                    <Card className={cardBg}>
                        <CardHeader><CardTitle className={`text-lg ${textColor}`}>Lista Tavoli</CardTitle></CardHeader>
                        <CardContent>
                            {currentShiftReservations.length === 0 ? (
                                <div className={`text-center py-8 ${mutedText}`}>Nessuna prenotazione inserita manualmente per questo turno.</div>
                            ) : (
                                <div className="space-y-2">
                                    {currentShiftReservations.sort((a,b) => (a.time || "").localeCompare(b.time || "")).map(res => (
                                        <div key={res.id} className={`flex items-center justify-between p-3 rounded-lg border ${res.isOutOfBounds ? 'border-red-500/50 bg-red-500/5' : (isDinner ? 'bg-[#0F172A] border-[#334155]' : 'bg-gray-50 border-[#EAE5DA]')}`}>
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <div className={`font-mono text-sm font-bold ${res.isOutOfBounds ? 'text-red-500' : accentColor}`}>{res.time}</div>
                                                <div className="flex flex-col">
                                                    <span className={`font-semibold text-sm ${res.isOutOfBounds ? mutedText : textColor}`}>{res.name}</span>
                                                    {res.phone && <span className={`text-xs ${mutedText}`}>📞 {res.phone}</span>}
                                                </div>
                                                {res.isOutOfBounds ? (
                                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-bold border border-red-500/20 uppercase"><AlertTriangle className="w-3 h-3" /> Fuori Turno</div>
                                                ) : (
                                                    <div className={`flex items-center text-sm ${mutedText} bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full`}><UsersRound className="w-3 h-3 mr-1" /> {res.pax}</div>
                                                )}
                                                {res.isSeated && (
                                                    <div className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${isDinner ? 'text-[#F4F1EA] bg-[#967D62]' : 'text-white bg-[#967D62]'}`}>Seduto (Tav. {res.tableId})</div>
                                                )}
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => deleteReservation(res.id)} className="text-red-500 hover:bg-red-500/10 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </SI>
                </PS>
             </main>
  );

  return (
             <main className={`flex-1 p-6 md:p-8 space-y-8 ${bgColor} transition-colors duration-500 max-w-7xl mx-auto w-full`}>
                <PS className="space-y-8">
                <SI>
                <div className={`flex items-center justify-center py-2 px-4 rounded-lg border ${accentBg} ${accentColor}`}>
                     <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        <span className="text-sm font-medium tracking-wide">Smetti di indovinare. Inizia a prevedere con il forecasting proattivo.</span>
                     </div>
                </div>
                </SI>

                <SI>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className={`${cardBg} flex flex-col justify-center`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                            <CardTitle className={`text-sm font-medium ${mutedText}`}>Meteo a {shift === 'pranzo' ? 'Pranzo (13:00)' : 'Cena (20:00)'}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-2 flex items-center gap-4">
                            {WeatherIconBig}
                            <div className="flex flex-col">
                                <div className={`text-5xl font-bold tracking-tight ${textColor}`}>{weather.temp}°C</div>
                                <p className={`text-sm mt-1 font-medium ${mutedText}`}>{getMeteoItaliano(weather.condition)}</p>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className={`${cardBg} flex flex-col justify-center`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                            <CardTitle className={`text-sm font-medium ${mutedText}`}>Prenotati Iniziali</CardTitle>
                            <CalendarCheck className={`h-4 w-4 ${mutedText}`} />
                        </CardHeader>
                        <CardContent className="pt-2 flex flex-col items-center">
                            <Input type="number" value={bookedGuests} onChange={(e) => setBookedGuests(e.target.value)} className={`h-16 w-36 text-center text-5xl font-bold bg-transparent border-0 border-b-2 rounded-none focus:ring-0 ${isDinner ? 'border-[#475569] text-[#F4F1EA] focus-visible:border-[#967D62]' : 'border-[#EAE5DA] text-[#2C2A28] focus-visible:border-[#967D62]'}`} />
                            {totalRegisteredPax > 0 && parseInt(bookedGuests || '0') < totalRegisteredPax && (
                                <p className="text-red-500 text-xs mt-2 font-medium">⚠️ Minore della lista ({totalRegisteredPax} pax)</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className={`lg:col-span-2 ${cardBg}`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className={`text-sm font-medium ${mutedText}`}>Verifica Servizio (Dati per Algoritmo)</CardTitle>
                            <ClipboardCheck className={`h-4 w-4 ${mutedText}`} />
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 space-y-1">
                                    <Label className={`text-xs ${mutedText}`}>Coperti Totali Reali</Label>
                                    <Input type="text" placeholder="Es. 145" value={actualCovers} onChange={(e) => setActualCovers(e.target.value)} disabled={currentShiftSaved} className={`h-9 bg-transparent ${isDinner ? 'border-[#475569] text-[#F4F1EA]' : 'border-[#EAE5DA] text-[#2C2A28]'}`} />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <Label className={`text-xs ${mutedText}`}>Prenotati Effettivi</Label>
                                    <div className="relative">
                                        <Input type="text" placeholder="Senza No-Show" value={finalBooked} onChange={(e) => setFinalBooked(e.target.value)} disabled={currentShiftSaved} className={`h-9 bg-transparent pr-8 ${isDinner ? 'border-[#475569] text-[#F4F1EA]' : 'border-[#EAE5DA] text-[#2C2A28]'}`} />
                                        <UsersRound className={`w-4 h-4 absolute right-2.5 top-2.5 ${mutedText} opacity-50`} />
                                    </div>
                                </div>
                            </div>
                            {isClosedEntry && !currentShiftSaved && (
                                <p className={`text-xs font-medium text-center ${isDinner ? 'text-amber-400' : 'text-amber-600'}`}>
                                    🔒 Turno segnato come chiuso — il giorno non verrà conteggiato nelle previsioni
                                </p>
                            )}
                            {currentShiftSaved ? (
                                <div className={`flex justify-center items-center py-2 rounded-md ${currentShiftClosed ? (isDinner ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-700') : (isDinner ? 'bg-[#334155] text-[#967D62]' : 'bg-green-50 text-green-700')}`}>
                                    <CheckCircle2 className="w-5 h-5 mr-2 shrink-0" />
                                    <span className="font-semibold text-sm">
                                        {currentShiftClosed
                                            ? 'Ristorante chiuso — turno registrato, nessun dato per l\'algoritmo'
                                            : 'Turno salvato correttamente nel database'}
                                    </span>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <Button onClick={handleCloseShift} disabled={isSaveDisabled} className={`w-full font-semibold transition-colors disabled:opacity-50 ${isClosedEntry ? 'bg-amber-700 hover:bg-amber-800' : 'bg-[#967D62] hover:bg-[#7A654E]'} ${isDinner ? 'text-[#F4F1EA]' : 'text-white shadow-sm'}`}>
                                        {isClosedEntry ? '🔒 Ristorante chiuso — Salva e chiudi turno' : 'Salva Dati e Chiudi Turno'}
                                    </Button>
                                    {isLockedByTime && (<p className="text-center text-xs text-orange-500 font-medium">Impossibile salvare: Turno in corso o nel futuro.</p>)}
                                    {isLogicError && (<p className="text-center text-xs text-red-500 font-medium">Errore logico: I prenotati non possono superare i coperti totali.</p>)}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
                </SI>

                <SI>
                <div className="grid gap-8 md:grid-cols-12 lg:min-h-[520px]">
                    {/* CARD PREVISIONE — metà larghezza */}
                    <Card className={`md:col-span-6 flex flex-col justify-between relative overflow-hidden ${cardBg}`}>
                        {/* Header badge */}
                        <div className="flex items-center gap-2 px-5 pt-5 pb-2">
                             <div className={`p-1.5 rounded-full ${accentBg}`}><TrendingUp className={`w-4 h-4 ${accentColor}`} /></div>
                             <span className={`${accentColor} font-bold text-xs tracking-wide`}>MOTORE PREDITTIVO ALEA</span>
                        </div>
                        {/* Contenuto centrale */}
                        <div className="text-center z-10 px-4 py-4 flex flex-col items-center flex-1 justify-center">
                            <h2 className={`${mutedText} font-medium mb-2 uppercase tracking-widest text-xs`}>Coperti Previsti — {shift === 'pranzo' ? 'Pranzo' : 'Cena'}</h2>
                            <div className={`text-[4.5rem] sm:text-[6rem] lg:text-[7rem] font-bold leading-none tracking-tighter tabular-nums ${textColor}`}>
                                {predictedCovers > maxCapacity ? (<span className="text-red-500">{predictedCovers}</span>) : (predictedCovers)}
                            </div>
                            {previsioneGiorno && (
                                <p className={`${mutedText} mt-2 text-sm`}>
                                    Forchetta: <span className={accentColor}>
                                        {shift === 'pranzo' ? previsioneGiorno.pranzo.lo : previsioneGiorno.cena.lo}
                                    </span> — <span className={accentColor}>
                                        {shift === 'pranzo' ? previsioneGiorno.pranzo.hi : previsioneGiorno.cena.hi}
                                    </span>
                                </p>
                            )}
                            <div className={`mt-3 flex items-center justify-center gap-4 text-xs`}>
                                <div className="text-center">
                                    <span className={`block uppercase tracking-wider ${mutedText}`}>Prenotati</span>
                                    <span className={`text-lg font-bold ${textColor}`}>{parseInt(bookedGuests || '0')}</span>
                                </div>
                                <span className={`text-lg ${mutedText}`}>+</span>
                                <div className="text-center">
                                    <span className={`block uppercase tracking-wider ${mutedText}`}>Walk-in</span>
                                    <span className={`text-lg font-bold ${accentColor}`}>{Math.max(0, predictedCovers - parseInt(bookedGuests || '0'))}</span>
                                </div>
                            </div>
                            {predictedCovers > maxCapacity && (
                                <p className="text-red-500 text-xs font-bold mt-3 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/30">⚠️ Overbooking: supera capienza {maxCapacity}</p>
                            )}
                        </div>
                        <div className={`absolute -right-20 -bottom-20 w-96 h-96 ${isDinner ? 'bg-[#967D62]/5' : 'bg-[#967D62]/10'} rounded-full blur-3xl pointer-events-none`} />
                        {/* Barra attendibilità — in flow, non absolute */}
                        <div className="relative z-10 mt-auto">
                            <div className="px-4 py-1.5 flex items-center justify-between flex-wrap gap-1">
                                <span className={`text-[10px] font-semibold uppercase tracking-wider ${mutedText}`}>Attendibilità</span>
                                <span className="text-[10px] font-bold" style={{ color: dailyAttendibilita.coloreBar }}>
                                    {dailyAttendibilita.livello.charAt(0).toUpperCase() + dailyAttendibilita.livello.slice(1)} — {dailyAttendibilita.motivazione}
                                </span>
                            </div>
                            <div className="h-1.5 w-full" style={{ backgroundColor: dailyAttendibilita.coloreBar }} />
                        </div>
                    </Card>

                    {/* CARD STAFF — metà larghezza, con messaggio convocazione esplicito */}
                    <div className="md:col-span-6 flex flex-col gap-4">
                        {/* Bottone menu */}
                        <Card className={`${cardBg}`}>
                            <CardContent className="pt-4 pb-4">
                                <Button onClick={() => setIsMenuModalOpen(true)} className={`w-full py-4 flex items-center justify-center gap-2 bg-[#967D62] hover:bg-[#7A654E] text-white font-semibold text-sm shadow-sm`}>
                                    <BookOpen className="w-4 h-4" /> Gestisci Disponibilità Menu
                                </Button>
                            </CardContent>
                        </Card>

                        {/* CARD CONVOCAZIONI */}
                        <Card className={`flex-1 flex flex-col ${cardBg}`}>
                            <CardHeader className="pb-3">
                                <CardTitle className={`flex items-center gap-2 ${textColor}`}>
                                    <Users className="w-5 h-5" /> Convocazioni Turno
                                </CardTitle>
                                <CardDescription className={mutedText}>
                                    Personale consigliato per il turno
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col gap-4">
                                {/* Messaggio principale convocazione camerieri */}
                                <div className={`p-5 rounded-2xl border ${isDinner ? 'bg-[#0F172A]/50 border-[#334155]' : 'bg-[#F4F1EA]/50 border-[#EAE5DA]'}`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`text-5xl font-bold tabular-nums ${textColor} min-w-[3rem] text-center`}>
                                            {staffAdvice.base}
                                        </div>
                                        <div className="flex-1">
                                            <div className={`font-semibold text-base ${textColor}`}>
                                                {staffAdvice.tipo === 'fissi' && `${staffAdvice.base} ${staffAdvice.base === 1 ? 'cameriere fisso consigliato' : 'camerieri fissi consigliati'}`}
                                                {staffAdvice.tipo === 'picco' && `${staffAdvice.base} fissi — chiama 1 nelle ore di picco`}
                                                {staffAdvice.tipo === 'fissi_alto' && `${staffAdvice.base} camerieri — range ampio, valuta bene`}
                                            </div>
                                            {staffAdvice.tipo === 'fissi' && (
                                                <p className={`text-sm mt-1 ${mutedText}`}>
                                                    {staffAdvice.alternativa || `La forchetta rientra nella capacità di ${staffAdvice.base} ${staffAdvice.base === 1 ? 'cameriere' : 'camerieri'}.`}
                                                </p>
                                            )}
                                            {staffAdvice.tipo === 'picco' && (
                                                <p className={`text-sm mt-1 ${mutedText}`}>
                                                    {staffAdvice.alternativa || `Oppure ${staffAdvice.base + 1} fissi se il picco è prolungato.`}
                                                </p>
                                            )}
                                            {staffAdvice.tipo === 'fissi_alto' && (
                                                <p className={`text-sm mt-1 ${mutedText}`}>
                                                    {staffAdvice.alternativa || `Incertezza alta: considera di aggiungere 1 a chiamata.`}
                                                </p>
                                            )}
                                            {staffAdvice.onCall > 0 && (
                                                <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${accentBg} ${accentColor} border-current/20`}>
                                                    <Zap className="w-3 h-3" /> +{staffAdvice.onCall} a chiamata per il picco
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Cuochi e accoglienza */}
                                <div className={`grid gap-3 ${hostMode === 'dinamico' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                    <div className={`p-4 rounded-xl border ${isDinner ? 'bg-[#0F172A]/30 border-[#334155]' : 'bg-white border-[#EAE5DA]'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <ChefHat className={`w-4 h-4 ${accentColor}`} />
                                            <span className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Cucina</span>
                                        </div>
                                        <div className={`font-bold ${textColor} ${hostMode === 'dinamico' ? 'text-3xl' : 'text-4xl'}`}>{cookAdvice.cuochi}</div>
                                        <div className={`text-xs ${mutedText} mt-0.5`}>{cookAdvice.cuochi === 1 ? 'cuoco' : 'cuochi'}</div>
                                        {cookAdvice.nota ? (
                                            <div className={`mt-2 text-xs ${accentColor} font-medium`}>{cookAdvice.nota}</div>
                                        ) : null}
                                    </div>
                                    {hostMode === 'dinamico' && (
                                        <div className={`p-4 rounded-xl border ${isDinner ? 'bg-[#0F172A]/30 border-[#334155]' : 'bg-white border-[#EAE5DA]'}`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <ConciergeBell className={`w-4 h-4 ${accentColor}`} />
                                                <span className={`text-xs font-semibold uppercase tracking-wide ${mutedText}`}>Accoglienza</span>
                                            </div>
                                            <div className={`text-3xl font-bold ${textColor}`}>{suggestedHosts}</div>
                                            <div className={`text-xs ${mutedText} mt-0.5`}>{suggestedHosts === 1 ? 'persona' : 'persone'}</div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                </SI>
                </PS>

             </main>
  );
}
