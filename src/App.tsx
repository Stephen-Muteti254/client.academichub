import * as Lazy from "@/lazy";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import EditBid from "./pages/EditBid";
import MyBids from "./pages/MyBids";
import Chats from "./pages/Chats";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import OrderView from "./pages/OrderView";
import NotFound from "./pages/NotFound";

import CreateOrderPage from "./pages/order/CreateOrderPage";
import EditOrderPage from "./pages/order/EditOrderPage";

import OrderSubmissions from "./pages/NewOrderSubmissions";
import OrderBids from "./pages/OrderBids";
import ClientBids from "./pages/ClientBids";

import { RequireAuth } from '@/components/RequireAuth';
import { AuthProvider } from "@/contexts/AuthContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { SupportChatProvider } from "@/contexts/SupportChatContext";

import { ProfileModalProvider } from "@/contexts/ProfileModalContext";
import RoleGuard from "@/components/guards/RoleGuard";


import { Suspense } from "react";
import PageLoader from "@/components/PageLoader";
import ClientWallet from "./pages/ClientWallet";
import RateWriter from "./pages/RateWriter";
import { ProfileCompletionProvider } from "@/contexts/ProfileCompletionContext";
import ProfileCompletionController from "@/components/profile/ProfileCompletionController";
import { HelmetProvider } from "react-helmet-async";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HelmetProvider>
        <BrowserRouter>
          <AuthProvider>
            <ProfileProvider>
            <NotificationProvider>
              <ChatProvider>
              <SupportChatProvider>
                <ProfileModalProvider>
                  <Suspense fallback={<PageLoader />}>
                  <Routes>

                    {/* ================= CLIENT ================= */}
                    <Route element={<RequireAuth requiredRole={["client"]} />}>
                        <Route path="/" element={<Lazy.ClientLayout />}>
                          <Route
                            index
                            element={<Navigate to="orders/in-progress" replace />}
                          />

                          {/* Orders */}
                          <Route path="orders/:tab" element={<Lazy.NewClientOrders />}>

                            <Route path=":orderId" element={<Lazy.OrderDetails />} />
                            <Route path=":orderId/edit" element={<EditOrderPage />} />
                            <Route
                              path=":orderId/bids/:bidTab"
                              element={<OrderBids />}
                            />
                            <Route
                              path=":orderId/submissions"
                              element={<OrderSubmissions />}
                            />
                            <Route path=":orderId/rate" element={<RateWriter />} />
                            <Route path="create" element={<CreateOrderPage />} />
                          </Route>

                          {/* Chats */}
                          <Route path="chats" element={<Chats />} />

                          {/* Notifications */}
                          <Route path="notifications" element={<Notifications />} />

                          <Route path="wallet" element={<ClientWallet />} />

                          <Route
                            path="*"
                            element={<Navigate to="orders/in-progress" replace />}
                          />
                        </Route>
                    </Route>

                  </Routes>
                </Suspense>
                </ProfileModalProvider>
              </SupportChatProvider>
              </ChatProvider>
            </NotificationProvider>
            </ProfileProvider>
          </AuthProvider>
        </BrowserRouter>
      </HelmetProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
