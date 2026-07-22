import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserMultiFormatOneDReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { BottomNav, Button, Card, Header, Icon, Modal, Toast } from './components';
import { resetState } from './store';
import { supabase, supabaseConfigured } from './supabaseClient';
import { buildDraftCount, createInventoryCount, loadInventoryState, PermissionDeniedError, saveCountLine, sendInventoryCountToReview } from './supabaseInventory';
import type { AppState, Article, Client, CountLine, InventoryCount, Lot, Role, UnitType, User, Warehouse } from './types';
import './styles.css';
import './overrides.css';

const fmtDate = (iso?: string, time = false) => {
  if (!iso) return '—';
  const value = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return new Intl.DateTimeFormat('es-NI', { dateStyle: 'medium', ...(time ? { timeStyle: 'short' } : {}), timeZone: 'America/Managua' }).format(value);
};
const nf = new Intl.NumberFormat('en-US');
const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const emptyState = (): AppState => ({
  version: 2,
  role: 'Contador',
  demoNow: new Date().toISOString(),
  users: [],
  clients: [],
  warehouses: [],
  articles: [],
  clientArticles: [],
  counts: [],
  lines: [],
  history: [],
});

function App() {
  const [state, setState] = useState<AppState>(() => emptyState());
  const [path, setPath] = useState(() => window.location.pathname === '/' ? '/levantamientos' : window.location.pathname);
  const [toast, setToast] = useState('');
  const [authChecking, setAuthChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [denied, setDenied] = useState(false);
  const [modal, setModal] = useState<React.ReactNode>(null);
  useEffect(() => { const pop = () => setPath(window.location.pathname); addEventListener('popstate', pop); return () => removeEventListener('popstate', pop); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2600); return () => clearTimeout(t); }, [toast]);
  const go = (next: string) => { history.pushState({}, '', next); setPath(next); setModal(null); };
  const update = (change: (current: AppState) => AppState, message?: string) => { setState(change); if (message) setToast(message); };
  const back = () => history.length > 1 ? history.back() : go('/levantamientos');
  const roleUser = state.users.find((u) => u.role === state.role) ?? state.users[0];
  const refresh = useCallback(async () => {
    if (!supabase) return;
    setSyncing(true);
    setLoadError('');
    setDenied(false);
    try {
      setState(await loadInventoryState(supabase));
    } catch (error) {
      setState(emptyState());
      if (error instanceof PermissionDeniedError) setDenied(true);
      else setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar los datos.');
    } finally {
      setSyncing(false);
    }
  }, []);
  useEffect(() => {
    if (!supabase) {
      setAuthChecking(false);
      setLoadError('Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para conectar Supabase.');
      return;
    }
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setAuthenticated(Boolean(data.session));
      setAuthChecking(false);
      if (data.session) void refresh();
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(Boolean(session));
      setAuthError('');
      if (session) void refresh();
      else {
        setState(emptyState());
        setDenied(false);
        setPath('/levantamientos');
      }
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [refresh]);
  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setToast('Sesión cerrada');
  };
  const runWrite = async (operation: () => Promise<void>, success: string, after?: () => void) => {
    if (!supabase) {
      setLoadError('Supabase no está configurado.');
      return;
    }
    setSyncing(true);
    setLoadError('');
    setDenied(false);
    try {
      await operation();
      setState(await loadInventoryState(supabase));
      setToast(success);
      after?.();
    } catch (error) {
      if (error instanceof PermissionDeniedError) {
        setDenied(true);
        setLoadError('Permiso denegado por RLS. Verifica que el usuario esté vinculado a app_users.');
      } else setLoadError(error instanceof Error ? error.message : 'La operación no se pudo completar.');
    } finally {
      setSyncing(false);
    }
  };
  const actions = {
    createCount: (count: InventoryCount, after: () => void) => runWrite(() => createInventoryCount(supabase!, count), 'Levantamiento creado', after),
    saveLine: (line: CountLine, after?: () => void) => runWrite(() => saveCountLine(supabase!, line), line.lots.length ? 'Lotes guardados' : 'Conteo guardado', after),
    sendToReview: (count: InventoryCount, after: () => void) => runWrite(() => sendInventoryCountToReview(supabase!, count, roleUser?.id ?? count.counterId), 'Enviado a revisión', after),
  };
  if (authChecking) return <Shell><StateCard title="Cargando sesión" message="Validando la sesión de Supabase..."/></Shell>;
  if (!supabaseConfigured) return <Shell><StateCard title="Configuración pendiente" message={loadError}/></Shell>;
  if (!authenticated) return <Shell><LoginScreen error={authError} setError={setAuthError}/></Shell>;
  if (denied || !roleUser) return <Shell><StateCard title="Permiso denegado" message="Este usuario no está vinculado a un perfil de Inventario Nara. Enlázalo en app_users.auth_user_id y vuelve a iniciar sesión." actionLabel="Cerrar sesión" onAction={signOut}/></Shell>;
  const router = () => {
    if (path === '/levantamientos' || path === '/') return <Dashboard state={state} roleUser={roleUser} go={go} setModal={setModal}/>;
    if (path === '/levantamientos/nuevo') return <NewCount state={state} go={go} back={back} update={update} setModal={setModal} actions={actions} currentUser={roleUser}/>;
    if (path.includes('/conteo')) return <CountView state={state} path={path} go={go} back={back} update={update} setModal={setModal} actions={actions} currentUser={roleUser}/>;
    if (path.includes('/lotes')) return <LotsViewEnhanced state={state} path={path} go={go} back={back} update={update} setModal={setModal} actions={actions} currentUser={roleUser}/>;
    if (path.includes('/revision')) return <ReviewView state={state} path={path} go={go} back={back} update={update} setModal={setModal} actions={actions} currentUser={roleUser}/>;
    if (path.includes('/cerrado')) return <ClosedViewEnhanced state={state} path={path} go={go} back={back} update={update} setModal={setModal}/>;
    if (path === '/catalogo') return <Catalog state={state} go={go} update={update} setModal={setModal}/>;
    if (path === '/clientes') return <ClientsView state={state} go={go} back={back} update={update} setModal={setModal}/>;
    if (path === '/perfil') return <Profile state={state} go={go} update={update} setModal={setModal} signOut={signOut}/>;
    return <Dashboard state={state} roleUser={roleUser} go={go} setModal={setModal}/>;
  };
  return <main className="page-shell"><div className="app-canvas">{loadError && <div className="inline-error" role="alert">{loadError}</div>}{syncing && <div className="sync-pill">Guardando en Supabase...</div>}{router()}<BottomNav path={path} navigate={go}/>{toast && <Toast>{toast}</Toast>}{modal}</div></main>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="page-shell"><div className="app-canvas auth-canvas">{children}</div></main>;
}

function StateCard({ title, message, actionLabel, onAction }: { title: string; message: string; actionLabel?: string; onAction?: () => void }) {
  return <Card className="auth-card"><Icon name={title.includes('denegado') ? 'lock' : 'clipboard'} size={42}/><h1>{title}</h1><p>{message}</p>{actionLabel && <Button onClick={onAction}>{actionLabel}</Button>}</Card>;
}

function LoginScreen({ error, setError }: { error: string; setError: (value: string) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || busy) return;
    setBusy(true);
    setError('');
    const credentials = { email: email.trim(), password };
    const { error: authError } = mode === 'login'
      ? await supabase.auth.signInWithPassword(credentials)
      : await supabase.auth.signUp(credentials);
    if (authError) setError(authError.message);
    setBusy(false);
  };
  return <form className="auth-card login-form" onSubmit={submit}>
    <Icon name="lock" size={44}/>
    <h1>{mode === 'login' ? 'Ingresar' : 'Registro demo'}</h1>
    <p>Usa el correo y contraseña creados en Supabase Auth.</p>
    <label>Correo<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)}/></label>
    <label>Contraseña<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)}/></label>
    {error && <p className="field-error">{error}</p>}
    <Button type="submit" disabled={busy}>{busy ? 'Validando...' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</Button>
    <Button type="button" variant="plain" onClick={() => { setError(''); setMode(mode === 'login' ? 'register' : 'login'); }}>{mode === 'login' ? 'Crear cuenta demo' : 'Ya tengo cuenta'}</Button>
  </form>;
}

type ServerActions = {
  createCount: (count: InventoryCount, after: () => void) => Promise<void>;
  saveLine: (line: CountLine, after?: () => void) => Promise<void>;
  sendToReview: (count: InventoryCount, after: () => void) => Promise<void>;
};
type ScreenProps = { state: AppState; path?: string; go: (path: string) => void; back?: () => void; update: (fn: (s: AppState) => AppState, message?: string) => void; setModal: (node: React.ReactNode) => void; actions?: ServerActions; currentUser?: User };
const clientOf = (s: AppState, c: InventoryCount) => s.clients.find((x) => x.id === c.clientId)!;
const warehouseOf = (s: AppState, c: InventoryCount) => s.warehouses.find((x) => x.id === c.warehouseId)!;
const linesOf = (s: AppState, countId: string) => s.lines.filter((line) => line.countId === countId);
const articleOf = (s: AppState, articleId: string) => s.articles.find((a) => a.id === articleId)!;
const resolved = (s: AppState, count: InventoryCount) => linesOf(s, count.id).filter((line) => count.scopeArticleIds.includes(line.articleId)).length;
const countExpired = (s: AppState, count: InventoryCount) => count.status === 'Borrador' && new Date(s.demoNow) >= new Date(count.expiresAt);

