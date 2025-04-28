import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

function parseTokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000;
  } catch (e) {
    console.error("Invalid token format", e);
    return null;
  }
}

export const useAdminStore = create(
  persist(
    (set, get) => ({
      admin: {},
      setAdmin: (admin) => {
        const tokenExpiry = parseTokenExpiry(admin.token);
        set(() => ({ admin: { ...admin, tokenExpiry } }));
      },
      removeAdmin: () => {
        set({ admin: {} });
      },
      checkTokenExpiry: () => {
        const { admin, removeAdmin } = get();
        const currentTime = Date.now();
        if (admin.tokenExpiry && currentTime > admin.tokenExpiry) {
          removeAdmin();
        }
      },
    }),
    {
      name: "admin-info",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

setInterval(() => {
  useAdminStore.getState().checkTokenExpiry();
}, 60000);
