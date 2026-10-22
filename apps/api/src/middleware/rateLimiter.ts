import rateLimit from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test' || !process.env.NODE_ENV;

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  skip: () => isTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skip: () => isTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many auth attempts. Please try again later.', message: 'Too many auth attempts. Please try again later.' },
});

export const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  skip: () => isTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many orders created from this IP, please try again later.',
    message: 'Too many orders created from this IP, please try again later.',
  },
});
