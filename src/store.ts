import { barcodeProducts, createInitialState } from './data';
import type { AppState } from './types';

const STORAGE_KEY = 'nara-inventory-prototype:v2';
const LEGACY_STORAGE_KEY = 'nara-inventory-prototype:v1';

type LegacyState = Omit<AppState, 'version'> & { version: 1 };

function migrateV1(state: LegacyState): AppState {
  const replacements = new Map<string, (typeof barcodeProducts)[number]>(barcodeProducts.map((product) => [product.id, product]));
  return {
    ...state,
    version: 2,
    articles: state.articles.map((article) => {
      const replacement = replacements.get(article.id);
      return replacement ? { ...article, code: replacement.code, barcode: replacement.barcode, name: replacement.name } : article;
    }),
  };
}

export function loadState(): AppState {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!saved) return createInitialState();
    const parsed = JSON.parse(saved) as AppState | LegacyState;
    if (parsed.version === 2) return parsed;
    if (parsed.version === 1) {
      const migrated = migrateV1(parsed);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    return createInitialState();
  } catch { return createInitialState(); }
}

export function saveState(state: AppState) { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
export function resetState() { const state = createInitialState(); saveState(state); return state; }
