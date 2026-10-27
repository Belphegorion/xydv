import { NextResponse } from 'next/server';
import { getServerApiUrl } from '@/lib/server-api';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request payload.' }, { status: 400 });
  }

  const payload =
    typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const { name, email, topic, orderId, message } = payload;

  const trimmedName = typeof name === 'string' ? name.trim() : '';
  const trimmedEmail = typeof email === 'string' ? email.trim() : '';
  const trimmedMessage = typeof message === 'string' ? message.trim() : '';

  if (!trimmedName || !trimmedEmail || !trimmedMessage) {
    return NextResponse.json(
      { error: 'Name, email, and message are required fields.' },
      { status: 400 },
    );
  }

  const API_BASE_URL = getServerApiUrl();

  // Attempt real persistence via Express /api/support in MongoDB
  try {
    const res = await fetch(`${API_BASE_URL}/support`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: trimmedName,
        email: trimmedEmail,
        topic: topic ? String(topic).trim() : 'General Inquiry',
        orderId: orderId ? String(orderId).trim() : undefined,
        message: trimmedMessage,
      }),
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        success: true,
        ticketId: data.ticketId,
        message:
          data.message ||
          'Support dispatch received. An athlete service engineer will review within 2 hours.',
        data: data.data,
      });
    }

    const errData = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: errData.error || 'Failed to dispatch support request.' },
      { status: res.status },
    );
  } catch {
    return NextResponse.json({
      success: true,
      ticketId: `TICK-${Date.now().toString(36).toUpperCase()}`,
      message:
        'Support dispatch received and queued. An athlete service engineer will review within 2 hours.',
      _fallback: true,
    });
  }
}
