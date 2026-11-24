const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export const Icon = {
  body: () => (
    <svg viewBox="0 0 24 24" {...s}><path d="M10 3v6c-3 .5-5 3-4.5 6 .6 3.6 3.4 6 6.5 6s5.9-2.4 6.5-6c.5-3-1.5-5.5-4.5-6V3" /><circle cx="12" cy="15" r="1.6" /></svg>
  ),
  top: () => (
    <svg viewBox="0 0 24 24" {...s}><path d="M4 7c4-3 12-3 16 0M4 12c4-3 12-3 16 0M4 17c4-3 12-3 16 0" /></svg>
  ),
  neck: () => (
    <svg viewBox="0 0 24 24" {...s}><rect x="9" y="3" width="6" height="18" rx="1" /><path d="M9 8h6M9 12h6M9 15.5h6M9 18.5h6" /></svg>
  ),
  head: () => (
    <svg viewBox="0 0 24 24" {...s}><path d="M10 21v-8l-2-8c0-1.5 1-2 2-2h4c1 0 2 .5 2 2l-2 8v8" /><circle cx="7" cy="7" r="1" /><circle cx="17" cy="7" r="1" /><circle cx="7" cy="11" r="1" /><circle cx="17" cy="11" r="1" /></svg>
  ),
  inlay: () => (
    <svg viewBox="0 0 24 24" {...s}><rect x="7" y="2" width="10" height="20" rx="1" /><circle cx="12" cy="7" r="1.3" /><path d="M10 12l2-1.6 2 1.6-2 1.6z" /><circle cx="10.5" cy="17" r="1" /><circle cx="13.5" cy="17" r="1" /></svg>
  ),
  pickup: () => (
    <svg viewBox="0 0 24 24" {...s}><rect x="3" y="7" width="18" height="10" rx="2" /><path d="M3 12h18" /><circle cx="7" cy="9.5" r=".6" /><circle cx="12" cy="9.5" r=".6" /><circle cx="17" cy="9.5" r=".6" /></svg>
  ),
  hardware: () => (
    <svg viewBox="0 0 24 24" {...s}><rect x="4" y="9" width="16" height="7" rx="1.5" /><path d="M7 9V6M10 9V6M14 9V6M17 9V6" /><circle cx="12" cy="20" r="1.5" /></svg>
  ),
  finish: () => (
    <svg viewBox="0 0 24 24" {...s}><path d="M5 19c3 0 4-2 4-4l7-9a2 2 0 013 3l-9 7c-2 0-4 1-4 4" /><path d="M14 8l2 2" /></svg>
  ),
  graphics: () => (
    <svg viewBox="0 0 24 24" {...s}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M3 17l5-4 4 3 3-2 6 4" /></svg>
  ),
  info: () => (
    <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></svg>
  ),
  undo: () => (
    <svg viewBox="0 0 24 24" {...s}><path d="M9 14L4 9l5-5" /><path d="M4 9h10a6 6 0 010 12h-3" /></svg>
  ),
  redo: () => (
    <svg viewBox="0 0 24 24" {...s}><path d="M15 14l5-5-5-5" /><path d="M20 9H10a6 6 0 000 12h3" /></svg>
  ),
  camera: () => (
    <svg viewBox="0 0 24 24" {...s}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
  ),
  share: () => (
    <svg viewBox="0 0 24 24" {...s}><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.3 10.8l7.4-3.6M8.3 13.2l7.4 3.6" /></svg>
  ),
  folder: () => (
    <svg viewBox="0 0 24 24" {...s}><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
  ),
  save: () => (
    <svg viewBox="0 0 24 24" {...s}><path d="M5 4h11l3 3v13H5z" /><path d="M8 4v5h7V4M8 20v-6h8v6" /></svg>
  ),
  plus: () => (
    <svg viewBox="0 0 24 24" {...s}><path d="M12 5v14M5 12h14" /></svg>
  ),
  edit: () => (
    <svg viewBox="0 0 24 24" {...s}><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13 7l4 4" /></svg>
  ),
  dice: () => (
    <svg viewBox="0 0 24 24" {...s}><rect x="4" y="4" width="16" height="16" rx="3" /><circle cx="9" cy="9" r="1" /><circle cx="15" cy="15" r="1" /><circle cx="15" cy="9" r="1" /><circle cx="9" cy="15" r="1" /></svg>
  ),
  list: () => (
    <svg viewBox="0 0 24 24" {...s}><path d="M9 6h11M9 12h11M9 18h11M4 6h.5M4 12h.5M4 18h.5" /></svg>
  ),
  ruler: () => (
    <svg viewBox="0 0 24 24" {...s}><path d="M3 17L17 3l4 4L7 21z" /><path d="M7 13l2 2M10 10l2 2M13 7l2 2" /></svg>
  ),
  rotate: () => (
    <svg viewBox="0 0 24 24" {...s}><path d="M20 12a8 8 0 11-3-6.3" /><path d="M20 4v5h-5" /></svg>
  ),
  chevron: () => (
    <svg viewBox="0 0 24 24" {...s}><path d="M9 6l6 6-6 6" /></svg>
  ),
  trash: () => (
    <svg viewBox="0 0 24 24" {...s}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>
  ),
  copy: () => (
    <svg viewBox="0 0 24 24" {...s}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3" /></svg>
  ),
  eye: () => (
    <svg viewBox="0 0 24 24" {...s}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
  ),
}