function Status({ status, expired = false }: { status: string; expired?: boolean }) { const icon = expired ? 'alert' : status === 'Cerrado' ? 'check' : status === 'En revisión' ? 'eye' : 'clock'; return <span className={`status-chip status-${expired ? 'expired' : status.toLowerCase().replaceAll(' ', '-')}`}><Icon name={icon}/>{expired ? 'Vencido' : status}</span>; }
function Progress({ done, total }: { done: number; total: number }) { return <div className="progress-wrap"><strong>{done} de {total} artículos</strong><div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}><span style={{ width: `${Math.min(100, done / total * 100)}%` }}/></div></div>; }
function ContextCard({ state, count, compact = false }: { state: AppState; count: InventoryCount; compact?: boolean }) { const client = clientOf(state,count), warehouse = warehouseOf(state,count); return <Card className={`context-card ${compact ? 'compact' : ''}`}><div className="context-line"><Icon name="building"/><div><strong>{client.name}</strong><span>{warehouse.name}</span></div></div>{!compact && <div className="context-meta"><span><Icon name="user"/>María López</span><span><Icon name="calendar"/>{fmtDate(count.startedAt)}</span></div>}</Card>; }

function Dashboard({ state, roleUser, go, setModal }: Pick<ScreenProps,'state'|'go'|'setModal'> & { roleUser: { name: string; role: Role } }) {
  const inProgress = state.counts.filter((c) => c.status !== 'Cerrado'); const recent = state.counts.filter((c) => c.status === 'Cerrado');
  return <><header className="home-header"><div><h1>Mis levantamientos</h1></div><button className="role-chip role-button" onClick={() => setModal(<RoleModal state={state} close={() => setModal(null)} go={go}/>) }>{roleUser.role}</button><button className="avatar" aria-label="Abrir perfil" onClick={() => go('/perfil')}>{roleUser.name.split(' ').map(x=>x[0]).join('')}</button></header>
  <Button className="hero-action" onClick={() => go('/levantamientos/nuevo')}><span className="plus-disc"><Icon name="plus"/></span>Nuevo levantamiento</Button>
  <section className="section"><h2>En curso</h2>{inProgress.map((count) => <CountCardEnhanced key={count.id} state={state} count={count} go={go}/>)}</section>
  <section className="section"><h2>Recientes</h2>{recent.map((count) => <CountCardEnhanced key={count.id} state={state} count={count} go={go}/>)}</section></>;
}
function CountCardEnhanced({ state, count, go }: { state: AppState; count: InventoryCount; go:(path:string)=>void }) {
  const closed = count.status === 'Cerrado';
  const expired = countExpired(state, count);
  const done = resolved(state, count);
  const client = clientOf(state, count);
  const warehouse = warehouseOf(state, count);
  const target = closed ? `/levantamientos/${count.id}/cerrado` : count.status === 'En revisión' ? `/levantamientos/${count.id}/revision` : `/levantamientos/${count.id}/conteo`;
  return <Card className={`count-card count-card--${count.status.toLowerCase().replace(' ', '-')}`}>
    <button className="card-button" onClick={() => go(target)}>
      <Status status={count.status} expired={expired}/>
      <h3>{client.name}</h3><p>{warehouse.name}</p>
      {count.status === 'Borrador' && <div className="count-meta"><span><Icon name="user"/>María López</span><span><Icon name="calendar"/>{fmtDate(count.startedAt)}</span></div>}
      {!closed ? <><Progress done={done} total={count.scopeArticleIds.length}/><p className={expired ? 'warning-text' : 'muted-note'}><Icon name={count.status === 'En revisión' ? 'send' : 'calendar'}/>{expired ? 'El borrador venció; un supervisor puede habilitarlo.' : count.status === 'En revisión' ? 'Enviado al supervisor' : 'Guardado automáticamente · Retomar en 18 h'}</p></> : <p className="muted-note"><Icon name="calendar"/>Cerrado el {fmtDate(count.closedAt)}</p>}
      <span className={`card-cta ${count.status === 'Borrador' ? 'card-cta--primary' : ''}`}>{closed ? 'Ver resumen' : count.status === 'En revisión' ? 'Revisar cobertura' : 'Continuar conteo'}<Icon name="chevron"/></span>
    </button>
  </Card>;
}
function CountCard({ state, count, go }: { state: AppState; count: InventoryCount; go:(p:string)=>void }) { const isClosed = count.status === 'Cerrado', expired = countExpired(state,count), done = resolved(state,count), client = clientOf(state,count), warehouse = warehouseOf(state,count); const target = isClosed ? `/levantamientos/${count.id}/cerrado` : count.status === 'En revisión' ? `/levantamientos/${count.id}/revision` : `/levantamientos/${count.id}/conteo`; return <Card className="count-card" key={count.id}><button className="card-button" onClick={() => go(target)}><Status status={count.status} expired={expired}/><h3>{client.name}</h3><p>{warehouse.name}</p>{count.status !== 'Cerrado' ? <><Progress done={done} total={count.scopeArticleIds.length}/><p className={expired?'warning-text':'muted-note'}>{expired ? 'El borrador venció; un supervisor puede habilitarlo.' : count.status === 'En revisión' ? 'Enviado al supervisor' : 'Guardado automáticamente · 18 h restantes para editar'}</p></> : <p className="muted-note"><Icon name="calendar"/>Cerrado el {fmtDate(count.closedAt)}</p>}<span className="card-cta">{isClosed ? 'Ver resumen' : count.status === 'En revisión' ? 'Revisar cobertura' : 'Continuar conteo'}<Icon name="chevron"/></span></button></Card>; }

