import { ApiProperty } from '@nestjs/swagger';

export class AttachmentViewDto {
  @ApiProperty({
    description: 'Public URL pointing to stored attachment',
    example: 'https://cdn.example.com/uploads/file.pdf',
  })
  url!: string;

  @ApiProperty({
    description: 'Original filename if provided',
    example: 'lecture-notes.pdf',
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: 'Mime type of the attachment',
    example: 'application/pdf',
    required: false,
  })
  mime?: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1048576,
    required: false,
  })
  size?: number;
}
