import { NavLink, useLocation } from "react-router-dom";
import {
  FileText,
  PlusCircle,
  MessageSquare,
  Bell,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  HeadphonesIcon,
  ClipboardList,
  Wallet
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { useChatContext } from "@/contexts/ChatContext";
import { triggerSupportChat } from '@/contexts/SupportChatContext';
import LightLogo from "@/assets/light-mini-logo.PNG";
import DarkLogo from "@/assets/dark-mini-logo.PNG";

const menuItems = [
  { title: "My Orders", url: "/client/orders", icon: FileText },
  { title: "Wallet", url: "/client/wallet", icon: Wallet },
  { title: "Chats", url: "/client/chats", icon: MessageSquare },
  { title: "Notifications", url: "/client/notifications", icon: Bell },
];

export function ClientSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  // Only declare once
  const { unreadCount: unreadNotifications } = useNotificationContext();
  const { unreadChats } = useChatContext();

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  };

  const isActive = (path: string) => {
    return currentPath === path || currentPath.startsWith(`${path}/`);
  };

  const getUnreadBadge = (count: number) => {
    if (count === 0) return null;
    const displayCount = count > 9 ? "9+" : count.toString();
    return (
      <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-primary px-1.5 text-[10px] font-bold text-white">
        {displayCount}
      </span>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      {/* Profile Header */}
      <div className="grid grid-cols-3 items-center p-4 border-b border-border">
        
        {/* Logo (left) */}
        <div className="flex justify-center items-center">
          {open && (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <img
                src={LightLogo}
                alt="AcademicHub"
                className="h-5 w-auto block dark:hidden"
              />
              <img
                src={DarkLogo}
                alt="AcademicHub"
                className="h-5 w-auto hidden dark:block"
              />
            </div>
          )}
        </div>

        {/* Theme toggle (center) */}
        <div className="flex justify-center items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-8 w-8 p-0"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Profile dropdown (right) */}
        <div className="flex justify-center items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <div className="w-6 h-6 bg-brand-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {getInitials(user?.full_name)}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center space-x-2 p-2">
                <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{getInitials(user?.full_name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.full_name || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">Client</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <NavLink to="/profile" className="flex items-center cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </NavLink>
              </DropdownMenuItem>
              {/*<DropdownMenuItem asChild>
                <NavLink to="/notifications-settings" className="flex items-center cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </NavLink>
              </DropdownMenuItem>*/}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={() => logout()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </div>


      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          {/*<SidebarGroupLabel className="px-4 text-muted-foreground">
            Client Dashboard
          </SidebarGroupLabel>*/}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const badge =
                  item.title === "Notifications"
                    ? getUnreadBadge(unreadNotifications)
                    : item.title === "Chats"
                    ? getUnreadBadge(unreadChats)
                    : null;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} className="flex items-center">
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                        {badge}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Support Footer */}
      <div
        className="border-t border-border p-4 mt-auto cursor-pointer"
        onClick={triggerSupportChat}
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <HeadphonesIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Support</p>
            <p className="text-xs text-muted-foreground">Get help anytime</p>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
