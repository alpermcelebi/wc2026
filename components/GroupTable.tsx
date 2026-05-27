'use client';

import React from 'react';
import { GroupStanding, ThirdPlaceStanding } from '../types/tournament';
import { useTournamentStore } from '../store/useTournamentStore';

interface GroupTableProps {
  groupId?: string;
  standings: (GroupStanding | ThirdPlaceStanding)[];
  isThirdPlaceLadder?: boolean;
}

export const GroupTable: React.FC<GroupTableProps> = ({ groupId, standings, isThirdPlaceLadder = false }) => {
  const thirdPlaceLadder = useTournamentStore(state => state.thirdPlaceLadder);

  // Helper to check if a specific group's 3rd place team is currently qualified
  const isGroupThirdQualified = (gId: string) => {
    const matchingThird = thirdPlaceLadder.find(t => t.group === gId);
    return matchingThird?.isQualified ?? false;
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f1b]/60 backdrop-blur-md shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 font-semibold text-white/50 text-[10px] sm:text-xs tracking-wider uppercase">
              <th className="py-3 px-3 text-center w-8 sm:w-10">Pos</th>
              <th className="py-3 px-3">Team</th>
              {isThirdPlaceLadder && <th className="py-3 px-2 text-center w-8 sm:w-12">Grp</th>}
              <th className="py-3 px-2 text-center w-8 sm:w-12">P</th>
              <th className="py-3 px-2 text-center w-8 sm:w-10">W</th>
              <th className="py-3 px-2 text-center w-8 sm:w-10">D</th>
              <th className="py-3 px-2 text-center w-8 sm:w-10">L</th>
              <th className="py-3 px-2 text-center w-8 sm:w-12 hidden sm:table-cell">GF</th>
              <th className="py-3 px-2 text-center w-8 sm:w-12 hidden sm:table-cell">GA</th>
              <th className="py-3 px-2 text-center w-8 sm:w-12">GD</th>
              <th className="py-3 px-3 text-center w-12 sm:w-16 font-bold text-white">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-white/80">
            {standings.map((row, index) => {
              const pos = index + 1;
              const isThirdRow = !isThirdPlaceLadder && pos === 3;
              const isQualifiedThird = isThirdPlaceLadder
                ? (row as ThirdPlaceStanding).isQualified
                : (groupId ? isGroupThirdQualified(groupId) : false);

              // Styling flags
              let rowClass = 'transition-colors hover:bg-white/5';
              let badgeClass = 'text-white/40 bg-white/5';

              if (isThirdPlaceLadder) {
                if (isQualifiedThird) {
                  rowClass += ' bg-brand-yellow/5 hover:bg-brand-yellow/10 border-l-2 border-brand-yellow/50';
                  badgeClass = 'text-brand-yellow bg-brand-yellow/15 font-black';
                } else {
                  rowClass += ' opacity-55 hover:opacity-80';
                }
              } else {
                if (pos <= 2) {
                  // Top 2 advance -> Green (brand-lime)
                  rowClass += ' bg-brand-lime/5 hover:bg-brand-lime/10 border-l-2 border-brand-lime/50';
                  badgeClass = 'text-brand-lime bg-brand-lime/15 font-bold';
                } else if (isThirdRow && isQualifiedThird) {
                  // Qualified 3rd place -> Yellow (brand-yellow)
                  rowClass += ' bg-brand-yellow/5 hover:bg-brand-yellow/10 border-l-2 border-brand-yellow/50';
                  badgeClass = 'text-brand-yellow bg-brand-yellow/15 font-bold';
                } else if (isThirdRow) {
                  // Non-qualified 3rd place -> Light/Dashed Yellow
                  rowClass += ' bg-brand-yellow/5 hover:bg-brand-yellow/10 border-l-2 border-dashed border-brand-yellow/30';
                  badgeClass = 'text-brand-yellow/60 bg-brand-yellow/10 font-bold';
                } else {
                  // 4th place
                  rowClass += ' opacity-60';
                }
              }

              return (
                <tr key={`${row.team.code}-${pos}`} className={rowClass}>
                  {/* Position */}
                  <td className="py-2.5 px-3 text-center font-mono">
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] sm:text-xs ${badgeClass}`}>
                      {pos}
                    </span>
                  </td>
                  {/* Team */}
                  <td className="py-2.5 px-3 font-medium text-white">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={row.team.flagUrl}
                        alt={row.team.name}
                        className="w-6 h-4 object-cover rounded shadow-sm border border-white/10 flex-shrink-0"
                      />
                      {!isThirdPlaceLadder ? (
                        <span className="text-xs sm:text-sm font-bold uppercase tracking-wider" title={row.team.name}>
                          {row.team.code}
                        </span>
                      ) : (
                        <span className="truncate text-xs sm:text-sm" title={row.team.name}>
                          {row.team.name}
                        </span>
                      )}
                    </div>
                  </td>
                  {/* Group Label (Only for Third Place Ladder) */}
                  {isThirdPlaceLadder && (
                    <td className="py-2.5 px-2 text-center font-bold text-brand-purple">
                      {(row as ThirdPlaceStanding).group}
                    </td>
                  )}
                  {/* Played */}
                  <td className="py-2.5 px-2 text-center font-mono text-xs text-white/50">{row.played}</td>
                  {/* Won */}
                  <td className="py-2.5 px-2 text-center font-mono text-xs text-white/50">{row.won}</td>
                  {/* Drawn */}
                  <td className="py-2.5 px-2 text-center font-mono text-xs text-white/50">{row.drawn}</td>
                  {/* Lost */}
                  <td className="py-2.5 px-2 text-center font-mono text-xs text-white/50">{row.lost}</td>
                  {/* GF */}
                  <td className="py-2.5 px-2 text-center font-mono text-xs text-white/50 hidden sm:table-cell">{row.gf}</td>
                  {/* GA */}
                  <td className="py-2.5 px-2 text-center font-mono text-xs text-white/50 hidden sm:table-cell">{row.ga}</td>
                  {/* GD */}
                  <td className={`py-2.5 px-2 text-center font-mono text-xs font-semibold ${row.gd > 0 ? 'text-brand-turquoise' : row.gd < 0 ? 'text-brand-red' : 'text-white/40'}`}>
                    {row.gd > 0 ? `+${row.gd}` : row.gd}
                  </td>
                  {/* Pts */}
                  <td className="py-2.5 px-3 text-center font-bold font-mono text-white text-xs sm:text-sm">{row.pts}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
