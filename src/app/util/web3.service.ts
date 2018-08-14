import { Injectable, HostListener } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { MatSnackBar } from '@angular/material';

import RequestNetwork, {
  Types,
  utils
} from '@requestnetwork/request-network.js';
import * as Web3ProviderEngine from 'web3-provider-engine';
import * as FilterSubprovider from 'web3-provider-engine/subproviders/filters';
import * as FetchSubprovider from 'web3-provider-engine/subproviders/fetch';

import {
  ledgerEthereumBrowserClientFactoryAsync as ledgerEthereumClientFactoryAsync,
  LedgerSubprovider
} from '@0xproject/subproviders';

const Web3 = require('web3');
declare let window: any;

@Injectable()
export class Web3Service {
  private web3;
  private requestNetwork;
  public infuraNodeUrl = {
    1: 'https://mainnet.infura.io/BQBjfSi5EKSCQQpXebO',
    4: 'https://rinkeby.infura.io/BQBjfSi5EKSCQQpXebO'
  };
  public defaultGasPrice = 10000000000; // 10 gwei

  public metamask = false;
  public ledgerConnected = false;
  public web3Ready: boolean;

  public etherscanUrl: string;

  public accountObservable = new BehaviorSubject<string>(null);
  public networkIdObservable = new BehaviorSubject<number>(null);
  public searchValue = new Subject<string>();

  private web3NotReadyMsg = 'Error when trying to instanciate web3.';
  private requestNetworkNotReadyMsg = 'Request Network smart contracts are not deployed on this network. Please use Mainnet or Rinkeby Testnet.';
  private walletNotReadyMsg = 'Connect your Metamask or Ledger wallet to create or interact with a Request.';

  public fromWei;
  public toWei;
  public BN;
  public isAddress;
  public getBlockNumber;

  constructor(private snackBar: MatSnackBar) {
    this.networkIdObservable.subscribe(networkId => {
      this.setEtherscanUrl();
    });

    window.addEventListener('load', async event => {
      console.log('web3service instantiate web3');
      await this.checkAndInstantiateWeb3();
      setInterval(async () => await this.refreshAccounts(), 1000);
      this.web3Ready = true;
    });
  }

  public currencyFromContractAddress(address) {
    return Types.Currency[utils.currencyFromContractAddress(address)];
  }

  public getDecimalsForCurrency(currency) {
    return utils.decimalsForCurrency(Types.Currency[currency]);
  }

  public async checkLedger(
    networkId: number,
    derivationPath?: string,
    derivationPathIndex?: number
  ) {
    const ledgerSubprovider = new LedgerSubprovider({
      ledgerEthereumClientFactoryAsync,
      networkId
    });
    ledgerSubprovider.setPath(derivationPath || `44'/60'/0'`);
    ledgerSubprovider.setPathIndex(derivationPathIndex || 0);

    try {
      const accounts = await ledgerSubprovider.getAccountsAsync();
      return accounts.map(acc => ({
        address: acc,
        index: (derivationPathIndex || 0) + accounts.indexOf(acc)
      }));
    } catch (err) {
      if (err.message === 'invalid transport instance') {
        return 'Timeout error. Please verify your ledger is connected and the Ethereum application opened.';
      } else if (err.message.includes('6801')) {
        return 'Invalid status 6801. Check to make sure the right application is selected on your ledger.';
      } else if (err.message) {
        return err.message;
      }
    }
  }

  public instanciateWeb3FromLedger(
    networkId: number,
    derivationPath?: string,
    derivationPathIndex?: number
  ) {
    const ledgerSubprovider = new LedgerSubprovider({
      ledgerEthereumClientFactoryAsync,
      networkId
    });
    ledgerSubprovider.setPath(derivationPath || `44'/60'/0'`);
    ledgerSubprovider.setPathIndex(derivationPathIndex || 0);

    const engine = new Web3ProviderEngine();
    engine.setMaxListeners(200);
    engine.addProvider(ledgerSubprovider);
    engine.addProvider(new FilterSubprovider());
    engine.addProvider(
      new FetchSubprovider({ rpcUrl: this.infuraNodeUrl[networkId] })
    );
    engine.start();

    this.checkAndInstantiateWeb3(engine);

    this.openSnackBar(
      'Ledger Wallet successfully connected.',
      null,
      'success-snackbar'
    );
  }

