import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { Degree, IDegree } from 'src/database/schemas/degree.schema';
import { ListServersQueryDto } from 'src/modules/server/dto/list-server.query.dto';

@Injectable()
export class DegreeSlugPipe implements PipeTransform {
  async transform(value: ListServersQueryDto) {
    console.log('[Degree Slug Pipe ] query : ', value);
    if (!value?.degreeSlug || value.degreeId) {
      return value;
    }
    const degree = await Degree.findOne({ slug: value.degreeSlug })
      .select('_id')
      .lean<IDegree>()
      .exec();
    if (!degree) throw new BadRequestException('Degree not found');
    return { ...value, degreeId: degree?._id };
  }
}
