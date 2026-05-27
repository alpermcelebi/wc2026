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
  const [isOpen, setIsOpen] = useState(false);
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

  const selectTrack = (index: number) => {
    setCurrentTrack(index);
    setIsPlaying(true);
  };

  // Re-trigger play command on track change if we are supposed to be playing
  useEffect(() => {
    if (isPlaying) {
      // Small timeout to allow iframe to load the new source
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
      {/* Hidden YouTube Iframe Player (Always in DOM so audio doesn't cut out when minimized) */}
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

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-gradient-to-tr from-brand-red via-brand-purple to-brand-blue flex items-center justify-center shadow-lg shadow-brand-purple/30 hover:scale-110 active:scale-95 transition-all duration-300 border border-white/20 group"
        title="World Cup Anthems"
      >
        <div className={`relative w-6 h-6 flex items-center justify-center text-white ${isPlaying ? 'animate-[spin_5s_linear_infinite]' : 'group-hover:rotate-12 transition-transform duration-300'}`}>
          <Music className="w-5 h-5" />
        </div>
        {/* Equalizer animation when playing */}
        {isPlaying && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-lime opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-brand-lime flex items-center justify-center text-[7px] font-black text-black">
              ♪
            </span>
          </span>
        )}
      </button>

      {/* Expanded Player Card */}
      {isOpen && (
        <div className="fixed bottom-22 right-6 z-40 w-80 bg-[#0f0f1b]/95 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl animate-fadeIn flex flex-col gap-3.5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-brand-lime tracking-widest uppercase">
                World Cup Radio
              </span>
              <span className="text-xs text-white/50 font-semibold font-mono">
                Shakira Playlist
              </span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Album Cover Art / Visualizer */}
          <div className="relative w-full aspect-[2/1] rounded-xl overflow-hidden bg-gradient-to-tr from-zinc-950 via-[#18112d] to-zinc-950 border border-white/5 flex items-center justify-center">
            {/* Pulsing glow circles behind logo */}
            <div className={`absolute w-24 h-24 rounded-full bg-brand-purple/10 blur-xl transition-all duration-1000 ${isPlaying ? 'scale-125 opacity-100 animate-pulse' : 'scale-75 opacity-30'}`} />
            
            <div className="flex flex-col items-center gap-1 z-10 text-center px-4">
              <div className={`w-12 h-12 rounded-full border border-white/10 bg-black/40 flex items-center justify-center ${isPlaying ? 'animate-[spin_8s_linear_infinite]' : ''}`}>
                <Music className="w-5 h-5 text-brand-lime" />
              </div>
              <span className="font-bold text-white text-xs truncate max-w-full mt-2">
                {TRACKS[currentTrack].title}
              </span>
              <span className="text-[10px] text-white/40 font-medium truncate max-w-full">
                {TRACKS[currentTrack].artist}
              </span>
            </div>

            {/* Custom moving soundwave visualizer decoration when playing */}
            {isPlaying && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-0.5 h-4 opacity-40">
                <span className="w-0.5 bg-brand-lime rounded-full animate-[pulse_1s_infinite_100ms] h-3"></span>
                <span className="w-0.5 bg-brand-purple rounded-full animate-[pulse_1.2s_infinite_300ms] h-4"></span>
                <span className="w-0.5 bg-brand-blue rounded-full animate-[pulse_0.8s_infinite_500ms] h-2"></span>
                <span className="w-0.5 bg-brand-red rounded-full animate-[pulse_1.1s_infinite_200ms] h-3.5"></span>
                <span className="w-0.5 bg-brand-lime rounded-full animate-[pulse_0.9s_infinite_400ms] h-2.5"></span>
              </div>
            )}
          </div>

          {/* Player controls */}
          <div className="flex flex-col gap-3">
            {/* Buttons Row */}
            <div className="flex items-center justify-between px-2">
              {/* Mute Button */}
              <button
                onClick={handleMuteToggle}
                className={`p-2 rounded-xl border transition-all ${isMuted ? 'bg-brand-red/10 border-brand-red/20 text-brand-red' : 'bg-white/5 border-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Navigation buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrev}
                  className="p-2 rounded-xl bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                  title="Previous"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={isPlaying ? handlePause : handlePlay}
                  className="p-3.5 rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-black text-black" />
                  ) : (
                    <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                  )}
                </button>

                <button
                  onClick={handleNext}
                  className="p-2 rounded-xl bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                  title="Next"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Status Indicator indicator */}
              <div className="w-8 flex justify-center">
                {isPlaying ? (
                  <span className="text-[9px] font-bold text-brand-lime uppercase tracking-widest animate-pulse">
                    Live
                  </span>
                ) : (
                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">
                    Idle
                  </span>
                )}
              </div>
            </div>

            {/* Track Selector List */}
            <div className="flex flex-col gap-1 border-t border-white/5 pt-2.5">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-wider mb-1">
                Playlist Tracks
              </span>
              <div className="flex flex-col gap-1 max-h-[110px] overflow-y-auto scrollbar-thin">
                {TRACKS.map((track, idx) => (
                  <button
                    key={track.youtubeId}
                    onClick={() => selectTrack(idx)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold transition-all ${currentTrack === idx ? 'bg-brand-purple/10 border border-brand-purple/20 text-brand-purple' : 'bg-white/2 border border-transparent text-white/60 hover:text-white hover:bg-white/5'}`}
                  >
                    <span className="font-mono text-[10px] text-white/30 w-4">
                      0{idx + 1}
                    </span>
                    <div className="flex-1 truncate">
                      <p className="truncate leading-none">{track.title}</p>
                      <p className="text-[9px] text-white/30 truncate mt-0.5">{track.artist}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
