import { User, type IUser, type IAddress } from '../models/User.model';
import { AppError } from '../middleware/errorHandler';

export interface UpdateProfileInput {
  name?: string;
  avatar?: string;
}

export interface AddressInput {
  label?: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  phone: string;
  isDefault?: boolean;
}

export class UserService {
  async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  async updateProfile(userId: string, data: UpdateProfileInput): Promise<IUser> {
    const allowed = ['name', 'avatar'] as const;
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (data[key] !== undefined) updates[key] = data[key];
    }

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  async addAddress(userId: string, addressData: AddressInput): Promise<IAddress[]> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // If first address or isDefault is specified, update default flags
    if (addressData.isDefault || user.addresses.length === 0) {
      for (const addr of user.addresses) {
        addr.isDefault = false;
      }
      addressData.isDefault = true;
    }

    const newAddress: IAddress = {
      label: addressData.label || 'Home',
      fullName: addressData.fullName,
      line1: addressData.line1,
      line2: addressData.line2,
      city: addressData.city,
      state: addressData.state,
      postalCode: addressData.postalCode,
      country: addressData.country || 'IN',
      phone: addressData.phone,
      isDefault: Boolean(addressData.isDefault),
    };

    user.addresses.push(newAddress);
    await user.save();
    return user.addresses;
  }

  async deleteAddress(userId: string, addressId: string): Promise<IAddress[]> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const wasDefault = user.addresses.some(
      (addr: IAddress) => (addr._id?.toString() === addressId || addr.id === addressId) && addr.isDefault,
    );

    user.addresses = user.addresses.filter(
      (addr: IAddress) => addr._id?.toString() !== addressId && addr.id !== addressId,
    );

    // If default address was deleted and others remain, designate first address as default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    return user.addresses;
  }
}

export const userService = new UserService();
export default userService;
