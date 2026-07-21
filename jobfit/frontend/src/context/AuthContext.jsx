import { createContext, useState, useContext, useEffect } from "react";
import * as api from "../services/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("userInfo");
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const loginUser = async (email, password) => {
    const { data } = await api.login(email, password);
    setUser(data);
    localStorage.setItem("userInfo", JSON.stringify(data));
    return data;
  };

  const registerUser = async (name, email, password) => {
    const { data } = await api.register(name, email, password);
    setUser(data);
    localStorage.setItem("userInfo", JSON.stringify(data));
    return data;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("userInfo");
  };

  return (
    <AuthContext.Provider value={{ user, loginUser, registerUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};