  public async checkAndInstantiateWeb3(providerEngine?) {
    if (providerEngine || typeof window.web3 !== 'undefined') {
      if (providerEngine) {
        // if Ledger wallet
        this.web3 = new Web3(providerEngine);
        this.ledgerConnected = true;
        this.refreshAccounts(true);
      } else {
        // if Web3 has been injected by the browser (Mist/MetaMask)
        this.ledgerConnected = false;
        this.metamask = window.web3.currentProvider.isMetaMask;
        this.web3 = new Web3(window.web3.currentProvider);
      }
      const networkId = await this.web3.eth.net.getId();
      this.networkIdObservable.next(networkId);
    } else {
      console.warn(
        `No web3 detected. Falling back to ${this.infuraNodeUrl[1]}.`
      );
      this.networkIdObservable.next(1); // mainnet by default
      this.web3 = new Web3(
        new Web3.providers.HttpProvider(this.infuraNodeUrl[1])
      );
    }

    // instanciate requestnetwork.js
    try {
      this.requestNetwork = new RequestNetwork(
        this.web3.currentProvider,
        this.networkIdObservable.value
      );
    } catch (err) {
      this.openSnackBar(this.requestNetworkNotReadyMsg);
      console.error(err);
    }

    this.fromWei = this.web3.utils.fromWei;
    this.toWei = this.web3.utils.toWei;
    this.isAddress = this.web3.utils.isAddress;
    this.BN = mixed => new this.web3.utils.BN(mixed);
    this.getBlockNumber = this.web3.eth.getBlockNumber;
  }

  private async refreshAccounts(force?: boolean) {
    if (this.ledgerConnected && !force) {
      return;
    }

    const accs = await this.web3.eth.getAccounts();
    if (this.accountObservable.value !== accs[0]) {
      this.accountObservable.next(accs[0]);
    }
  }

  private setEtherscanUrl() {
    switch (this.networkIdObservable.value) {
      case 1:
        this.etherscanUrl = 'https://etherscan.io/';
        break;
      case 3:
        this.etherscanUrl = 'https://ropsten.etherscan.io/';
        break;
      case 4:
        this.etherscanUrl = 'https://rinkeby.etherscan.io/';
        break;
      case 42:
        this.etherscanUrl = 'https://kovan.etherscan.io/';
        break;
      default:
        break;
    }
  }

  public watchDog() {
    const stop =
      !this.web3 || !this.requestNetwork || !this.accountObservable.value;
    if (stop) {
      this.openSnackBar();
    }
    return stop;
  }

  public openSnackBar(
    msg?: string,
    ok?: string,
    panelClass?: string,
    duration?: number
  ) {
    if (!msg) {
      msg = !this.web3
        ? this.web3NotReadyMsg
        : !this.requestNetwork
          ? this.requestNetworkNotReadyMsg
          : !this.accountObservable.value
            ? this.walletNotReadyMsg
            : '';
      if (msg === '') {
        return;
      }
    }
    this.snackBar.open(msg, ok || 'Ok', {
      duration: duration || 7000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: panelClass || 'warning-snackbar'
    });
  }

  public setSearchValue(searchValue: string) {
    this.searchValue.next(searchValue);
  }

