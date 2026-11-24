import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { RoadSvg } from './nosotros/RoadSvg';
import './nosotros/nosotros.css';
import './contacto/contacto.css';

/**
 * Página "Nosotros" (¿Quiénes somos?, cultura y equipo).
 * - Colores: modo claro por defecto y modo oscuro con la clase "dark" en <html> (ThemeContext).
 * - Todo el CSS está en ./nosotros/nosotros.css bajo .pkn-root.
 * - Las fotos están en /public/nosotros.
 */

interface Member {
  nombre: string;
  rol: string;
  url: string;
  foto: string;
}

// Orden del anillo: arriba y en sentido de las agujas del reloj.
// Los roles quedan repartidos parejos a los dos lados (Backend, Frontend, Q/A).
const TEAM: Member[] = [
  { nombre: 'Rodrigo Saavedra', rol: 'Tech Lead', url: 'https://www.linkedin.com/in/rodrigo-saavedra-bb2629152/', foto: '/nosotros/equipo/rodrigo.jpg' },
  { nombre: 'Carolina Montaño', rol: 'Backend', url: 'https://www.linkedin.com/in/carolina-montano-786257268/', foto: '/nosotros/equipo/carolina.jpg' },
  { nombre: 'Florencia Melgarejo', rol: 'Frontend', url: 'https://www.linkedin.com/in/florenciamel/', foto: '/nosotros/equipo/florencia.jpg' },
  { nombre: 'Milagros Quinteros', rol: 'Q/A', url: 'https://www.linkedin.com/in/milagros-quinteros-78a367378/', foto: '/nosotros/equipo/milagros.jpg' },
  { nombre: 'Jennifer Pintos', rol: 'Backend', url: 'https://www.linkedin.com/in/jennifer-pintos-1a914223b/', foto: '/nosotros/equipo/jennifer.jpg' },
  { nombre: 'Priscila Torres', rol: 'Backend', url: 'https://www.linkedin.com/in/priscila-torres-82b30a253/', foto: '/nosotros/equipo/priscila.jpg' },
  { nombre: 'Iván Bogado', rol: 'Frontend', url: 'https://www.linkedin.com/in/ivan-bogado/', foto: '/nosotros/equipo/ivan.jpg' },
  { nombre: 'Mijail Arispe', rol: 'Backend', url: 'https://www.linkedin.com/in/mijail-braian-arispe-57801a220/', foto: '/nosotros/equipo/mijail.jpg' },
];

interface Value {
  titulo: string;
  texto: string;
  foto: string;
  pos: string;
  azul?: boolean;
}

const VALUES: Value[] = [
  { titulo: 'Simplicidad', texto: 'Creemos que estacionar no debería ser complicado. Buscamos simplificar cada paso para que encontrar un lugar sea rápido y sin vueltas.', foto: '/nosotros/valores/simplicidad.jpg', pos: '80% 40%' },
  { titulo: 'Inclusión', texto: 'Queremos construir una plataforma para todos: conductores, estacionamientos grandes y pequeños, y personas con distintas necesidades de accesibilidad.', foto: '/nosotros/valores/inclusion.jpg', pos: '88% 30%', azul: true },
  { titulo: 'Confianza', texto: 'La transparencia es fundamental. Trabajamos para que cada persona conozca los precios, horarios y disponibilidad antes de reservar.', foto: '/nosotros/valores/confianza.jpg', pos: '45% 40%', azul: true },
  { titulo: 'Compromiso con el ambiente', texto: 'Creemos que la tecnología también puede ayudar a construir ciudades más sustentables, reduciendo recorridos innecesarios y promoviendo acciones positivas.', foto: '/nosotros/valores/ambiente.jpg', pos: '60% 50%' },
  { titulo: 'Trabajo en equipo', texto: 'Creemos en el valor de las ideas compartidas. Escuchamos, colaboramos y aprendemos juntos para construir mejores soluciones.', foto: '/nosotros/valores/equipo.jpg', pos: '50% 40%' },
];

const HERO_TABS = ['¿Quiénes somos?', 'Nuestro propósito', 'Nuestra visión'];
const TEAM_TABS = ['Quiénes', 'Cuándo', 'Por qué'];

const Pill: React.FC<{ children: React.ReactNode; href?: string }> = ({ children, href }) => {
  const inner = (
    <>
      <i aria-hidden="true" />
      {children}
    </>
  );
  return href ? (
    <a className="pkn-pill" href={href}>{inner}</a>
  ) : (
    <span className="pkn-pill">{inner}</span>
  );
};

