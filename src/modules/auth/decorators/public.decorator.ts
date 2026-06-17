import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark a route as public — bypasses the global JwtAuthGuard.
 * Use this on controller methods that should be accessible without authentication.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
