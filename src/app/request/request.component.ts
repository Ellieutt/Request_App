import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Web3Service } from '../util/web3.service';
import blockies from 'blockies';

@Component({
  selector: 'app-request',
  templateUrl: './request.component.html',
  styleUrls: ['./request.component.scss'],
})
export class RequestComponent implements OnInit {
  account: string;
  mode: string;
  requestId: string;
  request: any;
  fromIcon;
  toIcon;
  objectKeys = Object.keys;
  progress;
  url: string;
  copyUrlTxt: string = 'Copy url';

  constructor(private web3Service: Web3Service, private router: Router, private route: ActivatedRoute) {
    this.url = `localhost:4200${this.router.url}`;
  }

  async ngOnInit() {
    // wait for web3 to be instantiated
    if (!this.web3Service || !this.web3Service.ready) {
      const delay = new Promise(resolve => setTimeout(resolve, 1000));
      await delay;
      return await this.ngOnInit();
    }

    // get request
    if (this.route.snapshot.params['requestId']) {
      this.requestId = this.route.snapshot.params['requestId'];
      this.request = await this.web3Service.getRequestAsync(this.requestId);
      console.log(this.request)
      if (this.request) {
        this.getBlockies();
        this.watchAccount();
        this.progress = 100 * this.request.amountPaid / this.request.amountInitial;
      }
    }
  }

  watchAccount() {
    if (!this.account && this.web3Service.accounts) {
      this.account = this.web3Service.accounts[0];
      this.getRequestMode()
    }
    this.web3Service.accountsObservable.subscribe((accounts) => {
      this.account = accounts[0];
      this.getRequestMode()
    });
  }

  getRequestMode() {
    if (this.account === this.request.payee) {
      return this.mode = 'payee';
    }
    if (this.account === this.request.payer) {
      return this.mode = 'payer'
    } else {
      return this.mode = 'none';
    }
  }

  getBlockies() {
    this.fromIcon = blockies({
      seed: this.request.payee.toLowerCase(),
    });
    this.toIcon = blockies({
      seed: this.request.payer.toLowerCase(),
    });
  }

  copyToClipboard() {
    this.copyUrlTxt = 'Copied!';
    setTimeout(() => { this.copyUrlTxt = 'Copy url' }, 500);
  }

  async cancelRequest() {
    await this.web3Service.cancelAsync(this.request.requestId);
  }

  async acceptRequest() {
    await this.web3Service.acceptAsync(this.request.requestId);
  }

  async payRequest() {
    await this.web3Service.payAsync(this.request.requestId, 1);
  }



}
