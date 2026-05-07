# WellNest — Dashboard page

Drop-in `Dashboard.jsx` for the existing WellNest React app. Uses the
exact stack already in use in `Layout.jsx`:

- `react`, `react-router-dom`
- `framer-motion` (Reorder + AnimatePresence)
- `@tanstack/react-query`
- `lucide-react`
- `@/api/base44Client`
- `@/components/ui/button` (shadcn)
- `@/utils#createPageUrl`
- `@/components/useTrialAccess#hasFeatureAccess`

## Install

Copy `src/pages/Dashboard.jsx` to your app's `src/pages/Dashboard.jsx`.
That's it — no other dependencies. Mock data lives inside `useDashboardData()`;
swap to real `base44.entities.*.list()` calls when you're ready.

## What's included

**Twelve tile types** registered in `TILE_REGISTRY`:

| ID                | Tile                | Size   | Default | Free |
|-------------------|---------------------|--------|---------|------|
| `todaySnapshot`   | Today's snapshot    | wide   | ✓       | ✓    |
| `painCheckIn`     | Pain check-in       | normal | ✓       | ✓    |
| `medsToday`       | Medications         | normal | ✓       |      |
| `nextAppointment` | Next appointment    | normal | ✓       |      |
| `energyPacing`    | Energy & pacing     | normal | ✓       | ✓    |
| `flareTrend`      | Flare trend         | wide   | ✓       |      |
| `mindfulness`     | Mindfulness         | normal | ✓       |      |
| `achievements`    | Recent wins         | normal | ✓       | ✓    |
| `emergency`       | Emergency share     | normal | ✓       |      |
| `peakFlow`        | Peak flow           | normal |         |      |
| `exercises`       | Today's exercises   | normal |         |      |
| `expenses`        | Expenses this month | normal |         |      |

Premium-gated tiles render a `<LockedTile>` upgrade prompt for free users.

**Customizer modal** — opens via the `open-dashboard-customizer` event
that `Layout.jsx` already dispatches when the user taps the menu button
on the Dashboard page, plus the `?customize=true` deep link from other
pages. Drag to reorder (framer-motion `Reorder.Group`), tap eye icons
to hide/show, Reset returns to defaults.

**Persistence** — tile order and visibility persist to `localStorage`
under `wn:dashboard-layout:v1`. Move that to a base44 entity for
cross-device sync when ready.

**Motion** — every tile fades+lifts in on mount, charts and progress
bars animate to value, the Customizer slides up with a backdrop blur.

## Wiring real data

Replace `useDashboardData()`'s mock with parallel queries:

```js
function useDashboardData(user) {
  const today = new Date().toISOString().slice(0, 10);
  return useQueries({
    queries: [
      { queryKey: ["meds", today], queryFn: () => base44.entities.MedDose.list({ date: today }) },
      { queryKey: ["pain", "7d"],  queryFn: () => base44.entities.PainEntry.list({ since: '-7d' }) },
      { queryKey: ["appt", "next"], queryFn: () => base44.entities.Appointment.next() },
      // ...
    ],
    combine: (results) => ({ /* shape into the same object as the mock */ }),
  });
}
```

The render path doesn't change.
