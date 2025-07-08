export interface Contact {
  _id?: string;
  name: string;
  phone: string;
  address: string;
  notes?: string;
  isEditing?: boolean;
  isLocked?: boolean;
  user?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ContactResponse {
  success: boolean;
  message: string;
  data?: Contact | Contact[];
  totalCount?: number;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalContacts: number;
    contactsPerPage: number;
  };
}

export interface ContactListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} 