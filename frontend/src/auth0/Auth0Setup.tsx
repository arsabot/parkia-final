import type { ReactNode } from 'react';

export const auth0Enabled = false;

export function Auth0Setup({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
