import { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileCompletion {
  is_complete: boolean;
  missing_fields: string[];
}

interface ProfileContextType {
  profileCompletion: ProfileCompletion | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return ctx;
};

export const ProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [profileCompletion, setProfileCompletion] =
    useState<ProfileCompletion | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const res = await api.get("/profile");
      setProfileCompletion(res.data.profile_completion);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "writer") {
      fetchProfile();
    } else {
      setProfileCompletion(null);
    }
  }, [user?.id, user?.role]);

  return (
    <ProfileContext.Provider
      value={{
        profileCompletion,
        isLoading,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};