function NewCount({ state, go, back, actions, currentUser, setModal }: ScreenProps) { const [clientId, setClientId] = useState(''); const [warehouseId, setWarehouseId] = useState(''); const [attempted, setAttempted] = useState(false); const clients = state.clients.filter(c=>c.active); const warehouses = state.warehouses.filter(w=>w.clientId===clientId&&w.active); const assigned = state.clientArticles.filter(a=>a.clientId===clientId&&a.active).map(a=>a.articleId); const begin = () => { setAttempted(true); if(!clientId||!warehouseId) return; if(!assigned.length) return setModal(<Modal title="Sin artículos asignados" onClose={()=>setModal(null)}><p>Este cliente no tiene artículos activos asignados para iniciar un levantamiento.</p><Button onClick={()=>setModal(null)}>Entendido</Button></Modal>); const existing = state.counts.find(c=>c.clientId===clientId&&c.warehouseId===warehouseId&&c.status==='Borrador'&&!countExpired(state,c)); if(existing) return setModal(<Modal title="Borrador existente" onClose={()=>setModal(null)}><p>Ya existe un borrador vigente para esta combinación.</p><Button onClick={()=>go(`/levantamientos/${existing.id}/conteo`)}>Continuar borrador</Button><Button variant="secondary" onClick={()=>setModal(null)}>Cancelar</Button></Modal>); const count = buildDraftCount(id('count'), clientId, warehouseId, currentUser?.id ?? 'maria', assigned); actions?.createCount(count, () => go(`/levantamientos/${count.id}/conteo`)); };
 return <><Header title="Nuevo levantamiento" back={back}/><div className="screen-pad"><p className="intro">Selecciona el cliente y la bodega donde realizarás el conteo.</p><label>Cliente <em>*</em><select value={clientId} onChange={e=>{setClientId(e.target.value);setWarehouseId('')}}><option value="">Selecciona un cliente</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>{attempted&&!clientId&&<span className="field-error">Selecciona un cliente.</span>}</label><label>Bodega <em>*</em><select disabled={!clientId} value={warehouseId} onChange={e=>setWarehouseId(e.target.value)}><option value="">{clientId?'Selecciona una bodega':'Selecciona primero un cliente'}</option>{warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select>{attempted&&!warehouseId&&<span className="field-error">Selecciona una bodega.</span>}</label>{clientId&&<p className="info-line"><Icon name="alert"/>{warehouses.length} bodegas disponibles para este cliente</p>}<Card className="responsible"><h3>Responsable y fecha</h3><div><span><Icon name="user"/>María López</span><span><Icon name="calendar"/>{fmtDate(state.demoNow)}</span></div></Card><p className="auto-save"><Icon name="check"/>El conteo se guardará automáticamente durante 24 horas.</p><h2>Resumen</h2><div className="summary-grid"><Card><Icon name="clipboard"/><strong>{assigned.length || '—'} artículos activos</strong></Card><Card><Icon name="alert"/><strong>{state.articles.filter(a=>assigned.includes(a.id)&&a.appliesExpiry).length || '—'} con vencimiento</strong></Card></div></div><div className="sticky-action"><p>Podrás continuar el levantamiento más tarde.</p><Button onClick={begin}>Iniciar conteo</Button></div></>; }

function CountView({ state, path = '', go, back, update, setModal, actions }: ScreenProps) {
  const countId = path.split('/')[2];
  const count = state.counts.find((candidate) => candidate.id === countId);
  const returning = new URLSearchParams(location.search).get('volver') === 'revision';
  const requestedArticle = new URLSearchParams(location.search).get('articulo') ?? 'a-00125';
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(requestedArticle);
  const [unit, setUnit] = useState<UnitType>(articleOf(state, requestedArticle).unitsPerBox > 1 ? 'Caja' : 'Unidad');
  const [quantity, setQuantity] = useState('3');
  const [expiry, setExpiry] = useState('');
  const [obs, setObs] = useState('');
  const [touched, setTouched] = useState(false);
  if (!count) return null;
  const expired = countExpired(state, count);
  const scoped = state.articles.filter((article) => count.scopeArticleIds.includes(article.id));
  const matches = search ? scoped.filter((candidate) => `${candidate.name} ${candidate.code} ${candidate.barcode ?? ''}`.toLowerCase().includes(search.toLowerCase())).slice(0, 8) : [];
  const article = articleOf(state, selectedId);
  const numberValid = /^\d+$/.test(quantity) && Number(quantity) <= 999999;
  const total = numberValid ? (unit === 'Caja' ? Number(quantity) * article.unitsPerBox : Number(quantity)) : 0;
  const existing = linesOf(state, count.id).find((line) => line.articleId === article.id);
  const chooseArticle = (selected: Article) => {
    const savedLine = linesOf(state, count.id).find((line) => line.articleId === selected.id);
    setSelectedId(selected.id);
    setUnit(savedLine?.unitType ?? (selected.unitsPerBox > 1 ? 'Caja' : 'Unidad'));
    setQuantity(savedLine ? String(savedLine.quantity) : '3');
    setExpiry(savedLine?.lots[0]?.expiryDate ?? '');
    setObs(savedLine?.observation ?? '');
    setTouched(false);
    setSearch('');
  };
  const save = () => { setTouched(true); if (!numberValid || article.appliesExpiry && !expiry) return; const lineId = existing?.id ?? id('line'); const lots = article.appliesExpiry ? [{ id: existing?.lots[0]?.id ?? id('lot'), lineId, order: 1, unitType: unit, quantity: Number(quantity), totalUnits: total, expiryDate: expiry, observation: obs.trim() }] : existing?.lots ?? []; const line: CountLine = { id: lineId, countId: count.id, articleId: article.id, unitType: unit, quantity: Number(quantity), totalUnits: total, observation: obs.trim(), zeroConfirmed: false, lots }; actions?.saveLine(line, () => { if (returning) go(`/levantamientos/${count.id}/revision`); else { setSearch(''); setObs(''); } }); };
  const send = () => { if (resolved(state, count) !== count.scopeArticleIds.length) return setModal(<Modal title="Cobertura pendiente" onClose={() => setModal(null)}><p>Debes resolver todos los artículos antes de enviar a revisión.</p><Button onClick={() => setModal(null)}>Entendido</Button></Modal>); actions?.sendToReview(count, () => go(`/levantamientos/${count.id}/revision`)); };
  const reactivate = () => update((current) => ({ ...current, counts: current.counts.map((candidate) => candidate.id === count.id ? { ...candidate, expiresAt: new Date(new Date(current.demoNow).getTime() + 86400000).toISOString() } : candidate), history: [...current.history, { id: id('event'), countId: count.id, type: 'Reactivado', actorId: 'carlos', occurredAt: current.demoNow }] }), 'Borrador habilitado por 24 h');
  return <><Header title="Conteo de inventario" back={back} badge={<Status status="Borrador" expired={expired}/>}/><div className="screen-pad count-screen">{expired ? <Card className="warning-card"><Icon name="lock"/><div><strong>Borrador vencido</strong><p>{state.role === 'Supervisor' ? 'Puedes habilitarlo por 24 horas para permitir cambios.' : 'Activa el modo Supervisor para habilitarlo.'}</p>{state.role === 'Supervisor' && <Button variant="secondary" onClick={reactivate}>Habilitar borrador</Button>}</div></Card> : <p className="saved-line"><Icon name="check"/>Guardado automáticamente <span>Disponible para retomar durante 24 horas</span></p>}<ContextCard state={state} count={count}/><Progress done={resolved(state, count)} total={count.scopeArticleIds.length}/><div className="search-row"><label className="search-box"><Icon name="search"/><input aria-label="Buscar artículo" placeholder="Buscar artículo" value={search} onChange={(event) => setSearch(event.target.value)} disabled={expired}/></label><button className="scan-button" aria-label="Escanear artículo con la cámara" disabled={expired} onClick={() => setModal(<CameraScanner articles={state.articles} scopeArticleIds={count.scopeArticleIds} onChoose={(selected) => { chooseArticle(selected); setModal(null); }} close={() => setModal(null)}/>) }><Icon name="scan"/></button></div>{search && <div className="results">{matches.length ? matches.map((candidate) => <button key={candidate.id} onClick={() => chooseArticle(candidate)}>{candidate.code}<strong>{candidate.name}</strong></button>) : <p>Sin coincidencias.</p>}</div>}<p className="scan-help"><Icon name="scan"/>Escanear artículo <span>Apunta la cámara a un código Code 128 o ingrésalo manualmente.</span></p><Card className="article-card"><div className="product-art">NARA</div><div><h2>{article.name}</h2><p>{article.presentation === 'Caja' ? `Caja de ${article.unitsPerBox} unidades` : 'Unidad'}</p>{article.appliesExpiry && <span className="status-chip status-borrador">Aplica vence</span>}</div></Card><div className="segmented"><button className={unit === 'Caja' ? 'active' : ''} disabled={article.unitsPerBox === 1 || expired} onClick={() => setUnit('Caja')}><Icon name="box"/>Caja</button><button className={unit === 'Unidad' ? 'active' : ''} disabled={expired} onClick={() => setUnit('Unidad')}><Icon name="box"/>Unidad</button></div><label>Cantidad<input inputMode="numeric" value={quantity} disabled={expired} onChange={(event) => setQuantity(event.target.value)} onBlur={() => setTouched(true)}/></label>{numberValid ? <p className="helper">Equivale a {nf.format(total)} unidades</p> : touched && <p className="field-error">Usa números enteros; no se permiten decimales.</p>}{article.appliesExpiry && <label>Fecha de vencimiento <span className="required-tag">Obligatoria</span><input type="date" value={expiry} disabled={expired} onChange={(event) => setExpiry(event.target.value)}/>{touched && !expiry && <span className="field-error">Selecciona una fecha para este artículo.</span>}</label>}<label>Observación <small>(opcional)</small><textarea maxLength={200} placeholder="Añade una observación" value={obs} disabled={expired} onChange={(event) => setObs(event.target.value)}/></label>{article.appliesExpiry && <button className="text-action" disabled={expired} onClick={() => go(`/levantamientos/${count.id}/articulos/${article.id}/lotes`)}><Icon name="plus"/>Agregar otro lote</button>}</div><div className="sticky-action">{resolved(state, count) === count.scopeArticleIds.length ? <Button variant="secondary" onClick={send}><Icon name="send"/>Enviar a revisión</Button> : null}<Button disabled={expired} onClick={save}><Icon name="clipboard"/>Guardar conteo</Button></div></>;
}

type ScannerMode = 'checking' | 'requesting' | 'live' | 'manual' | 'unsupported' | 'error';

function CameraScanner({ articles, scopeArticleIds, onChoose, close }: { articles: Article[]; scopeArticleIds: string[]; onChoose: (article: Article) => void; close: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerControlsRef = useRef<{ stop: () => void } | null>(null);
  const frameRef = useRef<number | null>(null);
  const detectingRef = useRef(false);
  const lastReadRef = useRef({ value: '', at: 0 });
  const [mode, setMode] = useState<ScannerMode>('checking');
  const [message, setMessage] = useState('Comprobando la cámara y el lector Code 128…');
  const [manualCode, setManualCode] = useState('');
  const scope = useMemo(() => new Set(scopeArticleIds), [scopeArticleIds]);

  const stopCamera = useCallback(() => {
    scannerControlsRef.current?.stop();
    scannerControlsRef.current = null;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    detectingRef.current = false;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const resolveCode = useCallback((rawValue: string) => {
    const value = rawValue.trim().toUpperCase();
    if (!value) return false;
    const now = performance.now();
    if (lastReadRef.current.value === value && now - lastReadRef.current.at < 1600) return false;
    lastReadRef.current = { value, at: now };
    const found = articles.find((candidate) => (candidate.barcode ?? candidate.code).trim().toUpperCase() === value || candidate.code.trim().toUpperCase() === value);
    if (!found) {
      setMessage(`El código ${value} no existe en el catálogo.`);
      return false;
    }
    if (!scope.has(found.id)) {
      setMessage(`${found.name} existe, pero no está asignado a este levantamiento.`);
      return false;
    }
    stopCamera();
    setMessage(`${found.name} reconocido.`);
    onChoose(found);
    return true;
  }, [articles, onChoose, scope, stopCamera]);

  const startCamera = useCallback(async () => {
    stopCamera();
    setMessage('Comprobando la cámara y el lector Code 128…');
    setMode('checking');
    if (!navigator.mediaDevices?.getUserMedia) {
      setMode('unsupported');
      setMessage('Este dispositivo o navegador no ofrece acceso a la cámara. Usa el ingreso manual.');
      return;
    }
    try {
      setMode('requesting');
      setMessage('Autoriza la cámara para escanear el código.');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
      });
      streamRef.current = stream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack?.getCapabilities && videoTrack.applyConstraints) {
        try {
          const capabilities = videoTrack.getCapabilities() as MediaTrackCapabilities & { focusMode?: string[] };
          if (capabilities.focusMode?.includes('continuous')) {
            await videoTrack.applyConstraints({ advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet] });
          }
        } catch {
          // Algunas cámaras publican enfoque continuo, pero no permiten cambiarlo.
        }
      }
      if (!videoRef.current) { stopCamera(); return; }
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setMode('live');
      setMessage('Cámara activa. Centra un código Code 128 dentro del marco.');
      let useNativeDetector = false;
      if ('BarcodeDetector' in window) {
        try {
          const formats = await window.BarcodeDetector.getSupportedFormats?.();
          useNativeDetector = Boolean(formats?.includes('code_128'));
        } catch { useNativeDetector = false; }
      }
      if (useNativeDetector) {
        const detector = new window.BarcodeDetector({ formats: ['code_128'] });
        let previousDetection = 0;
        const detectFrame = async (timestamp: number) => {
          if (!streamRef.current) return;
          frameRef.current = requestAnimationFrame(detectFrame);
          if (!videoRef.current || videoRef.current.readyState < 2 || detectingRef.current || timestamp - previousDetection < 180) return;
          previousDetection = timestamp;
          detectingRef.current = true;
          try {
            const results = await detector.detect(videoRef.current);
            if (results[0] && resolveCode(results[0].rawValue)) return;
          } catch {
            setMessage('No se pudo leer este cuadro. Mantén el código quieto e intenta de nuevo.');
          } finally {
            detectingRef.current = false;
          }
        };
        frameRef.current = requestAnimationFrame(detectFrame);
      } else {
        const hints = new Map<DecodeHintType, unknown>();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128]);
        hints.set(DecodeHintType.TRY_HARDER, true);
        const streamReader = new BrowserMultiFormatOneDReader(hints, { delayBetweenScanAttempts: 100, delayBetweenScanSuccess: 400 });
        void streamReader.decodeFromStream(stream, videoRef.current, (result) => {
          if (result) resolveCode(result.getText());
        }).then((controls) => {
          if (streamRef.current === stream) scannerControlsRef.current = controls;
          else controls.stop();
        }).catch(() => {
          if (streamRef.current === stream) setMessage('La cámara está activa, pero el lector no pudo iniciarse. Puedes ingresar el código manualmente.');
        });
        const reader = new BrowserMultiFormatOneDReader(hints);
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { willReadFrequently: true });
        let previousDetection = 0;
        let pass = 0;
        const scanPasses = [
          { angle: 0, insetX: .04, insetY: .16, width: .92, height: .68, contrast: false },
          { angle: -4, insetX: .04, insetY: .16, width: .92, height: .68, contrast: false },
          { angle: 4, insetX: .04, insetY: .16, width: .92, height: .68, contrast: false },
          { angle: -8, insetX: .08, insetY: .22, width: .84, height: .56, contrast: true },
          { angle: 8, insetX: .08, insetY: .22, width: .84, height: .56, contrast: true },
        ];
        const detectZxingFrame = (timestamp: number) => {
          if (!streamRef.current) return;
          frameRef.current = requestAnimationFrame(detectZxingFrame);
          const video = videoRef.current;
          if (!video || !context || video.readyState < 2 || detectingRef.current || timestamp - previousDetection < 180) return;
          previousDetection = timestamp;
          detectingRef.current = true;
          const sourceWidth = video.videoWidth;
          const sourceHeight = video.videoHeight;
          const scanPass = scanPasses[pass % scanPasses.length];
          pass += 1;
          const sourceX = Math.round(sourceWidth * scanPass.insetX);
          const sourceY = Math.round(sourceHeight * scanPass.insetY);
          const cropWidth = Math.round(sourceWidth * scanPass.width);
          const cropHeight = Math.round(sourceHeight * scanPass.height);
          const targetWidth = Math.min(1920, Math.max(1080, Math.round(cropWidth * 1.5)));
          const targetHeight = Math.max(280, Math.round(targetWidth * cropHeight / cropWidth));
          if (canvas.width !== targetWidth || canvas.height !== targetHeight) { canvas.width = targetWidth; canvas.height = targetHeight; }
          context.save();
          context.clearRect(0, 0, targetWidth, targetHeight);
          context.translate(targetWidth / 2, targetHeight / 2);
          context.rotate(scanPass.angle * Math.PI / 180);
          context.filter = scanPass.contrast ? 'grayscale(1) contrast(1.7)' : 'none';
          context.imageSmoothingEnabled = false;
          context.drawImage(video, sourceX, sourceY, cropWidth, cropHeight, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
          context.restore();
          try {
            const result = reader.decodeFromCanvas(canvas);
            if (result) resolveCode(result.getText());
          } catch {
            // No encontrar un código en un cuadro es normal durante el escaneo continuo.
          } finally {
            detectingRef.current = false;
          }
        };
        frameRef.current = requestAnimationFrame(detectZxingFrame);
      }
    } catch (error) {
      stopCamera();
      const name = error instanceof DOMException ? error.name : '';
      setMode('error');
      if (!window.isSecureContext) setMessage('Este origen no permite usar la cámara. Abre la aplicación en localhost o HTTPS y vuelve a intentar.');
      else if (name === 'NotAllowedError' || name === 'SecurityError') setMessage('Permiso de cámara rechazado. Puedes habilitarlo en el navegador o ingresar el código manualmente.');
      else if (name === 'NotFoundError' || name === 'OverconstrainedError') setMessage('No se encontró una cámara compatible. Usa el ingreso manual.');
      else if (name === 'NotReadableError' || name === 'AbortError') setMessage('La cámara está ocupada o no pudo iniciarse. Cierra otras aplicaciones e intenta de nuevo.');
      else setMessage('No fue posible iniciar la cámara. Usa el ingreso manual o vuelve a intentar.');
    }
  }, [resolveCode, stopCamera]);

  useEffect(() => { void startCamera(); return stopCamera; }, [startCamera, stopCamera]);
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) { stopCamera(); setMode('manual'); setMessage('La cámara se detuvo porque la pestaña dejó de estar visible.'); }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [stopCamera]);

  const submitManual = (event: React.FormEvent) => { event.preventDefault(); if (!manualCode.trim()) { setMessage('Ingresa un código Code 128 o código interno.'); return; } resolveCode(manualCode); };
  const closeScanner = () => { stopCamera(); close(); };
  const cameraActive = mode === 'live' || mode === 'requesting';
  return <Modal title="Escanear Code 128" onClose={closeScanner} className="scanner-modal"><div className={`scanner-preview ${cameraActive ? 'is-live' : ''}`}><video ref={videoRef} autoPlay muted playsInline aria-label="Vista previa de la cámara"/><span className="scanner-frame" aria-hidden="true"/><div className="scanner-placeholder"><Icon name="scan" size={42}/><span>{mode === 'requesting' ? 'Esperando permiso…' : mode === 'live' ? 'Buscando código…' : 'Cámara detenida'}</span></div></div><p className={`scanner-status ${message.includes('no existe') || message.includes('no está asignado') ? 'is-warning' : ''}`} role="status" aria-live="polite">{message}</p>{!cameraActive && <Button variant="secondary" onClick={() => void startCamera()}><Icon name="scan"/>Intentar usar la cámara</Button>}<form className="scanner-manual" onSubmit={submitManual}><label htmlFor="manual-barcode">Código Code 128 o código interno<input id="manual-barcode" value={manualCode} autoCapitalize="characters" autoComplete="off" spellCheck={false} placeholder="Ej. 118120007" onChange={(event) => setManualCode(event.target.value.toUpperCase())}/></label><Button type="submit">Buscar código</Button></form><p className="scanner-privacy"><Icon name="lock" size={18}/>El video se procesa en este dispositivo; no se guarda ni se envía.</p><Button variant="plain" onClick={closeScanner}>Cancelar</Button></Modal>;
}

