import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Flame, Pill, Wind, CalendarCheck, Leaf, Trophy, AlertTriangle,
  Dumbbell, DollarSign, Phone, ChevronRight, Plus, Check, Sparkles,
  TrendingDown, X, GripVertical, EyeOff, Eye, RotateCcw, Clock,
  ArrowRight, Share2, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { hasFeatureAccess } from "@/components/useTrialAccess";

/* ──────────────────────────────────────────────────────────────────
   Tile registry — single source of truth for every dashboard widget
   ────────────────────────────────────────────────────────────────── */

const TILE_REGISTRY = {
  todaySnapshot:   { name: "Today's snapshot",  size: "wide",   defaultOn: true,  free: true  },
  painCheckIn:     { name: "Pain check-in",     size: "normal", defaultOn: true,  free: true  },
  medsToday:       { name: "Medications",       size: "normal", defaultOn: true,  free: false },
  nextAppointment: { name: "Next appointment",  size: "normal", defaultOn: true,  free: false },
  energyPacing:    { name: "Energy & pacing",   size: "normal", defaultOn: true,  free: true  },
  flareTrend:      { name: "Flare trend",       size: "wide",   defaultOn: true,  free: false },
  mindfulness:     { name: "Mindfulness",       size: "normal", defaultOn: true,  free: false },
  achievements:    { name: "Recent wins",       size: "normal", defaultOn: true,  free: true  },
  emergency:       { name: "Emergency share",   size: "normal", defaultOn: true,  free: false },
  peakFlow:        { name: "Peak flow",         size: "normal", defaultOn: false, free: false },
  exercises:       { name: "Today's exercises", size: "normal", defaultOn: false, free: false },
  expenses:        { name: "Expenses",          size: "normal", defaultOn: false, free: false },
};

const DEFAULT_LAYOUT = Object.entries(TILE_REGISTRY)
  .filter(([, c]) => c.defaultOn)
  .map(([id]) => id);

const STORAGE_KEY = "wn:dashboard-layout:v1";

function useDashboardLayout() {
  const [layout, setLayout] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return DEFAULT_LAYOUT;
  });
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(layout)); } catch {}
  }, [layout]);
  const reset = useCallback(() => setLayout(DEFAULT_LAYOUT), []);
  return { layout, setLayout, reset };
}

/* ──────────────────────────────────────────────────────────────────
   Data — swap mockTodayData() with real base44 queries when ready
   ────────────────────────────────────────────────────────────────── */

const partOfDay = () => {
  const h = new Date().getHours();
  if (h < 5)  return "evening";
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
};

function useDashboardData(user) {
  return useQuery({
    queryKey: ["dashboard-today", user?.id],
    queryFn: async () => ({
      greeting: { name: user?.full_name?.split(" ")[0] || "friend", part: partOfDay() },
      pain:    { current: 3, weekAvg: 4.1, trend: [5,4,5,3,4,3,3] },
      meds: [
        { id: 1, name: "Pregabalin 75mg", time: "08:00", taken: true  },
        { id: 2, name: "Naproxen 250mg",  time: "12:00", taken: true  },
        { id: 3, name: "Ventolin",        time: "14:00", taken: true  },
        { id: 4, name: "Pregabalin 75mg", time: "20:00", taken: false },
      ],
      nextAppointment: {
        title: "Pain Clinic — Dr. Whitlow",
        when: "Tomorrow · 14:30",
        location: "Royal United Hospital",
        prepNotes: 3,
      },
      energy: { used: 38, budget: 60, planned: 4 },
      flares: { thisWeek: 2, lastWeek: 4, daily: [1,3,0,2,0,4,0] },
      mindfulness: { streak: 12, last: "Yesterday · Box breathing 5 min" },
      achievements: [
        { id: 1, label: "12-day mindfulness streak", icon: Leaf },
        { id: 2, label: "All meds on time · 7 days", icon: Pill  },
      ],
      peakFlow:  { now: 460, baseline: 480, zone: "green" },
      exercises: [
        { id: 1, label: "Diaphragmatic breathing", mins: 5, done: true  },
        { id: 2, label: "Gentle stretch routine",  mins: 8, done: false },
      ],
      expenses:  { thisMonth: 247.50, claimable: 124.00, count: 9 },
    }),
    staleTime: 30_000,
  });
}

