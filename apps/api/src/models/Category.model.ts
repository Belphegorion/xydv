import mongoose, { type Document, type Model } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: mongoose.Types.ObjectId | null;
  parentSlug?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new mongoose.Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, trim: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    parentSlug: { type: String, lowercase: true, trim: true, default: null },
  },
  { timestamps: true },
);

categorySchema.index({ parentId: 1 });
categorySchema.index({ parentSlug: 1 });

export const Category: Model<ICategory> =
  (mongoose.models.Category as Model<ICategory>) ||
  mongoose.model<ICategory>('Category', categorySchema);
