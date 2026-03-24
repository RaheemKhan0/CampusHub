import {
  Body,
  Controller,
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
}
