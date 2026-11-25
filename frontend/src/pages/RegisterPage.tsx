import React, { useRef, useState } from 'react';
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
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/authService';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { PasswordField } from '../components/auth/PasswordField';
import { PasswordStrength } from '../components/auth/PasswordStrength';
import { isPasswordValid } from '../components/auth/passwordScore';
import { validateStrictEmail } from '../utils/securityValidation';
import { UserRole } from '../types';
import { GoogleLoginButton } from '../components/auth/GoogleLoginButton';
import { isSupabaseConfigured } from '../services/supabaseClient';
import '../styles/auth-card.css';

export const RegisterPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('driver');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordConfirmError, setPasswordConfirmError] = useState('');
  const [cudNumberError, setCudNumberError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);
  const mismatch = passwordConfirm.length > 0 && password !== passwordConfirm;
  const emailRef = useRef<HTMLInputElement>(null);

  // Disability & CUD Verification states
  const [hasDisabilityPermit, setHasDisabilityPermit] = useState(false);
  const [cudNumber, setCudNumber] = useState('');
  const [cudDni, setCudDni] = useState('');
  const [cudExpiration, setCudExpiration] = useState('');
  const [isVerifyingCud, setIsVerifyingCud] = useState(false);
  const [cudVerifiedSuccess, setCudVerifiedSuccess] = useState(false);
  const [cudVerificationMessage, setCudVerificationMessage] = useState('');

  const { register, user } = useAuth();
  const { success, info, error } = useToast();
  const { isDark } = useTheme();
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
      setCudNumberError('Ingresá el número de CUD impreso en tu certificado.');
      return;
    }
    setCudNumberError('');
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
        setCudNumberError('El CUD ingresado no pudo ser validado.');
      }
    } catch (err: any) {
      setCudVerifiedSuccess(false);
      setCudNumberError(err.message || 'Error al validar el CUD. Verificá los datos ingresados.');
    } finally {
      setIsVerifyingCud(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextFirstNameError = firstName.trim() ? '' : 'Ingresa tu nombre.';
    const nextLastNameError = lastName.trim() ? '' : 'Ingresa tu apellido.';
    const emailValidation = validateStrictEmail(email);
    const nextEmailError = emailValidation.valid ? '' : (emailValidation.error || 'Ingresa un correo electrónico válido.');
    const nextPasswordError = !password
      ? 'Ingresa una contraseña.'
      : !isPasswordValid(password)
        ? 'La contraseña no cumple los requisitos indicados abajo.'
        : '';
    const nextPasswordConfirmError = !passwordConfirm
      ? 'Confirma tu contraseña.'
      : password !== passwordConfirm
        ? 'Las contraseñas no coinciden.'
        : '';
    const isDriver = role === 'driver';
    const applyCud = isDriver && hasDisabilityPermit;
    const nextCudNumberError = applyCud && !cudNumber.trim()
      ? 'Ingresá tu número de CUD.'
      : '';

    setFirstNameError(nextFirstNameError);
    setLastNameError(nextLastNameError);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setPasswordConfirmError(nextPasswordConfirmError);
    setCudNumberError(nextCudNumberError);
    setFormError('');

    if (
      nextFirstNameError ||
      nextLastNameError ||
      nextEmailError ||
      nextPasswordError ||
      nextPasswordConfirmError ||
      nextCudNumberError
    ) {
      if (nextPasswordError || nextPasswordConfirmError) setShake((n) => n + 1);
      return;
    }

    try {
      setLoading(true);
      const res = await register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: emailValidation.cleanEmail,
        phone: phone.trim(),
        role,
        password,
        password_confirmation: passwordConfirm,
        has_disability_permit: applyCud,
        cud_number: applyCud ? cudNumber.trim() : undefined,
        cud_dni: applyCud ? cudDni.trim() : undefined,
        cud_expiration: applyCud && cudExpiration ? cudExpiration : undefined,
      });

      if (applyCud) {
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
      setFormError(err.message || 'Error al registrar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pk-auth-bg pk-auth-light-bg pk-auth-register-page min-h-[calc(100vh-5rem)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="pk-auth-layout">
        <section className="pk-auth-intro" aria-labelledby="pk-register-intro-title">
          <h1 id="pk-register-intro-title">
            <span>Crear Cuenta</span>
            <span className="pk-auth-intro-brandline">
              <span>en</span>
              <span className="pk-auth-intro-brand">PARKIA</span>
            </span>
          </h1>
          <p>Únete a la comunidad de movilidad inteligente.</p>
        </section>

        <div className="pk-auth-form-column animate-fade-in">
          <Link to="/" className="pk-auth-mobile-brand group" aria-label="PARKIA - inicio">
            <img src={isDark ? '/logo-parkia-oscuro.png' : '/logo-parkia.png'} alt="PARKIA" />
          </Link>
          <div className="pk-glow-card p-6 sm:p-8">
            <div className="pk-auth-heading text-center">
              <h2 className="text-2xl font-extrabold text-navy-900 dark:text-white tracking-tight">
                Crear Cuenta en PARKIA
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Únete a la comunidad de movilidad inteligente.
              </p>
            </div>
          
          <form onSubmit={handleSubmit} noValidate className="pk-auth-form pk-register-form">
            
            {/* Role Switcher */}
            <div className="pk-register-role">
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
                  onClick={() => {
                    setRole('owner');
                    setHasDisabilityPermit(false);
                    setCudNumber('');
                    setCudDni('');
                    setCudExpiration('');
                    setCudVerifiedSuccess(false);
                    setCudNumberError('');
                    setCudVerificationMessage('');
                  }}
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

            <div className="mb-2">
              <GoogleLoginButton
                role={role === 'owner' ? 'owner' : 'driver'}
                onError={(msg) => error(msg)}
              />
            </div>

            {isSupabaseConfigured() && (
              <div className="relative flex py-1 items-center mb-4">
                <div className="flex-grow border-t border-slate-200 dark:border-parkia-line-dark" />
                <span className="flex-shrink mx-3 text-slate-400 dark:text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                  O completá tus datos
                </span>
                <div className="flex-grow border-t border-slate-200 dark:border-parkia-line-dark" />
              </div>
            )}

            {/* Accessibility / CUD Disability Option (Exclusivo para conductores) */}
            {role === 'driver' && (
              <div className={`pk-register-accessibility rounded-2xl border transition-all p-3.5 sm:p-4 ${
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
                        setCudNumberError('');
                        setFormError('');
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
                          aria-invalid={!!cudNumberError}
                          aria-describedby={cudNumberError ? 'cud-number-error' : undefined}
                          placeholder="Ej: 04-38912456-7"
                          value={cudNumber}
                          onChange={(e) => {
                            setCudNumber(e.target.value.toUpperCase());
                            setCudNumberError('');
                            setFormError('');
                            setCudVerifiedSuccess(false);
                          }}
                          className={`w-full text-xs font-mono font-bold bg-white dark:bg-slate-800 border rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[38px] ${
                            cudNumberError ? 'border-rose-400 dark:border-rose-500' : 'border-slate-200 dark:border-parkia-line-dark'
                          }`}
                        />
                        {cudNumberError && (
                          <p id="cud-number-error" className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400" role="alert">
                            {cudNumberError}
                          </p>
                        )}
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
            )}

            {/* Name and Last Name */}
            <div className="pk-register-names grid grid-cols-2 gap-3">
              <Input
                label="Nombre"
                required
                autoComplete="given-name"
                placeholder="Carlos"
                value={firstName}
                error={firstNameError}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  setFirstNameError('');
                  setFormError('');
                }}
              />
              <Input
                label="Apellido"
                required
                autoComplete="family-name"
                placeholder="Méndez"
                value={lastName}
                error={lastNameError}
                onChange={(e) => {
                  setLastName(e.target.value);
                  setLastNameError('');
                  setFormError('');
                }}
              />
            </div>

            {/* Email */}
            <Input
              ref={emailRef}
              type="email"
              label="Correo Electrónico"
              required
              autoComplete="email"
              placeholder="carlos@ejemplo.com"
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
              error={passwordError || undefined}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError('');
                setPasswordConfirmError('');
                setFormError('');
              }}
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
              onChange={(e) => {
                setPasswordConfirm(e.target.value);
                setPasswordConfirmError('');
                setFormError('');
              }}
              error={passwordConfirmError || (mismatch ? 'Las contraseñas no coinciden.' : undefined)}
              shakeSignal={shake}
            />

            {formError && (
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400" role="alert">
                {formError}
              </p>
            )}

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
    </div>
  );
};