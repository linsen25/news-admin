export type PermissionKey =
  | 'articles.view.own'
  | 'articles.create'
  | 'articles.edit.own'
  | 'articles.save.draft'
  | 'articles.submit'
  | 'articles.review.view'
  | 'articles.review.decide'
  | 'articles.publish'
  | 'users.view'
  | 'users.permissions.manage';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roleId: 'role-author' | 'role-reviewer' | 'role-admin';
  roleName: 'Author' | 'Reviewer' | 'Admin';
  permissions: PermissionKey[];
}
