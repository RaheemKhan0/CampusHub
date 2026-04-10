import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { type FilterQuery, Types } from 'mongoose';
import slugify from 'slugify';

import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { ListServersQueryDto } from './dto/list-server.query.dto';
import { ServerListResponseDto } from './dto/server-list.dto';
import { ServerViewDto } from './dto/server-view.dto';
import type { IServer } from 'src/database/schemas/server.schema';
import { ServerModel } from 'src/database/schemas/server.schema';
import type { IMembership } from 'src/database/schemas/membership.schema';
import { Membership } from 'src/database/schemas/membership.schema';
import type { IUser } from 'src/database/schemas/user.schema';
import { AppUser } from 'src/database/schemas/user.schema';
import { DegreeModule } from 'src/database/schemas/degree-module.schema';

type MembershipRoles = Pick<IMembership, 'roles'>;

type UserSuperFlag = Pick<IUser, 'isSuper'>;

@Injectable()
export class ServerService {
  async create(
    ownerId: string | null,
    dto: CreateServerDto,
  ): Promise<ServerViewDto> {
    const slug = slugify(dto.name, { lower: true, strict: true });

    try {
      const server = await ServerModel.create({
        name: dto.name,
        slug,
        ownerId: ownerId ?? undefined,
        icon: dto.icon,
        type: dto.type,
        degreeId: dto.degreeId,
        degreeModuleId: dto.degreeModuleId,
      });
      const moduleYear = await this.getDegreeModuleYear(server.degreeModuleId);
      return this.toServerView(server, { moduleYear });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 11000 &&
        'keyPattern' in error &&
        typeof (error as { keyPattern?: Record<string, unknown> })
          .keyPattern === 'object' &&
        (error as { keyPattern?: Record<string, unknown> }).keyPattern?.slug
      ) {
        throw new ConflictException(
          'A server with this name/slug already exists.',
        );
      }
      throw error;
    }
  }

  async update(
    serverId: string,
    actorId: string,
    dto: UpdateServerDto,
  ): Promise<ServerViewDto> {
    const user = await AppUser.findOne({ userId: actorId })
      .select('isSuper')
      .lean<UserSuperFlag | null>();
    const isSuper = user?.isSuper ?? false;

    if (!isSuper) {
      const membership = await Membership.findOne({ serverId, userId: actorId })
        .select('roles')
        .lean<MembershipRoles | null>();
      const roles = membership?.roles ?? [];
      if (!roles.some((role) => role === 'owner' || role === 'admin')) {
        throw new ForbiddenException('Not allowed to edit this server');
      }
    }

    const server = await ServerModel.findByIdAndUpdate(serverId, dto, {
      new: true,
    }).lean<IServer | null>();

    if (!server) throw new NotFoundException('Server not found');
    const moduleYear = await this.getDegreeModuleYear(server.degreeModuleId);
    return this.toServerView(server, { moduleYear });
  }

  async findById(serverId: string, actorId: string): Promise<ServerViewDto> {
    const user = await AppUser.findOne({ userId: actorId })
      .select('isSuper')
      .lean<UserSuperFlag | null>();
    const isSuper = user?.isSuper ?? false;

    if (!isSuper) {
      const membership = await Membership.findOne({
        serverId,
        userId: actorId,
      })
        .select('_id')
        .lean<Pick<IMembership, '_id'> | null>();

      if (!membership) {
        throw new ForbiddenException('Not allowed to access this server');
      }
    }

    const server = await ServerModel.findById(serverId).lean<IServer | null>();
    if (!server) {
      throw new NotFoundException('Server not found');
    }

    const moduleYear = await this.getDegreeModuleYear(server.degreeModuleId);
    return this.toServerView(server, { moduleYear });
  }

  async remove(serverId: string, actorId: string) {
    const user = await AppUser.findOne({ userId: actorId })
      .select('isSuper')
      .lean<UserSuperFlag | null>();
    const isSuper = user?.isSuper ?? false;

    if (!isSuper) {
      const membership = await Membership.findOne({ serverId, userId: actorId })
        .select('roles')
        .lean<MembershipRoles | null>();
      const roles = membership?.roles ?? [];
      if (!roles.some((role) => role === 'owner')) {
        throw new ForbiddenException('Only owners can delete a server');
      }
    }

    await ServerModel.findByIdAndDelete(serverId).exec();
    await Membership.deleteMany({ serverId }).exec();
    return { ok: true } as const;
  }

  private async getDegreeModuleYear(
    degreeModuleId?: Types.ObjectId | string,
  ): Promise<number | undefined> {
    if (!degreeModuleId) return undefined;
    const module = await DegreeModule.findById(degreeModuleId)
      .select('year')
      .lean<{ year: number } | null>();
    return module?.year;
  }

  private toServerView(
    doc: IServer,
    extras?: { moduleYear?: number },
  ): ServerViewDto {
    const toIso = (value: Date | string | undefined): string =>
      new Date(value ?? Date.now()).toISOString();

    const view: ServerViewDto = {
      id: String(doc._id),
      name: doc.name,
      type: doc.type,
      slug: doc.slug,
      degreeId: String(doc.degreeId),
      degreeModuleId: String(doc.degreeModuleId),
      createdAt: toIso(doc.createdAt),
      updatedAt: toIso(doc.updatedAt),
    };

    if (doc.ownerId) {
      view.ownerId = doc.ownerId;
    }
    if (doc.icon) {
      view.icon = doc.icon;
    }
    if (doc.category) {
      view.category = doc.category;
    }
    if (extras?.moduleYear !== undefined) {
      view.moduleYear = extras.moduleYear;
    }

    return view;
  }

  async list({
    q,
    degreeSlug,
    degreeId,
    startYear,
    page,
    pageSize,
    type,
    paginated,
  }: ListServersQueryDto): Promise<ServerListResponseDto> {
    const resolvedDegreeId = degreeId;
    console.log('degree Slug : ', degreeSlug);
    console.log('start year : ', startYear);
    console.log('degree type : ', type);

    const filter: FilterQuery<IServer> = {};
    if (type) {
      filter.type = type;
    }
    if (resolvedDegreeId) filter.degreeId = resolvedDegreeId;

    if (type === 'unimodules') {
      if (!resolvedDegreeId) {
        throw new BadRequestException('degreeId is required for unimodules');
      }
      if (startYear === undefined) {
        throw new BadRequestException('startYear is required for unimodules');
      }

      const currentYear = new Date().getFullYear();
      if (startYear > currentYear) {
        throw new BadRequestException('startYear cannot be in the future');
      }

      const studentYear = currentYear - startYear + 1;
      if (studentYear < 1) {
        throw new BadRequestException('Invalid startYear supplied');
      }

      const modules = await DegreeModule.find({
        degreeId: resolvedDegreeId,
        year: { $lte: studentYear },
      })
        .select('_id')
        .lean();

      const degreeModuleIds = modules.map((item) => item._id);
      if (degreeModuleIds.length === 0) {
        return {
          items: [],
          total: 0,
          page,
          pageSize,
        };
      }

      filter.degreeModuleId = { $in: degreeModuleIds };
    }

    const baseFilter: FilterQuery<IServer> = { ...filter };
    let query = ServerModel.find(baseFilter);
    let countFilter: FilterQuery<IServer> = baseFilter;

    if (q && q.trim()) {
      const trimmed = q.trim();
      countFilter = { ...baseFilter, $text: { $search: trimmed } };
      query = ServerModel.find(countFilter)
        .select({ score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' }, createdAt: -1 });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    const skip = (page - 1) * pageSize;

    if (paginated) {
      const [docs, total] = await Promise.all([
        query.skip(skip).limit(pageSize).lean<IServer[]>().exec(),
        ServerModel.countDocuments(countFilter).exec(),
      ]);

      const moduleYearMap = await this.buildModuleYearMap(docs);
      const items = docs.map((item) =>
        this.toServerView(item, {
          moduleYear:
            moduleYearMap.get(String(item.degreeModuleId)) ?? undefined,
        }),
      );
      return {
        items,
        total,
        page,
        pageSize,
      };
    }

    const [docs, total] = await Promise.all([
      query.lean<IServer[]>().exec(),
      ServerModel.countDocuments(countFilter),
    ]);

    const moduleYearMap = await this.buildModuleYearMap(docs);
    const items = docs.map((item) =>
      this.toServerView(item, {
        moduleYear:
          moduleYearMap.get(String(item.degreeModuleId)) ?? undefined,
      }),
    );
    return {
      items,
      total,
    };
  }

  private async buildModuleYearMap(
    servers: IServer[],
  ): Promise<Map<string, number>> {
    const ids = servers
      .map((server) => server.degreeModuleId)
      .filter(Boolean)
      .map((id) => new Types.ObjectId(id));
    if (!ids.length) return new Map();
    const modules = await DegreeModule.find({ _id: { $in: ids } })
      .select('_id year')
      .lean<{ _id: Types.ObjectId; year: number }[]>();
    const map = new Map<string, number>();
    modules.forEach((mod) => {
      map.set(String(mod._id), mod.year);
    });
    return map;
  }

  async addOwner(serverId: string, email: string): Promise<{ ok: true }> {
    const server = await ServerModel.findById(serverId).lean<IServer | null>();
    if (!server) throw new NotFoundException('Server not found');

    const user = await AppUser.findOne({ email: email.toLowerCase() })
      .select('userId')
      .lean<Pick<IUser, 'userId'> | null>();
    if (!user) throw new NotFoundException(`No user found with email ${email}`);

    const existing = await Membership.findOne({
      serverId,
      userId: user.userId,
    }).lean<Pick<IMembership, 'roles'> | null>();

    if (existing) {
      if (existing.roles.includes('owner')) {
        throw new UnprocessableEntityException('User is already an owner of this server');
      }
      await Membership.updateOne(
        { serverId, userId: user.userId },
        { $addToSet: { roles: 'owner' } },
      );
    } else {
      await Membership.create({
        serverId,
        userId: user.userId,
        roles: ['owner'],
        status: 'active',
        joinedAt: new Date(),
      });
    }

    return { ok: true };
  }

  async removeOwner(serverId: string, targetUserId: string, actorId: string): Promise<{ ok: true }> {
    const server = await ServerModel.findById(serverId).lean<IServer | null>();
    if (!server) throw new NotFoundException('Server not found');

    // Prevent removing the last owner
    const ownerCount = await Membership.countDocuments({
      serverId,
      roles: 'owner',
      status: 'active',
    });
    if (ownerCount <= 1) {
      throw new UnprocessableEntityException('Cannot remove the last owner of a server');
    }

    const membership = await Membership.findOne({ serverId, userId: targetUserId }).lean<Pick<IMembership, 'roles'> | null>();
    if (!membership || !membership.roles.includes('owner')) {
      throw new NotFoundException('User is not an owner of this server');
    }

    await Membership.updateOne(
      { serverId, userId: targetUserId },
      { $pull: { roles: 'owner' } },
    );

    return { ok: true };
  }
}
