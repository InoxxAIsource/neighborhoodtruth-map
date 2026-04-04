import { useState, useCallback } from "react";

export interface LayerState {
  buildings3d: boolean;
  traffic: boolean;
  festivals: boolean;
  poi: {
    temple: boolean;
    mosque: boolean;
    church: boolean;
    hospital: boolean;
    school: boolean;
    fuel: boolean;
    ev_charger: boolean;
  };
}

const DEFAULT_LAYERS: LayerState = {
  buildings3d: false,
  traffic: false,
  festivals: false,
  poi: {
    temple: false,
    mosque: false,
    church: false,
    hospital: false,
    school: false,
    fuel: false,
    ev_charger: false,
  },
};

const STORAGE_KEY = "pl_layer_state";

function loadFromStorage(): LayerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LAYERS;
    const parsed = JSON.parse(raw) as Partial<LayerState>;
    return {
      buildings3d: parsed.buildings3d ?? false,
      traffic: parsed.traffic ?? false,
      festivals: parsed.festivals ?? false,
      poi: { ...DEFAULT_LAYERS.poi, ...(parsed.poi ?? {}) },
    };
  } catch {
    return DEFAULT_LAYERS;
  }
}

function saveToStorage(s: LayerState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

export function useLayerState() {
  const [layers, setLayers] = useState<LayerState>(loadFromStorage);

  const toggleLayer = useCallback((key: keyof Omit<LayerState, "poi">) => {
    setLayers((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveToStorage(next);
      return next;
    });
  }, []);

  const togglePoi = useCallback((key: keyof LayerState["poi"]) => {
    setLayers((prev) => {
      const next = { ...prev, poi: { ...prev.poi, [key]: !prev.poi[key] } };
      saveToStorage(next);
      return next;
    });
  }, []);

  return { layers, toggleLayer, togglePoi };
}
