import { NextResponse } from 'next/server';

// Development only - Clear rate limit store
export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  // Clear the rate limit store by restarting will clear it
  // This endpoint just confirms it's development mode
  return NextResponse.json({
    message: 'Rate limits are relaxed in development mode',
    tip: 'Restart the dev server to clear rate limit memory',
  });
}
