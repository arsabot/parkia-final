import React, { useState, useEffect, useRef } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, Car, Building2, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { UserRole } from '../types';
import { GoogleLoginButton } from '../components/auth/GoogleLoginButton';
import { authService } from '../services/authService';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { validateStrictEmail } from '../utils/securityValidation';
import '../styles/auth-card.css';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const { login, demoLogin, refreshUser, user } = useAuth();
  const { success, error } = useToast();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const handledOAuth = useRef(false);

  const rawFrom = (location.state as any)?.from?.pathname || '/search';
  // Evitar redireccionar a conductores o invitados a rutas protegidas de administración
  const from = rawFrom.startsWith('/admin') ? '/search' : rawFrom;

  useEffect(() => {
    if (handledOAuth.current) return;
    const isCallback =
      window.location.hash.includes('access_token') ||
      window.location.search.includes('code=') ||
      Boolean(sessionStorage.getItem('parkia_oauth_pending'));

    if (!isCallback) return;
    handledOAuth.current = true;

    const handleOAuth = async () => {
      try {
        setLoading(true);
        const res = await authService.handleOAuthCallback();
        if (res?.user) {
          success(`¡Bienvenido de vuelta, ${res.user.first_name}!`);
          await refreshUser();
          const destino = res.user.role === 'admin' ? '/admin' : res.user.role === 'owner' ? '/admin/gate' : from;
          navigate(destino, { replace: true });
        }
      } catch (err: any) {
        error(err.message || 'Error al autenticar con Google');
      } finally {
        setLoading(false);
      }
    };

    handleOAuth();
  }, [from, navigate, refreshUser, success, error]);
  
  // Si ya hay sesión, no tiene sentido mostrar el login: va directo a su pantalla.
  if (user) {
    const destino = user.role === 'admin' ? '/admin' : user.role === 'owner' ? '/admin/gate' : from;
    return <Navigate to={destino} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailValidation = validateStrictEmail(email);
    const nextEmailError = emailValidation.valid ? '' : (emailValidation.error || 'Ingresa un correo electrónico válido.');
    const nextPasswordError = password ? '' : 'Ingresa tu contraseña.';
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setFormError('');

    if (nextEmailError || nextPasswordError) {
      return;
    }

    try {
      setLoading(true);
      const res = await login({ email: emailValidation.cleanEmail, password });
      success(`¡Bienvenido de vuelta, ${res.user.first_name}!`);
      if (res.user.role === 'admin') {
        navigate('/admin');
      } else if (res.user.role === 'owner') {
        navigate('/admin/gate');
      } else {
        navigate(from);
      }
    } catch (err: any) {
      setFormError(err.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: UserRole) => {
    try {
      setDemoLoading(role);
      const res = await demoLogin(role);
      const roleName = role === 'admin' ? 'Super Administrador (Ariel)' : role === 'owner' ? 'Dueño de Estacionamiento' : 'Conductor';
      success(`Accediste con la cuenta demo de ${roleName}`);
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'owner') {
        navigate('/admin/gate');
      } else {
        navigate('/search');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error en login demo');
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="pk-auth-bg pk-auth-light-bg min-h-[calc(100vh-5rem)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="pk-auth-layout">
        <section className="pk-auth-intro" aria-labelledby="pk-auth-intro-title">
          <h1 id="pk-auth-intro-title">
            <span>Iniciá sesión</span>
            <span className="pk-auth-intro-brandline">
              <span>en</span>
              <span className="pk-auth-intro-brand">PARKIA</span>
            </span>
          </h1>
          <p>Ingresa a tu cuenta para gestionar tus reservas o estacionamientos.</p>
        </section>

        <div className="pk-auth-form-column animate-fade-in">
          <Link to="/" className="pk-auth-mobile-brand group" aria-label="PARKIA - inicio">
            <img src={isDark ? '/logo-parkia-oscuro.png' : '/logo-parkia.png'} alt="PARKIA" />
          </Link>
          <div className="pk-glow-card p-6 sm:p-8">
            <div className="pk-auth-heading text-center">
              <h2 className="text-2xl font-extrabold text-navy-900 dark:text-white tracking-tight">
                Iniciar Sesión
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Ingresa a tu cuenta para gestionar tus reservas o estacionamientos.
              </p>
            </div>
          
          {/* Quick Demo Logins Box with 3 roles */}
          <div className="pk-auth-demo mb-6 p-4 bg-slate-50 dark:bg-parkia-navy/40 rounded-2xl border border-slate-200/80 dark:border-parkia-line-dark">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2 text-center">
              Accesos Demo para pruebas rápidas
            </span>
            <div className="pk-auth-demo-grid grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('driver')}
                disabled={!!demoLoading}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-parkia-line-dark text-slate-800 dark:text-slate-200 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 text-xs font-bold transition-all shadow-sm flex flex-col items-center justify-center gap-1 cursor-pointer"
              >
                <Car className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>Conductor</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleQuickDemo('owner')}
                disabled={!!demoLoading}
                className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800/60 text-teal-800 dark:text-teal-200 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-xs font-bold transition-all shadow-sm flex flex-col items-center justify-center gap-1 cursor-pointer"
                title="Dueño de garaje (Cámara QR, garita y plazas vacantes)"
              >
                <Building2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Dueño Garaje</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                disabled={!!demoLoading}
                className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-xs font-bold transition-all shadow-sm flex flex-col items-center justify-center gap-1 cursor-pointer"
                title="Super Admin Ariel (Alta/Baja de garajes y control total)"
              >
                <Crown className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>Super Admin</span>
              </button>
            </div>
          </div>
          <div className="mb-4">
            <GoogleLoginButton onError={(msg) => error(msg)} />
          </div>
          {isSupabaseConfigured() && (
            <div className="relative flex py-2 items-center mb-6">
              <div className="flex-grow border-t border-slate-200 dark:border-parkia-line-dark" />
              <span className="flex-shrink mx-3 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-semibold">
                O con tu email
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-parkia-line-dark" />
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="pk-auth-form space-y-4">
            <Input
              ref={emailRef}
              type="email"
              label="Correo Electrónico"
              required
              autoComplete="email"
              placeholder="tu@email.com"
              maxLength={254}
              value={email}
              error={emailError}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError('');
                setFormError('');
              }}
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <div>
              <Input
                type="password"
                label="Contraseña"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                error={passwordError}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                  setFormError('');
                }}
                leftIcon={<Lock className="w-4 h-4" />}
              />
              <div className="flex justify-end mt-1.5">
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:underline transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              fullWidth
              className="mt-2"
              rightIcon={<LogIn className="w-4 h-4" />}
            >
              Iniciar Sesión
            </Button>
            {formError && (
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400" role="alert">
                {formError}
              </p>
            )}
          </form>

          {/* Register Link */}
          <div className="pk-auth-register text-center pt-6 mt-6 border-t border-slate-100 dark:border-parkia-line-dark text-xs text-slate-500 dark:text-slate-400">
            ¿Aún no tienes cuenta?{' '}
            <Link to="/register" className="font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300">
              Registrate gratis aquí
            </Link>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
};
