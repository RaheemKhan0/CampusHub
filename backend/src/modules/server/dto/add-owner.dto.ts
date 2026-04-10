import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class AddOwnerDto {
  @ApiProperty({ example: 'student@city.ac.uk' })
  @IsEmail()
  email!: string;
}
