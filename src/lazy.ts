import { lazy } from "react";

export const Landing = lazy(() => import("@/pages/Landing"));
export const Login = lazy(() => import("@/pages/Login"));
export const Register = lazy(() => import("@/pages/Register"));

export const NewClientOrders = lazy(() => import("@/pages/client/NewClientOrders"));
export const OrderDetails = lazy(() => import("@/pages/OrderDetails"));

export const MyOrders = lazy(() => import("@/pages/MyOrders"));
export const AvailableOrders = lazy(() => import("@/pages/AvailableOrders"));
export const SubmitWork = lazy(() => import("@/pages/SubmitWork"));

export const ClientLayout = lazy(() => import("@/components/ClientLayout"));
export const DashboardLayout = lazy(() => import("@/components/DashboardLayout"));
export const AdminLayout = lazy(() => import("@/components/AdminLayout"));