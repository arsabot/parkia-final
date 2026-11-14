import React from 'react';
import { GoogleLoginButton } from '../components/auth/GoogleLoginButton';
import { UserRole } from '../types';

type SignupRole = 'driver' | 'owner';

export function Auth0GoogleButton({ role }: { role?: SignupRole }) {
  return <GoogleLoginButton role={role as UserRole} />;
}
