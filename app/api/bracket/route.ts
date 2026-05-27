import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '../../../utils/supabaseClient';

// Helper to generate a unique 6-character code
function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request: Request) {
  try {
    const { predictions } = await request.json();
    if (!predictions) {
      return NextResponse.json(
        { success: false, error: 'Missing predictions data' },
        { status: 400 }
      );
    }

    const code = generateCode();

    // If Supabase is unconfigured, return mock mode
    if (!isSupabaseConfigured) {
      console.warn('Supabase is not configured. Running in Local Mock mode.');
      return NextResponse.json({
        success: true,
        code,
        mock: true
      });
    }

    // Try to insert in Supabase (with unique check loop)
    let finalCode = code;
    let insertSuccess = false;
    let attempts = 0;

    while (!insertSuccess && attempts < 5) {
      attempts++;
      const { error } = await supabase.from('user_brackets').insert({
        bracket_code: finalCode,
        predictions_data: predictions
      });

      if (!error) {
        insertSuccess = true;
      } else if (error.code === '23505') {
        // Unique violation code
        finalCode = generateCode();
      } else {
        throw error;
      }
    }

    if (!insertSuccess) {
      throw new Error('Failed to generate unique bracket code after 5 attempts');
    }

    return NextResponse.json({
      success: true,
      code: finalCode
    });
  } catch (err: any) {
    console.error('Error saving bracket:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code')?.toUpperCase();

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Missing code parameter' },
        { status: 400 }
      );
    }

    // If Supabase is unconfigured, indicate mock loading check
    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured',
        mock: true
      });
    }

    const { data, error } = await supabase
      .from('user_brackets')
      .select('predictions_data')
      .eq('bracket_code', code)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Bracket not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      predictions: data.predictions_data
    });
  } catch (err: any) {
    console.error('Error fetching bracket:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
