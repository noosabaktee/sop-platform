export interface User {
  id: string;
  name: string;
  email: string;
  company_id: string;
  role: string;
}

export interface AuthSession {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  verifyTwoFactor: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

