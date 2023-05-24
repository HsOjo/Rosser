import {BrowserWindow, ipcMain, dialog} from 'electron'

ipcMain.on('minimize', () => {
  let window = BrowserWindow.getFocusedWindow()
  window.minimize()
})

ipcMain.on('is_maximized', (event) => {
  let window = BrowserWindow.getFocusedWindow()
  event.returnValue = window.isMaximized()
})

ipcMain.on('maximize', () => {
  let window = BrowserWindow.getFocusedWindow()
  window.maximize()
})

ipcMain.on('unmaximize', () => {
  let window = BrowserWindow.getFocusedWindow()
  window.unmaximize()
})

ipcMain.on('close', () => {
  let window = BrowserWindow.getFocusedWindow()
  window.close()
})

ipcMain.on('set_title', (event, title) => {
  let window = BrowserWindow.getFocusedWindow()
  window.setTitle(title)
})

ipcMain.on('open_dialog', (event, options) => {
  let window = BrowserWindow.getFocusedWindow()
  event.returnValue = dialog.showOpenDialogSync(window, options)
})

ipcMain.on('save_dialog', (event, options) => {
  let window = BrowserWindow.getFocusedWindow()
  event.returnValue = dialog.showSaveDialogSync(window, options)
})
