import type { components } from './generated/api';

export type ArticleDTO = components['schemas']['ArticleDto'];
export type ArticleStatus = ArticleDTO['status'];
export type TipTapDocument = components['schemas']['TipTapDocumentDto'];
export type TipTapNode = components['schemas']['TipTapNodeDto'];
export type CreateArticleDTO = components['schemas']['CreateArticleDto'];
export type ArticleHistoryDTO = components['schemas']['ArticleHistoryDto'];

export type ArticleInput = CreateArticleDTO & {
  byline: string;
  articleDate: string;
  summary: string;
  content: TipTapDocument;
  coverImage: string;
  coverFocalX: number;
  coverFocalY: number;
  isHeadline: boolean;
  homepagePriority: number;
  currentEditorId: string;
  tagIds: string[];
  status: ArticleStatus;
};

export type ArticleUpdateInput = Partial<ArticleInput> & {
  expectedUpdatedAt?: string;
};

export const emptyDocument = (): TipTapDocument => ({
  type: 'doc',
  content: [{ type: 'paragraph' }],
});
