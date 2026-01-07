const {app, BrowserWindow, session, Menu, shell} = require('electron');
const lodash = require('lodash');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow = null;

// 创建应用菜单
function createMenu(win) {
  const isMac = process.platform === 'darwin';

  const template = [
    // macOS 应用菜单
    ...(isMac ? [{
      label: 'Rosser',
      submenu: [
        {label: '关于 Rosser', role: 'about'},
        {type: 'separator'},
        {
          label: '设置...',
          accelerator: 'CmdOrCtrl+,',
          click: () => win.webContents.send('open-settings')
        },
        {type: 'separator'},
        {label: '隐藏 Rosser', role: 'hide'},
        {label: '隐藏其他', role: 'hideOthers'},
        {label: '显示全部', role: 'unhide'},
        {type: 'separator'},
        {label: '退出 Rosser', role: 'quit'}
      ]
    }] : []),

    // 编辑菜单
    {
      label: '编辑',
      submenu: [
        {label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo'},
        {label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo'},
        {type: 'separator'},
        {label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut'},
        {label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy'},
        {label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste'},
        {label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectAll'}
      ]
    },

    // 视图菜单
    {
      label: '视图',
      submenu: [
        {
          label: '刷新',
          accelerator: 'CmdOrCtrl+R',
          click: () => win.webContents.send('refresh-articles')
        },
        {type: 'separator'},
        {label: '实际大小', accelerator: 'CmdOrCtrl+0', role: 'resetZoom'},
        {label: '放大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn'},
        {label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut'},
        {type: 'separator'},
        {label: '切换全屏', accelerator: 'F11', role: 'togglefullscreen'},
        {type: 'separator'},
        {label: '开发者工具', accelerator: 'Alt+CmdOrCtrl+I', role: 'toggleDevTools'}
      ]
    },

    // 订阅菜单
    {
      label: '订阅',
      submenu: [
        {
          label: '新建订阅',
          accelerator: 'CmdOrCtrl+N',
          click: () => win.webContents.send('new-subscription')
        },
        {type: 'separator'},
        {
          label: '抓取当前订阅',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => win.webContents.send('fetch-current')
        },
        {
          label: '抓取所有订阅',
          accelerator: 'CmdOrCtrl+Shift+A',
          click: () => win.webContents.send('fetch-all')
        }
      ]
    },

    // 窗口菜单
    {
      label: '窗口',
      submenu: [
        {label: '最小化', accelerator: 'CmdOrCtrl+M', role: 'minimize'},
        {label: '关闭', accelerator: 'CmdOrCtrl+W', role: 'close'},
        ...(isMac ? [
          {type: 'separator'},
          {label: '前置全部窗口', role: 'front'}
        ] : [])
      ]
    },

    // 帮助菜单
    {
      label: '帮助',
      submenu: [
        {
          label: '访问 GitHub',
          click: () => shell.openExternal('https://github.com')
        }
      ]
    }
  ];

  return Menu.buildFromTemplate(template);
}

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

  // 设置应用菜单
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
