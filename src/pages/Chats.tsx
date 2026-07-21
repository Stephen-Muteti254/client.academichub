import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageSquare, Send, CheckCheck, Loader2, MoreVertical, Pencil, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { useChatContext } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { groupMessagesByDate, formatChatDate } from "@/lib/chatUtils";


export default function Chats() {
  const navigate = useNavigate();

  const { search } = useLocation();
  const params = new URLSearchParams(search);

  const writerParam = params.get("writer");
  const clientParam = params.get("client");
  const orderParam = params.get("order");

  const otherUserParam = writerParam || clientParam;

  const hasDeepLink = orderParam && otherUserParam;

  const { chats, setChats, refreshChats } = useChatContext();

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [sendingMessageIds, setSendingMessageIds] = useState<{ [key: number]: boolean }>({});
  const [editingMessageIds, setEditingMessageIds] = useState<{ [key: number]: boolean }>({});
  const [deletingMessageIds, setDeletingMessageIds] = useState<{ [key: number]: boolean }>({});
  const [warning, setWarning] = useState<null | { risk: string; message: string }>(null);

  const [editContent, setEditContent] = useState("");

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollAreaRef = useRef<any>(null);

  const { user } = useAuth();
  const currentUserId = user?.id;

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [localChats, setLocalChats] = useState<Chat[]>([]);
  const didResolveRef = useRef(false);

  const resolveChatFromUrl = useCallback(async () => {
    if (!orderParam || !otherUserParam) return null;

    const payload: any = { order_id: orderParam };

    if (user?.role === "client") {
      payload.writer_id = otherUserParam;
    } else {
      payload.client_id = otherUserParam;
    }

    const res = await api.post("/chats", payload);
    return res.data.chat.id;
  }, [orderParam, otherUserParam, user]);


  /**Auto scroll to the last message in a chat**/
  /* ---------- robust auto-scroll to last message ---------- */
  useEffect(() => {
    const viewport = scrollAreaRef.current?.getElement?.();
    const end = messagesEndRef.current;
    if (!viewport || !end) return;

    requestAnimationFrame(() => {
      viewport.scrollTop = viewport.scrollHeight;
    });
  }, [messages, selectedChatId]);

  /** STEP 1: Create chat if ?order & ?writer exist */
  /* ---------- instrumented loadChats ---------- */
  const loadChats = useCallback(async (pageToLoad = 1) => {
    if (!hasMore && pageToLoad !== 1) return;

    if (pageToLoad === 1) setLoadingChats(true);
    else setLoadingMore(true);

    try {
      const res = await api.get("/chats", { params: { page: pageToLoad, limit: 10 } });
      const newChats = res.data.chats || [];
      setLocalChats(prev => pageToLoad === 1 ? newChats : [...prev, ...newChats]);
      // setChats(prev => pageToLoad === 1 ? newChats : [...prev, ...newChats]);
      setHasMore(res.data.has_more);
      setPage(pageToLoad);
    } catch (err) {
      console.error("Failed to load chats", err);
    } finally {
      if (pageToLoad === 1) setLoadingChats(false);
      else setLoadingMore(false);
    }
  }, [hasMore, setLocalChats]);

  // Initial load
  useEffect(() => { loadChats(1); }, []);

  // Infinite scroll handler
  const handleScroll = () => {
    const viewport = scrollAreaRef.current?.getElement?.();
    if (!viewport) return;
    if (viewport.scrollHeight - viewport.scrollTop <= viewport.clientHeight + 50 && hasMore && !loadingMore) {
      loadChats(page + 1);
    }
  };


  /* ---------- instrumented fetchMessages ---------- */
  const fetchMessages = useCallback(async (chatId: string) => {
    setLoadingMessages(true);
    try {
      const res = await api.get(`/chats/${chatId}/messages`, { params: { limit: 50 } });
      console.log("DEBUG fetchMessages response:", res?.data);
      const msgs = res?.data?.messages || [];
      console.log(`DEBUG fetched ${msgs.length} messages for chat ${chatId}`);
      setMessages(msgs);

      // mark read and then update local chat unread_count (no full refresh)
      const markRes = await api.post(`/chats/${chatId}/mark-read`);
      console.log("DEBUG mark-read response:", markRes?.data);

      // optimistic local update of chat unread_count to 0
      setLocalChats(prev => prev.map(c => c.id === chatId ? { ...c, unread_count: 0, last_message: c.last_message } : c));
    } catch (err) {
      console.error("DEBUG Error loading messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  }, [setLocalChats]);


  const ensureChatVisible = async (chatId: string) => {
    const exists = localChats.some(c => c.id === chatId);
    if (exists) return;

    const res = await api.get(`/chats/${chatId}`);
    upsertChat(res.data.chat);
  };


  const upsertChat = useCallback((chat: Chat) => {
    setLocalChats(prev => {
      const exists = prev.find(c => c.id === chat.id);
      if (exists) {
        // update existing chat in-place
        return prev.map(c => c.id === chat.id ? { ...c, ...chat } : c);
      }
      // otherwise prepend
      return [chat, ...prev];
    });
  }, []);


  useEffect(() => {
    if (didResolveRef.current) return;
    didResolveRef.current = true;

    let cancelled = false;

    (async () => {
      if (!orderParam || !otherUserParam) return;

      const chatId = await resolveChatFromUrl();
      if (!chatId || cancelled) return;

      setSelectedChatId(chatId);
      await fetchMessages(chatId);
      ensureChatVisible(chatId);
    })();

    return () => { cancelled = true; };
  }, [orderParam, otherUserParam]);




  /** When a chat is clicked */
  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    fetchMessages(chatId);
  };

  /** Delete Message */
  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedChatId) return;

    setDeletingMessageIds(prev => ({ ...prev, [messageId]: true }));

    try {
      await api.delete(`/chats/${selectedChatId}/messages/${messageId}`);

      setMessages(prev => prev.filter(m => m.id !== messageId));

    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setDeletingMessageIds(prev => {
        const copy = { ...prev };
        delete copy[messageId];
        return copy;
      });
    }
  };


  /** Edit Message */
  const handleEditMessage = async (messageId: string) => {
    if (!selectedChatId || !editContent.trim()) return;

    setEditingMessageIds(prev => ({ ...prev, [messageId]: true }));

    try {
      const res = await api.put(`/chats/${selectedChatId}/messages/${messageId}`, {
        content: editContent,
      });

      if (res.data?.warning) {
        setWarning(res.data.warning);
      }

      setMessages(prev =>
        prev.map(m =>
          m.id === messageId ? { ...m, content: editContent, edited: true } : m
        )
      );

      setEditingMessageId(null);
      setEditContent("");

    } catch (err) {
      console.error("Edit failed", err);
    } finally {
      setEditingMessageIds(prev => {
        const copy = { ...prev };
        delete copy[messageId];
        return copy;
      });
    }
  };

  const startEdit = (message: any) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  /** Send Message */
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChatId) return;

    const tempId = "temp-" + Date.now();

    // optimistic temporary message
    const now = new Date().toISOString();

    const tempMessage = {
      id: tempId,
      chat_id: selectedChatId,
      content: newMessage,
      sender: { id: currentUserId },
      edited: false,
      sending: true,
      created_at: now,
      sent_at: now,
    };

    setMessages(prev => [...prev, tempMessage]);
    setSendingMessageIds(prev => ({ ...prev, [tempId]: true }));
    setNewMessage("");

    try {
      const res = await api.post(`/chats/${selectedChatId}/messages`, {
        content: newMessage,
      });

      const real = res.data?.message || res.data?.data || res.data;

      if (res.data?.warning) {
        setWarning(res.data.warning);
      }

      // swap temp message with real one
      setMessages(prev =>
        prev.map(m => (m.id === tempId ? real : m))
      );

    } catch (err) {
      console.error("Send failed", err);

      // mark failed visually
      setMessages(prev =>
        prev.map(m =>
          m.id === tempId ? { ...m, sending: false, failed: true } : m
        )
      );
    } finally {
      setSendingMessageIds(prev => {
        const copy = { ...prev };
        delete copy[tempId];
        return copy;
      });
    }
  };


  const selectedChat = localChats.find(c => c.id === selectedChatId) || null;
  const messageGroups = groupMessagesByDate(messages);


  return (
    <div className="flex h-screen overflow-hidden min-h-0">

      {/* CHAT LIST */}
      <Card className="w-1/3 h-full rounded-none border-r flex flex-col overflow-hidden">
        <CardHeader className="shrink-0">
          <CardTitle className="text-2xl">Chats</CardTitle>
        </CardHeader>

        {localChats.some(c => c.warning?.active) && (
          <div className="p-3 bg-yellow-100 border border-yellow-300 text-yellow-900 rounded m-2 mb-0 mt-0 text-sm">
            Some chats require your attention due to policy warnings.
          </div>
        )}

        <ScrollArea className="flex-1" ref={scrollAreaRef} onScroll={handleScroll}>
          <div className="p-3 space-y-2">
            {loadingChats && (
              <div className="flex justify-center py-4">
                <Loader2 className="animate-spin" />
              </div>
            )}

            {localChats.map(chat => (
              <div
                key={chat.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedChatId === chat.id ? "bg-primary/10 border border-primary/20" : "hover:bg-accent"
                }`}
                onClick={() => handleSelectChat(chat.id)}
              >
                <div className="flex flex-col items-start mb-1 gap-1">
                  {/* TITLE (own row, left-aligned) */}
                  <p className="font-medium text-sm line-clamp-2 leading-snug text-left">
                    {chat.order_title || "Untitled order"}
                  </p>

                  {/* ID + BADGES (row, left-aligned) */}
                  <div className="flex items-center gap-2 text-left">
                    <p className="text-xs font-medium text-muted-foreground">
                      {chat.order_id}
                    </p>

                    {chat.unread_count > 0 && (
                      <Badge variant="destructive" className="h-5 px-2">
                        {chat.unread_count}
                      </Badge>
                    )}

                    {chat.warning?.active && (
                      <Badge variant="destructive" className="h-5 px-2">
                        Warning
                      </Badge>
                    )}
                  </div>
                </div>


                <p className="text-xs opacity-80 line-clamp-1">
                  {chat.last_message?.content || "No messages yet"}
                </p>
              </div>
            ))}

            {/* SHOW loadingMore indicator */}
            {loadingMore && (
              <div className="flex justify-center align-center py-2">
                <Loader2 className="animate-spin h-4 w-4 text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading more chats...</span>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* CHAT WINDOW */}
      <Card className="flex-1 rounded-none flex flex-col overflow-hidden min-h-0">
        {selectedChat ? (
          <>
            <CardHeader className="border-b shrink-0 p-4">
              {user?.role != "client" ? (
                <>
                  {/* WRITER VIEW */}
                  <CardTitle className="text-xl">{selectedChat.order_title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Order {selectedChat.order_id}
                  </p>
                </>
              ) : (
                <>
                  {/* CLIENT VIEW (unchanged) */}
                  <CardTitle className="text-xl">
                    {selectedChat.order_title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Chat with {selectedChat.other_user?.name}
                  </p>
                </>
              )}
            </CardHeader>


            {/* Main content area */}
            <div className="flex flex-col flex-1 min-h-0">
            {selectedChat?.warning?.active && (
              <div className="p-3 bg-yellow-100 text-sm border border-yellow-300 text-yellow-900 rounded mb-2 flex items-start gap-2">
                {/*<MessageSquare className="h-4 w-4 mt-0.5" />*/}
                <div>
                  <p className="font-semibold">Warning: {selectedChat.warning.risk.toUpperCase()} Risk</p>
                  <p className="text-sm">{selectedChat.warning.message}</p>
                </div>
              </div>
            )}
              {warning && (
                <div className="p-3 bg-yellow-100 border border-yellow-300 text-yellow-900 rounded mb-2 flex items-start gap-2">
                  {/*<MessageSquare className="h-4 w-4 mt-0.5" />*/}
                  <div>
                    <p className="font-semibold">Warning: {warning.risk.toUpperCase()} Risk</p>
                    <p className="text-sm">{warning.message}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto"
                    onClick={() => setWarning(null)}
                  >
                    Dismiss
                  </Button>
                </div>
              )}
              <ScrollArea className="flex-1 min-h-0 p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {loadingMessages ? (
                    <Loader2 className="mx-auto animate-spin" />
                  ) : messages.length === 0 ? (
                    <p className="text-center text-muted-foreground">No messages</p>
                  ) : (
                    Object.entries(messageGroups).map(([dateKey, msgs]) => (
                      <div key={dateKey}>
                        {/* Date separator */}
                        <div className="flex items-center gap-2 my-4">
                          <div className="flex-1 h-px bg-border" />
                          <span className="text-xs text-muted-foreground px-2">
                            {formatChatDate(msgs[0].sent_at || msgs[0].created_at)}
                          </span>
                          <div className="flex-1 h-px bg-border" />
                        </div>

                        {/* YOUR EXISTING MESSAGE LOOP — UNCHANGED */}
                        <div className="flex flex-col space-y-4">
                        {msgs.map(m => {
                          if (!m || !m.sender) return null;

                          const isMine = String(m.sender.id) === String(currentUserId);
                          const isEditing = editingMessageId === m.id;

                          return (
                            <div
                              key={m.id}
                              className={`flex group ${isMine ? "justify-end" : "justify-start"}`}
                              onMouseEnter={() => setHoveredMessageId(m.id)}
                              onMouseLeave={() => setHoveredMessageId(null)}
                            >
                              <div className="relative flex items-start gap-2 max-w-[70%]">
                                {isMine && !isEditing && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className={`h-8 w-8 transition-opacity ${
                                          hoveredMessageId === m.id ? "opacity-100" : "opacity-0"
                                        }`}
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40">
                                      <DropdownMenuItem onClick={() => startEdit(m)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleDeleteMessage(m.id)}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}

                                <div
                                  className={`relative py-2 px-3 rounded-lg ${
                                    isMine ? "bg-primary text-primary-foreground" : "bg-muted"
                                  } ${deletingMessageIds[m.id] ? "opacity-50" : ""}`}
                                >
                                  {isEditing ? (
                                    <div className="flex flex-col gap-2">
                                      <Input
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") handleEditMessage(m.id);
                                          if (e.key === "Escape") cancelEdit();
                                        }}
                                        autoFocus
                                      />
                                      <div className="flex gap-2 justify-end">
                                        <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                          Cancel
                                        </Button>
                                        <Button size="sm" onClick={() => handleEditMessage(m.id)}>
                                          Save
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <p>{m.content}</p>

                                      {sendingMessageIds[m.id] && (
                                        <div className="absolute bottom-1 right-2">
                                          <Loader2 className="h-3 w-3 animate-spin opacity-80" />
                                        </div>
                                      )}

                                      {m.failed && (
                                        <span className="text-[10px] text-red-300 italic">
                                          Failed to send
                                        </span>
                                      )}

                                      {m.edited && (
                                        <span className="text-xs opacity-70 italic">edited</span>
                                      )}
                                    </>
                                  )}

                                  {editingMessageIds[m.id] && (
                                    <div className="absolute bottom-1 right-2 pointer-events-none">
                                      <Loader2 className="h-3 w-3 animate-spin opacity-80" />
                                    </div>
                                  )}

                                  {deletingMessageIds[m.id] && (
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-lg">
                                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              {/* Input bar */}
              <div className="border-t p-3 flex gap-2 bg-background shrink-0">
                <Input
                  placeholder="Type message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                />
                <Button onClick={handleSendMessage} size="icon">
                  <Send size={16} />
                </Button>
              </div>

            </div>
          </>
        ) : (
          <CardContent className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Select a chat</p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
