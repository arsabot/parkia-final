import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from 'html5-qrcode';
import { 
  Camera, 
  FlipHorizontal, 
  Flashlight, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Button } from './Button';

interface CameraQrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose?: () => void;
  autoCloseOnSuccess?: boolean;
}

export const CameraQrScanner: React.FC<CameraQrScannerProps> = ({
  onScanSuccess,
  onClose,
  autoCloseOnSuccess = false,
}) => {
  const containerId = 'parkia-qr-scanner-viewport';
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStoppingRef = useRef<boolean>(false);
  const lastScannedCodeRef = useRef<string>('');
  const lastScanTimestampRef = useRef<number>(0);

  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [torchSupported, setTorchSupported] = useState<boolean>(false);
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);

  // Audio feedback synthesis using Web Audio API (cross-platform, zero dependencies)
  const triggerAudioBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // 880Hz A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.14);
      }
    } catch {
      // Audio autoplay policy or lack of support, ignore gracefully
    }
  };

  // Haptic feedback for mobile & tablet
  const triggerVibration = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([70, 40, 70]);
      } catch {
        // Ignored
      }
    }
  };

  // Safe stop
  const stopScanner = useCallback(async () => {
    if (!scannerRef.current) return;
    if (isStoppingRef.current) return;

    try {
      isStoppingRef.current = true;
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      await scannerRef.current.clear();
    } catch (err) {
      console.warn('Parkia Scanner: Safe stop notice', err);
    } finally {
      isStoppingRef.current = false;
      setIsScanning(false);
    }
  }, []);

  // Handle successful detection
  const handleDecoded = (decodedText: string) => {
    const now = Date.now();
    // Debounce: prevent same code scanning within 2.5 seconds
    if (decodedText === lastScannedCodeRef.current && now - lastScanTimestampRef.current < 2500) {
      return;
    }

    lastScannedCodeRef.current = decodedText;
    lastScanTimestampRef.current = now;

    // Visual & audio-haptic feedback
    triggerAudioBeep();
    triggerVibration();
    setScanFeedback(decodedText);

    setTimeout(() => {
      setScanFeedback(null);
    }, 2000);

    onScanSuccess(decodedText);

    if (autoCloseOnSuccess && onClose) {
      stopScanner().then(() => onClose());
    }
  };

  // Start scanner using device or facingMode
  const startScanner = useCallback(async (cameraIdToUse?: string) => {
    setCameraError(null);
    setIsInitializing(true);

    try {
      await stopScanner();

      // Check if container element exists in DOM
      const elem = document.getElementById(containerId);
      if (!elem) {
        throw new Error('Elemento visor de cámara no encontrado en pantalla.');
      }

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId, { verbose: false });
      }

      const config: Html5QrcodeCameraScanConfig = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minDim = Math.min(viewfinderWidth, viewfinderHeight);
          // Scale qrbox to 70% of viewfinder, capped between 200 and 320px
          const boxSize = Math.max(200, Math.min(320, Math.floor(minDim * 0.72)));
          return { width: boxSize, height: boxSize };
        },
        aspectRatio: 1.0,
      };

      // Camera selector logic
      if (cameraIdToUse) {
        await scannerRef.current.start(
          cameraIdToUse,
          config,
          (decodedText) => handleDecoded(decodedText),
          undefined
        );
      } else {
        // Default to environment (back/rear camera for phones & tablets)
        await scannerRef.current.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => handleDecoded(decodedText),
          undefined
        );
      }

      setIsScanning(true);

      // Check torch capability
      try {
        const capabilities = scannerRef.current.getRunningTrackCapabilities();
        if (capabilities && (capabilities as any).torch) {
          setTorchSupported(true);
        } else {
          setTorchSupported(false);
        }
      } catch {
        setTorchSupported(false);
      }
    } catch (err: any) {
      console.error('Error starting camera scanner:', err);
      let msg = 'No se pudo activar la cámara.';
      if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission')) {
        msg = 'Permiso de cámara denegado. Por favor habilita el acceso a la cámara en los ajustes de tu navegador.';
      } else if (err?.name === 'NotFoundError' || err?.message?.includes('Requested device not found')) {
        msg = 'No se encontró ninguna cámara disponible en este dispositivo.';
      } else if (err?.name === 'NotReadableError') {
        msg = 'La cámara está siendo usada por otra aplicación. Ciérrala e intenta nuevamente.';
      } else if (typeof err === 'string') {
        msg = err;
      }
      setCameraError(msg);
      setIsScanning(false);
    } finally {
      setIsInitializing(false);
    }
  }, [stopScanner]);

  // Initial load: Query cameras and launch scanner
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        // Enumerate devices
        const devices = await Html5Qrcode.getCameras();
        if (!isMounted) return;

        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back/rear camera for tablets & phones
          const rearCam = devices.find((c) =>
            /back|rear|environment|trasera|posterior/i.test(c.label)
          );
          const initialCamId = rearCam ? rearCam.id : devices[devices.length - 1].id;
          setSelectedCameraId(initialCamId);
          await startScanner(initialCamId);
        } else {
          // Fallback to generic facingMode environment
          await startScanner();
        }
      } catch (err: any) {
        console.warn('Camera enumeration error, trying facingMode environment fallback:', err);
        if (isMounted) {
          await startScanner();
        }
      }
    };

    init();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, []);

  // Switch camera
  const handleSwitchCamera = async () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamId = cameras[nextIndex].id;
    setSelectedCameraId(nextCamId);
    await startScanner(nextCamId);
  };

  // Toggle Torch/Flashlight
  const handleToggleTorch = async () => {
    if (!scannerRef.current || !torchSupported) return;
    try {
      const nextTorch = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch } as any],
      });
      setTorchOn(nextTorch);
    } catch (err) {
      console.warn('Torch toggle not supported or error:', err);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 text-white animate-scale-in">
      
      {/* Top Bar Controls */}
      <div className="flex items-center justify-between p-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 z-20 relative">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold tracking-wide text-slate-200">
            Escáner QR en Vivo
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Torch toggle if device supports */}
          {torchSupported && (
            <button
              onClick={handleToggleTorch}
              className={`p-2 rounded-xl text-xs font-semibold transition-colors ${
                torchOn
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Linterna"
            >
              <Flashlight className="w-4 h-4" />
            </button>
          )}

          {/* Switch camera button if multiple exist */}
          {cameras.length > 1 && (
            <button
              onClick={handleSwitchCamera}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-xs font-semibold flex items-center gap-1"
              title="Cambiar Cámara"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
          )}

          {/* Close button */}
          {onClose && (
            <button
              onClick={() => {
                stopScanner();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition-colors"
              title="Cerrar Escáner"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Camera Viewport Area */}
      <div className="relative w-full aspect-square bg-black overflow-hidden flex items-center justify-center">
        
        {/* Html5Qrcode target container */}
        <div
          id={containerId}
          className="w-full h-full [&>video]:object-cover [&>video]:w-full [&>video]:h-full"
        />

        {/* Viewfinder Reticle Overlay & Scanning Animation */}
        {isScanning && !cameraError && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            
            {/* Dark Mask Vignette */}
            <div className="absolute inset-0 bg-slate-950/30" />

            {/* Target Reticle Box */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 border-2 border-dashed border-emerald-400/50 rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(40,193,117,0.2)]">
              
              {/* 4 Corner Brackets (Parkia Emerald #28C175) */}
              <span className="absolute -top-1 -left-1 w-7 h-7 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
              <span className="absolute -top-1 -right-1 w-7 h-7 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
              <span className="absolute -bottom-1 -left-1 w-7 h-7 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
              <span className="absolute -bottom-1 -right-1 w-7 h-7 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

              {/* Animated Laser Scanning Line */}
              <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#28C175] animate-[scanLaser_2.2s_ease-in-out_infinite]" />

              {/* Central faint crosshair */}
              <div className="w-3 h-3 border-t border-b border-emerald-400/40" />
              <div className="w-3 h-3 border-l border-r border-emerald-400/40 absolute" />
            </div>

            {/* Live Scan Notification Toast */}
            {scanFeedback && (
              <div className="absolute bottom-6 px-4 py-2 bg-emerald-500 text-slate-950 font-black text-sm rounded-full shadow-lg flex items-center gap-2 animate-bounce">
                <CheckCircle2 className="w-4 h-4" />
                <span>¡Código Detectado: {scanFeedback}!</span>
              </div>
            )}
          </div>
        )}

        {/* Loading Spinner */}
        {isInitializing && (
          <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center p-6 text-center z-10">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
            <p className="text-sm font-bold text-slate-200">Activando cámara del dispositivo...</p>
            <p className="text-xs text-slate-400 mt-1">
              Compatible con teléfonos, tablets iPad/Android y notebooks.
            </p>
          </div>
        )}

        {/* Error State */}
        {cameraError && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Acceso a cámara requerido</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-xs mx-auto">
                {cameraError}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="emerald"
                size="sm"
                onClick={() => startScanner(selectedCameraId)}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Reintentar
              </Button>
              {onClose && (
                <Button variant="outline" size="sm" onClick={onClose}>
                  Usar Teclado
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info & Camera Picker */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 text-xs text-slate-400 space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            {cameras.length > 1 ? (
              <select
                value={selectedCameraId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedCameraId(id);
                  startScanner(id);
                }}
                className="bg-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1 border border-slate-700 focus:outline-none"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label || `Cámara ${c.id.slice(0, 5)}...`}
                  </option>
                ))}
              </select>
            ) : (
              <span>Cámara predeterminada activa</span>
            )}
          </span>

          <span className="text-[11px] font-semibold text-emerald-400">
            Escaneo instantáneo 15 FPS
          </span>
        </div>

        <p className="text-[11px] text-slate-500 text-center">
          Apunta con la cámara hacia el código QR en la pantalla del celular del conductor.
        </p>
      </div>

      {/* Custom Keyframes for Laser Scan */}
      <style>{`
        @keyframes scanLaser {
          0% { top: 4%; opacity: 0.3; }
          50% { top: 94%; opacity: 1; }
          100% { top: 4%; opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};
