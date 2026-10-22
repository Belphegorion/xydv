import mongoose, { type Document, type Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'customer' | 'admin';
  avatar?: string;
  loyaltyPoints: number;
  googleId?: string;
  isBlocked?: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  addresses: IAddress[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IAddress {
  _id?: mongoose.Types.ObjectId | string;
  id?: string;
  label: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

const addressSchema = new mongoose.Schema<IAddress>({
  label: { type: String, default: 'Home' },
  fullName: { type: String, required: true },
  line1: { type: String, required: true },
  line2: String,
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true, default: 'IN' },
  phone: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: { type: String, select: false, minlength: 8 },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    avatar: String,
    loyaltyPoints: { type: Number, default: 0, min: 0 },
    googleId: { type: String, unique: true, sparse: true },
    isBlocked: { type: Boolean, default: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    addresses: [addressSchema],
  },
  { timestamps: true },
);

userSchema.index({ isBlocked: 1 });
userSchema.index({ role: 1, createdAt: -1 });

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
