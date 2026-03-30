import * as React from "react"

import {
  CalendarDays,
  LayoutDashboard,
  Settings,
  CalendarRange,
  LayoutGrid,
  LogOut,
  UserCircle,
  ArrowRightCircle
} from "lucide-react"



import { Calendar } from "./ui/calendar"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "./ui/sidebar"

const gestionaleItems = [
  { title: "Dashboard", url: "#", icon: LayoutDashboard },
  { title: "Pianificazione", url: "#", icon: CalendarRange },
  { title: "Impostazioni", url: "#", icon: Settings },
]

interface DashboardSidebarProps extends React.ComponentProps<typeof Sidebar> {
  pastShiftsStatus?: { date: Date; status: string }[];
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  activeView?: string;
  onViewChange?: (view: string) => void;
  onLogout?: () => void;
  appRole?: string;
  userEmail?: string;
}

export function DashboardSidebar({ pastShiftsStatus = [], selectedDate, onSelectDate, activeView = "Dashboard", onViewChange, onLogout, appRole, userEmail, ...props }: DashboardSidebarProps) {

  const currentDateObj = selectedDate ? new Date(selectedDate + 'T12:00:00') : new Date();

  const handleDateSelect = (date: Date | undefined) => {
    if (date && onSelectDate) {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      onSelectDate(`${yyyy}-${mm}-${dd}`);
    }
  };

  const missingOneDates = pastShiftsStatus.filter(s => s.status === 'missing_one').map(s => s.date);
  const missingBothDates = pastShiftsStatus.filter(s => s.status === 'missing_both').map(s => s.date);

  // Usa le voci del gestionale (tutte le sezioni)
  const items = gestionaleItems;

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="mb-6 mt-4 h-auto hover:bg-transparent" asChild>
              <a href="#" className="flex items-center gap-4">
                <div className="flex aspect-square size-12 items-center justify-center rounded-xl bg-[#F4F1EA] p-2 shrink-0 shadow-md border border-[#EAE5DA]">
                  <img src="/alea-logo.jpeg" alt="Alea Logo" className="w-full h-full object-contain" />
                </div>
                <svg
                  viewBox="0 0 108 40"
                  className="h-10 w-auto text-[#3E2723] dark:text-[#F4F1EA]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                >
                  <polyline points="2,32 14,8 26,32" />
                  <polyline points="34,8 34,32 50,32" />
                  <polyline points="74,8 58,8 58,32 74,32" />
                  <line x1="58" y1="20" x2="70" y2="20" />
                  <polyline points="82,32 94,8 106,32" />
                </svg>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Piattaforma</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={activeView === item.title}
                    tooltip={item.title}
                    onClick={(e) => {
                      e.preventDefault();
                      if (onViewChange) onViewChange(item.title);
                    }}
                    asChild
                  >
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-0" />
      </SidebarContent>

      <SidebarFooter className="p-2 space-y-2">
        <div className="rounded-lg border bg-sidebar-accent/50 p-1">
          <Calendar
            mode="single"
            selected={currentDateObj}
            onSelect={handleDateSelect}
            className="w-full flex justify-center p-2"
            modifiers={{
              missingOne: missingOneDates,
              missingBoth: missingBothDates
            }}
            modifiersClassNames={{
              missingOne: "after:content-['!'] after:absolute after:top-0.5 after:right-1 after:text-red-500 after:text-[11px] after:font-black",
              missingBoth: "after:content-['!!'] after:absolute after:top-0.5 after:right-0 after:text-red-500 after:text-[11px] after:font-black"
            }}
            classNames={{
              head_cell: "w-8 text-xs text-muted-foreground",
              cell: "h-8 w-8 text-center text-sm p-0 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "relative h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md",
              day_today: "font-semibold",
            }}
          />
        </div>

        <SidebarSeparator className="mx-0" />

        <SidebarMenu>
          {/* BOTTONE TORNA ALLA SELEZIONE RUOLO */}
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" onClick={onLogout} className="hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors cursor-pointer">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#967D62]/10 text-[#967D62]">
                <ArrowRightCircle className="size-5 rotate-180" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold text-sm">Cambia Modalità</span>
                <span className="truncate text-xs text-muted-foreground">Torna alla selezione</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* INFO UTENTE */}
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="cursor-default hover:bg-transparent">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-black/5 dark:bg-white/10 text-[#2C2A28] dark:text-[#F4F1EA]">
                <UserCircle className="size-5" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold text-sm">Account</span>
                <span className="truncate text-xs text-muted-foreground">{userEmail || '—'}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
