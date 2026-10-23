import type { Response, NextFunction } from 'express';
import { orderService, type ShippingAddressInput } from '../services/order.service';
import { type AuthRequest, getAuthenticatedUser } from '../middleware/auth';

function getParam(param: string | string[] | undefined): string {
  if (!param) return '';
  return Array.isArray(param) ? param[0] : param;
}

export class OrderController {
  async createRazorpayOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { items, shippingAddress, customerEmail, email } = req.body;
      const guestEmail = shippingAddress?.email || customerEmail || email;
      const resolvedShipping: ShippingAddressInput | undefined = shippingAddress
        ? {
            ...shippingAddress,
            ...(guestEmail ? { email: guestEmail } : {}),
          }
        : guestEmail
          ? { email: guestEmail }
          : undefined;
      const data = await orderService.createRazorpayOrder(
        items,
        resolvedShipping,
        req.user?._id ? String(req.user._id) : undefined,
      );
      res.json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async verifyPayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await orderService.verifyPayment(req.body);
      res.json({
        success: true,
        message: result.alreadyCaptured
          ? 'Payment already verified'
          : 'Payment verified successfully',
        data: {
          orderId: result.orderId,
          razorpayOrderId: result.razorpayOrderId,
          status: result.status,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async createDirectOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUser = getAuthenticatedUser(req);
      const order = await orderService.createDirectOrder(String(authUser._id), req.body);
      res.status(201).json({
        success: true,
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }

  async getUserOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUser = getAuthenticatedUser(req);
      const orders = await orderService.getUserOrders(String(authUser._id));
      res.json({
        success: true,
        data: orders,
      });
    } catch (err) {
      next(err);
    }
  }

  async getOrderById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUser = getAuthenticatedUser(req);
      const isAdmin = authUser.role === 'admin';
      const id = getParam(req.params.id);
      const order = await orderService.getOrderById(id, String(authUser._id), isAdmin);
      res.json({
        success: true,
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const orderController = new OrderController();
export default orderController;
