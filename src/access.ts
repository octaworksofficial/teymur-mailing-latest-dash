/**
 * @see https://umijs.org/docs/max/access#access
 * */
export default function access(
  initialState: { currentUser?: API.CurrentUser } | undefined,
) {
  const { currentUser } = initialState ?? {};

  // Debug için role bilgisini logla
  if (currentUser) {
    console.log(
      'Current user role:',
      currentUser.role,
      'Access:',
      currentUser.access,
    );
  }

  return {
    canAdmin: currentUser && currentUser.access === 'admin',
    // Super Admin: Sadece super_admin rolü
    canSuperAdmin: currentUser && currentUser.role === 'super_admin',
    // Org Admin: Sadece org_admin rolü (super admin için /admin menüsü yeterli)
    canOrgAdmin: currentUser && currentUser.role === 'org_admin',
    // Yönetici: super_admin veya org_admin
    canManage:
      currentUser &&
      (currentUser.role === 'super_admin' || currentUser.role === 'org_admin'),
    // Super admin olmayan kullanıcılar (normal menüler için)
    canNotSuperAdmin: currentUser && currentUser.role !== 'super_admin',
  };
}
