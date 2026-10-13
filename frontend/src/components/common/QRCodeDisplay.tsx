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
        dark: '#1A2B42', // Azul Marino Oscuro de la marca
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
    <div className={`flex flex-col items-center bg-white p-4 rounded-2xl border border-slate-200/80 shadow-inner ${className}`}>
      {title && (
        <span className="text-[11px] font-bold tracking-widest text-slate-500 uppercase mb-2 flex items-center gap-1.5">
          <QrCode className="w-3.5 h-3.5 text-brand-600" />
          {title}
        </span>
      )}

      <div className="relative p-2 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-center">
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={`QR ${value}`}
            className="rounded-lg object-contain"
            style={{ width: size, height: size }}
          />
        ) : (
          <div
            className="flex items-center justify-center bg-slate-50 rounded-lg animate-pulse"
            style={{ width: size, height: size }}
          >
            <span className="text-xs text-slate-400 font-semibold">Generando QR...</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-3">
        <span className="font-mono text-sm font-black text-navy-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200/60">
          {value}
        </span>

        {showCopy && (
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Copiar código al portapapeles"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        )}

        {showDownload && dataUrl && (
          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Descargar imagen QR"
          >
            <Download className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
