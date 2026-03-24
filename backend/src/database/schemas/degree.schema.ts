// src/database/schemas/degree.schema.ts
import { Schema, model, models, Document } from 'mongoose';
import { DegreeType, DegreeTypes } from '../types';

export interface IDegree extends Document {
  name: string; // "BSc Computer Science"
  slug: string; // for URLs; unique
  type: DegreeType; // 'undergraduate' (for now)
  durationYears: number; // 3 (or 2 if needed)
  createdAt: Date;
  updatedAt: Date;
}

const DegreeSchema = new Schema<IDegree>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: DegreeTypes as unknown as string[],
      required: true,
      default: 'undergraduate',
    },
    durationYears: { type: Number, required: true, min: 1, max: 6, default: 3 },
  },
  { timestamps: true, versionKey: false, collection: 'degrees' },
);

DegreeSchema.index({ type: 1, department: 1 });

export const Degree = models.Degree || model<IDegree>('Degree', DegreeSchema);
