import {onMounted, onUnmounted} from "vue";
import * as pywebview from "@/utils/pywebview.js";

export function useBrowser() {
  const click_link = (event) => {
    let tag = event.target
    if (tag.tagName === 'A') {
      let link_origin = new URL(tag.href).origin
      if (link_origin !== window.location.origin) {
        event.preventDefault()
        pywebview.api.window_open(tag.href)
      }
    }
  }

  onMounted(() => {
    document.addEventListener('click', click_link)
  })
  onUnmounted(() => {
    document.removeEventListener('click', click_link)
  })
}