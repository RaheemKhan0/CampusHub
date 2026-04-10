import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseGuards,
  Param,
  Query,
} from '@nestjs/common';
import { ServerRolesGuard } from 'src/lib/guards/server-role.guard';
import { ServerService } from './server.service';
import { CreateServerDto } from './dto/create-server.dto';
import { type UserSession, Session } from '@thallesp/nestjs-better-auth';
import { ServerRole } from 'src/lib/decorators/server-roles.decorator';
import { UpdateServerDto } from './dto/update-server.dto';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { ServerViewDto } from './dto/server-view.dto';
import { ListServersQueryDto } from './dto/list-server.query.dto';
import { ServerListResponseDto } from './dto/server-list.dto';
import { AddOwnerDto } from './dto/add-owner.dto';
import { DegreeSlugPipe } from 'src/lib/pipes/DegreeSlugPipe';

@ApiTags('servers')
@Controller('servers')
export class ServerController {
  constructor(private readonly servers: ServerService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new Server',
    description: 'Creates a new Server and returns its public view',
  })
  @ApiCreatedResponse({
    type: ServerViewDto,
    description: 'The created Server',
  })
  async createServer(
    @Session() session: UserSession,
    @Body() dto: CreateServerDto,
  ) {
    const server = await this.servers.create(session.user.id, dto);
    return server;
  }

  @Get()
  @ApiOperation({
    summary: 'lists all the servers in a particular type',
  })
  @ApiOkResponse({
    type: ServerListResponseDto,
    description: 'Paginated list of servers',
  })
  async listServer(
    @Query(new DegreeSlugPipe()) query: ListServersQueryDto,
  ): Promise<ServerListResponseDto> {
    return this.servers.list(query);
  }

  @Get(':serverId')
  @ApiOperation({ summary: 'Retrieve a server by id' })
  @ApiParam({ name: 'serverId', type: String })
  @ApiOkResponse({
    type: ServerViewDto,
    description: 'The requested Server',
  })
  async getServer(
    @Session() session: UserSession,
    @Param('serverId') serverId: string,
  ) {
    const server = await this.servers.findById(serverId, session.user.id);
    return server;
  }

  @Patch(':serverId')
  @ApiOperation({
    summary: 'updating an existing Server',
    description: 'This updates the existing Server and return its public view',
  })
  @ApiOkResponse({
    type: ServerViewDto,
    description: 'The updated Server',
  })
  @UseGuards(ServerRolesGuard)
  @ServerRole('owner', 'admin')
  async update(
    @Session() session: UserSession,
    @Param('serverId') serverId: string,
    @Body() dto: UpdateServerDto,
  ) {
    const server = await this.servers.update(serverId, session.user.id, dto);
    return server;
  }

  @Post(':serverId/owners')
  @ApiOperation({ summary: 'Add an owner to a server by email' })
  @ApiParam({ name: 'serverId', type: String })
  @ApiOkResponse({ description: 'Owner added successfully' })
  @UseGuards(ServerRolesGuard)
  @ServerRole('owner')
  async addOwner(
    @Param('serverId') serverId: string,
    @Body() dto: AddOwnerDto,
  ) {
    return this.servers.addOwner(serverId, dto.email);
  }

  @Delete(':serverId/owners/:userId')
  @ApiOperation({ summary: 'Remove an owner from a server' })
  @ApiParam({ name: 'serverId', type: String })
  @ApiParam({ name: 'userId', type: String })
  @ApiOkResponse({ description: 'Owner removed successfully' })
  @UseGuards(ServerRolesGuard)
  @ServerRole('owner')
  async removeOwner(
    @Session() session: UserSession,
    @Param('serverId') serverId: string,
    @Param('userId') userId: string,
  ) {
    return this.servers.removeOwner(serverId, userId, session.user.id);
  }

  @Get(':serverId/me')
  @ApiOperation({ summary: 'Get the current user membership roles for a server' })
  @ApiParam({ name: 'serverId', type: String })
  @ApiOkResponse({ description: 'Returns the roles array for the current user in this server' })
  async myRoles(
    @Session() session: UserSession,
    @Param('serverId') serverId: string,
  ) {
    return this.servers.myRoles(serverId, session.user.id);
  }
}
