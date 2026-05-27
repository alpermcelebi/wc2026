import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { deserializePredictions, getFlagUrlByCode } from '../../../utils/shareCompression';
import type { BracketMatch } from '../../../utils/shareCompression';

export const runtime = 'edge';

const CODE_TO_NAME: Record<string, string> = {
  MEX: 'Mexico', KOR: 'South Korea', RSA: 'South Africa', CZE: 'Czechia',
  CAN: 'Canada', BIH: 'Bosnia', QAT: 'Qatar', SUI: 'Switzerland',
  BRA: 'Brazil', MAR: 'Morocco', SCO: 'Scotland', HAI: 'Haiti',
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
    const { s } = deserializePredictions(code);

    const qf = s.qf || [null, null, null, null];
    const sf = s.sf || [null, null];

    // ── Match card renderer ──────────────────────────────────
    const renderMatch = (m: BracketMatch | null | undefined, large: boolean = false) => {
      const h = large ? 62 : 50;
      const flagW = large ? 30 : 24;
      const flagH = large ? 20 : 16;
      const fontSize = large ? 13 : 11;
      const scoreFontSize = large ? 15 : 13;

      if (!m) {
        return (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '8px', height: `${h}px`, width: '100%',
          }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.15)', letterSpacing: '2px' }}>TBD</span>
          </div>
        );
      }

      const w = getWinner(m);
      const hWin = w === m.h;
      const aWin = w === m.a;

      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '8px', height: `${h}px`, width: '100%', padding: '0 12px',
        }}>
          {/* Home */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
            <img src={getFlagUrlByCode(m.h)} width={flagW} height={flagH} style={{ borderRadius: '2px', objectFit: 'cover' }} />
            <span style={{ fontSize: `${fontSize}px`, fontWeight: 800, color: hWin ? 'white' : 'rgba(255,255,255,0.3)', maxWidth: '48px', overflow: 'hidden' }}>{m.h}</span>
          </div>
          {/* Score */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 6px' }}>
            <span style={{ fontSize: `${scoreFontSize}px`, fontWeight: 900, color: 'white', lineHeight: 1 }}>
              {m.hs} – {m.as}
            </span>
            {m.hp !== undefined && m.ap !== undefined && (
              <span style={{ fontSize: '7px', fontWeight: 700, color: '#f97316', marginTop: '2px' }}>
                PEN {m.hp}–{m.ap}
              </span>
            )}
          </div>
          {/* Away */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', flex: 1 }}>
            <span style={{ fontSize: `${fontSize}px`, fontWeight: 800, color: aWin ? 'white' : 'rgba(255,255,255,0.3)', maxWidth: '48px', overflow: 'hidden' }}>{m.a}</span>
            <img src={getFlagUrlByCode(m.a)} width={flagW} height={flagH} style={{ borderRadius: '2px', objectFit: 'cover' }} />
          </div>
        </div>
      );
    };

    // ── Section label ────────────────────────────────────────
    const sectionLabel = (text: string, color: string) => (
      <span style={{
        fontSize: '9px', fontWeight: 800, color, textTransform: 'uppercase',
        letterSpacing: '3px', textAlign: 'center', width: '100%',
        display: 'flex', justifyContent: 'center',
      }}>
        {text}
      </span>
    );

    // ── Column connector arrows ──────────────────────────────
    const connector = () => (
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'center', width: '24px', flexShrink: 0,
      }}>
        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.12)', fontWeight: 900 }}>›</span>
      </div>
    );

    return new ImageResponse(
      (
        <div style={{
          height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
          backgroundColor: '#0B0C10', color: '#f4f4f5', padding: '44px 52px',
          justifyContent: 'space-between', fontFamily: 'sans-serif', position: 'relative',
        }}>
          {/* Gradient backdrop */}
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            background: 'linear-gradient(140deg, #7F0E13 0%, #E50012 18%, #917CFF 45%, #1D62FF 70%, #00D2B4 100%)',
            opacity: 0.07,
          }} />

          {/* ═══ HEADER ═══ */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '9px',
                background: 'linear-gradient(135deg, #e50012, #917cff, #1d62ff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '14px',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
                  <path d="M12 2a6 6 0 0 1 6 6v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z" />
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '17px', fontWeight: 900, color: 'white', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                  WORLD CUP 2026
                </span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#b6f124', textTransform: 'uppercase', letterSpacing: '2.5px', marginTop: '2px' }}>
                  My Official Bracket Predictions
                </span>
              </div>
            </div>
          </div>

          {/* ═══ MAIN CONTENT ═══ */}
          <div style={{
            display: 'flex', flex: 1, marginTop: '16px', marginBottom: '12px', gap: '28px',
          }}>

            {/* ─── LEFT: BRACKET TREE ─── */}
            <div style={{
              display: 'flex', flexDirection: 'column', flex: 1.35,
              backgroundColor: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: '16px', padding: '20px 22px',
            }}>
              {sectionLabel('Knockout Bracket', 'rgba(255,255,255,0.3)')}

              {/* Bracket columns: QF → SF → FINAL+CHAMPION */}
              <div style={{ display: 'flex', flex: 1, marginTop: '12px', gap: '0px' }}>

                {/* QF Column */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  {sectionLabel('Quarter-Finals', 'rgba(0,210,180,0.6)')}
                  {/* QF Pair 1: feeds SF_1 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, justifyContent: 'center', padding: '4px 0' }}>
                    {renderMatch(qf[0])}
                    {renderMatch(qf[1])}
                  </div>
                  {/* QF Pair 2: feeds SF_2 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, justifyContent: 'center', padding: '4px 0' }}>
                    {renderMatch(qf[2])}
                    {renderMatch(qf[3])}
                  </div>
                </div>

                {connector()}

                {/* SF Column */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {sectionLabel('Semi-Finals', 'rgba(145,124,255,0.7)')}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', flex: 1 }}>
                    {renderMatch(sf[0], true)}
                    {renderMatch(sf[1], true)}
                  </div>
                </div>

                {connector()}

                {/* FINAL + CHAMPION Column */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1.3, alignItems: 'center' }}>
                  {sectionLabel('Grand Final', 'rgba(234,179,8,0.7)')}

                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', flex: 1, gap: '16px',
                  }}>
                    {/* Champion Badge */}
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      backgroundColor: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)',
                      borderRadius: '16px', padding: '18px 28px', width: '100%', maxWidth: '260px',
                    }}>
                      <span style={{
                        fontSize: '8px', fontWeight: 800, color: '#eab308',
                        textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '8px',
                      }}>
                        Predicted Champion
                      </span>
                      {s.winner ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <img src={getFlagUrlByCode(s.winner)} width={56} height={38}
                            style={{ borderRadius: '5px', border: '2px solid rgba(234,179,8,0.25)', objectFit: 'cover' }} />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '26px', fontWeight: 900, color: '#eab308', lineHeight: 1 }}>
                              {getName(s.winner)}
                            </span>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(234,179,8,0.5)', letterSpacing: '2px', marginTop: '2px' }}>
                              {s.winner}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '16px', fontWeight: 800, color: 'rgba(255,255,255,0.25)' }}>TBD</span>
                      )}
                    </div>

                    {/* Final Match Score */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px',
                      backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: '12px', padding: '12px 20px', width: '100%', maxWidth: '260px',
                    }}>
                      {s.home ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%', justifyContent: 'center' }}>
                          {/* Home */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <img src={getFlagUrlByCode(s.home)} width={24} height={16} style={{ borderRadius: '2px', objectFit: 'cover' }} />
                            <span style={{ fontSize: '12px', fontWeight: 800, color: 'white', maxWidth: '40px', overflow: 'hidden' }}>{s.home}</span>
                          </div>
                          {/* Score pill */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: '16px', fontWeight: 900, color: 'white', lineHeight: 1 }}>
                              {s.homeScore !== null && s.awayScore !== null ? `${s.homeScore} – ${s.awayScore}` : 'VS'}
                            </span>
                            {s.homePens !== null && s.awayPens !== null && (
                              <span style={{ fontSize: '8px', fontWeight: 700, color: '#f97316', marginTop: '2px' }}>
                                PEN {s.homePens}–{s.awayPens}
                              </span>
                            )}
                          </div>
                          {/* Away */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: 'white', maxWidth: '40px', overflow: 'hidden' }}>{s.away}</span>
                            <img src={getFlagUrlByCode(s.away)} width={24} height={16} style={{ borderRadius: '2px', objectFit: 'cover' }} />
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.15)', letterSpacing: '2px' }}>TBD</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── RIGHT: AWARDS PANEL ─── */}
            <div style={{
              display: 'flex', flexDirection: 'column', width: '380px', flexShrink: 0,
              backgroundColor: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: '16px', padding: '20px 22px',
            }}>
              {sectionLabel('Individual Awards', 'rgba(234,179,8,0.6)')}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px', flex: 1, justifyContent: 'center' }}>
                {/* Golden Ball */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  backgroundColor: 'rgba(145,124,255,0.04)', border: '1px solid rgba(145,124,255,0.15)',
                  padding: '14px 16px', borderRadius: '12px',
                }}>
                  <span style={{ fontSize: '26px', flexShrink: 0 }}>🏆</span>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '8px', fontWeight: 800, color: '#917cff', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Golden Ball · MVP</span>
                    <span style={{ fontSize: '15px', fontWeight: 900, color: 'white', marginTop: '1px', lineHeight: 1.2, maxWidth: '200px', overflow: 'hidden' }}>{s.gbName}</span>
                  </div>
                  {s.gbTeam && s.gbTeam !== 'OTH' && s.gbTeam !== '' && (
                    <img src={getFlagUrlByCode(s.gbTeam)} width={28} height={19} style={{ borderRadius: '3px', objectFit: 'cover', flexShrink: 0 }} />
                  )}
                </div>

                {/* Golden Boot */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  backgroundColor: 'rgba(234,88,12,0.04)', border: '1px solid rgba(234,88,12,0.15)',
                  padding: '14px 16px', borderRadius: '12px',
                }}>
                  <span style={{ fontSize: '26px', flexShrink: 0 }}>⚽</span>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '8px', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Golden Boot · Top Scorer</span>
                    <span style={{ fontSize: '15px', fontWeight: 900, color: 'white', marginTop: '1px', lineHeight: 1.2, maxWidth: '200px', overflow: 'hidden' }}>{s.gtName}</span>
                  </div>
                  {s.gtTeam && s.gtTeam !== 'OTH' && s.gtTeam !== '' && (
                    <img src={getFlagUrlByCode(s.gtTeam)} width={28} height={19} style={{ borderRadius: '3px', objectFit: 'cover', flexShrink: 0 }} />
                  )}
                </div>

                {/* Golden Glove */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  backgroundColor: 'rgba(29,98,255,0.04)', border: '1px solid rgba(29,98,255,0.15)',
                  padding: '14px 16px', borderRadius: '12px',
                }}>
                  <span style={{ fontSize: '26px', flexShrink: 0 }}>🧤</span>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '8px', fontWeight: 800, color: '#1d62ff', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Golden Glove · Best GK</span>
                    <span style={{ fontSize: '15px', fontWeight: 900, color: 'white', marginTop: '1px', lineHeight: 1.2, maxWidth: '200px', overflow: 'hidden' }}>{s.ggName}</span>
                  </div>
                  {s.ggTeam && s.ggTeam !== 'OTH' && s.ggTeam !== '' && (
                    <img src={getFlagUrlByCode(s.ggTeam)} width={28} height={19} style={{ borderRadius: '3px', objectFit: 'cover', flexShrink: 0 }} />
                  )}
                </div>

                {/* Best Young Player */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  backgroundColor: 'rgba(132,204,22,0.04)', border: '1px solid rgba(132,204,22,0.15)',
                  padding: '14px 16px', borderRadius: '12px',
                }}>
                  <span style={{ fontSize: '26px', flexShrink: 0 }}>🌟</span>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '8px', fontWeight: 800, color: '#84cc16', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Best Young Player</span>
                    <span style={{ fontSize: '15px', fontWeight: 900, color: 'white', marginTop: '1px', lineHeight: 1.2, maxWidth: '200px', overflow: 'hidden' }}>{s.byName || 'TBD'}</span>
                  </div>
                  {s.byTeam && s.byTeam !== 'OTH' && s.byTeam !== '' && (
                    <img src={getFlagUrlByCode(s.byTeam)} width={28} height={19} style={{ borderRadius: '3px', objectFit: 'cover', flexShrink: 0 }} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ═══ FOOTER ═══ */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px',
            fontSize: '8px', fontWeight: 700, color: 'rgba(255,255,255,0.2)',
            textTransform: 'uppercase', letterSpacing: '1.5px',
          }}>
            <span>Generated on DunyaKupasiTahmin.com</span>
            <span>FIFA World Cup 2026™</span>
          </div>
        </div>
      ),
      {
        width: 1920,
        height: 1080,
      }
    );
  } catch (error) {
    console.error('OG generation error:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
