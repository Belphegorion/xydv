import { Router } from 'express';
import { Ticket } from '../models/Ticket.model';
import { Setting } from '../models/Setting.model';
import { logger } from '../config/logger';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { name, email, topic, orderId, message } = req.body || {};

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const trimmedEmail = typeof email === 'string' ? email.trim() : '';
    const trimmedMessage = typeof message === 'string' ? message.trim() : '';

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      res.status(400).json({
        success: false,
        error: 'Name, email, and message are required fields.',
      });
      return;
    }

    const ticketId = `XYDV-TK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const ticket = await Ticket.create({
      ticketId,
      name: trimmedName,
      email: trimmedEmail,
      topic: topic ? String(topic).trim() : 'General Inquiry',
      orderId: orderId ? String(orderId).trim() : undefined,
      message: trimmedMessage,
      status: 'open',
    });

    const setting = await Setting.findOne({ key: 'global_store_settings' }).lean();
    const supportEmail = setting?.supportEmail || 'support@xydv.com';

    logger.info(
      `[SUPPORT TICKET CREATED] Ticket ${ticket.ticketId} from ${trimmedEmail} routed to ${supportEmail}`,
    );

    res.status(201).json({
      success: true,
      ticketId: ticket.ticketId,
      message: 'Support dispatch received. An athlete service engineer will review within 2 hours.',
      data: {
        id: ticket._id,
        ticketId: ticket.ticketId,
        name: ticket.name,
        email: ticket.email,
        topic: ticket.topic,
        orderId: ticket.orderId,
        createdAt: ticket.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
