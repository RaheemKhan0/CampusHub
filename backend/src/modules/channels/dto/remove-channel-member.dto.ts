import { IsString } from 'class-validator';

export class RemoveChannelMemberDto {
  @IsString()
  userId!: string; // BA user id to revoke
}
