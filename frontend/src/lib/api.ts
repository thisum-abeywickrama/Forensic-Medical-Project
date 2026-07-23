const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function toCamel(s: string): string {
  return s.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase()
      .replace('-', '')
      .replace('_', '');
  });
}

function isObject(o: any): boolean {
  return o === Object(o) && !Array.isArray(o) && typeof o !== 'function';
}

export function keysToCamel(o: any): any {
  if (isObject(o)) {
    const n: Record<string, any> = {};
    Object.keys(o).forEach((k) => {
      n[toCamel(k)] = keysToCamel(o[k]);
    });
    return n;
  } else if (Array.isArray(o)) {
    return o.map((i) => {
      return keysToCamel(i);
    });
  }
  return o;
}

/** Error carrying the HTTP status and parsed body so callers can branch on them. */
export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const method = options.method || 'GET';

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch (err) {
    // A network-level failure: server down, wrong API URL, CORS, offline.
    // fetch() gives a near-useless "Failed to fetch", so log the target too.
    console.error(`Network error on ${method} ${API_BASE_URL}${path}:`, err);
    throw new ApiError(
      `Cannot reach the server at ${API_BASE_URL}. Check that the backend is running.`,
      0,
      {}
    );
  }

  if (!response.ok) {
    // Read as text first: an error body is not always JSON (a proxy or crash can
    // return HTML), and json() would discard the only useful diagnostic.
    const raw = await response.text().catch(() => '');
    let errData: any = {};
    try {
      errData = raw ? JSON.parse(raw) : {};
    } catch {
      errData = {};
    }

    console.error(
      `API error ${response.status} on ${method} ${path}:`,
      errData.message || raw || response.statusText
    );

    throw new ApiError(
      errData.message || `Request failed with status ${response.status}`,
      response.status,
      keysToCamel(errData)
    );
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();
  return keysToCamel(data);
}

/** Persist the session returned by /login or /verify-email. */
function storeSession(res: any) {
  if (res && res.token) {
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
  }
  return res;
}

export const api = {
  auth: {
    login: async (credentials: any) => {
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      return storeSession(res);
    },
    verifyEmail: async (payload: { email: string; code: string }) => {
      const res = await request('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return storeSession(res);
    },
    resendVerification: async (email: string) => {
      return request('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },
    forgotPassword: async (email: string) => {
      return request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },
    resetPassword: async (payload: { email: string; code: string; newPassword: string }) => {
      return request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    register: async (userData: any) => {
      return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },
    getUsers: async () => {
      return request('/auth/users');
    },
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },
  patients: {
    getAll: async () => {
      return request('/patients');
    },
    create: async (patientData: any) => {
      return request('/patients', {
        method: 'POST',
        body: JSON.stringify(patientData),
      });
    }
  },
  mlef: {
    getAll: async () => {
      return request('/mlef');
    },
    getById: async (id: string) => {
      return request(`/mlef/${id}`);
    },
    save: async (formData: any) => {
      return request('/mlef', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
    }
  },
  mlr: {
    getAll: async () => {
      return request('/mlr');
    },
    getById: async (id: string) => {
      return request(`/mlr/${id}`);
    },
    save: async (reportData: any) => {
      return request('/mlr', {
        method: 'POST',
        body: JSON.stringify(reportData),
      });
    }
  },
  pmr: {
    getAll: async () => {
      return request('/pmr');
    },
    getById: async (id: string) => {
      return request(`/pmr/${id}`);
    },
    save: async (reportData: any) => {
      return request('/pmr', {
        method: 'POST',
        body: JSON.stringify(reportData),
      });
    }
  },
  autopsy: {
    getAll: async () => {
      return request('/autopsy');
    },
    getById: async (id: string) => {
      return request(`/autopsy/${id}`);
    },
    save: async (formData: any) => {
      return request('/autopsy', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
    }
  },
  lab: {
    getAll: async () => {
      return request('/lab');
    },
    getById: async (id: string) => {
      return request(`/lab/${id}`);
    },
    create: async (requestData: any) => {
      return request('/lab', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });
    },
    update: async (id: string, updateData: any) => {
      return request(`/lab/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
    }
  },
  storage: {
    uploadImage: async (file: File): Promise<string> => {
      const SUPABASE_URL = 'https://fbhptjotfpxxqqtlzqzz.supabase.co';
      const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiaHB0am90ZnB4eHFxdGx6cXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMzEyMjIsImV4cCI6MjA5NzgwNzIyMn0.-zssqbgvrTH1jqyXOFn3lwpZ1Xja7YRaBQHNSG1NdXI';

      const lastDot = file.name.lastIndexOf('.');
      const ext = lastDot !== -1 ? file.name.substring(lastDot) : '';
      const baseName = lastDot !== -1 ? file.name.substring(0, lastDot) : file.name;
      const cleanBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${cleanBaseName}+${Date.now()}${ext}`;

      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/images/profile-pictures/${filename}`;

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Supabase upload error:', errText);
        let message = response.statusText;
        try {
          const parsed = JSON.parse(errText);
          message = parsed.message || parsed.error || errText;
        } catch (_) {
          message = errText || response.statusText;
        }
        throw new Error(`Failed to upload image to storage: ${message}`);
      }

      return `${SUPABASE_URL}/storage/v1/object/public/images/profile-pictures/${filename}`;
    },
    uploadFormPdf: async (file: File, formType: string): Promise<string> => {
      const SUPABASE_URL = 'https://fbhptjotfpxxqqtlzqzz.supabase.co';
      const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiaHB0am90ZnB4eHFxdGx6cXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMzEyMjIsImV4cCI6MjA5NzgwNzIyMn0.-zssqbgvrTH1jqyXOFn3lwpZ1Xja7YRaBQHNSG1NdXI';

      const lastDot = file.name.lastIndexOf('.');
      const ext = lastDot !== -1 ? file.name.substring(lastDot) : '.pdf';
      const baseName = lastDot !== -1 ? file.name.substring(0, lastDot) : file.name;
      const cleanBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${cleanBaseName}_${Date.now()}${ext}`;

      const cleanFormType = formType.toLowerCase().trim();
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/images/forms/${cleanFormType}/${filename}`;

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': file.type || 'application/pdf',
        },
        body: file,
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Supabase form PDF upload error:', errText);
        let message = response.statusText;
        try {
          const parsed = JSON.parse(errText);
          message = parsed.message || parsed.error || errText;
        } catch (_) {
          message = errText || response.statusText;
        }
        throw new Error(`Failed to upload PDF copy to storage: ${message}`);
      }

      return `${SUPABASE_URL}/storage/v1/object/public/images/forms/${cleanFormType}/${filename}`;
    }
  }
};
