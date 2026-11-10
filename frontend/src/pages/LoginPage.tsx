import React, { useState } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, Car, Building2, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { UserRole } from '../types';
import { Auth0GoogleButton } from '../auth0/Auth0GoogleButton';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  const { login, demoLogin, user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/search';
  
  // Si ya hay sesión, no tiene sentido mostrar el login: va directo a su pantalla.
  if (user) {
    const destino = user.role === 'admin' ? '/admin' : user.role === 'owner' ? '/admin/gate' : from;
    return <Navigate to={destino} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      error('Por favor ingresa tu correo y contraseña');
      return;
    }

    try {
      setLoading(true);
      const res = await login({ email, password });
      success(`¡Bienvenido de vuelta, ${res.user.first_name}!`);
      if (res.user.role === 'admin') {
        navigate('/admin');
      } else if (res.user.role === 'owner') {
        navigate('/admin/gate');
      } else {
        navigate(from);
      }
    } catch (err: any) {
      error(err.message || 'Credenciales incorrectas');
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
      error(err.message || 'Error en login demo');
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-slate-50 dark:bg-parkia-page-dark py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-md w-full space-y-8 animate-fade-in">
        
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <img
              src="/logo-icon.png"
              alt="PARKIA"
              className="w-14 h-14 object-contain drop-shadow-md group-hover:scale-105 transition-transform"
            />
          </Link>
          <h2 className="text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight">
            Iniciar Sesión
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            Ingresa a tu cuenta para gestionar tus reservas o estacionamientos.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-parkia-card-dark rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-parkia-line-dark shadow-xl shadow-slate-200/50 dark:shadow-none transition-colors">
          
          {/* Quick Demo Logins Box with 3 roles */}
          <div className="mb-6 p-4 bg-slate-50 dark:bg-parkia-navy/40 rounded-2xl border border-slate-200/80 dark:border-parkia-line-dark">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2 text-center">
              Accesos Demo para pruebas rápidas
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
          <Auth0GoogleButton />
          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-slate-200 dark:border-parkia-line-dark" />
            <span className="flex-shrink mx-3 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-semibold">
              O con tu email
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-parkia-line-dark" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Correo Electrónico"
              required
              autoComplete="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
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
          </form>

          {/* Register Link */}
          <div className="text-center pt-6 mt-6 border-t border-slate-100 dark:border-parkia-line-dark text-xs text-slate-500 dark:text-slate-400">
            ¿Aún no tienes cuenta?{' '}
            <Link to="/register" className="font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300">
              Registrate gratis aquí
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
