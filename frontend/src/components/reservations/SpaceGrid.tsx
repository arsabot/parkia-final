import React from 'react';

/**
 * Cartel con el Símbolo Internacional de Accesibilidad: cuadrado con borde
 * interior y la silla de ruedas clásica. `fondo` y `figura` son clases de color
 * de Tailwind (text-*), así se adapta a cada estado y a cada modo.
 */
export const AccessibleSign: React.FC<{ className?: string; fondo: string; figura: string }> = ({
  className = 'w-5 h-5',
  fondo,
  figura,
}) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <rect width="24" height="24" rx="5" className={`fill-current ${fondo}`} />
    <g className={figura} fill="none" stroke="currentColor">
      <rect x="2" y="2" width="20" height="20" rx="3.5" strokeWidth="1.2" />
      <g transform="translate(12 12) scale(0.8) translate(-12.8 -11.4)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9.6" cy="3.4" r="1.9" fill="currentColor" stroke="none" />
        <path d="M9.6 7.4 V14 H15.2 L17.6 19.6 L19.8 18.8" />
        <path d="M9.6 10.6 H14.2" />
        <path d="M7.9 10.9 A5.4 5.4 0 1 0 15 18.6" />
      </g>
    </g>
  </svg>
);

/**
 * Grilla de plazas para elegir dónde estacionar.
 * Las plazas accesibles (space_type === 'disabled') muestran el símbolo de
 * accesibilidad y solo se pueden elegir si el usuario tiene el rol
 * 'disabled' (user.roles), que asigna un administrador.
 * El backend vuelve a validar esta regla al crear la reserva.
 */

export interface SpaceOption {
  id: number;
  code: string;
  floor: string;
  space_type?: string;
  is_available: boolean;
}

export const isAccessibleSpace = (s: SpaceOption) => s.space_type === 'disabled';

export const canPickSpace = (s: SpaceOption, hasPermit: boolean) =>
  s.is_available && (!isAccessibleSpace(s) || hasPermit);

/**
 * Plaza que se preselecciona: siempre una común. Las accesibles no se
 * preseleccionan nunca, así quedan libres para quien realmente las necesita
 * (el usuario con credencial puede elegirlas a mano).
 */
export const defaultSpace = (spaces: SpaceOption[]) =>
  spaces.find((s) => s.is_available && !isAccessibleSpace(s));

/** Fila de la leyenda: ejemplo del color + qué significa (mismo estilo que las filas de estado del admin) */
const LegendRow: React.FC<{ sample: React.ReactNode; title: string; detail: string }> = ({ sample, title, detail }) => (
  <div className="flex items-center gap-3 px-3 py-2 rounded-xl border border-plaza-borde bg-plaza-fondo">
    <span className="shrink-0 flex" aria-hidden="true">{sample}</span>
    <span className="text-xs text-plaza-texto">
      <strong className="font-bold">{title}</strong>
      <span className="text-plaza-leyenda"> · {detail}</span>
    </span>
  </div>
);

interface SpaceGridProps {
  spaces: SpaceOption[];
  selectedId?: number;
  onSelect: (id: number) => void;
  hasPermit: boolean;
  /** Clases de la grilla (columnas, alto máximo) según dónde se use */
  gridClassName?: string;
  /** Mostrar el piso (PB / P1) debajo del código */
  showFloor?: boolean;
}