  public setRequestStatus(request) {
    if (request.state === 2) {
      request.status = 'cancelled';
    } else if (request.state === 1) {
      if (request.payee.balance.isZero()) {
        request.status = 'accepted';
      } else if (request.payee.balance.lt(request.payee.expectedAmount)) {
        request.status = 'in progress';
      } else if (request.payee.balance.eq(request.payee.expectedAmount)) {
        request.status = 'complete';
      } else if (request.payee.balance.gt(request.payee.expectedAmount)) {
        request.status = 'overpaid';
      }
    } else {
      request.status = 'created';
    }
  }

  private confirmTxOnLedgerMsg() {
    if (this.ledgerConnected) {
      setTimeout(() => {
        this.openSnackBar(
          'Please confirm transaction on your ledger.',
          null,
          'info-snackbar'
        );
      }, 2000);
    }
  }

  public createRequestAsPayee(
    payer: string,
    expectedAmount: string,
    currency: string,
    paymentAddress: string,
    requestOptions: any = {}
  ) {
    if (this.watchDog()) {
      return;
    }

    requestOptions.transactionOptions = {
      gasPrice: this.defaultGasPrice
    };

    this.confirmTxOnLedgerMsg();
    return this.requestNetwork.createRequest(
      Types.Role.Payee,
      Types.Currency[currency],
      [
        {
          idAddress: this.accountObservable.value,
          paymentAddress,
          expectedAmount: this.toWei(expectedAmount)
        }
      ],
      {
        idAddress: payer,
        refundAddress: payer
      },
      requestOptions
    );
  }

  public cancel(
    requestObject: any,
    transactionOptions: any = { gasPrice: this.defaultGasPrice }
  ) {
    if (this.watchDog()) {
      return;
    }
    this.confirmTxOnLedgerMsg();
    return requestObject.cancel(transactionOptions);
  }

  public accept(
    requestObject: any,
    transactionOptions: any = { gasPrice: this.defaultGasPrice }
  ) {
    if (this.watchDog()) {
      return;
    }
    this.confirmTxOnLedgerMsg();
    return requestObject.accept(transactionOptions);
  }

  public subtract(
    requestObject: any,
    amount: string,
    transactionOptions: any = { gasPrice: this.defaultGasPrice }
  ) {
    if (this.watchDog()) {
      return;
    }
    this.confirmTxOnLedgerMsg();

    return requestObject.addSubtractions(
      [this.toWei(amount)],
      transactionOptions
    );
  }

  public additional(
    requestObject: any,
    amount: string,
    transactionOptions: any = { gasPrice: this.defaultGasPrice }
  ) {
    if (this.watchDog()) {
      return;
    }
    this.confirmTxOnLedgerMsg();
    return requestObject.addAdditionals(
      [this.toWei(amount)],
      transactionOptions
    );
  }

  public pay(
    requestObject: any,
    amount: string,
    transactionOptions: any = {
      gasPrice: this.defaultGasPrice,
      skipERC20checkAllowance: true
    }
  ) {
    if (this.watchDog()) {
      return;
    }
    this.confirmTxOnLedgerMsg();

    transactionOptions.gasPrice = this.defaultGasPrice;
    return requestObject.pay([this.toWei(amount)], null, transactionOptions);
  }

  public refund(
    requestObject: any,
    amount: string,
    transactionOptions: any = {
      gasPrice: this.defaultGasPrice,
      skipERC20checkAllowance: true
    }
  ) {
    if (this.watchDog()) {
      return;
    }
    this.confirmTxOnLedgerMsg();
    return requestObject.refund(this.toWei(amount), transactionOptions);
  }

  public allowSignedRequest(
    signedRequest: any,
    amount: string,
    transactionOptions: any = { gasPrice: this.defaultGasPrice }
  ) {
    if (this.watchDog()) {
      return;
    }
    this.confirmTxOnLedgerMsg();
    return this.requestNetwork.requestERC20Service.approveTokenForSignedRequest(
      signedRequest,
      this.toWei(amount),
      transactionOptions
    );
  }

