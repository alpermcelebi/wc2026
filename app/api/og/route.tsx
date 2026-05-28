import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { deserializePredictions, serializePredictions, getFlagUrlByCode } from '../../../utils/shareCompression';
import type { BracketMatch } from '../../../utils/shareCompression';
import { supabase, isSupabaseConfigured } from '../../../utils/supabaseClient';

const CODE_TO_NAME: Record<string, string> = {
  MEX: 'Mexico', KOR: 'South Korea', RSA: 'South Africa', CZE: 'Czechia',
  CAN: 'Canada', BIH: 'Bosnia', QAT: 'Qatar', SUI: 'Switzerland',
  BRA: 'Brazil', MAR: 'Marocco', SCO: 'Scotland', HAI: 'Haiti',
  USA: 'United States', AUS: 'Australia', PAR: 'Paraguay', TUR: 'Türkiye',
  GER: 'Germany', ECU: 'Ecuador', CIV: 'Ivory Coast', CUW: 'Curaçao',
  NED: 'Netherlands', JPN: 'Japan', TUN: 'Tunisia', SWE: 'Sweden',
  BEL: 'Belgium', IRN: 'Iran', EGY: 'Egypt', NZL: 'New Zealand',
  ESP: 'Spain', URU: 'Uruguay', KSA: 'Saudi Arabia', CPV: 'Cape Verde',
  FRA: 'France', SEN: 'Senegal', NOR: 'Norway', IRQ: 'Iraq',
  ARG: 'Argentina', ALG: 'Algeria', AUT: 'Austria', JOR: 'Jordan',
  ENG: 'England', COL: 'Colombia', UZB: 'Uzbekistan', COD: 'DR Congo',
  POR: 'Portugal', CRO: 'Croatia', PAN: 'Panama', GHA: 'Ghana',
};

const getName = (code: string) => CODE_TO_NAME[code] || code;

