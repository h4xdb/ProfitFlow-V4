import { useState, useEffect } from "react";
import { authService, type User } from "@/lib/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(authService.getUser());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const currentUser = authService.getUser();
    setUser(currentUser);
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login(username, password);
      setUser(response.user);
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: authService.isAuthenticated(),
    isAdmin: authService.isAdmin(),
    isManager: authService.isManager(),
    isCashCollector: authService.isCashCollector(),
    isAdminOrManager: authService.isAdminOrManager(),
  };
}
