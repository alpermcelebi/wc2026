import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { deserializePredictions, getFlagUrlByCode, TEAM_CODE_TO_ISO } from '../../../utils/shareCompression';

export const runtime = 'edge';

// Map 3-letter codes to full country names for display
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

const getFullName = (code: string) => CODE_TO_NAME[code] || code;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('predictions');
  const type = searchParams.get('type') || 'champion';

  if (!code) {
    return new Response('Missing predictions parameter', { status: 400 });
  }

  try {
    const { s } = deserializePredictions(code);

    // Shared header component
    const Header = () => (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          paddingBottom: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #e50012, #917cff, #1d62ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '14px',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
              <path d="M12 2a6 6 0 0 1 6 6v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.3px', color: 'white', lineHeight: 1.1 }}>
              WORLD CUP 2026
            </span>
            <span style={{ fontSize: '9px', fontWeight: 800, color: '#b6f124', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '3px' }}>
              Bracket Predictor
            </span>
          </div>
        </div>
      </div>
    );

    // Shared footer
    const Footer = () => (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: '14px',
          fontSize: '9px',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.25)',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
        }}
      >
        <span>DunyaKupasiTahmin.com</span>
        <span>FIFA World Cup 2026™</span>
      </div>
    );

    // ─── CHAMPION POSTER ─────────────────────────────────────────
    const ChampionPoster = () => (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {/* Title */}
        <span style={{ fontSize: '11px', fontWeight: 800, color: '#eab308', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '8px' }}>
          My Predicted
        </span>
        <span style={{ fontSize: '28px', fontWeight: 900, color: '#eab308', textTransform: 'uppercase', letterSpacing: '3px' }}>
          World Champion
        </span>

        {/* Champion Flag & Name */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '32px', gap: '28px' }}>
          {s.winner ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
              <img
                src={getFlagUrlByCode(s.winner)}
                width={120}
                height={80}
                style={{ borderRadius: '10px', border: '3px solid rgba(255,255,255,0.15)', objectFit: 'cover' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '52px', fontWeight: 900, color: 'white', lineHeight: 1 }}>{getFullName(s.winner)}</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginTop: '4px', letterSpacing: '2px' }}>{s.winner}</span>
              </div>
            </div>
          ) : (
            <span style={{ fontSize: '28px', fontWeight: 900, color: 'rgba(255,255,255,0.3)' }}>NOT YET DECIDED</span>
          )}
        </div>

        {/* Grand Final Score Badge */}
        {s.home && s.away && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            marginTop: '40px',
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '16px 32px',
            borderRadius: '16px',
          }}>
            {/* Home */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={getFlagUrlByCode(s.home)} width={32} height={22} style={{ borderRadius: '3px', objectFit: 'cover' }} />
              <span style={{ fontSize: '16px', fontWeight: 800, color: 'white', maxWidth: '100px', overflow: 'hidden' }}>{s.home}</span>
            </div>

            {/* Score pill */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: 'rgba(255,255,255,0.06)',
              padding: '8px 20px',
              borderRadius: '12px',
            }}>
              <span style={{ fontSize: '24px', fontWeight: 900, color: 'white', lineHeight: 1 }}>
                {s.homeScore !== null && s.awayScore !== null ? `${s.homeScore} – ${s.awayScore}` : 'VS'}
              </span>
              {s.homePens !== null && s.awayPens !== null && (
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#f97316', marginTop: '4px', letterSpacing: '1px' }}>
                  PEN {s.homePens} – {s.awayPens}
                </span>
              )}
            </div>

            {/* Away */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '16px', fontWeight: 800, color: 'white', maxWidth: '100px', overflow: 'hidden' }}>{s.away}</span>
              <img src={getFlagUrlByCode(s.away)} width={32} height={22} style={{ borderRadius: '3px', objectFit: 'cover' }} />
            </div>
          </div>
        )}
      </div>
    );

    // ─── SEMI-FINALISTS POSTER ───────────────────────────────────
    const SemiFinalsPoster = () => (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: '#917cff', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '6px' }}>
          Eliminated in the Semi-Finals
        </span>
        <span style={{ fontSize: '24px', fontWeight: 900, color: '#917cff', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Semi-Finalists
        </span>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '40px', width: '100%', maxWidth: '700px' }}>
          {s.sfTeams && s.sfTeams.length > 0 ? s.sfTeams.map((t, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'rgba(145,124,255,0.04)',
                border: '1px solid rgba(145,124,255,0.15)',
                padding: '28px 24px',
                borderRadius: '20px',
                flex: 1,
                maxWidth: '300px',
              }}
            >
              <img src={getFlagUrlByCode(t)} width={72} height={48} style={{ borderRadius: '6px', border: '2px solid rgba(255,255,255,0.1)', objectFit: 'cover' }} />
              <span style={{ fontSize: '28px', fontWeight: 900, color: 'white', marginTop: '14px', lineHeight: 1.1, textAlign: 'center' }}>{getFullName(t)}</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginTop: '4px', letterSpacing: '2px' }}>{t}</span>
            </div>
          )) : (
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '16px' }}>Semi-Finals not yet predicted.</span>
          )}
        </div>
      </div>
    );

    // ─── QUARTER-FINALISTS POSTER ────────────────────────────────
    const QuarterFinalsPoster = () => (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: '#00D2B4', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '6px' }}>
          Eliminated in the Quarter-Finals
        </span>
        <span style={{ fontSize: '24px', fontWeight: 900, color: '#00D2B4', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Quarter-Finalists
        </span>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', marginTop: '32px', width: '100%', maxWidth: '900px' }}>
          {s.qfTeams && s.qfTeams.length > 0 ? s.qfTeams.map((t, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'rgba(0,210,180,0.04)',
                border: '1px solid rgba(0,210,180,0.15)',
                padding: '20px 16px',
                borderRadius: '16px',
                width: '200px',
              }}
            >
              <img src={getFlagUrlByCode(t)} width={56} height={38} style={{ borderRadius: '5px', border: '1px solid rgba(255,255,255,0.1)', objectFit: 'cover' }} />
              <span style={{ fontSize: '18px', fontWeight: 900, color: 'white', marginTop: '10px', lineHeight: 1.1, textAlign: 'center', maxWidth: '160px', overflow: 'hidden' }}>{getFullName(t)}</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', marginTop: '3px', letterSpacing: '2px' }}>{t}</span>
            </div>
          )) : (
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '16px' }}>Quarter-Finals not yet predicted.</span>
          )}
        </div>
      </div>
    );

    // ─── AWARDS POSTER ───────────────────────────────────────────
    const awardCards: { emoji: string; label: string; name: string; team: string; color: string; bg: string; border: string }[] = [
      { emoji: '🏆', label: 'Golden Ball · MVP', name: s.gbName, team: s.gbTeam, color: '#917cff', bg: 'rgba(145,124,255,0.05)', border: 'rgba(145,124,255,0.2)' },
      { emoji: '⚽', label: 'Golden Boot · Top Scorer', name: s.gtName, team: s.gtTeam, color: '#ea580c', bg: 'rgba(234,88,12,0.05)', border: 'rgba(234,88,12,0.2)' },
      { emoji: '🧤', label: 'Golden Glove · Best GK', name: s.ggName, team: s.ggTeam, color: '#1d62ff', bg: 'rgba(29,98,255,0.05)', border: 'rgba(29,98,255,0.2)' },
      { emoji: '🌟', label: 'Best Young Player', name: s.byName || 'TBD', team: s.byTeam || '', color: '#84cc16', bg: 'rgba(132,204,22,0.05)', border: 'rgba(132,204,22,0.2)' },
    ];

    const AwardsPoster = () => (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: '#eab308', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '6px' }}>
          My Predicted
        </span>
        <span style={{ fontSize: '24px', fontWeight: 900, color: '#eab308', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Individual Awards
        </span>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', marginTop: '28px', width: '100%', maxWidth: '900px' }}>
          {awardCards.map((award, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                backgroundColor: award.bg,
                border: `1px solid ${award.border}`,
                padding: '16px 20px',
                borderRadius: '16px',
                width: '420px',
              }}
            >
              <span style={{ fontSize: '32px', flexShrink: 0 }}>{award.emoji}</span>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '9px', fontWeight: 800, color: award.color, textTransform: 'uppercase', letterSpacing: '1.5px' }}>{award.label}</span>
                <span style={{ fontSize: '18px', fontWeight: 900, color: 'white', marginTop: '2px', lineHeight: 1.2, maxWidth: '280px', overflow: 'hidden' }}>{award.name}</span>
              </div>
              {award.team && award.team !== 'OTH' && award.team !== '' && (
                <img src={getFlagUrlByCode(award.team)} width={36} height={24} style={{ borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', objectFit: 'cover', flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>
      </div>
    );

    // ─── RENDER ──────────────────────────────────────────────────
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#08090f',
            color: '#f4f4f5',
            padding: '40px 48px',
            justifyContent: 'space-between',
            fontFamily: 'sans-serif',
            position: 'relative',
          }}
        >
          {/* Gradient backdrop */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              background: 'linear-gradient(135deg, #7F0E13 0%, #E50012 20%, #917CFF 50%, #1D62FF 75%, #00D2B4 100%)',
              opacity: 0.08,
            }}
          />

          <Header />

          {/* Content body */}
          <div style={{ display: 'flex', flex: 1, marginTop: '16px', marginBottom: '16px' }}>
            {type === 'semifinals' ? (
              <SemiFinalsPoster />
            ) : type === 'quarterfinals' ? (
              <QuarterFinalsPoster />
            ) : type === 'awards' ? (
              <AwardsPoster />
            ) : (
              <ChampionPoster />
            )}
          </div>

          <Footer />
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('OG generation error:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
