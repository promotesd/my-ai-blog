export function safeGetStorageItem(key: string) {
  try {
    if (typeof window === "undefined") return null
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function safeSetStorageItem(key: string, value: string) {
  try {
    if (typeof window === "undefined") return
    window.localStorage.setItem(key, value)
  } catch {
    // Storage can be unavailable in some privacy modes or extensions.
  }
}

export const safeStorage = {
  getItem: safeGetStorageItem,
  setItem: safeSetStorageItem,
  removeItem: (key: string) => {
    try {
      if (typeof window === "undefined") return
      window.localStorage.removeItem(key)
    } catch {
      // Ignore unavailable storage.
    }
  },
}
