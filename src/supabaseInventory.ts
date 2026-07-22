import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppState, Article, Client, ClientArticle, CountLine, HistoryEvent, InventoryCount, Lot, Role, UnitType, User, Warehouse } from './types';

type AppUserRow = { id: string; name: string; role: Role; avatar: string };
type ClientRow = { id: string; name: string; active: boolean };
type WarehouseRow = { id: string; client_id: string; name: string; active: boolean; last_count_at: string | null };
type ArticleRow = { id: string; code: string; barcode: string | null; name: string; presentation: UnitType; units_per_box: number; applies_expiry: boolean; active: boolean };
type ClientArticleRow = { client_id: string; article_id: string; active: boolean };
type CountRow = { id: string; client_id: string; warehouse_id: string; counter_id: string; status: InventoryCount['status']; started_at: string; expires_at: string; submitted_at: string | null; closed_at: string | null; closed_by: string | null; reopened_at: string | null };
type ScopeRow = { count_id: string; article_id: string };
type LineRow = { id: string; count_id: string; article_id: string; unit_type: UnitType; quantity: number; total_units: number; observation: string; zero_confirmed: boolean };
type LotRow = { id: string; line_id: string; lot_order: number; unit_type: UnitType; quantity: number; total_units: number; expiry_date: string; observation: string };
type HistoryRow = { id: string; count_id: string; type: string; actor_id: string; occurred_at: string; reason: string | null };

export class PermissionDeniedError extends Error {
  constructor(message = 'Permiso denegado.') {
    super(message);
    this.name = 'PermissionDeniedError';
  }
}

function raise(error: { message: string; code?: string } | null) {
  if (!error) return;
  if (error.code === '42501' || /permission|row-level security|rls/i.test(error.message)) {
    throw new PermissionDeniedError('Supabase denegó la operación por permisos.');
  }
  throw new Error(error.message);
}

function isoNow() {
  return new Date().toISOString();
}

function tomorrowIso() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

export async function loadInventoryState(client: SupabaseClient): Promise<AppState> {
  const [
    usersResponse,
    clientsResponse,
    warehousesResponse,
    articlesResponse,
    clientArticlesResponse,
    countsResponse,
    scopeResponse,
    linesResponse,
    lotsResponse,
    historyResponse,
  ] = await Promise.all([
    client.from('app_users').select('id,name,role,avatar').order('id'),
    client.from('clients').select('id,name,active').order('name'),
    client.from('warehouses').select('id,client_id,name,active,last_count_at').order('name'),
    client.from('articles').select('id,code,barcode,name,presentation,units_per_box,applies_expiry,active').order('sort_order'),
    client.from('client_articles').select('client_id,article_id,active'),
    client.from('inventory_counts').select('id,client_id,warehouse_id,counter_id,status,started_at,expires_at,submitted_at,closed_at,closed_by,reopened_at').order('started_at', { ascending: false }),
    client.from('inventory_count_articles').select('count_id,article_id'),
    client.from('count_lines').select('id,count_id,article_id,unit_type,quantity,total_units,observation,zero_confirmed'),
    client.from('lots').select('id,line_id,lot_order,unit_type,quantity,total_units,expiry_date,observation').order('lot_order'),
    client.from('history_events').select('id,count_id,type,actor_id,occurred_at,reason').order('occurred_at'),
  ]);

  [
    usersResponse.error,
    clientsResponse.error,
    warehousesResponse.error,
    articlesResponse.error,
    clientArticlesResponse.error,
    countsResponse.error,
    scopeResponse.error,
    linesResponse.error,
    lotsResponse.error,
    historyResponse.error,
  ].forEach(raise);

  const users: User[] = ((usersResponse.data ?? []) as AppUserRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    role: row.role,
    avatar: row.avatar,
  }));
  if (!users.length) throw new PermissionDeniedError('Tu usuario no está vinculado a un perfil de Inventario Nara.');

  const role = users[0].role;
  const lotsByLine = new Map<string, Lot[]>();
  ((lotsResponse.data ?? []) as LotRow[]).forEach((row) => {
    const lot: Lot = {
      id: row.id,
      lineId: row.line_id,
      order: row.lot_order,
      unitType: row.unit_type,
      quantity: row.quantity,
      totalUnits: row.total_units,
      expiryDate: row.expiry_date,
      observation: row.observation,
    };
    lotsByLine.set(row.line_id, [...(lotsByLine.get(row.line_id) ?? []), lot]);
  });

  const scopeByCount = new Map<string, string[]>();
  ((scopeResponse.data ?? []) as ScopeRow[]).forEach((row) => {
    scopeByCount.set(row.count_id, [...(scopeByCount.get(row.count_id) ?? []), row.article_id]);
  });

  return {
    version: 2,
    role,
    demoNow: isoNow(),
    users,
    clients: ((clientsResponse.data ?? []) as ClientRow[]).map((row): Client => ({ id: row.id, name: row.name, active: row.active })),
    warehouses: ((warehousesResponse.data ?? []) as WarehouseRow[]).map((row): Warehouse => ({
      id: row.id,
      clientId: row.client_id,
      name: row.name,
      active: row.active,
      lastCountAt: row.last_count_at ?? undefined,
    })),
    articles: ((articlesResponse.data ?? []) as ArticleRow[]).map((row): Article => ({
      id: row.id,
      code: row.code,
      barcode: row.barcode ?? undefined,
      name: row.name,
      presentation: row.presentation,
      unitsPerBox: row.units_per_box,
      appliesExpiry: row.applies_expiry,
      active: row.active,
    })),
    clientArticles: ((clientArticlesResponse.data ?? []) as ClientArticleRow[]).map((row): ClientArticle => ({
      clientId: row.client_id,
      articleId: row.article_id,
      active: row.active,
    })),
    counts: ((countsResponse.data ?? []) as CountRow[]).map((row): InventoryCount => ({
      id: row.id,
      clientId: row.client_id,
      warehouseId: row.warehouse_id,
      counterId: row.counter_id,
      scopeArticleIds: scopeByCount.get(row.id) ?? [],
      status: row.status,
      startedAt: row.started_at,
      expiresAt: row.expires_at,
      submittedAt: row.submitted_at ?? undefined,
      closedAt: row.closed_at ?? undefined,
      closedBy: row.closed_by ?? undefined,
      reopenedAt: row.reopened_at ?? undefined,
    })),
    lines: ((linesResponse.data ?? []) as LineRow[]).map((row): CountLine => ({
      id: row.id,
      countId: row.count_id,
      articleId: row.article_id,
      unitType: row.unit_type,
      quantity: row.quantity,
      totalUnits: row.total_units,
      observation: row.observation,
      zeroConfirmed: row.zero_confirmed,
      lots: lotsByLine.get(row.id) ?? [],
    })),
    history: ((historyResponse.data ?? []) as HistoryRow[]).map((row): HistoryEvent => ({
      id: row.id,
      countId: row.count_id,
      type: row.type,
      actorId: row.actor_id,
      occurredAt: row.occurred_at,
      reason: row.reason ?? undefined,
    })),
  };
}

