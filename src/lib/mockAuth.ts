// Mock authentication for the prototype. Replace with real backend integration later.
// Hardcoded admin credentials — purely client-side, NOT secure.

export interface MockAdminUser {
  username: string;
  name: string;
  initials: string;
  role: string;
  email: string;
}

export const MOCK_ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin123",
};

export const MOCK_ADMIN_USER: MockAdminUser = {
  username: "admin",
  name: "J. Mwale",
  initials: "JM",
  role: "Super Admin",
  email: "admin@eregistry.gov.zm",
};

const STORAGE_KEY = "eregistry_admin_session";

export const mockAuth = {
  login(username: string, password: string): MockAdminUser | null {
    if (
      username.trim().toLowerCase() === MOCK_ADMIN_CREDENTIALS.username &&
      password === MOCK_ADMIN_CREDENTIALS.password
    ) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_ADMIN_USER));
      return MOCK_ADMIN_USER;
    }
    return null;
  },
  logout() {
    sessionStorage.removeItem(STORAGE_KEY);
  },
  getUser(): MockAdminUser | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as MockAdminUser) : null;
    } catch {
      return null;
    }
  },
  isAuthenticated(): boolean {
    return !!this.getUser();
  },
};
