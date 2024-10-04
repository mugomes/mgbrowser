// Copyright (C) 2004-2024 Murilo Gomes Julio
// SPDX-License-Identifier: MIT

// Site: https://linktr.ee/mugomes

const { app, BrowserWindow, Menu, MenuItem, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const sOS = require('os');
const { spawn } = require('child_process');
const sHttp = require('http');

const sPlataform = sOS.platform().toLowerCase();

const mgBrowserPath = app.getAppPath().replace('app.asar', '');
const mgBrowserSettingApp = path.join(mgBrowserPath, '/app');

const mglangs = require(path.join(app.getAppPath(), '/mglang.js'));
const mglang = new mglangs(sPlataform, mgBrowserSettingApp);

process.on('uncaughtException', (error) => {
    console.error(mglang.traduzir('Unhandled exception:'), error);
});

if (!fs.existsSync(path.join(mgBrowserSettingApp, '/config/config.json'))) {
    console.log(mglang.traduzir('Unable to find file %s', '"config.json"'));

    app.quit();
    return false;
}

const config = JSON.parse(fs.readFileSync(path.join(mgBrowserSettingApp, '/config/config.json'), 'utf-8'));

if (config.app.disableHardwareAcceleration) {
    app.disableHardwareAcceleration();
}

if (config.app.name) {
    app.setName(config.app.name);
}

let sServerName;
let phpServerProcess;
let sPort;

function createMenu(sWin, menus) {
    if (menus) {
        fs.readFile(path.join(mgBrowserSettingApp, '/menu/menu.json'), (err, data) => {
            if (err) {
                console.error(mglang.traduzir('Error reading JSON file'), err);
                return;
            }

            const menuData = JSON.parse(data);

            // Cria o menu principal
            const mainMenu = Menu.buildFromTemplate(getMenuTemplate(sWin, menuData, true));
            sWin.setMenu(mainMenu);
        });
    } else {
        // Cria o menu principal
        const mainMenu = Menu.buildFromTemplate(getMenuTemplate(sWin, '', true));
        sWin.setMenu(mainMenu);
    }
}

const createWindow = () => {
    const win = new BrowserWindow({
        width: config.app.width,
        height: config.app.height,
        resizable: config.app.resizable,
        icon: path.join(mgBrowserSettingApp, '/icon/', config.app.icon),
        webPreferences: {
            preload: path.join(app.getAppPath(), '/preload.js'),
        }
    });
    win.setMenu(null);
    startPHPServer(win); // Inicie o servidor PHP

    if (config.app.menu) {
        createMenu(win, true);
    } else {
        createMenu(win);
    }

    if (config.dev.tools) {
        win.webContents.openDevTools();
    }

    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url !== '') {
            mgBrowserNewWindow(url);

            return { action: 'deny' }
        }

        return { action: 'allow' }
    });

    app.on("browser-window-created", (e, win) => {
        if (config.dev.tools) {
            win.webContents.openDevTools();
        }

        if (!config.dev.menu) {
            win.removeMenu();
        }
    });

    createMenuContext(win);
    const mgfunctions = require(path.join(app.getAppPath(), '/mgfunctions.js'));
    mgfunctions.mgfunctions(win, mglang, mgBrowserNewWindow);
}

// Aplica permissão de execução para o filephp
function permPHP(filephp) {
    if (config.php.linux.perm) {
        spawn('chmod', ['+x', filephp]);
        config.php.linux.perm = false;

        fs.writeFileSync(path.join(mgBrowserSettingApp, '/config/config.json'), JSON.stringify(config, '', "\t"));

        console.log(mglang.traduzir('Execute permission applied to %s', path.basename(filephp)));
    }
}

