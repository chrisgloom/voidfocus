/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import fs from 'fs';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import sqlite3 from 'sqlite3';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

const userDataPath = app.getPath('userData');
const dbFilePath = path.join(userDataPath, 'void_interval_database.db');

// capture start time
const startTime: any = new Date();

function initializeDatabase() {
  if (fs.existsSync(dbFilePath)) {
    console.log('Database already exists.');
    return;
  }
  const createTableQuery = `
  CREATE TABLE IF NOT EXISTS entries (
    start_time TEXT,
    end_time TEXT,
    seconds_difference INTEGER
  )
`;
  const createViewQuery = `
  CREATE VIEW IF NOT EXISTS entries_sum_view AS
SELECT
  SUM(seconds_difference) AS total_seconds,
  SUM(CASE WHEN strftime('%Y', start_time) = strftime('%Y', 'now') THEN seconds_difference ELSE 0 END) AS seconds_this_year
FROM entries;
  )
`;

  const db = new sqlite3.Database(dbFilePath);

  // Create your database tables and perform any necessary initialization queries here
  db.serialize(() => {
    db.run(createTableQuery);
    db.run(createViewQuery);
    console.log('Database initialized.');
  });

  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    }
  });
}

initializeDatabase();

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  const endTime = new Date();
  console.log(endTime.toISOString());
  console.log(endTime.getUTCSeconds() - startTime.getUTCSeconds());
  const db = new sqlite3.Database(dbFilePath);
  const insertQuery = ` INSERT INTO entries (start_time, end_time, seconds_difference)
  VALUES ('${startTime.toISOString()}', '${endTime.toISOString()}', ${Math.round(
    (endTime - startTime) / 1000
  )})`;

  // Create your database tables and perform any necessary initialization queries here
  db.serialize(() => {
    db.run(insertQuery, (result) => {
      console.log(result);
    });
  });

  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    }
  });
  // Perform cleanup tasks here.
  // todo insert into sqlite db ending focus time
  // Make sure these tasks can be done synchronously.
});

app
  .whenReady()
  .then(() => {
    createWindow();
    // insert into the db
    const db = new sqlite3.Database(dbFilePath);

    console.log(startTime.toISOString());
    // db.serialize(() => {
    //   db.run(createTableQuery);
    //   console.log('Database initialized.');
    // });

    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      }
    });
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
