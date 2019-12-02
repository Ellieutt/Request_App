import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder,
  ValidationErrors,
} from '@angular/forms';
import { Web3Service } from '../../util/web3.service';
import { UtilService } from '../../util/util.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  date: number = new Date().getTime();
  account: string;
  createLoading = false;
  requestForm: FormGroup;
  expectedAmountFormControl: FormControl;
  payeeIdAddressFormControl: FormControl;
  payeePaymentAddressFormControl: FormControl;
  payerAddressFormControl: FormControl;
  payerRefundAddressFormControl: FormControl;
  reasonFormControl: FormControl;
  dateFormControl: FormControl;
  currencyFormControl: FormControl;
  BTCRefundAddress;
  payeeOrPayer: string;
  isRequestForm = true;

  sameAddressValidator(control: FormControl) {
    if (control.value) {
      if (
        this.payeeIdAddressFormControl.value &&
        this.payeeIdAddressFormControl.value.toLowerCase() ===
          control.value.toLowerCase()
      ) {
        return { sameAddressAsPayeeAddress: true };
      } else if (
        this.payeePaymentAddressFormControl.value &&
        this.payeePaymentAddressFormControl.value.toLowerCase() ===
          control.value.toLowerCase()
      ) {
        return { sameAddressAsPaymentAddress: true };
      }
    }
    return null;
  }

  constructor(
    public web3Service: Web3Service,
    private utilService: UtilService,
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    setInterval(() => {
      this.date = new Date().getTime();
    }, 5000);
    this.utilService.setSearchValue('');

    this.currencyFormControl = new FormControl('ETH', [Validators.required]);
    this.payeeIdAddressFormControl = new FormControl('', [Validators.required]);
    this.payeePaymentAddressFormControl = new FormControl('', [
      Validators.required,
      this.web3Service.isAddressValidator(this.currencyFormControl),
    ]);
    this.expectedAmountFormControl = new FormControl('', [
      Validators.required,
      this.web3Service.decimalValidator(this.currencyFormControl),
    ]);
    this.payerAddressFormControl = new FormControl('', [
      Validators.required,
      this.sameAddressValidator.bind(this),
      this.web3Service.isAddressValidator('ETH'),
    ]);
    this.payerRefundAddressFormControl = new FormControl('', [
      this.web3Service.isAddressValidator(this.currencyFormControl),
      this.sameAddressValidator.bind(this),
    ]);
    this.dateFormControl = new FormControl('');
    this.reasonFormControl = new FormControl('');

    this.payeePaymentAddressFormControl.valueChanges.subscribe(() =>
      this.payerAddressFormControl.updateValueAndValidity()
    );

    this.requestForm = this.formBuilder.group({
      currency: this.currencyFormControl,
      payeePaymentAddress: this.payeePaymentAddressFormControl,
      payeeIdAddress: this.payeeIdAddressFormControl,
      expectedAmount: this.expectedAmountFormControl,
      payerAddress: this.payerAddressFormControl,
      payerRefundAddress: this.payerRefundAddressFormControl,
      date: this.dateFormControl,
      reason: this.reasonFormControl,
    });
  }

  showRequestForm() {
    this.isRequestForm = true;
  }

  showPaymentForm() {
    this.isRequestForm = false;
    this.payeePaymentAddressFormControl.setValue(this.account);
  }

  clickRequest() {
    this.payeeOrPayer = 'Payee';
    this.createRequest();
  }

  clickSend() {
    if (!this.isFormValid()) {
      return;
    }
    this.createLoading = false;
    this.payeeOrPayer = 'Payer';
    this.sendTrigger();
  }

  async sendTrigger() {
    const currency = this.currencyFormControl.value;
    if (currency === 'ETH') {
      const balance = await this.web3Service.getBalance(currency);
      const parsedBalance = parseFloat(balance);
      const formBalance = parseFloat(this.expectedAmountFormControl.value);
      if (parsedBalance >= formBalance) {
        return this.createRequest(true);
      } else {
        this.createLoading = false;
        return this.utilService.openSnackBar(
          'You do not have enough ' + currency + ' to make this payment.'
        );
      }
    } else {
      const balance = await this.web3Service.getBalance(currency);

      const contract = this.web3Service.getCurrencyAddress(currency).erc20;
      const main = this.web3Service.getCurrencyAddress(currency).main;
      const allowance = await this.web3Service.getAllowance(contract);
      const allowanceNeeded = this.web3Service.amountToBN(
        this.expectedAmountFormControl.value,
        this.currencyFormControl.value
      );
      if (balance.gte(allowanceNeeded)) {
        if (allowance >= allowanceNeeded) {
          // Create Request
          this.createRequest(true);
        } else {
          // this.web3Service.allow(contract, this.expectedAmountFormControl.value, null);
          this.web3Service
            .allowContract(
              main,
              allowanceNeeded,
              this.payeePaymentAddressFormControl.value
            )
            .on('broadcasted', txHash => {
              this.createRequest(true);
            })
            .catch(err => {
              this.createLoading = false;
              return this.utilService.openSnackBar(err.message);
            });
        }
      } else {
        this.createLoading = false;
        return this.utilService.openSnackBar(
          'You do not have enough ' + currency + ' to make this payment.'
        );
      }
    }
  }

  getNetworkValue() {
    return this.web3Service.networkIdObservable.value;
  }

  onCurrencyChange(event) {
    if (event.value === 'DAI') {
      this.utilService.openSnackBar(
        'Note: You have selected Multi-Collateral Dai (MCD). If you would like to use Single-Collateral Dai, please select SAI.'
      );
    }
    this.payerRefundAddressFormControl.setValue('');
    this.payerRefundAddressFormControl.updateValueAndValidity();
    this.payeePaymentAddressFormControl.updateValueAndValidity();
    this.expectedAmountFormControl.updateValueAndValidity();
  }

  getBlockchainSymbol() {
    return this.currencyFormControl.value === 'BTC' ? 'BTC' : 'ETH';
  }

  async ngOnInit() {
    if (!this.web3Service || !this.web3Service.web3Ready) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.ngOnInit();
    }
    window.analytics.page('/');
    this.watchAccount();
  }

  watchAccount() {
    this.web3Service.accountObservable.subscribe(account => {
      this.payeePaymentAddressFormControl.setValue(account);
      this.account = account;
      this.payeeIdAddressFormControl.setValue(this.account);
      this.payerAddressFormControl.updateValueAndValidity();
      this.setValueFromQueryParams();
    });
  }

  setValueFromQueryParams() {
    const retryParamsObj = this.router.url.split('/');
    if (retryParamsObj.length > 1) {
      const retryParams = new URLSearchParams(retryParamsObj[1]);
      if (retryParams.has('amount')) {
        this.expectedAmountFormControl.setValue(retryParams.get('amount'));
      }
      if (retryParams.has('payer')) {
        this.payerAddressFormControl.setValue(retryParams.get('payer'));
      }
      if (retryParams.has('reason')) {
        this.reasonFormControl.setValue(retryParams.get('reason'));
      }
      if (retryParams.has('currency')) {
        this.currencyFormControl.setValue(retryParams.get('currency'));
      }
    }
  }

  isFormValid() {
    this.createLoading = true;
    if (!this.requestForm.valid) {
      if (this.expectedAmountFormControl.hasError('required')) {
        this.expectedAmountFormControl.markAsTouched();
        this.expectedAmountFormControl.setErrors({ required: true });
      }
      if (this.payerAddressFormControl.hasError('required')) {
        this.payerAddressFormControl.markAsTouched();
        this.payerAddressFormControl.setErrors({ required: true });
      }
      this.createLoading = false;
      return false;
    }
    return true;
  }

  createRequest(isSend = false) {
    if (this.createLoading || this.web3Service.watchDog()) {
      return;
    }
    if (!this.isFormValid()) {
      return;
    }
    this.dateFormControl.setValue(this.date);

    const data = {};
    for (const [key, value] of Object.entries(this.requestForm.value)) {
      if (
        ![
          'expectedAmount',
          'payerAddress',
          'payeePaymentAddress',
          'payeeIdAddress',
          'payerRefundAddress',
          'currency',
        ].includes(key) &&
        value &&
        value !== ''
      ) {
        data[key] = value;
      }
    }

    data['miscellaneous'] = { builderId: 'app.request.network' };

    const callback = response => {
      this.createLoading = false;

      if (response.transaction) {
        const request = {
          payee: {
            address: this.payeeIdAddressFormControl.value,
            balance: this.expectedAmountFormControl.value,
            expectedAmount: this.expectedAmountFormControl.value,
          },
          currencyContract: {
            payeePaymentAddress:
              this.payeePaymentAddressFormControl.value &&
              this.payeePaymentAddressFormControl.value !== this.account
                ? this.payeePaymentAddressFormControl.value
                : null,
          },
          currency: this.currencyFormControl.value,
          payer: this.payerAddressFormControl.value,
          data: { data: {} },
        };

        for (const key of Object.keys(data)) {
          request.data.data[key] = data[key];
        }

        this.web3Service.addPendingRequestToCookie(request, response.transaction.hash, btoa(JSON.stringify(request)), isSend);

        return this.router.navigate(
          ['/request/txHash', response.transaction.hash],
          {
            queryParams: { request: btoa(JSON.stringify(request)) },
          }
        );
      } else if (response.message) {
        if (response.message.includes('6985')) {
          return this.utilService.openSnackBar(
            'Invalid status 6985. User denied transaction.'
          );
        } else if (response.message.includes('newBlockHeaders')) {
          return;
        } else if (
          response.message.startsWith(
            'Returned error: Error: MetaMask Tx Signature'
          )
        ) {
          return this.utilService.openSnackBar(
            'MetaMask Tx Signature: User denied transaction signature.'
          );
        } else {
          console.error(response);
          return this.utilService.openSnackBar(response.message);
        }
      }
    };

    const currencyAddress =
      this.currencyFormControl.value !== 'ETH'
        ? this.web3Service.getCurrencyAddress(this.currencyFormControl.value)
            .main
        : null;

    this.web3Service
      .createRequest(
        this.payeeOrPayer,
        this.payerAddressFormControl.value,
        this.expectedAmountFormControl.value,
        this.currencyFormControl.value,
        this.payeePaymentAddressFormControl.value,
        { data },
        this.payerRefundAddressFormControl.value,
        currencyAddress
      )
      .on('broadcasted', response => {
        callback(response);
      })
      .catch(err => {
        callback(err);
      });
  }
}