  public allow(
    requestId: string,
    amount: string,
    transactionOptions: any = { gasPrice: this.defaultGasPrice }
  ) {
    if (this.watchDog()) {
      return;
    }
    this.confirmTxOnLedgerMsg();
    return this.requestNetwork.requestERC20Service.approveTokenForRequest(
      requestId,
      this.toWei(amount),
      transactionOptions
    );
  }

  public getAllowance(contractAddress: string) {
    if (this.watchDog()) {
      return;
    }
    return this.requestNetwork.requestERC20Service.getTokenAllowance(
      contractAddress
    );
  }

  public broadcastSignedRequestAsPayer(
    signedRequestObject: any,
    amountsToPay: any[],
    requestOptions: any = {
      transactionOptions: {
        gasPrice: this.defaultGasPrice,
        skipERC20checkAllowance: true
      }
    }
  ) {
    if (this.watchDog()) {
      return;
    }
    this.confirmTxOnLedgerMsg();

    return this.requestNetwork.broadcastSignedRequest(
      signedRequestObject,
      {
        idAddress: this.accountObservable.value
      },
      null,
      { amountsToPayAtCreation: amountsToPay },
      requestOptions
    );
  }

  public async getRequestByRequestId(requestId: string) {
    try {
      const request = await this.requestNetwork.fromRequestId(requestId);
      request.requestData = await request.getData();
      request.requestData.currency = Types.Currency[request.currency];
      this.setRequestStatus(request.requestData);
      return request;
    } catch (err) {
      console.log('Error: ', err.message);
      return err;
    }
  }

  public async getRequestByTransactionHash(txHash: string) {
    try {
      const response = await this.requestNetwork.requestCoreService.getRequestByTransactionHash(
        txHash
      );
      return response;
    } catch (err) {
      console.log('Error: ', err.message);
      return err;
    }
  }

  public async getRequestEvents(requestId: string) {
    try {
      const events = await this.requestNetwork.requestCoreService.getRequestEvents(
        requestId
      );
      return events.sort((a, b) => a._meta.timestamp - b._meta.timestamp);
    } catch (err) {
      console.log('Error: ', err.message);
      return err;
    }
  }

  public async getRequestsByAddress(address: string) {
    try {
      const requests = await this.requestNetwork.requestCoreService.getRequestsByAddress(
        address
      );
      return requests;
    } catch (err) {
      console.log('Error: ', err.message);
      return err;
    }
  }

  public async getIpfsData(hash: string) {
    try {
      const result = await this.requestNetwork.requestCoreService.getIpfsFile(
        hash
      );
      return JSON.parse(result);
    } catch (err) {
      console.log('Error: ', err.message);
      return err;
    }
  }

  public async buildRequestFromCreateRequestTransactionParams(transaction) {
    const request = {
      waitingMsg: 'Transaction found. Waiting for it to be mined...',
      creator: transaction.from,
      currency: this.currencyFromContractAddress(transaction.to),
      currencyContract: {
        address: transaction.to,
        payeePaymentAddress:
          transaction.method.parameters._payeesPaymentAddress[0] || null,
        payerRefundAddress: transaction.method.parameters._payerRefundAddress,
        subPayeesPaymentAddress: transaction.method.parameters._payeesPaymentAddress.slice(
          1
        )
      },
      data: {
        data: await this.getIpfsData(transaction.method.parameters._data),
        hash: transaction.method.parameters._data
      },
      payee: {
        address: transaction.method.parameters._payeesIdAddress[0],
        balance: this.BN(this.toWei('0')),
        expectedAmount: this.BN(
          transaction.method.parameters._expectedAmounts[0]
        )
      },
      payer: transaction.method.parameters._payer,
      subPayees: []
    };

    for (const [
      index,
      subPayee
    ] of transaction.method.parameters._payeesIdAddress.slice(1).entries) {
      subPayee[index] = {
        address: subPayee,
        balance: this.BN(this.toWei('0')),
        expectedAmount: this.BN(
          transaction.method.parameters._expectedAmounts[1 + index]
        )
      };
    }

    return request;
  }
}
