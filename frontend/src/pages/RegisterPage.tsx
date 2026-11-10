import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Mail, User as UserIcon, Phone, ParkingCircle, ArrowRight, Car, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { PasswordField } from '../components/auth/PasswordField';
import { PasswordStrength } from '../components/auth/PasswordStrength';
import { isPasswordValid } from '../components/auth/passwordScore';
import { UserRole } from '../types';
import { Auth0GoogleButton } from '../auth0/Auth0GoogleButton';

export const RegisterPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('driver');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);
  const mismatch = passwordConfirm.length > 0 && password !== passwordConfirm;

  const { register, user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  // Si ya hay sesión, no tiene sentido mostrar el registro: va directo a su pantalla.
  if (user) {
    const destino = user.role === 'admin' ? '/admin' : user.role === 'owner' ? '/admin/gate' : '/search';
    return <Navigate to={destino} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== passwordConfirm) {
      error('Las contraseñas no coinciden.');
      setShake((n) => n + 1);
      return;
    }

    if (!isPasswordValid(password)) {
      error('La contraseña no cumple los requisitos.');
      setShake((n) => n + 1);
      return;
    }

    try {
      setLoading(true);
      const res = await register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role,
        password,
        password_confirmation: passwordConfirm,
      });

      success('¡Cuenta creada exitosamente!');
      if (res.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/search');
      }
    } catch (err: any) {
      error(err.message || 'Error al registrar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
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
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Crear Cuenta en PARKIA
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            Únete a la comunidad de movilidad inteligente.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
          
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Role Switcher */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Tipo de Cuenta
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('driver')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                    role === 'driver'
                      ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Car className="w-4 h-4 text-brand-600" aria-hidden="true" />
                  <span>Conductor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('owner')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                    role === 'owner' || role === 'admin'
                      ? 'bg-teal-50 border-teal-500 text-teal-800 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-teal-600" aria-hidden="true" />
                  <span>Dueño de Garaje</span>
                </button>
              </div>
            </div>
            <Auth0GoogleButton role={role === 'owner' ? 'owner' : 'driver'} />
            {/* Name and Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Nombre"
                required
                autoComplete="given-name"
                placeholder="Carlos"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <Input
                label="Apellido"
                required
                autoComplete="family-name"
                placeholder="Méndez"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            {/* Email */}
            <Input
              type="email"
              label="Correo Electrónico"
              required
              autoComplete="email"
              placeholder="carlos@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
            />

            {/* Phone */}
            <Input
              type="tel"
              label="Teléfono / WhatsApp (Opcional)"
              autoComplete="tel"
              placeholder="+54 9 11 1234-5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone className="w-4 h-4" />}
            />

            {/* Password */}
            <PasswordField
              label="Contraseña"
              required
              maxLength={64}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            >
              <PasswordStrength password={password} email={email} />
            </PasswordField>

            {/* Password confirmation */}
            <PasswordField
              label="Confirmar Contraseña"
              required
              maxLength={64}
              autoComplete="new-password"
              placeholder="Repite la contraseña"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              error={mismatch ? 'Las contraseñas no coinciden.' : undefined}
              shakeSignal={shake}
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              fullWidth
              className="mt-2"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Crear Cuenta
            </Button>
          </form>

          {/* Login Link */}
          <div className="text-center pt-6 mt-6 border-t border-slate-100 text-xs text-slate-500">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700">
              Inicia sesión aquí
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};