import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { CreateMessageDto } from './message-create.dto';

export class SendMessageDto extends CreateMessageDto {
  @ApiProperty({
    description: 'Server identifier hosting the channel',
    example: '670ffe9bd4e2f1d3c9a4b123',
  })
  @IsString()
  @IsNotEmpty()
  serverId!: string;
}
