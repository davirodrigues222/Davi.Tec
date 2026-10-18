const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 600,
    title: "Sampaio Cell - Gestão Técnica",
    autoHideMenuBar: true, // Esconde a barra de menu superior feia do navegador
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  // Carrega o endereço local do Vite ou os ficheiros compilados
  mainWindow.loadURL('http://localhost:5173');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.stopServerAndQuit ? app.stopServerAndQuit() : app.quit();
});