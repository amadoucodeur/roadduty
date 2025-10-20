// generate-hos.ts
export type Status = "sleeper" | "off-duty" | "on-duty" | "driving";

export type Event = {
  status: Status;
  startHour: number; // 0..24 (heure locale du jour)
  endHour: number;   // 0..24
};

export type DayEvents = {
  day: number;       // 0 = jour initial t0..24h
  events: Event[];   // événements ordonnés pour ce jour
};

export type Leg = {
  // durée de conduite entre deux points (heures, décimal accepté)
  driveHours: number;
  // optionnel : durée de chargement sur la destination (heures)
  loadHours?: number;
  // optionnel : durée de déchargement sur la destination (heures)
  unloadHours?: number;
  // description libre (utile pour remarks)
  label?: string;
};

export type Options = {
  restBeforeStartHours?: number;         // repos initial (heures) - défaut 10
  preDriveOnDutyHours?: number;          // préparation avant 1ère conduite (heures) - défaut 0.5
  defaultLoadHours?: number;             // si leg.loadHours absent (heures) - défaut 1
  defaultUnloadHours?: number;           // si leg.unloadHours absent (heures) - défaut 1
  maxWindowHours?: number;               // fenêtre de service (heures) - défaut 14
  maxDrivingHoursPerWindow?: number;     // max conduite par fenêtre (heures) - défaut 11
  maxContinuousDrivingHours?: number;    // seuil conduite continue (heures) - défaut 8
  breakMinutesAfterContinuous?: number;  // pause obligatoire après seuil continuous (min) - défaut 30
  restAfterWindowHours?: number;         // repos obligatoire après fenêtre/11h (heures) - défaut 10
  restartHours?: number;                 // restart length (heures) - défaut 34
  cycleLimitHours?: number;              // limite du cycle (heures) - défaut 70
  maxPlanHours?: number;                 // horizon max de génération (heures) - défaut 7*24
};

type InternalEvent = {
  status: Status;
  startMin: number; // minutes depuis t0 (global)
  endMin: number;   // minutes depuis t0
};

