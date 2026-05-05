import React from 'react';
import {
  Users, Clock, Pencil, ChefHat, ConciergeBell
} from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { Separator } from './components/ui/separator';
import { weekDaysOrdered } from './constants';

function SI({ children, className, i = 0 }: { children: React.ReactNode; className?: string; i?: number }) {
  return (
    <div
      className={`alea-si${className ? ' ' + className : ''}`}
      style={{ animationDelay: `${i * 0.1}s` }}
    >
      {children}
    </div>
  );
}

interface ImpostazioniViewProps {
  isDinner: boolean;
  textColor: string; mutedText: string; cardBg: string;
  accentColor: string;
  // staff ratios
  waiterRatio: number; setWaiterRatio: (v: number) => void;
  cookRatio: number; setCookRatio: (v: number) => void;
  maxCapacity: number; setMaxCapacity: (v: number) => void;
  hostMode: 'fisso' | 'dinamico'; setHostMode: (v: 'fisso' | 'dinamico') => void;
  hostRatio: number; setHostRatio: (v: number) => void;
  // hours
  pranzoStart: string; setPranzoStart: (v: string) => void;
  pranzoEnd: string; setPranzoEnd: (v: string) => void;
  cenaStart: string; setCenaStart: (v: string) => void;
  cenaEnd: string; setCenaEnd: (v: string) => void;
  showDailyHours: boolean; setShowDailyHours: (v: boolean) => void;
  dailyHours: Record<string, any>;
  handleGlobalHourChange: (t: 'pStart'|'pEnd'|'cStart'|'cEnd', v: string) => void;
  updateDailyHour: (day: string, field: string, value: string | boolean) => void;
  setActiveView: (v: string) => void;
}