function LotsViewEnhanced({ state, path = '', go, back, actions, setModal }: ScreenProps) {
  const segments = path.split('/');
  const countId = segments[2];
  const articleId = segments[4];
  const article = articleOf(state, articleId);
  const line = linesOf(state, countId).find((item) => item.articleId === articleId);
  const initialLots = line?.lots ?? [];
  const [lots, setLots] = useState<Lot[]>(initialLots);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [draft, setDraft] = useState({ unit: 'Caja' as UnitType, qty: '', date: '', obs: '' });
  const draftDirty = Boolean(draft.qty || draft.date || draft.obs || editingId);
  const dirty = JSON.stringify(lots) !== JSON.stringify(initialLots) || draftDirty;
  const complete = lots.length > 0 && lots.every((lot) => lot.quantity >= 0 && Boolean(lot.expiryDate));
  const draftValid = /^\d+$/.test(draft.qty) && Boolean(draft.date);

  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [dirty]);

  const clearDraft = () => {
    setDraft({ unit: 'Caja', qty: '', date: '', obs: '' });
    setEditingId(null);
    setAttempted(false);
  };

  const addOrUpdate = () => {
    setAttempted(true);
    if (!draftValid) return;
    const quantity = Number(draft.qty);
    const totalUnits = draft.unit === 'Caja' ? quantity * article.unitsPerBox : quantity;
    if (editingId) {
      setLots((current) => current.map((lot) => lot.id === editingId
        ? { ...lot, unitType: draft.unit, quantity, totalUnits, expiryDate: draft.date, observation: draft.obs.trim() }
        : lot));
    } else {
      setLots((current) => [...current, {
        id: id('lot'), lineId: line?.id ?? id('line'), order: current.length + 1,
        unitType: draft.unit, quantity, totalUnits, expiryDate: draft.date, observation: draft.obs.trim(),
      }]);
    }
    clearDraft();
  };

  const edit = (lot: Lot) => {
    setEditingId(lot.id);
    setDraft({ unit: lot.unitType, qty: String(lot.quantity), date: lot.expiryDate, obs: lot.observation });
    setAttempted(false);
    requestAnimationFrame(() => document.querySelector('.lot-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };

  const remove = (lot: Lot) => setModal(<Modal title="Eliminar lote" onClose={() => setModal(null)}>
    <p>¿Deseas eliminar el lote con vencimiento {fmtDate(lot.expiryDate)}?</p>
    <Button variant="danger" onClick={() => {
      setLots((current) => current.filter((item) => item.id !== lot.id).map((item, index) => ({ ...item, order: index + 1 })));
      if (editingId === lot.id) clearDraft();
      setModal(null);
    }}>Eliminar lote</Button>
    <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
  </Modal>);

  const leave = () => {
    const exit = () => back ? back() : go(`/levantamientos/${countId}/conteo?articulo=${articleId}`);
    if (!dirty) return exit();
    setModal(<Modal title="Cambios sin guardar" onClose={() => setModal(null)}>
      <p>Los cambios realizados en los lotes todavía no se han guardado.</p>
      <Button variant="danger" onClick={() => { setModal(null); exit(); }}>Salir sin guardar</Button>
      <Button variant="secondary" onClick={() => setModal(null)}>Continuar editando</Button>
    </Modal>);
  };

  const save = () => {
    if (!complete || draftDirty) return;
    const totalUnits = lots.reduce((sum, lot) => sum + lot.totalUnits, 0);
    const next: CountLine = {
      id: line?.id ?? id('line'), countId, articleId, unitType: lots[0].unitType,
      quantity: lots.reduce((sum, lot) => sum + lot.quantity, 0), totalUnits,
      observation: '', zeroConfirmed: false, lots,
    };
    actions?.saveLine(next, () => go(`/levantamientos/${countId}/conteo?articulo=${articleId}`));
  };

  return <>
    <Header title="Lotes y vencimientos" back={leave}/>
    <div className="screen-pad">
      <Card className="article-card"><div className="product-art"><Icon name="box" size={54}/></div><div><h2>{article.name}</h2><p>Caja de {article.unitsPerBox} unidades</p><span className="status-chip status-expired">Aplica vence</span></div></Card>
      <Card className="total-card"><Icon name="package"/><strong>Total registrado: {nf.format(lots.reduce((sum, lot) => sum + lot.totalUnits, 0))} unidades</strong></Card>
      <h2>Lotes registrados</h2>
      {lots.map((lot, index) => <Card className="lot-card" key={lot.id}>
        <div className="lot-actions"><button aria-label={`Editar lote ${index + 1}`} onClick={() => edit(lot)}><Icon name="edit"/></button><button aria-label={`Eliminar lote ${index + 1}`} onClick={() => remove(lot)}><Icon name="trash"/></button></div>
        <h3>Lote {String(index + 1).padStart(2, '0')}</h3><p>Vence: {fmtDate(lot.expiryDate)}</p><hr/>
        <div className="lot-data"><span>Cantidad<br/><strong>{lot.quantity} {lot.unitType === 'Caja' ? 'cajas' : 'unidades'}</strong></span><span>→</span><span>Equivale a<br/><strong>{lot.totalUnits} unidades</strong></span></div>
        {lot.observation && <p>Observación: <strong>{lot.observation}</strong></p>}
      </Card>)}
      <Card className="lot-form"><h3>{editingId ? 'Editar lote' : 'Agregar lote'}</h3>
        <div className="two-cols"><select aria-label="Unidad del lote" value={draft.unit} onChange={(event) => setDraft({ ...draft, unit: event.target.value as UnitType })}><option>Caja</option><option>Unidad</option></select><input aria-label="Cantidad del lote" inputMode="numeric" placeholder="Cantidad" value={draft.qty} onChange={(event) => setDraft({ ...draft, qty: event.target.value })}/></div>
        <input aria-label="Fecha del lote" type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })}/>
        <input aria-label="Observación del lote" placeholder="Observación opcional" value={draft.obs} onChange={(event) => setDraft({ ...draft, obs: event.target.value })}/>
        {attempted && !draftValid && <p className="field-error">Completa la cantidad con un entero y selecciona una fecha.</p>}
        <Button variant="secondary" onClick={addOrUpdate}><Icon name={editingId ? 'check' : 'plus'}/>{editingId ? 'Guardar cambios del lote' : 'Agregar lote'}</Button>
        {editingId && <Button variant="plain" onClick={clearDraft}>Cancelar edición</Button>}
      </Card>
      {(!complete || draftDirty) && <p className="incomplete"><Icon name="alert"/>{draftDirty ? 'Termina o cancela la edición actual antes de guardar.' : 'Completa la cantidad y la fecha de cada lote para guardar.'}</p>}
    </div>
    <div className="sticky-action"><Button disabled={!complete || draftDirty} onClick={save}>Guardar {lots.length} lotes</Button></div>
  </>;
}

