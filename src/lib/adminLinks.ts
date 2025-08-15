export const getAdminHref = (path: string) => {
  try {
    const base = (import.meta as any).env?.VITE_ADMIN_BASE_URL as string | undefined;
    if (!base) return path;
    const isAbs = /^https?:\/\//i.test(base);
    return isAbs ? `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}` : path;
  } catch {
    return path;
  }
};
