const util = require('util');
const puppeteer = require('puppeteer');
const checkPortStatus = util.promisify(require('portscanner').checkPortStatus);
const IPFSFactory = require('ipfsd-ctl');
const initWeb3Page = require('./web3.setup');
const {
  IPFS_PORT,
  GANACHE_PORT,
  APP_PORT,
  debug,
  mnemonic,
} = require('./config.json');

module.exports = class E2eSetup {
  constructor(appUrl) {
    this.appUrl = `http://localhost:${APP_PORT}`;
    this.providerUrl = `http://localhost:${GANACHE_PORT}`;
  }
  sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
  async startup() {
    await this.checkGanacheIsRunning();
    await this.setupIpfs();
    await this.checkWebServerIsRunning();
    await this.setupPuppeter();
    await this.navigate(this.appUrl);
    await initWeb3Page(this.page, this.providerUrl, mnemonic);
  }

  async navigate(url) {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  async stop() {
    // Stop ipfs
    if (this.ipfs) {
      this.ipfs.stop();
    }
    if (this.browser) {
      this.browser.close();
    }
  }

  async checkWebServerIsRunning() {
    const attempts = 10;
    for (let index = 1; index <= attempts; index++) {
      console.log(
        `Trying to contact webserver... (attempt ${index}/${attempts})`
      );
      const status = await checkPortStatus(APP_PORT, '127.0.0.1');
      if (status === 'open') {
        console.log('Web Server running!');
        return;
      } else {
        await this.sleep(5000);
      }
    }
    throw new Error(`WebServer not reachable on port ${APP_PORT}`);
  }

  async setupPuppeter() {
    this.browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-web-security'],
      headless: !debug,
      devtools: debug,
    });

    this.page = await this.browser.newPage();
    this.page.on('console', async msg => {
      console.log(`[BROWSER] ${msg.text()}`);
    });
  }

  async setupIpfs() {
    const ipfsPortStatus = await checkPortStatus(IPFS_PORT, '127.0.0.1');
    // If ipfs is not running, launch a daemon for the test
    if (ipfsPortStatus === 'closed') {
      IPFSFactory.create({ type: 'go', port: IPFS_PORT }).spawn(
        {
          args: ['--offline'],
          config: {
            API: {
              HTTPHeaders: {
                'Access-Control-Allow-Credentials': ['true'],
                'Access-Control-Allow-Methods': ['PUT', 'GET', 'POST'],
                'Access-Control-Allow-Origin': ['*'],
              },
            },
            Addresses: {
              API: '/ip4/127.0.0.1/tcp/5001',
            },
          },
        },
        (error, ipfsd) => {
          if (error) {
            console.log('IPFS daemon already running.');
          } else {
            this.ipfs = ipfsd;
          }
        }
      );
    }
  }

  async checkGanacheIsRunning() {
    const ganachePortStatus = await checkPortStatus(GANACHE_PORT, '127.0.0.1');
    if (ganachePortStatus === 'closed') {
      throw new Error(
        `E2E tests need ganache running on port ${GANACHE_PORT}.`
      );
    }
  }
};