function LotsView({ state, path = '', go, back, update, setModal }: ScreenProps) { const segments=path.split('/'); const countId=segments[2]; const articleId=segments[4]; const count=state.counts.find(c=>c.id===countId)!; const article=articleOf(state,articleId); const line=linesOf(state,countId).find(l=>l.articleId===articleId); const [lots,setLots]=useState<Lot[]>(line?.lots??[]); const [draft,setDraft]=useState({unit:'Caja' as UnitType,qty:'',date:'',obs:''}); const complete=lots.length>0&&lots.every(l=>l.quantity>=0&&!!l.expiryDate); const add=()=>{if(!/^\d+$/.test(draft.qty)||!draft.date)return; const q=Number(draft.qty),u=draft.unit==='Caja'?q*article.unitsPerBox:q;setLots([...lots,{id:id('lot'),lineId:line?.id??id('line'),order:lots.length+1,unitType:draft.unit,quantity:q,totalUnits:u,expiryDate:draft.date,observation:draft.obs}]);setDraft({unit:'Caja',qty:'',date:'',obs:''});}; const save=()=>{if(!complete)return;const total=lots.reduce((sum,l)=>sum+l.totalUnits,0);const next:CountLine={id:line?.id??id('line'),countId,articleId,unitType:lots[0].unitType,quantity:lots.reduce((n,l)=>n+l.quantity,0),totalUnits:total,observation:'',zeroConfirmed:false,lots};update(s=>({...s,lines:[...s.lines.filter(l=>l.id!==next.id),next]}),'Lotes guardados');go(`/levantamientos/${countId}/conteo`)};
 return <><Header title="Lotes y vencimientos" back={back}/><div className="screen-pad"><Card className="article-card"><div className="product-art"><Icon name="box" size={54}/></div><div><h2>{article.name}</h2><p>Caja de {article.unitsPerBox} unidades</p><span className="status-chip status-expired">Aplica vence</span></div></Card><Card className="total-card"><Icon name="package"/><strong>Total registrado: {nf.format(lots.reduce((s,l)=>s+l.totalUnits,0))} unidades</strong></Card><h2>Lotes registrados</h2>{lots.map((lot,index)=><Card className="lot-card" key={lot.id}><button className="lot-delete" aria-label={`Eliminar lote ${index+1}`} onClick={()=>setModal(<Modal title="Eliminar lote" onClose={()=>setModal(null)}><p>¿Deseas eliminar este lote?</p><Button variant="danger" onClick={()=>{setLots(lots.filter(x=>x.id!==lot.id));setModal(null)}}>Eliminar lote</Button><Button variant="secondary" onClick={()=>setModal(null)}>Cancelar</Button></Modal>)}><Icon name="trash"/></button><h3>Lote {String(index+1).padStart(2,'0')}</h3><p>Vence: {fmtDate(lot.expiryDate)}</p><hr/><div className="lot-data"><span>Cantidad<br/><strong>{lot.quantity} {lot.unitType==='Caja'?'cajas':'unidades'}</strong></span><span>→</span><span>Equivale a<br/><strong>{lot.totalUnits} unidades</strong></span></div>{lot.observation&&<p>Observación: <strong>{lot.observation}</strong></p>}</Card>)}<Card className="lot-form"><h3>Agregar lote</h3><div className="two-cols"><select aria-label="Unidad del lote" value={draft.unit} onChange={e=>setDraft({...draft,unit:e.target.value as UnitType})}><option>Caja</option><option>Unidad</option></select><input aria-label="Cantidad del lote" inputMode="numeric" placeholder="Cantidad" value={draft.qty} onChange={e=>setDraft({...draft,qty:e.target.value})}/></div><input aria-label="Fecha del lote" type="date" value={draft.date} onChange={e=>setDraft({...draft,date:e.target.value})}/><input aria-label="Observación del lote" placeholder="Observación opcional" value={draft.obs} onChange={e=>setDraft({...draft,obs:e.target.value})}/><Button variant="secondary" onClick={add}><Icon name="plus"/>Agregar lote</Button></Card>{!complete&&<p className="incomplete"><Icon name="alert"/>Completa la cantidad y la fecha de cada lote para guardar.</p>}</div><div className="sticky-action"><Button disabled={!complete} onClick={save}>Guardar {lots.length} lotes</Button></div></>; }