/* ──────────────────────────────────────────────────────────────────
   Shared chrome
   ────────────────────────────────────────────────────────────────── */

const Card = ({ children, className = "", as = "div" }) => {
  const Cmp = as;
  return (
    <Cmp
      className={`relative bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-200 transition-colors ${className}`}
    >
      {children}
    </Cmp>
  );
};

const TileHeader = ({ icon: Icon, title, accent = "emerald", action }) => (
  <div className="flex items-center justify-between px-5 pt-5">
    <div className="flex items-center gap-2.5">
      <span className={`flex items-center justify-center w-8 h-8 rounded-xl bg-${accent}-50 text-${accent}-600`}>
        <Icon className="w-4 h-4" />
      </span>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
    </div>
    {action}
  </div>
);

const Sparkline = ({ values, stroke = "#059669", height = 38, fill = true }) => {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const w = 120, h = height, pad = 2;
  const sx = (i) => pad + (i / (values.length - 1)) * (w - pad * 2);
  const sy = (v) => h - pad - ((v - min) / Math.max(max - min, 1)) * (h - pad * 2);
  const d = values.map((v, i) => `${i === 0 ? "M" : "L"} ${sx(i)} ${sy(v)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-9">
      {fill && (
        <>
          <defs>
            <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${d} L ${w - pad} ${h} L ${pad} ${h} Z`} fill="url(#spark)" />
        </>
      )}
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/* ──────────────────────────────────────────────────────────────────
   Individual tiles
   ────────────────────────────────────────────────────────────────── */

const TodaySnapshotTile = ({ data }) => {
  const navigate = useNavigate();
  const undoneMeds = data.meds.filter(m => !m.taken).length;
  return (
    <Card className="lg:col-span-2 bg-gradient-to-br from-emerald-50 via-white to-white">
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-emerald-100/60 blur-3xl pointer-events-none" />
      <div className="relative p-6 lg:p-7">
        <p className="text-[11px] uppercase tracking-widest text-gray-400">Today</p>
        <h2 className="mt-1 text-2xl lg:text-3xl font-semibold text-gray-900">
          Good {data.greeting.part}, {data.greeting.name}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {undoneMeds === 0
            ? "Every dose ticked off. Take a breath — you've earned it."
            : `${undoneMeds} dose${undoneMeds > 1 ? "s" : ""} left today, then you're done.`}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <Stat label="Pain"   value={data.pain.current} suffix="/10" delta={data.pain.current < data.pain.weekAvg ? "down" : "up"} />
          <Stat label="Meds"   value={`${data.meds.filter(m => m.taken).length}/${data.meds.length}`} hint="today" />
          <Stat label="Energy" value={`${Math.round((data.energy.used / data.energy.budget) * 100)}%`} hint="of budget" />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={() => navigate(createPageUrl("CRPSmate"))} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-9">
            <Plus className="w-3.5 h-3.5" /> Log a flare
          </Button>
          <Button onClick={() => navigate(createPageUrl("Mindfulness"))} variant="outline" className="rounded-xl text-xs gap-1.5 h-9">
            <Leaf className="w-3.5 h-3.5 text-emerald-600" /> Breathe 2 min
          </Button>
        </div>
      </div>
    </Card>
  );
};

