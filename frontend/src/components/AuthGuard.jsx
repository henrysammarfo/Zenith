import { Navigate, useLocation } from "react-router-dom";

export default function AuthGuard({ children, walletAddress }) {
    const location = useLocation();

    if (!walletAddress) {
        // Redirect to home if not connected, but save the location they were trying to go to
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return children;
}
