const {app, BrowserWindow, session, Menu, shell, ipcMain} = require('electron');
const lodash = require('lodash');
const path = require('path');

// ========== Locale Module ==========
const locales = {
  zh: {
    about: '关于 Rosser',
    settings: '设置...',
    hideApp: '隐藏 Rosser',
    hideOthers: '隐藏其他',
    showAll: '显示全部',
    quit: '退出 Rosser',
    edit: '编辑',
    undo: '撤销',
    redo: '重做',
    cut: '剪切',
    copy: '复制',
    paste: '粘贴',
    selectAll: '全选',
    view: '视图',
    refresh: '刷新',
    actualSize: '实际大小',
    zoomIn: '放大',
    zoomOut: '缩小',
    toggleFullscreen: '切换全屏',
    devTools: '开发者工具',
    subscription: '订阅',
    newSubscription: '新建订阅',
    fetchCurrent: '抓取当前订阅',
    fetchAll: '抓取所有订阅',
    window: '窗口',
    minimize: '最小化',
    close: '关闭',
    bringToFront: '前置全部窗口',
    help: '帮助',
    visitGitHub: '访问 GitHub',
  },
  en: {
    about: 'About Rosser',
    settings: 'Settings...',
    hideApp: 'Hide Rosser',
    hideOthers: 'Hide Others',
    showAll: 'Show All',
    quit: 'Quit Rosser',
    edit: 'Edit',
    undo: 'Undo',
    redo: 'Redo',
    cut: 'Cut',
    copy: 'Copy',
    paste: 'Paste',
    selectAll: 'Select All',
    view: 'View',
    refresh: 'Refresh',
    actualSize: 'Actual Size',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    toggleFullscreen: 'Toggle Fullscreen',
    devTools: 'Developer Tools',
    subscription: 'Subscription',
    newSubscription: 'New Subscription',
    fetchCurrent: 'Fetch Current',
    fetchAll: 'Fetch All',
    window: 'Window',
    minimize: 'Minimize',
    close: 'Close',
    bringToFront: 'Bring All to Front',
    help: 'Help',
    visitGitHub: 'Visit GitHub',
  }
};

let currentLocale = 'zh';

function setLocale(locale) {
  if (locales[locale]) {
    currentLocale = locale;
  }
}

function t(key) {
  return locales[currentLocale][key] || locales['en'][key] || key;
}
// ========== End Locale Module ==========

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow = null;

// Create application menu
function createMenu(win) {
  const isMac = process.platform === 'darwin';

  const template = [
    // macOS application menu
    ...(isMac ? [{
      label: 'Rosser',
      submenu: [
        {label: t('about'), role: 'about'},
        {type: 'separator'},
        {
          label: t('settings'),
          accelerator: 'CmdOrCtrl+,',
          click: () => win.webContents.send('open-settings')
        },
        {type: 'separator'},
        {label: t('hideApp'), role: 'hide'},
        {label: t('hideOthers'), role: 'hideOthers'},
        {label: t('showAll'), role: 'unhide'},
        {type: 'separator'},
        {label: t('quit'), role: 'quit'}
      ]
    }] : []),

    // Edit menu
    {
      label: t('edit'),
      submenu: [
        {label: t('undo'), accelerator: 'CmdOrCtrl+Z', role: 'undo'},
        {label: t('redo'), accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo'},
        {type: 'separator'},
        {label: t('cut'), accelerator: 'CmdOrCtrl+X', role: 'cut'},
        {label: t('copy'), accelerator: 'CmdOrCtrl+C', role: 'copy'},
        {label: t('paste'), accelerator: 'CmdOrCtrl+V', role: 'paste'},
        {label: t('selectAll'), accelerator: 'CmdOrCtrl+A', role: 'selectAll'}
      ]
    },

    // View menu
    {
      label: t('view'),
      submenu: [
        {
          label: t('refresh'),
          accelerator: 'CmdOrCtrl+R',
          click: () => win.webContents.send('refresh-articles')
        },
        {type: 'separator'},
        {label: t('actualSize'), accelerator: 'CmdOrCtrl+0', role: 'resetZoom'},
        {label: t('zoomIn'), accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn'},
        {label: t('zoomOut'), accelerator: 'CmdOrCtrl+-', role: 'zoomOut'},
        {type: 'separator'},
        {label: t('toggleFullscreen'), accelerator: 'F11', role: 'togglefullscreen'},
        {type: 'separator'},
        {label: t('devTools'), accelerator: 'Alt+CmdOrCtrl+I', role: 'toggleDevTools'}
      ]
    },

    // Subscription menu
    {
      label: t('subscription'),
      submenu: [
        {
          label: t('newSubscription'),
          accelerator: 'CmdOrCtrl+N',
          click: () => win.webContents.send('new-subscription')
        },
        {type: 'separator'},
        {
          label: t('fetchCurrent'),
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => win.webContents.send('fetch-current')
        },
        {
          label: t('fetchAll'),
          accelerator: 'CmdOrCtrl+Shift+A',
          click: () => win.webContents.send('fetch-all')
        }
      ]
    },

    // Window menu
    {
      label: t('window'),
      submenu: [
        {label: t('minimize'), accelerator: 'CmdOrCtrl+M', role: 'minimize'},
        {label: t('close'), accelerator: 'CmdOrCtrl+W', role: 'close'},
        ...(isMac ? [
          {type: 'separator'},
          {label: t('bringToFront'), role: 'front'}
        ] : [])
      ]
    },

    // Help menu
    {
      label: t('help'),
      submenu: [
        {
          label: t('visitGitHub'),
          click: () => shell.openExternal('https://github.com/HsOjo/Rosser')
        }
      ]
    }
  ];

  return Menu.buildFromTemplate(template);
}

// IPC handler for locale change
ipcMain.on('set-locale', (event, locale) => {
  setLocale(locale);
  if (mainWindow) {
    const menu = createMenu(mainWindow);
    Menu.setApplicationMenu(menu);
  }
});

ipcMain.on('get-locale', (event) => {
  event.returnValue = currentLocale;
});

const createWindow = () => {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    let resp_headers = lodash.cloneDeep(details.responseHeaders);
    let keywords = ['frame', 'policy'];
    for (let k in resp_headers) {
      let k_lower = k.toLowerCase();
      for (let kw of keywords) {
        if (k_lower.indexOf(kw) !== -1) {
          delete resp_headers[k];
          break;
        }
      }
    }

    callback({
      responseHeaders: resp_headers
    })
  })

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    frame: false,
    vibrancy: "under-window",
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  // Set application menu
  const menu = createMenu(mainWindow);
  Menu.setApplicationMenu(menu);

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

import './ipc';
