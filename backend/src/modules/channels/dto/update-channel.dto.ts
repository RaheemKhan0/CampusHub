import { PartialType } from '@nestjs/mapped-types';
import { CreateChannelDto } from './create-channel.dto';
import { IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateChannelDto extends PartialType(CreateChannelDto) {
  // If you want to forbid changing `type` for non-super users, enforce in the service/guard.

  // (Optional) allow privacy change explicitly:
  @IsOptional()
  @IsString()
  @IsIn(['public', 'hidden'])
  privacy?: 'public' | 'hidden';
}