const Stat = ({ label, value, suffix, hint, delta }) => (
  <div className="rounded-xl bg-white border border-gray-100 p-3">
    <p className="text-[10px] uppercase tracking-wider text-gray-400">{label}</p>
    <p className="mt-1 text-2xl font-semibold text-gray-900">
      {value}{suffix && <span className="text-sm text-gray-400">{suffix}</span>}
    </p>
    {hint && <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>}
    {delta === "down" && <p className="text-[10px] text-emerald-600 mt-0.5 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> better than avg</p>}
  </div>
);

const PainTile = ({ data, navigate }) => (
  <Card>
    <TileHeader
      icon={Flame}
      title="Pain check-in"
      accent="rose"
      action={<Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => navigate(createPageUrl("CRPSmate"))}>Open <ChevronRight className="w-3 h-3 ml-0.5" /></Button>}
    />
    <div className="px-5 pb-5 pt-4">
      <div className="flex items-end gap-3">
        <div>
          <p className="text-4xl font-semibold text-gray-900">{data.pain.current}<span className="text-base text-gray-400">/10</span></p>
          <p className="text-xs text-gray-500">7-day avg {data.pain.weekAvg}</p>
        </div>
        <div className="flex-1"><Sparkline values={data.pain.trend} stroke="#f43f5e" /></div>
      </div>
      <div className="mt-4 flex items-center gap-1.5">
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <button key={n} className="flex-1 py-1.5 rounded-lg text-[11px] font-medium border border-gray-100 hover:border-rose-300 hover:bg-rose-50 text-gray-500 hover:text-rose-700 transition-colors">{n}</button>
        ))}
      </div>
    </div>
  </Card>
);

const MedsTile = ({ data }) => {
  const [meds, setMeds] = useState(data.meds);
  const taken = meds.filter(m => m.taken).length;
  const toggle = (id) => setMeds(ms => ms.map(m => m.id === id ? { ...m, taken: !m.taken } : m));
  return (
    <Card>
      <TileHeader
        icon={Pill}
        title="Today's meds"
        accent="emerald"
        action={<span className="text-xs text-gray-400">{taken}/{meds.length}</span>}
      />
      <ul className="px-3 pb-3 pt-3 space-y-1">
        {meds.map(m => (
          <li key={m.id}>
            <button
              onClick={() => toggle(m.id)}
              className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg transition-colors ${m.taken ? "bg-emerald-50/60" : "hover:bg-gray-50"}`}
            >
              <span className={`flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all ${m.taken ? "bg-emerald-500 border-emerald-500" : "border-gray-300"}`}>
                {m.taken && <Check className="w-3 h-3 text-white" />}
              </span>
              <span className={`flex-1 text-left text-sm ${m.taken ? "text-gray-400 line-through" : "text-gray-700"}`}>{m.name}</span>
              <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{m.time}</span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
};

const NextAppointmentTile = ({ data, navigate }) => (
  <Card>
    <TileHeader
      icon={CalendarCheck}
      title="Next appointment"
      accent="sky"
      action={<Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => navigate(createPageUrl("Appointments"))}>All <ChevronRight className="w-3 h-3 ml-0.5" /></Button>}
    />
    <div className="px-5 pb-5 pt-3">
      <p className="text-base font-semibold text-gray-900">{data.nextAppointment.title}</p>
      <p className="text-sm text-gray-500 mt-0.5">{data.nextAppointment.when}</p>
      <p className="text-xs text-gray-400 mt-0.5">{data.nextAppointment.location}</p>
      <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] bg-sky-50 text-sky-700 border border-sky-100">
        <Sparkles className="w-3 h-3" /> {data.nextAppointment.prepNotes} prep notes ready
      </div>
    </div>
  </Card>
);

const EnergyTile = ({ data }) => {
  const pct = Math.min(100, Math.round((data.energy.used / data.energy.budget) * 100));
  const overBudget = data.energy.used > data.energy.budget;
  return (
    <Card>
      <TileHeader icon={Activity} title="Energy & pacing" accent="amber" />
      <div className="px-5 pb-5 pt-3">
        <div className="flex items-baseline justify-between">
          <p className="text-3xl font-semibold text-gray-900">{data.energy.used}<span className="text-sm text-gray-400">/{data.energy.budget}</span></p>
          <span className="text-xs text-gray-500">{data.energy.planned} activities planned</span>
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className={`h-full rounded-full ${overBudget ? "bg-rose-500" : "bg-gradient-to-r from-emerald-400 to-emerald-600"}`}
          />
        </div>
        <p className="mt-2 text-[11px] text-gray-500">
          {overBudget ? "You're past today's budget — be gentle." : `${data.energy.budget - data.energy.used} units left for today.`}
        </p>
      </div>
    </Card>
  );
};

const FlareTrendTile = ({ data, navigate }) => (
  <Card className="lg:col-span-2">
    <TileHeader
      icon={Flame}
      title="Flare trend · last 7 days"
      accent="rose"
      action={<Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => navigate(createPageUrl("CRPSmate"))}>Log <Plus className="w-3 h-3 ml-0.5" /></Button>}
    />
    <div className="px-5 pb-5 pt-3">
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-3xl font-semibold text-gray-900">{data.flares.thisWeek}<span className="text-sm text-gray-400 ml-1">flares</span></p>
          <p className="text-xs text-emerald-600 mt-0.5">↓ {data.flares.lastWeek - data.flares.thisWeek} vs last week</p>
        </div>
      </div>
      <div className="flex items-end gap-1.5 h-20">
        {data.flares.daily.map((v, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${(v / 5) * 100 || 6}%` }}
            transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
            className={`flex-1 rounded-t-md ${v === 0 ? "bg-gray-100" : v <= 2 ? "bg-rose-200" : "bg-rose-400"}`}
          />
        ))}
      </div>
    </div>
  </Card>
);

