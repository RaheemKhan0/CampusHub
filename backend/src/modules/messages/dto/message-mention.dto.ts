import { ApiProperty } from '@nestjs/swagger';

export class MentionViewDto {
  @ApiProperty({
    description: 'Identifier of the mentioned user (BetterAuth user id)',
    example: 'usr_01hxt8zshm8yc6a5n8s6k1qj3r',
  })
  userId!: string;
}
