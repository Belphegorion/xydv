import { NextResponse } from 'next/server';

const API_BASE_URL =
  process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
    return NextResponse.json(
      {
        success: false,
        error:
          'Support service is temporarily unavailable. Please try again later or email support@xydv.com.',
      },
      { status: 502 },
    );
  }
}
