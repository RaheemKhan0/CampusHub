// src/database/schemas/module.schema.ts
import { Schema, model, models, Document } from 'mongoose';
import { ModuleKinds, ModuleKind, Term, Terms } from '../types';

export interface IModule extends Document {
  title: string; // "Intro to Programming"
  description?: string;
  credits?: number; // e.g., 15
  moduleKind: ModuleKind;
  term: Term;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

const ModuleSchema = new Schema<IModule>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    slug: { type: String, unique: true, trim: true, index: true },
    moduleKind: {
      type: String,
      enum: ModuleKinds as unknown as string[],
      required: true,
    },
    credits: { type: Number },
    term: { type: String, enum: Terms as unknown as string[] },
  },
  { timestamps: true, versionKey: false, collection: 'modules' },
);

ModuleSchema.index({ title: 'text', description: 'text', tags: 1 });

export const Module = models.Module || model<IModule>('Module', ModuleSchema);
