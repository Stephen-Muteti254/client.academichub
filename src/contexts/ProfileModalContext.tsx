import { createContext, useContext, useState, ReactNode } from "react";

interface ProfileModalContextProps {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const ProfileModalContext = createContext<ProfileModalContextProps | undefined>(undefined);

export function ProfileModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ProfileModalContext.Provider
      value={{
        isOpen,
        openModal: () => setIsOpen(true),
        closeModal: () => setIsOpen(false),
      }}
    >
      {children}
    </ProfileModalContext.Provider>
  );
}

export function useProfileModal() {
  const ctx = useContext(ProfileModalContext);
  if (!ctx) throw new Error("useProfileModal must be used inside ProfileModalProvider");
  return ctx;
}
