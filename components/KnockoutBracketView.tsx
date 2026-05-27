'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTournamentStore } from '../store/useTournamentStore';
import { MatchCard } from './MatchCard';

// ──────────────────────────────────────────────
// 1. SVG connector flow definitions
// ──────────────────────────────────────────────

const FLOWS: Array<{
  parentId: string;
  targetId: string;
  slot: 'home' | 'away';
  flowType: 'winner';
}> = [
  // R32 → R16
  { parentId: 'R32_1', targetId: 'R16_1', slot: 'home', flowType: 'winner' },
  { parentId: 'R32_2', targetId: 'R16_1', slot: 'away', flowType: 'winner' },
  { parentId: 'R32_3', targetId: 'R16_2', slot: 'home', flowType: 'winner' },
  { parentId: 'R32_4', targetId: 'R16_2', slot: 'away', flowType: 'winner' },
  { parentId: 'R32_5', targetId: 'R16_3', slot: 'home', flowType: 'winner' },
  { parentId: 'R32_6', targetId: 'R16_3', slot: 'away', flowType: 'winner' },
  { parentId: 'R32_7', targetId: 'R16_4', slot: 'home', flowType: 'winner' },
  { parentId: 'R32_8', targetId: 'R16_4', slot: 'away', flowType: 'winner' },
  { parentId: 'R32_9', targetId: 'R16_5', slot: 'home', flowType: 'winner' },
  { parentId: 'R32_10', targetId: 'R16_5', slot: 'away', flowType: 'winner' },
  { parentId: 'R32_11', targetId: 'R16_6', slot: 'home', flowType: 'winner' },
  { parentId: 'R32_12', targetId: 'R16_6', slot: 'away', flowType: 'winner' },
  { parentId: 'R32_13', targetId: 'R16_7', slot: 'home', flowType: 'winner' },
  { parentId: 'R32_14', targetId: 'R16_7', slot: 'away', flowType: 'winner' },
  { parentId: 'R32_15', targetId: 'R16_8', slot: 'home', flowType: 'winner' },
  { parentId: 'R32_16', targetId: 'R16_8', slot: 'away', flowType: 'winner' },
  // R16 → QF
  { parentId: 'R16_1', targetId: 'QF_1', slot: 'home', flowType: 'winner' },
  { parentId: 'R16_2', targetId: 'QF_1', slot: 'away', flowType: 'winner' },
  { parentId: 'R16_3', targetId: 'QF_2', slot: 'home', flowType: 'winner' },
  { parentId: 'R16_4', targetId: 'QF_2', slot: 'away', flowType: 'winner' },
  { parentId: 'R16_5', targetId: 'QF_3', slot: 'home', flowType: 'winner' },
  { parentId: 'R16_6', targetId: 'QF_3', slot: 'away', flowType: 'winner' },
  { parentId: 'R16_7', targetId: 'QF_4', slot: 'home', flowType: 'winner' },
  { parentId: 'R16_8', targetId: 'QF_4', slot: 'away', flowType: 'winner' },
  // QF → SF
  { parentId: 'QF_1', targetId: 'SF_1', slot: 'home', flowType: 'winner' },
  { parentId: 'QF_2', targetId: 'SF_1', slot: 'away', flowType: 'winner' },
  { parentId: 'QF_3', targetId: 'SF_2', slot: 'home', flowType: 'winner' },
  { parentId: 'QF_4', targetId: 'SF_2', slot: 'away', flowType: 'winner' },
  // SF → FINAL (winners)
  { parentId: 'SF_1', targetId: 'FINAL', slot: 'home', flowType: 'winner' },
  { parentId: 'SF_2', targetId: 'FINAL', slot: 'away', flowType: 'winner' }
];

// ──────────────────────────────────────────────
// 2. Shared constants
// ──────────────────────────────────────────────

const CARD_W = 'w-64';       // 256px
const CONNECTOR_W = 'w-10';  // 40px

