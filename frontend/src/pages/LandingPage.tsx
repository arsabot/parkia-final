// Landing de Parkia: hero 3D, datos, cómo funciona, accesibilidad, pagos, dueños de garajes y footer.
// Las animaciones arrancan cuando cada bloque entra en pantalla (IntersectionObserver).
// En escritorio los bloques se encadenan en secuencia; en celular aparece cada uno al deslizar.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useTheme } from '../context/ThemeContext';
import { BookingModal } from '../components/reservations/BookingModal';
import { ThemeSwitch } from '../components/common/ThemeSwitch';
import { parkingService } from '../services/parkingService';
import type { Parking } from '../types';
import { CheckoutDemo } from './landing/CheckoutDemo';
import { PAY_LOGOS } from './landing/payLogos';
import logoIcon from '../assets/landing/parkia-icono.png';
import './landing/landing.css';

const N_REVEAL = 24;
const MOBILE_MAX = 760;
const PHRASES = ['¿A dónde vas?', 'Av. Corrientes 1200', 'Obelisco', 'Palermo Soho', 'Estadio Monumental', 'Aeroparque'];

const STEPS_DATA: Array<[string, string, string]> = [
  ['1', 'Buscá', 'Poné tu destino y te mostramos los estacionamientos cerca, con geolocalización.'],
  ['2', 'Compará', 'Mirá precio, distancia y lugares disponibles en tiempo real.'],
  ['3', 'Reservá', 'Confirmás al instante y llegás con tu lugar asegurado.'],
];

type Logo = { src: string; alt: string; h: number };
const PAY_GROUPS: Array<{ kind: string; desc: string; type: 'wallet' | 'card' | 'cash'; logos: Logo[] }> = [
  { kind: 'Billeteras virtuales', desc: 'Pagás desde la app al confirmar', type: 'wallet', logos: [{ src: PAY_LOGOS.mp, alt: 'Mercado Pago', h: 46 }, { src: PAY_LOGOS.modo, alt: 'MODO', h: 30 }, { src: PAY_LOGOS.uala, alt: 'Ualá', h: 34 }] },
  { kind: 'Débito y crédito', desc: 'Cargás tu tarjeta una sola vez', type: 'card', logos: [{ src: PAY_LOGOS.visa, alt: 'Visa', h: 44 }, { src: PAY_LOGOS.mc, alt: 'Mastercard', h: 70 }] },
  { kind: 'Efectivo', desc: 'Pagás con un código en sucursal', type: 'cash', logos: [{ src: PAY_LOGOS.rapi, alt: 'Rapipago', h: 36 }, { src: PAY_LOGOS.pf, alt: 'Pago Fácil', h: 78 }] },
];

function createReveal(n: number) {
  const reg = {
    els: [] as Array<HTMLElement | null>,
    io: null as IntersectionObserver | null,
    set: [] as Array<(el: HTMLElement | null) => void>,
    attach(io: IntersectionObserver | null) {
      reg.io = io;
      if (io) reg.els.forEach((el) => el && io.observe(el));
    },
  };
  reg.set = Array.from({ length: n }, (_, i) => (el: HTMLElement | null) => {
    reg.els[i] = el;
    if (el && reg.io) reg.io.observe(el);
  });
  return reg;
}

