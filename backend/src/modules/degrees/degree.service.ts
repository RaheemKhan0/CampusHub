import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { Degree, type IDegree } from 'src/database/schemas/degree.schema';
import {
  DegreeModule as DegreeModuleModel,
  type IDegreeModule,
} from 'src/database/schemas/degree-module.schema';
import { type IModule } from 'src/database/schemas/module.schema';
import { DegreeViewDto } from './dto/degree-view.dto';
import { DegreeDetailDto } from './dto/degree-detail.dto';
import { DegreeModuleViewDto } from './dto/degree-module-view.dto';

type DegreeModulePopulated = IDegreeModule & {
  moduleId: (IModule & { _id: Types.ObjectId }) | Types.ObjectId;
};

@Injectable()
export class DegreeService {
  async listDegrees(): Promise<DegreeViewDto[]> {
    const degrees = await Degree.find()
      .sort({ name: 1 })
      .lean<IDegree[]>()
      .exec();

    return degrees.map((item) => this.toDegreeView(item));
  }

  async getDegreeBySlug(slug: string): Promise<DegreeDetailDto> {
    const degree = await Degree.findOne({ slug }).lean<IDegree | null>().exec();
    if (!degree) {
      throw new NotFoundException('Degree not found');
    }

    const modules = await DegreeModuleModel.find({ degreeId: degree._id })
      .populate<{ moduleId: IModule | null }>('moduleId')
      .sort({ year: 1, order: 1, createdAt: 1, _id: 1 })
      .lean<DegreeModulePopulated[]>()
      .exec();

    const moduleViews = modules
      .map((item) => this.toDegreeModuleView(item))
      .filter((item): item is DegreeModuleViewDto => item !== null);

    return {
      ...this.toDegreeView(degree),
      modules: moduleViews,
    };
  }

  async listDegreeModules(slug: string): Promise<DegreeModuleViewDto[]> {
    const degree = await Degree.findOne({ slug }).lean<IDegree | null>().exec();
    if (!degree) {
      throw new NotFoundException('Degree not found');
    }

    const modules = await DegreeModuleModel.find({ degreeId: degree._id })
      .populate<{ moduleId: IModule | null }>('moduleId')
      .sort({ year: 1, order: 1, createdAt: 1, _id: 1 })
      .lean<DegreeModulePopulated[]>()
      .exec();

    return modules
      .map((item) => this.toDegreeModuleView(item))
      .filter((item): item is DegreeModuleViewDto => item !== null);
  }

  private toDegreeView(doc: IDegree): DegreeViewDto {
    return {
      id: String(doc._id),
      slug: doc.slug,
      name: doc.name,
      durationYears: doc.durationYears,
      type: doc.type,
    };
  }

  private toDegreeModuleView(
    doc: DegreeModulePopulated,
  ): DegreeModuleViewDto | null {
    const moduleDoc =
      doc.moduleId && typeof doc.moduleId === 'object' && '_id' in doc.moduleId
        ? (doc.moduleId as IModule & { _id: Types.ObjectId })
        : null;

    if (!moduleDoc) {
      return null;
    }

    return {
      id: String(doc._id),
      moduleId: String(moduleDoc._id),
      title: moduleDoc.title,
      kind: doc.kind,
      term: doc.term,
      year: doc.year,
      description: moduleDoc.description ?? undefined,
      credits: moduleDoc.credits ?? undefined,
    };
  }
}
