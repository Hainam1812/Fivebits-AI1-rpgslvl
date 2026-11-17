import { GameState } from './types.js';
import {
  loadAssignmentsFromStorage,
  saveAssignmentsToStorage,
  ASSIGNMENTS_STORAGE_KEY,
  sortAssignmentsByDeadline,
} from '../domain/assignments.js';

export const STORAGE_KEY = 'solo_levelling_app_state_v1';
export const CURRENT_SCHEMA_VERSION = 1;

export function getDefaultState(): GameState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    profile: {
      nickname: '',
      characterId: 'boy1',
      createdAt: new Date().toISOString(),
      motionPreference: 'system',
      characterScale: 1,
      characterOffsetX: 0,
      characterOffsetY: 0,
    },
    completions: [],
    activeTasks: {},
    abandonedPackages: [],
    unlockedPackages: [],
    unlockedAchievements: [],
    equippedCosmetics: {
      backdrop: 'bd-starter-dorm',
      frame: 'fr-wooden-apprentice',
      title: 'tt-auto-level',
      nameplate: 'np-simple-slate',
    },
    equippedGear: {},
    seenCosmetics: ['bd-starter-dorm', 'fr-wooden-apprentice', 'tt-auto-level', 'np-simple-slate'],
    seenGear: [],
    customGearMeta: [],
    equippedCustomGearIds: [],
    customCharacters: [],
    examHistory: [],
    personalExams: [],
    timetable: [],
    assignments: loadAssignmentsFromStorage(),
    lastLocationId: 'classroom',
    cart: [],
    appliedCoupon: null,
    orders: [],
    contactMessages: [],
  };
}

export function loadStateFromStorage(): GameState {
  if (typeof window === 'undefined') return getDefaultState();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Check if standalone timetable exists
      try {
        const tbRaw = localStorage.getItem('solo_levelling_timetable_v1');
        if (tbRaw) {
          const def = getDefaultState();
          def.timetable = JSON.parse(tbRaw);
          return def;
        }
      } catch {}
      return getDefaultState();
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return getDefaultState();

    // Verify critical fields
    const defaultState = getDefaultState();
    const migratedState: GameState = {
      ...defaultState,
      ...parsed,
      profile: {
        ...defaultState.profile,
        ...(parsed.profile || {}),
        characterId:
          parsed.profile?.characterId === 'hero'
            ? 'boy1'
            : parsed.profile?.characterId === 'scholar'
            ? 'girl1'
            : parsed.profile?.characterId || defaultState.profile.characterId,
      },
      completions: Array.isArray(parsed.completions) ? parsed.completions : [],
      unlockedPackages: Array.isArray(parsed.unlockedPackages) ? parsed.unlockedPackages : [],
      unlockedAchievements: Array.isArray(parsed.unlockedAchievements) ? parsed.unlockedAchievements : [],
      abandonedPackages: Array.isArray(parsed.abandonedPackages) ? parsed.abandonedPackages : [],
      equippedCosmetics: parsed.equippedCosmetics || defaultState.equippedCosmetics,
      equippedGear: parsed.equippedGear || {},
      cart: Array.isArray(parsed.cart) ? parsed.cart : [],
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      examHistory: Array.isArray(parsed.examHistory) ? parsed.examHistory : [],
      personalExams: Array.isArray(parsed.personalExams) ? parsed.personalExams : [],
      timetable: Array.isArray(parsed.timetable)
        ? parsed.timetable
        : (() => {
            try {
              const tbRaw = localStorage.getItem('solo_levelling_timetable_v1');
              return tbRaw ? JSON.parse(tbRaw) : [];
            } catch {
              return [];
            }
          })(),
      assignments: Array.isArray(parsed.assignments)
        ? sortAssignmentsByDeadline(parsed.assignments)
        : (() => {
            try {
              const asgRaw = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
              return asgRaw ? sortAssignmentsByDeadline(JSON.parse(asgRaw)) : defaultState.assignments || [];
            } catch {
              return defaultState.assignments || [];
            }
          })(),
      customGearMeta: Array.isArray(parsed.customGearMeta) ? parsed.customGearMeta : [],
      equippedCustomGearIds: Array.isArray(parsed.equippedCustomGearIds) ? parsed.equippedCustomGearIds : [],
      customCharacters: Array.isArray(parsed.customCharacters) ? parsed.customCharacters : [],
      contactMessages: Array.isArray(parsed.contactMessages) ? parsed.contactMessages : [],
      schemaVersion: CURRENT_SCHEMA_VERSION,
    };

    return migratedState;
  } catch (err) {
    console.error('Failed to parse state from localStorage, falling back to defaults:', err);
    return getDefaultState();
  }
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export function saveStateToStorage(state: GameState): void {
  if (typeof window === 'undefined') return;

  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (Array.isArray(state.timetable)) {
        localStorage.setItem('solo_levelling_timetable_v1', JSON.stringify(state.timetable));
      }
      if (Array.isArray(state.assignments)) {
        saveAssignmentsToStorage(state.assignments);
      }
    } catch (err) {
      console.warn('Could not write state to localStorage (quota or privacy setting):', err);
    }
  }, 200);
}

export function saveStateToStorageImmediate(state: GameState): void {
  if (typeof window === 'undefined') return;

  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (Array.isArray(state.timetable)) {
      localStorage.setItem('solo_levelling_timetable_v1', JSON.stringify(state.timetable));
    }
    if (Array.isArray(state.assignments)) {
      saveAssignmentsToStorage(state.assignments);
    }
  } catch (err) {
    console.warn('Could not write state to localStorage immediately:', err);
  }
}

