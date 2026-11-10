import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, Download, Copy, Check } from 'lucide-react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
  showDownload?: boolean;
  showCopy?: boolean;
  title?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 200,
  className = '',
  showDownload = true,
  showCopy = true,
  title = 'Código QR de Acceso'
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    QRCode.toDataURL(value, {
      width: size,
      margin: 2,
      color: {
        dark: '#0F172A', // Slate-900 para óptimo contraste en lectores ópticos
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    })
      .then((url) => setDataUrl(url))
      .catch((err) => console.error('Error generando QR', err));
  }, [value, size]);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `QR-${value}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className={`flex flex-col items-center bg-slate-50 dark:bg-parkia-page-dark/70 p-5 rounded-3xl border border-slate-200/90 dark:border-parkia-line-dark shadow-sm transition-colors ${className}`}>
      {title && (
        <span className="text-xs font-black tracking-wider text-slate-800 dark:text-slate-200 uppercase mb-3 flex items-center gap-2">
          <QrCode className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          {title}
        </span>
      )}

      {/* QR image container: Pure white background with quiet zone required for barcode optical sensors */}
      <div className="relative p-3.5 bg-white rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center">
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={`Código QR para la reserva ${value}`}
            className="rounded-lg object-contain block"
            style={{ width: size, height: size }}
          />
        ) : (
          <div
            className="flex items-center justify-center bg-slate-100 rounded-lg animate-pulse"
            style={{ width: size, height: size }}
          >
            <span className="text-xs text-slate-500 font-semibold">Generando QR...</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-3.5">
        <span className="font-mono text-base font-black text-slate-900 dark:text-white bg-white dark:bg-slate-800/90 px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 tracking-wider shadow-xs">
          {value}
        </span>

        {showCopy && (
          <button
            type="button"
            onClick={handleCopy}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-all shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            title="Copiar código al portapapeles"
            aria-label="Copiar código al portapapeles"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        )}

        {showDownload && dataUrl && (
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-all shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            title="Descargar imagen QR"
            aria-label="Descargar imagen QR"
          >
            <Download className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
