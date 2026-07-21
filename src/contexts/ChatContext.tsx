import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import api from "@/lib/api";
import ChatPanel from "@/components/ChatPanel";
import { useAuth } from "@/contexts/AuthContext";

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

interface ChatContextType {
  chats: Chat[];
  unreadChats: number;
  refreshChats: () => Promise<void>;
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  openSupportChat: () => void;
  closeChat: () => void;
  isChatOpen: boolean;
  currentChatId: string | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  const [chats, setChats] = useState<Chat[]>([]);
  const [unreadChats, setUnreadChats] = useState(0);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const refreshChats = useCallback(async () => {
    try {
      const res = await api.get("/chats", { params: { limit: 100 } });
      const fetchedChats: Chat[] = res.data?.data?.chats || [];
      setChats(fetchedChats);
      setUnreadChats(fetchedChats.reduce((acc, chat) => acc + (chat.unread_count || 0), 0));
    } catch (err) {
      console.error("Failed to fetch chats:", err);
    }
  }, []);

  useEffect(() => {
    refreshChats();
  }, [refreshChats]);

  const openNormalChat = (chatId: string = "normal") => {
    setCurrentChatId(chatId);
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatOpen(false);
    setCurrentChatId(null);
  };

  // Global event
  useEffect(() => {
    const handler = () => openSupportChat();
    window.addEventListener("open-normal-chat", handler);
    return () => window.removeEventListener("open-normal-chat", handler);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        chats,
        unreadChats,
        refreshChats,
        setChats,
        openNormalChat,
        closeChat,
        isChatOpen,
        currentChatId,
      }}
    >
      {children}

      {/* ChatPanel mounted globally under provider */}
      {user && currentChatId && (
        <ChatPanel
          chatId={currentChatId}
          currentUserId={user.id}
          isOpen={isChatOpen}
          onClose={closeChat}
        />
      )}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used within ChatProvider");
  return ctx;
};

// Helper to dispatch global event (safe outside components)
export const triggerNormalChat = () => {
  window.dispatchEvent(new Event("open-normal-chat"));
};
