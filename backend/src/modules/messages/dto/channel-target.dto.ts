import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ChannelTargetDto {
  @ApiProperty({
    description: 'Server identifier',
    example: '670ffe9bd4e2f1d3c9a4b123',
  })
  @IsString()
  @IsNotEmpty()
  serverId!: string;

  @ApiProperty({
    description: 'Channel identifier',
    example: '6710a4f2f23a5a2c5f6f8a1b',
  })
  @IsString()
  @IsNotEmpty()
  channelId!: string;
}
