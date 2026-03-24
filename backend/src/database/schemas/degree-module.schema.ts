// src/database/schemas/degree-module.schema.ts
import { Schema, model, models, Document, Types } from 'mongoose';
import { ModuleKind, ModuleKinds, Term, Terms } from '../types';

export interface IDegreeModule extends Document {
  degreeId: Types.ObjectId;
  moduleId: Types.ObjectId;
  year: number; // 1, 2, 3 (for UG)
  kind: ModuleKind; // 'core' | 'elective'
  term?: Term;
  createdAt: Date;
  updatedAt: Date;
}

const DegreeModuleSchema = new Schema<IDegreeModule>(
  {
    degreeId: {
      type: Schema.Types.ObjectId,
      ref: 'Degree',
      required: true,
      index: true,
    },
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
      index: true,
    },
    year: { type: Number, required: true, min: 1, max: 6 },
    kind: {
      type: String,
      enum: ModuleKinds as unknown as string[],
      required: true,
      default: 'core',
    },
    term: { type: String, enum: Terms as unknown as string[] },
  },
  { timestamps: true, versionKey: false, collection: 'degree_modules' },
);

// uniqueness: a module should not be added twice to the SAME degree+year
DegreeModuleSchema.index(
  { degreeId: 1, year: 1, moduleId: 1 },
  { unique: true },
);
// fast grouping by year
DegreeModuleSchema.index({ degreeId: 1, year: 1, kind: 1, order: 1 });

export const DegreeModule =
  models.DegreeModule ||
  model<IDegreeModule>('DegreeModule', DegreeModuleSchema);