const MindfulnessTile = ({ data, navigate }) => (
  <Card>
    <TileHeader
      icon={Leaf}
      title="Mindfulness"
      accent="emerald"
      action={<span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">🔥 {data.mindfulness.streak}</span>}
    />
    <div className="px-5 pb-5 pt-3">
      <p className="text-sm text-gray-600">{data.mindfulness.last}</p>
      <Button onClick={() => navigate(createPageUrl("Mindfulness"))} className="mt-4 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 gap-1.5">
        <Sparkles className="w-3.5 h-3.5" /> Start a 2-minute reset
      </Button>
    </div>
  </Card>
);

const AchievementsTile = ({ data, navigate }) => (
  <Card>
    <TileHeader
      icon={Trophy}
      title="Recent wins"
      accent="amber"
      action={<Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => navigate(createPageUrl("Achievements"))}>All <ChevronRight className="w-3 h-3 ml-0.5" /></Button>}
    />
    <ul className="px-3 pb-3 pt-3 space-y-1">
      {data.achievements.map(a => (
        <li key={a.id} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-amber-50/40 transition-colors">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-50 text-amber-600">
            <a.icon className="w-3.5 h-3.5" />
          </span>
          <span className="text-sm text-gray-700">{a.label}</span>
        </li>
      ))}
    </ul>
  </Card>
);

const EmergencyTile = ({ navigate }) => (
  <Card className="bg-gradient-to-br from-rose-50 via-white to-white">
    <TileHeader icon={AlertTriangle} title="Emergency Plan" accent="rose" />
    <div className="px-5 pb-5 pt-3">
      <p className="text-sm text-gray-600">Meds, allergies, contacts and pain plan — ready to share with one tap.</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button onClick={() => navigate(createPageUrl("Emergency"))} className="rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs h-9 gap-1.5">
          <Share2 className="w-3.5 h-3.5" /> Share now
        </Button>
        <Button onClick={() => navigate(createPageUrl("Emergency"))} variant="outline" className="rounded-xl text-xs h-9">View plan</Button>
      </div>
    </div>
  </Card>
);

