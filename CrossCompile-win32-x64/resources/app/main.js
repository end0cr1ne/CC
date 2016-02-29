const config = require('./config');
const electron = require('electron');
const app = electron.app;
const window = electron.BrowserWindow;

var mainWindow=null;

app.on('window-all-closed',function(){
    app.quit();
});

app.on('ready',function(){

    var lastWindowState = config.get("lastWindowState");
    if (lastWindowState === null) {
        lastWindowState = {
            width: 1024,
            height: 768,
            maximized: false
        }
    }

    mainWindow = new window({
        x: lastWindowState.x,
        y: lastWindowState.y,
        width: lastWindowState.width,
        height: lastWindowState.height,
        'web-security':false
    });

    if (lastWindowState.maximized) {
        mainWindow.maximize();
    }

    //mainWindow.setMenu(null);
    mainWindow.loadURL('file:///'+__dirname+'/main.html');

    mainWindow.on('close', function () {
        var bounds = mainWindow.getBounds();
        config.set("lastWindowState", {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
            maximized: mainWindow.isMaximized()
        });
    });
});