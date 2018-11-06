
async function loadScripts(page, urls) {
  for (url of urls) {
    await page.evaluate(url => {
      return new Promise(resolve => {
        const script = document.createElement('script');
        script.onload = () => {
          resolve();
        };
        script.src = url;
        document.head.append(script);
      });
    }, url);
    console.log(`loaded ${url}`);
  }
}

function injectWeb3(providerUrl, mnemonic) {
  console.log('[E2E] Injecting Web3...');
  
  lightwallet.keystore.createVault(
    {
      password: 'abcd',
      seedPhrase: mnemonic,
      hdPathString: "m/0'/0'/0'",
    },
    function(err, ks) {
      if (err) {
        console.warn(err);
        return;
      }
      ks.passwordProvider = function(cb) {
        cb(null, 'abcd');
      };

      var web3Provider = new HookedWeb3Provider({
        host: providerUrl,
        transaction_signer: ks,
      });
      var web3 = new Web3(web3Provider);
      window.web3 = web3;
      window.dispatchEvent(new Event('web3.ready'));
      console.log('[E2E] Web3 injected!', web3.currentProvider);
    }
  );
}

module.exports = async function initWeb3Page(page, providerUrl, mnemonic) {
  await loadScripts(page, [
    'https://cdn.jsdelivr.net/gh/ethereum/web3.js/dist/web3.min.js',
    'https://cdn.jsdelivr.net/npm/eth-lightwallet@3.0.1/dist/lightwallet.min.js',
    'https://cdn.jsdelivr.net/npm/hooked-web3-provider@1.0.0/build/hooked-web3-provider.min.js',
  ]);
  await page.evaluate(injectWeb3, providerUrl, mnemonic);
};
