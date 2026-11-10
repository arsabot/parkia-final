import { Auth0Provider } from '@auth0/auth0-react';
import type { ReactNode } from 'react';

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

// Si alguien del equipo no tiene el .env.local, la app funciona igual que antes, sin Auth0.
export const auth0Enabled = Boolean(domain && clientId);

export function Auth0Setup({ children }: { children: ReactNode }) {
  if (!auth0Enabled) return <>{children}</>;

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: `${window.location.origin}/login`,
        audience,
      }}
    >
      {children}
    </Auth0Provider>
  );
}