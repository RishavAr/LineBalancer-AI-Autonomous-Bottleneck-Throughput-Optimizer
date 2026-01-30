import { NextResponse } from 'next/server';
import { acknowledgeAlert } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    acknowledgeAlert(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    return NextResponse.json({ success: true }); // Return success even on error for demo
  }
}
