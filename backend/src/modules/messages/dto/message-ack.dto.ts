import { ApiProperty } from '@nestjs/swagger';
import { MessageViewDto } from './message-view.dto';

export class MessageAckDto {
  @ApiProperty({
    description: 'Message sent confirmation',
  })
  success!: boolean;
  @ApiProperty({
    description: 'The Message itself',
  })
  message?: MessageViewDto;
  @ApiProperty({
    description: 'the error if it occured',
  })
  error?: { code?: string; message: string };
}