const r32Ids = Array.from({ length: 16 }, (_, i) => `R32_${i + 1}`);
const r16Ids = Array.from({ length: 8 }, (_, i) => `R16_${i + 1}`);
const qfIds = Array.from({ length: 4 }, (_, i) => `QF_${i + 1}`);
const sfIds = ['SF_1', 'SF_2'];

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

// ──────────────────────────────────────────────
// 3. Component
// ──────────────────────────────────────────────

interface ConnLine {
  id: string;
  path: string;
  isActive: boolean;
  color: string;
}

interface KnockoutBracketViewProps {
  isLocked?: boolean;
}

export const KnockoutBracketView: React.FC<KnockoutBracketViewProps> = ({ isLocked = false }) => {
  const { matches, updateMatchScore } = useTournamentStore();
  const bracketRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [connections, setConnections] = useState<ConnLine[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const dragOrigin = useRef({ x: 0, y: 0, sl: 0, st: 0 });

  // Ref to track completed rounds for scroll transitions (prevents erratic scrolling)
  const completedRoundsRef = useRef<Record<string, boolean>>({});

  const matchesCompletionHash = Object.values(matches)
    .map(m => `${m.id}:${m.isCompleted ? '1' : '0'}`)
    .join('|');

  const matchesHash = Object.values(matches)
    .map(m => `${m.id}:${m.isCompleted ? '1' : '0'}:${m.homeScore ?? ''}:${m.awayScore ?? ''}`)
    .join('|');

  // ── Helper to identify active prediction level ──

  const getFocusedRound = (): 'r32' | 'r16' | 'qf' | 'sf' | 'thirdPlace' | 'final' | null => {
    const r32Completed = r32Ids.every(id => matches[id]?.isCompleted);
    if (!r32Completed) return 'r32';

    const r16Completed = r16Ids.every(id => matches[id]?.isCompleted);
    if (!r16Completed) return 'r16';

    const qfCompleted = qfIds.every(id => matches[id]?.isCompleted);
    if (!qfCompleted) return 'qf';

    const sfCompleted = sfIds.every(id => matches[id]?.isCompleted);
    if (!sfCompleted) return 'sf';

    const thirdPlaceCompleted = matches['3RD_PLACE']?.isCompleted;
    if (!thirdPlaceCompleted) return 'thirdPlace';

    const finalCompleted = matches['FINAL']?.isCompleted;
    if (!finalCompleted) return 'final';

    return null;
  };

  const focusedRound = getFocusedRound();

  const getRoundState = (round: 'r32' | 'r16' | 'qf' | 'sf' | 'thirdPlace' | 'final') => {
    const order = ['r32', 'r16', 'qf', 'sf', 'thirdPlace', 'final'];
    const roundIdx = order.indexOf(round);
    const focusedIdx = focusedRound ? order.indexOf(focusedRound) : order.length;

    const isFocused = round === focusedRound;
    const isDimmed = roundIdx < focusedIdx;

    return { isFocused, isDimmed };
  };

  // ── Auto-scroll level transitions upon completion ──

  useEffect(() => {
    const rounds: Array<{
      key: 'r32' | 'r16' | 'qf' | 'sf' | 'thirdPlace';
      next: 'r16' | 'qf' | 'sf' | 'final';
      ids: string[];
    }> = [
      { key: 'r32', next: 'r16', ids: r32Ids },
      { key: 'r16', next: 'qf', ids: r16Ids },
      { key: 'qf', next: 'sf', ids: qfIds },
      { key: 'sf', next: 'sf', ids: sfIds }, // Stays on SF column
      { key: 'thirdPlace', next: 'final', ids: ['3RD_PLACE'] }
    ];

    rounds.forEach(({ key, next, ids }) => {
      const isAllDone = ids.every(id => matches[id]?.isCompleted);
      
      if (isAllDone) {
        if (!completedRoundsRef.current[key]) {
          completedRoundsRef.current[key] = true;

          // Smoothly scroll horizontal container to center the next round's column
          setTimeout(() => {
            const nextCol = bracketRef.current?.querySelector(`[data-column-round="${next}"]`) as HTMLElement | null;
            if (nextCol) {
              nextCol.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }

            // Focus first input in next round
            const nextMatchId =
              key === 'r32' ? 'R16_1'
              : key === 'r16' ? 'QF_1'
              : key === 'qf' ? 'SF_1'
              : key === 'sf' ? '3RD_PLACE'
              : 'FINAL';

            const firstInput = bracketRef.current?.querySelector(`[data-match-id="${nextMatchId}"] input`) as HTMLInputElement | null;
            if (firstInput) {
              firstInput.focus({ preventScroll: true });
              requestAnimationFrame(() => {
                setTimeout(() => {
                  const currentX = window.scrollX || window.pageXOffset;
                  const card = firstInput.closest('.match-card-container') || firstInput;
                  const cardRect = card.getBoundingClientRect();
                  const targetY = cardRect.top + window.scrollY - 100;

                  window.scrollTo({
                    top: targetY,
                    left: currentX,
                    behavior: 'smooth'
                  });
                }, 200);
              });
            }
          }, 150);
        }
      } else {
        // Reset when user goes back and clears a match (allows re-triggering transition when they complete it again)
        completedRoundsRef.current[key] = false;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchesCompletionHash]);

  // ── Match-by-match completion callback ──

  const handleMatchComplete = (matchId: string) => {
    const roundMatchIds = matchId.startsWith('R32') 
      ? r32Ids 
      : matchId.startsWith('R16') 
      ? r16Ids 
      : matchId.startsWith('QF') 
      ? qfIds 
      : matchId.startsWith('SF') 
      ? sfIds 
      : matchId === '3RD_PLACE'
      ? ['3RD_PLACE']
      : [];

    const currentIdx = roundMatchIds.indexOf(matchId);
    if (currentIdx !== -1) {
      // Find the next incomplete match directly below it in the same column
      const nextIncompleteId = roundMatchIds.slice(currentIdx + 1).find(id => !matches[id]?.isCompleted);
      
      if (nextIncompleteId) {
        const nextInput = bracketRef.current?.querySelector(`[data-match-id="${nextIncompleteId}"] input`) as HTMLInputElement | null;
        if (nextInput) {
          nextInput.focus({ preventScroll: true });
          requestAnimationFrame(() => {
            setTimeout(() => {
              const currentX = window.scrollX || window.pageXOffset;
              const card = nextInput.closest('.match-card-container') || nextInput;
              const cardRect = card.getBoundingClientRect();
              const targetY = cardRect.top + window.scrollY - 100;
              
              window.scrollTo({
                top: targetY,
                left: currentX,
                behavior: 'smooth'
              });
            }, 200);
          });
        }
      }
    }
  };

  // ── Unlock completed match card callback ──

  const handleUnlockMatch = (matchId: string) => {
    // Determine the round to scroll back to
    let round: 'r32' | 'r16' | 'qf' | 'sf' | 'thirdPlace' | 'final' = 'r32';
    if (matchId.startsWith('R16')) round = 'r16';
    else if (matchId.startsWith('QF')) round = 'qf';
    else if (matchId.startsWith('SF')) round = 'sf';
    else if (matchId === '3RD_PLACE') round = 'thirdPlace';
    else if (matchId === 'FINAL') round = 'final';

    // Reset score in store
    updateMatchScore(matchId, null, null);

    // Scroll horizontal layout back to center this column
    const colRoundKey = round === 'thirdPlace' ? 'sf' : round;
    const col = bracketRef.current?.querySelector(`[data-column-round="${colRoundKey}"]`) as HTMLElement | null;
    if (col) {
      col.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    // Auto-focus the unlocked match input
    setTimeout(() => {
      const input = bracketRef.current?.querySelector(`[data-match-id="${matchId}"] input`) as HTMLInputElement | null;
      if (input) {
        input.focus({ preventScroll: true });
      }
    }, 100);
  };

  // ── SVG connector calculation & absolute positioning ──

  useIsomorphicLayoutEffect(() => {
    const container = bracketRef.current;
    if (!container) return;

    const calculate = () => {
      const cRect = container.getBoundingClientRect();

      // Helper to get match element by ID
      const getMatchEl = (id: string) => {
        return container.querySelector(`[data-match-id="${id}"]`) as HTMLElement | null;
      };

      // 1. Position R16 matches:
      r16Ids.forEach((id, idx) => {
        const r16El = getMatchEl(id);
        const parent1 = getMatchEl(`R32_${idx * 2 + 1}`);
        const parent2 = getMatchEl(`R32_${idx * 2 + 2}`);
        if (r16El && parent1 && parent2) {
          const p1Rect = parent1.getBoundingClientRect();
          const p2Rect = parent2.getBoundingClientRect();
          const p1Center = p1Rect.top - cRect.top + p1Rect.height / 2;
          const p2Center = p2Rect.top - cRect.top + p2Rect.height / 2;
          const targetCenter = (p1Center + p2Center) / 2;
          r16El.style.top = `${targetCenter - r16El.offsetHeight / 2}px`;
        }
      });

      // 2. Position QF matches:
      qfIds.forEach((id, idx) => {
        const qfEl = getMatchEl(id);
        const parent1 = getMatchEl(`R16_${idx * 2 + 1}`);
        const parent2 = getMatchEl(`R16_${idx * 2 + 2}`);
        if (qfEl && parent1 && parent2) {
          const p1Rect = parent1.getBoundingClientRect();
          const p2Rect = parent2.getBoundingClientRect();
          const p1Center = p1Rect.top - cRect.top + p1Rect.height / 2;
          const p2Center = p2Rect.top - cRect.top + p2Rect.height / 2;
          const targetCenter = (p1Center + p2Center) / 2;
          qfEl.style.top = `${targetCenter - qfEl.offsetHeight / 2}px`;
        }
      });

      // 3. Position SF matches:
      sfIds.forEach((id, idx) => {
        const sfEl = getMatchEl(id);
        const parent1 = getMatchEl(`QF_${idx * 2 + 1}`);
        const parent2 = getMatchEl(`QF_${idx * 2 + 2}`);
        if (sfEl && parent1 && parent2) {
          const p1Rect = parent1.getBoundingClientRect();
          const p2Rect = parent2.getBoundingClientRect();
          const p1Center = p1Rect.top - cRect.top + p1Rect.height / 2;
          const p2Center = p2Rect.top - cRect.top + p2Rect.height / 2;
          const targetCenter = (p1Center + p2Center) / 2;
          sfEl.style.top = `${targetCenter - sfEl.offsetHeight / 2}px`;
        }
      });

      // 4. Position 3RD_PLACE match:
      const tpEl = getMatchEl('3RD_PLACE');
      const sf1El = getMatchEl('SF_1');
      const sf2El = getMatchEl('SF_2');
      if (tpEl && sf1El && sf2El) {
        const sf1Rect = sf1El.getBoundingClientRect();
        const sf2Rect = sf2El.getBoundingClientRect();
        const sf1Center = sf1Rect.top - cRect.top + sf1Rect.height / 2;
        const sf2Center = sf2Rect.top - cRect.top + sf2Rect.height / 2;
        const targetCenter = (sf1Center + sf2Center) / 2;
        tpEl.style.top = `${targetCenter - tpEl.offsetHeight / 2}px`;
      }

      // 5. Position FINAL match:
      const finalEl = getMatchEl('FINAL');
      if (finalEl && sf1El && sf2El) {
        const sf1Rect = sf1El.getBoundingClientRect();
        const sf2Rect = sf2El.getBoundingClientRect();
        const sf1Center = sf1Rect.top - cRect.top + sf1Rect.height / 2;
        const sf2Center = sf2Rect.top - cRect.top + sf2Rect.height / 2;
        const targetCenter = (sf1Center + sf2Center) / 2;
        finalEl.style.top = `${targetCenter - finalEl.offsetHeight / 2}px`;

        // 6. Position Champion Display:
        const champEl = container.querySelector('#champion-display') as HTMLElement | null;
        if (champEl) {
          const finalTop = targetCenter - finalEl.offsetHeight / 2;
          champEl.style.top = `${finalTop - champEl.offsetHeight - 12}px`;
        }
      }

      // 7. Calculate connector SVG paths!
      const lines: ConnLine[] = [];

      FLOWS.forEach(({ parentId, targetId, slot, flowType }) => {
        const pEl = getMatchEl(parentId);
        const tEl = getMatchEl(targetId);
        if (!pEl || !tEl) return;

        const pR = pEl.getBoundingClientRect();
        const tR = tEl.getBoundingClientRect();

        const sx = pR.right - cRect.left;
        const sy = pR.top - cRect.top + pR.height / 2;

        const ex = tR.left - cRect.left;
        const ey = tR.top - cRect.top + tR.height / 2; // Mathematically centered

        // Determine active state & colour
        const pm = matches[parentId];
        let isActive = false;
        let color = 'rgba(255,255,255,0.06)';

        if (pm?.isCompleted && pm.homeScore !== null && pm.awayScore !== null) {
          if (flowType === 'winner') {
            isActive = true;
            color = '#10B981'; // Emerald Green
          }
        }

        const mx = sx + (ex - sx) / 2;
        lines.push({
          id: `${parentId}-${targetId}-${slot}-${flowType}`,
          path: `M ${sx} ${sy} H ${mx} V ${ey} H ${ex}`,
          isActive,
          color
        });
      });

      setConnections(prev => {
        const isEqual = prev.length === lines.length && prev.every((line, idx) => {
          const newLine = lines[idx];
          return newLine &&
            line.id === newLine.id &&
            line.path === newLine.path &&
            line.isActive === newLine.isActive &&
            line.color === newLine.color;
        });
        return isEqual ? prev : lines;
      });

      setIsReady(prev => prev ? prev : true);
    };

    calculate();

    const resizeObserver = new ResizeObserver(() => {
      calculate();
    });
    resizeObserver.observe(container);

    const t1 = setTimeout(calculate, 80);
    const t2 = setTimeout(calculate, 400);
    const t3 = setTimeout(calculate, 1200);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [matchesHash]);

  // ── Grab-to-scroll (desktop) ───────────────

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('input,button,a,[data-match-id]')) return;
    const el = scrollRef.current;
    if (!el) return;
    setIsDragging(true);
    el.setPointerCapture(e.pointerId);
    dragOrigin.current = { x: e.clientX, y: e.clientY, sl: el.scrollLeft, st: el.scrollTop };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = dragOrigin.current.sl - (e.clientX - dragOrigin.current.x);
    el.scrollTop  = dragOrigin.current.st - (e.clientY - dragOrigin.current.y);
  };

  const onPointerUp = () => setIsDragging(false);

  // ── Champion display ───────────────────────

  const renderChampion = () => {
    const fm = matches['FINAL'];
    if (!fm?.isCompleted) return <span className="text-white/30 text-sm mt-1">Predict the Final</span>;

    let champ = null;
    if (fm.homeScore! > fm.awayScore!) champ = fm.homeTeam;
    else if (fm.homeScore! < fm.awayScore!) champ = fm.awayTeam;
    else champ = (fm.homePenalties ?? 0) > (fm.awayPenalties ?? 0) ? fm.homeTeam : fm.awayTeam;

    if (!champ) return <span className="text-white/30 text-sm mt-1">Undecided</span>;
    return (
      <div className="flex flex-col items-center gap-2 animate-bounce mt-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={champ.flagUrl} alt={champ.name} className="w-12 h-8 object-cover rounded shadow border border-white/10" />
        <span className="font-bold text-white text-lg">{champ.name}</span>
      </div>
    );
  };

  // ── Render ─────────────────────────────────

  return (
    <div className="relative w-full overflow-hidden">
      <div
        ref={scrollRef}
        className={`overflow-auto pb-6 scrollbar-thin select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/* ─── Sticky round headers ─── */}
        <div className="sticky top-0 z-30 bg-[#06060c]/90 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center py-2 px-4 min-w-max">
            {['Round of 32', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Grand Final'].map((label, i) => (
              <React.Fragment key={label}>
                {i > 0 && <div className={`${CONNECTOR_W} flex-shrink-0`} />}
                <div className={`${CARD_W} flex-shrink-0 text-center`}>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/40">{label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ─── Bracket content ─── */}
        <div ref={bracketRef} className="relative min-w-max min-h-max px-4 pt-4 pb-8">
          {/* SVG connector overlay */}
          <svg className="absolute inset-0 pointer-events-none z-0 overflow-visible" style={{ width: '100%', height: '100%' }}>
            <defs>
              <filter id="bracketGlow" x="-25%" y="-25%" width="150%" height="150%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {connections.map(({ id, path, isActive, color }) => (
              <g key={id}>
                {isActive && (
                  <path d={path} fill="none" stroke={color} strokeWidth={5} opacity={0.25} filter="url(#bracketGlow)" />
                )}
                <path
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-colors duration-300"
                />
              </g>
            ))}
          </svg>

          {/* ─── Flat Columns Layout ─── */}
          <div className={`relative z-10 flex flex-row items-stretch transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'}`}>
            {/* Column 1: Round of 32 */}
            <div data-column-round="r32" className="flex flex-col gap-y-4 relative flex-shrink-0">
              {r32Ids.map(id => {
                const m = matches[id];
                if (!m) return null;
                const { isFocused, isDimmed } = getRoundState('r32');
                return (
                  <div key={id} data-match-id={id} className={`${CARD_W} flex-shrink-0`}>
                    <MatchCard
                      compact
                      match={m}
                      isFocused={isFocused}
                      isDimmed={isDimmed}
                      isLocked={isLocked}
                      onComplete={handleMatchComplete}
                      onUnlock={handleUnlockMatch}
                      onScoreChange={(h, a, hp, ap) => updateMatchScore(id, h, a, hp, ap)}
                    />
                  </div>
                );
              })}
            </div>

            {/* Spacer */}
            <div className={`${CONNECTOR_W} flex-shrink-0`} />

            {/* Column 2: Round of 16 */}
            <div data-column-round="r16" className="relative w-64 flex-shrink-0">
              {r16Ids.map(id => {
                const m = matches[id];
                if (!m) return null;
                const { isFocused, isDimmed } = getRoundState('r16');
                return (
                  <div key={id} data-match-id={id} className="absolute left-0 w-64">
                    <MatchCard
                      compact
                      match={m}
                      isFocused={isFocused}
                      isDimmed={isDimmed}
                      isLocked={isLocked}
                      onComplete={handleMatchComplete}
                      onUnlock={handleUnlockMatch}
                      onScoreChange={(h, a, hp, ap) => updateMatchScore(id, h, a, hp, ap)}
                    />
                  </div>
                );
              })}
            </div>

            {/* Spacer */}
            <div className={`${CONNECTOR_W} flex-shrink-0`} />

            {/* Column 3: Quarter-finals */}
            <div data-column-round="qf" className="relative w-64 flex-shrink-0">
              {qfIds.map(id => {
                const m = matches[id];
                if (!m) return null;
                const { isFocused, isDimmed } = getRoundState('qf');
                return (
                  <div key={id} data-match-id={id} className="absolute left-0 w-64">
                    <MatchCard
                      compact
                      match={m}
                      isFocused={isFocused}
                      isDimmed={isDimmed}
                      isLocked={isLocked}
                      onComplete={handleMatchComplete}
                      onUnlock={handleUnlockMatch}
                      onScoreChange={(h, a, hp, ap) => updateMatchScore(id, h, a, hp, ap)}
                    />
                  </div>
                );
              })}
            </div>

            {/* Spacer */}
            <div className={`${CONNECTOR_W} flex-shrink-0`} />

            {/* Column 4: Semi-finals & 3rd Place */}
            <div data-column-round="sf" className="relative w-64 flex-shrink-0">
              {/* SF 1 */}
              {matches['SF_1'] && (() => {
                const { isFocused, isDimmed } = getRoundState('sf');
                return (
                  <div data-match-id="SF_1" className="absolute left-0 w-64">
                    <MatchCard
                      compact
                      match={matches['SF_1']}
                      isFocused={isFocused}
                      isDimmed={isDimmed}
                      isLocked={isLocked}
                      onComplete={handleMatchComplete}
                      onUnlock={handleUnlockMatch}
                      onScoreChange={(h, a, hp, ap) => updateMatchScore('SF_1', h, a, hp, ap)}
                    />
                  </div>
                );
              })()}

              {/* Third-Place Play-off */}
              {matches['3RD_PLACE'] && (() => {
                const { isFocused, isDimmed } = getRoundState('thirdPlace');
                return (
                  <div data-match-id="3RD_PLACE" className="absolute left-0 w-64">
                    <MatchCard
                      compact
                      match={matches['3RD_PLACE']}
                      isFocused={isFocused}
                      isDimmed={isDimmed}
                      isLocked={isLocked}
                      onComplete={handleMatchComplete}
                      onUnlock={handleUnlockMatch}
                      onScoreChange={(h, a, hp, ap) => updateMatchScore('3RD_PLACE', h, a, hp, ap)}
                    />
                  </div>
                );
              })()}

              {/* SF 2 */}
              {matches['SF_2'] && (() => {
                const { isFocused, isDimmed } = getRoundState('sf');
                return (
                  <div data-match-id="SF_2" className="absolute left-0 w-64">
                    <MatchCard
                      compact
                      match={matches['SF_2']}
                      isFocused={isFocused}
                      isDimmed={isDimmed}
                      isLocked={isLocked}
                      onComplete={handleMatchComplete}
                      onUnlock={handleUnlockMatch}
                      onScoreChange={(h, a, hp, ap) => updateMatchScore('SF_2', h, a, hp, ap)}
                    />
                  </div>
                );
              })()}
            </div>

            {/* Spacer */}
            <div className={`${CONNECTOR_W} flex-shrink-0`} />

            {/* Column 5: Grand Final */}
            <div data-column-round="final" className="relative w-64 flex-shrink-0">
              {/* Champion Display */}
              <div id="champion-display" className="absolute left-0 w-64 flex flex-col items-center justify-center p-3 border border-brand-yellow/20 bg-brand-yellow/5 rounded-xl text-center backdrop-blur-md">
                <span className="text-[9px] font-black tracking-widest text-brand-yellow uppercase mb-0.5">
                  Predicted Champion
                </span>
                {renderChampion()}
              </div>

              {/* Grand Final */}
              {matches['FINAL'] && (() => {
                const { isFocused, isDimmed } = getRoundState('final');
                return (
                  <div data-match-id="FINAL" className="absolute left-0 w-64">
                    <MatchCard
                      compact
                      match={matches['FINAL']}
                      isFocused={isFocused}
                      isDimmed={isDimmed}
                      isLocked={isLocked}
                      onComplete={handleMatchComplete}
                      onUnlock={handleUnlockMatch}
                      onScoreChange={(h, a, hp, ap) => updateMatchScore('FINAL', h, a, hp, ap)}
                    />
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
