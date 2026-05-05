import { create } from 'zustand'

interface UserStore {
  profileImageUrl: string | null
  setProfileImageUrl: (url: string | null) => void
  nickname: string | null
  setNickname: (nickname: string | null) => void
  clearUser: () => void
}

export const useUserStore = create<UserStore>((set) => ({
  profileImageUrl: typeof window !== 'undefined' ? localStorage.getItem('profileImageUrl') : null,
  setProfileImageUrl: (url) => {
    if (url) {
      localStorage.setItem('profileImageUrl', url)
    } else {
      localStorage.removeItem('profileImageUrl')
    }
    set({ profileImageUrl: url })
  },
  nickname: typeof window !== 'undefined' ? (() => {
    try {
      const p = localStorage.getItem('userProfile')
      return p ? JSON.parse(p).nickname ?? null : null
    } catch { return null }
  })() : null,
  setNickname: (nickname) => {
    set({ nickname })
  },
  clearUser: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('profileImageUrl')
      localStorage.removeItem('userProfile')
      localStorage.removeItem('isRegistered')
      localStorage.removeItem('mockSession')
    }
    set({ profileImageUrl: null, nickname: null })
  },
}))
