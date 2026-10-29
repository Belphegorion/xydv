import { Router } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { Ticket } from '../models/Ticket.model';
import { Setting } from '../models/Setting.model';
import { logger } from '../config/logger';
import { validateRequest } from '../middleware/validateRequest';
import { authLimiter } from '../middleware/rateLimiter';

export const createTicketSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
    email: z.string().trim().email('Invalid email address').toLowerCase(),
    subject: z.string().trim().nullable().optional(),
    topic: z.string().trim().nullable().optional(),
    orderId: z.string().trim().nullable().optional(),
    message: z.string().trim().min(1, 'Message is required').max(5000, 'Message cannot exceed 5000 characters'),
  }),
});

const router = Router();

router.post('/', authLimiter, validateRequest(createTicketSchema), async (req, res, next) => {
  try {
    const { name, email, subject, topic, orderId, message } = req.body;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedMessage = message.trim();
    const ticketTopic = (topic || subject || 'General Inquiry').trim();

    const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
    const ticketId = `XYDV-TK-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;

    const ticket = await Ticket.create({
      ticketId,
      name: trimmedName,
      email: trimmedEmail,
      topic: ticketTopic,
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
