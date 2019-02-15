import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder,
} from '@angular/forms';
import { Web3Service } from '../../util/web3.service';

@Component({
  templateUrl: './broadcast-dialog.component.html',
})
export class BroadcastDialogComponent implements OnInit {
  signedRequestObject: any;
  requestData: any;
  loading: boolean;
  allowanceMode: boolean;
  isAllowanceGranted: boolean;
  callbackTx: any;
  currencyContract: any;

  constructor(
    public web3Service: Web3Service,
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<BroadcastDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    this.callbackTx = data.callbackTx;
    this.signedRequestObject = data.signedRequestObject;
    this.requestData = data.signedRequestObject.signedRequestData;
    this.loading = true;
    this.isAllowanceGranted = false;
    this.currencyContract = this.requestData.currencyContract;
    this.allowanceMode =
      this.requestData.currency !== 'ETH' && this.requestData.currency !== 'BTC'
        ? true
        : false;
    this.checkAllowance();
  }

  async checkAllowance() {
    const allowance = await this.web3Service.getAllowance(
      this.currencyContract
    );
    if (allowance >= this.requestData.expectedAmounts[0]) {
      this.isAllowanceGranted = true;
    }
    this.loading = false;
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
        this.requestData.expectedAmounts
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
