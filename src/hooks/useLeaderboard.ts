import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export function useLeaderboard() {
  const API_ORIGIN = api.defaults.baseURL?.replace("/api/v1", "");

  const leaderboardQuery = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data } = await api.get("/profile/leaderboard");

      return (data.leaders ?? []).map((writer: any) => ({
        ...writer,
        avatar: writer.avatar
          ? `${API_ORIGIN}/api/v1/profile/images/${writer.avatar}`
          : "",
      }));
    },
  });

  const myRankQuery = useQuery({
    queryKey: ["leaderboard-me"],
    queryFn: async () => {
      const { data } = await api.get("/profile/leaderboard/me");
      return data;
    },
  });

  return {
    leaderboard: leaderboardQuery.data ?? [],
    myStats: myRankQuery.data,
    isLoading: leaderboardQuery.isLoading || myRankQuery.isLoading,
  };
}
