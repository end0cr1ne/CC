const electron = require('electron');
const app = electron.app;
const window = electron.BrowserWindow;

var mainWindow=null;

app.on('window-all-closed',function(){
    app.quit();
});

app.on('ready',function(){
    mainWindow = new window({height:600,width:800});
    mainWindow.maximize();
    mainWindow.loadURL('file:///'+__dirname+'/main.html');
});