// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    message: string;
    details?: Record<string, string[]>;
  };
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string;
  headers?: Record<string, string>;
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, token, headers = {} } = options;

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const config: RequestInit = {
    method,
    headers: {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    credentials: 'include',
  };

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  if (body && method !== 'GET') {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || { message: data.message || 'An error occurred' },
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: { message: error instanceof Error ? error.message : 'Network error' },
    };
  }
}

export const API = {
  post: <T = unknown>(endpoint: string, body: unknown, token?: string) =>
    apiRequest<T>(endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`, {
      method: 'POST',
      body,
      token,
    }),
};

// File upload helper for photos
export async function uploadPhotos(
  listingId: number,
  files: File[],
  token: string
): Promise<ApiResponse> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('photos', file);
  });

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/listings/${listingId}/photos`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || { message: data.message || 'Upload failed' },
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: { message: error instanceof Error ? error.message : 'Network error' },
    };
  }
}

// Auth endpoints
export const authApi = {
  register: (data: { full_name: string; phone: string; bio: string; email: string; password: string; role: string }) =>
    apiRequest('/api/auth/register', { method: 'POST', body: data }),

  login: (data: { email: string; password: string }) =>
    apiRequest('/api/auth/login', { method: 'POST', body: data }),

  getMe: (token: string) =>
    apiRequest('/api/auth/me', { token }),

  updateProfile: (token: string, data: Record<string, unknown>) =>
    apiRequest('/api/auth/me', { method: 'PUT', token, body: data }),

  forgotPassword: (email: string) =>
    apiRequest('/api/auth/forgot-password', { method: 'POST', body: { email } }),

  resetPassword: (data: { email: string; resetToken: string; newPassword: string }) =>
    apiRequest('/api/auth/reset-password', { method: 'POST', body: data }),

  changePassword: (token: string, data: { currentPassword: string; newPassword: string }) =>
    apiRequest('/api/auth/change-password', { method: 'POST', token, body: data }),
};

// Listings endpoints
export const listingsApi = {
  browse: () =>
    apiRequest('/api/listings'),

  search: (token: string, params: Record<string, string | number>) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        query.append(key, String(value));
      }
    });
    return apiRequest(`/api/listings/search?${query.toString()}`, { token });
  },

  getById: (token: string, id: number) =>
    apiRequest(`/api/listings/${id}`, { token }),

  create: (token: string, data: Record<string, unknown> | FormData) =>
    apiRequest('/api/listings', { method: 'POST', token, body: data }),

  update: (token: string, id: number, data: Record<string, unknown> | FormData) =>
    apiRequest(`/api/listings/${id}`, { method: 'PATCH', token, body: data }),

  updateStatus: (token: string, id: number, status: string) =>
    apiRequest(`/api/listings/${id}/status`, { method: 'PATCH', token, body: { status } }),

  delete: (token: string, id: number) =>
    apiRequest(`/api/listings/${id}`, { method: 'DELETE', token }),

  getPhotos: (token: string, id: number) =>
    apiRequest(`/api/listings/${id}/photos`, { token }),

  deletePhoto: (token: string, photoId: number) =>
    apiRequest(`/api/listings/photos/${photoId}`, { method: 'DELETE', token }),

  contact: (token: string, id: number) =>
    apiRequest(`/api/listings/${id}/contact`, { method: 'POST', token }),

  getLandlordDashboard: (token: string) =>
    apiRequest('/api/listings/landlord-dashboard', { token }),

  getStudentDashboard: (token: string) =>
    apiRequest('/api/listings/student-dashboard', { token }),
};

export const amenitiesApi = {
  getAll: (token: string) =>
    apiRequest('/api/amenities', { token }),
  list: () => apiRequest('/api/amenities'),
};

// Reviews endpoints
export const reviewsApi = {
  create: (token: string, listingId: number, data: { rating: number; comment?: string }) =>
    apiRequest(`/api/listings/${listingId}/reviews`, { method: 'POST', token, body: data }),

  reply: (token: string, reviewId: number, reply: string) =>
    apiRequest(`/api/reviews/${reviewId}/reply`, { method: 'POST', token, body: { reply } }),
};

// Reports endpoints
export const reportsApi = {
  submit: (token: string, data: { target_type: string; target_id: number; reason: string }) =>
    apiRequest('/api/reports', { method: 'POST', token, body: data }),
};

// Rentals endpoints
export const rentalsApi = {
  create: (token: string, data: { student_id?: number; student_email?: string; listing_id: number; start_date: string; end_date?: string }) =>
    apiRequest('/api/rentals', { method: 'POST', token, body: data }),
  getLandlordRentals: (token: string) =>
    apiRequest('/api/rentals/landlord', { token }),
};


// Contacts endpoints
export const contactsApi = {
  getLandlordContacts: (token: string) =>
    apiRequest('/api/contacts/landlord', { token }),
};



// Admin endpoints
export const adminApi = {
  getStats: (token: string) =>
    apiRequest('/api/admin/stats', { token }),

  getRecentActivity: (token: string) =>
    apiRequest('/api/admin/activity', { token }),

  getUsers: (token: string) =>
    apiRequest('/api/admin/users', { token }),

  getMetrics: (token: string) =>
    apiRequest('/api/admin/metrics', { token }),

  suspendUser: (token: string, userId: number) =>
    apiRequest(`/api/admin/users/${userId}/suspend`, { method: 'PATCH', token }),

  deleteUser: (token: string, userId: number) =>
    apiRequest(`/api/admin/users/${userId}`, { method: 'DELETE', token }),

  getListings: (token: string) =>
    apiRequest('/api/admin/listings', { token }),

  getFlaggedListings: (token: string) =>
    apiRequest('/api/admin/listings', { token }),

  verifyListing: (token: string, listingId: number) =>
    apiRequest(`/api/admin/listings/${listingId}/verify`, { method: 'PATCH', token }),

  deleteListing: (token: string, listingId: number) =>
    apiRequest(`/api/admin/listings/${listingId}`, { method: 'DELETE', token }),

  getReports: (token: string) =>
    apiRequest('/api/reports', { token }),

  resolveReport: (token: string, reportId: number, status: 'resolved' | 'dismissed') =>
    apiRequest(`/api/reports/${reportId}/status`, { method: 'PATCH', token, body: { status } }),

  getAmenities: (token: string) =>
    apiRequest('/api/amenities', { token }),

  createAmenity: (token: string, name: string) =>
    apiRequest('/api/amenities', { method: 'POST', token, body: { name } }),

  deleteAmenity: (token: string, id: number) =>
    apiRequest(`/api/amenities/${id}`, { method: 'DELETE', token }),
};