const getWinner = (m: BracketMatch): string => {
  if (m.hs > m.as) return m.h;
  if (m.as > m.hs) return m.a;
  if (m.hp !== undefined && m.ap !== undefined) {
    return m.hp > m.ap ? m.h : m.a;
  }
  return m.h;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('predictions');

  if (!code) {
    return new Response('Missing predictions parameter', { status: 400 });
  }

  try {
    let s: any;
    if (code.length <= 8) {
      if (!isSupabaseConfigured) {
        return new Response('Supabase not configured to resolve short codes', { status: 500 });
      }
      const { data, error } = await supabase
        .from('user_brackets')
        .select('predictions_data')
        .eq('bracket_code', code.toUpperCase())
        .maybeSingle();

      if (error || !data) {
        return new Response(`Bracket predictions not found for code: ${code}`, { status: 404 });
      }

      const { matches, awards } = data.predictions_data;
      const serialized = serializePredictions(matches, awards);
      const deserialized = deserializePredictions(serialized);
      s = deserialized.s;
    } else {
      const deserialized = deserializePredictions(code);
      s = deserialized.s;
    }

    const qf = s.qf || [null, null, null, null];
    const sf = s.sf || [null, null];

    // ── Semi-Finals Match Renderer ───────────────────────────
    const renderSfMatch = (m: BracketMatch | null | undefined, title: string) => {
      if (!m) {
        return (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px', height: '110px', width: '48%', gap: '4px',
          }}>
            <span style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.2)', letterSpacing: '2px' }}>{title}</span>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.1)' }}>TBD</span>
          </div>
        );
      }
      const w = getWinner(m);
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          backgroundColor: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(145,124,255,0.2)',
          borderRadius: '12px', height: '110px', width: '48%', padding: '12px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '9px', fontWeight: 800, color: '#917cff', letterSpacing: '1px' }}>{title}</span>
            {m.hp !== undefined && m.ap !== undefined && (
              <span style={{ fontSize: '8px', fontWeight: 700, color: '#f97316' }}>PEN {m.hp}–{m.ap}</span>
            )}
          </div>

          {/* Home team */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src={getFlagUrlByCode(m.h)} width={26} height={18} style={{ borderRadius: '2px', objectFit: 'cover' }} />
              <span style={{ fontSize: '14px', fontWeight: 800, color: w === m.h ? 'white' : 'rgba(255,255,255,0.3)' }}>{m.h}</span>
            </div>
            <span style={{ fontSize: '16px', fontWeight: 900, color: w === m.h ? 'white' : 'rgba(255,255,255,0.3)' }}>{m.hs}</span>
          </div>

          {/* Away team */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src={getFlagUrlByCode(m.a)} width={26} height={18} style={{ borderRadius: '2px', objectFit: 'cover' }} />
              <span style={{ fontSize: '14px', fontWeight: 800, color: w === m.a ? 'white' : 'rgba(255,255,255,0.3)' }}>{m.a}</span>
            </div>
            <span style={{ fontSize: '16px', fontWeight: 900, color: w === m.a ? 'white' : 'rgba(255,255,255,0.3)' }}>{m.as}</span>
          </div>
        </div>
      );
    };

    // ── Quarter-Finalists (2x4 Grid of Teams Match Renderer) ──
    const renderQfMatch = (m: BracketMatch | null | undefined) => {
      if (!m) {
        return (
          <div style={{ display: 'flex', width: '100%', height: '72px', gap: '8px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1,
              backgroundColor: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)',
              borderRadius: '8px',
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.1)' }}>TBD</span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1,
              backgroundColor: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)',
              borderRadius: '8px',
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.1)' }}>TBD</span>
            </div>
          </div>
        );
      }

      const w = getWinner(m);
      const hWin = w === m.h;
      const aWin = w === m.a;

      return (
        <div style={{ display: 'flex', width: '100%', height: '72px', gap: '8px', position: 'relative' }}>
          {/* Home Cell (Left) */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1,
            backgroundColor: hWin ? 'rgba(0, 210, 180, 0.05)' : 'rgba(255,255,255,0.02)',
            border: hWin ? '1.5px solid rgba(0, 210, 180, 0.4)' : '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px', padding: '0 12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={getFlagUrlByCode(m.h)} width={32} height={22} style={{ borderRadius: '2px', objectFit: 'cover' }} />
              <span style={{ fontSize: '16px', fontWeight: 800, color: hWin ? 'white' : 'rgba(255,255,255,0.3)' }}>{m.h}</span>
            </div>
            <span style={{ fontSize: '20px', fontWeight: 900, color: hWin ? '#00D2B4' : 'rgba(255,255,255,0.3)' }}>{m.hs}</span>
          </div>

          {/* Penalty pill in the middle if applicable */}
          {m.hp !== undefined && m.ap !== undefined ? (
            <div style={{
              position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
              backgroundColor: '#f97316', padding: '2px 6px', borderRadius: '4px', zIndex: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '9px', fontWeight: 900, color: 'white', lineHeight: 1 }}>
                PK {m.hp}–{m.ap}
              </span>
            </div>
          ) : null}

          {/* Away Cell (Right) */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1,
            backgroundColor: aWin ? 'rgba(0, 210, 180, 0.05)' : 'rgba(255,255,255,0.02)',
            border: aWin ? '1.5px solid rgba(0, 210, 180, 0.4)' : '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px', padding: '0 12px',
          }}>
            <span style={{ fontSize: '20px', fontWeight: 900, color: aWin ? '#00D2B4' : 'rgba(255,255,255,0.3)' }}>{m.as}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '16px', fontWeight: 800, color: aWin ? 'white' : 'rgba(255,255,255,0.3)' }}>{m.a}</span>
              <img src={getFlagUrlByCode(m.a)} width={32} height={22} style={{ borderRadius: '2px', objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      );
    };

    // ── Individual Award Card Renderer ───────────────────────
    const renderAwardCard = (
      icon: string,
      title: string,
      name: string,
      team: string,
      accentColor: string,
      bgColor: string,
      borderColor: string
    ) => {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '48%',
          height: '110px',
          backgroundColor: bgColor,
          border: `1.5px solid ${borderColor}`,
          borderRadius: '16px',
          padding: '12px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '9px', fontWeight: 800, color: accentColor, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              {title}
            </span>
            <span style={{ fontSize: '20px' }}>{icon}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, marginTop: '8px' }}>
            <span style={{
              fontSize: '15px',
              fontWeight: 900,
              color: 'white',
              lineHeight: 1.2,
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {name}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            {team && team !== 'OTH' && team !== '' ? (
              <>
                <img src={getFlagUrlByCode(team)} width={20} height={14} style={{ borderRadius: '2px', objectFit: 'cover' }} />
                <span style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                  {team}
                </span>
              </>
            ) : (
              <span style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
                {team || 'OTH'}
              </span>
            )}
          </div>
        </div>
      );
    };

    return new ImageResponse(
      (
        <div style={{
          height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
          backgroundColor: '#0B0C10', color: '#f4f4f5', padding: '48px',
          justifyContent: 'space-between', fontFamily: 'sans-serif', position: 'relative',
        }}>
          {/* Gradient backdrop */}
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            background: 'radial-gradient(circle at center, #1b1236 0%, #0b0c10 80%)',
          }} />

          {/* ═══ SECTION 1: HEADER ═══ */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            width: '100%',
            paddingBottom: '24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            gap: '8px',
            zIndex: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #e50012, #917cff, #1d62ff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
                  <path d="M12 2a6 6 0 0 1 6 6v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z" />
                </svg>
              </div>
              <span style={{ fontSize: '18px', fontWeight: 900, color: 'white', letterSpacing: '3px', textTransform: 'uppercase' }}>
                FIFA WORLD CUP 2026
              </span>
            </div>
            <span style={{ fontSize: '38px', fontWeight: 900, color: '#b6f124', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>
              MY 2026 BRACKET PREDICTIONS
            </span>
          </div>

          {/* ═══ SECTION 2: THE GOLDEN PODIUMS (CHAMPION & SCORE) ═══ */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            gap: '16px',
            zIndex: 10,
          }}>
            {/* The Champion Card Container */}
            <div style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(234, 179, 8, 0.05)',
              border: '2px solid #eab308',
              borderRadius: '24px',
              padding: '32px 48px',
              width: '100%',
              height: '220px',
              overflow: 'hidden',
            }}>
              {/* Giant Flag Backdrop with low opacity */}
              {s.winner ? (
                <img
                  src={getFlagUrlByCode(s.winner)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.12,
                  }}
                />
              ) : null}

              {/* Small Golden label */}
              <span style={{
                fontSize: '12px',
                fontWeight: 800,
                color: '#eab308',
                textTransform: 'uppercase',
                letterSpacing: '5px',
                marginBottom: '12px',
                zIndex: 2,
              }}>
                🏆 PREDICTED CHAMPION 🏆
              </span>

              {/* Team name + flag display */}
              {s.winner ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', zIndex: 2 }}>
                  <img
                    src={getFlagUrlByCode(s.winner)}
                    width={84}
                    height={56}
                    style={{
                      borderRadius: '8px',
                      border: '2px solid rgba(234,179,8,0.4)',
                      objectFit: 'cover',
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '44px', fontWeight: 900, color: 'white', lineHeight: 1.1 }}>
                      {getName(s.winner)}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#eab308', letterSpacing: '3px', marginTop: '4px' }}>
                      {s.winner}
                    </span>
                  </div>
                </div>
              ) : (
                <span style={{ fontSize: '28px', fontWeight: 800, color: 'rgba(255,255,255,0.25)', zIndex: 2 }}>TBD</span>
              )}
            </div>

            {/* Badges Row (Final Score & 3rd Place) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              height: '90px',
            }}>
              {/* Final Match Score Badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '60%',
                height: '90px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '0 16px',
              }}>
                {s.home ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    {/* Home Team */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <img src={getFlagUrlByCode(s.home)} width={32} height={22} style={{ borderRadius: '2px', objectFit: 'cover' }} />
                      <span style={{ fontSize: '18px', fontWeight: 800, color: 'white' }}>{s.home}</span>
                    </div>

                    {/* Score pill */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '90px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#eab308', letterSpacing: '1px', marginBottom: '2px', textTransform: 'uppercase' }}>FINAL</span>
                      <span style={{ fontSize: '20px', fontWeight: 900, color: 'white', lineHeight: 1 }}>
                        {s.homeScore !== null && s.awayScore !== null ? `${s.homeScore} – ${s.awayScore}` : 'VS'}
                      </span>
                      {s.homePens !== null && s.awayPens !== null && (
                        <span style={{ fontSize: '9px', fontWeight: 800, color: '#f97316', marginTop: '1px' }}>
                          PEN {s.homePens}–{s.awayPens}
                        </span>
                      )}
                    </div>

                    {/* Away Team */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', flex: 1 }}>
                      <span style={{ fontSize: '18px', fontWeight: 800, color: 'white' }}>{s.away}</span>
                      <img src={getFlagUrlByCode(s.away)} width={32} height={22} style={{ borderRadius: '2px', objectFit: 'cover' }} />
                    </div>
                  </div>
                ) : (
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '2px' }}>FINAL TBD</span>
                )}
              </div>

              {/* 3rd Place Badge */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36%',
                height: '90px',
                backgroundColor: 'rgba(251, 191, 36, 0.03)',
                border: '1px solid rgba(205, 127, 50, 0.4)',
                borderRadius: '16px',
                padding: '8px',
              }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#cd7f32', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                  3rd place
                </span>
                {s.third ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src={getFlagUrlByCode(s.third)} width={28} height={19} style={{ borderRadius: '2px', objectFit: 'cover' }} />
                    <span style={{ fontSize: '18px', fontWeight: 900, color: 'white' }}>{s.third}</span>
                  </div>
                ) : (
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.2)' }}>TBD</span>
                )}
              </div>
            </div>
          </div>

          {/* ═══ SECTION 3: KNOCKOUT TREE BREAKDOWN ═══ */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '20px',
            padding: '18px 20px',
            gap: '12px',
            zIndex: 10,
          }}>
            {/* Section Header */}
            <span style={{
              fontSize: '12px', fontWeight: 850, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
              letterSpacing: '3px', textAlign: 'center', width: '100%',
            }}>
              KNOCKOUT breakdown
            </span>

            {/* Semi-Finalists Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#917cff', textTransform: 'uppercase', letterSpacing: '2px' }}>
                Semi-Finalists
              </span>
              <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                {renderSfMatch(sf[0], 'SEMI-FINAL 1')}
                {renderSfMatch(sf[1], 'SEMI-FINAL 2')}
              </div>
            </div>

            {/* Quarter-Finalists Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#00D2B4', textTransform: 'uppercase', letterSpacing: '2px' }}>
                Quarter-Finalists (ELIMINATED HERE)
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                {renderQfMatch(qf[0])}
                {renderQfMatch(qf[1])}
                {renderQfMatch(qf[2])}
                {renderQfMatch(qf[3])}
              </div>
            </div>
          </div>

          {/* ═══ SECTION 4: AWARDS GALA (2x2 GRID) ═══ */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '20px',
            padding: '18px 20px',
            gap: '12px',
            zIndex: 10,
          }}>
            <span style={{
              fontSize: '12px', fontWeight: 850, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
              letterSpacing: '3px', textAlign: 'center', width: '100%',
            }}>
              TOURNAMENT AWARDS GALA
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
              <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                {renderAwardCard('🏆', 'Golden Ball', s.gbName, s.gbTeam, '#917cff', 'rgba(145,124,255,0.04)', 'rgba(145,124,255,0.15)')}
                {renderAwardCard('⚽', 'Golden Boot', s.gtName, s.gtTeam, '#ea580c', 'rgba(234,88,12,0.04)', 'rgba(234,88,12,0.15)')}
              </div>
              <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                {renderAwardCard('🧤', 'Golden Glove', s.ggName, s.ggTeam, '#1d62ff', 'rgba(29,98,255,0.04)', 'rgba(29,98,255,0.15)')}
                {renderAwardCard('🌟', 'Best Young', s.byName || 'TBD', s.byTeam, '#84cc16', 'rgba(132,204,22,0.04)', 'rgba(132,204,22,0.15)')}
              </div>
            </div>
          </div>

          {/* ═══ FOOTER ═══ */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '16px',
            fontSize: '12px',
            fontWeight: 800,
            color: 'rgba(255, 255, 255, 0.25)',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            zIndex: 10,
          }}>
            <span>alpermcelebi • WC 2026 Predictor</span>
            <span>FIFA World Cup 2026™</span>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1920,
      }
    );
  } catch (error) {
    console.error('OG generation error:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
