import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { deserializePredictions, getFlagUrlByCode } from '../../../utils/shareCompression';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('predictions');

  if (!code) {
    return new Response('Missing predictions parameter', { status: 400 });
  }

  try {
    const { s } = deserializePredictions(code);

    return new ImageResponse(
      (
        <div 
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#06060c',
            color: '#f4f4f5',
            padding: '40px',
            justifyContent: 'space-between',
            fontFamily: 'sans-serif',
            position: 'relative',
          }}
        >
          {/* Subtle colorful brand linear gradient backdrop layer */}
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              background: 'linear-gradient(135deg, #7F0E13 0%, #E50012 25%, #917CFF 50%, #1D62FF 75%, #00D2B4 100%)',
              opacity: 0.12,
            }}
          />

          {/* Header */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              paddingBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div 
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: 'linear-gradient(to top right, #e50012, #917cff, #1d62ff)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px',
                }}
              >
                {/* SVG Trophy */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'white' }}>
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
                  <path d="M12 2a6 6 0 0 1 6 6v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z" />
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.5px', color: 'white', lineHeight: 1.1 }}>
                  WORLD CUP 2026
                </span>
                <span style={{ fontSize: '9px', fontWeight: 900, color: '#b6f124', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '2px' }}>
                  Bracket Predictor
                </span>
              </div>
            </div>
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '6px 12px',
                borderRadius: '8px',
              }}
            >
              <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', color: '#917cff', letterSpacing: '1px' }}>
                Share Code: Unsigned
              </span>
            </div>
          </div>

          {/* Content Body */}
          <div 
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'stretch',
              flex: 1,
              marginTop: '20px',
              marginBottom: '20px',
            }}
          >
            {/* Left Column: Final & Champion */}
            <div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1.2,
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                padding: '20px',
                borderRadius: '16px',
                marginRight: '20px',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Grand Final Prediction
              </span>

              {/* Final Match Scoreboard */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '12px 0' }}>
                {/* Home team */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <img src={getFlagUrlByCode(s.home)} style={{ width: '64px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <span style={{ fontSize: '15px', fontWeight: 900, color: 'white', marginTop: '6px' }}>{s.home || 'TBD'}</span>
                </div>

                {/* Score */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 16px' }}>
                  <span style={{ fontSize: '32px', fontWeight: 900, color: 'white', lineHeight: 1 }}>
                    {s.homeScore !== null && s.awayScore !== null ? `${s.homeScore} - ${s.awayScore}` : 'vs'}
                  </span>
                  {s.homePens !== null && s.awayPens !== null && (
                    <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#f97316', marginTop: '4px' }}>
                      ({s.homePens} - {s.awayPens}) Pens
                    </span>
                  )}
                </div>

                {/* Away team */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <img src={getFlagUrlByCode(s.away)} style={{ width: '64px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <span style={{ fontSize: '15px', fontWeight: 900, color: 'white', marginTop: '6px' }}>{s.away || 'TBD'}</span>
                </div>
              </div>

              {/* Predicted Champion Panel */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'rgba(234, 179, 8, 0.06)',
                  border: '1px solid rgba(234, 179, 8, 0.15)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  marginTop: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div 
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(234, 179, 8, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '12px',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2.5">
                      <circle cx="12" cy="8" r="7" />
                      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                    </svg>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '9px', fontWeight: 900, color: '#eab308', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Predicted World Champion
                    </span>
                    <span style={{ fontSize: '16px', fontWeight: 900, color: 'white', marginTop: '2px', lineHeight: 1.1 }}>
                      {s.winner || 'Undecided'}
                    </span>
                  </div>
                </div>
                {s.winner && (
                  <img src={getFlagUrlByCode(s.winner)} style={{ width: '40px', height: '25px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }} />
                )}
              </div>
            </div>

            {/* Right Column: Awards list */}
            <div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                padding: '20px',
                borderRadius: '16px',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Individual Awards Predictions
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                {/* Golden Ball */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px 12px', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '20px', marginRight: '10px' }}>🏆</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '8px', fontWeight: 900, color: '#917cff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Golden Ball (MVP)</span>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'white', marginTop: '2px' }}>{s.gbName}</span>
                    </div>
                  </div>
                  {s.gbTeam && (
                    <img src={getFlagUrlByCode(s.gbTeam)} style={{ width: '28px', height: '18px', objectFit: 'cover', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.1)' }} />
                  )}
                </div>

                {/* Golden Boot */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px 12px', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '20px', marginRight: '10px' }}>⚽</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '8px', fontWeight: 900, color: '#b6f124', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Golden Boot (Top Scorer)</span>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'white', marginTop: '2px' }}>{s.gtName}</span>
                    </div>
                  </div>
                  {s.gtTeam && (
                    <img src={getFlagUrlByCode(s.gtTeam)} style={{ width: '28px', height: '18px', objectFit: 'cover', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.1)' }} />
                  )}
                </div>

                {/* Golden Glove */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px 12px', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '20px', marginRight: '10px' }}>🧤</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '8px', fontWeight: 900, color: '#1d62ff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Golden Glove (Best GK)</span>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'white', marginTop: '2px' }}>{s.ggName}</span>
                    </div>
                  </div>
                  {s.ggTeam && (
                    <img src={getFlagUrlByCode(s.ggTeam)} style={{ width: '28px', height: '18px', objectFit: 'cover', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.1)' }} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              paddingTop: '12px',
              fontSize: '9px',
              fontWeight: 'bold',
              color: 'rgba(255,255,255,0.3)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            <span>Generated on DunyaKupasiTahmin.com - No Login Required!</span>
            <span>FIFA World Cup 2026</span>
          </div>
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
