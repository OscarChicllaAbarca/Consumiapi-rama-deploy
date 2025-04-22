import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: {
      role: 'admin' // O 'user'
    }
  }),
  getters: {
    isAdmin: (state) => state.user.role === 'admin'
  },
  actions: {
    setUserRole(role) {
      this.user.role = role;
    }
  }
});
