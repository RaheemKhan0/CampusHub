import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsIn,
  Length,
  IsUrl,
  IsMongoId,
} from 'class-validator';
import { ServerTypes } from 'src/database/types';

export class CreateServerDto {
  @ApiProperty({
    example: 'Calisthenics',
    minLength: 2,
    maxLength: 60,
    description: 'We discuss calisthenics',
  })
  @IsString()
  @Length(2, 60)
  name!: string;

  @ApiProperty({
    enum: ServerTypes,
    enumName: 'ServerType',
    example: 'personal',
  })
  @IsString()
  @IsIn(ServerTypes as unknown as string[])
  type!: (typeof ServerTypes)[number];

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/icons/cs.png',
    description: 'PUBLIC HTTPS(S) URL to an icon',
  })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  icon?: string;

  @ApiProperty({
    description: 'Associated degree identifier',
  })
  @IsString()
  @IsMongoId()
  degreeId!: string;

  @ApiProperty({
    description: 'Associated degree-module identifier',
  })
  @IsString()
  @IsMongoId()
  degreeModuleId!: string;
}
