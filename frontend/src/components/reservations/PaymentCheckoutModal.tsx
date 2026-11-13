import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Smartphone, 
  Banknote, 
  Copy, 
  Check, 
  QrCode,
  ArrowRight,
  ExternalLink,
  Lock,
  Wallet
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import confetti from 'canvas-confetti';

export type PaymentMethod = 'Mercado Pago' | 'MODO / Ualá' | 'Tarjeta Débito/Crédito' | 'Efectivo';

interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  method: PaymentMethod;
  amount: number;
  parkingName: string;
  durationHours: number;
  lockExpiresAt?: string | null;
  onPaymentSuccess: (paymentDetails: { method: PaymentMethod; status: 'paid' | 'pending'; providerPayload?: any }) => Promise<void>;
}

export const PaymentCheckoutModal: React.FC<PaymentCheckoutModalProps> = ({
  isOpen,
  onClose,
  method,
  amount,
  parkingName,
  durationHours,
  lockExpiresAt,
  onPaymentSuccess,
}) => {
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'checkout' | 'processing' | 'success'>('checkout');
  const [copiedAlias, setCopiedAlias] = useState(false);

  // Mercado Pago sub-option
  const [mpOption, setMpOption] = useState<'account_money' | 'card' | 'qr'>('account_money');

  // Card form state
  const [cardNumber, setCardNumber] = useState('4509 2381 9012 4242');
  const [cardName, setCardName] = useState('CARLOS MENDEZ');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('883');

  // 15-minute countdown timer matching payment_expires_at
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins

  useEffect(() => {
    if (!isOpen) {
      setStep('checkout');
      setProcessing(false);
      return;
    }

    const calcTime = () => {
      if (lockExpiresAt) {
        return Math.max(0, Math.floor((new Date(lockExpiresAt).getTime() - Date.now()) / 1000));
      }
      return 300; // 5 minutos por defecto para bloqueo de plaza
    };

    setTimeLeft(calcTime());
    const timer = setInterval(() => {
      setTimeLeft(calcTime());
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, lockExpiresAt]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleCopyAlias = () => {
    navigator.clipboard.writeText('parkia.oficial.mp');
    setCopiedAlias(true);
    setTimeout(() => setCopiedAlias(false), 2000);
  };

  const handleAutofillCard = () => {
    setCardNumber('4509 2381 9012 4242');
    setCardName('CARLOS MENDEZ');
    setCardExpiry('11/28');
    setCardCvv('742');
  };

  const handleProcessPayment = async () => {
    if (processing) return;
    if (timeLeft <= 0) {
      alert('El tiempo para completar la reserva ha expirado. Por favor, vuelve a seleccionar una plaza disponible.');
      onClose();
      return;
    }
    try {
      setProcessing(true);
      setStep('processing');

      // Realistic payment processing simulation (1.2s)
      await new Promise((resolve) => setTimeout(resolve, 1200));

      setStep('success');
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });

      await new Promise((resolve) => setTimeout(resolve, 800));

      await onPaymentSuccess({
        method,
        status: method === 'Efectivo' ? 'pending' : 'paid',
        providerPayload: {
          approved_at: new Date().toISOString(),
          reference: `MP-${Date.now().toString().slice(-8)}`,
        },
      });
    } catch (err) {
      setStep('checkout');
      setProcessing(false);
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={processing ? () => {} : onClose}
      maxWidth="md"
      title={
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-2">
            {method === 'Mercado Pago' && (
              <span className="px-2.5 py-1 rounded-lg bg-[#009EE3]/15 text-[#009EE3] font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" />
                Mercado Pago
              </span>
            )}
            {method === 'Tarjeta Débito/Crédito' && (
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                Tarjeta Débito / Crédito
              </span>
            )}
            {method === 'MODO / Ualá' && (
              <span className="px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                MODO • Ualá
              </span>
            )}
            {method === 'Efectivo' && (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5" />
                Pago en Garita / Rapipago
              </span>
            )}
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">• Checkout Seguro</span>
          </div>

          <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            <span>{formatTimer(timeLeft)}</span>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        
        {/* Order Summary Strip */}
        <div className="p-4 bg-slate-100/90 dark:bg-parkia-page-dark rounded-2xl border border-slate-200 dark:border-parkia-line-dark flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block">Estacionamiento</span>
            <strong className="text-sm text-slate-900 dark:text-white font-extrabold">{parkingName}</strong>
            <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">{durationHours.toFixed(1)} horas de estadía</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">Total a pagar</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              ${amount.toLocaleString('es-AR')}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MERCADO PAGO CHECKOUT VIEW */}
        {/* ========================================================================= */}
        {method === 'Mercado Pago' && step === 'checkout' && (
          <div className="space-y-4">
            
            {/* Mercado Pago Brand Banner */}
            <div className="p-3.5 bg-gradient-to-r from-[#009EE3] to-[#007EB5] text-white rounded-2xl shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-black text-base">
                  MP
                </div>
                <div>
                  <h4 className="font-extrabold text-sm leading-tight">Checkout Oficial Mercado Pago</h4>
                  <p className="text-[11px] text-white/80">Acreditación instantánea y comprobante digital</p>
                </div>
              </div>
              <ShieldCheck className="w-5 h-5 text-white/90 shrink-0" />
            </div>

            {/* Payment Sub-options Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Seleccioná cómo querés pagar con Mercado Pago:
              </label>

              {/* Option 1: Dinero en cuenta */}
              <div
                onClick={() => setMpOption('account_money')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  mpOption === 'account_money'
                    ? 'border-[#009EE3] bg-[#009EE3]/5 dark:bg-[#009EE3]/10 ring-2 ring-[#009EE3]/30'
                    : 'border-slate-200 dark:border-parkia-line-dark hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-parkia-card-dark'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    mpOption === 'account_money' ? 'border-[#009EE3] bg-[#009EE3]' : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {mpOption === 'account_money' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <strong className="text-sm text-slate-900 dark:text-white block font-bold">
                      Dinero en cuenta Mercado Pago
                    </strong>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Saldo disponible: <strong className="text-emerald-600 dark:text-emerald-400">$185.400</strong> (Débito inmediato)
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                  Inmediato
                </span>
              </div>

              {/* Option 2: Tarjetas guardadas en MP */}
              <div
                onClick={() => setMpOption('card')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  mpOption === 'card'
                    ? 'border-[#009EE3] bg-[#009EE3]/5 dark:bg-[#009EE3]/10 ring-2 ring-[#009EE3]/30'
                    : 'border-slate-200 dark:border-parkia-line-dark hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-parkia-card-dark'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    mpOption === 'card' ? 'border-[#009EE3] bg-[#009EE3]' : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {mpOption === 'card' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <strong className="text-sm text-slate-900 dark:text-white block font-bold">
                      Visa Débito **** 4242
                    </strong>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Tarjeta vinculada a tu cuenta de Mercado Pago
                    </span>
                  </div>
                </div>
                <CreditCard className="w-4 h-4 text-slate-400" />
              </div>

              {/* Option 3: Escanear QR */}
              <div
                onClick={() => setMpOption('qr')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  mpOption === 'qr'
                    ? 'border-[#009EE3] bg-[#009EE3]/5 dark:bg-[#009EE3]/10 ring-2 ring-[#009EE3]/30'
                    : 'border-slate-200 dark:border-parkia-line-dark hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-parkia-card-dark'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    mpOption === 'qr' ? 'border-[#009EE3] bg-[#009EE3]' : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {mpOption === 'qr' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <strong className="text-sm text-slate-900 dark:text-white block font-bold">
                      Escanear QR con la app de Mercado Pago
                    </strong>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Abrí la app en tu celular y escaneá en pantalla
                    </span>
                  </div>
                </div>
                <QrCode className="w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* QR preview if selected */}
            {mpOption === 'qr' && (
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-parkia-line-dark flex flex-col items-center justify-center text-center animate-fade-in">
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm mb-2">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PARKIA-MP-${amount}-REF892`}
                    alt="QR Mercado Pago"
                    className="w-32 h-32"
                  />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Escaneá para abonar ${amount.toLocaleString('es-AR')}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Acepta dinero en cuenta y tarjetas desde Mercado Pago
                </span>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TARJETA DIRECTA CHECKOUT VIEW */}
        {/* ========================================================================= */}
        {method === 'Tarjeta Débito/Crédito' && step === 'checkout' && (
          <div className="space-y-4">
            
            {/* Virtual Card Graphic */}
            <div className="p-5 bg-gradient-to-tr from-slate-900 via-navy-900 to-indigo-950 text-white rounded-2xl shadow-md border border-slate-800 relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <span className="text-xs uppercase tracking-widest text-brand-300 font-bold">Parkia Pay</span>
                <span className="text-sm font-mono font-black text-amber-300">VISA</span>
              </div>
              <div className="font-mono text-lg tracking-widest text-slate-200 mb-4 font-black">
                {cardNumber || '•••• •••• •••• ••••'}
              </div>
              <div className="flex justify-between items-end text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Titular</span>
                  <span className="font-bold tracking-wider">{cardName || 'NOMBRE Y APELLIDO'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Vence</span>
                  <span className="font-mono font-bold">{cardExpiry || 'MM/AA'}</span>
                </div>
              </div>
            </div>

            {/* Autofill test button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAutofillCard}
                className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
              >
                + Usar tarjeta de prueba (Demo)
              </button>
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Número de Tarjeta
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4509 2381 9012 4242"
                  className="w-full font-mono text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Nombre y Apellido del Titular
                </label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  placeholder="COMO FIGURA EN LA TARJETA"
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Vencimiento
                  </label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/AA"
                    className="w-full font-mono text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Código de Seguridad (CVV)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    placeholder="123"
                    className="w-full font-mono text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODO / UALA VIEW */}
        {/* ========================================================================= */}
        {method === 'MODO / Ualá' && step === 'checkout' && (
          <div className="space-y-4">
            <div className="p-4 bg-teal-50 dark:bg-teal-950/40 rounded-2xl border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200 text-xs">
              <strong>Transferencia Inmediata Interoperable:</strong> Transferí desde cualquier billetera bancaria o MODO / Ualá al alias oficial de Parkia.
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-parkia-line-dark space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-parkia-line-dark">
                <span className="text-xs text-slate-500 dark:text-slate-400">Alias CBU / CVU:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">parkia.oficial.mp</span>
                  <button
                    type="button"
                    onClick={handleCopyAlias}
                    className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
                    title="Copiar alias"
                  >
                    {copiedAlias ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-parkia-line-dark">
                <span className="text-xs text-slate-500 dark:text-slate-400">Titular de Cuenta:</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs">PARKIA ARGENTINA S.A.</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">CUIT:</span>
                <span className="font-mono text-xs text-slate-900 dark:text-white">30-71829384-9</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* EFECTIVO / PAGO FACIL VIEW */}
        {/* ========================================================================= */}
        {method === 'Efectivo' && step === 'checkout' && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 text-xs leading-relaxed">
              <strong>Pago Presencial Garantizado:</strong> Tu plaza queda reservada con garantía de disponibilidad. Al llegar a la garita del estacionamiento, mostrás tu código QR y abonás en efectivo los <strong>${amount.toLocaleString('es-AR')}</strong> directamente al operador o en Rapipago / Pago Fácil.
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-parkia-line-dark text-xs space-y-2">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Sin recargos ni comisiones extra</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Ticket fiscal y comprobante entregado en garita</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Cancelación gratuita hasta el momento del ingreso</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PROCESSING & SUCCESS STATE */}
        {/* ========================================================================= */}
        {step === 'processing' && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3 animate-fade-in">
            <div className="w-14 h-14 rounded-full border-4 border-slate-200 border-t-[#009EE3] animate-spin" />
            <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
              {method === 'Mercado Pago' ? 'Conectando con Mercado Pago...' : 'Procesando pago seguro...'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Validando transacción y asignando tu cochera en tiempo real...
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3 animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Check className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-black text-slate-900 dark:text-white">
              {method === 'Efectivo' ? '¡Reserva Confirmada!' : '¡Pago Aprobado con Éxito!'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
              Tu pase digital QR ya fue generado y enviado a tu cuenta.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {step === 'checkout' && (
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-parkia-line-dark">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Volver
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleProcessPayment}
              disabled={processing}
              className="flex-1 bg-[#A3E635] hover:bg-[#92D425] text-slate-950 font-extrabold border-none shadow-md shadow-lime-500/20"
            >
              {method === 'Mercado Pago' ? `Pagar $${amount.toLocaleString('es-AR')} con MP` : (
                method === 'Efectivo' ? 'Confirmar Reserva' : `Pagar $${amount.toLocaleString('es-AR')}`
              )}
            </Button>
          </div>
        )}

      </div>
    </Modal>
  );
};

