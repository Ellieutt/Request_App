import { Injectable, HostListener } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { UtilService } from './util.service';
import { GasService } from './gas.service';
import { environment } from '../../environments/environment';
import RequestNetwork, {
  Types,
  utils,
} from '@requestnetwork/request-network.js';

const Web3ProviderEngine = require('web3-provider-engine');
import * as FilterSubprovider from 'web3-provider-engine/subproviders/filters';
import * as FetchSubprovider from 'web3-provider-engine/subproviders/fetch';
import * as WAValidator from 'wallet-address-validator';

import {
  ledgerEthereumBrowserClientFactoryAsync as ledgerEthereumClientFactoryAsync,
  LedgerSubprovider,
} from '@0xproject/subproviders';

const Web3 = require('web3');
declare let window: any;

@Injectable()
export class Web3Service {
  private web3;
  private LedgerEthereumClientFactoryAsync = ledgerEthereumClientFactoryAsync;
  private requestNetwork;
  public infuraNodeUrl = {
    1: 'https://mainnet.infura.io/BQBjfSi5EKSCQQpXebO',
    4: 'https://rinkeby.infura.io/BQBjfSi5EKSCQQpXebO',
  };

  public metamask = false;
  public ledgerConnected = false;
  public web3Ready: boolean;

  public etherscanUrl: string;

  public accountObservable = new BehaviorSubject<string>(null);
  public networkIdObservable = new BehaviorSubject<number>(null);

  private web3NotReadyMsg = 'Error when trying to instanciate web3.';
  private requestNetworkNotReadyMsg =
    'Request Network smart contracts are not deployed on this network. Please use Mainnet or Rinkeby Testnet.';
  private walletNotReadyMsg =
    'Connect your Metamask or Ledger wallet to create or interact with a Request.';

  public BN;
  public isAddress;
  public getBlockNumber;

  constructor(
    private utilService: UtilService,
    private gasService: GasService
  ) {
    this.networkIdObservable.subscribe(_ => {
      this.setEtherscanUrl();
    });

    // enable the possibility to reload web3
    window.addEventListener('web3.ready', async event => {
      console.log('web3service instantiate web3');
      await this.checkAndInstantiateWeb3();
      setInterval(async () => await this.refreshAccounts(), 1000);
      this.web3Ready = true;
    });
    window.addEventListener('load', () => {
      window.dispatchEvent(new Event('web3.ready'));
    });
  }

  public getGasPrice() {
    return this.gasService.gasPrice * 1000000000;
  }

  public amountToBN(amount: string, currency: string | number) {
    if (!amount) {
      return this.BN(0);
    }
    const comps = amount.split('.');
    currency =
      typeof currency === 'string' ? currency : Types.Currency[currency];
    const base = this.getDecimalsForCurrency(currency);

    if (!comps[0]) {
      comps[0] = '0';
    }
    if (!comps[1]) {
      comps[1] = '0';
    }
    while (comps[1].length < base) {
      comps[1] += '0';
    }
    const integer = this.BN(comps[0]);
    const fractional = this.BN(comps[1]);

    return integer.mul(this.BN(10).pow(this.BN(base))).add(fractional);
  }

  public BNToAmount(bignumber, currency: string | number) {
    if (!bignumber) {
      return '0';
    }

    currency =
      typeof currency === 'string' ? currency : Types.Currency[currency];
    const base = this.getDecimalsForCurrency(currency);
    const negative = bignumber.lt(this.BN(0));

    if (negative) {
      bignumber = bignumber.mul(this.BN(-1));
    }

    let fraction = bignumber.mod(this.BN(10).pow(this.BN(base))).toString();
    const whole = bignumber.div(this.BN(10).pow(this.BN(base))).toString(10);

    while (fraction.length < base) {
      fraction = `0${fraction}`;
    }
    const matches = fraction.match(/^([0-9]*[1-9]|0)(0*)/);
    fraction = matches && matches[1] ? matches[1] : fraction;

    return `${negative ? '-' : ''}${whole}${
      fraction === '0' ? '' : `.${fraction}`
    }`;
  }