export async function createInventoryCount(client: SupabaseClient, count: InventoryCount) {
  raise((await client.from('inventory_counts').insert({
    id: count.id,
    client_id: count.clientId,
    warehouse_id: count.warehouseId,
    counter_id: count.counterId,
    status: count.status,
    started_at: count.startedAt,
    expires_at: count.expiresAt,
  })).error);

  if (count.scopeArticleIds.length) {
    raise((await client.from('inventory_count_articles').insert(count.scopeArticleIds.map((articleId) => ({
      count_id: count.id,
      article_id: articleId,
    })))).error);
  }

  raise((await client.from('history_events').insert({
    id: `event-${count.id}`,
    count_id: count.id,
    type: 'Creado',
    actor_id: count.counterId,
    occurred_at: count.startedAt,
  })).error);
}

export async function saveCountLine(client: SupabaseClient, line: CountLine) {
  raise((await client.from('count_lines').upsert({
    id: line.id,
    count_id: line.countId,
    article_id: line.articleId,
    unit_type: line.unitType,
    quantity: line.quantity,
    total_units: line.totalUnits,
    observation: line.observation,
    zero_confirmed: line.zeroConfirmed,
  })).error);

  if (line.lots.length) {
    raise((await client.from('lots').delete().eq('line_id', line.id)).error);
    raise((await client.from('lots').insert(line.lots.map((lot) => ({
      id: lot.id,
      line_id: line.id,
      lot_order: lot.order,
      unit_type: lot.unitType,
      quantity: lot.quantity,
      total_units: lot.totalUnits,
      expiry_date: lot.expiryDate,
      observation: lot.observation,
    })))).error);
  }
}

export async function sendInventoryCountToReview(client: SupabaseClient, count: InventoryCount, actorId: string) {
  const submittedAt = isoNow();
  raise((await client
    .from('inventory_counts')
    .update({ status: 'En revisión', submitted_at: submittedAt })
    .eq('id', count.id)).error);
  raise((await client.from('history_events').insert({
    id: `event-sent-${count.id}-${Date.now()}`,
    count_id: count.id,
    type: 'Enviado a revisión',
    actor_id: actorId,
    occurred_at: submittedAt,
  })).error);
}

export function buildDraftCount(id: string, clientId: string, warehouseId: string, counterId: string, scopeArticleIds: string[]): InventoryCount {
  const startedAt = isoNow();
  return {
    id,
    clientId,
    warehouseId,
    counterId,
    scopeArticleIds,
    status: 'Borrador',
    startedAt,
    expiresAt: tomorrowIso(),
  };
}
