'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Music, ChevronDown, ChevronUp, SkipForward, SkipBack } from 'lucide-react';

const TRACKS = [
  {
    title: "Dai Dai (2026 Anthem)",
    artist: "Shakira ft. Burna Boy",
    youtubeId: "fcnDmrtj6Sk"
  },
  {
    title: "Waka Waka (This Time for Africa)",
    artist: "Shakira",
    youtubeId: "pRpeEdMmmQ0"
  },
  {
    title: "La La La (Brazil 2014)",
    artist: "Shakira ft. Carlinhos Brown",
    youtubeId: "7-7knsL-MaE"
  }
];

export const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const sendCommand = (func: string, args: string = '') => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    }
  };

  const handlePlay = () => {
    sendCommand('playVideo');
    setIsPlaying(true);
  };

  const handlePause = () => {
    sendCommand('pauseVideo');
    setIsPlaying(false);
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      sendCommand('unMute');
      setIsMuted(false);
    } else {
      sendCommand('mute');
      setIsMuted(true);
    }
  };

  const handleNext = () => {
    const nextIndex = (currentTrack + 1) % TRACKS.length;
    setCurrentTrack(nextIndex);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    const prevIndex = (currentTrack - 1 + TRACKS.length) % TRACKS.length;
    setCurrentTrack(prevIndex);
    setIsPlaying(true);
  };

  // Re-trigger play command on track change if we are supposed to be playing
  useEffect(() => {
    if (isPlaying) {
      const timer = setTimeout(() => {
        handlePlay();
        if (isMuted) {
          sendCommand('mute');
        } else {
          sendCommand('unMute');
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentTrack]);

  return (
    <>
      {/* Hidden YouTube Iframe Player */}
      <div 
        className="absolute pointer-events-none opacity-0 w-0 h-0"
        style={{ left: '-9999px', top: '-9999px' }}
      >
        <iframe
          ref={iframeRef}
          id="youtube-audio-player"
          width="200"
          height="150"
          src={`https://www.youtube.com/embed/${TRACKS[currentTrack].youtubeId}?enablejsapi=1&controls=0&rel=0&showinfo=0&autoplay=0`}
          allow="autoplay; encrypted-media"
        />
      </div>

      {/* Main Ambient Player Dashboard Card */}
      <div className="p-6 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-center min-w-0 h-full">
        <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block text-center md:text-left">
          BACKGROUND AMBIENT
        </span>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-1.5 min-w-0">
          {/* Track metadata */}
          <div className="min-w-0 flex-1 flex flex-col items-center md:items-start text-center md:text-left">
            <span className="text-sm sm:text-base font-black text-white font-sans truncate max-w-full flex items-center gap-1.5">
              <span className={isPlaying ? "animate-pulse text-brand-lime" : "text-zinc-500"}>🎵</span>
              <span className="truncate">{TRACKS[currentTrack].title}</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-medium truncate max-w-full block mt-0.5">
              {TRACKS[currentTrack].artist}
            </span>
          </div>
          
          {/* Inline Audio Micro-Controls */}
          <div className="flex items-center justify-center gap-2 flex-shrink-0">
            {isPlaying && (
              <div className="flex items-end gap-0.5 h-3.5 px-1 mr-1">
                <span className="w-0.5 bg-brand-lime rounded-full animate-[pulse_1s_infinite_100ms] h-2"></span>
                <span className="w-0.5 bg-brand-purple rounded-full animate-[pulse_1.2s_infinite_300ms] h-3.5"></span>
                <span className="w-0.5 bg-brand-blue rounded-full animate-[pulse_0.8s_infinite_500ms] h-1.5"></span>
              </div>
            )}
            
            {/* Play/Pause Toggle */}
            <button
              onClick={isPlaying ? handlePause : handlePlay}
              className={`p-2 rounded-xl transition-all duration-300 ${
                isPlaying 
                  ? 'bg-brand-lime/10 text-brand-lime border border-brand-lime/30 hover:bg-brand-lime/20 ring-2 ring-brand-lime/10 shadow-[0_0_10px_rgba(132,204,22,0.2)]' 
                  : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
              }`}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>

            {/* Volume Mute Toggle */}
            <button
              onClick={handleMuteToggle}
              className={`p-2 rounded-xl border transition-all duration-300 ${
                isMuted 
                  ? 'bg-brand-red/10 border-brand-red/20 text-brand-red hover:bg-brand-red/20' 
                  : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
              }`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {/* Next Track Button */}
            <button
              onClick={handleNext}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-300"
              title="Next Track"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
