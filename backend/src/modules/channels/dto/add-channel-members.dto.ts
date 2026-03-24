import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, ArrayUnique, IsArray, IsString } from 'class-validator';

export class AddChannelMember {
  @ApiProperty({ description: 'better auth user id to add to channel' })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  userIds!: string[];

  @ApiProperty({
    description:
      'The channel Id the to add the user to if the channel is private',
  })
  @IsString()
  channelId!: string;
}
