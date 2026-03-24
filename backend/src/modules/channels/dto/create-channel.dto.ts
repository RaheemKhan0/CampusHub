// src/modules/channels/dto/create-channel.dto.ts
import {
  IsString,
  Length,
  IsIn,
  IsOptional,
  IsInt,
  Min,
  IsArray,
  ArrayUnique,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ChannelTypes } from 'src/database/types';
import { PRIVACY } from 'src/database/types';

export type ChannelPrivacy = (typeof PRIVACY)[number];

export class CreateChannelDto {
  @IsString()
  @Length(1, 32)
  name!: string;

  @IsString()
  @IsIn(ChannelTypes as unknown as string[])
  type!: (typeof ChannelTypes)[number];

  @IsString()
  @IsIn(PRIVACY as unknown as string[])
  privacy!: ChannelPrivacy;

  // optional: where to place it in the server’s ordering
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  position?: number;

  /**
   * Optional seed access list for *hidden* channels.
   * BA user IDs (strings), not ObjectIds.
   */
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  memberIds?: string[];
}
