import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle2, Info, Terminal, ExternalLink } from 'lucide-react';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import '../styles/auth-card.css';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const { success } = useToast();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextEmailError = !email.trim()
      ? 'Ingresa tu correo electrónico.'
      : emailRef.current && !emailRef.current.validity.valid
        ? 'Ingresa un correo electrónico válido.'
        : '';
    setEmailError(nextEmailError);
    setFormError('');

    if (nextEmailError) {
      return;
    }

    try {
      setLoading(true);
      const res = await authService.requestPasswordReset(email.trim());
      setSubmitted(true);
      if (res.dev_reset_url) {
        setDevResetUrl(res.dev_reset_url);
      }
      success('Solicitud enviada correctamente');
    } catch (err: any) {
      setFormError(err.message || 'Ocurrió un error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDevUrl = () => {
    if (!devResetUrl) return;
    try {
      const url = new URL(devResetUrl);
      navigate(`${url.pathname}${url.search}`);
    } catch {
      window.location.href = devResetUrl;
    }
  };

  return (
    <div className="pk-auth-bg pk-auth-light-bg pk-auth-recovery-page min-h-[calc(100vh-5rem)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="pk-auth-layout">
        <div className="pk-auth-form-column animate-fade-in">
          <Link to="/" className="pk-auth-mobile-brand group" aria-label="PARKIA - inicio">
            <img src={isDark ? '/logo-parkia-oscuro.png' : '/logo-parkia.png'} alt="PARKIA" />
          </Link>

          <div className="pk-glow-card p-6 sm:p-8">
            <div className="pk-auth-heading text-center">
              <h2 className="text-2xl font-extrabold text-navy-900 dark:text-white tracking-tight">
                Recuperar Contraseña
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Ingresa tu correo y te enviaremos un enlace seguro para restablecerla.
              </p>
            </div>
          {!submitted ? (
            <form onSubmit={handleSubmit} noValidate className="pk-recovery-form space-y-5 mt-5">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-parkia-navy/40 p-3.5 rounded-2xl border border-slate-200/70 dark:border-parkia-line-dark">
                Escribe la dirección de correo electrónico con la que te registraste en <strong>PARKIA</strong>. Te enviaremos un correo con las instrucciones para crear una nueva clave.
              </p>

              <Input
                ref={emailRef}
                type="email"
                label="Correo Electrónico"
                required
                autoComplete="email"
                placeholder="tu@email.com"
                value={email}
                error={emailError}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                  setFormError('');
                }}
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
                fullWidth
                rightIcon={<Send className="w-4 h-4" />}
              >
                Enviar Enlace de Recuperación
              </Button>
              {formError && (
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400" role="alert">
                  {formError}
                </p>
              )}

              <div className="text-center pt-4 border-t border-slate-100 dark:border-parkia-line-dark">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Volver a Iniciar Sesión
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-6 text-center animate-fade-in mt-5">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50 dark:ring-emerald-950/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-navy-900 dark:text-white">¡Correo Enviado!</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Si la cuenta <strong className="text-slate-800 dark:text-slate-200">{email}</strong> existe en PARKIA, recibirás un correo con el enlace para restablecer tu contraseña.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-parkia-navy/40 rounded-2xl border border-slate-200/80 dark:border-parkia-line-dark text-xs text-slate-600 dark:text-slate-300 text-left flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
                <span><strong>Consejo:</strong> Revisa también tu carpeta de correo no deseado o <em>Spam</em> si no lo ves en unos minutos.</span>
              </div>

              {/* Dev Mode Shortcut Box */}
              {devResetUrl && (
                <div className="p-4 bg-brand-50/80 dark:bg-brand-950/30 rounded-2xl border border-brand-200/80 dark:border-brand-800/60 text-left space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-brand-900 dark:text-brand-200">
                    <Terminal className="w-4 h-4 text-brand-600" />
                    <span>Modo Desarrollo / Pruebas Locales</span>
                  </div>
                  <p className="text-xs text-brand-700 dark:text-brand-300">
                    Para probarlo inmediatamente sin necesidad de revisar el correo o la consola:
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenDevUrl}
                    className="w-full mt-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                  >
                    <span>Ir a Cambiar Contraseña Ahora</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    setSubmitted(false);
                    setDevResetUrl(null);
                  }}
                >
                  Probar con otro correo
                </Button>

                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors py-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Volver a Iniciar Sesión
                </Link>
              </div>
            </div>
          )}
        </div>

        </div>
      </div>
    </div>
  );
};
