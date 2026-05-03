import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Printer } from 'lucide-react';

interface QRCodeModalProps {
  url: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
}

export default function QRCodeModal({ url, title, subtitle, onClose }: QRCodeModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const svg = printRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const size = 400;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const link = document.createElement('a');
      link.download = `qrcode-${title.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>QR Code - ${title}</title>
          <style>
            body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; }
            .card { text-align: center; padding: 40px; border: 2px solid #e2e8f0; border-radius: 16px; max-width: 400px; }
            h2 { margin: 0 0 4px; font-size: 20px; color: #1e293b; }
            p { margin: 0 0 24px; font-size: 14px; color: #64748b; }
            .url { margin-top: 20px; font-size: 11px; color: #94a3b8; word-break: break-all; }
            svg { display: block; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>${title}</h2>
            ${subtitle ? `<p>${subtitle}</p>` : ''}
            ${content.querySelector('svg')?.outerHTML ?? ''}
            <div class="url">${url}</div>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div ref={printRef} className="flex justify-center mb-4 p-4 bg-white rounded-xl border border-slate-100">
          <QRCodeSVG
            value={url}
            size={220}
            level="H"
            includeMargin
            imageSettings={{
              src: '',
              height: 0,
              width: 0,
              excavate: false,
            }}
          />
        </div>

        <div className="bg-slate-50 rounded-lg px-3 py-2 mb-5">
          <p className="text-xs text-slate-500 font-medium mb-0.5">Lien</p>
          <p className="text-xs text-slate-700 font-mono break-all">{url}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleDownload}
            className="flex items-center justify-center gap-2 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors text-sm">
            <Download className="w-4 h-4" />
            Télécharger
          </button>
          <button onClick={handlePrint}
            className="flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors text-sm">
            <Printer className="w-4 h-4" />
            Imprimer
          </button>
        </div>
      </div>
    </div>
  );
}
