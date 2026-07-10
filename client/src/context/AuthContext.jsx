import { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as authService from "../services/auth.service.js";
import * as usersService from "../services/users.service.js";
import { tokenStore } from "../lib/api.js";
import { connectSocket, disconnectSocket } from "../lib/socket.js";

// Global auth state. This is the ONLY global state besides the socket —
// everything else stays local to its page.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until we know if a stored token is valid

  // On app start: if a token exists, ask the backend who we are.
  // If it's expired, api.js silently refreshes; if refresh fails we land logged-out.
  useEffect(() => {
    const boot = async () => {
      if (!tokenStore.access) return setLoading(false);
      try {
        const { user } = await usersService.getMe();
        setUser(user);
        connectSocket();
      } catch {
        tokenStore.clear();
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, []);

  // Shared post-auth step for all three entry points
  const onAuthed = useCallback((data) => {
    authService.saveTokens(data);
    setUser(data.user);
    connectSocket();
    return data;
  }, []);

  const login = useCallback(
    async (identifier, password) => onAuthed(await authService.login(identifier, password)),
    [onAuthed],
  );

  const register = useCallback(
    async (payload) => onAuthed(await authService.register(payload)),
    [onAuthed],
  );

  const verifyOtp = useCallback(
    async (phone, otp) => onAuthed(await authService.verifyOtp(phone, otp)),
    [onAuthed],
  );

  const logout = useCallback(() => {
    disconnectSocket();
    tokenStore.clear();
    setUser(null);
  }, []);

  // Refetch profile after edits (used by Profile page later)
  const refreshUser = useCallback(async () => {
    const { user } = await usersService.getMe();
    setUser(user);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyOtp, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
