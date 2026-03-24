import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateAttachmentDto {
  @ApiProperty({
    description: 'Public URL pointing to stored attachment',
    example: 'https://cdn.example.com/uploads/file.pdf',
  })
  @IsString()
  @IsNotEmpty()
  url!: string;

  @ApiPropertyOptional({
    description: 'Original filename if provided',
    example: 'lecture-notes.pdf',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Mime type of the attachment',
    example: 'application/pdf',
  })
  @IsOptional()
  @IsString()
  mime?: string;

  @ApiPropertyOptional({
    description: 'File size in bytes',
    example: 1048576,
  })
  @IsOptional()
  size?: number;
}

class CreateMentionDto {
  @ApiProperty({
    description: 'Identifier of the mentioned user (BetterAuth user id)',
    example: 'usr_01hxt8zshm8yc6a5n8s6k1qj3r',
  })
  @IsString()
  @IsNotEmpty()
  userId!: string;
}

export class CreateMessageDto {
  @ApiProperty({
    description: 'Target channel identifier',
    example: '6710a4f2f23a5a2c5f6f8a1b',
  })
  @IsString()
  @IsNotEmpty()
  channelId!: string;

  @ApiProperty({
    description: 'Message Markdown/text content',
    maxLength: 4000,
    example: "Remember to review the lecture slides before Friday's quiz.",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content!: string;

  @ApiPropertyOptional({
    description: 'Name of the author (defaults to session user name)',
    maxLength: 200,
    example: 'Aaliyah Khan',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  authorName?: string;

  @ApiPropertyOptional({
    description: 'List of attachments associated with this message',
    type: [CreateAttachmentDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAttachmentDto)
  attachments?: CreateAttachmentDto[];

  @ApiPropertyOptional({
    description: 'Users mentioned in the message content',
    type: [CreateMentionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMentionDto)
  mentions?: CreateMentionDto[];
}