const PeakFlowTile = ({ data }) => {
  const pct = Math.min(100, Math.round((data.peakFlow.now / data.peakFlow.baseline) * 100));
  return (
    <Card>
      <TileHeader icon={Wind} title="Peak flow" accent="sky" />
      <div className="px-5 pb-5 pt-3">
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-semibold text-gray-900">{data.peakFlow.now}</p>
          <p className="text-xs text-gray-400">/ {data.peakFlow.baseline} baseline</p>
        </div>
        <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className={`h-full ${pct > 80 ? "bg-emerald-500" : pct > 50 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-[11px] text-emerald-600 capitalize">{data.peakFlow.zone} zone</p>
      </div>
    </Card>
  );
};

const ExercisesTile = ({ data, navigate }) => (
  <Card>
    <TileHeader
      icon={Dumbbell}
      title="Today's exercises"
      accent="amber"
      action={<Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => navigate(createPageUrl("Exercises"))}>Open <ChevronRight className="w-3 h-3 ml-0.5" /></Button>}
    />
    <ul className="px-3 pb-3 pt-3 space-y-1">
      {data.exercises.map(e => (
        <li key={e.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50">
          <span className={`w-2 h-2 rounded-full ${e.done ? "bg-emerald-500" : "bg-gray-300"}`} />
          <span className={`flex-1 text-sm ${e.done ? "text-gray-400 line-through" : "text-gray-700"}`}>{e.label}</span>
          <span className="text-xs text-gray-400">{e.mins}m</span>
        </li>
      ))}
    </ul>
  </Card>
);

const ExpensesTile = ({ data, navigate }) => (
  <Card>
    <TileHeader
      icon={DollarSign}
      title="Expenses · this month"
      accent="emerald"
      action={<Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => navigate(createPageUrl("Expenses"))}>Open <ChevronRight className="w-3 h-3 ml-0.5" /></Button>}
    />
    <div className="px-5 pb-5 pt-3">
      <p className="text-3xl font-semibold text-gray-900">${data.expenses.thisMonth.toFixed(2)}</p>
      <p className="text-xs text-gray-500 mt-0.5">{data.expenses.count} receipts · ${data.expenses.claimable.toFixed(2)} claimable</p>
    </div>
  </Card>
);

const LockedTile = ({ id }) => {
  const c = TILE_REGISTRY[id];
  const navigate = useNavigate();
  return (
    <Card className="bg-gray-50/50">
      <div className="px-5 py-6 text-center">
        <p className="text-xs uppercase tracking-widest text-gray-400">Premium</p>
        <p className="mt-1 text-sm font-semibold text-gray-700">{c.name}</p>
        <p className="mt-2 text-xs text-gray-500">Unlock to add this tile to your dashboard.</p>
        <Button onClick={() => navigate(createPageUrl("Pricing"))} className="mt-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs h-8">Upgrade</Button>
      </div>
    </Card>
  );
};

/* ──────────────────────────────────────────────────────────────────
   Tile dispatcher
   ────────────────────────────────────────────────────────────────── */

function renderTile(id, { data, navigate, premium }) {
  const cfg = TILE_REGISTRY[id];
  if (!cfg) return null;
  if (!cfg.free && !premium) return <LockedTile id={id} />;
  switch (id) {
    case "todaySnapshot":   return <TodaySnapshotTile   data={data} />;
    case "painCheckIn":     return <PainTile            data={data} navigate={navigate} />;
    case "medsToday":       return <MedsTile            data={data} />;
    case "nextAppointment": return <NextAppointmentTile data={data} navigate={navigate} />;
    case "energyPacing":    return <EnergyTile          data={data} />;
    case "flareTrend":      return <FlareTrendTile      data={data} navigate={navigate} />;
    case "mindfulness":     return <MindfulnessTile     data={data} navigate={navigate} />;
    case "achievements":    return <AchievementsTile    data={data} navigate={navigate} />;
    case "emergency":       return <EmergencyTile       navigate={navigate} />;
    case "peakFlow":        return <PeakFlowTile        data={data} />;
    case "exercises":       return <ExercisesTile       data={data} navigate={navigate} />;
    case "expenses":        return <ExpensesTile        data={data} navigate={navigate} />;
    default: return null;
  }
}

/* ──────────────────────────────────────────────────────────────────
   Customizer modal — reorder + show/hide tiles
   ────────────────────────────────────────────────────────────────── */

const Customizer = ({ open, onClose, layout, setLayout, reset }) => {
  const allIds = Object.keys(TILE_REGISTRY);
  const hidden = allIds.filter(id => !layout.includes(id));
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            initial={{ y: 40, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 40, scale: 0.98 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold">Customise dashboard</h2>
                <p className="text-xs text-gray-500 mt-0.5">Drag to reorder. Tap to hide or show.</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              <div className="px-3 py-3">
                <p className="px-2 text-[10px] uppercase tracking-widest text-gray-400 mb-1.5">Visible</p>
                <Reorder.Group axis="y" values={layout} onReorder={setLayout} className="space-y-1">
                  {layout.map(id => (
                    <Reorder.Item key={id} value={id}
                      className="flex items-center gap-2 px-2 py-2 rounded-lg bg-white hover:bg-gray-50 cursor-grab active:cursor-grabbing"
                    >
                      <GripVertical className="w-4 h-4 text-gray-300" />
                      <span className="flex-1 text-sm text-gray-700">{TILE_REGISTRY[id]?.name}</span>
                      <button
                        onClick={() => setLayout(l => l.filter(x => x !== id))}
                        className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        title="Hide"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                      </button>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </div>

              {hidden.length > 0 && (
                <div className="px-3 py-3 border-t border-gray-100">
                  <p className="px-2 text-[10px] uppercase tracking-widest text-gray-400 mb-1.5">Hidden</p>
                  <ul className="space-y-1">
                    {hidden.map(id => (
                      <li key={id} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50">
                        <span className="w-4" />
                        <span className="flex-1 text-sm text-gray-500">{TILE_REGISTRY[id]?.name}</span>
                        <button
                          onClick={() => setLayout(l => [...l, id])}
                          className="p-1.5 rounded-md text-gray-400 hover:bg-emerald-50 hover:text-emerald-700"
                          title="Show"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
              <Button variant="ghost" size="sm" className="text-xs gap-1.5 h-8" onClick={reset}>
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </Button>
              <Button onClick={onClose} className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs h-8">Done</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ──────────────────────────────────────────────────────────────────
   The page
   ────────────────────────────────────────────────────────────────── */

export default function Dashboard() {
  const navigate = useNavigate();
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const { layout, setLayout, reset } = useDashboardLayout();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });
  const premium = hasFeatureAccess(user);

  const { data, isLoading } = useDashboardData(user);

  // Listen for the event Layout.jsx already dispatches
  useEffect(() => {
    const open = () => setCustomizerOpen(true);
    window.addEventListener("open-dashboard-customizer", open);

    // ?customize=true deep link from Layout.jsx
    const url = new URL(window.location.href);
    if (url.searchParams.get("customize") === "true") {
      setCustomizerOpen(true);
      url.searchParams.delete("customize");
      window.history.replaceState({}, "", url.toString());
    }
    return () => window.removeEventListener("open-dashboard-customizer", open);
  }, []);

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-44 rounded-2xl bg-white border border-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* tile grid — auto-flows; wide tiles span 2 cols on lg+ */}
      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-min gap-4"
      >
        <AnimatePresence mode="popLayout">
          {layout.map(id => {
            const cfg = TILE_REGISTRY[id];
            if (!cfg) return null;
            return (
              <motion.div
                key={id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={cfg.size === "wide" ? "lg:col-span-2" : ""}
              >
                {renderTile(id, { data, navigate, premium })}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      <Customizer
        open={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        layout={layout}
        setLayout={setLayout}
        reset={reset}
      />
    </div>
  );
}
