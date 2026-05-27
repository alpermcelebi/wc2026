import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { deserializePredictions, getFlagUrlByCode } from '../../../utils/shareCompression';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('predictions');
  const type = searchParams.get('type') || 'champion';

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
            {type === 'semifinals' ? (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '42px', fontWeight: 900, color: '#917cff', textTransform: 'uppercase', marginBottom: '60px', letterSpacing: '2px' }}>MY TOP 4 - SEMI-FINALISTS</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '40px', width: '100%', maxWidth: '800px' }}>
                  {s.sfTeams && s.sfTeams.length > 0 ? s.sfTeams.map((t, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '30px', borderRadius: '24px', width: '45%' }}>
                      <img src={getFlagUrlByCode(t)} style={{ width: '120px', height: '80px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.2)' }} />
                      <span style={{ fontSize: '36px', fontWeight: 900, color: 'white', marginTop: '20px' }}>{t}</span>
                    </div>
                  )) : (
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '24px' }}>Semi-Finalists not predicted yet.</span>
                  )}
                </div>
              </div>
            ) : type === 'quarterfinals' ? (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '42px', fontWeight: 900, color: '#00D2B4', textTransform: 'uppercase', marginBottom: '50px', letterSpacing: '2px' }}>THE ELITE EIGHT - QUARTER-FINALISTS</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '24px', width: '100%', maxWidth: '1000px' }}>
                  {s.qfTeams && s.qfTeams.length > 0 ? s.qfTeams.map((t, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '24px', borderRadius: '20px', width: '22%' }}>
                      <img src={getFlagUrlByCode(t)} style={{ width: '80px', height: '54px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)' }} />
                      <span style={{ fontSize: '28px', fontWeight: 900, color: 'white', marginTop: '16px' }}>{t}</span>
                    </div>
                  )) : (
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '24px' }}>Quarter-Finalists not predicted yet.</span>
                  )}
                </div>
              </div>
            ) : type === 'awards' ? (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '42px', fontWeight: 900, color: '#eab308', textTransform: 'uppercase', marginBottom: '30px', letterSpacing: '2px' }}>WORLD CUP 2026 - INDIVIDUAL AWARDS GALA</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '24px', width: '100%', maxWidth: '1000px' }}>
                  {/* Golden Ball */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'rgba(145,124,255,0.05)', border: '1px solid rgba(145,124,255,0.2)', padding: '20px', borderRadius: '24px', width: '45%' }}>
                    <span style={{ fontSize: '48px' }}>🏆</span>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: '#917cff', textTransform: 'uppercase', marginTop: '8px', letterSpacing: '1px' }}>Golden Ball (MVP)</span>
                    <span style={{ fontSize: '32px', fontWeight: 900, color: 'white', marginTop: '8px' }}>{s.gbName}</span>
                    {s.gbTeam && s.gbTeam !== 'OTH' && <img src={getFlagUrlByCode(s.gbTeam)} style={{ width: '60px', height: '40px', marginTop: '16px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)' }} />}
                  </div>
                  {/* Golden Boot */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'rgba(234,88,12,0.05)', border: '1px solid rgba(234,88,12,0.2)', padding: '20px', borderRadius: '24px', width: '45%' }}>
                    <span style={{ fontSize: '48px' }}>⚽</span>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: '#ea580c', textTransform: 'uppercase', marginTop: '8px', letterSpacing: '1px' }}>Golden Boot (Top Scorer)</span>
                    <span style={{ fontSize: '32px', fontWeight: 900, color: 'white', marginTop: '8px' }}>{s.gtName}</span>
                    {s.gtTeam && s.gtTeam !== 'OTH' && <img src={getFlagUrlByCode(s.gtTeam)} style={{ width: '60px', height: '40px', marginTop: '16px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)' }} />}
                  </div>
                  {/* Golden Glove */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'rgba(29,98,255,0.05)', border: '1px solid rgba(29,98,255,0.2)', padding: '20px', borderRadius: '24px', width: '45%' }}>
                    <span style={{ fontSize: '48px' }}>🧤</span>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: '#1d62ff', textTransform: 'uppercase', marginTop: '8px', letterSpacing: '1px' }}>Golden Glove (Best GK)</span>
                    <span style={{ fontSize: '32px', fontWeight: 900, color: 'white', marginTop: '8px' }}>{s.ggName}</span>
                    {s.ggTeam && s.ggTeam !== 'OTH' && <img src={getFlagUrlByCode(s.ggTeam)} style={{ width: '60px', height: '40px', marginTop: '16px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)' }} />}
                  </div>
                  {/* Best Young Player */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'rgba(132,204,22,0.05)', border: '1px solid rgba(132,204,22,0.2)', padding: '20px', borderRadius: '24px', width: '45%' }}>
                    <span style={{ fontSize: '48px' }}>🌟</span>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: '#84cc16', textTransform: 'uppercase', marginTop: '8px', letterSpacing: '1px' }}>Best Young Player</span>
                    <span style={{ fontSize: '32px', fontWeight: 900, color: 'white', marginTop: '8px' }}>{s.byName || 'TBD'}</span>
                    {s.byTeam && s.byTeam !== 'OTH' && <img src={getFlagUrlByCode(s.byTeam)} style={{ width: '60px', height: '40px', marginTop: '16px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)' }} />}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '48px', fontWeight: 900, color: '#eab308', textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '2px', textShadow: '0 4px 20px rgba(234,179,8,0.4)' }}>
                  MY 2026 WORLD CUP CHAMPION
                </span>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '40px' }}>
                   {s.winner ? (
                     <div style={{ display: 'flex', alignItems: 'center' }}>
                       <img src={getFlagUrlByCode(s.winner)} style={{ width: '240px', height: '160px', objectFit: 'cover', borderRadius: '16px', border: '4px solid rgba(255,255,255,0.2)' }} />
                       <span style={{ fontSize: '100px', fontWeight: 900, color: 'white', marginLeft: '48px', textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>{s.winner}</span>
                     </div>
                   ) : (
                     <span style={{ fontSize: '48px', fontWeight: 900, color: 'rgba(255,255,255,0.5)' }}>UNDECIDED</span>
                   )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '60px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '24px 48px', borderRadius: '24px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 900, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px' }}>Grand Final Result</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '32px', fontWeight: 900, color: 'white' }}>{s.home || 'TBD'}</span>
                      {s.home && <img src={getFlagUrlByCode(s.home)} style={{ width: '48px', height: '32px', borderRadius: '4px' }} />}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '48px', fontWeight: 900, color: 'white', lineHeight: 1 }}>
                        {s.homeScore !== null && s.awayScore !== null ? `${s.homeScore} - ${s.awayScore}` : 'VS'}
                      </span>
                      {s.homePens !== null && s.awayPens !== null && (
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#f97316', marginTop: '8px' }}>
                          ({s.homePens} - {s.awayPens}) Pens
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {s.away && <img src={getFlagUrlByCode(s.away)} style={{ width: '48px', height: '32px', borderRadius: '4px' }} />}
                      <span style={{ fontSize: '32px', fontWeight: 900, color: 'white' }}>{s.away || 'TBD'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
