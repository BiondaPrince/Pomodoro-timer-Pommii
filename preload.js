const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  setAlwaysOnTop: (flag) => ipcRenderer.send('set-always-on-top', flag),
  minimizeWindow: () => ipcRenderer.send('minimize-window')
});