export function ImpostazioniView(props: ImpostazioniViewProps) {
  const {
    isDinner, textColor, mutedText, cardBg, accentColor,
    waiterRatio, setWaiterRatio, cookRatio, setCookRatio,
    maxCapacity, setMaxCapacity, hostMode, setHostMode,
    hostRatio, setHostRatio, pranzoStart, setPranzoStart,
    pranzoEnd, setPranzoEnd, cenaStart, setCenaStart,
    cenaEnd, setCenaEnd, showDailyHours, setShowDailyHours,
    dailyHours, handleGlobalHourChange, updateDailyHour, setActiveView,
  } = props;

  return (
             <main className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full">
                <div className="space-y-8">
                    <SI i={0}>
                        <div>
                            <h1 className={`text-3xl font-bold tracking-tight ${textColor}`}>Impostazioni</h1>
                            <p className={`${mutedText} mt-1`}>Configura i parametri operativi del ristorante.</p>
                        </div>
                    </SI>

                    <SI i={1}>
                    <Card className={cardBg}>
                        <CardHeader>
                            <CardTitle className={`flex items-center gap-2 ${textColor}`}><Users className={`w-5 h-5 ${accentColor}`} /> Rapporti Staff & Sala</CardTitle>
                            <CardDescription className={mutedText}>Alea calcolerà lo staff necessario dividendo le previsioni per questi valori.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-4">
                                <Label className={`w-32 ${textColor}`}>Camerieri di sala:</Label>
                                <div className="flex items-center gap-3">
                                    <span className={mutedText}>1 ogni</span>
                                    <Input type="number" value={waiterRatio} onChange={e => setWaiterRatio(Number(e.target.value))} className={`w-20 text-center ${isDinner ? 'border-[#334155] bg-[#0F172A]' : 'border-[#EAE5DA]'}`} />
                                    <span className={mutedText}>coperti</span>
                                </div>
                            </div>
                            <Separator className={isDinner ? 'bg-[#334155]' : 'bg-[#EAE5DA]'} />
                            <div className="flex items-center gap-4">
                                <Label className={`w-32 ${textColor}`}>Cuochi / Cucina:</Label>
                                <div className="flex items-center gap-3">
                                    <span className={mutedText}>1 ogni</span>
                                    <Input type="number" value={cookRatio} onChange={e => setCookRatio(Number(e.target.value))} className={`w-20 text-center ${isDinner ? 'border-[#334155] bg-[#0F172A]' : 'border-[#EAE5DA]'}`} />
                                    <span className={mutedText}>coperti</span>
                                </div>
                            </div>
                            <Separator className={isDinner ? 'bg-[#334155]' : 'bg-[#EAE5DA]'} />
                            <div className="space-y-4 pt-2">
                                <Label className={`text-base font-semibold ${textColor}`}>Gestione Accoglienza / Maitre</Label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Button variant="outline" onClick={() => setHostMode('fisso')} className={`flex-1 sm:flex-none ${hostMode === 'fisso' ? '!bg-[#967D62] !text-white !border-[#967D62]' : `bg-transparent ${isDinner ? 'text-[#F4F1EA] border-[#334155] hover:bg-[#334155]' : 'text-black border-[#EAE5DA] hover:bg-gray-100'}`}`}>Fisso / Non Previsto</Button>
                                    <Button variant="outline" onClick={() => setHostMode('dinamico')} className={`flex-1 sm:flex-none ${hostMode === 'dinamico' ? '!bg-[#967D62] !text-white !border-[#967D62]' : `bg-transparent ${isDinner ? 'text-[#F4F1EA] border-[#334155] hover:bg-[#334155]' : 'text-black border-[#EAE5DA] hover:bg-gray-100'}`}`}>Dinamico (Variabile)</Button>
                                </div>
                                {hostMode === 'fisso' ? (
                                    <p className={`text-sm ${mutedText}`}>Personale fisso o gestito dai camerieri. Non verrà mostrato nei calcoli del turno.</p>
                                ) : (
                                    <div className="flex items-center gap-4 mt-2">
                                        <Label className={`w-32 ${textColor}`}>Aggiungi 1 ogni:</Label>
                                        <div className="flex items-center gap-3">
                                            <Input type="number" value={hostRatio} onChange={e => setHostRatio(Number(e.target.value))} className={`w-20 text-center ${isDinner ? 'border-[#334155] bg-[#0F172A]' : 'border-[#EAE5DA]'}`} />
                                            <span className={mutedText}>coperti</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <Separator className={isDinner ? 'bg-[#334155]' : 'bg-[#EAE5DA]'} />
                            <div className="flex items-center gap-4">
                                <Label className={`w-32 ${textColor}`}>Capienza Massima:</Label>
                                <div className="flex items-center gap-3">
                                    <Input type="number" value={maxCapacity} onChange={e => setMaxCapacity(Number(e.target.value))} className={`w-24 text-center ${isDinner ? 'border-[#334155] bg-[#0F172A]' : 'border-[#EAE5DA]'}`} />
                                    <span className={mutedText}>sedute totali</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    </SI>

                    <SI i={2}>
                    <Card className={cardBg}>
                        <CardHeader className="flex flex-row justify-between items-start">
                            <div>
                                <CardTitle className={`flex items-center gap-2 ${textColor}`}><Clock className={`w-5 h-5 ${accentColor}`} /> Orari Turni (Default)</CardTitle>
                                <CardDescription className={mutedText}>Definisci gli orari base. Clicca la matita per modificare i giorni speciali.</CardDescription>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowDailyHours(!showDailyHours)} className={`transition-colors ${showDailyHours ? (isDinner ? 'bg-[#967D62] text-[#F4F1EA]' : 'bg-[#967D62] text-white') : (isDinner ? 'hover:bg-[#334155] text-[#F4F1EA]' : 'hover:bg-gray-100')}`}>
                                <Pencil className="w-4 h-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-x-4 gap-y-2">
                                <Label className={`font-bold ${textColor}`}>PRANZO</Label>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs w-8 shrink-0 ${mutedText}`}>Inizio</span>
                                    <Input type="time" value={pranzoStart} onChange={e => handleGlobalHourChange('pStart', e.target.value)} className={`w-full ${isDinner ? 'border-[#334155] bg-[#0F172A] [color-scheme:dark]' : 'border-[#EAE5DA]'}`} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs w-8 shrink-0 ${mutedText}`}>Fine</span>
                                    <Input type="time" value={pranzoEnd} onChange={e => handleGlobalHourChange('pEnd', e.target.value)} className={`w-full ${isDinner ? 'border-[#334155] bg-[#0F172A] [color-scheme:dark]' : 'border-[#EAE5DA]'}`} />
                                </div>
                            </div>
                            <Separator className={isDinner ? 'bg-[#334155]' : 'bg-[#EAE5DA]'} />
                            <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-x-4 gap-y-2">
                                <Label className={`font-bold ${textColor}`}>CENA</Label>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs w-8 shrink-0 ${mutedText}`}>Inizio</span>
                                    <Input type="time" value={cenaStart} onChange={e => handleGlobalHourChange('cStart', e.target.value)} className={`w-full ${isDinner ? 'border-[#334155] bg-[#0F172A] [color-scheme:dark]' : 'border-[#EAE5DA]'}`} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs w-8 shrink-0 ${mutedText}`}>Fine</span>
                                    <Input type="time" value={cenaEnd} onChange={e => handleGlobalHourChange('cEnd', e.target.value)} className={`w-full ${isDinner ? 'border-[#334155] bg-[#0F172A] [color-scheme:dark]' : 'border-[#EAE5DA]'}`} />
                                </div>
                            </div>

                            {showDailyHours && (
                                <div className={`mt-8 pt-6 border-t ${isDinner ? 'border-[#334155]' : 'border-[#EAE5DA]'} space-y-4`}>
                                    <h4 className={`font-bold text-sm uppercase tracking-wider mb-4 ${accentColor}`}>Orari Personalizzati per Giorno</h4>
                                    {weekDaysOrdered.map(day => (
                                        <div key={day} className={`flex flex-col lg:flex-row items-start lg:items-center gap-4 p-3 rounded-lg border ${isDinner ? 'bg-[#0F172A] border-[#334155]' : 'bg-gray-50 border-[#EAE5DA]'}`}>
                                            <div className={`w-24 font-bold ${textColor}`}>{day}</div>
                                            <div className="flex flex-wrap items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-semibold uppercase ${mutedText}`}>Pranzo:</span>
                                                    <Input type="time" value={dailyHours[day].pStart} onChange={e => updateDailyHour(day, 'pStart', e.target.value)} className={`w-24 h-8 text-xs ${isDinner ? 'border-[#475569] bg-[#1E293B] [color-scheme:dark]' : 'border-[#D1CCC0] bg-white'}`} />
                                                    <span className={mutedText}>-</span>
                                                    <Input type="time" value={dailyHours[day].pEnd} onChange={e => updateDailyHour(day, 'pEnd', e.target.value)} className={`w-24 h-8 text-xs ${isDinner ? 'border-[#475569] bg-[#1E293B] [color-scheme:dark]' : 'border-[#D1CCC0] bg-white'}`} />
                                                </div>
                                                <div className="hidden lg:block h-4 w-px bg-gray-300 dark:bg-gray-700" />
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-semibold uppercase ${mutedText}`}>Cena:</span>
                                                    <Input type="time" value={dailyHours[day].cStart} onChange={e => updateDailyHour(day, 'cStart', e.target.value)} className={`w-24 h-8 text-xs ${isDinner ? 'border-[#475569] bg-[#1E293B] [color-scheme:dark]' : 'border-[#D1CCC0] bg-white'}`} />
                                                    <span className={mutedText}>-</span>
                                                    <Input type="time" value={dailyHours[day].cEnd} onChange={e => updateDailyHour(day, 'cEnd', e.target.value)} className={`w-24 h-8 text-xs ${isDinner ? 'border-[#475569] bg-[#1E293B] [color-scheme:dark]' : 'border-[#D1CCC0] bg-white'}`} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    </SI>

                    <SI i={3}>
                    <Button onClick={() => setActiveView("Dashboard")} className={`w-full py-6 text-lg font-semibold shadow-sm bg-[#967D62] hover:bg-[#7A654E] ${isDinner ? 'text-[#F4F1EA]' : 'text-white'}`}>
                        Salva e Torna alla Dashboard
                    </Button>
                    </SI>
                </div>
             </main>
  );
}
