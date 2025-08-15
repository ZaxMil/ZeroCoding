// Runtime configuration with safe defaults
export interface RuntimeConfig {
  USE_MOCKS: boolean;
  ADMIN_BASE_URL?: string;
  PUBLIC_BASE_URL?: string;
  SHOW_LOCKED_FOR_ANON: boolean;
  PARTICLES: boolean;
  PARTICLES_DENSITY: number; // 0..1
}

const readBoolean = (val: string | undefined, def: boolean) => {
  if (val === undefined || val === '') return def;
  return val === '1' || val === 'true' || val === 'TRUE';
};

const readNumber = (val: string | undefined, def: number) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : def;
};

export const getRuntimeConfig = (): RuntimeConfig => {
  // Defaults favor mock/offline
  const env = import.meta.env as any;
  return {
    USE_MOCKS: readBoolean(env.VITE_USE_MOCKS, false),
    ADMIN_BASE_URL: env.VITE_ADMIN_BASE_URL,
    PUBLIC_BASE_URL: env.VITE_PUBLIC_BASE_URL,
    SHOW_LOCKED_FOR_ANON: readBoolean(env.VITE_SHOW_LOCKED_FOR_ANON, true),
    PARTICLES: readBoolean(env.VITE_PARTICLES, true),
    PARTICLES_DENSITY: Math.min(1, Math.max(0, readNumber(env.VITE_PARTICLES_DENSITY, 0.5)))
  };
};

export const runtime = getRuntimeConfig();