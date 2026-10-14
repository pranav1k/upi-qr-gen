import { useRef, useEffect, useState, useCallback } from 'react';
import QRCode from 'qrcode';

export default function QrCodeDisplay({ data, upiUri, errorCorrectionLevel = 'M' }) {
  const canvasRef = useRef(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [qrError, setQrError] = useState(null);
  const [canCopyImage, setCanCopyImage] = useState(false);

  useEffect(() => {
    // Check if ClipboardItem is supported in this browser
    if (typeof window !== 'undefined' && window.ClipboardItem && navigator.clipboard?.write) {
      setCanCopyImage(true);
    }
  }, []);

  // Render QR code to canvas whenever upiUri or errorCorrectionLevel changes
  useEffect(() => {
    if (!canvasRef.current || !upiUri) return;

    setQrError(null);
    QRCode.toCanvas(
      canvasRef.current,
      upiUri,
      {
        width: 256,
        margin: 2,
        errorCorrectionLevel,
        color: {
          dark: '#0f172a', // slate-900 for crisp, high-contrast scanning
          light: '#ffffff',
        },
      },
      (error) => {
        if (error) {
          console.error('Error rendering QR Code:', error);
          setQrError('Failed to generate QR code. Check inputs.');
        }
      }
    );
  }, [upiUri, errorCorrectionLevel]);

  // Download high-resolution PNG (1024x1024 for crisp printing/standees)
  const downloadPng = useCallback(async () => {
    if (!upiUri) return;
    try {
      const dataUrl = await QRCode.toDataURL(upiUri, {
        width: 1024,
        margin: 2,
        errorCorrectionLevel,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      const cleanUpi = (data.upiId || 'upi').replace(/[^a-zA-Z0-9]/g, '_');
      const link = document.createElement('a');
      link.download = `upi-qr-${cleanUpi}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download PNG:', err);
    }
  }, [upiUri, data.upiId, errorCorrectionLevel]);

  // Download scalable vector SVG
  const downloadSvg = useCallback(async () => {
    if (!upiUri) return;
    try {
      const svgString = await QRCode.toString(upiUri, {
        type: 'svg',
        margin: 2,
        errorCorrectionLevel,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      const cleanUpi = (data.upiId || 'upi').replace(/[^a-zA-Z0-9]/g, '_');
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `upi-qr-${cleanUpi}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download SVG:', err);
    }
  }, [upiUri, data.upiId, errorCorrectionLevel]);

  // Copy UPI Deep Link
  const copyLink = useCallback(async () => {
    if (!upiUri) return;
    try {
      await navigator.clipboard.writeText(upiUri);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  }, [upiUri]);

  // Copy QR Image to Clipboard
  const copyImage = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new window.ClipboardItem({ 'image/png': blob })
        ]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2200);
      }, 'image/png');
    } catch (err) {
      console.warn('Clipboard write image not supported or failed:', err);
    }
  }, []);

  const formattedAmount = data.amount ? `₹${parseFloat(data.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null;

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-6 flex flex-col items-center">
      {/* Standee Header */}
      <div className="text-center mb-4 w-full">
        <span className="inline-block bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider mb-2">
          Scan & Pay
        </span>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
          {data.name || 'UPI Payee'}
        </h2>
        <p className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate mt-0.5">
          {data.upiId}
        </p>
      </div>

      {/* QR Code Canvas */}
      <div className="relative p-3 bg-white rounded-xl border border-gray-100 shadow-inner flex flex-col items-center justify-center">
        {qrError ? (
          <div className="h-64 w-64 flex items-center justify-center text-red-500 text-center p-4 text-sm font-medium">
            {qrError}
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="rounded-lg max-w-full"
            style={{ width: '240px', height: '240px' }}
            aria-label="UPI QR Code"
          />
        )}
      </div>

      {/* Payment Details Pill */}
      <div className="mt-4 w-full bg-gray-50 dark:bg-gray-800/80 rounded-xl p-3 border border-gray-100 dark:border-gray-800 text-sm">
        <div className="flex justify-between items-center py-1">
          <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">Amount:</span>
          <span className="font-semibold text-gray-900 dark:text-white text-base">
            {formattedAmount || <span className="text-xs font-normal text-gray-500 dark:text-gray-400">Payer enters amount</span>}
          </span>
        </div>
        {data.note && (
          <div className="flex justify-between items-center py-1 border-t border-gray-200/60 dark:border-gray-700/60">
            <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">Note:</span>
            <span className="text-gray-800 dark:text-gray-200 text-xs truncate max-w-[200px]" title={data.note}>
              {data.note}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-5 w-full grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={downloadPng}
          className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-medium text-xs rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Download PNG</span>
        </button>

        <button
          type="button"
          onClick={downloadSvg}
          className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-gray-100 hover:bg-gray-200 active:scale-95 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium text-xs rounded-xl border border-gray-200 dark:border-gray-700 transition-all focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Download SVG</span>
        </button>

        <button
          type="button"
          onClick={copyLink}
          className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-gray-100 hover:bg-gray-200 active:scale-95 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium text-xs rounded-xl border border-gray-200 dark:border-gray-700 transition-all focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          {copiedLink ? (
            <>
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Link Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span>Copy UPI Link</span>
            </>
          )}
        </button>

        {canCopyImage ? (
          <button
            type="button"
            onClick={copyImage}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-gray-100 hover:bg-gray-200 active:scale-95 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium text-xs rounded-xl border border-gray-200 dark:border-gray-700 transition-all focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            {copiedImage ? (
              <>
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Image Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Copy Image</span>
              </>
            )}
          </button>
        ) : (
          <div className="py-2.5 px-3 flex items-center justify-center text-[11px] text-gray-600 dark:text-gray-400 font-mono truncate bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200/50 dark:border-gray-800" title={upiUri}>
            {upiUri}
          </div>
        )}
      </div>
    </div>
  );
}
