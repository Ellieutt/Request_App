import { Component, Inject, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Web3Service } from '../util/web3.service';
import { BroadcastDialogComponent } from '../util/dialogs/broadcast-dialog.component';
import { MatDialog } from '@angular/material';
import { SignedRequest } from '@requestnetwork/request-network.js';
import { UtilService } from '../util/util.service';

@Component({
  selector: 'app-pay-with-request',
  templateUrl: './pay-with-request.component.html',
  styleUrls: ['./pay-with-request.component.scss'],
})
export class PayWithRequestComponent implements OnInit {
  Object = Object;
  signedRequestObject: any;
  signedRequest: any;
  ipfsData: any;
  callbackUrl: string;
  requestNetworkId: number;
  queryParamError: boolean;
  redirectUrl: string;

  date = new Date();

  constructor(
    @Inject(DOCUMENT) private document: any,
    public web3Service: Web3Service,
    public router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private utilService: UtilService
  ) {}

  async ngOnInit() {
    if (!this.web3Service || !this.web3Service.web3Ready) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.ngOnInit();
    }

    const queryParams = JSON.parse(atob(this.route.snapshot.params.data));
    if (
      !queryParams ||
      !queryParams.callbackUrl ||
      !queryParams.signedRequest ||
      !queryParams.networkId
    ) {
      return (this.queryParamError = true);
    }

    this.callbackUrl = queryParams.callbackUrl;
    this.requestNetworkId = queryParams.networkId;

    // reload requestObject with its web3 if account has changed
    this.web3Service.accountObservable.subscribe(account => {
      this.signedRequestObject = new SignedRequest(queryParams.signedRequest);
    });

    this.signedRequest = this.signedRequestObject.signedRequestData;
    this.signedRequest.currency = this.web3Service.currencyFromContractAddress(
      this.signedRequest.currencyContract
    );
    this.loadIpfsData(queryParams.signedRequest.data);

    this.web3Service.networkIdObservable.subscribe(networkId => {
      if (networkId !== this.requestNetworkId) {
        this.utilService.openSnackBar(
          `Wrong network detected, please switch to ${this.getNetworkName(
            this.requestNetworkId
          )}`
        );
        // const test = this.signedRequestObject.isValid(account);
      }
    });
  }

  get amount() {
    return this.web3Service.BNToAmount(
      this.web3Service.getTotalBNFromAmounts(
        this.signedRequest.expectedAmounts
      ),
      this.signedRequest.currency
    );
  }

  get currency() {
    return this.signedRequest.currency;
  }

  async loadIpfsData(data: any) {
    if (!data) return;
    this.ipfsData = await this.web3Service.getIpfsData(data);
  }

  getNetworkName(networkId) {
    switch (networkId) {
      case 1:
        return 'Mainnet';
      case 4:
        return 'Rinkeby testnet';
    }
  }

  acceptAndPay() {
    if (this.web3Service.networkIdObservable.value !== this.requestNetworkId) {
      return this.utilService.openSnackBar(
        `Wrong network detected, please switch to ${this.getNetworkName(
          this.requestNetworkId
        )}`
      );
    }

    const callbackTx = err => {
      if (err.message.startsWith('Invalid status 6985')) {
        this.utilService.openSnackBar(
          'Invalid status 6985. User denied transaction.'
        );
      } else if (
        err.message.startsWith('Failed to subscribe to new newBlockHeaders')
      ) {
        return;
      } else if (err.message.startsWith('_from must be different')) {
        this.utilService.openSnackBar(
          `You can't create a request to yourself. Please specify a different Payer.`
        );
      } else if (err.message.startsWith('balance of token is too low')) {
        this.utilService.openSnackBar(
          'Insufficient funds, check your token balance '
        );
      } else if (
        err.message.startsWith('Returned error: Error: MetaMask Tx Signature')
      ) {
        this.utilService.openSnackBar(
          'MetaMask Tx Signature: User denied transaction signature.'
        );
      } else {
        console.error(err);
        this.utilService.openSnackBar(err.message);
      }
    };

    this.dialog
      .open(BroadcastDialogComponent, {
        hasBackdrop: true,
        width: '350px',
        autoFocus: false,
        data: {
          callbackTx,
          signedRequestObject: this.signedRequestObject,
        },
      })
      .afterClosed()
      .subscribe(txHash => {
        if (txHash) {
          this.redirectUrl = `${this.callbackUrl}${txHash}`;
          setTimeout(
            _ => (this.document.location.href = `${this.callbackUrl}${txHash}`),
            5000
          );
        }
      });
  }

  cancelRequest() {
    this.document.location.href = `${this.callbackUrl}${encodeURIComponent(
      JSON.stringify({ signedRequest: this.signedRequest })
    )}`;
  }
}
