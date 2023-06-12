import {onMounted, onUnmounted} from "vue";

export function maximize(store) {
  let ipc_renderer = store.getters.electron.ipcRenderer
  if (ipc_renderer.sendSync('is_maximized'))
    ipc_renderer.send('unmaximize')
  else
    ipc_renderer.send('maximize')
}

export function minimize(store) {
  store.getters.electron.ipcRenderer.send('minimize')
}

export function close(store) {
  store.getters.electron.ipcRenderer.send('close')
}

export function useBrowser() {
  const click_link = (event) => {
    let tag = event.target
    while (tag.tagName !== 'A' && tag !== document.body) {
      tag = tag.parentNode
      if (tag.getAttribute('class') === 'ant-image') {
        event.preventDefault()
        break
      }
      if (!tag) return
    }

    if (tag.tagName === 'A') {
      let link_origin = new URL(tag.href).origin
      if (link_origin !== window.location.origin) {
        event.preventDefault()
        window.open(tag.href)
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
