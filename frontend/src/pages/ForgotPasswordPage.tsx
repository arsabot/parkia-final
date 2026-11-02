import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle2, Sparkles, ExternalLink } from 'lucide-react';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const { error, success } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      error('Por favor ingresa tu correo electrónico');
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
      error(err.message || 'Ocurrió un error al procesar la solicitud');
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
          <h2 className="text-3xl font-extrabold text-navy-900 tracking-tight">
            Recuperar Contraseña
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            Ingresa tu correo y te enviaremos un enlace seguro para restablecerla.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
                Escribe la dirección de correo electrónico con la que te registraste en <strong>PARKIA</strong>. Te enviaremos un correo con las instrucciones para crear una nueva clave.
              </p>

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

              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
                fullWidth
                rightIcon={<Send className="w-4 h-4" />}
              >
                Enviar Enlace de Recuperación
              </Button>

              <div className="text-center pt-4 border-t border-slate-100">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-600 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Volver a Iniciar Sesión
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-6 text-center animate-fade-in">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-navy-900">¡Correo Enviado!</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Si la cuenta <strong className="text-slate-800">{email}</strong> existe en PARKIA, recibirás un correo con el enlace para restablecer tu contraseña.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 text-left">
                💡 <strong>Consejo:</strong> Revisa también tu carpeta de correo no deseado o <em>Spam</em> si no lo ves en unos minutos.
              </div>

              {/* Dev Mode Shortcut Box */}
              {devResetUrl && (
                <div className="p-4 bg-brand-50/80 rounded-2xl border border-brand-200/80 text-left space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-brand-900">
                    <Sparkles className="w-4 h-4 text-brand-600" />
                    <span>Modo Desarrollo / Pruebas Locales</span>
                  </div>
                  <p className="text-xs text-brand-700">
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
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-600 transition-colors py-2"
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
  );
};