// Inicia o servidor embutido do PHP
function startPHPServer(win) {
    let sFilePHP;
    let sFilePHPINI;

    if (sPlataform == 'linux') {
        if (config.php.linux.custom) {
            if (config.php.linux.folder) {
                sFilePHP = path.join(mgBrowserPath, '/php/linux/', config.php.linux.custom);
                permPHP(sFilePHP);
            } else {
                sFilePHP = config.php.linux.custom;
            }
        } else {
            sFilePHP = path.join(mgBrowserPath, '/php/linux/mgpserver');
            permPHP(sFilePHP);
        }

        if (config.php.linux.ini.custom) {
            if (config.php.linux.ini.folder) {
                sFilePHPINI = path.join(mgBrowserPath, '/php/linux/', config.php.linux.ini.custom);
            } else {
                sFilePHPINI = config.php.linux.ini.custom;
            }
        } else {
            sFilePHPINI = path.join(mgBrowserPath, '/php/linux/php.ini');

        }
    } else if (sPlataform == 'win32') {
        if (config.php.win32.custom) {
            if (config.php.win32.folder) {
                sFilePHP = path.join(mgBrowserPath, '/php/win32/', config.php.win32.custom);
            } else {
                sFilePHP = config.php.win32.custom;
            }
        } else {
            sFilePHP = path.join(mgBrowserPath, '/php/win32/php.exe');
        }

        if (config.php.win32.ini.custom) {
            if (config.php.win32.ini.folder) {
                sFilePHPINI = path.join(mgBrowserPath, '/php/win32/', config.php.win32.ini.custom);
            } else {
                sFilePHPINI = config.php.win32.ini.custom;
            }
        } else {
            sFilePHPINI = path.join(mgBrowserPath, '/php/win32/php.ini');

        }
    } else {
        app.quit();
    }

    // Environment
    process.env.MGBROWSER_USERNAME = sOS.userInfo().username;
    process.env.MGBROWSER_USERPATH = sOS.userInfo().homedir;
    process.env.MGBROWSER_PLATFORM = sPlataform
    process.env.MGBROWSER_PATH = path.join(mgBrowserSettingApp, '/');

    let sArgs = process.argv;
    let sArgv = '';
    if (sArgs[1] == '.') {
        sArgv = sArgs.slice(2).toString();
    } else {
        sArgv = sArgs.slice(1).toString();
    }
    process.env.MGBROWSER_ARGV = sArgv;

    // Servidor
    let sCreateServer = sHttp.createServer();
    let sListen = sCreateServer.listen();
    sPort = sListen.address().port;
    sListen.close();
    sCreateServer.close();

    // Router
    if (config.php.router) {
        let sRouter = '';
        sRouter = path.join(mgBrowserSettingApp, '/router.php');
        phpServerProcess = spawn(sFilePHP, ['-S', '127.0.0.1:' + sPort, '-c', sFilePHPINI, '-t', path.join(mgBrowserSettingApp, '/'), sRouter], { cwd: process.env.HOME, env: process.env });
    } else {
        phpServerProcess = spawn(sFilePHP, ['-S', '127.0.0.1:' + sPort, '-c', sFilePHPINI, '-t', path.join(mgBrowserSettingApp, '/')], { cwd: process.env.HOME, env: process.env });
    }

    phpServerProcess.on('error', (err) => {
        console.error(mglang.traduzir('Error starting PHP server:'), err);
    });

    phpServerProcess.on('close', (code) => {
        console.log(mglang.traduzir('The PHP server was terminated with the code:'), code);
    });

    if (sPlataform == 'linux') {
        const checkPortL = setInterval(() => {
            let lsof = spawn('lsof', ['-ti:' + sPort]);

            lsof.stdout.on('data', (data) => {
                console.log(mglang.traduzir('PHP server started successfully.'));
                sServerName = `http://127.0.0.1:${sPort}/`;
                win.loadURL(sServerName);
                clearInterval(checkPortL);
            });

            lsof.stderr.on('data', (data) => {
                console.error(mglang.traduzir('Error when running lsof:'), data);
            });

            lsof.on('close', (code) => {
                if (code !== 0) {
                    console.error(mglang.traduzir('lsof exited with error code'), code);
                }
            });
        }, 1000);
    } else if (sPlataform == 'win32') {
        const checkPortW = setInterval(() => {
            let netstat = spawn('netstat', ['-ano']);
            let findstr = spawn('findstr', [':' + sPort]);

            netstat.stdout.on('data', (data) => {
                findstr.stdin.write(data);
            });

            netstat.stderr.on('data', (data) => {
                console.error(mglang.traduzir('Error running netstat:'), data);
            });

            netstat.on('close', (code) => {
                if (code !== 0) {
                    console.error(mglang.traduzir('netstat exited with error code'), code);
                }
                findstr.stdin.end();
            });

            findstr.stdout.on('data', (data) => {
                console.log(mglang.traduzir('PHP server started successfully.'));
                sServerName = `http://127.0.0.1:${sPort}/`;
                win.loadURL(sServerName);
                clearInterval(checkPortW);

            });
        }, 1000);
    }

    phpServerProcess.unref(); // Permite que o aplicativo seja fechado sem fechar o processo do servidor PHP
}

// Nova Janela
function mgBrowserNewWindow(url, width, height, resizable, menu, hide) {
    let sWidth = (width) ? width : config.app.width;
    let sHeight = (height) ? height : config.app.height;
    let sResizable = (resizable == true || resizable == false) ? resizable : config.app.resizable;
    let sMenu = (menu == true || menu == false) ? menu : config.app.menu;
    let sHide = (hide == true || hide == false) ? hide : false;

    const sNewWindow = new BrowserWindow({
        width: sWidth,
        height: sHeight,
        resizable: sResizable,
        icon: path.join(mgBrowserSettingApp, '/icon/', config.app.icon),
        webPreferences: {
            preload: path.join(app.getAppPath(), '/preload.js'),
        }
    });

    if (sHide) {
        sNewWindow.hide();
    }

    sNewWindow.setMenu(null);
    sNewWindow.loadURL(`${sServerName}/${url.replace(sServerName, '')}`);

    createMenuContext(sNewWindow);

    sNewWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url !== '') {
            mgBrowserNewWindow(`${url}`);

            return { action: 'deny' }
        }

        return { action: 'allow' }
    });

    if (sMenu) {
        createMenu(sNewWindow, true);
    }
}

