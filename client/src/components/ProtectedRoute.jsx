import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import SessionTimeoutModal from "./SessionTimeoutModal";

const ProtectedRoute = ({ children, roles }) => {
  const { token, user } = useSelector((state) => state.auth);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      {children}
      <SessionTimeoutModal />
    </>
  );
};

export default ProtectedRoute;