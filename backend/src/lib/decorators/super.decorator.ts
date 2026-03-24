import { SetMetadata } from '@nestjs/common';
export const SUPER_KEY = 'requireSuper';
export const SuperOnly = () => SetMetadata(SUPER_KEY, true);