function ReviewView({ state, path = '', go, back, update, setModal, actions }: ScreenProps) { const countId=path.split('/')[2]; const count=state.counts.find(c=>c.id===countId)!; const pending=count.scopeArticleIds.filter(aid=>!linesOf(state,countId).some(l=>l.articleId===aid)); const close=()=>setModal(<Modal title="Cerrar levantamiento" onClose={()=>setModal(null)}><p>Se cerrará el levantamiento de {clientOf(state,count).name} con {count.scopeArticleIds.length} artículos validados.</p><Button onClick={()=>{update(s=>({...s,counts:s.counts.map(c=>c.id===countId?{...c,status:'Cerrado',closedAt:s.demoNow,closedBy:'carlos'}:c),history:[...s.history,{id:id('event'),countId,type:'Cerrado',actorId:'carlos',occurredAt:s.demoNow}]}),'Levantamiento cerrado');go(`/levantamientos/${countId}/cerrado`)}}>Confirmar cierre</Button><Button variant="secondary" onClick={()=>setModal(null)}>Cancelar</Button></Modal>); const zero=(articleId:string)=>setModal(<Modal title="Confirmar cantidad cero" onClose={()=>setModal(null)}><p>Registrarás cero unidades para {articleOf(state,articleId).name}. Esta acción quedará en el historial.</p><Button onClick={()=>{const l:CountLine={id:id('line'),countId,articleId,unitType:'Unidad',quantity:0,totalUnits:0,observation:'Cero confirmado en revisión',zeroConfirmed:true,lots:[]};actions?.saveLine(l, () => setModal(null));}}>Confirmar cero</Button><Button variant="secondary" onClick={()=>setModal(null)}>Cancelar</Button></Modal>);
 return <><Header title="Revisión de cobertura" back={back} badge={<Status status="En revisión"/>}/><div className="screen-pad"><ContextCard state={state} count={count}/><Card className="coverage"><Progress done={resolved(state,count)} total={count.scopeArticleIds.length}/></Card>{pending.length?<Card className="warning-card"><Icon name="alert"/><div><strong>{pending.length} artículos sin conteo</strong><p>Registra una cantidad o confirma cantidad cero antes de cerrar.</p></div></Card>:<Card className="success-card"><Icon name="check"/><div><strong>Cobertura completa</strong><p>Todos los artículos tienen una decisión registrada.</p></div></Card>}<div className="pending-list">{pending.map(articleId=>{const a=articleOf(state,articleId);const previous=a.id==='a-00418'?'48 unidades':a.id==='a-00920'?'0 unidades':'Sin conteo anterior';return <Card className="pending-card" key={a.id}><span className="pending-icon"><Icon name="alert"/></span><div><h3>{a.name}</h3><p>Levantamiento anterior: {previous}</p><div className="pending-actions"><Button onClick={()=>go(`/levantamientos/${countId}/conteo?volver=revision&articulo=${a.id}`)}>Registrar conteo</Button><Button variant="secondary" onClick={()=>zero(a.id)}>Confirmar cero</Button></div></div></Card>})}</div></div><div className="sticky-action"><Button disabled={pending.length>0} onClick={close}><Icon name="lock"/>Cerrar levantamiento</Button><p>{pending.length?`Resuelve los ${pending.length} artículos pendientes`:'Listo para cerrar'}</p></div></>; }

function ClosedViewEnhanced({ state, path = '', go, back, update, setModal }: ScreenProps) {
  const countId = path.split('/')[2];
  const count = state.counts.find((item) => item.id === countId)!;
  const totalUnits = linesOf(state, countId).reduce((sum, item) => sum + item.totalUnits, 0);
  const expiryCount = linesOf(state, countId).filter((item) => articleOf(state, item.articleId).appliesExpiry).length;
  const recordedEvents = state.history.filter((event) => event.countId === countId);
  const sentEvent = recordedEvents.find((event) => event.type === 'Enviado a revisión') ?? {
    id: `${countId}-sent-display`, countId, type: 'Enviado a revisión', actorId: 'maria',
    occurredAt: countId === 'count-closed-ahorro' ? '2026-07-17T15:38:00-06:00' : count.startedAt,
  };
  const displayEvents = [sentEvent, ...recordedEvents.filter((event) => event.id !== sentEvent.id)];
  const reopen = () => {
    let reason = '';
    setModal(<Modal title="Reabrir levantamiento" onClose={() => setModal(null)}>
      <p>Para permitir cambios, indica el motivo de la reapertura.</p>
      <textarea autoFocus maxLength={300} placeholder="Motivo obligatorio" onChange={(event) => { reason = event.target.value; }}/>
      <Button onClick={() => {
        if (!reason.trim()) return;
        update((current) => ({ ...current,
          counts: current.counts.map((item) => item.id === countId ? { ...item, status: 'En revisión', reopenedAt: current.demoNow } : item),
          history: [...current.history, { id: id('event'), countId, type: 'Reabierto', actorId: 'carlos', occurredAt: current.demoNow, reason: reason.trim() }],
        }), 'Levantamiento reabierto');
        go(`/levantamientos/${countId}/revision`);
      }}>Confirmar reapertura</Button>
      <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
    </Modal>);
  };
  return <>
    <Header title="Levantamiento cerrado" back={back} badge={<Status status="Cerrado"/>}/>
    <div className="screen-pad closed-screen">
      <Card className="closed-context">
        <div><Icon name="building"/><strong>{clientOf(state, count).name}</strong></div>
        <div><Icon name="warehouse"/><strong>{warehouseOf(state, count).name}</strong></div>
        <div><Icon name="user"/><strong>María López</strong></div>
        <div><Icon name="calendar"/><strong>{fmtDate(count.closedAt)}</strong></div>
      </Card>
      <Card className="closed-banner"><Icon name="check" size={50}/><div><strong>{resolved(state, count)} de {count.scopeArticleIds.length} artículos validados</strong><p>Cerrado por Carlos Mena · {fmtDate(count.closedAt, true)}</p></div></Card>
      <h2>Resumen de conteo</h2>
      <div className="stat-grid"><Card><Icon name="box"/><strong>{count.scopeArticleIds.length}</strong><span>artículos</span></Card><Card><Icon name="package"/><strong>{nf.format(totalUnits || 1284)}</strong><span>unidades</span></Card><Card><Icon name="clock"/><strong>{expiryCount || 6}</strong><span>con vencimiento</span></Card></div>
      <h2>Historial</h2>
      <div className="timeline">{displayEvents.map((event) => <div key={event.id}><span className="timeline-dot"><Icon name={event.type === 'Cerrado' ? 'check' : 'send'}/></span><strong>{event.type}</strong><p>{state.users.find((user) => user.id === event.actorId)?.name} · {fmtDate(event.occurredAt, true)}{event.reason ? ` · ${event.reason}` : ''}</p></div>)}</div>
      {state.role === 'Supervisor' ? <><Button variant="warning" onClick={reopen}><Icon name="refresh"/>Reabrir levantamiento<Icon name="chevron"/></Button><p className="reopen-note">Requiere indicar un motivo antes de permitir cambios.</p></> : <p className="muted-note">Solo un supervisor puede reabrir este levantamiento.</p>}
    </div>
  </>;
}

