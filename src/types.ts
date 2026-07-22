export type Role = 'Contador' | 'Supervisor';
export type CountStatus = 'Borrador' | 'En revisión' | 'Cerrado';
export type UnitType = 'Caja' | 'Unidad';

export interface User { id: string; name: string; role: Role; avatar: string }
export interface Client { id: string; name: string; active: boolean }
export interface Warehouse { id: string; clientId: string; name: string; active: boolean; lastCountAt?: string }
export interface Article { id: string; code: string; barcode?: string; name: string; presentation: UnitType; unitsPerBox: number; appliesExpiry: boolean; active: boolean }
export interface ClientArticle { clientId: string; articleId: string; active: boolean }
export interface Lot { id: string; lineId: string; order: number; unitType: UnitType; quantity: number; totalUnits: number; expiryDate: string; observation: string }
export interface CountLine { id: string; countId: string; articleId: string; unitType: UnitType; quantity: number; totalUnits: number; observation: string; zeroConfirmed: boolean; lots: Lot[] }
export interface HistoryEvent { id: string; countId: string; type: string; actorId: string; occurredAt: string; reason?: string }
export interface InventoryCount { id: string; clientId: string; warehouseId: string; counterId: string; scopeArticleIds: string[]; status: CountStatus; startedAt: string; expiresAt: string; submittedAt?: string; closedAt?: string; closedBy?: string; reopenedAt?: string }
export interface AppState { version: 2; role: Role; demoNow: string; users: User[]; clients: Client[]; warehouses: Warehouse[]; articles: Article[]; clientArticles: ClientArticle[]; counts: InventoryCount[]; lines: CountLine[]; history: HistoryEvent[] }
