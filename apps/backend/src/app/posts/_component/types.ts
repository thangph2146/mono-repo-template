export type TaxonomyOption = {
  id: string;
  name: string;
};

export type CategoryTreeOption = TaxonomyOption & {
  parentId?: string | null;
  sortOrder?: number;
  subRows?: CategoryTreeOption[];
};

export type PostListRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  image: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
  categories: TaxonomyOption[];
  tags: TaxonomyOption[];
};

export type PostConfirmAction =
  | { kind: "delete"; row: PostListRow }
  | { kind: "restore"; row: PostListRow }
  | { kind: "purge"; row: PostListRow };

export type PostDetail = PostListRow & {
  content: unknown;
};

export type PagedResult<T> = { items: T[]; total: number };
export type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  error?: string | null;
  data?: T;
};
export type PagedApiShape<T> = {
  data: T[];
  pagination?: { total?: number };
};

export type FormState = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  image: string;
  content: unknown;
  published: boolean;
  publishedAt: string;
  categoryIds: string[];
  tagIds: string[];
};

export type EditorTextNodeShape = {
  detail: number;
  format: number;
  mode: "normal";
  style: string;
  text: string;
  type: "text";
  version: 1;
};

export type EditorParagraphNodeShape = {
  children: EditorTextNodeShape[];
  direction: null;
  format: string;
  indent: number;
  textFormat: number;
  textStyle: string;
  type: "paragraph";
  version: 1;
};

export type EditorStateShape = {
  root: {
    children: EditorParagraphNodeShape[];
    direction: null;
    format: string;
    indent: number;
    type: "root";
    version: 1;
  };
};
