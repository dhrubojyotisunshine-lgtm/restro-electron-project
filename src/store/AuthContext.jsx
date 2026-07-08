// @refresh reset
import React, { useEffect, useState, useRef, createContext, useMemo, useCallback } from "react";
// import jwtDecode from "jwt-decode"; // Ensure correct import
 import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import axios from "axios";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const syncIntervalRef = useRef(null);

  // Initialize state from localStorage
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [permissions, setPermissions] = useState(() => {
    try {
      const storedPermissions = localStorage.getItem("permissions");
      const isAdmin = localStorage.getItem("isAdmin") === "true"; // Check admin flag

      if (isAdmin) {
        return "admin"; // Return a special value or full-access permissions for admin
      }

      return storedPermissions ? JSON.parse(storedPermissions) : [];
    } catch (error) {
      console.error("Failed to parse permissions:", error);
      return []; // Fallback to an empty array
    }
  });


  const [userId, setUserId] = useState(() => localStorage.getItem("userId"));
  const [username, setUsername] = useState(() => localStorage.getItem("username"));
  const [isAdmin, setIsAdmin] = useState(() =>
    JSON.parse(localStorage.getItem("isAdmin") || "false")
  );

  const clearAuthData = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
    setToken(null);
    setPermissions([]);
    setUserId(null);
    setUsername(null);
    setIsAdmin(false);
    localStorage.clear();
  }, []);

  // Derived state: isLogin
  const isLogin = useMemo(() => {
    if (!token) return false;
    try {
      const decodedToken = jwtDecode(token);
      return decodedToken.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }, [token]);

  // Logout user
  const logoutUser = useCallback(async () => {
    try {
      if (userId) {
        await axios.post(`${API_BASE_URL}/logout/${userId}`);
      }
      clearAuthData();
      toast.info("Logout successful!");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed, please try again!");
    }
  }, [API_BASE_URL, userId, clearAuthData]);

  // Background subscription sync — runs once immediately then every 60 minutes
  const startSubscriptionSync = useCallback(
    (uid) => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }

      const doSync = async () => {
        try {
          await axios.post(`${API_BASE_URL}/trigger-subscription-sync/${uid}`, {}, { timeout: 15000 });
        } catch {
          // silent — backend will still serve local SQLite data on next read
        }
      };

      doSync();
      syncIntervalRef.current = setInterval(doSync, 60 * 60 * 1000); // hourly

    },
    [API_BASE_URL]
  );

  // Store token and user details in localStorage
  const storeToken = useCallback(
    (serverToken, permData, username, userId, isAdmin) => {
      try {
        const decodedToken = jwtDecode(serverToken);
        const expirationTime = decodedToken.exp * 1000;
        const timeoutDuration = expirationTime - Date.now();

        // Store data in localStorage
        localStorage.setItem("token", serverToken);
        localStorage.setItem("permissions", JSON.stringify(permData));
        localStorage.setItem("userId", userId);
        localStorage.setItem("username", username);
        localStorage.setItem("isAdmin", JSON.stringify(isAdmin));

        // Update state
        setToken(serverToken);
        setPermissions(permData);
        setUserId(userId);
        setUsername(username);
        setIsAdmin(isAdmin);

        // Set timeout for token expiry
        if (timeoutDuration > 0) {
          setTimeout(() => logoutUser(), timeoutDuration);
        } else {
          logoutUser();
        }

        // Start background subscription sync after successful login
        startSubscriptionSync(userId);
      } catch (err) {
        console.error("Error decoding token:", err);
        logoutUser();
      }
    },
    [logoutUser, startSubscriptionSync]
  );

  // Check token validity and start sync on mount / token change (covers page refresh)
  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const isTokenValid = decodedToken.exp * 1000 > Date.now();
        if (!isTokenValid) {
          logoutUser();
        } else {
          const storedUserId = localStorage.getItem("userId");
          if (storedUserId) startSubscriptionSync(storedUserId);
        }
      } catch {
        logoutUser();
      }
    }
  }, [token, logoutUser, startSubscriptionSync]);

  return (
    <AuthContext.Provider
      value={{ token, permissions, userId, username, isAdmin, storeToken, logoutUser, isLogin }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
