import type { AppState, Article, ClientArticle, CountLine, InventoryCount } from './types';

const activeNames = ['Arroz Nara 1 kg', 'Frijoles rojos Nara 400 g', 'Aceite vegetal Nara 900 ml', 'Leche entera Nara 1 L', 'Avena Nara 400 g', 'Sopa Nara pollo 70 g', 'Pasta corta Nara 200 g', 'Atún Nara en agua 170 g', 'Azúcar Nara 1 kg', 'Sal refinada Nara 500 g', 'Harina Nara 1 kg', 'Mermelada Nara fresa 250 g', 'Salsa de tomate Nara 400 g', 'Mayonesa Nara 400 g', 'Vinagre Nara 500 ml', 'Agua Nara 600 ml', 'Refresco Nara cola 2 L', 'Jabón líquido Nara 500 ml', 'Detergente Nara 1 kg', 'Papel toalla Nara 2 rollos', 'Servilletas Nara 100 u', 'Garbanzos Nara 400 g', 'Lentejas Nara 400 g', 'Maíz dulce Nara 400 g', 'Té Nara manzanilla 20 u', 'Chocolate Nara 100 g', 'Pan tostado Nara 250 g', 'Galletas saladas Nara 200 g', 'Café instantáneo Nara 100 g', 'Cereal Nara avena 300 g', 'Jugo Nara manzana 1 L', 'Jugo Nara piña 1 L', 'Salsa picante Nara 150 ml', 'Especias Nara mixtas 50 g', 'Desinfectante Nara 1 L', 'Lavaplatos Nara 750 ml', 'Esponja Nara doble uso'];

const required: Article[] = [
  { id: 'a-00125', code: 'ART-00125', name: 'Café Nara clásico 250 g', presentation: 'Caja', unitsPerBox: 24, appliesExpiry: true, active: true },
  { id: 'a-00418', code: 'ART-00418', name: 'Galletas Nara chocolate 6x12', presentation: 'Caja', unitsPerBox: 72, appliesExpiry: false, active: true },
  { id: 'a-00805', code: 'ART-00805', name: 'Jugo Nara naranja 1 L', presentation: 'Unidad', unitsPerBox: 1, appliesExpiry: true, active: true },
  { id: 'a-00920', code: 'ART-00920', name: 'Cereal Nara 450 g', presentation: 'Caja', unitsPerBox: 12, appliesExpiry: false, active: true },
];

export const barcodeProducts = [
  { id: 'a-1001', code: '118120007', barcode: '118120007', name: 'Sabor Y Color Madona Tarro 12/900 Gr (31.7 Oz)' },
  { id: 'a-1002', code: '118120004', barcode: '118120004', name: 'Toalla Nube Blanca 24/60 Hd' },
  { id: 'a-1003', code: '118120003', barcode: '118120003', name: 'Sopa Laky Men Caja Vaso De Pollo 12/75 Gr' },
  { id: 'a-1004', code: '132130023', barcode: '132130023', name: 'Bolsa En Rollo 2Lb 8"X12" (1X33X450)' },
  { id: 'a-1005', code: '0132130023R', barcode: '0132130023R', name: 'Biberon Polipro Tripack 3Pzas/8 Oz' },
  { id: 'a-1006', code: '132130035', barcode: '132130035', name: 'Shampoo Rosy Hierbas 12/32 Oz' },
  { id: 'a-1007', code: '132130034', barcode: '132130034', name: 'Gel Barber Style For Men Savage 12/200 Gr' },
  { id: 'a-1008', code: '132130029', barcode: '132130029', name: 'Palillos Premier 1/144/500 Und' },
  { id: 'a-1009', code: '132130022', barcode: '132130022', name: 'Cilindro Orix Floral 24/270 Gr' },
  { id: 'a-1010', code: '118120043', barcode: '118120043', name: 'Paquete Shampoo Y Talco Scooby Doo 12/12 Oz' },
  { id: 'a-1011', code: '118120015', barcode: '118120015', name: 'Shampoo Baby Olga Sherer 12/8 Oz' },
  { id: 'a-1012', code: '118130038', barcode: '118130038', name: 'Toalla Humeda Baby Star 24/40 Und' },
  { id: 'a-1013', code: '118120005', barcode: '118120005', name: 'Batichoco Fresa 24/350Gr' },
  { id: 'a-1014', code: '123110027', barcode: '123110027', name: 'Shampoo 2 En 1 Scooby Doo Chicle 12/16 Oz' },
  { id: 'a-1015', code: '132040011', barcode: '132040011', name: 'Biberon Mamila De Silicon Dinosaurio 25/4 Oz' },
] as const;