function ClosedView({ state,path = '',go,back,update,setModal }: ScreenProps) { const countId=path.split('/')[2];const count=state.counts.find(c=>c.id===countId)!;const totalUnits=linesOf(state,countId).reduce((s,l)=>s+l.totalUnits,0);const exp=linesOf(state,countId).filter(l=>articleOf(state,l.articleId).appliesExpiry).length; const reopen=()=>{let reason='';setModal(<Modal title="Reabrir levantamiento" onClose={()=>setModal(null)}><p>Para permitir cambios, indica el motivo de la reapertura.</p><textarea autoFocus maxLength={300} placeholder="Motivo obligatorio" onChange={e=>reason=e.target.value}/><Button onClick={()=>{if(!reason.trim())return;update(s=>({...s,counts:s.counts.map(c=>c.id===countId?{...c,status:'En revisión',reopenedAt:s.demoNow}:c),history:[...s.history,{id:id('event'),countId,type:'Reabierto',actorId:'carlos',occurredAt:s.demoNow,reason}]}),'Levantamiento reabierto');go(`/levantamientos/${countId}/revision`)}}>Confirmar reapertura</Button><Button variant="secondary" onClick={()=>setModal(null)}>Cancelar</Button></Modal>)}; return <><Header title="Levantamiento cerrado" back={back} badge={<Status status="Cerrado"/>}/><div className="screen-pad"><ContextCard state={state} count={count}/><Card className="closed-banner"><Icon name="check" size={50}/><div><strong>{resolved(state,count)} de {count.scopeArticleIds.length} artículos validados</strong><p>Cerrado por Carlos Mena · {fmtDate(count.closedAt,true)}</p></div></Card><h2>Resumen de conteo</h2><div className="stat-grid"><Card><Icon name="box"/><strong>{count.scopeArticleIds.length}</strong><span>artículos</span></Card><Card><Icon name="package"/><strong>{nf.format(totalUnits||1284)}</strong><span>unidades</span></Card><Card><Icon name="clock"/><strong>{exp||6}</strong><span>con vencimiento</span></Card></div><h2>Historial</h2><div className="timeline">{state.history.filter(h=>h.countId===countId).map(h=><div key={h.id}><span className="timeline-dot"><Icon name={h.type==='Cerrado'?'check':'send'}/></span><strong>{h.type}</strong><p>{state.users.find(u=>u.id===h.actorId)?.name} · {fmtDate(h.occurredAt,true)}{h.reason?` · ${h.reason}`:''}</p></div>)}</div>{state.role==='Supervisor'?<Button variant="warning" onClick={reopen}><Icon name="refresh"/>Reabrir levantamiento</Button>:<p className="muted-note">Solo un supervisor puede reabrir este levantamiento.</p>}</div></>; }

function Catalog({ state, go, update, setModal }: Pick<ScreenProps,'state'|'go'|'update'|'setModal'>) { const [query,setQuery]=useState('');const [filter,setFilter]=useState<'Activos'|'Todos'|'Inactivos'>('Activos');const list=state.articles.filter(a=>(filter==='Todos'||filter==='Activos'&&a.active||filter==='Inactivos'&&!a.active)&&(`${a.name} ${a.code} ${a.barcode ?? ''}`).toLowerCase().includes(query.toLowerCase()));const edit=(article?:Article)=>setModal(<ArticleForm state={state} article={article} close={()=>setModal(null)} update={update}/>);return <><Header title="Catálogo de artículos" back={()=>history.back()} badge={<span className="role-chip">{state.role}</span>}/><div className="screen-pad catalog"><label className="search-box"><Icon name="search"/><input aria-label="Buscar por nombre o código" placeholder="Buscar por nombre o código" value={query} onChange={e=>setQuery(e.target.value)}/></label><div className="catalog-tools"><select aria-label="Filtro de artículos" value={filter} onChange={e=>setFilter(e.target.value as typeof filter)}><option>Activos</option><option>Todos</option><option>Inactivos</option></select>{state.role==='Supervisor'&&<Button onClick={()=>edit()}><Icon name="plus"/>Nuevo artículo</Button>}</div>{list.length?list.map(a=><Card className="catalog-card" key={a.id}><button className="catalog-card-button" onClick={()=>state.role==='Supervisor'?edit(a):undefined}><div><h2>{a.name}</h2><p>{a.code}</p><Status status={a.active?'Activo':'Inactivo'}/></div>{state.role==='Supervisor'&&<Icon name="edit"/>}<hr/><dl><dt><Icon name="box"/>Presentación</dt><dd>{a.presentation==='Caja'?`Caja de ${a.unitsPerBox} unidades`:'Unidad'}</dd><dt><Icon name="package"/>Conversión</dt><dd>{a.presentation==='Caja'?`1 caja = ${a.unitsPerBox} unidades`:'1 unidad = 1 unidad'}</dd><dt><Icon name="calendar"/>Vencimiento</dt><dd><span className={a.appliesExpiry?'expiry-yes':'expiry-no'}>{a.appliesExpiry?'Aplica vence':'No aplica vence'}</span></dd></dl></button></Card>):<Card className="empty-card"><Icon name="search"/><p>Sin resultados para esta búsqueda.</p></Card>}</div></>; }
function ArticleForm({ state, article, close, update }: { state:AppState;article?:Article;close:()=>void;update:ScreenProps['update'] }) { const [name,setName]=useState(article?.name??'');const [code,setCode]=useState(article?.code??'');const [presentation,setPresentation]=useState<UnitType>(article?.presentation??'Caja');const [factor,setFactor]=useState(String(article?.unitsPerBox??24));const [expiry,setExpiry]=useState(article?.appliesExpiry??false);const [active,setActive]=useState(article?.active??true);const [error,setError]=useState('');const save=()=>{const normalized=code.trim().toUpperCase();const factorValue=Number(factor);if(!name.trim()||!normalized||!/^\d+$/.test(factor)||factorValue<1||factorValue>9999){setError('Completa los campos obligatorios con un factor válido.');return}if(state.articles.some(a=>a.id!==article?.id&&a.code.toUpperCase()===normalized)){setError('El código ya existe.');return}setError('');const next:Article={id:article?.id??id('article'),name:name.trim(),code:normalized,presentation,unitsPerBox:presentation==='Unidad'?1:factorValue,appliesExpiry:expiry,active};update(s=>({...s,articles:[...s.articles.filter(a=>a.id!==next.id),next]}) ,article?'Artículo actualizado':'Artículo creado');close()};return <Modal title={article?'Editar artículo':'Nuevo artículo'} onClose={close}><label>Nombre<input value={name} onChange={e=>setName(e.target.value)}/></label><label>Código<input value={code} onChange={e=>setCode(e.target.value.toUpperCase())}/></label><label>Presentación<select value={presentation} onChange={e=>setPresentation(e.target.value as UnitType)}><option>Caja</option><option>Unidad</option></select></label><label>Unidades por caja<input disabled={presentation==='Unidad'} inputMode="numeric" value={presentation==='Unidad'?'1':factor} onChange={e=>setFactor(e.target.value)}/></label><label className="check-row"><input type="checkbox" checked={expiry} onChange={e=>setExpiry(e.target.checked)}/>Aplica vencimiento</label><label className="check-row"><input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)}/>Activo</label>{error&&<p className="field-error">{error}</p>}<Button onClick={save}>Guardar artículo</Button><Button variant="secondary" onClick={close}>Cancelar</Button></Modal> }

