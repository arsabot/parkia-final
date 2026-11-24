import React, { useState } from 'react';
import './nosotros/nosotros.css';
import './contacto/contacto.css';
import logoIcon from '../assets/landing/parkia-icono.png'

/**
 * Página "Contacto".
 * El formulario valida y envía el mensaje con Web3Forms al correo del equipo
 * (necesita VITE_WEB3FORMS_KEY en el .env; sin la clave muestra un aviso en vez de fingir el envío).
 * Usa los mismos colores que la página Nosotros (claro por defecto, oscuro con la clase "dark").
 */

type Rol = 'conductor' | 'garaje' | 'otro';

const ROLES: { id: Rol; label: string }[] = [
  { id: 'conductor', label: 'Conductor' },
  { id: 'garaje', label: 'Dueño de garaje' },
  { id: 'otro', label: 'Otro' },
];

// Redes de Parkia. "url" vacío = todavía no existe la cuenta (se muestra apagada).
// Para activar una, completar su url.
const REDES: { id: string; nombre: string; url: string; fill?: boolean; path: React.ReactNode }[] = [
  { id: 'instagram', nombre: 'Instagram', url: 'https://www.instagram.com/parkia.app/', path: (<><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" /></>) },
  { id: 'facebook', nombre: 'Facebook', url: '', path: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /> },
  { id: 'x', nombre: 'X', url: '', fill: true, path: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /> },
  { id: 'linkedin', nombre: 'LinkedIn', url: '', path: (<><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></>) },
];

// Clave pública de Web3Forms (se genera en web3forms.com con el correo del equipo). Va en .env como VITE_WEB3FORMS_KEY.
const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY as string | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MailIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);
const TickIcon: React.FC = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const ContactoPage: React.FC = () => {
  const [rol, setRol] = useState<Rol>('conductor');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [plazas, setPlazas] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [falloEnvio, setFalloEnvio] = useState('');

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!nombre.trim()) err.nombre = 'Ingresá tu nombre';
    if (!EMAIL_RE.test(correo.trim())) err.correo = 'Ingresá un correo válido';
    if (rol === 'garaje' && plazas !== '' && Number(plazas) < 1) err.plazas = 'Ingresá un número mayor a 0';
    if (mensaje.trim().length < 10) err.mensaje = 'Contanos un poco más (mínimo 10 caracteres)';
    setErrores(err);
    if (Object.keys(err).length > 0) return;

    setFalloEnvio('');
    if (!WEB3FORMS_KEY) {
      setFalloEnvio('El envío todavía no está configurado. Escribinos a equipoparkia@gmail.com.');
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: `Contacto Parkia – ${ROLES.find((r) => r.id === rol)?.label}`,
          from_name: 'Parkia – Formulario de contacto',
          name: nombre.trim(),
          email: correo.trim(),
          telefono: telefono.trim() || '—',
          rol: ROLES.find((r) => r.id === rol)?.label,
          ...(rol === 'garaje' && plazas !== '' ? { plazas } : {}),
          message: mensaje.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) setEnviado(true);
      else setFalloEnvio('No pudimos enviar tu mensaje. Probá de nuevo o escribinos a equipoparkia@gmail.com.');
    } catch {
      setFalloEnvio('No pudimos enviar tu mensaje. Revisá tu conexión o escribinos a equipoparkia@gmail.com.');
    } finally {
      setEnviando(false);
    }
  };

  // Abre el asistente flotante (ChatWidget) sin modificarlo: toca su botón si está cerrado.
  const abrirBot = () => {
    const fab = document.getElementById('pk-fab');
    if (fab && fab.getAttribute('aria-expanded') !== 'true') fab.click();
  };

  const reiniciar = () => {
    setNombre(''); setTelefono(''); setCorreo(''); setPlazas(''); setMensaje('');
    setRol('conductor'); setErrores({}); setEnviado(false); setFalloEnvio('');
  };

  const campoErr = (k: string) => (errores[k] ? { 'aria-invalid': true, 'aria-describedby': `pkc-${k}-err` } as const : {});
  const msgErr = (k: string) => errores[k] ? <p id={`pkc-${k}-err`} className="pkc-err" role="alert">{errores[k]}</p> : null;

  return (
    <div className="pkn-root">
      <section className="pkn-hero">
        <div aria-hidden="true" className="pkn-gridbg" />
        <div className="pkn-fadeb" aria-hidden="true" />
        <div className="pkn-head pkn-load">
          <span className="pkn-pill"><i />Contacto</span>
          <h1 className="pkn-h1">Hablemos</h1>
          <p className="pkn-sub">Completá tus datos y te contactaremos.</p>
        </div>

        <div className="pkc-wrap">
          <div className="pkc-card pkn-load" style={{ ['--d' as string]: '.15s' }}>
            {enviado ? (
              <div className="pkc-ok" role="status">
                <div className="pkc-tick"><TickIcon /></div>
                <h2>Recibimos tu mensaje</h2>
                <p>Gracias por escribirnos, {nombre.trim().split(' ')[0]}. Te vamos a responder a {correo.trim()}.</p>
                <button type="button" className="pkc-btn" onClick={reiniciar}>Enviar otro mensaje</button>
              </div>
            ) : (
              <>
                <h2>Escribinos</h2>
                <p className="pkc-lead">Contanos quién sos y en qué te podemos ayudar.</p>
                <form className="pkc-form" onSubmit={enviar} noValidate>
                  <fieldset className="pkc-field">
                    <legend className="pkc-label">Soy</legend>
                    <div className="pkc-seg">
                      {ROLES.map((r) => (
                        <label key={r.id}>
                          <input type="radio" name="rol" value={r.id} checked={rol === r.id} onChange={() => setRol(r.id)} />
                          <span>{r.label}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div className="pkc-field">
                    <label className="pkc-label" htmlFor="pkc-nombre">Nombre</label>
                    <input id="pkc-nombre" className="pkc-input" type="text" autoComplete="name" placeholder="Tu nombre y apellido" value={nombre} onChange={(e) => setNombre(e.target.value)} {...campoErr('nombre')} />
                    {msgErr('nombre')}
                  </div>

                  <div className="pkc-two">
                    <div className="pkc-field">
                      <label className="pkc-label" htmlFor="pkc-correo">Correo electrónico</label>
                      <input id="pkc-correo" className="pkc-input" type="email" autoComplete="email" placeholder="nombre@correo.com" value={correo} onChange={(e) => setCorreo(e.target.value)} {...campoErr('correo')} />
                      {msgErr('correo')}
                    </div>
                    <div className="pkc-field">
                      <label className="pkc-label" htmlFor="pkc-tel">Teléfono (opcional)</label>
                      <input id="pkc-tel" className="pkc-input" type="tel" autoComplete="tel" placeholder="11 1234 5678" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                    </div>
                  </div>

                  {rol === 'garaje' && (
                    <div className="pkc-field pkn-in">
                      <label className="pkc-label" htmlFor="pkc-plazas">Cantidad de plazas</label>
                      <input id="pkc-plazas" className="pkc-input" type="number" inputMode="numeric" min={1} placeholder="Ej.: 25" value={plazas} onChange={(e) => setPlazas(e.target.value)} {...campoErr('plazas')} />
                      {msgErr('plazas')}
                    </div>
                  )}

                  <div className="pkc-field">
                    <label className="pkc-label" htmlFor="pkc-msg">Mensaje</label>
                    <textarea id="pkc-msg" className="pkc-input" placeholder="Contanos qué necesitás" value={mensaje} onChange={(e) => setMensaje(e.target.value)} {...campoErr('mensaje')} />
                    {msgErr('mensaje')}
                  </div>

                  {falloEnvio && <p className="pkc-err" role="alert">{falloEnvio}</p>}
                  <button type="submit" className="pkc-btn" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar mensaje'}</button>
                </form>
              </>
            )}
          </div>

          <div className="pkc-col pkn-load" style={{ ['--d' as string]: '.3s' }}>
          <div className="pkc-card pkc-bot">
            <img className="pkc-bot-av" src={logoIcon} alt="" />
            <div>
              <h2>¿Consultas rápidas?</h2>
              <p>ParkIA, el asistente de Parkia, está en línea las 24 horas.</p>
              <button type="button" className="pkc-link" onClick={abrirBot}>Hablar con ParkIA →</button>
            </div>
          </div>
          <aside className="pkc-card pkc-side">
            <h2>Datos de contacto</h2>
            <div className="pkc-item">
              <div className="pkc-ico"><MailIcon /></div>
              <div>
                <b>Correo</b>
                <a href="mailto:equipoparkia@gmail.com">equipoparkia@gmail.com</a>
                <p>¿Dudas o sugerencias? Escribinos.</p>
              </div>
            </div>
          </aside>
          <section className="pkc-card pkc-side">
            <h2>Seguinos en nuestras redes</h2>
            <div className="pkc-redes">
              {REDES.map((r) => {
                const svg = (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill={r.fill ? 'currentColor' : 'none'} stroke={r.fill ? 'none' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{r.path}</svg>
                );
                return r.url ? (
                  <a key={r.id} className="pkc-red" href={r.url} target="_blank" rel="noopener noreferrer" aria-label={r.nombre} title={r.nombre}>{svg}</a>
                ) : (
                  <span key={r.id} className="pkc-red pkc-red-off" role="img" aria-label={`${r.nombre} (próximamente)`} title={`${r.nombre} (próximamente)`}>{svg}</span>
                );
              })}
            </div>
          </section>
          </div>

        </div>
      </section>
    </div>
  );
};

export default ContactoPage;
