import { lazy } from "react";


export const NewClientOrders = lazy(() => import("@/pages/NewClientOrders"));
export const OrderDetails = lazy(() => import("@/pages/OrderDetails"));
export const ClientLayout = lazy(() => import("@/components/ClientLayout"));