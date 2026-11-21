import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      "Could not reach FinTrack. Check your connection and try again.";
    return Promise.reject(new Error(message));
  },
);

export const healthApi = {
  check: () => apiClient.get("/health"),
};

export const authApi = {
  me: () => apiClient.get("/auth/me"),
  login: (payload) => apiClient.post("/auth/login", payload),
  register: (payload) => apiClient.post("/auth/register", payload),
  forgotPassword: (payload) => apiClient.post("/auth/forgot-password", payload),
  resetPassword: (payload) => apiClient.post("/auth/reset-password", payload),
  logout: () => apiClient.post("/auth/logout"),
};

export const dashboardApi = {
  summary: () => apiClient.get("/dashboard/summary"),
};

const createResourceApi = (path) => ({
  list: () => apiClient.get(path),
  create: (payload) => apiClient.post(path, payload),
  update: (id, payload) => apiClient.put(`${path}/${id}`, payload),
  remove: (id) => apiClient.delete(`${path}/${id}`),
});

export const transactionsApi = createResourceApi("/transactions");
export const incomeApi = createResourceApi("/income");
export const expensesApi = createResourceApi("/expenses");
export const budgetsApi = createResourceApi("/budgets");
export const savingsGoalsApi = createResourceApi("/savings-goals");
export const walletsApi = createResourceApi("/wallets");

export const categoryApi = {
  list: () => apiClient.get("/categories"),
};

export const savingsApi = {
  contribute: (id, payload) =>
    apiClient.post(`/savings-goals/${id}/contributions`, payload),
};

export const reportsApi = {
  monthly: (params) => apiClient.get("/reports/monthly", { params }),
  yearly: (params) => apiClient.get("/reports/yearly", { params }),
  categories: (params) => apiClient.get("/reports/categories", { params }),
};

export const notificationApi = {
  list: () => apiClient.get("/notifications"),
  markRead: (id) => apiClient.patch(`/notifications/${id}/read`),
  markAllRead: () => apiClient.post("/notifications/read-all"),
};

export const userApi = {
  updateProfile: (payload) => apiClient.put("/users/profile", payload),
  changePassword: (payload) => apiClient.put("/users/change-password", payload),
};
