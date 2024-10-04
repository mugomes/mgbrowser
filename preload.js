// Copyright (C) 2004-2024 Murilo Gomes Julio
// SPDX-License-Identifier: MIT

// Site: https://linktr.ee/mugomes

const { contextBridge, ipcRenderer } = require('electron')

ipcRenderer.setMaxListeners(20);

// MGBrowser
contextBridge.exposeInMainWorld('mgbrowser', {
    version: (type) => ipcRenderer.invoke('appVersao', type),
    alert: (title, msg, type, ...buttons) => ipcRenderer.invoke('appMessage', title, msg, type, ...buttons),
    confirm: (title, msg, type, ...buttons) => ipcRenderer.invoke('appConfirm', title, msg, type, ...buttons),
    newWindow: (url, width, height, resizable, menu, hide) => ipcRenderer.invoke('appNewWindow', url, width, height, resizable, menu, hide),
    openURL: (url) => ipcRenderer.invoke('appExterno', url),
    translate: (text, ...values) => ipcRenderer.invoke('appTraduzir', text, ...values),
    selectDirectory: () => ipcRenderer.invoke('appSelecionarDiretorio'),
    openFile: () => ipcRenderer.invoke('appAbrirArquivo'),
    saveFile: () => ipcRenderer.invoke('appSalvarArquivo'),
    notification: (title, text) => ipcRenderer.invoke('appNotification', title, text),
    exportPDF: (filename, options) => ipcRenderer.invoke('appExportPDF', filename, options),
});