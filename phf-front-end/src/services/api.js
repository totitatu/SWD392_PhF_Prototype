const API_BASE_URL = 'http://localhost:8080/api';

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
}

// User Management APIs (UC5-UC11)
export const userAPI = {
  list: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    return apiCall(`/users?${params.toString()}`);
  },
  search: (term) => apiCall(`/users/search?term=${encodeURIComponent(term)}`),
  getById: (id) => apiCall(`/users/${id}`),
  create: (data) => apiCall('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiCall(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deactivate: (id) => apiCall(`/users/${id}/deactivate`, { method: 'PUT' }),
};

// Supplier Management APIs (UC12-UC18)
export const supplierAPI = {
  list: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    return apiCall(`/suppliers?${params.toString()}`);
  },
  search: (term) => apiCall(`/suppliers/search?term=${encodeURIComponent(term)}`),
  getById: (id) => apiCall(`/suppliers/${id}`),
  create: (data) => apiCall('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiCall(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deactivate: (id) => apiCall(`/suppliers/${id}/deactivate`, { method: 'PUT' }),
};

// Product Management APIs (UC19-UC26)
export const productAPI = {
  list: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    return apiCall(`/products?${params.toString()}`);
  },
  search: (term) => apiCall(`/products/search?term=${encodeURIComponent(term)}`),
  getById: (id) => apiCall(`/products/${id}`),
  create: (data) => apiCall('/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiCall(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  editWithGemini: (id, userInput) => 
    apiCall(`/products/${id}/edit-with-gemini`, { 
      method: 'POST', 
      body: JSON.stringify({ userInput }) 
    }),
  deactivate: (id) => apiCall(`/products/${id}/deactivate`, { method: 'PUT' }),
};

// Purchase Order APIs (UC27-UC34)
export const purchaseOrderAPI = {
  list: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    return apiCall(`/purchase-orders?${params.toString()}`);
  },
  getById: (id) => apiCall(`/purchase-orders/${id}`),
  create: (data) => apiCall('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
  createWithGemini: (userInput) => 
    apiCall('/purchase-orders/create-with-gemini', { 
      method: 'POST', 
      body: JSON.stringify({ userInput }) 
    }),
  update: (id, data) => apiCall(`/purchase-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiCall(`/purchase-orders/${id}`, { method: 'DELETE' }),
  send: (id) => apiCall(`/purchase-orders/${id}/send`, { method: 'PUT' }),
};

// Inventory Management APIs (UC35-UC42)
export const inventoryAPI = {
  list: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    return apiCall(`/inventory?${params.toString()}`);
  },
  getById: (id) => apiCall(`/inventory/${id}`),
  create: (data) => apiCall('/inventory', { method: 'POST', body: JSON.stringify(data) }),
  createFromPurchaseOrder: (purchaseOrderId) => 
    apiCall(`/inventory/from-purchase-order/${purchaseOrderId}`, { method: 'POST' }),
  update: (id, data) => apiCall(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deactivate: (id) => apiCall(`/inventory/${id}/deactivate`, { method: 'PUT' }),
};

// POS APIs (UC43-UC45)
export const posAPI = {
  searchProducts: (term) => apiCall(`/pos/products/search?term=${encodeURIComponent(term)}`),
  getProductByBarcode: (barcode) => apiCall(`/pos/products/barcode/${encodeURIComponent(barcode)}`),
};

// Sale Transaction APIs (UC46-UC48)
export const saleAPI = {
  create: (data) => apiCall('/sales', { method: 'POST', body: JSON.stringify(data) }),
  list: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    return apiCall(`/sales?${params.toString()}`);
  },
  getById: (id) => apiCall(`/sales/${id}`),
};

// System Logs APIs (UC52-UC53)
export const systemLogAPI = {
  list: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    return apiCall(`/system-logs?${params.toString()}`);
  },
  getById: (id) => apiCall(`/system-logs/${id}`),
};

// Registration API (UC49-UC51)
export const registrationAPI = {
  register: (data) => apiCall('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
};

// Gemini Chat API
export const geminiAPI = {
  chat: (userInput) => apiCall('/gemini/chat', { method: 'POST', body: JSON.stringify({ userInput }) }),
  chatProduct: (productId, userInput) => 
    apiCall(`/gemini/chat/product/${productId}`, { method: 'POST', body: JSON.stringify({ userInput }) }),
};


