import { Injectable, HostListener } from '@angular/core';
import { Subject } from 'rxjs/Rx';
import Net from 'web3-net';

import Web3 from 'web3';
import RequestNetwork from 'requestnetwork.js/dist/src/requestNetwork';

declare let window: any;

@Injectable()
export class Web3Service {
  private web3: Web3;
  private requestNetwork: RequestNetwork;
  public accounts: string[];
  public ready = false;
  public metamaskReady = new Subject < boolean > ();
  public accountsObservable = new Subject < string[] > ();
  public searchValue = new Subject < string > ();

  constructor() {
    window.addEventListener('load', event => {
      console.log('web3service instantiate web3');
      this.checkAndInstantiateWeb3();
      // if (this.ready)
        this.web3.eth.net.getId().then(networkId => {
          this.requestNetwork = new RequestNetwork(this.web3.givenProvider, networkId)
        });
    });
  }

  private checkAndInstantiateWeb3() {
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof window.web3 !== 'undefined') {
      console.warn('Using web3 detected from external source. If you find that your accounts don\'t appear, ensure you\'ve configured that source properly.');
      // Use Mist/MetaMask's provider
      this.web3 = new Web3(window.web3.currentProvider);
    } else {
      console.log('No web3? You should consider trying MetaMask!');
      console.warn('No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it\'s inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask');
      // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
      this.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
    }
    setInterval(() => this.refreshAccounts(), 500);
  }

  private refreshAccounts() {
    console.log('Refreshing accounts');
    this.web3.eth.getAccounts((err, accs) => {
      if (err != null || accs.length === 0) {
        console.warn('Couldn\'t get any accounts! Make sure your Ethereum client is configured correctly.');
        this.ready = false;
        return this.metamaskReady.next(false);
      }

      if (!this.accounts || this.accounts.length !== accs.length || this.accounts[0] !== accs[0]) {
        console.log('Observed new accounts');
        this.accountsObservable.next(accs);
        this.accounts = accs;
      }

      this.ready = true;
      this.metamaskReady.next(true);
    });
  }

  public setSearchValue(searchValue) {
    this.searchValue.next(searchValue);
  }

  public async createRequestAsPayeeAsync(payerAddress, amount, data) {
    try {
      console.log('RequestNetworkService createRequestAsPayeeAsync');
      let amountInWei = this.web3.utils.toWei(amount.toString(), 'ether');
      return await this.requestNetwork.requestEthereumService.createRequestAsPayeeAsync(payerAddress, amountInWei, data);
    } catch (err) {
      console.log('Error: ', err.message);
      return { error: err };
    }
  }

  public async getRequestAsync(requestId) {
    try {
      console.log('RequestNetworkService getRequestAsync');
      let result = await this.requestNetwork.requestEthereumService.getRequestAsync(requestId);
      return this.convertRequestAmountsFromWei(result)
    } catch (err) {
      console.log('Error: ', err.message);
      return err;
    }
  }

  public async acceptAsync(requestId) {
    try {
      console.log('RequestNetworkService acceptAsync');
      let resultAccept = await this.requestNetwork.requestEthereumService.acceptAsync(requestId);
      return resultAccept;
    } catch (err) {
      console.log('Error: ', err.message);
      return err;
    }
  }

  public async paymentActionAsync(requestId, amount, additionals ? ) {
    try {
      console.log('RequestNetworkService payAsync');
      let amountInWei = this.web3.utils.toWei(amount.toString(), 'ether');
      let resultPay = await this.requestNetwork.requestEthereumService.paymentActionAsync(requestId, amountInWei, 0);
      return resultPay;
    } catch (err) {
      console.log('Error: ', err.message);
      return err;
    }
  }

  public async cancelAsync(requestId) {
    try {
      console.log('RequestNetworkService cancelAsync');
      let resultCancel = await this.requestNetwork.requestEthereumService.cancelAsync(requestId)
      return resultCancel;
    } catch (err) {
      console.log('Error: ', err.message);
      return err;
    }
  }

  private convertRequestAmountsFromWei(request) {
    const toBN = this.web3.utils.toBN;
    const fromWei = this.web3.utils.fromWei;
    if (request.expectedAmount)
      request.expectedAmount = fromWei(toBN(request.expectedAmount), 'ether');
    if (request.balance)
      request.balance = fromWei(toBN(request.balance), 'ether');
    return request;
  }

}