export function generateHOSPlanPerDay(
  legs: Leg[],                        // liste d'étapes (drive + load/unload)
  hoursUsedInCycle: number,           // heures déjà utilisées sur les 8 derniers jours
  opts?: Options
): { perDay: DayEvents[]; notes: string[]; finalCycleUsedHours: number } {
  // --- options par défaut ---
  const o = {
    restBeforeStartHours: opts?.restBeforeStartHours ?? 10,
    preDriveOnDutyHours: opts?.preDriveOnDutyHours ?? 0.5,
    defaultLoadHours: opts?.defaultLoadHours ?? 1,
    defaultUnloadHours: opts?.defaultUnloadHours ?? 1,
    maxWindowHours: opts?.maxWindowHours ?? 14,
    maxDrivingHoursPerWindow: opts?.maxDrivingHoursPerWindow ?? 11,
    maxContinuousDrivingHours: opts?.maxContinuousDrivingHours ?? 8,
    breakMinutesAfterContinuous: opts?.breakMinutesAfterContinuous ?? 30,
    restAfterWindowHours: opts?.restAfterWindowHours ?? 10,
    restartHours: opts?.restartHours ?? 34,
    cycleLimitHours: opts?.cycleLimitHours ?? 70,
    maxPlanHours: opts?.maxPlanHours ?? 7 * 24,
  };

  // helpers conversions
  const toMin = (h: number) => Math.round(h * 60);
  const clampNonNeg = (n: number) => (n < 0 ? 0 : n);

  // constantes minutes
  const INITIAL_REST_MIN = clampNonNeg(toMin(o.restBeforeStartHours));
  const PRE_DRIVE_MIN = clampNonNeg(toMin(o.preDriveOnDutyHours));
  const DEFAULT_LOAD_MIN = clampNonNeg(toMin(o.defaultLoadHours));
  const DEFAULT_UNLOAD_MIN = clampNonNeg(toMin(o.defaultUnloadHours));
  const WINDOW_MIN = clampNonNeg(toMin(o.maxWindowHours));
  const MAX_DRIVE_PER_WINDOW_MIN = clampNonNeg(toMin(o.maxDrivingHoursPerWindow));
  const MAX_CONTINUOUS_DRIVE_MIN = clampNonNeg(toMin(o.maxContinuousDrivingHours));
  const BREAK_AFTER_CONTINUOUS_MIN = Math.max(1, Math.round(o.breakMinutesAfterContinuous));
  const REST_AFTER_WINDOW_MIN = clampNonNeg(toMin(o.restAfterWindowHours));
  const RESTART_MIN = clampNonNeg(toMin(o.restartHours));
  const CYCLE_LIMIT_MIN = clampNonNeg(toMin(o.cycleLimitHours));
  const PLAN_HORIZON_MIN = clampNonNeg(toMin(o.maxPlanHours));

  // sortie interne (liste d'événements globales en minutes)
  const internalEvents: InternalEvent[] = [];
  const notes: string[] = [];

  // états
  let nowMin = 0; // temps global en minutes depuis t0
  let usedInCycleMin = Math.max(0, Math.round(hoursUsedInCycle * 60));
  let windowRemainingMin = WINDOW_MIN;
  let drivingRemainingInWindowMin = MAX_DRIVE_PER_WINDOW_MIN;
  let continuousDriveSinceBreakMin = 0;

  // sécurité anti-boucle
  let iter = 0;
  const MAX_ITER = 50000;
  const ensureSafety = () => {
    iter++;
    if (iter > MAX_ITER) throw new Error("Sécurité : trop d'itérations dans la génération HOS.");
  };

  // push internal event (fusionne événements contigus identiques)
  const pushInternal = (status: Status, startMin: number, endMin: number) => {
    if (endMin <= startMin) return;
    // arrondir start/end pour éviter infinitésimales
    const s = Math.round(startMin);
    const e = Math.round(endMin);
    const last = internalEvents[internalEvents.length - 1];
    if (last && last.status === status && last.endMin === s) {
      last.endMin = e;
    } else {
      internalEvents.push({ status, startMin: s, endMin: e });
    }
  };

  // si repos initial >= restart -> réinit cycle
  if (INITIAL_REST_MIN >= RESTART_MIN && usedInCycleMin > 0) {
    notes.push(`Repos initial >= ${o.restartHours}h : compteur 70h/8j réinitialisé.`);
    usedInCycleMin = 0;
  }

  // si déjà dépassé cycle -> forcer restart avant démarrage
  if (usedInCycleMin >= CYCLE_LIMIT_MIN) {
    notes.push(`Déjà ${Math.round(usedInCycleMin / 60)}h dans le cycle : insertion d'un restart ${o.restartHours}h avant démarrage.`);
    pushInternal("sleeper", nowMin, nowMin + RESTART_MIN);
    nowMin += RESTART_MIN;
    usedInCycleMin = 0;
    // reset fenêtre
    windowRemainingMin = WINDOW_MIN;
    drivingRemainingInWindowMin = MAX_DRIVE_PER_WINDOW_MIN;
    continuousDriveSinceBreakMin = 0;
  }

  // placer repos initial (sleeper)
  if (INITIAL_REST_MIN > 0) {
    pushInternal("sleeper", nowMin, nowMin + INITIAL_REST_MIN);
    nowMin += INITIAL_REST_MIN;
    if (INITIAL_REST_MIN < toMin(10)) {
      notes.push(`Attention : repos initial ${(INITIAL_REST_MIN/60).toFixed(2)}h < 10h. Fenêtre de 14h peut ne pas être réinitialisée formellement.`);
    }
  }

  // helper : check cycle et insérer restart si besoin
  const ensureCycleCapacityOrRestart = () => {
    ensureSafety();
    if (usedInCycleMin >= CYCLE_LIMIT_MIN) {
      // insert restart
      pushInternal("sleeper", nowMin, nowMin + RESTART_MIN);
      nowMin += RESTART_MIN;
      usedInCycleMin = 0;
      windowRemainingMin = WINDOW_MIN;
      drivingRemainingInWindowMin = MAX_DRIVE_PER_WINDOW_MIN;
      continuousDriveSinceBreakMin = 0;
      notes.push(`Restart ${o.restartHours}h inséré (cycle 70h atteint).`);
    }
  };

  // Consommer service (on-duty non-driving)
  const consumeService = (durMinInit: number) => {
    let remain = Math.max(0, Math.round(durMinInit));
    while (remain > 0) {
      ensureSafety();
      if (nowMin > PLAN_HORIZON_MIN + 24 * 60) {
        notes.push("Avertissement : horizon planification dépassé. Plan partiel retourné.");
        return;
      }

      if (windowRemainingMin <= 0) {
        // fin de fenêtre -> repos long
        pushInternal("sleeper", nowMin, nowMin + REST_AFTER_WINDOW_MIN);
        nowMin += REST_AFTER_WINDOW_MIN;
        windowRemainingMin = WINDOW_MIN;
        drivingRemainingInWindowMin = MAX_DRIVE_PER_WINDOW_MIN;
        continuousDriveSinceBreakMin = 0;
        continue;
      }

      ensureCycleCapacityOrRestart();

      const cycleRemain = Math.max(0, CYCLE_LIMIT_MIN - usedInCycleMin);
      if (cycleRemain <= 0) continue; // prochaine itération insérera restart

      const allowed = Math.min(remain, windowRemainingMin, cycleRemain);
      pushInternal("on-duty", nowMin, nowMin + allowed);
      nowMin += allowed;
      usedInCycleMin += allowed;
      windowRemainingMin -= allowed;
      remain -= allowed;
    }
  };

  // Consommer conduite (driving) — respecte pause continue et cycle/window
  const consumeDriving = (durMinInit: number) => {
    let remain = Math.max(0, Math.round(durMinInit));
    while (remain > 0) {
      ensureSafety();
      if (nowMin > PLAN_HORIZON_MIN + 24 * 60) {
        notes.push("Avertissement : horizon planification dépassé. Plan partiel retourné.");
        return;
      }

      if (windowRemainingMin <= 0 || drivingRemainingInWindowMin <= 0) {
        // fin de fenêtre -> repos long
        pushInternal("sleeper", nowMin, nowMin + REST_AFTER_WINDOW_MIN);
        nowMin += REST_AFTER_WINDOW_MIN;
        windowRemainingMin = WINDOW_MIN;
        drivingRemainingInWindowMin = MAX_DRIVE_PER_WINDOW_MIN;
        continuousDriveSinceBreakMin = 0;
        continue;
      }

      ensureCycleCapacityOrRestart();

      const cycleRemain = Math.max(0, CYCLE_LIMIT_MIN - usedInCycleMin);
      if (cycleRemain <= 0) continue; // restart in next iteration

      const allowedByContinuous = Math.max(0, MAX_CONTINUOUS_DRIVE_MIN - continuousDriveSinceBreakMin);
      if (allowedByContinuous === 0) {
        // force break 30min off-duty
        pushInternal("off-duty", nowMin, nowMin + BREAK_AFTER_CONTINUOUS_MIN);
        nowMin += BREAK_AFTER_CONTINUOUS_MIN;
        windowRemainingMin -= BREAK_AFTER_CONTINUOUS_MIN;
        continuousDriveSinceBreakMin = 0;
        continue;
      }

      const allowed = Math.min(remain, drivingRemainingInWindowMin, windowRemainingMin, allowedByContinuous, cycleRemain);
      if (allowed <= 0) {
        // fallback safety
        pushInternal("off-duty", nowMin, nowMin + Math.min(15, BREAK_AFTER_CONTINUOUS_MIN));
        nowMin += Math.min(15, BREAK_AFTER_CONTINUOUS_MIN);
        windowRemainingMin -= Math.min(15, BREAK_AFTER_CONTINUOUS_MIN);
        continuousDriveSinceBreakMin = 0;
        continue;
      }

      pushInternal("driving", nowMin, nowMin + allowed);
      nowMin += allowed;
      usedInCycleMin += allowed;
      windowRemainingMin -= allowed;
      drivingRemainingInWindowMin -= allowed;
      continuousDriveSinceBreakMin += allowed;
      remain -= allowed;

      // si on atteint seuil continu et il reste conduite -> pause 30 min
      if (continuousDriveSinceBreakMin >= MAX_CONTINUOUS_DRIVE_MIN && remain > 0) {
        pushInternal("off-duty", nowMin, nowMin + BREAK_AFTER_CONTINUOUS_MIN);
        nowMin += BREAK_AFTER_CONTINUOUS_MIN;
        windowRemainingMin -= BREAK_AFTER_CONTINUOUS_MIN;
        continuousDriveSinceBreakMin = 0;
      }

      // si usedInCycle atteint et remain > 0 => boucle insérera restart
      // si window/drivingRemaining épuisé => restart inséré dans boucle
    }
  };

  // === Plan : itérer sur les legs ===
  // Avant premier drive : PRE_DRIVE_MIN (préparation)
  if (PRE_DRIVE_MIN > 0) consumeService(PRE_DRIVE_MIN);

  for (let i = 0; i < legs.length; i++) {
    ensureSafety();
    const leg = legs[i];
    const driveMin = Math.max(0, Math.round((leg.driveHours ?? 0) * 60));
    if (driveMin > 0) consumeDriving(driveMin);

    // à l'arrivée sur ce point : consommer load/unload selon disponibilité
    // on considère que loadHours s'applique si l'étape représente un pickup; unloadHours si représente un drop
    const loadMin = leg.loadHours !== undefined ? Math.round(leg.loadHours * 60) : DEFAULT_LOAD_MIN;
    if (loadMin > 0) consumeService(loadMin);

    const unloadMin = leg.unloadHours !== undefined ? Math.round(leg.unloadHours * 60) : 0;
    // some legs might specify unload (end of leg)
    if (unloadMin > 0) consumeService(unloadMin);

    // après chaque leg, on continue to next
  }

  // Après dernière étape, si on n'est pas off-duty/sleeper -> ajouter off-duty jusqu'au prochain multiple 24h (lisibilité)
  const lastInternal = internalEvents[internalEvents.length - 1];
  const endMinGlobal = lastInternal ? lastInternal.endMin : nowMin;
  const nextDayMin = Math.ceil(endMinGlobal / (24 * 60)) * (24 * 60);
  if (!lastInternal || (lastInternal.status !== "off-duty" && lastInternal.status !== "sleeper")) {
    if (nextDayMin > endMinGlobal) {
      pushInternal("off-duty", endMinGlobal, nextDayMin);
    }
  }

  // --- transformation : convertir internalEvents en perDay (0..n) avec heures 0..24 ---
  const perDayMap = new Map<number, Event[]>();

  const splitEventToDays = (ev: InternalEvent) => {
    let s = ev.startMin;
    const e = ev.endMin;
    while (s < e) {
      const dayIndex = Math.floor(s / (24 * 60));
      const dayStartMin = dayIndex * 24 * 60;
      const dayEndMin = dayStartMin + 24 * 60;
      const chunkEnd = Math.min(e, dayEndMin);
      const startHour = (s - dayStartMin) / 60;
      const endHour = (chunkEnd - dayStartMin) / 60;
      const arr = perDayMap.get(dayIndex) ?? [];
      arr.push({
        status: ev.status,
        startHour: Math.round(startHour * 100) / 100,
        endHour: Math.round(endHour * 100) / 100,
      });
      perDayMap.set(dayIndex, arr);
      s = chunkEnd;
    }
  };

  for (const ev of internalEvents) splitEventToDays(ev);

  // build perDay array ordered
  const perDay: DayEvents[] = [];
  const days = Array.from(perDayMap.keys()).sort((a, b) => a - b);
  for (const d of days) {
    perDay.push({ day: d, events: perDayMap.get(d) ?? [] });
  }

  // résultat
  const finalCycleUsedHours = Math.round((usedInCycleMin / 60) * 100) / 100;
  if (nowMin > PLAN_HORIZON_MIN) {
    notes.push("Avertissement : génération a dépassé l'horizon autorisé. Plan retourné partiel.");
  }

  return { perDay, notes, finalCycleUsedHours };
}
