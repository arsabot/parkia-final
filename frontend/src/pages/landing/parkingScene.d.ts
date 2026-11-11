export interface ParkingSceneOptions {
  /** Cartel flotante "Tu lugar" que sigue a la plaza elegida. */
  getChip: () => HTMLElement | null;
  /** Texto del cartel ("Plaza B07"). */
  getChipCode: () => HTMLElement | null;
  /** Momento (performance.now()) hasta el que se resaltan las plazas accesibles. */
  getAccUntil: () => number;
}

/** Crea la escena 3D sobre el canvas y devuelve una función para liberarla. */
export function createParkingScene(canvas: HTMLCanvasElement, opts: ParkingSceneOptions): () => void;
