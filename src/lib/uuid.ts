/**
 * Generates a standard RFC 4122 version 4 UUID.
 * Compatible with PostgreSQL UUID and TEXT primary keys.
 */
export const generateUuid = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  
  // High-entropy fallback for environments where crypto.randomUUID is not available
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const isUuid = (val: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
};

export const ensureUuid = (id: string | undefined | null): string => {
  if (id && isUuid(id)) return id;
  return generateUuid();
};