// Template de Menu
function getMenuTemplate(win, menuData, menus) {
    let template = [];

    if (menus) {
        if (config.dev.menu) {
            let devMenu = {
                label: mglang.traduzir('Dev'),
                submenu: [
                    {
                        label: mglang.traduzir('Refresh'),
                        accelerator: 'F5',
                        click: () => {
                            win.reload();
                        }
                    },
                    {
                        type: 'separator'
                    },
                    {
                        label: mglang.traduzir('Developer Tools'),
                        accelerator: 'F12',
                        click: () => {
                            win.openDevTools();
                        }
                    }
                ]
            }

            template.push(devMenu);
        }

        // Loop sobre as chaves do objeto JSON
        Object.keys(menuData).forEach((key) => {
            let submenu = [];

            // Loop sobre os itens do submenu
            Object.keys(menuData[key]).forEach((submenuKey) => {
                let menuItem = {};

                if (submenuKey.indexOf('separator') == 0) {
                    menuItem = { type: 'separator' };
                } else {
                    menuItem = {
                        label: mglang.traduzir(submenuKey),
                        accelerator: menuData[key][submenuKey].key,
                        click: () => {
                            // Verifica se é uma página ou URL
                            if (menuData[key][submenuKey].page) {
                                if (menuData[key][submenuKey].newwindow) {
                                    mgBrowserNewWindow(menuData[key][submenuKey].page, menuData[key][submenuKey].width, menuData[key][submenuKey].height, menuData[key][submenuKey].resizable, menuData[key][submenuKey].menu, menuData[key][submenuKey].hide)
                                } else {
                                    win.loadURL(sServerName + menuData[key][submenuKey].page);
                                }
                            } else if (menuData[key][submenuKey].url) {
                                require('electron').shell.openExternal(menuData[key][submenuKey].url);
                            } else if (menuData[key][submenuKey].script) {
                                win.webContents.executeJavaScript(menuData[key][submenuKey].script);
                            }
                        }
                    };
                }

                submenu.push(menuItem);
            });

            // Adiciona o submenu ao item do menu principal
            template.push({ label: mglang.traduzir(key), submenu });
        });
    }

    return template;
}

function createMenuContext(win) {
    const contextMenu = new Menu();
    contextMenu.append(new MenuItem({
        label: mglang.traduzir('Cut'),
        role: 'cut'
    }));
    contextMenu.append(new MenuItem({
        label: mglang.traduzir('Copy'),
        role: 'copy'
    }));
    contextMenu.append(new MenuItem({
        label: mglang.traduzir('Paste'),
        role: 'paste'
    }));
    contextMenu.append(new MenuItem({
        type: "separator"
    }));
    contextMenu.append(new MenuItem({
        label: mglang.traduzir('Select all'),
        role: 'selectall'
    }));

    win.webContents.on('context-menu', (event, params) => {
        if (params.formControlType == 'input-text' || params.formControlType == 'text-area') {
            contextMenu.popup({
                window: win,
                x: params.x,
                y: params.y
            });
        }
    });
}

// Função para encerrar o processo com base na porta
function killProcessByPort(port) {
    let phpServerClose;
    if (sPlataform == 'linux') {
        phpServerClose = spawn('lsof', ['-ti:' + port, '|', 'xargs', 'kill'], { shell: true });

        phpServerClose.stderr.on('data', (data) => {
            console.log(mglang.traduzir('Error terminating process on port:'), sPort);
            return;
        });

        phpServerClose.on('error', (err) => {
            console.error(mglang.traduzir('Error terminating process on port:'), port, err.message);
            return;
        });

        phpServerClose.on('close', (code) => {
            console.log(mglang.traduzir('The PHP server was terminated with the code:'), code);
            return;
        });

        console.log(mglang.traduzir('Process at the door'), port, mglang.traduzir('terminated successfully.'));
    }
}

function stopPHPServer() {
    if (phpServerProcess) {
        killProcessByPort(sPort); // Encerra todos os processos do PHP que estão sob a mesma porta
        console.log(mglang.traduzir('PHP server stopped.'));
    }
}

app.whenReady().then(() => {
    createWindow()

    // Enquanto os aplicativos do Linux e do Windows são encerrados quando não há janelas abertas, os aplicativos do macOS geralmente continuam em execução mesmo sem nenhuma janela aberta, e ativar o aplicativo quando não há janelas disponíveis deve abrir um novo.
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    });
});

// Para sair do aplicativo no Windows e Linux
// Se for MACOS não roda esse comando
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        stopPHPServer();
        app.quit();
    }
});

app.on('before-quit', () => {
    stopPHPServer();
});
