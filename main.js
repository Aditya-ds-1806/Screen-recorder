const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')

if (!app.isPackaged) {
    require('electron-reload')(__dirname, {
        electron: require(`${__dirname}/node_modules/electron`)
    });
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 750,
        minWidth: 1000,
        minHeight: 750,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            devTools: !app.isPackaged
        },
    });
    win.removeMenu();
    win.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    })
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.handle('dialog', async () => {
    const { filePath } = await dialog.showSaveDialog({
        buttonLabel: 'Save Video',
        defaultPath: `vid-${Date.now()}.webm`
    });
    return filePath;
});
