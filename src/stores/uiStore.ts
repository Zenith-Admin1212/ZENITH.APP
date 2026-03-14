import { create } from 'zustand'

type ActiveModal =
  | 'level-up'
  | 'perfect-day'
  | 'achievement'
  | 'streak-milestone'
  | 'add-habit'
  | 'delete-habit'
  | 'checkin'
  | null

interface UIState {
  // Navigation
  activeTab: string
  setActiveTab: (tab: string) => void

  // Modals
  activeModal: ActiveModal
  modalData: Record<string, unknown>
  openModal: (modal: ActiveModal, data?: Record<string, unknown>) => void
  closeModal: () => void

  // Notification panel
  notificationPanelOpen: boolean
  toggleNotificationPanel: () => void
  closeNotificationPanel: () => void

  // Side menu
  sideMenuOpen: boolean
  toggleSideMenu: () => void
  closeSideMenu: () => void

  // Toast (for XP float animations)
  xpGain: number | null
  showXPGain: (amount: number) => void
  clearXPGain: () => void
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'today',
  setActiveTab: (activeTab) => set({ activeTab }),

  activeModal: null,
  modalData: {},
  openModal: (modal, data = {}) => set({ activeModal: modal, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: {} }),

  notificationPanelOpen: false,
  toggleNotificationPanel: () =>
    set((state) => ({ notificationPanelOpen: !state.notificationPanelOpen })),
  closeNotificationPanel: () => set({ notificationPanelOpen: false }),

  sideMenuOpen: false,
  toggleSideMenu: () =>
    set((state) => ({ sideMenuOpen: !state.sideMenuOpen })),
  closeSideMenu: () => set({ sideMenuOpen: false }),

  xpGain: null,
  showXPGain: (amount) => {
    set({ xpGain: amount })
    setTimeout(() => set({ xpGain: null }), 1500)
  },
  clearXPGain: () => set({ xpGain: null }),
}))
