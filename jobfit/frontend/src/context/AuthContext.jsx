import { createContext, useState, useContext, useEffect } from "react";
import * as api from "../services/api";

// Create context
const AuthContext = createContext(null);

// Hook to use auth
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("userInfo");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem("userInfo");
      }
    }
    setLoading(false);
  }, []);

  const loginUser = async (email, password) => {
    const { data } = await api.login(email, password);
    const userData = data.data || data;
    setUser(userData);
    localStorage.setItem("userInfo", JSON.stringify(userData));
    return userData;
  };

  const registerUser = async (name, email, password) => {
    const { data } = await api.register(name, email, password);
    const userData = data.data || data;
    setUser(userData);
    localStorage.setItem("userInfo", JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("userInfo");
  };

  const value = {
    user,
    loginUser,
    registerUser,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthContext;