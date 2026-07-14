const API_BASE_URL = 'http://localhost:5000';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
  async register(email: string, password: string) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    localStorage.setItem('token', data.accessToken);
    return data;
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('token', data.accessToken);
    return data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
  },

  async createUrl(longUrl: string, customAlias?: string, expiresAt?: string | null) {
    const res = await fetch(`${API_BASE_URL}/urls`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ longUrl, customAlias, expiresAt }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(Array.isArray(data.error) ? data.error[0].message : data.error || 'Failed to create short URL');
    return data;
  },

  async listUrls(params: { search?: string; sortBy?: string; sortOrder?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const res = await fetch(`${API_BASE_URL}/urls?${query.toString()}`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch short URLs');
    return data;
  },

  async updateUrl(id: string, params: { longUrl?: string; isEnabled?: boolean; expiresAt?: string | null }) {
    const res = await fetch(`${API_BASE_URL}/urls/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update short URL');
    return data;
  },

  async deleteUrl(id: string) {
    const res = await fetch(`${API_BASE_URL}/urls/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete URL');
    return data;
  },

  async getDashboardStats() {
    const res = await fetch(`${API_BASE_URL}/analytics/dashboard`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch dashboard stats');
    return data;
  },

  async getUrlAnalytics(shortUrlId: string) {
    const res = await fetch(`${API_BASE_URL}/analytics/${shortUrlId}`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch URL analytics');
    return data;
  },

  async verifyEmail(token: string) {
    const res = await fetch(`${API_BASE_URL}/auth/verify?token=${token}`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Email verification failed');
    return data;
  },

  async forgotPassword(email: string) {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Forgot password request failed');
    return data;
  },

  async resetPassword(token: string, newPassword: string) {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ token, password: newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Password reset failed');
    return data;
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Change password failed');
    return data;
  },

  async getProfile() {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch profile');
    return data;
  },

  async updateProfile(params: { avatarUrl?: string }) {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update profile');
    return data;
  },

  async getAdminStats() {
    const res = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch admin stats');
    return data;
  },

  async listAdminUsers() {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to list admin users');
    return data;
  },

  async deleteAdminUser(id: string) {
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete user');
    return data;
  },
};
