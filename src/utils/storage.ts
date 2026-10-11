import { FarmState } from '../types/game';
import { INITIAL_FARM_STATE } from '../data/gameData';

const STORAGE_KEY = 'valle_dorado_farm_save_v1';

export function saveFarmState(state: FarmState): void {
  try {
    const serialized = JSON.stringify({
      ...state,
      lastSavedAt: Date.now(),
    });
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (err) {
    console.error('Error saving game state to localStorage:', err);
  }
}

export function loadFarmState(): FarmState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_FARM_STATE;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return INITIAL_FARM_STATE;

    // Merge with defaults to ensure all fields are present across updates
    return {
      ...INITIAL_FARM_STATE,
      ...parsed,
      inventory: { ...INITIAL_FARM_STATE.inventory, ...(parsed.inventory || {}) },
      stats: { ...INITIAL_FARM_STATE.stats, ...(parsed.stats || {}) },
      plots: parsed.plots?.length ? parsed.plots : INITIAL_FARM_STATE.plots,
      animalPens: parsed.animalPens?.length ? parsed.animalPens : INITIAL_FARM_STATE.animalPens,
      buildings: parsed.buildings?.length ? parsed.buildings : INITIAL_FARM_STATE.buildings,
      truckOrders: parsed.truckOrders?.length ? parsed.truckOrders : INITIAL_FARM_STATE.truckOrders,
      roadsideSlots: parsed.roadsideSlots?.length ? parsed.roadsideSlots : INITIAL_FARM_STATE.roadsideSlots,
      achievements: parsed.achievements?.length ? parsed.achievements : INITIAL_FARM_STATE.achievements,
    };
  } catch (err) {
    console.warn('Corrupt save state detected, reverting to defaults:', err);
    return INITIAL_FARM_STATE;
  }
}

// Generate an encrypted / integrity-verified backup string
export function exportEncryptedBackup(state: FarmState): string {
  const json = JSON.stringify(state);
  // Base64 with integrity checksum
  let checksum = 0;
  for (let i = 0; i < json.length; i++) {
    checksum = (checksum + json.charCodeAt(i) * (i + 1)) % 999983;
  }
  const payload = {
    v: state.version,
    chk: checksum,
    d: btoa(encodeURIComponent(json)),
  };
  return 'VD_CLOUD_' + btoa(JSON.stringify(payload));
}

export function importEncryptedBackup(code: string): FarmState | null {
  try {
    if (!code.startsWith('VD_CLOUD_')) {
      throw new Error('Código de respaldo no válido');
    }
    const clean = code.replace('VD_CLOUD_', '').trim();
    const parsedPayload = JSON.parse(atob(clean));
    const decodedJson = decodeURIComponent(atob(parsedPayload.d));

    // verify checksum
    let expectedChk = 0;
    for (let i = 0; i < decodedJson.length; i++) {
      expectedChk = (expectedChk + decodedJson.charCodeAt(i) * (i + 1)) % 999983;
    }
    if (expectedChk !== parsedPayload.chk) {
      throw new Error('Fallo de integridad en el respaldo');
    }

    const restoredState = JSON.parse(decodedJson);
    return {
      ...INITIAL_FARM_STATE,
      ...restoredState,
    };
  } catch (err) {
    console.error('Failed to import backup:', err);
    return null;
  }
}