const B: React.FC<{ children: React.ReactNode }> = ({ children }) => <b className="pkn-b">{children}</b>;

export const NosotrosPage: React.FC = () => {
  const carRef = useRef<HTMLDivElement>(null);
  const mover = (dir: 1 | -1) => {
    const el = carRef.current;
    if (!el) return;
    const card = el.querySelector('.pkn-vc') as HTMLElement | null;
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 320) + 16), behavior: 'smooth' });
  };
  const [heroTab, setHeroTab] = useState(0);
  const [teamTab, setTeamTab] = useState(0);
  const [sel, setSel] = useState<number | null>(null);

  return (
    <div className="pkn-root">
      {/* ---------- Hero: Nosotros + pestañas ---------- */}
      <section className="pkn-hero">
        <div aria-hidden="true" className="pkn-gridbg" />
        <div aria-hidden="true" className="pkn-fadeb" />
        <div className="pkn-head">
          <span className="pkn-load"><Pill>Quiénes somos</Pill></span>
          <h1 className="pkn-h1 pkn-load" style={{ ['--d' as string]: '.08s' }}>Nosotros</h1>
          <p className="pkn-sub pkn-load" style={{ ['--d' as string]: '.16s' }}>
            Conocé a quienes impulsan <b>PARKIA</b>.
          </p>
        </div>

        <div className="pkn-hgrid">
          <div className="pkn-load" style={{ ['--d' as string]: '.24s' }} role="tablist" aria-label="Quiénes somos">
            <div className="pkn-tabs">
              {HERO_TABS.map((label, i) => (
                <button key={label} type="button" role="tab" className="pkn-tab" aria-selected={heroTab === i} onClick={() => setHeroTab(i)}>
                  <span aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="pkn-card pkn-load" style={{ ['--d' as string]: '.32s' }}>
            {/* key: reinicia la animación del borde cada vez que se cambia de pestaña */}
            <span key={`lap-${heroTab}`} className="pkn-lap" aria-hidden="true" />
            <div key={heroTab} className="pkn-in">
              {heroTab === 0 && (
                <>
                  <h2>¿Quiénes somos?</h2>
                  <p>
                    Parkia es una plataforma digital que te permite <B>buscar, comparar y reservar estacionamientos</B> desde un solo lugar.
                  </p>
                  <p>
                    Su <span className="pkn-wv">objetivo</span> es ahorrar tiempo, reducir la incertidumbre al momento de estacionar y ayudar a los usuarios a elegir la opción que se adapte a sus necesidades, según la <B>ubicación, precios, horarios y disponibilidad</B>.
                  </p>
                </>
              )}
              {heroTab === 1 && (
                <>
                  <h2>Nuestro propósito</h2>
                  <p>
                    Nuestra <span className="pkn-wv">misión</span> es conectar en una sola plataforma a los garajes con los conductores que se mueven por la ciudad, ya sea para trabajar, estudiar, atenderse en un hospital o hacer trámites, para que estacionar sea simple, accesible y sustentable.
                  </p>
                </>
              )}
              {heroTab === 2 && (
                <>
                  <h2>Nuestra <span className="pkn-wv">visión</span></h2>
                  <p>
                    Aspiramos a tener una ciudad donde estacionar deje de ser un problema cotidiano: <B>menos tiempo perdido</B>, <B>menos emisiones de CO2</B> y <B>más impacto positivo</B> para la comunidad con cada reserva.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Cultura ---------- */}
      <section id="cultura" className="pkn-cult">
        <div className="pkn-cwrap">
          <div className="pkn-chead pkn-rv">
            <Pill href="#cultura">Nuestra cultura</Pill>
            <h2 className="pkn-h2">Nuestro <span>Park Team</span></h2>
            <p className="pkn-lead">Lo que nos mueve es mucho más que estacionar.</p>
            <p className="pkn-txt">
              En Parkia, buscamos conectar a conductores y estacionamientos a través de soluciones tecnológicas que simplifiquen la movilidad urbana y mejoren la experiencia de las personas. Creemos que cada reserva es una oportunidad para construir una ciudad más accesible, inclusiva y sustentable, generando un impacto positivo en la comunidad.
            </p>
          </div>

          <div className="pkn-rv pkn-carousel">
            <div className="pkn-cs" ref={carRef} tabIndex={0} aria-label="Nuestros valores (deslizá para ver más)">
              {VALUES.map((v) => (
                <article key={v.titulo} className="pkn-vc" style={{ ['--c' as string]: v.azul ? 'var(--rgb2)' : 'var(--rgb)' }}>
                  <img src={v.foto} alt="" style={{ objectPosition: v.pos }} loading="lazy" />
                  <div className="pkn-vb">
                    <i aria-hidden="true" />
                    <h3>{v.titulo}</h3>
                    <p>{v.texto}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="pkn-cfoot">
              <div className="pkn-csh" aria-hidden="true"><span className="pkn-csb" /></div>
              <div className="pkn-cnav">
                <button type="button" onClick={() => mover(-1)} aria-label="Valor anterior">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
                </button>
                <button type="button" onClick={() => mover(1)} aria-label="Valor siguiente">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
                </button>
              </div>
            </div>
            <p className="pkn-csh2">Deslizá para ver los demás</p>
          </div>
        </div>
      </section>

      {/* ---------- Equipo ---------- */}
      <section id="equipo" className="pkn-team">
        <div className="pkn-twrap">
          <div className="pkn-tcol pkn-rv">
            <Pill href="#equipo">El equipo</Pill>
            <h2 className="pkn-h2">Nuestros <span>Parkers</span></h2>
            <p className="pkn-tlead">Detrás de Parkia, hay un equipo unido por el compromiso de aprender, crear y transformar.</p>
            <div className="pkn-tt" role="tablist" aria-label="Sobre el equipo">
              {TEAM_TABS.map((label, i) => (
                <button key={label} type="button" role="tab" className="pkn-ttb" aria-selected={teamTab === i} onClick={() => setTeamTab(i)}>
                  {label}
                </button>
              ))}
            </div>
            <div className="pkn-tbox">
              <p key={teamTab} className="pkn-in">
                {teamTab === 0 && (
                  <>Somos <B>ocho desarrolladores</B> que formamos parte del programa de Desarrollo Web Full Stack de <B>Fundación Pescar</B>, en alianza con Edenred, JP Morgan, NCR Atleos y EducaciónIT.</>
                )}
                {teamTab === 1 && (
                  <>Parkia nació el <b style={{ color: 'var(--acc)', fontWeight: 800 }}>25 de agosto de 2026</b>, a partir de una problemática cotidiana en la Ciudad de Buenos Aires: el tiempo y la incertidumbre que implica encontrar <B>dónde estacionar</B>.</>
                )}
                {teamTab === 2 && (
                  <>Frente a ese <B>desafío</B>, unimos nuestros conocimientos, ideas y habilidades para desarrollar una <B>solución tecnológica</B> que simplifique la experiencia de estacionar y facilite el día a día de las personas.</>
                )}
              </p>
            </div>
          </div>

          <div className="pkn-ringw pkn-rv" style={{ ['--d' as string]: '10' }}>
            <div className="pkn-ring">
              <RoadSvg />

              <div className="pkn-center" aria-live="polite">
                <div className={`pkn-layer def${sel !== null ? ' off' : ''}`}>
                  <span>Clickeá para<br />conocernos</span>
                </div>
                {TEAM.map((m, i) => (
                  <div key={m.nombre} className={`pkn-layer${sel === i ? ' on' : ''}`}>
                    <img src={m.foto} alt="" />
                    <span aria-hidden="true" className="pkn-shade" />
                    <span className="pkn-nm">{m.nombre}</span>
                    <span className="pkn-rl">{m.rol}</span>
                    <a className="pkn-lk" href={m.url} target="_blank" rel="noopener noreferrer" tabIndex={sel === i ? 0 : -1}>Ver LinkedIn</a>
                  </div>
                ))}
              </div>

              {TEAM.map((m, i) => {
                const a = ((-90 + (360 / TEAM.length) * i) * Math.PI) / 180;
                return (
                  <button
                    key={m.nombre}
                    type="button"
                    className={`pkn-m${sel === null ? ' pkn-hint' : ''}`}
                    aria-label={m.nombre}
                    aria-pressed={sel === i}
                    onClick={() => setSel(sel === i ? null : i)}
                    style={{ left: `${50 + 36 * Math.cos(a)}%`, top: `${50 + 36 * Math.sin(a)}%` }}
                  >
                    <img src={m.foto} alt="" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Aviso corto que lleva a Contacto ---------- */}
      <section className="pkc-cta" aria-labelledby="pkc-cta-t">
        <div className="pkc-cta-in">
          <div>
            <h2 id="pkc-cta-t">¿Hablamos?</h2>
            <p>Si tenés dudas, ideas o querés sumar tu garaje, escribinos.</p>
          </div>
          <Link to="/contacto" className="pkc-btn">Ir a contacto</Link>
        </div>
      </section>
    </div>
  );
};

export default NosotrosPage;
