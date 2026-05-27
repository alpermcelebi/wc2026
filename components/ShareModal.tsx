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
    const shareText = "🏆 İşte benim 2026 Dünya Kupası tahminlerim! Şampiyonumu seçtim, ödülleri belirledim. Sen de kendi turnuva ağacını kur ve kupon kodunu alarak benimle kapış!";
    try {
      await navigator.clipboard.writeText(`${shareText}\n\nSite Linki: ${shareUrl}`);
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

  const shareText = "🏆 İşte benim 2026 Dünya Kupası tahminlerim! Şampiyonumu seçtim, ödülleri belirledim. Sen de kendi turnuva ağacını kur ve kupon kodunu alarak benimle kapış!";

  const twitterIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareText
  )}&url=${encodeURIComponent(shareUrl)}`;

  const whatsappIntent = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `${shareText}\n\n${shareUrl}`
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
        <div className="p-6 space-y-4 overflow-y-auto scrollbar-thin">

          {/* Infographic Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block">
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

          {/* ROW 1: THE IMAGE DOWNLOAD ACTION (Primary Call-to-Action) */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-brand-purple/5 border border-brand-purple/30 hover:bg-brand-purple/10 hover:border-brand-purple/50 font-black text-sm text-white shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 disabled:opacity-50"
          >
            {downloading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
                Downloading Poster...
              </>
            ) : (
              <>
                📥 Download My Story Poster
              </>
            )}
          </button>

          {/* ROW 2: THE COMPACT LINK SHARING AREA */}
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
                    <span className="text-sm">📋</span>
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ROW 3: THE DIRECT SOCIAL MEDIA DIRECTORIES */}
          <div className="grid grid-cols-2 gap-4 w-full">
            {/* Twitter/X */}
            <a
              href={twitterIntent}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 font-black text-sm text-white transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              𝕏 Share on X
            </a>

            {/* WhatsApp */}
            <a
              href={whatsappIntent}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 font-black text-sm text-emerald-400 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
            >
              <span className="text-base">🟢</span>
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