const FALLBACK_PARKINGS: Parking[] = [
  {
    id: 1,
    name: 'Estacionamiento Soho Plaza',
    address: 'Honduras 4850, Palermo Soho',
    city: 'Buenos Aires',
    latitude: -34.5885,
    longitude: -58.4283,
    description: 'Ubicado en el epicentro gastronómico y de diseño de Palermo Soho. Fácil acceso, garita de seguridad, cámaras HD y cargadores rápidos.',
    phone: '+54 11 4833-1122',
    price_per_hour: 2100,
    price_per_day: 16000,
    opening_time: '07:00:00',
    closing_time: '02:00:00',
    is_24_hours: false,
    capacity: 28,
    rating: 4.8,
    reviews_count: 94,
    is_active: true,
    is_covered: true,
    has_security: true,
    has_ev_charging: true,
    has_disabled_access: true,
    has_car_wash: false,
    has_valet: false,
    image_url: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80',
    available_spaces: 9,
    total_spaces: 28,
    occupancy_rate: 68,
    is_favorite: false,
  },
  {
    id: 2,
    name: 'Garage Plaza San Martín & Retiro',
    address: 'Florida 980, Retiro',
    city: 'Buenos Aires',
    latitude: -34.5960,
    longitude: -58.3755,
    description: 'Ideal para personas de negocios y turistas. Conexión rápida con estación Retiro y Plaza San Martín. Plazas techadas y monitoreo permanente.',
    phone: '+54 11 4311-6677',
    price_per_hour: 1800,
    price_per_day: 14000,
    opening_time: '06:30:00',
    closing_time: '23:30:00',
    is_24_hours: false,
    capacity: 30,
    rating: 4.7,
    reviews_count: 82,
    is_active: true,
    is_covered: true,
    has_security: true,
    has_ev_charging: false,
    has_disabled_access: true,
    has_car_wash: true,
    has_valet: false,
    image_url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=80',
    available_spaces: 5,
    total_spaces: 30,
    occupancy_rate: 83,
    is_favorite: false,
  },
  {
    id: 3,
    name: 'Parkia Puerto Madero Dock 4',
    address: 'Juana Manso 850, Puerto Madero',
    city: 'Buenos Aires',
    latitude: -34.6055,
    longitude: -58.3628,
    description: 'Estacionamiento moderno de alta categoría con acceso automatizado por matrícula. A pasos de los mejores restaurantes y torres corporativas.',
    phone: '+54 11 4515-3344',
    price_per_hour: 3200,
    price_per_day: 24000,
    opening_time: '00:00:00',
    closing_time: '23:59:59',
    is_24_hours: true,
    capacity: 40,
    rating: 4.9,
    reviews_count: 160,
    is_active: true,
    is_covered: true,
    has_security: true,
    has_ev_charging: true,
    has_disabled_access: true,
    has_car_wash: true,
    has_valet: true,
    image_url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop&q=80',
    available_spaces: 14,
    total_spaces: 40,
    occupancy_rate: 65,
    is_favorite: false,
  },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  // Garajes destacados y reserva rápida: respaldado con fallback para carga instantánea o sin backend
  const [featuredParkings, setFeaturedParkings] = useState<Parking[]>(FALLBACK_PARKINGS);
  const [selectedBookingParking, setSelectedBookingParking] = useState<Parking | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [garIdx, setGarIdx] = useState(0);
  const dragX = useRef<number | null>(null);
  const { isAuthenticated, isSuperAdmin, isOwner } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const light = theme === 'light';

  // ---- estado
  const [rv, setRv] = useState<boolean[]>(() => Array(N_REVEAL).fill(false));
  const [mob, setMob] = useState(false);
  const [menu, setMenu] = useState(false);
  const [step, setStep] = useState(0);
  const [hoverStep, setHoverStep] = useState(false);
  const [own, setOwn] = useState(-1);
  const [typed, setTyped] = useState('');
  const [sFocus, setSFocus] = useState(false);
  const [sVal, setSVal] = useState('');
  const [accOn, setAccOn] = useState(false);

  // ---- refs (valores que leen timers y la escena 3D sin re-render)
  // Registro de los bloques que aparecen al hacer scroll (se crea una sola vez).
  const [reveal] = useState(() => createReveal(N_REVEAL));
  const flags = useRef({ seq: false, ownSeq: false, cnt: false, litS: [false, false, false], litO: [false, false, false] });
  const hoverStepRef = useRef(false);
  const ownHover = useRef(false);
  const typingPaused = useRef(false);
  const accUntil = useRef(0);
  const accTimer = useRef<number | undefined>(undefined);
  const timers = useRef<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chipRef = useRef<HTMLDivElement | null>(null);
  const chipCodeRef = useRef<HTMLDivElement | null>(null);
  const counterRefs = useRef<(HTMLElement | null)[]>([]);
  const ringRef = useRef<SVGCircleElement | null>(null);
  const minHandRef = useRef<SVGGElement | null>(null);
  const hourHandRef = useRef<SVGGElement | null>(null);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const counterRaf = useRef(0);

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>('.pk-root .pk-motion-section');
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('pk-motion-paused', !entry.isIntersecting));
    }, { rootMargin: '100px 0px' });
    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    hoverStepRef.current = hoverStep;
    typingPaused.current = sFocus || sVal.length > 0;
  }, [hoverStep, sFocus, sVal]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  // ---- tema (oscuro por defecto)
  useEffect(() => {
    // El asistente (ChatWidget) vive fuera de la landing: se le avisa el tema por una clase en <html>.
    document.documentElement.classList.toggle('pk-landing-light', light);
    return () => document.documentElement.classList.remove('pk-landing-light');
  }, [light]);

  // ---- las páginas "encastran" al scrollear (solo en la landing, se limpia al salir)
  useEffect(() => {
    document.documentElement.classList.add('pk-snapping');
    return () => document.documentElement.classList.remove('pk-snapping');
  }, []);

  // ---- celular o escritorio
  useEffect(() => {
    const onResize = () => setMob(window.innerWidth < MOBILE_MAX);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ---- aparición al hacer scroll
  useEffect(() => {
    const mark = (i: number) => setRv((prev) => (prev[i] ? prev : prev.map((x, k) => (k === i ? true : x))));
    if (!('IntersectionObserver' in window)) {
      setRv(Array(N_REVEAL).fill(true));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const i = reveal.els.indexOf(e.target as HTMLElement);
          if (i >= 0) {
            mark(i);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.2 },
    );
    reveal.attach(io);
    return () => {
      io.disconnect();
      reveal.attach(null);
    };
  }, [reveal]);

  // ---- secuencias: las tarjetas se prenden de a una y el contador arranca al verse
  useEffect(() => {
    const f = flags.current;
    if (mob) {
      [0, 1, 2].forEach((k) => {
        if (rv[14 + k] && !f.litS[k]) {
          f.litS[k] = true;
          later(() => { if (!hoverStepRef.current) setStep(k); }, k * 200);
        }
        if (rv[17 + k] && !f.litO[k]) {
          f.litO[k] = true;
          later(() => { if (!ownHover.current) setOwn(k); }, k * 200);
        }
      });
    } else {
      if (rv[1] && !f.seq) {
        f.seq = true;
        [0, 1, 2].forEach((i) => later(() => { if (!hoverStepRef.current) setStep(i); }, (0.2 + i * 1.2) * 1000));
      }
      if (rv[10] && !f.ownSeq) {
        f.ownSeq = true;
        [0, 1, 2].forEach((k) => later(() => { if (!ownHover.current) setOwn(k); }, (0.35 + k * 1.2) * 1000));
      }
    }
    if (rv[8] && !f.cnt) {
      f.cnt = true;
      later(() => {
        const t0 = performance.now();
        const run = () => {
          const t = Math.min(1, (performance.now() - t0) / 3000);
          const value = 1 - Math.pow(1 - t, 2);
          counterRefs.current.forEach((node, i) => { if (node) node.textContent = String(Math.round((i === 2 ? 40 : 30) * value)); });
          ringRef.current?.setAttribute('stroke-dasharray', `${(201 * value).toFixed(1)} 201`);
          minHandRef.current?.setAttribute('transform', `rotate(${(value * 180).toFixed(1)} 40 40)`);
          hourHandRef.current?.setAttribute('transform', `rotate(${(value * 15).toFixed(1)} 40 40)`);
          barRefs.current.forEach((node, i) => { if (node) node.style.width = `${Math.round((i === 1 ? 40 : 30) * value)}%`; });
          if (t < 1) counterRaf.current = requestAnimationFrame(run);
        };
        counterRaf.current = requestAnimationFrame(run);
      }, 350);
    }
  }, [rv, mob, later]);

  // ---- garajes destacados (los 3 primeros activos que devuelve la API o fallback)
  useEffect(() => {
    let cancelled = false;
    const loadFeatured = async () => {
      try {
        const list = await parkingService.getParkings();
        if (!cancelled && list && list.length > 0) {
          setFeaturedParkings(list.slice(0, 3));
        }
      } catch (err) {
        console.error('Error loading featured parkings', err);
      }
    };
    loadFeatured();
    return () => { cancelled = true; };
  }, []);

  // ---- "Usar mi ubicación": igual que en la landing anterior
  const handleUseLocation = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          navigate(`/search?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&located=true`);
        },
        () => {
          setIsLocating(false);
          // Si no se da permiso, se busca desde el centro.
          navigate(`/search?lat=-34.6037&lng=-58.3816`);
        },
      );
    } else {
      navigate('/search');
    }
  };

  // ---- buscador que "escribe" solo
  useEffect(() => {
    let pi = 0;
    let ci = 0;
    let del = false;
    let to = 0;
    const tick = () => {
      const ph = PHRASES[pi];
      let wait = del ? 35 : 75;
      if (!del) {
        ci += 1;
        if (ci >= ph.length) { ci = ph.length; del = true; wait = 1500; }
      } else {
        ci -= 1;
        if (ci <= 0) { ci = 0; del = false; pi = (pi + 1) % PHRASES.length; wait = 350; }
      }
      if (!typingPaused.current) setTyped(ph.slice(0, ci));
      to = window.setTimeout(tick, wait);
    };
    to = window.setTimeout(tick, 900);
    return () => window.clearTimeout(to);
  }, []);

  // ---- escena 3D
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    // three.js se carga aparte (solo en la landing) para no hacer más pesadas las demás páginas.
    let dispose: (() => void) | undefined;
    let cancelled = false;
    import('./landing/parkingScene')
      .then(({ createParkingScene }) => {
        if (cancelled) return;
        dispose = createParkingScene(cv, {
          getChip: () => chipRef.current,
          getChipCode: () => chipCodeRef.current,
          getAccUntil: () => accUntil.current,
        });
      })
      .catch((err) => console.error('No se pudo iniciar la escena 3D', err));
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  // ---- limpiar timers
  useEffect(() => () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    window.clearTimeout(accTimer.current);
    cancelAnimationFrame(counterRaf.current);
  }, []);

  // ---- valores para el render
  const f2 = (x: number) => x.toFixed(2) + 's';
  const seq = (g: number, idx: number, T: number) => {
    const vis = mob ? rv[idx] : rv[g];
    const b = mob ? 0.05 : T;
    return {
      o: vis ? 1 : 0,
      t: vis ? 'translateY(0)' : 'translateY(40px)',
      it: vis ? 'translateY(0)' : 'translateY(14px)',
      d: f2(b), d1: f2(b + 0.1), d2: f2(b + 0.3), d3: f2(b + 0.5), ld: f2(b + 0.15),
      dl: f2(mob ? b + 0.5 : T + 0.7),
      lap: vis ? 'lap' : '',
      dash: vis ? 0 : 100,
    };
  };
  const rvOf = (i: number, hidden?: string) => (rv[i] ? { o: 1, t: 'translate(0, 0) scale(1)' } : { o: 0, t: hidden ?? 'translateY(48px)' });

  const steps = STEPS_DATA.map((d, i) => {
    const on = i === step;
    const q = seq(1, 14 + i, 0.2 + i * 1.2);
    return {
      n: d[0], title: d[1], text: d[2],
      cls: (on ? 'on ' : '') + (mob ? (rv[14 + i] ? 'lap' : '') : rv[1] ? 'lap' : ''),
      pressed: on,
      ro: q.o, rt: q.t, it: q.it, delay: q.d, d1: q.d1, d2: q.d2, d3: q.d3, dl: q.dl, dash: q.dash,
      link: i < 2,
      flex: i < 2 ? '1 1 72px' : '1 1 0px',
      i0: i === 0, i1: i === 1, i2: i === 2,
      numColor: on ? 'var(--acc,#A3E635)' : 'rgba(var(--acc-rgb,163,230,53),0.3)',
      glow: on ? '0 0 26px rgba(var(--acc-rgb,163,230,53),.55)' : 'none',
      iconBg: on ? 'var(--acc,#A3E635)' : 'rgba(var(--fg-rgb,255,255,255),0.05)',
      iconGlow: on ? '0 0 30px rgba(var(--acc-rgb,163,230,53),.55)' : 'none',
      iconColor: on ? '#05080F' : 'var(--acc,#A3E635)',
      pick: () => {
        setStep(i);
        setHoverStep(true);
      },
    };
  });

  const belt = [...PAY_GROUPS, ...PAY_GROUPS, ...PAY_GROUPS, ...PAY_GROUPS].map((g) => ({
    kind: g.kind,
    desc: g.desc,
    gap: g.type === 'cash' ? '0px' : '10px',
    logos: g.logos.map((l) => ({ ...l, bg: 'transparent', fx: g.type === 'cash' ? '0 1 auto' : '1 1 0' })),
    wallet: g.type === 'wallet',
    card: g.type === 'card',
    cash: g.type === 'cash',
    iconColor: g.type === 'cash' ? '#FDE68A' : 'var(--acc2,#D9F99D)',
    iconBg: 'rgba(var(--fg-rgb,255,255,255),0.05)',
  }));

  const goGar = (i: number) => setGarIdx(i);
  const stepGar = (k: number) => setGarIdx((c) => { const n = featuredParkings.length || 1; return (c + k + n) % n; });
  const money = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
  const garages = featuredParkings.map((p, i) => {
    const q = seq(20, 21 + i, 0.15 + i * 0.35);
    // Igual que el chat: lugares libres sobre plazas cargadas (total_spaces).
    const total = p.total_spaces || p.capacity;
    const pct = total ? p.available_spaces / total : 0;
    const full = p.available_spaces === 0;
    const color = full ? '#F43F5E' : p.available_spaces <= 3 ? '#F59E0B' : 'var(--acc,#A3E635)';
    const tags = [
      p.is_covered && 'Techado',
      p.has_security && 'Seguridad',
      p.has_ev_charging && 'Carga eléctrica',
      p.has_car_wash && 'Lavado',
      p.has_valet && 'Valet',
    ].filter(Boolean) as string[];
    return {
      p, q, color, tags, full,
      freeText: full ? 'Completo ahora' : p.available_spaces <= 3 ? `¡Últimos ${p.available_spaces}!` : `${p.available_spaces} de ${total} libres`,
      freeW: Math.max(4, Math.round(pct * 100)) + '%',
      fav: isFavorite(p.id),
    };
  });

  const pickOwn = (k: number) => () => {
    ownHover.current = true;
    setOwn(k);
  };
  const closeMenu = () => setMenu(false);

  const destination = isSuperAdmin ? '/admin' : isOwner ? '/admin/gate' : '/my-reservations';
  const destLabel = isSuperAdmin ? 'Panel Admin' : isOwner ? 'Control Garita' : 'Mis reservas';

  const authLinks = isAuthenticated ? (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
      <Link to={destination} className="pk-ing" onClick={closeMenu} style={{ padding: "8px 16px", fontSize: "13px" }}>
        {destLabel}
      </Link>
      <Link to="/search" className="pk-reg" onClick={closeMenu} style={{ padding: "8px 16px", fontSize: "13px" }}>
        Buscar lugar
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </Link>
    </div>
  ) : (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
      <Link to="/login" className="pk-ing" onClick={closeMenu} style={{ padding: "8px 16px", fontSize: "13px" }}>Ingresar</Link>
      <Link to="/register" className="pk-reg" onClick={closeMenu} style={{ padding: "8px 16px", fontSize: "13px" }}>
        Registrate
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </Link>
    </div>
  );

  // Manejadores que tocan refs: quedan fuera de "v" (solo se usan en eventos).
  const setCanvas = useCallback((el: HTMLCanvasElement | null) => { canvasRef.current = el; }, []);
  const setChip = useCallback((el: HTMLDivElement | null) => { chipRef.current = el; }, []);
  const setChipCode = useCallback((el: HTMLDivElement | null) => { chipCodeRef.current = el; }, []);
  const showAcc = (e: React.MouseEvent) => {
    e.stopPropagation();
    accUntil.current = performance.now() + 7000;
    canvasRef.current?.dispatchEvent(new Event('pk-scene-invalidate'));
    setAccOn(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.clearTimeout(accTimer.current);
    accTimer.current = window.setTimeout(() => setAccOn(false), 7000);
  };
  const pickOwn0 = pickOwn(0);
  const pickOwn1 = pickOwn(1);
  const pickOwn2 = pickOwn(2);

  const v = {
    authLinks,
    closeMenu,
    belt,
    rv0: rvOf(0), rv1: rvOf(1), rv2: rvOf(2), rv3: rvOf(3),
    rv4: rvOf(4, 'translateX(-120px)'), rv5: rvOf(5, 'translateY(60px) scale(.96)'), rv6: rvOf(6, 'translateX(120px)'), rv7: rvOf(7, 'translateY(70px) scale(.97)'),
    rv9: rvOf(9),
    sa0: seq(8, 11, 0.1), sa1: seq(8, 12, 0.4), sa2: seq(8, 13, 0.7),
    ow0: seq(10, 17, 0.2), ow1: seq(10, 18, 1.4), ow2: seq(10, 19, 2.6),
    ownCls0: own === 0 ? 'on' : '', ownCls1: own === 1 ? 'on' : '', ownCls2: own === 2 ? 'on' : '',
    c1: 0, c2: 0, c3: 0,
    ringDash: '0 201',
    minRot: 'rotate(0 40 40)',
    hrRot: 'rotate(0 40 40)',
    steps,
    stepsLeave: () => setHoverStep(false),
    typed,
    showTyping: !sFocus && !sVal,
    sVal,
    onSearchFocus: () => setSFocus(true),
    onSearchBlur: () => setSFocus(false),
    onSearchInput: (e: React.ChangeEvent<HTMLInputElement>) => setSVal(e.target.value),
    onSearch: (e: React.FormEvent) => {
      e.preventDefault();
      const q = sVal.trim();
      navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
    },
    themeCls: light ? 'pk-light' : '',
    isLight: light,
    toggleTheme,
    menuCls: menu ? 'open' : '',
    menuOpen: menu,
    toggleMenu: () => setMenu((x) => !x),
    accCls: (accOn ? 'on ' : '') + (rv[2] ? 'lap' : ''),
    accLabel: accOn ? 'Mostrando en el plano' : 'Ver lugares accesibles',
  };

  return (
    <div className={`pk-root ${v.themeCls}`} style={{ width: "100%", background: "var(--bg0,#05080F)", fontFamily: "'Albert Sans', sans-serif", color: "var(--tx,#FFFFFF)", overflow: "hidden" }}>

      <header className={v.isLight ? "pk-hdr" : "pk-dark pk-hdr"} style={{ position: "relative", zIndex: 5, borderBottom: "1px solid rgba(var(--fg-rgb,255,255,255),0.07)", background: v.isLight ? "rgba(255,255,255,0.96)" : "rgba(5,8,15,0.96)", backdropFilter: "blur(14px)" }}>
        <div style={{ position: "relative", maxWidth: "1280px", margin: "0 auto", padding: "16px 24px", display: "flex", flexWrap: "nowrap", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
          <Link to="/" aria-label="Parkia, inicio" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", color: "var(--tx,#FFFFFF)", flexShrink: 0 }}>
            <img src={logoIcon} alt="" style={{ width: "42px", height: "42px" }} />
            <span style={{ fontSize: "23px", fontWeight: 800, letterSpacing: "0.06em" }}>PARKIA</span>
          </Link>
          <button type="button" className="pk-burger" onClick={v.toggleMenu} aria-expanded={v.menuOpen} aria-label="Abrir menú"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg></button>
          <nav aria-label="Principal" className={`pk-nav ${v.menuCls}`} style={{ display: "flex", flexWrap: "nowrap", alignItems: "center", gap: "18px", fontSize: "14px", whiteSpace: "nowrap" }}>
            <Link to="/" aria-current="page" style={{ color: "var(--tx,#FFFFFF)", textDecoration: "none", fontWeight: 600 }}>Inicio</Link>
            <a href="#como-funciona" onClick={v.closeMenu} style={{ color: "var(--tx2,#9AA6BA)", textDecoration: "none" }}>Cómo funciona</a>
            <a href="#duenos" onClick={v.closeMenu} style={{ color: "var(--tx2,#9AA6BA)", textDecoration: "none" }}>Tengo un estacionamiento</a>
            <Link to="/nosotros" onClick={v.closeMenu} style={{ color: "var(--tx2,#9AA6BA)", textDecoration: "none" }}>Nosotros</Link>
            <Link to="/contacto" onClick={v.closeMenu} style={{ color: "var(--tx2,#9AA6BA)", textDecoration: "none" }}>Contacto</Link>
            <ThemeSwitch isDark={!v.isLight} onToggle={v.toggleTheme} />
            {v.authLinks}

          </nav>
        </div>
      </header>

      <section className="pk-dark pk-hero" style={{ position: "relative", height: "max(720px, 100svh)", minHeight: "720px", overflow: "hidden", background: "radial-gradient(1200px 600px at 50% 100%, rgba(var(--acc-rgb,163,230,53),0.10), rgba(5,8,15,0) 70%), #05080F" }}>
        <div aria-hidden="true" style={{ position: "absolute", inset: "0", backgroundImage: "linear-gradient(rgba(var(--fg-rgb,255,255,255),0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--fg-rgb,255,255,255),0.035) 1px, transparent 1px)", backgroundSize: "64px 64px", maskImage: "linear-gradient(to bottom, #000 0%, transparent 60%)", WebkitMaskImage: "linear-gradient(to bottom, #000 0%, transparent 60%)" }}></div>

        <div className="pk-herot" style={{ position: "relative", zIndex: 3, maxWidth: "960px", margin: "0 auto", padding: "40px 24px 0 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "22px" }}>
          <span className="pk-anim" style={{ display: "inline-flex", alignItems: "center", gap: "10px", border: "1px solid rgba(var(--acc-rgb,163,230,53),0.35)", background: "rgba(var(--acc-rgb,163,230,53),0.08)", color: "var(--acc2,#D9F99D)", fontSize: "14px", fontWeight: 600, padding: "7px 14px 7px 10px", borderRadius: "999px", animation: "pkRise 0.8s cubic-bezier(.2,.7,.2,1) both" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: "var(--acc,#A3E635)", boxShadow: "0 0 12px var(--acc,#A3E635)" }}></span>
            Plazas libres en tiempo real
          </span>
          <h1 className="pk-anim pk-h1" style={{ margin: "0", fontSize: "56px", fontWeight: 800, lineHeight: "1.02", letterSpacing: "-0.035em", animation: "pkRise 0.9s 0.08s cubic-bezier(.2,.7,.2,1) both" }}>Tu lugar ya te está <span style={{ color: "var(--acc,#A3E635)" }}>esperando</span></h1>
          <p className="pk-anim" style={{ margin: "0", maxWidth: "620px", fontSize: "19px", lineHeight: "1.55", color: "var(--tx2,#9AA6BA)", animation: "pkRise 0.9s 0.16s cubic-bezier(.2,.7,.2,1) both" }}>Buscá, compará y reservá estacionamiento antes de llegar, con confirmación al instante.</p>
          <form className="pk-anim pk-search" onSubmit={v.onSearch} style={{ width: "100%", maxWidth: "720px", marginTop: "8px", padding: "10px", display: "flex", flexWrap: "wrap", gap: "12px", boxSizing: "border-box", animation: "pkRise 0.9s 0.24s cubic-bezier(.2,.7,.2,1) both, pkSearchGlow 2.8s ease-in-out 1.2s infinite" }}>
            <label className="pk-slabel" htmlFor="destinoV5" style={{ flex: "1 1 280px", minWidth: "0", display: "flex", alignItems: "center", gap: "12px", padding: "4px 14px", cursor: "text", textAlign: "left" }}>
              <svg className="pk-anim" width="26" height="26" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ stroke: "var(--acc,#A3E635)", flexShrink: 0, animation: "pkPin 1.8s ease-in-out infinite" }}><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
              <span style={{ position: "relative", flex: "1", minWidth: "0", display: "flex", alignItems: "center" }}>
                <input id="destinoV5" value={v.sVal} autoComplete="off" type="text" aria-label="¿A dónde vas?" onFocus={v.onSearchFocus} onBlur={v.onSearchBlur} onChange={v.onSearchInput} style={{ width: "100%", border: "0", outline: "none", fontFamily: "inherit", fontSize: "19px", fontWeight: 500, padding: "14px 0", color: "var(--tx,#FFFFFF)", background: "transparent" }} />
                {v.showTyping && (<><span aria-hidden="true" style={{ position: "absolute", left: "0", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: "19px", fontWeight: 500, color: "var(--tx2,#C3CCDA)", whiteSpace: "nowrap", overflow: "hidden", maxWidth: "100%" }}>{v.typed}<span className="pk-anim" style={{ display: "inline-block", width: "2px", height: "22px", marginLeft: "3px", verticalAlign: "-4px", background: "var(--acc,#A3E635)", boxShadow: "0 0 8px var(--acc,#A3E635)", animation: "pkBlinkC 1s steps(1) infinite" }}></span></span></>)}
              </span>
              <button type="button" className="pk-geo" onClick={handleUseLocation} disabled={isLocating} title="Usar mi ubicación actual" aria-label="Usar mi ubicación actual">
                <svg className={isLocating ? 'pk-geo-spin' : undefined} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                <span className="pk-geo-txt">Cerca de mí</span>
              </button>
            </label>
            <button type="submit" className="pkc-cta" style={{ flex: "0 0 auto", background: "var(--acc,#A3E635)", color: "var(--on-acc,#05080F)", border: "0", borderRadius: "12px", padding: "17px 28px", fontFamily: "inherit", fontSize: "18px", fontWeight: 800, cursor: "pointer", boxShadow: "0 8px 30px rgba(var(--acc-rgb,163,230,53),0.45)" }}>Buscar estacionamiento</button>
          </form>
        </div>

        <div className="pk-scene" style={{ position: "absolute", left: "0", right: "0", top: "0", bottom: "0" }}>
          <div className="pk-scene-m" style={{ position: "absolute", inset: "0", WebkitMaskImage: "linear-gradient(to bottom, transparent 0, transparent 30%, rgba(0,0,0,.6) 42%, #000 50%, #000 94%, transparent 100%)", maskImage: "linear-gradient(to bottom, transparent 0, transparent 30%, rgba(0,0,0,.6) 42%, #000 50%, #000 94%, transparent 100%)" }}>
            <canvas ref={setCanvas} role="img" aria-label="Estacionamiento 3D: tu auto avanza dibujando una línea de luz hasta la plaza que elegiste, que se enciende en lima" style={{ display: "block", width: "100%", height: "100%", touchAction: "pan-y", cursor: "default" }}></canvas>
          </div>
          <div ref={setChip} aria-hidden="true" style={{ position: "absolute", left: "0", top: "0", pointerEvents: "none", willChange: "transform", opacity: 0 }}>
            <div className="pk-anim" style={{ display: "flex", flexDirection: "column", alignItems: "center", animation: "pkFloat 3s ease-in-out infinite" }}>
              <div style={{ background: "var(--acc,#A3E635)", color: "var(--on-acc,#05080F)", borderRadius: "12px", padding: "9px 16px", textAlign: "center", boxShadow: "0 12px 40px rgba(var(--acc-rgb,163,230,53),0.5)", whiteSpace: "nowrap" }}>
                <div style={{ fontSize: "14px", fontWeight: 700 }}>Tu lugar</div>
                <div ref={setChipCode} style={{ fontSize: "26px", fontWeight: 800, lineHeight: "1.1" }}>Plaza B07</div>
              </div>
              <div style={{ width: "3px", height: "36px", background: "linear-gradient(var(--acc,#A3E635), rgba(var(--acc-rgb,163,230,53),0))" }}></div>
            </div>
          </div>
        </div>
      </section>

      <div aria-hidden="true" style={{ position: "relative", marginTop: "-8px", perspective: "1000px", perspectiveOrigin: "50% 0%" }}>
        <div style={{ transformStyle: "preserve-3d", transform: "translateX(-8%) scaleX(1.2) rotateX(22deg)" }}>
          <div className="pk-anim pk-curb0" style={{ height: "54px", transformOrigin: "50% 100%", transform: "rotateX(70deg)", backgroundImage: "linear-gradient(to bottom, rgba(var(--fg-rgb,255,255,255),0.32), rgba(var(--fg-rgb,255,255,255),0.04)), linear-gradient(45deg, var(--acc,#A3E635) 25%, #0F1729 25%, #0F1729 50%, var(--acc,#A3E635) 50%, var(--acc,#A3E635) 75%, #0F1729 75%)", backgroundSize: "100% 100%, 96px 96px", animation: "pkCurb 1.8s linear infinite", borderTop: "3px solid var(--acc-hi,#ECFCCB)" }}></div>
          <div className="pk-anim pk-curb" style={{ height: "72px", backgroundImage: "linear-gradient(to bottom, rgba(0,0,0,0.02), rgba(0,0,0,0.5)), linear-gradient(45deg, var(--acc,#A3E635) 25%, #0F1729 25%, #0F1729 50%, var(--acc,#A3E635) 50%, var(--acc,#A3E635) 75%, #0F1729 75%)", backgroundSize: "100% 100%, 96px 96px", animation: "pkCurb 1.8s linear infinite", boxShadow: "0 34px 70px rgba(var(--sh-rgb,0,0,0),calc(0.65 * var(--sh-k,1)))" }}></div>
        </div>
      </div>

      <section id="por-que" className="pk-sec pk-page pk-lazy-section" style={{ background: "var(--bg1,#070B15)", padding: "90px 24px 60px 24px" }}>
        <div style={{ width: "100%", maxWidth: "1160px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "48px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", textAlign: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "0.18em", color: "var(--acc,#A3E635)" }}>EL PROBLEMA</span>
            <h2 className="pk-h2" style={{ margin: "0", fontSize: "52px", fontWeight: 800, letterSpacing: "-0.03em" }}>¿Por qué elegir Parkia?</h2>
          </div>
          <div ref={reveal.set[8]} style={{ margin: "0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
            <div ref={reveal.set[11]} style={{ display: "flex", opacity: v.sa0.o, transform: v.sa0.t, transition: `opacity .7s ease ${v.sa0.d}, transform .8s cubic-bezier(.2,.8,.2,1) ${v.sa0.d}` }}>
              <div className={`pk-step on ${v.sa0.lap}`} style={{ '--lapd': v.sa0.ld, flex: "1", cursor: "default", transform: "none" } as React.CSSProperties}>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                  <span style={{ fontSize: "60px", fontWeight: 900, lineHeight: "1", letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums", textShadow: "0 0 26px rgba(var(--acc-rgb,163,230,53),.35)" }}><span ref={el => { counterRefs.current[0] = el; }}>0</span><span style={{ fontSize: "26px", color: "var(--acc,#A3E635)" }}> min</span></span>
                  <svg width="64" height="64" viewBox="0 0 80 80" aria-hidden="true" style={{ flexShrink: 0, filter: "drop-shadow(0 0 12px rgba(var(--acc-rgb,163,230,53),.45))" }}>
                    <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(var(--fg-rgb,255,255,255),0.1)" strokeWidth="7" />
                    <circle ref={ringRef} style={{ stroke: "var(--acc,#A3E635)" }} cx="40" cy="40" r="32" fill="none" strokeWidth="7" strokeLinecap="round" strokeDasharray="0 201" transform="rotate(-90 40 40)" />
                    <g ref={minHandRef} transform="rotate(0 40 40)"><path style={{ stroke: "var(--tx,#FFFFFF)" }} d="M40 40V16" strokeWidth="4" strokeLinecap="round" /></g><g ref={hourHandRef} transform="rotate(0 40 40)"><path style={{ stroke: "var(--acc,#A3E635)" }} d="M40 40l11 6" strokeWidth="4" strokeLinecap="round" /></g>
                    <circle style={{ fill: "var(--acc,#A3E635)" }} cx="40" cy="40" r="4" />
                  </svg>
                </span>
                <p style={{ margin: "0", fontSize: "18px", lineHeight: "1.5", color: "var(--tx2,#DCE3EE)" }}>pierde un porteño en promedio en encontrar dónde estacionar, y hasta 1 hora en horarios pico.</p>
                <p className="pk-lime" style={{ margin: "0", fontSize: "24px", fontWeight: 800, lineHeight: "1.2", letterSpacing: "-0.02em", color: "var(--acc,#A3E635)" }}>Con Parkia lo reservás en menos de 5 minutos</p>
              </div>
            </div>
            <div ref={reveal.set[12]} style={{ display: "flex", opacity: v.sa1.o, transform: v.sa1.t, transition: `opacity .7s ease ${v.sa1.d}, transform .8s cubic-bezier(.2,.8,.2,1) ${v.sa1.d}` }}>
              <div className={`pk-step ${v.sa1.lap}`} style={{ '--lapd': v.sa1.ld, flex: "1", cursor: "default" } as React.CSSProperties}>
                <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "60px", fontWeight: 900, lineHeight: "1", letterSpacing: "-0.04em" }}><span ref={el => { counterRefs.current[1] = el; }}>0</span><span style={{ color: "var(--tx,#FFFFFF)" }}>%</span></span>
                <p style={{ margin: "0", fontSize: "18px", lineHeight: "1.5", color: "var(--tx2,#DCE3EE)" }}>de los autos que circulan por zonas comerciales están dando vueltas buscando lugar.</p>
                <p className="pk-lime" style={{ margin: "0", fontSize: "24px", fontWeight: 800, lineHeight: "1.2", letterSpacing: "-0.02em", color: "var(--acc,#A3E635)" }}>Parkia elimina las vueltas a la manzana</p>
                <div aria-hidden="true" style={{ position: "relative", height: "12px", marginTop: "18px", borderRadius: "8px", background: "rgba(var(--fg-rgb,255,255,255),.07)" }}><div ref={el => { barRefs.current[0] = el; }} style={{ position: "absolute", left: "0", top: "0", bottom: "0", width: "0%" }}><div className="pk-anim pk-fire" style={{ position: "absolute", inset: "0", borderRadius: "8px" }}></div></div></div>
              </div>
            </div>
            <div ref={reveal.set[13]} style={{ display: "flex", opacity: v.sa2.o, transform: v.sa2.t, transition: `opacity .7s ease ${v.sa2.d}, transform .8s cubic-bezier(.2,.8,.2,1) ${v.sa2.d}` }}>
              <div className={`pk-step ${v.sa2.lap}`} style={{ '--lapd': v.sa2.ld, flex: "1", cursor: "default" } as React.CSSProperties}>
                <span style={{ fontSize: "60px", fontWeight: 900, lineHeight: "1", letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums" }}><span ref={el => { counterRefs.current[2] = el; }}>0</span><span style={{ color: "var(--tx,#FFFFFF)" }}>%</span></span>
                <p style={{ margin: "0", fontSize: "18px", lineHeight: "1.5", color: "var(--tx2,#DCE3EE)" }}>de las cocheras quedan vacías en horarios valle.</p>
                <p className="pk-lime" style={{ margin: "0", fontSize: "24px", fontWeight: 800, lineHeight: "1.2", letterSpacing: "-0.02em", color: "var(--acc,#A3E635)" }}>Parkia las conecta con quien las necesita</p>
                <div aria-hidden="true" style={{ height: "8px", borderRadius: "8px", background: "rgba(var(--fg-rgb,255,255,255),.07)", overflow: "hidden" }}><div ref={el => { barRefs.current[1] = el; }} style={{ height: "100%", width: "0%", borderRadius: "8px", background: "linear-gradient(90deg, var(--acc2,#4ADE80), var(--acc,#A3E635))" }}></div></div>
              </div>
            </div>
          </div>
          <p style={{ margin: "0", textAlign: "center", fontSize: "13px", color: "var(--tx3,#6F7C93)" }}>Fuentes: Informes y estadísticas de movilidad urbana 2026 de Clarín, iProfesional y CAGESRA (CABA).</p>
        </div>
      </section>

      <section id="como-funciona" className="pk-sec pk-page pk-lazy-section pk-motion-section" style={{ position: "relative", overflow: "hidden", background: "var(--bg1,#070B15)", padding: "90px 24px 40px 24px" }}>
        <div aria-hidden="true" style={{ position: "absolute", left: "50%", top: "-140px", width: "900px", height: "480px", marginLeft: "-450px", background: "radial-gradient(ellipse at 50% 0, rgba(70,120,255,.40), transparent 65%)", filter: "blur(30px)", pointerEvents: "none" }}></div><div aria-hidden="true" style={{ position: "absolute", left: "50%", bottom: "40px", width: "640px", height: "320px", marginLeft: "-320px", background: "radial-gradient(ellipse, rgba(var(--acc-rgb,163,230,53),.10), transparent 65%)", filter: "blur(24px)", pointerEvents: "none" }}></div><div aria-hidden="true" style={{ position: "absolute", inset: "0", pointerEvents: "none" }}><span className="pk-anim pk-pt" style={{ position: "absolute", left: "83.4%", top: "73.3%", width: "3px", height: "3px", borderRadius: "50%", background: "#7DA2FF", boxShadow: "0 0 6px #7DA2FF", animationDuration: "3.0s", animationDelay: "-2.0s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "64.6%", top: "75.6%", width: "2px", height: "2px", borderRadius: "50%", background: "#7DA2FF", boxShadow: "0 0 6px #7DA2FF", animationDuration: "2.6s", animationDelay: "-0.1s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "60.3%", top: "73.6%", width: "2px", height: "2px", borderRadius: "50%", background: "#7DA2FF", boxShadow: "0 0 6px #7DA2FF", animationDuration: "3.9s", animationDelay: "-1.1s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "92.7%", top: "85.9%", width: "3px", height: "3px", borderRadius: "50%", background: "#7DA2FF", boxShadow: "0 0 6px #7DA2FF", animationDuration: "2.5s", animationDelay: "-0.1s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "67.9%", top: "92.2%", width: "2px", height: "2px", borderRadius: "50%", background: "var(--acc,#A3E635)", boxShadow: "0 0 6px var(--acc,#A3E635)", animationDuration: "4.0s", animationDelay: "-2.1s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "55.1%", top: "34.8%", width: "2px", height: "2px", borderRadius: "50%", background: "#7DA2FF", boxShadow: "0 0 6px #7DA2FF", animationDuration: "3.9s", animationDelay: "-3.0s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "42.0%", top: "87.3%", width: "2px", height: "2px", borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 0 6px #FFFFFF", animationDuration: "4.4s", animationDelay: "-0.4s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "73.3%", top: "85.4%", width: "2px", height: "2px", borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 0 6px #FFFFFF", animationDuration: "4.5s", animationDelay: "-2.0s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "81.7%", top: "64.7%", width: "3px", height: "3px", borderRadius: "50%", background: "#7DA2FF", boxShadow: "0 0 6px #7DA2FF", animationDuration: "3.1s", animationDelay: "-2.4s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "39.8%", top: "81.5%", width: "3px", height: "3px", borderRadius: "50%", background: "#7DA2FF", boxShadow: "0 0 6px #7DA2FF", animationDuration: "3.5s", animationDelay: "-3.0s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "65.8%", top: "36.8%", width: "2px", height: "2px", borderRadius: "50%", background: "#7DA2FF", boxShadow: "0 0 6px #7DA2FF", animationDuration: "4.3s", animationDelay: "-3.1s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "44.1%", top: "49.8%", width: "2px", height: "2px", borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 0 6px #FFFFFF", animationDuration: "4.1s", animationDelay: "-2.1s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "49.0%", top: "5.7%", width: "2px", height: "2px", borderRadius: "50%", background: "#7DA2FF", boxShadow: "0 0 6px #7DA2FF", animationDuration: "2.5s", animationDelay: "-2.8s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "18.4%", top: "49.2%", width: "3px", height: "3px", borderRadius: "50%", background: "#7DA2FF", boxShadow: "0 0 6px #7DA2FF", animationDuration: "4.6s", animationDelay: "-3.1s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "51.3%", top: "90.6%", width: "2px", height: "2px", borderRadius: "50%", background: "#7DA2FF", boxShadow: "0 0 6px #7DA2FF", animationDuration: "3.7s", animationDelay: "-1.8s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "54.6%", top: "91.1%", width: "3px", height: "3px", borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 0 6px #FFFFFF", animationDuration: "2.4s", animationDelay: "-3.1s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "76.6%", top: "21.9%", width: "3px", height: "3px", borderRadius: "50%", background: "#7DA2FF", boxShadow: "0 0 6px #7DA2FF", animationDuration: "4.5s", animationDelay: "-1.9s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "55.2%", top: "89.6%", width: "3px", height: "3px", borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 0 6px #FFFFFF", animationDuration: "3.3s", animationDelay: "-3.3s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "2.2%", top: "52.7%", width: "2px", height: "2px", borderRadius: "50%", background: "#7DA2FF", boxShadow: "0 0 6px #7DA2FF", animationDuration: "4.1s", animationDelay: "-1.3s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "63.0%", top: "53.7%", width: "2px", height: "2px", borderRadius: "50%", background: "var(--acc,#A3E635)", boxShadow: "0 0 6px var(--acc,#A3E635)", animationDuration: "2.8s", animationDelay: "-0.4s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "82.8%", top: "64.9%", width: "2px", height: "2px", borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 0 6px #FFFFFF", animationDuration: "2.6s", animationDelay: "-0.1s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "26.0%", top: "13.1%", width: "2px", height: "2px", borderRadius: "50%", background: "var(--acc,#A3E635)", boxShadow: "0 0 6px var(--acc,#A3E635)", animationDuration: "3.8s", animationDelay: "-1.4s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "17.3%", top: "51.5%", width: "2px", height: "2px", borderRadius: "50%", background: "var(--acc,#A3E635)", boxShadow: "0 0 6px var(--acc,#A3E635)", animationDuration: "2.8s", animationDelay: "-1.1s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "69.5%", top: "48.7%", width: "2px", height: "2px", borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 0 6px #FFFFFF", animationDuration: "2.7s", animationDelay: "-1.2s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "78.4%", top: "26.8%", width: "2px", height: "2px", borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 0 6px #FFFFFF", animationDuration: "3.0s", animationDelay: "-2.9s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "43.4%", top: "92.8%", width: "3px", height: "3px", borderRadius: "50%", background: "#7DA2FF", boxShadow: "0 0 6px #7DA2FF", animationDuration: "2.9s", animationDelay: "-1.6s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "94.1%", top: "44.0%", width: "3px", height: "3px", borderRadius: "50%", background: "var(--acc,#A3E635)", boxShadow: "0 0 6px var(--acc,#A3E635)", animationDuration: "3.5s", animationDelay: "-1.7s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "78.6%", top: "50.5%", width: "3px", height: "3px", borderRadius: "50%", background: "#7DA2FF", boxShadow: "0 0 6px #7DA2FF", animationDuration: "2.9s", animationDelay: "-2.6s" }}></span></div>
        <div style={{ position: "relative", maxWidth: "1160px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "56px" }}>
          <div ref={reveal.set[0]} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", textAlign: "center", opacity: v.rv0.o, transform: v.rv0.t, transition: "opacity .9s ease, transform .9s cubic-bezier(.2,.8,.2,1)" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "0.18em", color: "var(--acc,#A3E635)" }}>CÓMO FUNCIONA</span>
            <h2 className="pk-h2" style={{ margin: "0", fontSize: "52px", fontWeight: 800, letterSpacing: "-0.03em" }}>Estacioná en 3 pasos</h2>
          </div>
          <div ref={reveal.set[1]} onMouseLeave={v.stepsLeave} style={{ display: "flex", flexDirection: "column", gap: "26px", opacity: v.rv1.o, transform: v.rv1.t, transition: "opacity .9s ease .1s, transform .9s cubic-bezier(.2,.8,.2,1) .1s" }}>

            <div className="pk-steps" style={{ display: "flex", alignItems: "stretch" }}>
              {v.steps.map((st, stIndex) => (<React.Fragment key={stIndex}>
                <div ref={reveal.set[14 + stIndex]} className="pk-stepw" style={{ display: "flex", alignItems: "center", flex: st.flex, minWidth: "0" }}>
                  <div style={{ display: "flex", flex: "1", alignSelf: "stretch", minWidth: "0", opacity: st.ro, transform: st.rt, transition: `opacity .7s ease ${st.delay}, transform .8s cubic-bezier(.2,.8,.2,1) ${st.delay}` }}>
                    <button type="button" className={`pk-step ${st.cls}`} style={{ '--lapd': st.delay, flex: "1" } as React.CSSProperties} aria-pressed={st.pressed} onClick={st.pick} onMouseEnter={st.pick}>
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", opacity: st.ro, transform: st.it, transition: `opacity .6s ease ${st.d1}, transform .6s cubic-bezier(.2,.8,.2,1) ${st.d1}` }}>
                        <span className="pk-snum" style={{ fontSize: "64px", fontWeight: 800, lineHeight: "1", letterSpacing: "-0.04em", color: st.numColor, textShadow: st.glow, transition: "color .45s, text-shadow .45s" }}>{st.n}</span>
                        <span className="pk-sic" style={{ width: "56px", height: "56px", borderRadius: "16px", background: st.iconBg, boxShadow: st.iconGlow, display: "flex", alignItems: "center", justifyContent: "center", transition: "background .45s, box-shadow .45s" }}>
                          {st.i0 && (<><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={st.iconColor} strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg></>)}
                          {st.i1 && (<><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={st.iconColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg></>)}
                          {st.i2 && (<><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={st.iconColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16M9 15l2 2 4-4" /></svg></>)}
                        </span>
                      </span>
                      <h3 style={{ margin: "0", fontSize: "26px", fontWeight: 700, opacity: st.ro, transform: st.it, transition: `opacity .6s ease ${st.d2}, transform .6s cubic-bezier(.2,.8,.2,1) ${st.d2}` }}>{st.title}</h3>
                      <p style={{ margin: "0", fontSize: "17px", lineHeight: "1.6", color: "var(--tx2,#9AA6BA)", opacity: st.ro, transform: st.it, transition: `opacity .6s ease ${st.d3}, transform .6s cubic-bezier(.2,.8,.2,1) ${st.d3}` }}>{st.text}</p>
                    </button>
                  </div>
                  {st.link && (<><svg className="pk-conn" width="72" height="24" viewBox="0 0 72 24" aria-hidden="true" style={{ flex: "0 0 72px", overflow: "visible", filter: "drop-shadow(0 0 3px var(--acc,#A3E635)) drop-shadow(0 0 9px rgba(var(--acc-rgb,163,230,53),.8))" }}><line x1="4" y1="12" x2="68" y2="12" pathLength="100" style={{ stroke: "var(--acc,#A3E635)", strokeWidth: "3", strokeLinecap: "round", strokeDasharray: "100", strokeDashoffset: st.dash, transition: `stroke-dashoffset .5s cubic-bezier(.65,0,.35,1) ${st.dl}` }} /></svg></>)}
                </div>
              </React.Fragment>))}
            </div>
          </div>

          <div ref={reveal.set[2]} style={{ opacity: v.rv2.o, transform: v.rv2.t, transition: "opacity .9s ease, transform .9s cubic-bezier(.2,.8,.2,1)" }}>
            <div className={`pk-acc ${v.accCls}`} onClick={showAcc}>
              <span className="pk-acc-ic" style={{ width: "64px", height: "64px", flexShrink: 0, borderRadius: "14px", background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg style={{ stroke: "#FFFFFF" }} width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="4" r="1.6" /><path d="M12 7v6h5l2 5" /><path d="M9 10a6 6 0 1 0 7.5 8" /></svg>
              </span>
              <div style={{ flex: "999 1 360px", minWidth: "0", display: "flex", flexDirection: "column", gap: "6px" }}>
                <h3 style={{ margin: "0", fontSize: "28px", fontWeight: 700 }}>Estacionamiento accesible</h3>
                <span style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 800, letterSpacing: ".04em", color: "#0B1530", background: "#93C5FD", padding: "6px 12px", borderRadius: "999px", boxShadow: "0 0 18px rgba(147,197,253,.55)" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B1530" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z" /></svg>Prioridad para personas con discapacidad</span><p style={{ margin: "0", fontSize: "17px", lineHeight: "1.6", color: "var(--accb-tx,#C9D6F2)" }}>Filtrá cajones para personas con discapacidad cerca de tu destino y reservalos antes de llegar.</p><p style={{ margin: "0", fontSize: "16px", lineHeight: "1.6", color: "var(--accb-tx,#E0ECFF)" }}><strong style={{ color: "var(--tx,#FFFFFF)" }}>Reservás primero.</strong> Con tu CUD validado en tu perfil, las plazas accesibles se abren para vos antes que para el resto.</p>
              </div>
              <button type="button" className="pk-acc-btn" onClick={showAcc} style={{ flex: "0 0 auto", border: "0", cursor: "pointer", background: "#2563EB", color: "#FFFFFF", font: "800 20px 'Albert Sans', sans-serif", padding: "18px 30px", borderRadius: "999px", display: "inline-flex", alignItems: "center", gap: "12px", boxShadow: "0 10px 30px rgba(37,99,235,.45)" }}>{v.accLabel}<svg style={{ stroke: "#FFFFFF" }} className="pk-acc-arrow" width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
            </div>
          </div>
        </div>
      </section>



      {garages.length > 0 && (
        <section className="pk-sec" style={{ position: "relative", background: "var(--bg0,#05080F)", padding: "100px 24px 40px 24px" }}>
          <div style={{ maxWidth: "1160px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "40px" }}>
            <div ref={reveal.set[20]} style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", opacity: rvOf(20).o, transform: rvOf(20).t, transition: "opacity .9s ease, transform .9s cubic-bezier(.2,.8,.2,1)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "0.18em", color: "var(--acc,#A3E635)" }}>GARAJES DESTACADOS</span>
                <h2 className="pk-h2" style={{ margin: 0, fontSize: "52px", fontWeight: 800, letterSpacing: "-0.03em" }}>Elegí dónde estacionar</h2>
                <p style={{ margin: 0, fontSize: "18px", color: "var(--tx2,#9AA6BA)" }}>Lugares libres en tiempo real, con precio por hora y servicios.</p>
              </div>
              <Link to="/search" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--acc,#A3E635)", fontWeight: 700, fontSize: "17px", textDecoration: "none" }}>Ver todos en el mapa<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></Link>
            </div>
            <div className="pk-cf" role="region" aria-roledescription="carrusel" aria-label="Garajes destacados" tabIndex={0} onKeyDown={(e) => { if (e.key === 'ArrowRight') stepGar(1); if (e.key === 'ArrowLeft') stepGar(-1); }} onPointerDown={(e) => { dragX.current = e.clientX; }} onPointerUp={(e) => { if (dragX.current === null) return; const dx = e.clientX - dragX.current; dragX.current = null; if (Math.abs(dx) > 45) stepGar(dx < 0 ? 1 : -1); }} onPointerCancel={() => { dragX.current = null; }}>
              <div className="pk-cf-stage">
                {garages.map((g, i) => {
                  const n = garages.length; const half = Math.floor(n / 2);
                  const d = ((i - garIdx + n + half) % n) - half;
                  return (
                    <div key={g.p.id} className="pk-cf-item" aria-hidden={d !== 0} onClickCapture={(e) => { if (d !== 0) { e.preventDefault(); e.stopPropagation(); goGar(i); } }} style={{ transform: `translateX(${d * 74}%) translateZ(${-Math.abs(d) * 140}px) rotateY(${-d * 36}deg) scale(${1 - Math.min(Math.abs(d), 2) * 0.1})`, opacity: Math.abs(d) > 1 ? 0 : d === 0 ? 1 : 0.72, zIndex: 10 - Math.abs(d), filter: d === 0 ? 'none' : 'saturate(.8) brightness(.92)', pointerEvents: Math.abs(d) > 1 ? 'none' : 'auto', cursor: d === 0 ? 'default' : 'pointer' }}>
                      <article className={`pk-step pk-own ${d === 0 ? 'on' : ''}`} style={{ flex: 1, minWidth: 0, cursor: "default", padding: 0, gap: 0, transition: "translate .5s cubic-bezier(.2,.8,.2,1), box-shadow .5s" } as React.CSSProperties}>
                        <div style={{ position: "relative", height: "150px", borderRadius: "19px 19px 0 0", overflow: "hidden", background: "linear-gradient(160deg, #142038, #0A1122)" }}>
                          {g.p.image_url && <img src={g.p.image_url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />}
                          <span aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(5,8,15,.1), rgba(5,8,15,.65))" }} />
                          <span style={{ position: "absolute", left: "16px", top: "16px", display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 11px", borderRadius: "999px", background: "rgba(5,8,15,.75)", color: "#FFFFFF", fontSize: "14px", fontWeight: 700 }}><svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" style={{ fill: "#FACC15" }}><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z" /></svg>{Number(g.p.rating).toFixed(1)} <span style={{ color: "#9AA6BA", fontWeight: 600 }}>({g.p.reviews_count})</span></span>
                          <button type="button" onClick={() => toggleFavorite(g.p.id)} aria-pressed={g.fav} aria-label={g.fav ? 'Quitar de favoritos' : 'Guardar en favoritos'} style={{ position: "absolute", right: "14px", top: "12px", width: "38px", height: "38px", borderRadius: "12px", border: 0, cursor: "pointer", background: "rgba(5,8,15,.75)", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="2.2" strokeLinejoin="round" aria-hidden="true" style={{ fill: g.fav ? "#F43F5E" : "none", stroke: g.fav ? "#F43F5E" : "#FFFFFF" }}><path d="M12 20s-7-4.4-9.2-9A5 5 0 0 1 12 6a5 5 0 0 1 9.2 5c-2.2 4.6-9.2 9-9.2 9z" /></svg></button>
                          {g.p.is_24_hours && <span style={{ position: "absolute", left: "16px", bottom: "14px", padding: "4px 10px", borderRadius: "999px", background: "#A3E635", color: "#0F1729", fontSize: "12px", fontWeight: 800 }}>24 h</span>}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "22px 24px 24px 24px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <h3 style={{ margin: 0, fontSize: "21px", fontWeight: 800, lineHeight: 1.2 }}>{g.p.name}</h3>
                            <span style={{ fontSize: "15px", color: "var(--tx2,#9AA6BA)" }}>{g.p.address}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
                            <span style={{ fontSize: "30px", fontWeight: 900, letterSpacing: "-0.02em" }}>{money(Number(g.p.price_per_hour))}<span style={{ fontSize: "15px", fontWeight: 600, color: "var(--tx2,#9AA6BA)" }}> /hora</span></span>
                            <span style={{ fontSize: "14px", fontWeight: 700, color: g.color }}>{g.freeText}</span>
                          </div>
                          <div aria-hidden="true" style={{ height: "6px", borderRadius: "6px", background: "rgba(var(--fg-rgb,255,255,255),.08)", overflow: "hidden" }}><div style={{ height: "100%", width: g.freeW, borderRadius: "6px", background: g.color, transition: `width 1.2s cubic-bezier(.2,.8,.2,1) ${g.q.d2}` }} /></div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                            {g.p.has_disabled_access && <span style={{ padding: "5px 10px", borderRadius: "999px", fontSize: "13px", fontWeight: 700, color: "#BFDBFE", background: "rgba(59,130,246,.18)" }}>Accesible CUD</span>}
                            {g.tags.map((t) => <span key={t} style={{ padding: "5px 10px", borderRadius: "999px", fontSize: "13px", fontWeight: 700, color: "var(--tx2,#C3CCDA)", background: "rgba(var(--fg-rgb,255,255,255),.06)" }}>{t}</span>)}
                          </div>
                          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                            <button type="button" className="pkc-cta" disabled={g.full} onClick={() => setSelectedBookingParking(g.p)} style={{ flex: 1, border: 0, cursor: g.full ? "not-allowed" : "pointer", opacity: g.full ? 0.5 : 1, background: "var(--acc,#A3E635)", color: "var(--on-acc,#05080F)", fontFamily: "inherit", fontWeight: 800, fontSize: "16px", padding: "13px 16px", borderRadius: "12px" }}>{g.full ? 'Sin lugares' : 'Reservar'}</button>
                            <Link to={`/parking/${g.p.id}`} style={{ flex: "0 0 auto", border: "1.5px solid rgba(var(--fg-rgb,255,255,255),.18)", color: "var(--tx,#FFFFFF)", fontWeight: 700, fontSize: "16px", textDecoration: "none", padding: "12px 16px", borderRadius: "12px" }}>Ver detalle</Link>
                          </div>
                        </div>
                      </article>
                    </div>
                  );
                })}
              </div>
              <button type="button" className="pk-cf-arrow pk-cf-prev" onClick={() => stepGar(-1)} aria-label="Garaje anterior"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg></button>
              <button type="button" className="pk-cf-arrow pk-cf-next" onClick={() => stepGar(1)} aria-label="Garaje siguiente"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></button>
              <div className="pk-cf-dots">{garages.map((g, i) => (<button key={g.p.id} type="button" onClick={() => goGar(i)} aria-label={`Ver ${g.p.name}`} aria-current={i === garIdx} className={i === garIdx ? 'on' : ''} />))}</div>
            </div>
          </div>
        </section>
      )}

      <section id="pagos" className="pk-sec pk-snap pk-lazy-section pk-motion-section" style={{ background: "var(--bg1,#070B15)", padding: "90px 0 40px 0" }}>
        <div ref={reveal.set[3]} style={{ maxWidth: "1160px", margin: "0 auto", padding: "0 24px", display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", opacity: v.rv3.o, transform: v.rv3.t, transition: "opacity .9s ease, transform .9s cubic-bezier(.2,.8,.2,1)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <h2 className="pk-h2" style={{ margin: "0", fontSize: "52px", fontWeight: 800, letterSpacing: "-0.03em" }}>Pagá como quieras</h2>
            <p style={{ margin: "0", fontSize: "19px", color: "var(--tx2,#9AA6BA)" }}>Elegís el medio de pago al confirmar la reserva.</p>
          </div>
        </div>
        <div ref={reveal.set[4]} aria-hidden="true" style={{ position: "relative", height: "96px", marginTop: "28px", overflow: "hidden", opacity: v.rv4.o, transform: v.rv4.t, transition: "opacity .9s ease 0s, transform 1s cubic-bezier(.2,.8,.2,1) 0s" }}><div style={{ position: "absolute", left: "-10%", width: "120%", top: "50%", height: "40px", marginTop: "-20px", transform: "rotate(-1.6deg)", background: "var(--acc,#A3E635)", borderTop: "2px solid #0F1729", borderBottom: "2px solid #0F1729", boxShadow: "0 0 22px rgba(var(--acc-rgb,163,230,53),.45), 0 12px 26px rgba(var(--sh-rgb,0,0,0),calc(.5 * var(--sh-k,1)))", overflow: "hidden", display: "flex", alignItems: "center" }}><div className="pk-anim" style={{ display: "flex", alignItems: "center", height: "100%", width: "max-content", animation: "pkTapeR 7s linear infinite" }}><span style={{ flex: "0 0 auto", width: "54px", alignSelf: "stretch", background: "repeating-linear-gradient(-45deg, var(--stripe,#0F1729) 0 9px, var(--acc,#A3E635) 9px 18px)" }}></span><span style={{ flex: "0 0 auto", padding: "0 34px", fontSize: "16px", fontWeight: 900, letterSpacing: ".16em", color: "var(--on-acc,#0F1729)", whiteSpace: "nowrap" }}>RESERVÁ ANTES DE LLEGAR</span><span style={{ flex: "0 0 auto", width: "54px", alignSelf: "stretch", background: "repeating-linear-gradient(-45deg, var(--stripe,#0F1729) 0 9px, var(--acc,#A3E635) 9px 18px)" }}></span><span style={{ flex: "0 0 auto", padding: "0 34px", fontSize: "16px", fontWeight: 900, letterSpacing: ".16em", color: "var(--on-acc,#0F1729)", whiteSpace: "nowrap" }}>PARKIA</span><span style={{ flex: "0 0 auto", width: "54px", alignSelf: "stretch", background: "repeating-linear-gradient(-45deg, var(--stripe,#0F1729) 0 9px, var(--acc,#A3E635) 9px 18px)" }}></span><span style={{ flex: "0 0 auto", padding: "0 34px", fontSize: "16px", fontWeight: 900, letterSpacing: ".16em", color: "var(--on-acc,#0F1729)", whiteSpace: "nowrap" }}>SIN DAR VUELTAS</span><span style={{ flex: "0 0 auto", width: "54px", alignSelf: "stretch", background: "repeating-linear-gradient(-45deg, var(--stripe,#0F1729) 0 9px, var(--acc,#A3E635) 9px 18px)" }}></span><span style={{ flex: "0 0 auto", padding: "0 34px", fontSize: "16px", fontWeight: 900, letterSpacing: ".16em", color: "var(--on-acc,#0F1729)", whiteSpace: "nowrap" }}>PAGÁ COMO QUIERAS</span><span style={{ flex: "0 0 auto", width: "54px", alignSelf: "stretch", background: "repeating-linear-gradient(-45deg, var(--stripe,#0F1729) 0 9px, var(--acc,#A3E635) 9px 18px)" }}></span><span style={{ flex: "0 0 auto", padding: "0 34px", fontSize: "16px", fontWeight: 900, letterSpacing: ".16em", color: "var(--on-acc,#0F1729)", whiteSpace: "nowrap" }}>RESERVÁ ANTES DE LLEGAR</span><span style={{ flex: "0 0 auto", width: "54px", alignSelf: "stretch", background: "repeating-linear-gradient(-45deg, var(--stripe,#0F1729) 0 9px, var(--acc,#A3E635) 9px 18px)" }}></span><span style={{ flex: "0 0 auto", padding: "0 34px", fontSize: "16px", fontWeight: 900, letterSpacing: ".16em", color: "var(--on-acc,#0F1729)", whiteSpace: "nowrap" }}>PARKIA</span><span style={{ flex: "0 0 auto", width: "54px", alignSelf: "stretch", background: "repeating-linear-gradient(-45deg, var(--stripe,#0F1729) 0 9px, var(--acc,#A3E635) 9px 18px)" }}></span><span style={{ flex: "0 0 auto", padding: "0 34px", fontSize: "16px", fontWeight: 900, letterSpacing: ".16em", color: "var(--on-acc,#0F1729)", whiteSpace: "nowrap" }}>SIN DAR VUELTAS</span><span style={{ flex: "0 0 auto", width: "54px", alignSelf: "stretch", background: "repeating-linear-gradient(-45deg, var(--stripe,#0F1729) 0 9px, var(--acc,#A3E635) 9px 18px)" }}></span><span style={{ flex: "0 0 auto", padding: "0 34px", fontSize: "16px", fontWeight: 900, letterSpacing: ".16em", color: "var(--on-acc,#0F1729)", whiteSpace: "nowrap" }}>PAGÁ COMO QUIERAS</span></div></div></div>
        <div ref={reveal.set[5]} style={{ marginTop: "6px", overflow: "hidden", padding: "28px 0", opacity: v.rv5.o, transform: v.rv5.t, transition: "opacity 1s ease .15s, transform 1.1s cubic-bezier(.2,.8,.2,1) .15s", maskImage: "linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)" }}>
          <div className="pk-anim" style={{ display: "flex", width: "max-content", animation: "pkBelt 24s linear infinite" }}>
            {v.belt.map((m, mIndex) => (<React.Fragment key={mIndex}>
              <div className="pk-beltc" style={{ flex: "0 0 auto", width: "520px", height: "210px", marginRight: "22px", boxSizing: "border-box", borderRadius: "22px", padding: "20px", color: "var(--tx,#FFFFFF)", background: "linear-gradient(160deg, var(--card,#111A2C), var(--card2,#0B111E))", border: "1px solid rgba(var(--fg-rgb,255,255,255),0.09)", boxShadow: "0 10px 30px rgba(var(--sh-rgb,0,0,0),calc(0.35 * var(--sh-k,1)))", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ flex: "1", minHeight: "0", overflow: "hidden", display: "flex", alignItems: "stretch", justifyContent: "center", gap: m.gap, borderRadius: "14px", background: "radial-gradient(120% 90% at 50% 0%, rgba(var(--fg-rgb,255,255,255),0.07), rgba(var(--fg-rgb,255,255,255),0.015))", border: "1px solid rgba(var(--fg-rgb,255,255,255),0.07)", padding: "6px 8px" }}>
                  {m.logos.map((lg, lgIndex) => (<React.Fragment key={lgIndex}><span className={lg.alt === 'Rapipago' ? 'pk-logo-dark' : undefined} style={{ flex: lg.fx, minWidth: "0", borderRadius: "14px", background: lg.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 14px", boxSizing: "border-box" }}><img src={lg.src} alt={lg.alt} style={{ display: "block", width: "auto", height: "auto", maxHeight: `${lg.h}px`, maxWidth: "100%", objectFit: "contain" }} /></span></React.Fragment>))}
                </div>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                  <span style={{ display: "flex", flexDirection: "column", gap: "2px" }}><strong style={{ fontSize: "18px" }}>{m.kind}</strong><span style={{ fontSize: "14px", color: "var(--tx3,#8A96AB)" }}>{m.desc}</span></span>
                  <span style={{ width: "36px", height: "36px", borderRadius: "10px", background: m.iconBg, border: "1px solid rgba(var(--fg-rgb,255,255,255),0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {m.wallet && (<><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={m.iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="2.5" /><path d="M10.5 18h3" /><path d="M9 8l2 2 4-4" /></svg></>)}
                    {m.card && (<><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={m.iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2.5" /><path d="M2 10h20" /><path d="M6 15h4" /></svg></>)}
                    {m.cash && (<><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={m.iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.6" /><path d="M6 9.5v5M18 9.5v5" /></svg></>)}
                  </span>
                </span>
              </div>
            </React.Fragment>))}
          </div>
        </div>
        <div ref={reveal.set[6]} aria-hidden="true" style={{ position: "relative", height: "96px", marginTop: "4px", overflow: "hidden", opacity: v.rv6.o, transform: v.rv6.t, transition: "opacity .9s ease .25s, transform 1s cubic-bezier(.2,.8,.2,1) .25s" }}><div style={{ position: "absolute", left: "-10%", width: "120%", top: "50%", height: "40px", marginTop: "-20px", transform: "rotate(1.6deg)", background: "var(--acc,#A3E635)", borderTop: "2px solid #0F1729", borderBottom: "2px solid #0F1729", boxShadow: "0 0 22px rgba(var(--acc-rgb,163,230,53),.45), 0 12px 26px rgba(var(--sh-rgb,0,0,0),calc(.5 * var(--sh-k,1)))", overflow: "hidden", display: "flex", alignItems: "center" }}><div className="pk-anim" style={{ display: "flex", alignItems: "center", height: "100%", width: "max-content", animation: "pkTapeL 7s linear infinite" }}><span style={{ flex: "0 0 auto", width: "54px", alignSelf: "stretch", background: "repeating-linear-gradient(-45deg, var(--stripe,#0F1729) 0 9px, var(--acc,#A3E635) 9px 18px)" }}></span><span style={{ flex: "0 0 auto", padding: "0 34px", fontSize: "16px", fontWeight: 900, letterSpacing: ".16em", color: "var(--on-acc,#0F1729)", whiteSpace: "nowrap" }}>PLAZA RESERVADA</span><span style={{ flex: "0 0 auto", width: "54px", alignSelf: "stretch", background: "repeating-linear-gradient(-45deg, var(--stripe,#0F1729) 0 9px, var(--acc,#A3E635) 9px 18px)" }}></span><span style={{ flex: "0 0 auto", padding: "0 34px", fontSize: "16px", fontWeight: 900, letterSpacing: ".16em", color: "var(--on-acc,#0F1729)", whiteSpace: "nowrap" }}>PARKIA</span><span style={{ flex: "0 0 auto", width: "54px", alignSelf: "stretch", background: "repeating-linear-gradient(-45deg, var(--stripe,#0F1729) 0 9px, var(--acc,#A3E635) 9px 18px)" }}></span><span style={{ flex: "0 0 auto", padding: "0 34px", fontSize: "16px", fontWeight: 900, letterSpacing: ".16em", color: "var(--on-acc,#0F1729)", whiteSpace: "nowrap" }}>TU LUGAR TE ESPERA</span><span style={{ flex: "0 0 auto", width: "54px", alignSelf: "stretch", background: "repeating-linear-gradient(-45deg, var(--stripe,#0F1729) 0 9px, var(--acc,#A3E635) 9px 18px)" }}></span><span style={{ flex: "0 0 auto", padding: "0 34px", fontSize: "16px", fontWeight: 900, letterSpacing: ".16em", color: "var(--on-acc,#0F1729)", whiteSpace: "nowrap" }}>ESTACIONÁ EN 5 MIN</span><span style={{ flex: "0 0 auto", width: "54px", alignSelf: "stretch", background: "repeating-linear-gradient(-45deg, var(--stripe,#0F1729) 0 9px, var(--acc,#A3E635) 9px 18px)" }}></span><span style={{ flex: "0 0 auto", padding: "0 34px", fontSize: "16px", fontWeight: 900, letterSpacing: ".16em", color: "var(--on-acc,#0F1729)", whiteSpace: "nowrap" }}>PLAZA RESERVADA</span><span style={{ flex: "0 0 auto", width: "54px", alignSelf: "stretch", background: "repeating-linear-gradient(-45deg, var(--stripe,#0F1729) 0 9px, var(--acc,#A3E635) 9px 18px)" }}></span><span style={{ flex: "0 0 auto", padding: "0 34px", fontSize: "16px", fontWeight: 900, letterSpacing: ".16em", color: "var(--on-acc,#0F1729)", whiteSpace: "nowrap" }}>PARKIA</span><span style={{ flex: "0 0 auto", width: "54px", alignSelf: "stretch", background: "repeating-linear-gradient(-45deg, var(--stripe,#0F1729) 0 9px, var(--acc,#A3E635) 9px 18px)" }}></span><span style={{ flex: "0 0 auto", padding: "0 34px", fontSize: "16px", fontWeight: 900, letterSpacing: ".16em", color: "var(--on-acc,#0F1729)", whiteSpace: "nowrap" }}>TU LUGAR TE ESPERA</span><span style={{ flex: "0 0 auto", width: "54px", alignSelf: "stretch", background: "repeating-linear-gradient(-45deg, var(--stripe,#0F1729) 0 9px, var(--acc,#A3E635) 9px 18px)" }}></span><span style={{ flex: "0 0 auto", padding: "0 34px", fontSize: "16px", fontWeight: 900, letterSpacing: ".16em", color: "var(--on-acc,#0F1729)", whiteSpace: "nowrap" }}>ESTACIONÁ EN 5 MIN</span></div></div></div>
      </section>

      <section style={{ background: "var(--bg1,#070B15)", padding: "0 0 120px 0" }}>
        <div ref={reveal.set[7]} style={{ opacity: v.rv7.o, transform: v.rv7.t, transition: "opacity 1s ease, transform 1.1s cubic-bezier(.2,.8,.2,1)" }}>
          <CheckoutDemo />
        </div>
      </section>

      <section id="duenos" className="pk-sec pk-page pk-lazy-section pk-motion-section" style={{ background: "var(--bg0,#05080F)", padding: "110px 24px 120px 24px", position: "relative", overflow: "hidden" }}>
        <div aria-hidden="true" style={{ position: "absolute", left: "50%", top: "-140px", width: "900px", height: "480px", marginLeft: "-450px", background: "radial-gradient(ellipse at 50% 0, rgba(70,120,255,.40), transparent 65%)", filter: "blur(30px)", pointerEvents: "none" }}></div><div aria-hidden="true" style={{ position: "absolute", left: "50%", bottom: "40px", width: "640px", height: "320px", marginLeft: "-320px", background: "radial-gradient(ellipse, rgba(var(--acc-rgb,163,230,53),.10), transparent 65%)", filter: "blur(24px)", pointerEvents: "none" }}></div><div aria-hidden="true" style={{ position: "absolute", inset: "0", pointerEvents: "none" }}><span className="pk-anim pk-pt" style={{ position: "absolute", left: "10.1%", top: "79.9%", width: "2px", height: "2px", borderRadius: "50%", background: "var(--acc,#A3E635)", boxShadow: "0 0 6px var(--acc,#A3E635)", animationDuration: "4.0s", animationDelay: "-2.7s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "60.2%", top: "58.8%", width: "2px", height: "2px", borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 0 6px #FFFFFF", animationDuration: "3.7s", animationDelay: "-0.6s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "39.8%", top: "69.5%", width: "3px", height: "3px", borderRadius: "50%", background: "#7DA2FF", boxShadow: "0 0 6px #7DA2FF", animationDuration: "4.6s", animationDelay: "-3.8s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "27.8%", top: "6.3%", width: "3px", height: "3px", borderRadius: "50%", background: "#7DA2FF", boxShadow: "0 0 6px #7DA2FF", animationDuration: "2.5s", animationDelay: "-1.9s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "42.7%", top: "84.3%", width: "2px", height: "2px", borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 0 6px #FFFFFF", animationDuration: "2.8s", animationDelay: "-0.7s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "19.0%", top: "19.0%", width: "2px", height: "2px", borderRadius: "50%", background: "#7DA2FF", boxShadow: "0 0 6px #7DA2FF", animationDuration: "3.5s", animationDelay: "-1.4s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "78.5%", top: "70.6%", width: "2px", height: "2px", borderRadius: "50%", background: "#7DA2FF", boxShadow: "0 0 6px #7DA2FF", animationDuration: "4.4s", animationDelay: "-3.1s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "96.2%", top: "91.5%", width: "2px", height: "2px", borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 0 6px #FFFFFF", animationDuration: "2.8s", animationDelay: "-3.0s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "52.9%", top: "48.1%", width: "3px", height: "3px", borderRadius: "50%", background: "#7DA2FF", boxShadow: "0 0 6px #7DA2FF", animationDuration: "4.4s", animationDelay: "-2.0s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "86.8%", top: "85.8%", width: "3px", height: "3px", borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 0 6px #FFFFFF", animationDuration: "3.4s", animationDelay: "-2.3s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "65.3%", top: "89.5%", width: "2px", height: "2px", borderRadius: "50%", background: "#7DA2FF", boxShadow: "0 0 6px #7DA2FF", animationDuration: "4.2s", animationDelay: "-3.3s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "31.7%", top: "91.1%", width: "2px", height: "2px", borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 0 6px #FFFFFF", animationDuration: "4.0s", animationDelay: "-2.0s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "72.2%", top: "48.0%", width: "2px", height: "2px", borderRadius: "50%", background: "#7DA2FF", boxShadow: "0 0 6px #7DA2FF", animationDuration: "3.2s", animationDelay: "-2.7s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "71.7%", top: "86.5%", width: "2px", height: "2px", borderRadius: "50%", background: "var(--acc,#A3E635)", boxShadow: "0 0 6px var(--acc,#A3E635)", animationDuration: "2.8s", animationDelay: "-3.0s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "64.7%", top: "28.1%", width: "3px", height: "3px", borderRadius: "50%", background: "var(--acc,#A3E635)", boxShadow: "0 0 6px var(--acc,#A3E635)", animationDuration: "2.9s", animationDelay: "-3.5s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "15.1%", top: "27.5%", width: "3px", height: "3px", borderRadius: "50%", background: "var(--acc,#A3E635)", boxShadow: "0 0 6px var(--acc,#A3E635)", animationDuration: "4.2s", animationDelay: "-3.8s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "88.2%", top: "72.9%", width: "2px", height: "2px", borderRadius: "50%", background: "var(--acc,#A3E635)", boxShadow: "0 0 6px var(--acc,#A3E635)", animationDuration: "2.5s", animationDelay: "-1.4s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "4.3%", top: "13.6%", width: "3px", height: "3px", borderRadius: "50%", background: "#7DA2FF", boxShadow: "0 0 6px #7DA2FF", animationDuration: "2.5s", animationDelay: "-0.2s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "26.5%", top: "77.8%", width: "2px", height: "2px", borderRadius: "50%", background: "var(--acc,#A3E635)", boxShadow: "0 0 6px var(--acc,#A3E635)", animationDuration: "2.7s", animationDelay: "-0.7s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "58.6%", top: "76.1%", width: "2px", height: "2px", borderRadius: "50%", background: "var(--acc,#A3E635)", boxShadow: "0 0 6px var(--acc,#A3E635)", animationDuration: "2.9s", animationDelay: "-3.9s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "92.1%", top: "60.8%", width: "2px", height: "2px", borderRadius: "50%", background: "var(--acc,#A3E635)", boxShadow: "0 0 6px var(--acc,#A3E635)", animationDuration: "4.0s", animationDelay: "-1.1s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "31.6%", top: "53.7%", width: "2px", height: "2px", borderRadius: "50%", background: "#7DA2FF", boxShadow: "0 0 6px #7DA2FF", animationDuration: "3.7s", animationDelay: "-0.2s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "84.8%", top: "67.9%", width: "2px", height: "2px", borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 0 6px #FFFFFF", animationDuration: "3.4s", animationDelay: "-0.9s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "4.3%", top: "75.5%", width: "2px", height: "2px", borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 0 6px #FFFFFF", animationDuration: "4.5s", animationDelay: "-2.1s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "51.4%", top: "16.2%", width: "2px", height: "2px", borderRadius: "50%", background: "#7DA2FF", boxShadow: "0 0 6px #7DA2FF", animationDuration: "4.5s", animationDelay: "-1.0s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "3.7%", top: "54.3%", width: "3px", height: "3px", borderRadius: "50%", background: "#7DA2FF", boxShadow: "0 0 6px #7DA2FF", animationDuration: "2.7s", animationDelay: "-0.2s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "17.5%", top: "11.8%", width: "2px", height: "2px", borderRadius: "50%", background: "var(--acc,#A3E635)", boxShadow: "0 0 6px var(--acc,#A3E635)", animationDuration: "3.8s", animationDelay: "-2.0s" }}></span><span className="pk-anim pk-pt" style={{ position: "absolute", left: "24.3%", top: "43.9%", width: "2px", height: "2px", borderRadius: "50%", background: "var(--acc,#A3E635)", boxShadow: "0 0 6px var(--acc,#A3E635)", animationDuration: "3.0s", animationDelay: "-2.4s" }}></span></div>
        <div aria-hidden="true" style={{ position: "absolute", left: "50%", top: "-160px", width: "900px", height: "420px", marginLeft: "-450px", background: "radial-gradient(ellipse, rgba(var(--acc-rgb,163,230,53),.10), transparent 65%)", pointerEvents: "none" }}></div>
        <div ref={reveal.set[9]} style={{ position: "relative", maxWidth: "1160px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "44px", opacity: v.rv9.o, transform: v.rv9.t, transition: "opacity .9s ease, transform 1s cubic-bezier(.2,.8,.2,1)" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", textAlign: "center", maxWidth: "760px" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--acc2,#D9F99D)", border: "1px solid rgba(var(--acc-rgb,163,230,53),.35)", background: "rgba(var(--acc-rgb,163,230,53),.08)", padding: "7px 14px", borderRadius: "999px" }}>Para dueños de garajes</span>
            <h2 className="pk-h2" style={{ margin: "0", fontSize: "52px", fontWeight: 800, lineHeight: "1.04", letterSpacing: "-0.03em" }}>Llená tus cocheras vacías</h2>
            <p style={{ margin: "0", fontSize: "19px", lineHeight: "1.55", color: "var(--tx2,#9AA6BA)" }}>Sumá tu estacionamiento a Parkia y recibí reservas anticipadas. Controlás plazas, horarios y tarifas desde un panel.</p>
          </div>
          <div ref={reveal.set[10]} className="pk-steps" style={{ width: "100%", display: "flex", alignItems: "stretch" }}>
            <div ref={reveal.set[17]} className="pk-stepw" style={{ display: "flex", alignItems: "center", flex: "1 1 72px", minWidth: "0" }}>
              <div className={`pk-step pk-own ${v.ow0.lap} ${v.ownCls0}`} onClick={pickOwn0} onMouseEnter={pickOwn0} style={{ '--lapd': v.ow0.ld, flex: "1", alignSelf: "stretch", minWidth: "0", cursor: "pointer", opacity: v.ow0.o, transform: v.ow0.t, transition: `opacity .6s ease ${v.ow0.d}, transform .7s cubic-bezier(.2,.8,.2,1) ${v.ow0.d}, translate .5s cubic-bezier(.2,.8,.2,1), box-shadow .5s` } as React.CSSProperties}>
                <span className="pk-own-ic" style={{ opacity: v.ow0.o, transform: v.ow0.t, transition: `opacity .6s ease ${v.ow0.d1}, transform .7s cubic-bezier(.2,.8,.2,1) ${v.ow0.d1}, background .45s, box-shadow .45s`, width: "56px", height: "56px", borderRadius: "16px", background: "rgba(var(--acc-rgb,163,230,53),.12)", display: "flex", alignItems: "center", justifyContent: "center" }}><svg style={{ stroke: "var(--acc,#A3E635)" }} width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></svg></span>
                <h3 style={{ opacity: v.ow0.o, transform: v.ow0.t, transition: `opacity .6s ease ${v.ow0.d2}, transform .7s cubic-bezier(.2,.8,.2,1) ${v.ow0.d2}`, margin: "0", fontSize: "24px", fontWeight: 700 }}>Más ocupación</h3>
                <p style={{ opacity: v.ow0.o, transform: v.ow0.t, transition: `opacity .6s ease ${v.ow0.d3}, transform .7s cubic-bezier(.2,.8,.2,1) ${v.ow0.d3}`, margin: "0", fontSize: "17px", lineHeight: "1.6", color: "var(--tx2,#9AA6BA)" }}>Reservas anticipadas para los horarios valle, cuando más cocheras quedan vacías.</p>
              </div>
              <svg className="pk-conn" width="72" height="24" viewBox="0 0 72 24" aria-hidden="true" style={{ flex: "0 0 72px", overflow: "visible", filter: "drop-shadow(0 0 3px var(--acc,#A3E635)) drop-shadow(0 0 9px rgba(var(--acc-rgb,163,230,53),.8))" }}><line x1="4" y1="12" x2="68" y2="12" pathLength="100" style={{ stroke: "var(--acc,#A3E635)", strokeWidth: "3", strokeLinecap: "round", strokeDasharray: "100", strokeDashoffset: v.ow0.dash, transition: `stroke-dashoffset .5s cubic-bezier(.65,0,.35,1) ${v.ow0.dl}` }} /></svg>
            </div>
            <div ref={reveal.set[18]} className="pk-stepw" style={{ display: "flex", alignItems: "center", flex: "1 1 72px", minWidth: "0" }}>
              <div className={`pk-step pk-own ${v.ow1.lap} ${v.ownCls1}`} onClick={pickOwn1} onMouseEnter={pickOwn1} style={{ '--lapd': v.ow1.ld, flex: "1", alignSelf: "stretch", minWidth: "0", cursor: "pointer", opacity: v.ow1.o, transform: v.ow1.t, transition: `opacity .6s ease ${v.ow1.d}, transform .7s cubic-bezier(.2,.8,.2,1) ${v.ow1.d}, translate .5s cubic-bezier(.2,.8,.2,1), box-shadow .5s` } as React.CSSProperties}>
                <span className="pk-own-ic" style={{ opacity: v.ow1.o, transform: v.ow1.t, transition: `opacity .6s ease ${v.ow1.d1}, transform .7s cubic-bezier(.2,.8,.2,1) ${v.ow1.d1}, background .45s, box-shadow .45s`, width: "56px", height: "56px", borderRadius: "16px", background: "rgba(var(--acc-rgb,163,230,53),.12)", display: "flex", alignItems: "center", justifyContent: "center" }}><svg style={{ stroke: "var(--acc,#A3E635)" }} width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M7 14v-3M11 14V8M15 14v-5" /><path d="M8 21h8" /></svg></span>
                <h3 style={{ opacity: v.ow1.o, transform: v.ow1.t, transition: `opacity .6s ease ${v.ow1.d2}, transform .7s cubic-bezier(.2,.8,.2,1) ${v.ow1.d2}`, margin: "0", fontSize: "24px", fontWeight: 700 }}>Panel en vivo</h3>
                <p style={{ opacity: v.ow1.o, transform: v.ow1.t, transition: `opacity .6s ease ${v.ow1.d3}, transform .7s cubic-bezier(.2,.8,.2,1) ${v.ow1.d3}`, margin: "0", fontSize: "17px", lineHeight: "1.6", color: "var(--tx2,#9AA6BA)" }}>Cambiás tarifas, horarios y el estado de cada plaza (A01, B02) con un click.</p>
              </div>
              <svg className="pk-conn" width="72" height="24" viewBox="0 0 72 24" aria-hidden="true" style={{ flex: "0 0 72px", overflow: "visible", filter: "drop-shadow(0 0 3px var(--acc,#A3E635)) drop-shadow(0 0 9px rgba(var(--acc-rgb,163,230,53),.8))" }}><line x1="4" y1="12" x2="68" y2="12" pathLength="100" style={{ stroke: "var(--acc,#A3E635)", strokeWidth: "3", strokeLinecap: "round", strokeDasharray: "100", strokeDashoffset: v.ow1.dash, transition: `stroke-dashoffset .5s cubic-bezier(.65,0,.35,1) ${v.ow1.dl}` }} /></svg>
            </div>
            <div ref={reveal.set[19]} className="pk-stepw" style={{ display: "flex", alignItems: "center", flex: "1 1 0px", minWidth: "0" }}>
              <div className={`pk-step pk-own ${v.ow2.lap} ${v.ownCls2}`} onClick={pickOwn2} onMouseEnter={pickOwn2} style={{ '--lapd': v.ow2.ld, flex: "1", alignSelf: "stretch", minWidth: "0", cursor: "pointer", opacity: v.ow2.o, transform: v.ow2.t, transition: `opacity .6s ease ${v.ow2.d}, transform .7s cubic-bezier(.2,.8,.2,1) ${v.ow2.d}, translate .5s cubic-bezier(.2,.8,.2,1), box-shadow .5s` } as React.CSSProperties}>
                <span className="pk-own-ic" style={{ opacity: v.ow2.o, transform: v.ow2.t, transition: `opacity .6s ease ${v.ow2.d1}, transform .7s cubic-bezier(.2,.8,.2,1) ${v.ow2.d1}, background .45s, box-shadow .45s`, width: "56px", height: "56px", borderRadius: "16px", background: "rgba(var(--acc-rgb,163,230,53),.12)", display: "flex", alignItems: "center", justifyContent: "center" }}><svg style={{ stroke: "var(--acc,#A3E635)" }} width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6z" /><path d="m9 12 2 2 4-4" /></svg></span>
                <h3 style={{ opacity: v.ow2.o, transform: v.ow2.t, transition: `opacity .6s ease ${v.ow2.d2}, transform .7s cubic-bezier(.2,.8,.2,1) ${v.ow2.d2}`, margin: "0", fontSize: "24px", fontWeight: 700 }}>Sin hardware</h3>
                <p style={{ opacity: v.ow2.o, transform: v.ow2.t, transition: `opacity .6s ease ${v.ow2.d3}, transform .7s cubic-bezier(.2,.8,.2,1) ${v.ow2.d3}`, margin: "0", fontSize: "17px", lineHeight: "1.6", color: "var(--tx2,#9AA6BA)" }}>No hace falta instalar sensores: funciona desde la web y el celular.</p>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "14px" }}>
            <Link to="/register" className="pkc-cta" style={{ background: "var(--acc,#A3E635)", color: "var(--on-acc,#05080F)", fontWeight: 800, fontSize: "18px", textDecoration: "none", padding: "18px 30px", borderRadius: "14px", boxShadow: "0 10px 34px rgba(var(--acc-rgb,163,230,53),.35)" }}>Sumar mi estacionamiento</Link>
            <Link to="/admin" style={{ border: "1.5px solid rgba(var(--fg-rgb,255,255,255),.2)", color: "var(--tx,#FFFFFF)", fontWeight: 700, fontSize: "18px", textDecoration: "none", padding: "17px 28px", borderRadius: "14px" }}>Ir al panel de administración</Link>
          </div>
        </div>
      </section>



      <footer style={{ background: "#03050A", borderTop: "1px solid rgba(var(--fg-rgb,255,255,255),0.07)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "64px 24px 28px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "40px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}><img src={logoIcon} alt="" style={{ width: "44px", height: "44px" }} /><span style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "0.06em" }}>PARKIA</span></div>
              <p style={{ margin: "0", fontSize: "16px", lineHeight: "1.6", color: "var(--tx2,#9AA6BA)", maxWidth: "300px" }}>Encontrá, compará y reservá estacionamiento antes de salir.</p>
              <span style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "15px", color: "var(--acc,#A3E635)" }}><span style={{ width: "8px", height: "8px", borderRadius: "99px", background: "var(--acc,#A3E635)", boxShadow: "0 0 10px var(--acc,#A3E635)" }}></span>Reserva confirmada al instante</span>
            </div>
            <nav aria-label="Conductores" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <h4 style={{ margin: "0 0 4px 0", fontSize: "17px", fontWeight: 800, color: "var(--tx,#FFFFFF)" }}>Conductores</h4>
              <Link to="/search" style={{ color: "var(--tx2,#9AA6BA)", textDecoration: "none", fontSize: "16px" }}>Buscar estacionamiento</Link>
              <Link to="/my-reservations" style={{ color: "var(--tx2,#9AA6BA)", textDecoration: "none", fontSize: "16px" }}>Mis reservas</Link>
              <Link to="/favorites" style={{ color: "var(--tx2,#9AA6BA)", textDecoration: "none", fontSize: "16px" }}>Mis favoritos</Link>
              <a href="#como-funciona" style={{ color: "var(--tx2,#9AA6BA)", textDecoration: "none", fontSize: "16px" }}>Cómo funciona</a>
              <Link to="/nosotros" style={{ color: "var(--tx2,#9AA6BA)", textDecoration: "none", fontSize: "16px" }}>Nosotros</Link>
              <Link to="/contacto" style={{ color: "var(--tx2,#9AA6BA)", textDecoration: "none", fontSize: "16px" }}>Contacto</Link>
            </nav>
            <nav aria-label="Dueños y garajes" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <h4 style={{ margin: "0 0 4px 0", fontSize: "17px", fontWeight: 800, color: "var(--tx,#FFFFFF)" }}>Dueños y garajes</h4>
              <Link to="/admin" style={{ color: "var(--tx2,#9AA6BA)", textDecoration: "none", fontSize: "16px" }}>Panel de control</Link>
              <Link to="/admin/parkings" style={{ color: "var(--tx2,#9AA6BA)", textDecoration: "none", fontSize: "16px" }}>Administrar garajes</Link>
              <Link to="/admin/spaces" style={{ color: "var(--tx2,#9AA6BA)", textDecoration: "none", fontSize: "16px" }}>Monitoreo de plazas</Link>
              <Link to="/register" style={{ color: "var(--tx2,#9AA6BA)", textDecoration: "none", fontSize: "16px" }}>Sumar mi estacionamiento</Link>
            </nav>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <h4 style={{ margin: "0 0 4px 0", fontSize: "17px", fontWeight: 800, color: "var(--tx,#FFFFFF)" }}>Garantía Parkia</h4>
              <span style={{ display: "flex", gap: "10px", fontSize: "15px", lineHeight: "1.5", color: "var(--tx2,#9AA6BA)" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ stroke: "var(--acc,#A3E635)", flexShrink: 0 }}><path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6z" /></svg>Garajes verificados y monitoreo 24/7</span>
              <span style={{ display: "flex", gap: "10px", fontSize: "15px", lineHeight: "1.5", color: "var(--tx2,#9AA6BA)" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ stroke: "var(--acc,#A3E635)", flexShrink: 0 }}><path d="M13 3 5 14h6l-1 7 8-11h-6z" /></svg>Confirmación instantánea con código único</span>
              <span style={{ display: "flex", gap: "10px", fontSize: "15px", lineHeight: "1.5", color: "var(--tx2,#9AA6BA)" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ stroke: "var(--acc,#A3E635)", flexShrink: 0 }}><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></svg>Acceso rápido desde el móvil sin ticket físico</span>
            </div>
          </div>
          <div style={{ marginTop: "48px", paddingTop: "24px", borderTop: "1px solid rgba(var(--fg-rgb,255,255,255),.07)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "14px", fontSize: "14px", color: "var(--tx3,#6F7C93)" }}>
            <span>© {new Date().getFullYear()} Parkia. Proyecto Fundación Pescar.</span>
            <nav aria-label="Legales" style={{ display: "flex", flexWrap: "wrap", gap: "22px" }}><span style={{ color: "var(--tx3,#8A96AB)", textDecoration: "none" }}>Privacidad</span><span style={{ color: "var(--tx3,#8A96AB)", textDecoration: "none" }}>Términos y condiciones</span><Link to="/contacto" style={{ color: "var(--tx3,#8A96AB)", textDecoration: "none" }}>Contacto</Link></nav>
          </div>
        </div>
      </footer>
      {selectedBookingParking && (
        <BookingModal isOpen={!!selectedBookingParking} onClose={() => setSelectedBookingParking(null)} parking={selectedBookingParking} />
      )}
    </div>
  );
};

export default LandingPage;