export const SpaceGrid: React.FC<SpaceGridProps> = ({
  spaces,
  selectedId,
  onSelect,
  hasPermit,
  gridClassName = 'grid-cols-4 sm:grid-cols-6 max-h-36',
  showFloor = true,
}) => {
  const hasAccessibleSpaces = spaces.some(isAccessibleSpace);

  return (
    <>
      <div
        className={`grid gap-1.5 sm:gap-2 overflow-y-auto overflow-x-hidden w-full min-w-0 p-2 rounded-2xl border bg-plaza-fondo border-plaza-borde ${gridClassName}`}
        role="group"
        aria-label="Selección de plaza"
      >
        {spaces.map((s) => {
          const isSelected = selectedId === s.id;
          const isFree = s.is_available;
          const isAccessible = isAccessibleSpace(s);
          // Plaza accesible libre, pero el usuario no tiene credencial verificada
          const isRestricted = isFree && isAccessible && !hasPermit;

          const stateLabel = isSelected
            ? 'seleccionada'
            : isRestricted
            ? 'solo para personas con credencial de discapacidad'
            : isFree
            ? 'disponible'
            : 'no disponible';

          return (
            <button
              key={s.id}
              type="button"
              disabled={!canPickSpace(s, hasPermit)}
              onClick={() => onSelect(s.id)}
              title={isRestricted ? 'Plaza accesible: solo para personas con credencial de discapacidad verificada' : undefined}
              aria-label={`Plaza ${s.code}${isAccessible ? ' accesible' : ''}, ${s.floor}, ${stateLabel}`}
              aria-pressed={isSelected}
              className={`relative py-2 px-1 min-h-[44px] rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                // Los colores salen de src/styles/parkia-colores.css (claro y oscuro)
                isSelected && isAccessible
                  ? // Tu plaza accesible: azul con la rayita lima
                    'bg-plaza-accesible-elegida text-plaza-accesible-elegida-texto border-b-4 border-plaza-franja shadow-md scale-105'
                  : isSelected
                  ? // Tu plaza: azul marino con la rayita lima (como el logo de Parkia)
                    'bg-plaza-elegida text-plaza-elegida-texto border-b-4 border-plaza-franja shadow-md scale-105'
                  : isRestricted
                  ? // Accesible, pero sin credencial: apagada y punteada
                    'bg-plaza-accesible/50 text-plaza-accesible-texto/50 border border-dashed border-plaza-accesible-borde/50 cursor-not-allowed'
                  : isFree && isAccessible
                  ? // Accesible y libre para este usuario (azul = accesible)
                    'bg-plaza-accesible text-plaza-accesible-texto border-2 border-plaza-accesible-borde hover:bg-plaza-accesible/70'
                  : isFree
                  ? // Libre (verde)
                    'bg-plaza text-plaza-libre-texto border-2 border-plaza-libre-borde hover:bg-plaza-libre-borde/30'
                  : // No disponible (ocupada, reservada o en mantenimiento)
                    'bg-plaza-ocupada text-plaza-ocupada-texto cursor-not-allowed line-through'
              }`}
            >
              <span>{s.code}</span>
              {(isAccessible || showFloor) && (
                <span className="flex items-center gap-1 mt-0.5">
                  {/* Cartel de accesibilidad debajo del código, sin taparlo */}
                  {isAccessible && (
                    <AccessibleSign
                      className={`w-4 h-4 ${isRestricted ? 'opacity-60' : ''}`}
                      fondo={
                        isSelected
                          ? 'text-plaza-accesible-elegida-texto'
                          : isFree
                          ? 'text-plaza-simbolo'
                          : 'text-plaza-ocupada-texto'
                      }
                      figura={isSelected ? 'text-plaza-accesible-elegida' : 'text-plaza-simbolo-figura'}
                    />
                  )}
                  {showFloor && (
                    <span className="text-[9px] opacity-80 font-normal">
                      {s.floor === 'Planta Baja' ? 'PB' : 'P1'}
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Qué significa cada color: una fila por color, con un ejemplo de la plaza y su explicación */}
      <div className="mt-3 space-y-1.5" aria-label="Qué significa cada color">
        <p className="text-[11px] font-bold uppercase tracking-wider text-plaza-leyenda">¿Qué significa cada color?</p>
        <LegendRow
          sample={<span className="w-7 h-6 rounded-md bg-plaza border-2 border-plaza-libre-borde" />}
          title="Libre"
          detail="Podés reservarla"
        />
        <LegendRow
          sample={<span className="w-7 h-6 rounded-md bg-plaza-ocupada flex items-center justify-center text-[9px] font-bold text-plaza-ocupada-texto line-through">A4</span>}
          title="No disponible"
          detail="Ocupada o en mantenimiento"
        />
        <LegendRow
          sample={<span className="w-7 h-6 rounded-md bg-plaza-elegida border-b-[3px] border-plaza-franja" />}
          title="Tu plaza"
          detail="La que elegiste para reservar"
        />
        {hasAccessibleSpaces && (
          <LegendRow
            sample={
              <span className="w-7 h-6 rounded-md bg-plaza-accesible border border-plaza-accesible-borde flex items-center justify-center">
                <AccessibleSign className="w-4 h-4" fondo="text-plaza-simbolo" figura="text-plaza-simbolo-figura" />
              </span>
            }
            title="Accesible"
            detail={hasPermit ? 'Para personas con discapacidad. Podés elegirla' : 'Solo para personas con credencial de discapacidad verificada'}
          />
        )}
        {hasAccessibleSpaces && hasPermit && (
          <LegendRow
            sample={
              <span className="w-7 h-6 rounded-md bg-plaza-accesible-elegida border-b-[3px] border-plaza-franja flex items-center justify-center">
                <AccessibleSign className="w-4 h-4" fondo="text-plaza-accesible-elegida-texto" figura="text-plaza-accesible-elegida" />
              </span>
            }
            title="Tu plaza accesible"
            detail="Elegiste un lugar accesible"
          />
        )}
      </div>
    </>
  );
};
