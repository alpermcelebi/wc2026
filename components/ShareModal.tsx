'use client';

import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Share2, Download, ExternalLink } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareCode: string;
}

export default function ShareModal({ isOpen, onClose, shareCode }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(`${window.location.protocol}//${window.location.host}/share/${shareCode}`);
    }
  }, [shareCode]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const ogImageUrl = `/api/og?predictions=${shareCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch(ogImageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'wc2026-bracket-predictions.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleNativeShare = async () => {
    try {
      const response = await fetch(ogImageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'wc2026-predictions.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'My WC 2026 Bracket Predictions',
          text: 'Check out my FIFA World Cup 2026 bracket predictions!',
          files: [file],
        });
      } else if (navigator.share) {
        await navigator.share({
          title: 'My WC 2026 Bracket Predictions',
          text: 'Check out my FIFA World Cup 2026 bracket predictions!',
          url: shareUrl,
        });
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  };

  const twitterIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    'Check out my predictions for the FIFA World Cup 2026! 🏆⚽'
  )}&url=${encodeURIComponent(shareUrl)}`;

  const whatsappIntent = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Check out my FIFA World Cup 2026 predictions bracket: ${shareUrl}`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#0c0d19]/90 backdrop-blur-xl shadow-2xl transition-all duration-300 transform scale-100 flex flex-col max-h-[90vh]">
        {/* Colorful top bar */}
        <div className="h-1 bg-brand-gradient w-full flex-shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider">
                Share Your Bracket
              </h3>
              <p className="text-xs text-zinc-400">
                Download or share your official bracket infographic.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto scrollbar-thin">

          {/* Infographic Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                Official Bracket Poster Preview
              </span>
              <a
                href={ogImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-brand-purple hover:text-white flex items-center gap-1 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Open Full Size
              </a>
            </div>
            <div className="relative h-[400px] sm:h-[460px] aspect-[9/16] mx-auto rounded-2xl overflow-hidden border border-white/10 bg-zinc-950/80 shadow-inner group">
              <img
                src={ogImageUrl}
                alt="Official Bracket Prediction Poster"
                className="w-full h-full object-contain"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 pointer-events-none">
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-white backdrop-blur-sm">
                  Click "Download Image" below to save
                </span>
              </div>
            </div>
          </div>

          {/* Download & Native Share Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-brand-purple text-white font-bold text-sm hover:bg-brand-purple/90 shadow-lg shadow-brand-purple/20 transition-all duration-300 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Downloading...' : 'Download Image'}
            </button>
            <button
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-bold text-sm text-white transition-all duration-300"
            >
              <Share2 className="w-4 h-4" />
              Share Image
            </button>
          </div>

          {/* Copyable Link */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block">
              Shareable Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm touch-manipulation text-zinc-300 font-mono focus:outline-none focus:border-brand-purple transition-all duration-300"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleCopy}
                className={`flex items-center justify-center gap-2 px-4 rounded-xl font-bold text-xs transition-all duration-300 min-w-[100px] ${
                  copied
                    ? 'bg-brand-lime/10 text-brand-lime border border-brand-lime/20'
                    : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Social Intent Quick Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {/* Twitter/X */}
            <a
              href={twitterIntent}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-bold text-sm text-white transition-all duration-300"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Share on X
            </a>

            {/* WhatsApp */}
            <a
              href={whatsappIntent}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 font-bold text-sm text-emerald-400 transition-all duration-300"
            >
              <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.59 2.019 14.12 1.012 11.996 1.012c-5.438 0-9.863 4.373-9.867 9.801-.001 1.745.485 3.45 1.407 4.966L2.5 21.844l4.147-1.09zM17.186 14.1c-.287-.143-1.696-.837-1.959-.933-.262-.095-.453-.143-.644.143-.191.286-.74.933-.907 1.122-.167.19-.334.214-.621.071-.287-.143-1.21-.446-2.305-1.424-.853-.76-1.429-1.698-1.597-1.984-.167-.286-.018-.441.125-.583.13-.127.287-.333.43-.5.143-.167.19-.286.287-.476.095-.19.047-.357-.024-.5-.071-.143-.644-1.55-.882-2.122-.232-.559-.467-.483-.644-.492-.167-.008-.358-.01-.55-.01s-.502.072-.765.357c-.263.286-1.004.981-1.004 2.39s1.028 2.775 1.171 2.966c.143.19 2.025 3.093 4.906 4.336.685.296 1.22.473 1.637.605.689.219 1.317.188 1.813.114.553-.083 1.696-.692 1.935-1.362.24-.67.24-1.242.167-1.362-.072-.12-.263-.19-.55-.333z" />
              </svg>
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
