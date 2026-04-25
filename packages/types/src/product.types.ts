export enum ProductCategory {
  NOTES = 'NOTES',
  TEXTBOOKS = 'TEXTBOOKS',
  ELECTRONICS = 'ELECTRONICS',
  STATIONERY = 'STATIONERY',
  OTHER = 'OTHER',
}

export enum ProductCondition {
  NEW = 'NEW',
  LIKE_NEW = 'LIKE_NEW',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  SOLD = 'SOLD',
  INACTIVE = 'INACTIVE',
  PENDING_REVIEW = 'PENDING_REVIEW',
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: ProductCategory;
  condition: ProductCondition;
  status: ProductStatus;
  images: string[];             // array of image URLs (S3/Cloudinary)
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  college?: string;             // listing targeted to specific college
  subject?: string;             // e.g. "Data Structures", "Physics"
  semester?: number;            // 1-8
  tags: string[];
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductInput {
  title: string;
  description: string;
  price: number;
  category: ProductCategory;
  condition: ProductCondition;
  images: string[];
  college?: string;
  subject?: string;
  semester?: number;
  tags?: string[];
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  status?: ProductStatus;
}

export interface ProductFilters {
  category?: ProductCategory;
  condition?: ProductCondition;
  minPrice?: number;
  maxPrice?: number;
  college?: string;
  subject?: string;
  semester?: number;
  search?: string;
  sellerId?: string;
  status?: ProductStatus;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