function ClientsView({ state, go, back, update, setModal }: ScreenProps) { const [query,setQuery]=useState('');const [open,setOpen]=useState('client-ahorro');const clients=state.clients.filter(c=>c.name.toLowerCase().includes(query.toLowerCase()));const form=(client?:Client)=>setModal(<ClientForm state={state} client={client} close={()=>setModal(null)} update={update}/>);const warehouseForm=(clientId:string,warehouse?:Warehouse)=>setModal(<WarehouseForm state={state} clientId={clientId} warehouse={warehouse} close={()=>setModal(null)} update={update}/>);const manage=(client:Client)=>setModal(<Assignments client={client} state={state} close={()=>setModal(null)} update={update}/>);return <><Header title="Clientes y bodegas" back={back} badge={<span className="role-chip">{state.role}</span>}/><div className="screen-pad clients"><label className="search-box"><Icon name="search"/><input aria-label="Buscar cliente" placeholder="Buscar cliente" value={query} onChange={e=>setQuery(e.target.value)}/></label>{state.role==='Supervisor'&&<Button onClick={()=>form()}><Icon name="plus"/>Nuevo cliente</Button>}{clients.map(client=>{const isOpen=open===client.id;const wh=state.warehouses.filter(w=>w.clientId===client.id);const assigned=state.clientArticles.filter(a=>a.clientId===client.id&&a.active).length;return <Card className="client-card" key={client.id}><button className="client-head" onClick={()=>setOpen(isOpen?'':client.id)}><span className="client-icon"><Icon name="building"/></span><span><strong>{client.name}</strong><small>{isOpen?`${assigned} artículos activos asignados`:`${wh.length} bodegas · ${assigned} artículos activos`}</small></span><Status status={client.active?'Activo':'Inactivo'}/><Icon name="chevron"/></button>{isOpen&&<div className="client-detail"><div className="client-actions">{state.role==='Supervisor'&&<><button onClick={()=>form(client)}>Editar cliente</button><button onClick={()=>manage(client)}>Gestionar artículos</button></>}</div><h3>Bodegas</h3>{wh.map(w=><button className="warehouse-row" key={w.id} onClick={()=>state.role==='Supervisor'?warehouseForm(client.id,w):setModal(<Modal title={w.name} onClose={()=>setModal(null)}><p>{w.active?'Bodega activa':'Bodega inactiva'}</p><p>Último levantamiento: {fmtDate(w.lastCountAt)}</p><Button onClick={()=>setModal(null)}>Cerrar</Button></Modal>)}><Icon name="warehouse"/><span><strong>{w.name}</strong><small>{w.lastCountAt?`Último levantamiento: ${fmtDate(w.lastCountAt)}`:'Sin levantamientos'}</small></span><Status status={w.active?'Activa':'Inactiva'}/><Icon name="chevron"/></button>)}{state.role==='Supervisor'&&client.active&&<Button variant="secondary" onClick={()=>warehouseForm(client.id)}><Icon name="plus"/>Agregar bodega</Button>}</div>}</Card>})}</div></>; }
function ClientForm({ state,client,close,update}:{state:AppState;client?:Client;close:()=>void;update:ScreenProps['update']}){const [name,setName]=useState(client?.name??'');const [active,setActive]=useState(client?.active??true);const [error,setError]=useState('');return <Modal title={client?'Editar cliente':'Nuevo cliente'} onClose={close}><label>Nombre<input value={name} onChange={e=>setName(e.target.value)}/></label><label className="check-row"><input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)}/>Activo</label>{error&&<p className="field-error">{error}</p>}<Button onClick={()=>{const normalized=name.trim();if(!normalized){setError('El nombre es obligatorio.');return}if(state.clients.some(c=>c.id!==client?.id&&c.name.toLowerCase()===normalized.toLowerCase())){setError('Ya existe un cliente con este nombre.');return}setError('');const next={id:client?.id??id('client'),name:normalized,active};update(s=>({...s,clients:[...s.clients.filter(c=>c.id!==next.id),next]}) ,client?'Cliente actualizado':'Cliente creado');close()}}>Guardar cliente</Button><Button variant="secondary" onClick={close}>Cancelar</Button></Modal>}
function WarehouseForm({ state,clientId,warehouse,close,update}:{state:AppState;clientId:string;warehouse?:Warehouse;close:()=>void;update:ScreenProps['update']}){const [name,setName]=useState(warehouse?.name??'');const [active,setActive]=useState(warehouse?.active??true);const [error,setError]=useState('');return <Modal title={warehouse?'Editar bodega':'Agregar bodega'} onClose={close}><label>Nombre<input value={name} onChange={e=>setName(e.target.value)}/></label><label className="check-row"><input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)}/>Activa</label>{error&&<p className="field-error">{error}</p>}<Button onClick={()=>{const normalized=name.trim();if(!normalized){setError('El nombre es obligatorio.');return}if(state.warehouses.some(w=>w.clientId===clientId&&w.id!==warehouse?.id&&w.name.toLowerCase()===normalized.toLowerCase())){setError('Ya existe una bodega con este nombre.');return}setError('');const next={id:warehouse?.id??id('warehouse'),clientId,name:normalized,active,lastCountAt:warehouse?.lastCountAt};update(s=>({...s,warehouses:[...s.warehouses.filter(w=>w.id!==next.id),next]}) ,warehouse?'Bodega actualizada':'Bodega agregada');close()}}>Guardar bodega</Button><Button variant="secondary" onClick={close}>Cancelar</Button></Modal>}
function Assignments({client,state,close,update}:{client:Client;state:AppState;close:()=>void;update:ScreenProps['update']}){const [query,setQuery]=useState('');const assigned=new Set(state.clientArticles.filter(a=>a.clientId===client.id&&a.active).map(a=>a.articleId));const articles=state.articles.filter(a=>a.active&&a.name.toLowerCase().includes(query.toLowerCase()));const toggle=(articleId:string)=>update(s=>{const old=s.clientArticles.find(x=>x.clientId===client.id&&x.articleId===articleId);return {...s,clientArticles:old?s.clientArticles.map(x=>x===old?{...x,active:!x.active}:x):[...s.clientArticles,{clientId:client.id,articleId,active:true}]}});return <Modal title="Artículos asignados" onClose={close}><p>{client.name}</p><label className="search-box"><Icon name="search"/><input aria-label="Buscar artículo asignable" placeholder="Buscar artículo" value={query} onChange={e=>setQuery(e.target.value)}/></label><div className="assignment-list">{articles.slice(0,12).map(a=><label key={a.id} className="check-row"><input type="checkbox" checked={assigned.has(a.id)} onChange={()=>toggle(a.id)}/><span>{a.name}<small>{a.code}</small></span></label>)}</div><Button onClick={close}>Guardar asignaciones</Button></Modal>}

function Profile({ state,go,update,setModal,signOut }: Pick<ScreenProps,'state'|'go'|'update'|'setModal'> & { signOut: () => void }){const user=state.users.find(u=>u.role===state.role)!;const choose=()=>setModal(<Modal title="Cambiar modo de demostración" onClose={()=>setModal(null)}><p>Los roles son simulados y solo modifican acciones visibles.</p>{(['Contador','Supervisor'] as Role[]).map(role=><Button key={role} variant={role===state.role?'primary':'secondary'} onClick={()=>{update(s=>({...s,role}),`Modo ${role} activado`);setModal(null)}}>{role}</Button>)}</Modal>);const reset=()=>setModal(<Modal title="Restablecer datos" onClose={()=>setModal(null)}><p>Esta acción solo restablece datos locales de pantallas fuera del flujo conectado.</p><Button variant="danger" onClick={()=>{update(()=>resetState(),'Datos locales restablecidos');setModal(null)}}>Restablecer datos locales</Button><Button variant="secondary" onClick={()=>setModal(null)}>Cancelar</Button></Modal>);const advance=(hours:number)=>update(s=>({...s,demoNow:new Date(new Date(s.demoNow).getTime()+hours*3600000).toISOString()}),`Reloj avanzado ${hours} h`);return <><Header title="Perfil"/><div className="screen-pad profile"><Card className="profile-card"><span className="profile-avatar">{user.avatar}</span><div><h2>{user.name}</h2><p>{state.role} · Supabase</p></div><button className="mini-edit" aria-label="Cambiar rol" onClick={choose}><Icon name="edit"/></button></Card><Button variant="secondary" onClick={signOut}><Icon name="lock"/>Cerrar sesión</Button><Card><h2>Reloj de demostración</h2><strong className="demo-clock">{fmtDate(state.demoNow,true)}</strong><div className="clock-actions"><Button variant="secondary" onClick={()=>advance(7)}>Avanzar 7 h</Button><Button variant="secondary" onClick={()=>advance(19)}>Avanzar 19 h</Button><Button variant="plain" onClick={()=>update(s=>({...s,demoNow:new Date().toISOString()}),'Reloj restaurado')}>Restaurar reloj</Button></div></Card>{state.role==='Supervisor'&&<Button variant="secondary" onClick={()=>go('/clientes')}><Icon name="building"/>Clientes y bodegas</Button>}<Card><h2>Códigos de prueba</h2><p>Abre o imprime el PDF con los 15 códigos Code 128 usados por la cámara.</p><a className="button button--secondary button-link" href="/codigos_de_barras_code128.pdf" target="_blank" rel="noreferrer"><Icon name="scan"/>Abrir PDF Code 128</a></Card><Card><h2>Datos</h2><p>El flujo principal consulta y guarda datos en Supabase; las pantallas fuera del alcance conservan comportamiento de prototipo.</p><Button variant="danger" onClick={reset}><Icon name="refresh"/>Restablecer datos locales</Button></Card></div></>;}
function RoleModal({state,close,go}:{state:AppState;close:()=>void;go:(p:string)=>void}){return <Modal title="Modo de demostración" onClose={close}><p>Selecciona Perfil para cambiar entre Contador y Supervisor.</p><Button onClick={()=>{close();go('/perfil')}}>Abrir Perfil</Button></Modal>}

createRoot(document.getElementById('root')!).render(<App />);
