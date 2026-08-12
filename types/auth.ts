export type PermissionKey =
  | 'articles.view.own'
  | 'articles.create'
  | 'articles.edit.own'
  | 'articles.save.draft'
  | 'articles.submit'
  | 'articles.review.view'
  | 'articles.review.decide'
  | 'articles.publish'
  | 'articles.withdraw'
  | 'homepage.view'
  | 'homepage.manage'
  | 'media.view'
  | 'media.upload'
  | 'media.delete'
  | 'users.view'
  | 'users.permissions.manage';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roles: Array<{ id: string; name: 'Author' | 'Reviewer' | 'Admin' }>;
  permissions: PermissionKey[];
}
