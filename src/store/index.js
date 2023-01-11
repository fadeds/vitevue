
import { createPinia, defineStore } from "pinia"

const pinia = createPinia()

export const useCounterStore = defineStore("counter", {
  state: () => ({ publicKey: '' }),
  getters: {
    publicKey: (state) => state.publicKey,
  },
  actions: {
    setPublicKey(v){
      this.publicKey = v
    }
  },
})
export default pinia