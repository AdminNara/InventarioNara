import { type ButtonHTMLAttributes, type ReactNode } from 'react';

export type IconName = 'clipboard' | 'box' | 'user' | 'plus' | 'check' | 'clock' | 'search' | 'scan' | 'back' | 'calendar' | 'building' | 'warehouse' | 'edit' | 'alert' | 'eye' | 'send' | 'close' | 'filter' | 'lock' | 'refresh' | 'trash' | 'chevron' | 'package';

export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    clipboard: <><rect x="6" y="5" width="12" height="15" rx="2"/><path d="M9 5V3h6v2M9 10h6M9 14h6"/></>,
    box: <><path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z"/><path d="M4 7.5V16l8 5 8-5V7.5M12 12v9"/></>,
    package: <><path d="m3 7 9-4 9 4-9 5-9-5Z"/><path d="M3 7v10l9 4 9-4V7M12 12v9"/></>,
    user: <><circle cx="12" cy="8" r="3.5"/><path d="M4.5 21c.8-4.1 3.3-6.2 7.5-6.2s6.7 2.1 7.5 6.2"/></>,
    plus: <path d="M12 5v14M5 12h14"/>, check: <path d="m5 12 4.2 4.2L19.5 6"/>,
    clock: <><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3.5 2"/></>,
    search: <><circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 5 5"/></>,
    scan: <><path d="M5 8V5h3M16 5h3v3M19 16v3h-3M8 19H5v-3M8 9v6M11 8v8M14 9v6M17 8v8"/></>,
    back: <path d="m14 5-7 7 7 7M7 12h12"/>, calendar: <><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/></>,
    building: <><path d="M4 21V5l8-3 8 3v16M8 21v-4h8v4M8 8h1M15 8h1M8 12h1M15 12h1"/></>, warehouse: <><path d="m3 10 9-6 9 6v10H3V10Z"/><path d="M8 20v-6h8v6M7 10h10"/></>,
    edit: <><path d="m4 20 4.3-1 10-10-3.3-3.3-10 10L4 20Z"/><path d="m13.5 6.5 3.3 3.3"/></>,
    alert: <><path d="M12 3 2.7 20h18.6L12 3Z"/><path d="M12 9v5M12 17h.01"/></>, eye: <><path d="M2.5 12s3.3-5.5 9.5-5.5S21.5 12 21.5 12 18.2 17.5 12 17.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.5"/></>,
    send: <><path d="m21 3-8 18-3.5-7.5L3 10l18-7Z"/><path d="m9.5 13.5 4-4"/></>, close: <path d="m6 6 12 12M18 6 6 18"/>,
    filter: <><path d="M4 6h16M7 12h10M10 18h4"/></>, lock: <><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    refresh: <><path d="M20 11a8 8 0 0 0-14.5-3L4 10M4 5v5h5M4 13a8 8 0 0 0 14.5 3L20 14M20 19v-5h-5"/></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5"/></>, chevron: <path d="m9 18 6-6-6-6"/>,
  };
  return <svg className="icon" style={{ width: size, height: size }} viewBox="0 0 24 24" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}

export function Button({ children, variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'plain' | 'warning' | 'danger' }) {
  return <button className={`button button--${variant} ${className}`} {...props}>{children}</button>;
}
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) { return <section className={`card ${className}`}>{children}</section>; }
export function Header({ title, back, badge, right }: { title: string; back?: () => void; badge?: ReactNode; right?: ReactNode }) { return <header className="header">{back ? <button className="icon-button" aria-label="Volver" onClick={back}><Icon name="back" size={30}/></button> : <span className="header-spacer" />}<h1>{title}</h1>{right ?? badge ?? <span className="header-spacer" />}</header>; }
export function BottomNav({ path, navigate }: { path: string; navigate: (path: string) => void }) {
  const is = (target: string) => path === target || (target === '/levantamientos' && path.startsWith('/levantamientos'));
  const items = [{ path: '/levantamientos', label: 'Levantamientos', icon: 'clipboard' as IconName }, { path: '/catalogo', label: 'Catálogo', icon: 'box' as IconName }, { path: '/perfil', label: 'Perfil', icon: 'user' as IconName }];
  return <nav className="bottom-nav" aria-label="Navegación principal">{items.map((item) => <button key={item.path} className={is(item.path) ? 'nav-item is-active' : 'nav-item'} onClick={() => navigate(item.path)} aria-current={is(item.path) ? 'page' : undefined}><Icon name={item.icon} size={28}/><span>{item.label}</span></button>)}</nav>;
}
export function Toast({ children }: { children: ReactNode }) { return <div className="toast" role="status"><Icon name="check"/>{children}</div>; }
export function Modal({ title, children, onClose, className = '' }: { title: string; children: ReactNode; onClose: () => void; className?: string }) { return <div className="modal-backdrop" role="presentation"><section className={`modal ${className}`} role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><h2 id="modal-title">{title}</h2><button className="icon-button" aria-label="Cerrar" onClick={onClose}><Icon name="close"/></button></div>{children}</section></div>; }
