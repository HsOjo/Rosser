import {BrowserWindow, dialog, ipcMain} from 'electron'

const window_decorator = (func) => {
  return (event, args) => {
    let window = BrowserWindow.getFocusedWindow()
    if (window)
      return func({window, event}, args)
  }
}

ipcMain.on('minimize', window_decorator(
  ({window}) => {
    window.minimize()
  }))

ipcMain.on('is_maximized', window_decorator(
  ({window, event}) => {
    event.returnValue = window.isMaximized()
  }))

ipcMain.on('maximize', window_decorator(
  ({window}) => {
    window.maximize()
  }))

ipcMain.on('unmaximize', window_decorator(
  ({window}) => {
    window.unmaximize()
  }))

ipcMain.on('close', window_decorator(
  ({window}) => {
    window.close()
  }))

ipcMain.on('set_title', window_decorator(
  ({window, event}, title) => {
    window.setTitle(title)
  }))

ipcMain.on('open_dialog', window_decorator(
  ({window, event}, options) => {
    event.returnValue = dialog.showOpenDialogSync(window, options)
  }))

ipcMain.on('save_dialog', window_decorator(
  ({window, event}, options) => {
    event.returnValue = dialog.showSaveDialogSync(window, options)
  }))
