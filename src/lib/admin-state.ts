const ADMIN_MODE_KEY = "vibe-games-admin-mode"
const ADMIN_EVENT = "vibe-games-admin-mode-changed"

export function getAdminMode(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(ADMIN_MODE_KEY) === "true"
}

export function setAdminMode(on: boolean): void {
  if (typeof window === "undefined") return
  if (on) {
    localStorage.setItem(ADMIN_MODE_KEY, "true")
  } else {
    localStorage.removeItem(ADMIN_MODE_KEY)
  }
  window.dispatchEvent(new CustomEvent(ADMIN_EVENT, { detail: { admin: on } }))
}

export function subscribeToAdminMode(callback: (admin: boolean) => void): () => void {
  const handler = (e: Event) => {
    callback((e as CustomEvent<{ admin: boolean }>).detail.admin)
  }
  window.addEventListener(ADMIN_EVENT, handler)
  callback(getAdminMode())
  return () => window.removeEventListener(ADMIN_EVENT, handler)
}
