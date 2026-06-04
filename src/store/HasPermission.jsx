import { useContext, useEffect } from "react";
import { AuthContext } from "./AuthContext";
const HasPermission = ({ module, action, children }) => {
  const { permissions ,isAdmin } = useContext(AuthContext);
 // If the user is an admin, bypass permission checks
 if (isAdmin) {
  return children;
}
  // Return null if permissions are not yet loaded
  if (!permissions || permissions.length === 0) {
    return null;
  }
  const hasPermission = permissions.some(
    (perm) => perm.module_name === module && perm[`can_${action}`] === 1
  );
  return hasPermission ? children : null;
};
export default HasPermission;
