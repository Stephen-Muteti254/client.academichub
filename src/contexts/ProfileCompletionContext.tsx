import { createContext, useContext, useState, useEffect } from "react";
import { WriterProfileData } from "@/types/profile";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";


interface ProfileCompletionContextType {
  isOpen: boolean;
  profileCompletion?: { is_complete: boolean; missing_fields: string[] };
  refreshProfile?: () => void;
  openWizard: (data?: Partial<WriterProfileData>) => void;
  closeWizard: () => void;
  initialData?: Partial<WriterProfileData>;
}


const ProfileCompletionContext =
  createContext<ProfileCompletionContextType | null>(null);

export function ProfileCompletionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [initialData, setInitialData] =
    useState<Partial<WriterProfileData>>({});

  const openWizard = (data?: Partial<WriterProfileData>) => {
    setInitialData(data ?? {}); // reset to empty if no data provided
    setIsOpen(true);
  };

  const closeWizard = () => {
    setIsOpen(false);
  };

  const [profileCompletion, setProfileCompletion] = useState<{
    is_complete: boolean;
    missing_fields: string[];
  }>({ is_complete: false, missing_fields: [] });

  const refreshProfile = async () => {
    try {
      const res = await api.get("/profile");
      setProfileCompletion(res.data.profile_completion);
    } catch (err) {
      console.error(err);
    }
  };


  return (
    <ProfileCompletionContext.Provider
      value={{ isOpen, openWizard, closeWizard, initialData, profileCompletion, refreshProfile }}
    >
      {children}
    </ProfileCompletionContext.Provider>
  );
}

export function useProfileCompletion() {
  const ctx = useContext(ProfileCompletionContext);
  if (!ctx) {
    throw new Error(
      "useProfileCompletion must be used within ProfileCompletionProvider"
    );
  }
  return ctx;
}
