import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Web3Service } from '../util/web3.service';
import { MatSnackBar, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { PayDialogComponent } from './dialog/pay-dialog.component';
import { UpdateDialogComponent } from './dialog/update-dialog.component';

import blockies from 'blockies';

@Component({
  selector: 'app-request',
  templateUrl: './request.component.html',
  styleUrls: ['./request.component.scss'],
})
export class RequestComponent implements OnInit {
  account: string;
  mode: string;
  request: any;
  fromIcon;
  toIcon;
  objectKeys = Object.keys;
  progress: number;
  url: string;
  copyUrlTxt: string = 'Copy url';
  files = [];
  txHash: string;


  constructor(public snackBar: MatSnackBar, private web3Service: Web3Service, private route: ActivatedRoute, private dialog: MatDialog) {
    this.url = window.location.href;
  }

  async ngOnInit() {
    // wait for web3 to be instantiated
    if (!this.web3Service || !this.web3Service.accounts) {
      const delay = new Promise(resolve => setTimeout(resolve, 1000));
      await delay;
      return await this.ngOnInit();
    }

    // subscribe to searchbar queries
    this.web3Service.searchValue.subscribe(async searchValue => {
      if (!searchValue) return;
      let result = await this.web3Service.getRequestAsync(searchValue);

      if (!result || !result.requestId || result.creator == '0x0000000000000000000000000000000000000000') {
        this.request = { 'requestId': null };
      } else {
        this.setRequest(result);
      }
    })

    // subscribe to transaction in progress
    this.web3Service.request.subscribe(request => {
      if (this.txHash && request.requestId && (request.transactionHash == this.txHash || this.request && request.requestId == this.request.requestId))
        // window.location.reload();
        this.setRequest(request);
    })

    // if url with /requestId
    if (this.route.snapshot.params['requestId']) {
      this.web3Service.setSearchValue(this.route.snapshot.params['requestId']);
    }

    // if url with /txHash
    if (this.route.snapshot.params['txHash']) {
      this.txHash = this.route.snapshot.params['txHash'];
      // if queryParams get Request from queryParams
      if (Object.keys(this.route.snapshot.queryParams).length > 0 && this.route.snapshot.queryParams.expectedAmount && this.route.snapshot.queryParams.payer && this.route.snapshot.queryParams.payee) {
        let queryRequest = {
          requestId: 'waiting for blockchain response',
          expectedAmount: this.route.snapshot.queryParams.expectedAmount,
          balance: 0,
          payer: this.route.snapshot.queryParams.payer,
          payee: this.route.snapshot.queryParams.payee,
          data: { data: {} }
        }
        Object.keys(this.route.snapshot.queryParams).forEach((key) => {
          if (!queryRequest[key])
            queryRequest.data.data[key] = this.route.snapshot.queryParams[key];
        })
        this.setRequest(queryRequest);
      }

      // get Request from txHash
      let result = await this.web3Service.getRequestByTransactionHashAsync(this.txHash);
      if (result && result.requestId) {
        this.setRequest(result);
      } else if (result.message) {
        this.snackBar.open(result.message, 'Ok', { duration: 5000 });
      }
    }
  }


  setRequest(request) {
    if (request.state && request.requestId) this.url = `${window.location.protocol}//${window.location.host}/request/requestId/${request.requestId}`;
    this.request = request;
    this.getBlockies();
    this.watchAccount();
    this.progress = 100 * this.request.balance / this.request.expectedAmount;
  }


  watchAccount() {
    if (!this.account && this.web3Service.accounts) {
      this.account = this.web3Service.accounts[0];
      this.getRequestMode()
    }
    this.web3Service.accountsObservable.subscribe(accounts => {
      this.account = accounts[0];
      this.getRequestMode()
    });
  }


  getRequestMode() {
    return this.mode = this.account && this.account == this.request.payee ? 'payee' : this.account && this.account == this.request.payer ? 'payer' : 'none';
  }


  getBlockies() {
    this.fromIcon = blockies({ seed: this.request.payee.toLowerCase() });
    this.toIcon = blockies({ seed: this.request.payer.toLowerCase() });
  }


  copyToClipboard() {
    this.copyUrlTxt = 'Copied!';
    setTimeout(() => { this.copyUrlTxt = 'Copy url' }, 500);
  }


  callbackTx(response) {
    if (response.transactionHash) {
      this.txHash = response.transactionHash;
      this.snackBar.open('Transaction in progress', 'Ok', { duration: 3000 });
    } else if (response.message) {
      this.snackBar.open(response.message, 'Ok', { duration: 5000 });
    }
  };



  cancelRequest() {
    this.web3Service.cancel(this.request.requestId, response => this.callbackTx(response));
  }


  acceptRequest() {
    this.web3Service.accept(this.request.requestId, response => this.callbackTx(response));
  }


  updateRequest() {
    let updateDialogRef = this.dialog.open(UpdateDialogComponent, {
      hasBackdrop: true,
      width: '300px',
      data: {
        request: this.request
      }
    });

    updateDialogRef
      .afterClosed()
      .subscribe(subtractValue => {
        this.web3Service.subtractAction(this.request.requestId, subtractValue, response => this.callbackTx(response));
      });
  }


  payRequest() {
    let payDialogRef = this.dialog.open(PayDialogComponent, {
      hasBackdrop: true,
      width: '300px',
      data: {
        request: this.request
      }
    });

    payDialogRef
      .afterClosed()
      .subscribe(amountValue => {
        this.web3Service.paymentAction(this.request.requestId, amountValue, response => this.callbackTx(response));
      });
  }


}
