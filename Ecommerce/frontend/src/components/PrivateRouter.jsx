/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export const isAuthenticated = () => {
    return !!localStorage.getItem("access_token");
};

const PrivateRouter = ({ redirectTo = '/login' }) => {
    const location = useLocation();
    return isAuthenticated() ? <Outlet /> : <Navigate to={redirectTo} state={{ from: location }} replace />;
};

export default PrivateRouter;
