import { create } from "zustand";
import { EntertainmentTab } from "@/types/entertainment";

interface EntertainmentStore {
  activeTab: EntertainmentTab;
  globalSearch: string;
  setActiveTab: (tab: EntertainmentTab) => void;
  setGlobalSearch: (q: string) => void;
}

export const useEntertainmentStore = create<EntertainmentStore>((set) => ({
  activeTab: "dashboard",
  globalSearch: "",
  setActiveTab: (tab) => set({ activeTab: tab }),
  setGlobalSearch: (q) => set({ globalSearch: q }),
}));
