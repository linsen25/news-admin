import type { AuthUser, PermissionKey } from '~/types/auth';
import type { components } from '~/types/generated/api';

type LoginResponse = components['schemas']['LoginResponseDto'];

const toAuthUser = (user: LoginResponse['user']): AuthUser => ({
  id: user.id,
  name: user.username,
  email: user.email,
  roles: user.roles.map((role) => ({
    id: role.id,
    name: role.name as AuthUser['roles'][number]['name'],
  })),
  permissions: user.permissions.map(
    (permission) => permission.key as PermissionKey,
  ),
});

export const useAuth = () => {
  const config = useRuntimeConfig();
  const userCookie = useCookie<AuthUser | null>('auth-user', {
    sameSite: 'lax',
  });
  const user = useState<AuthUser | null>(
    'auth-user-state',
    () => userCookie.value ?? null,
  );
  const accessToken = useCookie<string | null>('access-token', {
    sameSite: 'lax',
  });

  if (!user.value && userCookie.value) user.value = userCookie.value;

  const login = async (email: string, password: string) => {
    const response = await $fetch<LoginResponse>(
      `${config.public.apiBase}/auth/login`,
      { method: 'POST', body: { email, password } },
    );
    const authenticatedUser = toAuthUser(response.user);
    accessToken.value = response.accessToken;
    user.value = authenticatedUser;
    userCookie.value = authenticatedUser;
  };

  const authHeaders = () => ({
    Authorization: `Bearer ${accessToken.value ?? ''}`,
  });

  const hasPermission = (permission: PermissionKey) =>
    user.value?.permissions.includes(permission) ?? false;

  const logout = async () => {
    user.value = null;
    userCookie.value = null;
    accessToken.value = null;
    await navigateTo('/login');
  };

  return {
    user,
    session: accessToken,
    accessToken,
    authHeaders,
    login,
    logout,
    hasPermission,
  };
};
