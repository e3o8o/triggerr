// ============================================================================
// AUTHENTICATION & AUTHORIZATION TYPES
// ============================================================================
// Type guards
export function isAuthenticatedUser(context) {
    return context.isAuthenticated && !!context.user;
}
export function hasPermission(context, permission) {
    return context.permissions.includes(permission);
}
export function hasRole(context, role) {
    return context.roles.includes(role);
}
//# sourceMappingURL=auth-types.js.map