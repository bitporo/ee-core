
const is = require('is-type-of');
const Exception = require('ee-core/exception');
const Loader = require('ee-core/loader');
const Log = require('ee-core/log');
const UtilsCore = require('../../core/lib/utils');

// 开发环境下，ee-core是soft link
// /node_modules[\\/]electron[\\/]/.test(process.execPath)
// const Exception = require('../../exception');
// const Loader = require('../../loader');
// const Log = require('../../log');
// const UtilsCore = require('../../core/lib/utils');

Exception.start();

class ChildApp {
  constructor() {
    this._initEvents();
  }

  /**
   * 初始化事件监听
   */
  _initEvents() {
    process.on('message', this._handleMessage.bind(this));
    process.on('disconnect', () => {
      Log.coreLogger.info(`[ee-core] [jobs/child] child process disconnected, pid:${process.pid}`);
    });
    process.on('exit', (code) => {
      Log.coreLogger.info(`[ee-core] [jobs/child] child process exit code:${code}, pid:${process.pid}`);
    });
  }

  /**
   * 监听消息
   */
  _handleMessage(m) {
    this.run(m);
    Log.coreLogger.info(`[ee-core] [jobs/child] Received a message ${JSON.stringify(m)} from the mainProcess`);
  }

  /**
   * 运行脚本
   */  
  run(msg = {}) {
    let filepath = msg.jobPath;
    let params = msg.params;

    let mod = Loader.loadJsFile(filepath);
    if (is.class(mod) || UtilsCore.isBytecodeClass(mod)) {
      let jobClass = new mod(params);
      jobClass.handle();
    } else if (is.function(mod)) {
      mod(params);
    }

    Log.coreLogger.info('[ee-core] [child-process] job run');
  }
}

new ChildApp();