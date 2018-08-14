import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder
} from '@angular/forms';
import { Web3Service } from '../../util/web3.service';

@Component({
  templateUrl: './broadcast-dialog.component.html'
})
export class BroadcastDialogComponent implements OnInit {
  signedRequestObject: any;
  requestData: any;
  loading: boolean;
  allowanceMode: boolean;
  isAllowanceGranted: boolean;
  callbackTx: any;
  gasPrice: number

  constructor(
    public web3Service: Web3Service,
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<BroadcastDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    this.callbackTx = data.callbackTx;
    this.signedRequestObject = data.signedRequestObject;
    this.requestData = data.signedRequestObject.signedRequestData;
    this.gasPrice = data.gasPrice;
    this.loading = false;
    this.isAllowanceGranted = false;

    this.allowanceMode =
      this.requestData.currency !== 'ETH' && this.requestData.currency !== 'BTC'
        ? true
        : false;
  }

  async ngOnInit() {
    if (!this.web3Service || !this.web3Service.web3Ready) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.ngOnInit();
    }
  }

  submitAllowance() {
    if (this.loading || this.web3Service.watchDog()) {
      return;
    }
    this.loading = true;
    this.web3Service
      .allowSignedRequest(this.requestData, this.requestData.expectedAmounts[0])
      .on('broadcasted', txHash => {
        this.loading = false;
        this.isAllowanceGranted = true;
      })
      .catch(err => {
        this.loading = false;
        this.callbackTx(err);
      });
  }

  submitBroadcast() {
    if (this.loading || this.web3Service.watchDog()) {
      return;
    }
    this.loading = true;
    this.web3Service
      .broadcastSignedRequestAsPayer(
        this.signedRequestObject,
        this.requestData.expectedAmounts,
        {
          transactionOptions: {
            gasPrice: this.gasPrice,
            skipERC20checkAllowance: true
      }
    }
      )
      .on('broadcasted', response => {
        this.dialogRef.close(response.transaction.hash);
      })
      .catch(err => {
        this.loading = false;
        this.callbackTx(err);
      });
  }
}
