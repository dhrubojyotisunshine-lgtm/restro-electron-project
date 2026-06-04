import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
const ProtectedRoute = ({ children }) => {
  const { isLogin } = useContext(AuthContext);
  if (!isLogin) {
    return <Navigate to="/log-in" />;
  }
  return children;
};
export default ProtectedRoute;
