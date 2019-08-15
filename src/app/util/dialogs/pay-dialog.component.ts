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
  templateUrl: './pay-dialog.component.html',
})
export class PayDialogComponent implements OnInit {
  requestObject: any;
  request: any;
  payForm: FormGroup;
  amountFormControl: FormControl;
  loading: boolean;
  allowanceMode: boolean;
  isAllowanceGranted: boolean;
  callbackTx: any;

  constructor(
    public web3Service: Web3Service,
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<PayDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    this.requestObject = data.requestObject;
    this.request = data.requestObject.requestData;
    this.callbackTx = data.callbackTx;
    this.loading = false;
    this.isAllowanceGranted = false;

    this.allowanceMode =
      this.request.currency !== 'ETH' && this.request.currency !== 'BTC'
        ? true
        : false;
  }

  ngOnInit() {
    const initialAmountValue = this.request.payee.expectedAmount.gt(
      this.request.payee.balance
    )
      ? this.web3Service.BNToAmount(
          this.request.payee.expectedAmount.sub(this.request.payee.balance),
          this.request.currency
        )
      : '0';

    this.amountFormControl = new FormControl(initialAmountValue, [
      Validators.required,
      Validators.pattern('[0-9]*([.][0-9]{0,18})?$'),
    ]);

    this.payForm = this.formBuilder.group({
      amountFormControl: this.amountFormControl,
    });
  }

  setMax() {
    this.amountFormControl.setValue(
      this.web3Service.BNToAmount(
        this.request.payee.expectedAmount.sub(this.request.payee.balance),
        this.request.currency
      )
    );
  }

  submitAllowance() {
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.web3Service
      .allow(this.request.requestId, this.amountFormControl.value)
      .on('broadcasted', txHash => {
        this.loading = false;
        this.isAllowanceGranted = true;
      })
      .catch(err => {
        this.loading = false;
        this.callbackTx(err);
      });
  }

  submitPay() {
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.web3Service
      .pay(this.requestObject, this.amountFormControl.value)
      .on('broadcasted', response => {
        this.callbackTx(
          response,
          'Your payment is being processed. Please wait a few moments for it to appear on the Blockchain.'
        );
        this.dialogRef.close();
      })
      .catch(err => {
        this.loading = false;
        this.callbackTx(err);
      });
  }
}
