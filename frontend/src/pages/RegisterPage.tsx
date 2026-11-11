import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  User as UserIcon, 
  Phone, 
  ParkingCircle, 
  ArrowRight, 
  Car, 
  Building2,
  Accessibility,
  CheckCircle2,
  AlertCircle,
  FileCheck2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/authService';
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

  // Disability & CUD Verification states
  const [hasDisabilityPermit, setHasDisabilityPermit] = useState(false);
  const [cudNumber, setCudNumber] = useState('');
  const [cudDni, setCudDni] = useState('');
  const [cudExpiration, setCudExpiration] = useState('');
  const [isVerifyingCud, setIsVerifyingCud] = useState(false);
  const [cudVerifiedSuccess, setCudVerifiedSuccess] = useState(false);
  const [cudVerificationMessage, setCudVerificationMessage] = useState('');

  const { register, user } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  // Si ya hay sesión, redirigir según su rol
  if (user) {
    const destino = user.role === 'admin' ? '/admin' : user.role === 'owner' ? '/admin/gate' : '/search';
    return <Navigate to={destino} replace />;
  }

  // Pre-cargar datos demo de CUD para agilizar pruebas
  const handleFillDemoCud = () => {
    setCudNumber('04-38912456-7');
    setCudDni('38123456');
    setCudExpiration('2028-12-31');
    setCudVerifiedSuccess(true);
    setCudVerificationMessage('CUD de prueba verificado con vigencia hasta 31/12/2028.');
    info('Datos de CUD oficial de prueba cargados.');
  };

  // Validar CUD contra el endpoint de verificación
  const handleVerifyCudOnline = async () => {
    if (!cudNumber.trim()) {
      error('Por favor ingresá el número de CUD impreso en tu certificado.');
      return;
    }
    try {
      setIsVerifyingCud(true);
      const res = await authService.verifyCud({
        cud_number: cudNumber.trim(),
        cud_dni: cudDni.trim() || undefined,
        cud_expiration: cudExpiration || undefined,
      });
      if (res.valid) {
        setCudVerifiedSuccess(true);
        setCudVerificationMessage(res.message || 'CUD validado exitosamente ante el Registro Nacional.');
        success('¡Certificado CUD verificado con éxito! Habilitado para plazas accesibles.');
      } else {
        setCudVerifiedSuccess(false);
        error('El CUD ingresado no pudo ser validado.');
      }
    } catch (err: any) {
      setCudVerifiedSuccess(false);
      error(err.message || 'Error al validar el CUD. Verificá los datos ingresados.');
    } finally {
      setIsVerifyingCud(false);
    }
  };

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

    if (hasDisabilityPermit && !cudNumber.trim()) {
      error('Para acceder a plazas accesibles, debés ingresar tu número de CUD.');
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
        has_disability_permit: hasDisabilityPermit,
        cud_number: hasDisabilityPermit ? cudNumber.trim() : undefined,
        cud_dni: hasDisabilityPermit ? cudDni.trim() : undefined,
        cud_expiration: hasDisabilityPermit && cudExpiration ? cudExpiration : undefined,
      });

      if (hasDisabilityPermit) {
        success('¡Cuenta creada con acceso habilitado a plazas accesibles!');
      } else {
        success('¡Cuenta creada exitosamente!');
      }

      if (res.user.role === 'admin') {
        navigate('/admin');
      } else if (res.user.role === 'owner') {
        navigate('/admin/gate');
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
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Crear Cuenta en PARKIA
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            Únete a la comunidad de movilidad inteligente.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-parkia-card-dark rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-parkia-line-dark shadow-xl shadow-slate-200/50 dark:shadow-none transition-colors">
          
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Role Switcher */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Tipo de Cuenta
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('driver')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                    role === 'driver'
                      ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-700 dark:text-brand-300 shadow-sm'
                      : 'border-slate-200 dark:border-parkia-line-dark text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Car className="w-4 h-4 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                  <span>Conductor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('owner')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                    role === 'owner' || role === 'admin'
                      ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-800 dark:text-teal-300 shadow-sm'
                      : 'border-slate-200 dark:border-parkia-line-dark text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                  <span>Dueño de Garaje</span>
                </button>
              </div>
            </div>

            <Auth0GoogleButton role={role === 'owner' ? 'owner' : 'driver'} />

            {/* Accessibility / CUD Disability Option */}
            <div className={`rounded-2xl border transition-all p-3.5 sm:p-4 ${
              hasDisabilityPermit 
                ? 'border-blue-400/80 dark:border-blue-500/60 bg-blue-50/50 dark:bg-blue-950/20' 
                : 'border-slate-200 dark:border-parkia-line-dark bg-slate-50/60 dark:bg-slate-800/40'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    hasDisabilityPermit 
                      ? 'bg-blue-500 text-white shadow-sm' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    <Accessibility className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Plazas Accesibles / CUD
                      </span>
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                        SIA
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Habilitación para personas con discapacidad mediante Certificado Único de Discapacidad.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={hasDisabilityPermit}
                    onChange={(e) => {
                      setHasDisabilityPermit(e.target.checked);
                      if (!e.target.checked) {
                        setCudVerifiedSuccess(false);
                      }
                    }}
                    className="sr-only peer"
                    aria-label="Poseo Certificado Único de Discapacidad (CUD)"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600" />
                </label>
              </div>

              {/* Expanded CUD verification form */}
              {hasDisabilityPermit && (
                <div className="mt-3.5 pt-3.5 border-t border-blue-200/80 dark:border-blue-900/50 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1">
                      <FileCheck2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      Validación Oficial CUD (ANDIS / Mi Argentina)
                    </span>
                    <button
                      type="button"
                      onClick={handleFillDemoCud}
                      className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      Usar CUD de prueba
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Número de CUD / Código *
                      </label>
                      <input
                        type="text"
                        required={hasDisabilityPermit}
                        placeholder="Ej: 04-38912456-7"
                        value={cudNumber}
                        onChange={(e) => {
                          setCudNumber(e.target.value.toUpperCase());
                          setCudVerifiedSuccess(false);
                        }}
                        className="w-full text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[38px]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        DNI del Titular
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: 38.123.456"
                        value={cudDni}
                        onChange={(e) => {
                          setCudDni(e.target.value);
                          setCudVerifiedSuccess(false);
                        }}
                        className="w-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[38px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Fecha de Vencimiento del CUD
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={cudExpiration}
                        onChange={(e) => {
                          setCudExpiration(e.target.value);
                          setCudVerifiedSuccess(false);
                        }}
                        className="flex-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[38px]"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyCudOnline}
                        disabled={isVerifyingCud || !cudNumber.trim()}
                        className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                      >
                        {isVerifyingCud ? 'Validando...' : 'Verificar CUD'}
                      </button>
                    </div>
                  </div>

                  {/* Verification result pill */}
                  {cudVerifiedSuccess ? (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-200 animate-fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">CUD Verificado y Vigente</strong>
                        <span className="text-[11px] leading-tight block text-emerald-700 dark:text-emerald-300">
                          {cudVerificationMessage || 'Tu cuenta podrá reservar todas las plazas exclusivas para personas con discapacidad.'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                      La verificación online comprueba la vigencia en la base de datos nacional para asignar automáticamente el rol de acceso a plazas reservadas.
                    </p>
                  )}
                </div>
              )}
            </div>

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
          <div className="text-center pt-6 mt-6 border-t border-slate-100 dark:border-parkia-line-dark text-xs text-slate-500 dark:text-slate-400">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300">
              Inicia sesión aquí
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};