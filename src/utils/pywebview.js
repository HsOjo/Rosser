export const api = {
  // 创建确认对话框
  // @param title {string} 对话框标题
  // @param message {string} 对话框消息
  // @returns {Promise<boolean>} 返回一个promise对象，解析为布尔型，表示用户单击了确认按钮还是取消按钮
  create_confirmation_dialog(title, message) {
  },

  // 创建打开或保存文件对话框
  // @param dialog_type {number} 对话框类型，0表示打开对话框，1表示保存对话框
  // @param directory {string} 对话框默认文件夹
  // @param allowing_multiple {boolean} 是否允许选择多个文件（仅在打开对话框时有效）
  // @param save_filename {string} 默认的保存文件名（仅在保存对话框中有效）
  // @param file_types {string[]} 支持的文件类型数组
  // @returns {Promise<string[] | null>} 返回一个promise对象，解析为字符串数组表示所选文件的完整路径，如果取消，则解析为null
  create_file_dialog(dialog_type, directory, allowing_multiple, save_filename, file_types) {
  },

  // 销毁一个WebView窗口
  destroy() {
  },

  // 隐藏一个WebView窗口
  hide() {
  },

  // 最小化一个WebView窗口
  minimize() {
  },

  // 移动一个WebView窗口
  // @param x {number} 新窗口的x坐标
  // @param y {number} 新窗口的y坐标
  move(x, y) {
  },

  // 固定一个WebView窗口的大小
  // @param width {number} 新窗口的宽度
  // @param height {number} 新窗口的高度
  // @param fix_point {number} 固定的角（0到3，0为左上角，1为右上角，2为左下角，3为右下角）
  resize(width, height, fix_point) {
  },

  // 还原最小化的WebView窗口
  restore() {
  },

  // 设置一个WebView窗口的标题
  // @param title {string} 窗口标题
  set_title(title) {
  },

  // 显示一个WebView窗口
  show() {
  },

  // 切换一个WebView窗口的全屏模式
  toggle_fullscreen() {
  },

  get_platform() {
  },

  get_properties() {
  },

  interupt() {
  },
};

export function init(callback) {
  if (window.pywebview) {
    for (let k in api) api[k] = window.pywebview.api[k]
    callback && callback()
  }
}
