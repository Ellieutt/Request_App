import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { Web3Service } from '../util/web3.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  accounts: string[];
  date: Date;

  requestForm: FormGroup;
  amountFormControl = new FormControl('', [Validators.required]);
  payerAddressFormControl = new FormControl('', []);
  reasonFormControl = new FormControl('', []);
  currency = new FormControl('ETH', []);

  currencies = [{ name: 'ether', iso: 'ETH' }];

  constructor(private web3Service: Web3Service, private formBuilder: FormBuilder, private router: Router) {
    setInterval(() => { this.date = new Date() }, 1000);
  }

  ngOnInit(): void {
    this.requestForm = this.formBuilder.group({
      amount: this.amountFormControl,
      payerAddress: this.payerAddressFormControl,
      reason: this.reasonFormControl,
    });
  }

  async createRequest() {
    let result = await this.web3Service.createRequestAsPayeeAsync(this.payerAddressFormControl.value, this.amountFormControl.value, `{"reason": "${this.reasonFormControl.value}", "date": "${this.date}"}`);
    if (result && result.request && result.request.requestId) {
      this.router.navigate(['/request', result.request.requestId]);
    }
  }

}
