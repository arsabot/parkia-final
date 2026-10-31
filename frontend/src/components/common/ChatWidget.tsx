import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import type { Parking } from '../../types';
import { parkingService } from '../../services/parkingService';
import { reservationService } from '../../services/reservationService';
import { createClaim, getClaim, listClaims } from '../../services/chatbotApi';
import logo from '../../assets/parkia-chat-logo.png';
import './chatWidget.css';

type Msg = { id: number; from: 'bot' | 'user' | 'typing'; text: string };
type Step = 'cat' | 'res' | 'desc' | 'cont' | 'conf';
type Flow = { step: Step; cat?: string; res?: string; desc?: string; cont?: string };

const MAIN = ['Cómo reservar', 'Problemas con un pago', 'Presentar un reclamo', 'Ver mi reclamo', 'Preguntas frecuentes', 'Hablar con una persona'];
const FAQS: Array<[string, string]> = [
  ['🔍', '¿Cómo buscar y reservar un lugar?'],
  ['💳', '¿Cómo pagar con Mercado Pago?'],
  ['📱', '¿Cómo ingreso con el código QR?'],
  ['⏰', '¿Qué pasa si llego antes o después?'],
  ['❌', '¿Cómo cancelar y pedir reembolso?'],
  ['⚡', '¿Hay cocheras con carga eléctrica o techadas?'],
  ['🏢', '¿Cómo registro mi estacionamiento en Parkia?'],
  ['🅿️', 'Ver garages y tarifas'],
  ['📞', '¿Cómo hablo con soporte humano?'],
];
const PAGO = ['Cobro duplicado', 'Pago rechazado', 'No recibí el comprobante', 'Reembolso', 'Menú'];
const CATS = ['Pago', 'Reserva', 'Garage o servicio', 'App o web', 'Otro', 'Cancelar'];
const STATES = ['Recibido', 'En revisión', 'Resuelto'];

// Tu API pagina las listas ({ results: [...] }) en algunos casos: esto soporta ambos formatos.
const asList = <T,>(r: T[] | { results?: T[] }): T[] => (Array.isArray(r) ? r : (r.results ?? []));

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
const money = (n: number) => '$' + n.toLocaleString('es-AR');

