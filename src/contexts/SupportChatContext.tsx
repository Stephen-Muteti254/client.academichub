import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import api from "@/lib/api";
import SupportChatPanel from "@/components/SupportChatPanel";
import { useAuth } from "@/contexts/AuthContext";

/* ================= TYPES ================= */

interface Chat {
  id: string;
  order_id: string;
  last_message?: {
    content: string;
    sent_at: string;
    is_read: boolean;
  };
  unread_count: number;
}

interface SupportChatContextType {
  chats: Chat[];
  unreadChats: number;
  refreshChats: () => Promise<void>;
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;

  openSupportChat: (chatId?: string) => void;
  closeChat: () => void;

  isChatOpen: boolean;
  currentChatId: string | null;
}

/* ================= CONTEXT ================= */

const SupportChatContext = createContext<SupportChatContextType | undefined>(
  undefined
);

/* ================= PROVIDER ================= */

export const SupportChatProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { user } = useAuth();

  const [chats, setChats] = useState<Chat[]>([]);
  const [unreadChats, setUnreadChats] = useState(0);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  /* -------- Fetch chats -------- */
  const refreshChats = useCallback(async () => {
    try {
      const res = await api.get("/support-chat", { params: { limit: 100 } });
      const fetchedChats: Chat[] = res.data?.data?.chats || [];

      setChats(fetchedChats);
      setUnreadChats(
        fetchedChats.reduce(
          (acc, chat) => acc + (chat.unread_count || 0),
          0
        )
      );
    } catch (err) {
      console.error("Failed to fetch support chats:", err);
    }
  }, []);

  useEffect(() => {
    if (user) refreshChats();
  }, [refreshChats, user]);

  /* -------- Open / close support chat -------- */
  const openSupportChat = (chatId: string = "support") => {
    setCurrentChatId(chatId);
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatOpen(false);
    setCurrentChatId(null);
  };

  /* -------- Global event hook -------- */
  useEffect(() => {
    const handler = () => openSupportChat();
    window.addEventListener("open-support-chat", handler);
    return () =>
      window.removeEventListener("open-support-chat", handler);
  }, []);

  return (
    <SupportChatContext.Provider
      value={{
        chats,
        unreadChats,
        refreshChats,
        setChats,
        openSupportChat,
        closeChat,
        isChatOpen,
        currentChatId,
      }}
    >
      {children}

      {/* Global Support Chat Panel */}
      {user && currentChatId && (
        <SupportChatPanel
          chatId={currentChatId}
          currentUserId={user.id}
          isOpen={isChatOpen}
          onClose={closeChat}
        />
      )}
    </SupportChatContext.Provider>
  );
};

/* ================= HOOK ================= */

export const useSupportChat = () => {
  const ctx = useContext(SupportChatContext);
  if (!ctx) {
    throw new Error(
      "useSupportChat must be used within SupportChatProvider"
    );
  }
  return ctx;
};

/* ================= GLOBAL TRIGGER ================= */

/**
 * Can be called anywhere (even outside React)
 */
export const triggerSupportChat = () => {
  window.dispatchEvent(new Event("open-support-chat"));
};