const barcodeProductById = new Map<string, (typeof barcodeProducts)[number]>(barcodeProducts.map((product) => [product.id, product]));

const generated: Article[] = Array.from({ length: 41 }, (_, index) => {
  const active = index < 37;
  const box = index % 5 !== 0;
  const id = `a-${1001 + index}`;
  const replacement = barcodeProductById.get(id);
  return { id, code: replacement?.code ?? `ART-${String(1001 + index).padStart(5, '0')}`, ...(replacement ? { barcode: replacement.barcode } : {}), name: replacement?.name ?? (active ? activeNames[index] : `Artículo inactivo Nara ${index - 36}`), presentation: box ? 'Caja' : 'Unidad', unitsPerBox: box ? [6, 12, 18, 24][index % 4] : 1, appliesExpiry: index % 8 === 0 && index < 32, active };
});

const articles = [...required, ...generated];
const elAhorroActiveIds = articles.filter((article) => article.active).slice(0, 38).map((article) => article.id);
const unionScopeIds = articles.filter((article) => article.active).slice(0, 38).map((article) => article.id);
const allActiveIds = articles.filter((article) => article.active).map((article) => article.id);
const line = (countId: string, articleId: string, index: number): CountLine => ({ id: `${countId}-line-${articleId}`, countId, articleId, unitType: 'Unidad', quantity: index + 1, totalUnits: index + 1, observation: '', zeroConfirmed: false, lots: [] });

