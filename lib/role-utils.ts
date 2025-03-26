/**
 * Converts a comma-separated string to an array of strings
 */
export function stringToArray(str: string | null): string[] {
  if (!str) return []
  return str.split(",").filter(Boolean)
}

/**
 * Converts an array of strings to a comma-separated string
 */
export function arrayToString(arr: string[]): string {
  if (!arr || !Array.isArray(arr)) return ""
  return arr.join(",")
}

/**
 * Checks if a user has a specific role
 */
export function hasRole(roleString: string | null, role: string): boolean {
  const roles = stringToArray(roleString)
  return roles.includes(role)
}

/**
 * Checks if a user has any of the specified roles
 */
export function hasAnyRole(roleString: string | null, roles: string[]): boolean {
  const userRoles = stringToArray(roleString)
  return roles.some((role) => userRoles.includes(role))
}

/**
 * Checks if a role has a specific permission
 */
export function hasPermission(permissionString: string | null, permission: string): boolean {
  const permissions = stringToArray(permissionString)
  return permissions.includes(permission)
}

/**
 * Checks if a role has any of the specified permissions
 */
export function hasAnyPermission(permissionString: string | null, permissions: string[]): boolean {
  const rolePermissions = stringToArray(permissionString)
  return permissions.some((permission) => rolePermissions.includes(permission))
}

