import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authApi, type LoginPayload, type User } from "@/api/auth.api";
import { setUnauthorizedHandler, tokenStorage } from "@/api/axios";
import { queryClient } from "@/lib/queryClient";

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<User>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.getCurrentUser();
      setUser(response.data);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      tokenStorage.clear();
      setUser(null);
      queryClient.clear();
    });

    void refreshUser();

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [refreshUser]);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await authApi.login(payload);
    tokenStorage.setTokens(
      response.data.accessToken,
      response.data.refreshToken,
    );
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      tokenStorage.clear();
      setUser(null);
      queryClient.clear();
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        setUser,
        refreshUser,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
