import { Injectable, HostListener } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { UtilService } from './util.service';
import { GasService } from './gas.service';
import { environment } from '../../environments/environment';
import { CookieService } from 'ngx-cookie-service';
import RequestNetwork, {
  Types,
  utils,
} from '@requestnetwork/request-network.js';

const ENS = require('ethereum-ens');
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
    1: 'https://mainnet.infura.io/v3/668e4d8faa134850bcbc64f7ca03c837',
    4: 'https://rinkeby.infura.io/v3/668e4d8faa134850bcbc64f7ca03c837',
  };

  public metamask = false;
  public ledgerConnected = false;
  public web3Ready: boolean;

  public etherscanUrl: string;

  public accountObservable = new BehaviorSubject<string>(null);
  public accountLoadingObservable = new BehaviorSubject<string>(null);
  public networkIdObservable = new BehaviorSubject<number>(null);

  private web3NotReadyMsg = 'Error when trying to instanciate web3.';
  private requestNetworkNotReadyMsg =
    'Request Network smart contracts are not deployed on this network. Please use Mainnet or Rinkeby Testnet.';
  private walletNotReadyMsg =
    'Connect your Metamask or Ledger wallet to create or interact with a Request.';

  public BN;
  public isAddress;
  public getBlockNumber;
  public ens;

  private minABI = [
    // balanceOf
    {
      constant: true,
      inputs: [{ name: '_owner', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ name: 'balance', type: 'uint256' }],
      type: 'function',
    },
    // decimals
    {
      constant: true,
      inputs: [],
      name: 'decimals',
      outputs: [{ name: '', type: 'uint8' }],
      type: 'function',
    },
  ];

  constructor(
    private utilService: UtilService,
    private gasService: GasService,
    private cookieService: CookieService
  ) {
    this.networkIdObservable.subscribe(_ => {
      this.setEtherscanUrl();
    });

    // enable the possibility to reload web3
    window.addEventListener('web3.ready', async event => {
      console.log('web3service instantiate web3');
      await this.checkAndInstantiateWeb3();
      setInterval(async () => await this.refreshAccounts(), 1000);
      setInterval(async () => await this.checkCookies(), 10000);
      this.web3Ready = true;
    });
    window.addEventListener('load', () => {
      window.dispatchEvent(new Event('web3.ready'));
    });
  }

  public async checkCookies() {
    if (this.cookieService.get('processing_requests')) {
      const cookieList = JSON.parse(
        this.cookieService.get('processing_requests')
      );
      let hasChanged = false;
      const updatedCookieList = [];
      await this.asyncForEach(cookieList, async element => {
        if (element.status !== 'created') {
          // The txid ID is stored as txid&request="requestMeta". So we need to split
          const txidToCheck = element.txid.split('?')[0];
          const result = await this.getRequestByTransactionHash(txidToCheck);
          if (result.request && result.request.requestId) {
            const blockNumber = await this.getBlockNumber();
            // wait 1 block confirmation
            if (blockNumber - result.transaction.blockNumber > 0) {
              element.status = 'created';
              element.unread = true;
              hasChanged = true;
            }
            updatedCookieList.push(element);
          } else if (
            result.message === 'Contract is not supported by request'
          ) {
            const updatedElement = element;
            updatedElement.status = 'failed';
            updatedElement.unread = true;
            updatedCookieList.push(updatedElement);
            hasChanged = true;
          }
        } else {
          updatedCookieList.push(element);
        }
      });
      if (hasChanged) {
        this.cookieService.set(
          'processing_requests',
          JSON.stringify(updatedCookieList),
          1
        );
      }
    }
  }

  private async asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
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
        this.accountLoadingObservable.next('connected');
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
      this.accountLoadingObservable.next('noWeb3');
      this.networkIdObservable.next(1); // mainnet by default
      this.web3 = new Web3(
        new Web3.providers.HttpProvider(this.infuraNodeUrl[1])
      );
    }

    this.ens = new ENS(this.web3.currentProvider);

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
    if (typeof window.ethereum !== 'undefined') {
      if (window.ethereum.selectedAddress) {
        window.web3 = new Web3(window.ethereum);
      } else {
        // Metamask either disconnected or user has never accepted a connection with this domain
        // Test scenario 1: logout from Metamask, refresh the page, click on "Login with Metamask" and decline invitation --> It still works
        // Test scenario 2: Settings > Connections > (delete the connected domain from the list) --> Should throw an error
        try {
          // The only way to ask user to login on Metamask is to ask for a connection, even if it was approved in the past.
          // At this stage, if the user already approved the connection in the past and connects to Metemask, he may leave the approval running in the background.
          const that = this;
          setTimeout(function() {
            if (!window.ethereum.selectedAddress) {
              that.accountLoadingObservable.next('enableWeb3');
            }
          }, 500);
          window.ethereum.enable();
        } catch (error) {
          if (!window.ethereum.selectedAddress) {
            this.utilService.openSnackBar(
              'The connection with your account has been refused by Metamask.'
            );
            console.error(error);
          }
        }
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
    if (accs[0] && this.accountObservable.value !== accs[0]) {
      this.accountLoadingObservable.next('connected');
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
        request.status = 'paid';
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
    refundAddress?: string,
    contract?: string
  ) {
    if (this.watchDog()) {
      return;
    }

    this.confirmTxOnLedgerMsg();
    if (Types.Role[role] === 0) {
      if (currency === 'ETH') {
        return this.requestNetwork.requestEthereumService.createRequestAsPayer(
          [payerAddress],
          [this.amountToBN(expectedAmount, currency)],
          undefined,
          [this.amountToBN(expectedAmount, currency)],
          undefined,
          JSON.stringify(requestOptions.data)
        );
      } else {
        return this.requestNetwork.requestERC20Service.createRequestAsPayer(
          contract,
          [payerAddress],
          [this.amountToBN(expectedAmount, currency)],
          paymentAddress,
          [this.amountToBN(expectedAmount, currency)],
          undefined,
          undefined,
          undefined,
          undefined,
          JSON.stringify(requestOptions.data)
        );
      }
    } else {
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

  public allowContract(
    currencyContract: string,
    amount: string,
    paymentAddress: string
  ) {
    if (this.watchDog()) {
      return;
    }
    this.confirmTxOnLedgerMsg();
    return this.requestNetwork.requestERC20Service.approveTokenFromTokenAddress(
      currencyContract,
      amount,
      { from: paymentAddress }
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
      // console.log('Error: ', err.message);
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
    return async (control: FormControl) => {
      if (control.value) {
        const currency =
          typeof curr === 'string'
            ? curr
            : curr.value === 'BTC'
              ? 'BTC'
              : 'ETH';
        const isEnsAddress = await this.getEnsAddress(control.value) != null;
        if (
          (currency === 'ETH' &&
            this.web3Ready &&
            !this.isAddress(control.value) && !isEnsAddress) ||
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

  getCurrencyAddress(currency: string) {
    const allContractAddresses = {
      REQ: {
        main: '0x8f8221afbb33998d8584a2b05749ba73c37a938a',
        erc20: '0xc77ceefa6960174accca0c6fdecb5dbd95042cda',
      },
      KNC: {
        main: '0xdd974d5c2e2928dea5f71b9825b8b646686bd200',
        erc20: '0xa9566758d054f6efcf9b00095538fda3d9d75844',
      },
      DGX: {
        main: '0x4f3afec4e5a3f2a6a1a411def7d7dfe50ee057bf',
        erc20: '0x891a1f07cbf6325192d830f4399932d4d1d66e89',
      },
      SAI: {
        main: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
        erc20: '0x3baa64a4401bbe18865547e916a9be8e6dd89a5a',
      },
      OMG: {
        main: '0xd26114cd6ee289accf82350c8d8487fedb8a0c07',
        erc20: '0xe44d5393cc60d67c7858aa75cf307c00e837f0e5',
      },
      ZRX: {
        main: '0xe41d2489571d322189246dafa5ebde1f4699f498',
        erc20: '0xbBE47EFe1A2cEf913562fE454f6EB75A9F75E6d6',
      },
      BAT: {
        main: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
        erc20: '0x3f90549bAF95c3c0b7E5bBB66B39EDaEfc7BD25e',
      },
      LINK: {
        main: '0x514910771af9ca656af840dff83e8264ecf986ca',
        erc20: '0x8f9224e619921923fcb0f2e1a31502bF22b87CFF',
      },
      RSR: {
        main: '0x8762db106b2c2a0bccb3a80d1ed41273552616e8',
        erc20: '0x548ac0ec13b132f3b58bd8afd83ebd2e225eb1a6',
      },
      DAI: {
        main: '0x6b175474e89094c44da98b954eedeac495271d0f',
        erc20: '0x62b37F0547047D99cC59e2F0db549Ab1D97149B5',
      },
    };

    return allContractAddresses[currency];
  }

  public async getBalance(currency) {
    if (currency === 'ETH') {
      const weiBalance = await this.web3.eth.getBalance(
        this.accountObservable.value
      );
      const balance = this.web3.utils.fromWei(weiBalance);
      return balance;
    } else {
      const currencyContract = this.getCurrencyAddress(currency).main;
      const contract = new this.web3.eth.Contract(
        this.minABI,
        currencyContract
      );
      const balance = await contract.methods
        .balanceOf(this.accountObservable.value)
        .call();
      const decimals = this.getDecimalsForCurrency(currency);
      const BN = this.web3.utils.BN;
      return new BN(balance);
    }
  }

  public addPendingRequestToCookie(request, txHash, queryParams, isSend) {
    let cookieList = [];
    if (this.cookieService.get('processing_requests')) {
      cookieList = JSON.parse(this.cookieService.get('processing_requests'));
    }
    let isNewRequest = true;
    const that = this;
    cookieList.forEach(element => {
      if (element.txid.split('?')[0] === txHash) {
        isNewRequest = false;
      }
    });
    if (isNewRequest) {
      const expectedAmount = request.payee.expectedAmount;
      cookieList.push({
        txid: txHash + '?request=' + queryParams,
        timestamp: request.data.data.date,
        payee: { address: request.payee.address },
        payer: request.payer,
        amount: expectedAmount,
        currency: request.currency,
        network: 4,
        status: 'pending',
        unread: true,
        isSend,
      });
      this.cookieService.set(
        'processing_requests',
        JSON.stringify(cookieList),
        1
      );
    }
  }

  public async getEnsAddress(address) {
    try {
      return await this.ens.resolver(address).addr();
    } catch (e) {
      return null;
    }
  }
}