export function ChatWidget() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [chips, setChips] = useState<string[]>([]);
  const [text, setText] = useState('');
  const flow = useRef<Flow | null>(null);
  const waiting = useRef(false);
  const started = useRef(false);
  const uid = useRef(0);
  const gen = useRef(0);
  const prevUser = useRef<number | null>(user?.id ?? null);
  const listRef = useRef<HTMLDivElement>(null);

  const userMail = user?.email;

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, open]);

  // Al cerrar sesión (o entrar con otro usuario) se borra toda la conversación.
  useEffect(() => {
    const cur = user?.id ?? null;
    if (prevUser.current !== null && prevUser.current !== cur) {
      gen.current += 1;
      flow.current = null;
      waiting.current = false;
      started.current = false;
      setMsgs([]);
      setChips([]);
      setText('');
      setOpen(false);
    }
    prevUser.current = cur;
  }, [user?.id]);

  // El asistente es para conductores: no se muestra en el panel de administración.
  if (pathname.startsWith('/admin')) return null;

  const bot = (html: string, c: string[] = MAIN) => {
    const id = ++uid.current;
    const g = gen.current;
    setChips([]);
    setMsgs((m) => [...m, { id, from: 'typing', text: '' }]);
    window.setTimeout(() => {
      if (g !== gen.current) return;
      setMsgs((m) => m.map((x) => (x.id === id ? { ...x, from: 'bot', text: html } : x)));
      setChips(c);
    }, 600);
  };

  const R = {
    reservar: () =>
      bot(
        'Reservar en PARKIA es muy simple:<ol class="steps"><li><div><b>Buscá</b><br>Ingresá a dónde vas o usá tu ubicación.</div></li><li><div><b>Compará y elegí</b><br>Mirá tarifas y disponibilidad en tiempo real.</div></li><li><div><b>Reservá y pagá</b><br>Confirmá y recibí tu código de acceso en <b>Mis Reservas</b>.</div></li></ol>',
        ['Tarifas y garages', 'Cancelar o modificar', 'Menú'],
      ),
    pagos: () => bot('Lamento que hayas tenido un problema con tu pago. ¿Qué te pasó?', PAGO),
    doble: () => bot('Si ves dos cargos por la misma reserva, uno suele ser una <b>retención temporal</b> del banco que se libera en <b>3 a 5 días hábiles</b>. Si pasado ese plazo sigue duplicado, lo reintegramos.', ['Presentar un reclamo', 'Hablar con una persona', 'Menú']),
    rechazo: () => bot('Un pago rechazado suele deberse a <b>fondos insuficientes</b>, límite de compra online o datos mal ingresados. Probá con otra tarjeta o con Mercado Pago. Tu lugar se mantiene reservado por <b>10 minutos</b>.', ['Presentar un reclamo', 'Cómo reservar', 'Menú']),
    comp: () => bot('El comprobante llega por email al confirmar el pago. También podés descargarlo desde <b>Mis Reservas</b> ➜ detalle de la reserva. Revisá la carpeta de spam.', ['Presentar un reclamo', 'Menú']),
    reemb: () => bot('Cancelando hasta <b>1 hora antes</b>, el reembolso es total y se acredita en <b>5 a 10 días hábiles</b> según tu banco. Fuera de ese plazo se evalúa caso por caso desde un reclamo.', ['Presentar un reclamo', 'Cancelar o modificar', 'Menú']),
    cancel: () => bot('Desde <b>Mis Reservas</b> podés cancelar o modificar el horario.<div class="card"><b>Cancelación gratuita</b><span>Hasta 1 hora antes del ingreso.</span></div><div class="card"><b>Modificación</b><span>Para cambiar el horario, cancelá y creá una nueva reserva (sujeta a disponibilidad).</span></div>', ['Problemas con un pago', 'Presentar un reclamo', 'Menú']),
    tarifas: () => void showGarages(),
    humano: () => bot('Te paso con una persona del equipo. Atienden <b>lunes a viernes de 8 a 20 h</b> en soporte@parkia.example. Fuera de horario, tu consulta queda registrada y la responden al iniciar el día. Podés adelantar el trámite con un reclamo.', ['Presentar un reclamo', 'Menú']),
  };

  const needLogin = () =>
    bot('Para presentar o consultar un reclamo necesitás iniciar sesión: así queda asociado a tu cuenta y solo vos podés verlo.', ['Iniciar sesión', 'Menú']);

  const showGarages = async () => {
    setChips([]);
    try {
      const list = asList(await parkingService.getParkings({ sort_by: 'recommended' })).filter((x) => x.is_active).slice(0, 4);
      if (!list.length) return bot('No encontré garages disponibles en este momento.', ['Cómo reservar', 'Menú']);
      const cards = list
        .map((x) => {
          const pct = x.total_spaces ? Math.round((x.available_spaces / x.total_spaces) * 100) : 0;
          const c = x.available_spaces === 0 ? '#e5484d' : pct < 20 ? '#f5a524' : '#36c9a0';
          return `<div class="card"><div class="row"><b>${esc(x.name)}</b><b>${money(Number(x.price_per_hour))}/h</b></div><span>${esc(x.address)} · ${x.available_spaces} de ${x.total_spaces} lugares libres${x.is_24_hours ? ' · 24 h' : ''}</span><div class="bar"><i style="width:${pct}%;background:${c}"></i></div></div>`;
        })
        .join('');
      bot('Disponibilidad en tiempo real de nuestros garages:' + cards, ['Cómo reservar', 'Menú']);
    } catch {
      bot('No pude consultar la disponibilidad en este momento. Probá de nuevo o buscá desde la página principal.', ['Cómo reservar', 'Menú']);
    }
  };

  const askReservation = async (cat: string) => {
    setChips([]);
    let codes: string[] = [];
    let cards = '';
    try {
      const last = asList(await reservationService.getReservations()).slice(0, 4);
      codes = last.map((r) => r.booking_code);
      cards = last.map((r) => `<div class="card"><b>${esc(r.booking_code)}</b><span>${esc(r.parking_name)} · ${esc(r.date)}</span></div>`).join('');
    } catch {
      // Si falla, se pide el código escrito a mano.
    }
    const ask = codes.length ? 'Elegí la reserva sobre la que es tu reclamo:' + cards : 'Indicame el <b>código de tu reserva</b> (lo ves en Mis Reservas) o elegí si no lo tenés.';
    bot(`Categoría: <b>${cat}</b>. ${ask}`, [...codes, 'No lo tengo', 'Cancelar']);
  };

  const faqMenu = () =>
    bot(
      'Elegí una pregunta frecuente o escribí tu consulta abajo:' +
        FAQS.map(([i, q]) => `<button type="button" class="faq" data-q="${q}"><span>${i}</span>${q}</button>`).join(''),
      ['Menú'],
    );

  const showAmenities = async () => {
    setChips([]);
    try {
      const [ev, cov] = await Promise.all([parkingService.getParkings({ has_ev_charging: true }), parkingService.getParkings({ is_covered: true })]);
      const block = (title: string, items: Parking[]) =>
        `<b>${title}</b>` +
        (items.length
          ? items.slice(0, 3).map((x) => `<div class="card"><b>${esc(x.name)}</b><span>${esc(x.address)} · ${x.available_spaces} lugares libres</span></div>`).join('')
          : '<div class="card"><span>Por ahora no hay garages con este servicio.</span></div>');
      bot(
        block('⚡ Con carga eléctrica', asList(ev).filter((x) => x.is_active && x.has_ev_charging)) + '<br>' + block('🏠 Techadas', asList(cov).filter((x) => x.is_active && x.is_covered)) + '<br>Para ver más, usá los filtros en <b>Buscar</b>.',
        ['Preguntas frecuentes', 'Menú'],
      );
    } catch {
      bot('No pude consultar los garages en este momento. Probá con los filtros de <b>Buscar</b> (techada, carga eléctrica, seguridad).', ['Preguntas frecuentes', 'Menú']);
    }
  };

  const A = {
    mp: () => bot('Para pagar con <b>Mercado Pago</b>:<ol class="steps"><li><div>Elegí tu garage, día y horario, y cargá los datos de tu vehículo.</div></li><li><div>Seleccioná <b>Mercado Pago</b> como medio de pago.</div></li><li><div>Completá el pago en la pantalla segura de Mercado Pago y volvés a PARKIA.</div></li></ol>El estado de tu pago (<b>Pendiente</b>, <b>Pagado</b> o <b>Reintegrado</b>) lo ves en <b>Mis Reservas</b>.', ['Problemas con un pago', 'Preguntas frecuentes', 'Menú']),
    qr: () => bot('<b>Ingresar con el código QR</b><ol class="steps"><li><div>Abrí <b>Mis Reservas</b> y entrá al detalle de tu reserva.</div></li><li><div>Mostrá el <b>código QR</b> al personal del garage cuando llegues.</div></li><li><div>Lo escanean, validan tu reserva y registran tu <b>entrada</b>; al salir se registra la <b>salida</b>.</div></li></ol>Si el QR no se valida, mostrá el código de tu reserva o llamá al garage (el teléfono está en el detalle).', ['Preguntas frecuentes', 'Menú']),
    timing: () => bot('Tu reserva tiene un horario de <b>inicio y fin</b>.<div class="card"><b>Si llegás antes</b><span>El lugar puede no estar libre todavía: conviene esperar al horario reservado o consultar con el garage.</span></div><div class="card"><b>Si te pasás del horario</b><span>El tiempo extra puede tener un cargo adicional según la tarifa por hora del garage.</span></div>Si vas a llegar tarde, llamá al garage (teléfono en el detalle de tu reserva) o cancelá y creá una nueva desde <b>Mis Reservas</b>.', ['Cancelar o modificar', 'Preguntas frecuentes', 'Menú']),
    cancel: () => bot('<b>Cancelar una reserva</b><ol class="steps"><li><div>Entrá a <b>Mis Reservas</b> y abrí la reserva.</div></li><li><div>Tocá <b>Cancelar</b> e indicá el motivo.</div></li><li><div>Si ya pagaste y corresponde, el pago pasa a estado <b>Reintegrado</b>.</div></li></ol>La cancelación es gratuita hasta <b>1 hora antes</b> del ingreso y el reembolso se acredita en <b>5 a 10 días hábiles</b> según tu banco.', ['Presentar un reclamo', 'Preguntas frecuentes', 'Menú']),
    owner: () => bot('<b>Registrar tu estacionamiento en PARKIA</b><ol class="steps"><li><div>Creá tu cuenta como <b>propietario</b> desde <b>Registrarse</b>.</div></li><li><div>Escribinos a soporte@parkia.example con los datos del garage: nombre, dirección, capacidad, tarifas y horarios.</div></li><li><div>El equipo da de alta tu estacionamiento y desde tu panel administrás lugares y reservas.</div></li></ol>', ['Hablar con una persona', 'Preguntas frecuentes', 'Menú']),
    amenities: () => void showAmenities(),
  };

  // Respuesta exacta de cada pregunta frecuente (botones del menú).
  const F: Record<string, () => void> = {
    '¿Cómo buscar y reservar un lugar?': () => R.reservar(),
    '¿Cómo pagar con Mercado Pago?': () => A.mp(),
    '¿Cómo ingreso con el código QR?': () => A.qr(),
    '¿Qué pasa si llego antes o después?': () => A.timing(),
    '¿Cómo cancelar y pedir reembolso?': () => A.cancel(),
    '¿Hay cocheras con carga eléctrica o techadas?': () => A.amenities(),
    '¿Cómo registro mi estacionamiento en Parkia?': () => A.owner(),
    'Ver garages y tarifas': () => R.tarifas(),
    '¿Cómo hablo con soporte humano?': () => R.humano(),
  };

  const expired = () => bot('Tu sesión venció. Iniciá sesión de nuevo y retomamos desde acá.', ['Iniciar sesión', 'Menú']);

  const startClaim = () => {
    if (!user) return needLogin();
    flow.current = { step: 'cat' };
    bot('Lamento el inconveniente. Voy a ayudarte a registrarlo. <b>¿Sobre qué es tu reclamo?</b>', CATS);
  };

  const submitClaim = async (f: Flow) => {
    try {
      const { codigo } = await createClaim({ categoria: f.cat ?? '', reserva: f.res ?? '', descripcion: f.desc ?? '', contacto: f.cont ?? '' });
      flow.current = null;
      bot(`<span class="ok">✓ Reclamo registrado</span><div class="code">${esc(codigo)}</div>Respondemos en hasta <b>48 horas hábiles</b>. Guardá este número para consultar el estado cuando quieras.`, ['Ver mi reclamo', 'Menú']);
    } catch {
      if (!authService.isAuthenticated()) return expired();
      bot('No pude registrar tu reclamo en este momento. Probá de nuevo en unos minutos o escribinos a soporte@parkia.example.', ['Enviar reclamo', 'Cancelar']);
    }
  };

  const flowStep = (raw: string) => {
    const t = norm(raw).trim();
    const f = flow.current;
    if (!f) return;
    if (/^(cancelar|salir|volver|menu)/.test(t)) {
      flow.current = null;
      return bot('Listo, cancelé el trámite. ¿En qué más puedo ayudarte?');
    }
    if (f.step === 'cat') {
      const c = CATS.slice(0, 5).find((x) => t.includes(norm(x).split(' ')[0]));
      if (!c) return bot('Elegí una de las categorías:', CATS);
      f.cat = c;
      f.step = 'res';
      return void askReservation(c);
    }
    if (f.step === 'res') {
      if (/no (lo )?(tengo|se)|^no$/.test(t)) f.res = 'Sin dato';
      else {
        const ref = raw.toUpperCase().trim();
        if (!/^[A-Z0-9-]{4,20}$/.test(ref)) return bot('Ese código no parece válido. Lo encontrás en <b>Mis Reservas</b>.', ['No lo tengo', 'Cancelar']);
        f.res = ref;
      }
      f.step = 'desc';
      return bot('Contame qué ocurrió, con el mayor detalle posible (mínimo 10 caracteres).', ['Cancelar']);
    }
    if (f.step === 'desc') {
      if (raw.trim().length < 10) return bot('Necesito un poco más de detalle para poder ayudarte. Contame qué pasó.', ['Cancelar']);
      f.desc = raw.trim().slice(0, 500);
      f.step = 'cont';
      return bot('¿A qué <b>email o teléfono</b> te enviamos el seguimiento?', userMail ? [userMail, 'Cancelar'] : ['Cancelar']);
    }
    if (f.step === 'cont') {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw.trim()) || raw.replace(/\D/g, '').length >= 8;
      if (!ok) return bot('Ingresá un email válido (nombre@correo.com) o un teléfono de al menos 8 dígitos.', ['Cancelar']);
      f.cont = raw.trim();
      f.step = 'conf';
      return bot(`Revisá tu reclamo:<div class="card"><b>${f.cat} · ${f.res}</b><span>${esc(f.desc ?? '')}</span><span style="display:block;margin-top:4px">Contacto: ${esc(f.cont)}</span></div>¿Lo envío?`, ['Enviar reclamo', 'Cancelar']);
    }
    if (/enviar|confirm|^si|dale|ok/.test(t)) return void submitClaim(f);
    bot('Elegí <b>Enviar reclamo</b> o <b>Cancelar</b>.', ['Enviar reclamo', 'Cancelar']);
  };

  const showClaims = async () => {
    if (!user) return needLogin();
    try {
      const list = await listClaims();
      if (list.length === 0) return bot('Todavía no registraste ningún reclamo.', ['Presentar un reclamo', 'Menú']);
      waiting.current = true;
      bot('Estos son tus últimos reclamos. Elegí uno o escribí su número.', [...list.slice(0, 5).map((c) => c.codigo), 'Menú']);
    } catch {
      if (!authService.isAuthenticated()) return expired();
      bot('No pude consultar tus reclamos en este momento. Intentá de nuevo en unos minutos.', ['Ver mi reclamo', 'Hablar con una persona']);
    }
  };

  const lookup = async (raw: string) => {
    waiting.current = false;
    if (!user) return needLogin();
    const d = raw.match(/rc-?\s?(\d{4})-?\s?(\d{5})/i);
    if (!d) return bot('No reconozco ese formato. Debe verse así: <b>RC-2026-10482</b>.', ['Ver mi reclamo', 'Menú']);
    const code = `RC-${d[1]}-${d[2]}`;
    try {
      const r = await getClaim(code);
      if (!r) return bot(`No encontré el reclamo <b>${code}</b>. Verificá el número e intentá de nuevo.`, ['Ver mi reclamo', 'Hablar con una persona']);
      const tl = STATES.map((s, i) => `<li class="${i <= r.estado ? 'd' : ''}"><i>${i <= r.estado ? '✓' : ''}</i>${s}</li>`).join('');
      bot(`<div class="card"><div class="row"><b>${esc(r.codigo)}</b><span>${esc(r.fecha)}</span></div><span>Categoría: ${esc(r.categoria)}</span><ul class="tl">${tl}</ul><span>${esc(r.respuesta)}</span></div>`, ['Hablar con una persona', 'Menú']);
    } catch {
      if (!authService.isAuthenticated()) return expired();
      bot('No pude consultar el reclamo en este momento. Intentá de nuevo en unos minutos.', ['Ver mi reclamo', 'Hablar con una persona']);
    }
  };

  const intent = (raw: string) => {
    const t = norm(raw);
    if (/^menu|inicio/.test(t)) {
      waiting.current = false;
      return bot('¿En qué más puedo ayudarte?');
    }
    if (waiting.current || /rc-?\s?\d{4}/.test(t)) return void lookup(raw);
    if (/preguntas frecuentes|^faq/.test(t)) return faqMenu();
    if (/\bqr\b/.test(t)) return A.qr();
    if (/llego (antes|despues|tarde|temprano)|antes o despues|retras/.test(t)) return A.timing();
    if (/electric|techad|cubiert/.test(t)) return A.amenities();
    if (/(registr|sumar|agregar|publicar).*(estacionamiento|cochera|garage)|propietario|duen/.test(t)) return A.owner();
    if (/como pagar|mercado pago/.test(t)) return A.mp();
    if (/como reserv|reservar|reserva/.test(t) && !/problema|cancel|modific|reclamo/.test(t)) return R.reservar();
    if (/doble|dos veces|duplic/.test(t)) return R.doble();
    if (/rechaz/.test(t)) return R.rechazo();
    if (/comprobante|factura/.test(t)) return R.comp();
    if (/reembolso|devol/.test(t)) return R.reemb();
    if (/pago|cobr|tarjeta|mercado/.test(t)) return R.pagos();
    if (/ver mi reclamo|estado|seguimiento|consultar/.test(t)) return void showClaims();
    if (/reclamo|queja|denuncia|problema/.test(t)) return startClaim();
    if (/cancel|modific|cambiar/.test(t)) return R.cancel();
    if (/tarifa|precio|cuesta|garage|disponib|lugar/.test(t)) return R.tarifas();
    if (/persona|humano|asesor|agente|ayuda/.test(t)) return R.humano();
    if (/gracias|genial|perfecto/.test(t)) return bot('¡De nada! Que tengas un excelente día 🚗', ['Menú']);
    if (/hola|buen(a|o)s|que tal/.test(t)) return bot('¡Hola! Soy el asistente virtual de ParkIA 👋 ¿En qué puedo ayudarte?');
    bot('No estoy seguro de haber entendido. Elegí una opción del menú o escribime con otras palabras; si preferís, te paso con una persona.');
  };

  const send = (x: string) => {
    const v = x.trim();
    if (!v) return;
    if (v === 'Iniciar sesión') {
      setOpen(false);
      navigate('/login');
      return;
    }
    setMsgs((m) => [...m, { id: ++uid.current, from: 'user', text: v }]);
    if (flow.current) return flowStep(v);
    if (F[v]) return F[v]();
    intent(v);
  };

  const openChat = () => {
    setOpen(true);
    if (!started.current) {
      started.current = true;
      bot(`¡Hola${user ? ', ' + esc(user.first_name) : ''}! Soy el asistente virtual de ParkIA 👋<br>¿En qué puedo ayudarte?`);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(text);
    setText('');
  };

  return (
    <div id="pk-root">
      <button id="pk-fab" className={open ? '' : 'show'} onClick={openChat} aria-label="Abrir asistente">
        💬<em />
      </button>
      <section id="pk-chat" className={`chat${open ? '' : ' hide'}`} aria-label="Asistente ParkIA">
        <div className="head">
          <div className="av">
            <img src={logo} alt="PARKIA" />
          </div>
          <div>
            <b>ParkIA · Asistente</b>
            <small>● Consultas y recepción de reclamos · 24 h</small>
          </div>
          <button className="x" onClick={() => setOpen(false)} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div
          id="pk-msgs"
          ref={listRef}
          aria-live="polite"
          onClick={(e) => {
            const q = (e.target as HTMLElement).closest('[data-q]')?.getAttribute('data-q');
            if (q && !flow.current) send(q);
          }}
        >
          {msgs.map((m) =>
            m.from === 'typing' ? (
              <div key={m.id} className="m b typing">
                <i />
                <i />
                <i />
              </div>
            ) : m.from === 'user' ? (
              <div key={m.id} className="m u">
                {m.text}
              </div>
            ) : (
              // Todo valor ingresado por el usuario se escapa con esc() antes de llegar acá.
              <div key={m.id} className="m b" dangerouslySetInnerHTML={{ __html: m.text }} />
            ),
          )}
        </div>
        <div id="pk-chips">
          {chips.map((c) => (
            <button key={c} type="button" onClick={() => send(c)}>
              {c}
            </button>
          ))}
        </div>
        <form id="pk-f" onSubmit={onSubmit}>
          <input id="pk-t" value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribí tu consulta…" autoComplete="off" aria-label="Mensaje" />
          <button className="send" aria-label="Enviar">
            ➤
          </button>
        </form>
        <div className="note">
          Respondemos los reclamos en hasta 48 h hábiles.
          <br />
          La atención humana depende del horario del equipo.
        </div>
      </section>
    </div>
  );
}
