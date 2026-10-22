import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON request payload.' },
      { status: 400 },
    );
  }

  try {
    const { name, email, topic, orderId, message } = body || {};

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const trimmedEmail = typeof email === 'string' ? email.trim() : '';
    const trimmedMessage = typeof message === 'string' ? message.trim() : '';

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      return NextResponse.json(
        { error: 'Name, email, and message are required fields.' },
        { status: 400 },
      );
    }

    // Generate a deterministic technical ticket ID
    const ticketId = `XYDV-TK-${Date.now().toString(36).toUpperCase()}`;

    // Return success response with SLA guarantee
    return NextResponse.json({
      success: true,
      ticketId,
      message: 'Support dispatch received. An athlete service engineer will review within 2 hours.',
      data: {
        name: trimmedName,
        email: trimmedEmail,
        topic: topic ? String(topic).trim() : 'General Inquiry',
        orderId: orderId ? String(orderId).trim() : null,
        receivedAt: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error processing contact dispatch.' },
      { status: 500 },
    );
  }
}
