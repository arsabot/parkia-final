import { useEffect, useRef, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { auth0Enabled } from './Auth0Setup';

// Marca que estamos volviendo de Google y desde qué página salimos ('register' o 'login').
const PENDING = 'parkia_auth0_pending';
// Tipo de cuenta elegido en "Registrarse". Se guarda porque al ir a Google se sale de la página.
const ROLE = 'parkia_auth0_role';

type SignupRole = 'driver' | 'owner';

type ParkiaAuthResponse = {
  created: boolean;
  user: { role: string };
  tokens: { access: string; refresh: string };
};

const ROLE_LABEL: Record<string, string> = {
  driver: 'Conductor',
  owner: 'Dueño de Garaje',
  admin: 'Administrador',
};

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.4-.4-3.5z" />
  </svg>
);

// Guarda la sesión de Parkia y manda a cada rol a su pantalla.
function saveSessionAndGo(res: ParkiaAuthResponse) {
  localStorage.setItem('parkia_token', res.tokens.access);
  localStorage.setItem('parkia_refresh', res.tokens.refresh);
  localStorage.setItem('parkia_user', JSON.stringify(res.user));
  const destino = res.user.role === 'admin' ? '/admin' : res.user.role === 'owner' ? '/admin/gate' : '/search';
  window.location.href = destino;
}

function GoogleButton({ role }: { role?: SignupRole }) {
  const { loginWithRedirect, isAuthenticated, isLoading, getAccessTokenSilently, logout, error: auth0Error } = useAuth0();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [existing, setExisting] = useState<ParkiaAuthResponse | null>(null);
  const shownError = error || (auth0Error ? 'No se pudo entrar con Google. Probá de nuevo.' : '');
  const started = useRef(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated || started.current || !sessionStorage.getItem(PENDING)) return;
    started.current = true;
    const fromRegister = sessionStorage.getItem(PENDING) === 'register';
    const savedRole: SignupRole = sessionStorage.getItem(ROLE) === 'owner' ? 'owner' : 'driver';
    sessionStorage.removeItem(PENDING);
    sessionStorage.removeItem(ROLE);
    setBusy(true);

    (async () => {
      try {
        // 1. Pedimos a Auth0 el token que prueba que la persona entró con Google.
        const token = await getAccessTokenSilently();
        // 2. Django lo verifica y nos da la sesión normal de Parkia.
        //    El rol solo se usa si la cuenta es nueva; una cuenta existente conserva el suyo.
        const res = await api.post<ParkiaAuthResponse>('/auth/auth0/', { token, role: savedRole });
        if (fromRegister && !res.created) {
          // Quiso registrarse pero ese email ya tenía cuenta: avisamos en vez de entrar sin decir nada.
          setExisting(res);
          setBusy(false);
          return;
        }
        saveSessionAndGo(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo entrar con Google.');
        setBusy(false);
      } finally {
        // Desde acá manda la sesión de Parkia; la de Auth0 ya no hace falta en el navegador.
        logout({ openUrl: false });
      }
    })();
  }, [isLoading, isAuthenticated, getAccessTokenSilently, logout]);

  const start = () => {
    setError('');
    setExisting(null);
    sessionStorage.setItem(PENDING, role ? 'register' : 'login');
    sessionStorage.setItem(ROLE, role ?? 'driver');
    loginWithRedirect({ authorizationParams: { connection: 'google-oauth2' } });
  };

  return (
    <div className="mb-6 space-y-2">
      {existing ? (
        <div role="status" className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="text-sm font-semibold text-amber-900">
            Ya tenés una cuenta registrada con este mail, como {ROLE_LABEL[existing.user.role] ?? existing.user.role}.
          </p>
          <p className="text-xs text-amber-800">Iniciá sesión para seguir.</p>
          <Button type="button" variant="primary" fullWidth onClick={() => saveSessionAndGo(existing)}>
            Iniciar sesión
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" fullWidth isLoading={busy} onClick={start} leftIcon={<GoogleLogo />}>
          Continuar con Google
        </Button>
      )}
      {shownError && (
        <p role="alert" className="text-center text-xs font-semibold text-rose-600">
          {shownError}
        </p>
      )}
    </div>
  );
}

// Si no hay .env.local con Auth0, el botón no aparece y la página queda igual que antes.
// En "Registrarse" se pasa el rol elegido; en "Iniciar sesión", no.
export function Auth0GoogleButton({ role }: { role?: SignupRole }) {
  return auth0Enabled ? <GoogleButton role={role} /> : null;
}
