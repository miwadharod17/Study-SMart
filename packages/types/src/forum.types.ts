export enum PostCategory {
  ACADEMIC = 'ACADEMIC',
  CAREER = 'CAREER',
  CAMPUS_LIFE = 'CAMPUS_LIFE',
  ANNOUNCEMENTS = 'ANNOUNCEMENTS', // seniors/admin only
  STUDY_GROUP = 'STUDY_GROUP',
  GENERAL = 'GENERAL',
}

export enum PostStatus {
  PUBLISHED = 'PUBLISHED',
  DRAFT = 'DRAFT',
  REMOVED = 'REMOVED',          // removed by admin
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;              // rich text / markdown
  category: PostCategory;
  status: PostStatus;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: string;           // STUDENT / SENIOR etc shown in badge
  tags: string[];
  likeCount: number;
  commentCount: number;
  viewCount: number;
  isLikedByMe?: boolean;        // populated when authenticated
  isPinned: boolean;            // admins can pin posts
  college?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ForumComment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: string;
  likeCount: number;
  isLikedByMe?: boolean;
  parentCommentId?: string;     // for nested replies
  replies?: ForumComment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ForumTag {
  id: string;
  name: string;
  slug: string;
  postCount: number;
  color?: string;
}

export interface CreatePostInput {
  title: string;
  content: string;
  category: PostCategory;
  tags?: string[];
  college?: string;
}

export interface CreateCommentInput {
  postId: string;
  content: string;
  parentCommentId?: string;
}

export interface PostFilters {
  category?: PostCategory;
  tag?: string;
  search?: string;
  authorId?: string;
  college?: string;
  isPinned?: boolean;
}

export interface PostListResponse {
  posts: ForumPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