export const createInitialState = (): AppState => {
  const draft: InventoryCount = { id: 'count-draft-el-ahorro', clientId: 'client-ahorro', warehouseId: 'warehouse-ahorro-central', counterId: 'maria', scopeArticleIds: elAhorroActiveIds, status: 'Borrador', startedAt: '2026-07-17T16:00:00-06:00', expiresAt: '2026-07-18T16:00:00-06:00' };
  const review: InventoryCount = { id: 'count-review-union', clientId: 'client-union', warehouseId: 'warehouse-union-norte', counterId: 'maria', scopeArticleIds: unionScopeIds, status: 'En revisión', startedAt: '2026-07-17T09:00:00-06:00', expiresAt: '2026-07-18T09:00:00-06:00', submittedAt: '2026-07-17T15:38:00-06:00' };
  const closedMini: InventoryCount = { id: 'count-closed-mini', clientId: 'client-mini', warehouseId: 'warehouse-mini-principal', counterId: 'maria', scopeArticleIds: allActiveIds.slice(0, 15), status: 'Cerrado', startedAt: '2026-07-16T10:00:00-06:00', expiresAt: '2026-07-17T10:00:00-06:00', closedAt: '2026-07-16T16:42:00-06:00', closedBy: 'carlos' };
  const closedAhorro: InventoryCount = { id: 'count-closed-ahorro', clientId: 'client-ahorro', warehouseId: 'warehouse-ahorro-central', counterId: 'maria', scopeArticleIds: elAhorroActiveIds, status: 'Cerrado', startedAt: '2026-07-17T09:00:00-06:00', expiresAt: '2026-07-18T09:00:00-06:00', closedAt: '2026-07-17T16:42:00-06:00', closedBy: 'carlos' };
  const draftLines = elAhorroActiveIds.slice(0, 12).map((articleId, index) => line(draft.id, articleId, index));
  draftLines[0] = { ...draftLines[0], unitType: 'Caja', quantity: 2, totalUnits: 96, lots: [{ id: 'lot-coffee-1', lineId: draftLines[0].id, order: 1, unitType: 'Caja', quantity: 2, totalUnits: 48, expiryDate: '2026-12-15', observation: 'Empaque en buen estado' }, { id: 'lot-coffee-2', lineId: draftLines[0].id, order: 2, unitType: 'Unidad', quantity: 48, totalUnits: 48, expiryDate: '2027-01-20', observation: '' }] };
  const reviewLines = unionScopeIds.filter((id) => !['a-00418', 'a-00805', 'a-00920'].includes(id)).map((articleId, index) => line(review.id, articleId, index));
  const miniLines = closedMini.scopeArticleIds.map((articleId, index) => line(closedMini.id, articleId, index));
  const closedAhorroLines = closedAhorro.scopeArticleIds.map((articleId, index) => ({ ...line(closedAhorro.id, articleId, index), totalUnits: index === 0 ? 544 : index + 1 }));
  const clientArticles: ClientArticle[] = [
    ...elAhorroActiveIds.map((articleId) => ({ clientId: 'client-ahorro', articleId, active: true })),
    ...allActiveIds.map((articleId) => ({ clientId: 'client-union', articleId, active: true })),
    ...allActiveIds.slice(0, 15).map((articleId) => ({ clientId: 'client-mini', articleId, active: true })),
    ...allActiveIds.slice(0, 20).map((articleId) => ({ clientId: 'client-progreso', articleId, active: true })),
  ];
  return { version: 2, role: 'Contador', demoNow: '2026-07-17T22:00:00-06:00', users: [{ id: 'maria', name: 'María López', role: 'Contador', avatar: 'ML' }, { id: 'carlos', name: 'Carlos Mena', role: 'Supervisor', avatar: 'CM' }], clients: [{ id: 'client-ahorro', name: 'Distribuidora El Ahorro', active: true }, { id: 'client-union', name: 'Supermercado La Unión', active: true }, { id: 'client-progreso', name: 'Mayorista El Progreso', active: false }, { id: 'client-mini', name: 'Mini Market San Juan', active: true }], warehouses: [{ id: 'warehouse-ahorro-central', clientId: 'client-ahorro', name: 'Bodega central', active: true, lastCountAt: '2026-07-17T16:00:00-06:00' }, { id: 'warehouse-ahorro-sur', clientId: 'client-ahorro', name: 'Bodega sur', active: true }, { id: 'warehouse-union-norte', clientId: 'client-union', name: 'Bodega norte', active: true, lastCountAt: '2026-07-17T15:38:00-06:00' }, { id: 'warehouse-union-principal', clientId: 'client-union', name: 'Bodega principal', active: true }, { id: 'warehouse-progreso-principal', clientId: 'client-progreso', name: 'Bodega principal', active: false }, { id: 'warehouse-mini-principal', clientId: 'client-mini', name: 'Bodega principal', active: true, lastCountAt: '2026-07-16T16:42:00-06:00' }], articles, clientArticles, counts: [draft, review, closedMini, closedAhorro], lines: [...draftLines, ...reviewLines, ...miniLines, ...closedAhorroLines], history: [{ id: 'event-draft-created', countId: draft.id, type: 'Creado', actorId: 'maria', occurredAt: draft.startedAt }, { id: 'event-review-sent', countId: review.id, type: 'Enviado a revisión', actorId: 'maria', occurredAt: review.submittedAt! }, { id: 'event-mini-closed', countId: closedMini.id, type: 'Cerrado', actorId: 'carlos', occurredAt: closedMini.closedAt! }, { id: 'event-ahorro-closed', countId: closedAhorro.id, type: 'Cerrado', actorId: 'carlos', occurredAt: closedAhorro.closedAt! }] };
};
