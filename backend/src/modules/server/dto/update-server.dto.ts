import { CreateServerDto } from './create-server.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateServerDto extends PartialType(CreateServerDto) {}
