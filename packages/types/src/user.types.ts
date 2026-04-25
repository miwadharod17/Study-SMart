export enum Role {
  STUDENT = 'STUDENT',
  VENDOR = 'VENDOR',
  ADMIN = 'ADMIN',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string;
  collegeId?: string;           // college roll number / ID
  college?: string;
  isEmailVerified: boolean;
  verificationStatus: VerificationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vendor extends User {
  role: Role.VENDOR;
  businessName: string;
  businessDescription?: string;
  contactPhone?: string;
  isCollegeVerified: boolean;   // verified by admin as campus vendor
  totalSales: number;
  rating: number;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: Role.STUDENT | Role.VENDOR;
  collegeId?: string;
  college?: string;
  businessName?: string;        // required for VENDOR
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  accessToken: string;
  refreshToken: string;
}