  public getTotalBNFromAmounts(amountsArray: any[]) {
    return amountsArray.reduce((a, b) => this.BN(a).add(this.BN(b)), 0);
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
      ledgerEthereumClientFactoryAsync: this.LedgerEthereumClientFactoryAsync,
      networkId,
    });
    ledgerSubprovider.setPath(derivationPath || `44'/60'/0'`);
    ledgerSubprovider.setPathIndex(derivationPathIndex || 0);

    try {
      const accounts = await ledgerSubprovider.getAccountsAsync();
      return accounts.map(acc => ({
        address: acc,
        index: (derivationPathIndex || 0) + accounts.indexOf(acc),
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
      ledgerEthereumClientFactoryAsync: this.LedgerEthereumClientFactoryAsync,
      networkId,
    });
    ledgerSubprovider.setPath(derivationPath || `44'/60'/0'`);
    ledgerSubprovider.setPathIndex(derivationPathIndex || 0);

    const engine = new Web3ProviderEngine();
    engine.setMaxListeners(200);
    engine.addProvider(new FilterSubprovider());
    engine.addProvider(ledgerSubprovider);
    engine.addProvider(
      new FetchSubprovider({ rpcUrl: this.infuraNodeUrl[networkId] })
    );
    engine.start();

    this.checkAndInstantiateWeb3(engine);

    this.utilService.openSnackBar(
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
        await this.enableWeb3();
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
      this.requestNetwork = new RequestNetwork({
        provider: this.web3.currentProvider,
        ethNetworkId: this.networkIdObservable.value,
        useIpfsPublic: environment.usePublicIpfs,
        ipfsCustomNode: environment.ipfsCustomNode,
        bitcoinNetworkId: this.networkIdObservable.value === 1 ? 0 : 3,
      });
    } catch (err) {
      this.utilService.openSnackBar(this.requestNetworkNotReadyMsg);
      console.error(err);
    }

    this.isAddress = this.web3.utils.isAddress;
    this.BN = mixed => new this.web3.utils.BN(mixed);
    this.getBlockNumber = this.web3.eth.getBlockNumber;
  }

  private async enableWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      try {
        await window.ethereum.enable();
      } catch (error) {
        this.utilService.openSnackBar('Web3 not enabled');
        console.error(error);
      }
    } else if (window.web3) {
      // Legacy dapp browsers...
      window.web3 = new Web3(window.web3.currentProvider);
    }
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
      const msg = !this.web3
        ? this.web3NotReadyMsg
        : !this.requestNetwork
          ? this.requestNetworkNotReadyMsg
          : !this.accountObservable.value
            ? this.walletNotReadyMsg
            : '';
      this.utilService.openSnackBar(msg);
    }
    return stop;
  }

  public setRequestStatus(request) {
    if (request.state === 2) {
      request.status = 'cancelled';
    } else {
      if (request.payee.balance.isZero()) {
        request.status = request.state === 1 ? 'accepted' : 'created';
      } else if (request.payee.balance.lt(request.payee.expectedAmount)) {
        request.status = 'in progress';
      } else if (request.payee.balance.eq(request.payee.expectedAmount)) {
        request.status = 'complete';
      } else if (request.payee.balance.gt(request.payee.expectedAmount)) {
        request.status = 'overpaid';
      } else {
        request.status = 'created';
      }
    }
  }

  private confirmTxOnLedgerMsg() {
    if (this.ledgerConnected) {
      setTimeout(() => {
        this.utilService.openSnackBar(
          'Please confirm transaction on your ledger.',
          null,
          'info-snackbar'
        );
      }, 2000);
    }
  }

  public createRequest(
    role: Types.role,
    payerAddress: string,
    expectedAmount: string,
    currency: string,
    paymentAddress: string,
    requestOptions: any = {},
    refundAddress?: string
  ) {
    if (this.watchDog()) {
      return;
    }

    requestOptions.transactionOptions = {
      gasPrice: this.getGasPrice(),
    };

    this.confirmTxOnLedgerMsg();
    return this.requestNetwork.createRequest(
      Types.Role[role],
      Types.Currency[currency],
      [
        {
          idAddress: this.accountObservable.value,
          paymentAddress,
          expectedAmount: this.amountToBN(expectedAmount, currency),
        },
      ],
      {
        idAddress: payerAddress,
        bitcoinRefundAddresses: refundAddress ? [refundAddress] : undefined,
      },
      requestOptions
    );
  }

  public cancel(
    requestObject: any,
    transactionOptions: any = { gasPrice: this.getGasPrice() }
  ) {
    if (this.watchDog()) {
      return;
    }
    this.confirmTxOnLedgerMsg();
    return requestObject.cancel(transactionOptions);
  }

  public accept(
    requestObject: any,
    transactionOptions: any = { gasPrice: this.getGasPrice() }
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
    transactionOptions: any = { gasPrice: this.getGasPrice() }
  ) {
    if (this.watchDog()) {
      return;
    }
    this.confirmTxOnLedgerMsg();

    return requestObject.addSubtractions(
      [this.amountToBN(amount, requestObject.currency)],
      transactionOptions
    );
  }

  public additional(
    requestObject: any,
    amount: string,
    transactionOptions: any = { gasPrice: this.getGasPrice() }
  ) {
    if (this.watchDog()) {
      return;
    }
    this.confirmTxOnLedgerMsg();
    return requestObject.addAdditionals(
      [this.amountToBN(amount, requestObject.currency)],
      transactionOptions
    );
  }

  public pay(
    requestObject: any,
    amount: string,
    transactionOptions: any = {
      gasPrice: this.getGasPrice(),
      skipERC20checkAllowance: true,
    }
  ) {
    if (this.watchDog()) {
      return;
    }
    this.confirmTxOnLedgerMsg();

    transactionOptions.gasPrice = this.getGasPrice();
    return requestObject.pay(
      [this.amountToBN(amount, requestObject.currency)],
      null,
      transactionOptions
    );
  }

  public refund(
    requestObject: any,
    amount: string,
    transactionOptions: any = {
      gasPrice: this.getGasPrice(),
      skipERC20checkAllowance: true,
    }
  ) {
    if (this.watchDog()) {
      return;
    }
    this.confirmTxOnLedgerMsg();
    return requestObject.refund(
      this.amountToBN(amount, requestObject.currency),
      transactionOptions
    );
  }

  public allowSignedRequest(
    signedRequest: any,
    amount: string,
    transactionOptions: any = { gasPrice: this.getGasPrice() }
  ) {
    if (this.watchDog()) {
      return;
    }
    this.confirmTxOnLedgerMsg();
    return this.requestNetwork.requestERC20Service.approveTokenForSignedRequest(
      signedRequest,
      amount,
      transactionOptions
    );
  }

  public allow(
    requestId: string,
    amount: string,
    transactionOptions: any = { gasPrice: this.getGasPrice() }
  ) {
    if (this.watchDog()) {
      return;
    }
    this.confirmTxOnLedgerMsg();
    return this.requestNetwork.requestERC20Service.approveTokenForRequest(
      requestId,
      this.amountToBN(amount, 'ETH'),
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
        gasPrice: this.getGasPrice(),
        skipERC20checkAllowance: true,
      },
    }
  ) {
    if (this.watchDog()) {
      return;
    }
    this.confirmTxOnLedgerMsg();

    return this.requestNetwork.broadcastSignedRequest(
      signedRequestObject,
      {
        idAddress: this.accountObservable.value,
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
        payeePaymentAddress: Array.isArray(
          transaction.method.parameters._payeesPaymentAddress
        )
          ? transaction.method.parameters._payeesPaymentAddress[0]
          : this.web3.utils.hexToAscii(
              transaction.method.parameters._payeesPaymentAddress.slice(4)
            ),
        payerRefundAddress: transaction.method.parameters._payerRefundAddress,
        subPayeesPaymentAddress: transaction.method.parameters._payeesPaymentAddress.slice(
          1
        ),
      },
      data: {
        data: await this.getIpfsData(transaction.method.parameters._data),
        hash: transaction.method.parameters._data,
      },
      payee: {
        address: transaction.method.parameters._payeesIdAddress[0],
        balance: this.amountToBN(
          '0',
          this.currencyFromContractAddress(transaction.to)
        ),
        expectedAmount: this.BN(
          transaction.method.parameters._expectedAmounts[0]
        ),
      },
      payer: transaction.method.parameters._payer,
      subPayees: [],
    };

    for (const [
      index,
      subPayee,
    ] of transaction.method.parameters._payeesIdAddress.slice(1).entries) {
      subPayee[index] = {
        address: subPayee,
        balance: this.amountToBN(
          '0',
          this.currencyFromContractAddress(transaction.to)
        ),
        expectedAmount: this.BN(
          transaction.method.parameters._expectedAmounts[1 + index]
        ),
      };
    }
    return request;
  }

  isAddressValidator(curr: string | FormControl) {
    return (control: FormControl) => {
      if (control.value) {
        const currency =
          typeof curr === 'string'
            ? curr
            : curr.value === 'BTC'
              ? 'BTC'
              : 'ETH';
        if (
          (currency === 'ETH' &&
            this.web3Ready &&
            !this.isAddress(control.value)) ||
          (currency !== 'ETH' &&
            !WAValidator.validate(
              control.value,
              currency,
              this.networkIdObservable.value !== 1 ? 'testnet' : ''
            ))
        ) {
          return { invalidAddress: true };
        }
      }
      return null;
    };
  }

  isSameAddressValidator(other: FormControl) {
    return (control: FormControl) => {
      if (
        control.value &&
        other.value &&
        control.value.toLowerCase() === other.value.toLowerCase()
      ) {
        return { sameAddress: true };
      }
      return null;
    };
  }

  decimalValidator(curr: string | FormControl) {
    return (control: FormControl) => {
      if (this.web3Ready && control.value) {
        const currency = typeof curr === 'string' ? curr : curr.value;
        const decimal = this.getDecimalsForCurrency(currency);
        const regexp = new RegExp(`^[0-9]*([.][0-9]{0,${decimal}})?$`);
        if (!regexp.test(control.value)) {
          return { pattern: true };
        }
      }
      return null;
    };
  }
}
