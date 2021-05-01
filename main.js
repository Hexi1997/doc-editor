const { app, BrowserWindow } = require("electron");
const isDev = require("electron-is-dev");
let mainWindow;
app.on("ready", () => {
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  mainWindow.maximize();
  const urlLocation = isDev ? "http://localhost:3000" : "todo";
  mainWindow.loadURL(urlLocation);
  mainWindow.webContents.openDevTools();
});
