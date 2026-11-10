// Capa de datos del asistente ParkIA. Usa tu cliente `api` (token Bearer incluido).
// Para probar la interfaz sin backend, definí VITE_CHATBOT_DEMO=true en .env.local.
import { api } from './api';
import { isSupabaseConfigured, supabase } from './supabaseClient';

export type Claim = {
  codigo: string;
  categoria: string;
  fecha: string;
  estado: 0 | 1 | 2; // 0 recibido, 1 en revisión, 2 resuelto
  respuesta: string;
};

export type NewClaim = {
  categoria: string;
  reserva: string;
  descripcion: string;
  contacto: string;
};

type ApiClaim = {
  code: string;
  category_label: string;
  status: 'received' | 'in_review' | 'resolved';
  response: string;
  created_at: string;
};

const DEMO = import.meta.env.VITE_CHATBOT_DEMO === 'true';
const CATEGORY: Record<string, string> = {
  Pago: 'payment',
  Reserva: 'reservation',
  'Garage o servicio': 'garage',
  'App o web': 'app',
  Otro: 'other',
};
const STATE = { received: 0, in_review: 1, resolved: 2 } as const;
const DEFAULT_TEXT = [
  'Tu reclamo fue recibido y está en cola de revisión.',
  'Estamos revisando tu caso y te avisaremos por el contacto indicado.',
  'Tu reclamo fue resuelto. Si necesitás algo más, escribinos.',
];

const toClaim = (c: ApiClaim): Claim => ({
  codigo: c.code,
  categoria: c.category_label,
  fecha: new Date(c.created_at).toLocaleDateString('es-AR'),
  estado: STATE[c.status],
  respuesta: c.response || DEFAULT_TEXT[STATE[c.status]],
});

// --- modo demo (en memoria) ---
const demo: Claim[] = [
  { codigo: 'RC-2026-10482', categoria: 'Pago', fecha: '28/10/2026', estado: 1, respuesta: 'Estamos verificando el cobro con el banco emisor.' },
];

export async function createClaim(data: NewClaim): Promise<{ codigo: string }> {
  if (isSupabaseConfigured() && supabase) {
    const code = `RC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 89999)}`;
    await supabase.from('claims').insert({
      code,
      user_id: 1,
      category: CATEGORY[data.categoria] ?? 'other',
      reservation_ref: data.reserva === 'Sin dato' ? '' : data.reserva,
      description: data.descripcion,
      contact: data.contacto,
      status: 'abierto',
      response: DEFAULT_TEXT[0],
    });
    return { codigo: code };
  }
  if (DEMO) {
    const codigo = `RC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 89999)}`;
    demo.unshift({ codigo, categoria: data.categoria, fecha: new Date().toLocaleDateString('es-AR'), estado: 0, respuesta: DEFAULT_TEXT[0] });
    return { codigo };
  }
  const res = await api.post<ApiClaim>('/claims/', {
    category: CATEGORY[data.categoria] ?? 'other',
    reservation_ref: data.reserva === 'Sin dato' ? '' : data.reserva,
    description: data.descripcion,
    contact: data.contacto,
  });
  return { codigo: res.code };
}

export async function listClaims(): Promise<Claim[]> {
  if (isSupabaseConfigured() && supabase) {
    const { data: claims } = await supabase.from('claims').select('*').order('created_at', { ascending: false });
    return (claims || []).map((c: any) => ({
      codigo: c.code,
      categoria: c.category,
      fecha: new Date(c.created_at).toLocaleDateString('es-AR'),
      estado: c.status === 'resuelto' ? 2 : c.status === 'revision' ? 1 : 0,
      respuesta: c.response || DEFAULT_TEXT[0],
    }));
  }
  if (DEMO) return demo;
  const res = await api.get<ApiClaim[] | { results: ApiClaim[] }>('/claims/');
  return (Array.isArray(res) ? res : res.results).map(toClaim);
}

export async function getClaim(codigo: string): Promise<Claim | null> {
  const all = await listClaims();
  return all.find((c) => c.codigo === codigo) ?? null;
}