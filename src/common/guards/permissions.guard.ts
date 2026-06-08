import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permissions are required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Allow users to view or update their own user profile/details
    const { method, params } = request;
    if (
      user &&
      params.id &&
      params.id === user.userId &&
      (method === 'GET' || method === 'PUT' || method === 'PATCH')
    ) {
      return true;
    }

    // Check if user exists and has permissions
    if (!user || !user.permissions) {
      return false;
    }

    // Check if user has any of the required permissions
    return requiredPermissions.some((permission) =>
      user.permissions.includes(permission),
    );
  }
}
