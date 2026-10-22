import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import {
  updateProfileSchema,
  addAddressSchema,
  addressIdParamSchema,
} from '../validators/user.schema';

const router = Router();

// GET /api/users/me — Get user profile
router.get('/me', requireAuth, userController.getProfile.bind(userController));

// PATCH /api/users/me — Update user profile
router.patch(
  '/me',
  requireAuth,
  validateRequest(updateProfileSchema),
  userController.updateProfile.bind(userController),
);

// POST /api/users/me/addresses — Add address
router.post(
  '/me/addresses',
  requireAuth,
  validateRequest(addAddressSchema),
  userController.addAddress.bind(userController),
);

// DELETE /api/users/me/addresses/:id — Delete address
router.delete(
  '/me/addresses/:id',
  requireAuth,
  validateRequest(addressIdParamSchema),
  userController.deleteAddress.bind(userController),
);

export default router;
