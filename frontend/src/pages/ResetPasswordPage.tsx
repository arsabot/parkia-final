import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid') || '';
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  const { error, success } = useToast();
  const navigate = useNavigate();

  // Validate token on mount
  useEffect(() => {
    if (!uid || !token) {
      setValidating(false);
      setTokenValid(false);
      setErrorMessage('El enlace de recuperación es incompleto o no es válido.');
      return;
    }

    const checkToken = async () => {
      try {
        const res = await authService.validateResetToken(uid, token);
        if (res.valid) {
          setTokenValid(true);
          if (res.email) setUserEmail(res.email);
        } else {
          setTokenValid(false);
          setErrorMessage(res.message || 'El enlace ha expirado o ya fue utilizado.');
        }
      } catch (err: any) {
        setTokenValid(false);
        setErrorMessage(err.message || 'El enlace de recuperación ha expirado o no es válido.');
      } finally {
        setValidating(false);
      }
    };

    checkToken();
  }, [uid, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !passwordConfirmation) {
      error('Por favor completa ambos campos de contraseña');
      return;
    }

    if (password.length < 6) {
      error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== passwordConfirmation) {
      error('Las contraseñas no coinciden');
      return;
    }

    try {
      setLoading(true);
      await authService.confirmPasswordReset({
        uid,
        token,
        password,
        password_confirmation: passwordConfirmation,
      });
      setIsSuccess(true);
      success('¡Contraseña actualizada exitosamente!');
    } catch (err: any) {
      error(err.message || 'No se pudo restablecer la contraseña. El enlace puede haber expirado.');
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
          <h2 className="text-3xl font-extrabold text-navy-900 tracking-tight">
            Nueva Contraseña
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            Ingresa y confirma tu nueva clave de acceso para PARKIA.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
          {validating ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
              <p className="text-xs text-slate-500 font-medium">Verificando enlace de seguridad...</p>
            </div>
          ) : isSuccess ? (
            <div className="text-center space-y-6 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-navy-900">¡Contraseña Actualizada!</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tus nuevas credenciales.
                </p>
              </div>

              <Button
                type="button"
                variant="primary"
                fullWidth
                onClick={() => navigate('/login')}
                className="mt-4"
              >
                Ir a Iniciar Sesión
              </Button>
            </div>
          ) : tokenValid === false ? (
            <div className="text-center space-y-6 animate-fade-in">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-rose-50/50">
                <AlertCircle className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-navy-900">Enlace Inválido o Expirado</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  {errorMessage || 'El enlace para restablecer tu contraseña no es válido o ya ha sido utilizado.'}
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  type="button"
                  variant="primary"
                  fullWidth
                  onClick={() => navigate('/forgot-password')}
                >
                  Solicitar un nuevo enlace
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
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {userEmail && (
                <div className="p-3 bg-brand-50/70 border border-brand-200/60 rounded-2xl text-xs text-brand-900 mb-2">
                  Restableciendo contraseña para: <strong>{userEmail}</strong>
                </div>
              )}

              <Input
                type="password"
                label="Nueva Contraseña"
                required
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                hint="Debe contener al menos 6 caracteres"
              />

              <Input
                type="password"
                label="Confirmar Nueva Contraseña"
                required
                placeholder="Repite tu nueva contraseña"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                leftIcon={<KeyRound className="w-4 h-4" />}
              />

              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
                fullWidth
                className="mt-2"
              >
                Guardar Nueva Contraseña
              </Button>

              <div className="text-center pt-4 border-t border-slate-100">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-600 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Cancelar y Volver al Login
                </Link>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
