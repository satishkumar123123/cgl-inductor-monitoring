import React, { createContext, useState } from "react";

export const AuthContext = createContext(null);

// Fake Bypass User Data
const bypassUser = {
  id: "bypass-admin-id",
  name: "Site Admin",
  username: "admin",
  role: "Admin"
};

export function AuthProvider({ children }) {
  // Always authenticated with dummy admin user
  const [user] = useState(bypassUser);
  const [token] = useState("bypass-token-123");
  const [loading] = useState(false);

  const login = async () => bypassUser;
  const logout = () => {
    console.log("Logout bypassed");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: true, // Always True (No Lock/Login required)
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}