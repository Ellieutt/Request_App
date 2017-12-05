import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Web3Service } from '../util/web3.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { PayDialogComponent } from './dialog/pay-dialog.component';
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
  progress;
  url: string;
  copyUrlTxt: string = 'Copy url';
  // payDialogRef: MatDialogRef < PayDialogComponent > ;
  files = [];


  constructor(private web3Service: Web3Service, private router: Router, private route: ActivatedRoute, private dialog: MatDialog) {
    this.url = `localhost:4200${this.router.url}`;
  }

  async ngOnInit() {
    // wait for web3 to be instantiated
    if (!this.web3Service || !this.web3Service.ready) {
      const delay = new Promise(resolve => setTimeout(resolve, 1000));
      await delay;
      return await this.ngOnInit();
    }

    this.web3Service.searchValue.subscribe(async searchValue => {
      if (!searchValue) return;
      let result = await this.web3Service.getRequestAsync(searchValue);
      if (!result || !result.requestId || result.creator === '0x0000000000000000000000000000000000000000') {
        this.request = { 'requestId': null };
      } else {
        this.request = result;
        this.calculateInfo();
      }
    })

    if (this.route.snapshot.params['requestId']) {
      this.web3Service.setSearchValue(this.route.snapshot.params['requestId']);
    }
  }

  calculateInfo() {
    if (this.request && this.request.requestId) {
      this.getBlockies();
      this.watchAccount();
      this.progress = 100 * this.request.amountPaid / this.request.amountInitial;
    }
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

  goHome() {
    this.router.navigate(['/']);
  }

  openAddFileDialog() {
    let payDialogRef = this.dialog.open(PayDialogComponent, {
      hasBackdrop: true,
      data: {
        request: this.request
      }
    });

    // payDialogRef
    //   .afterClosed()
    //   .pipe(filter(name => name))
    //   .subscribe(name => {
    //     this.files.push({ name, content: '' })
    //     console.log(this.files);
    //   });

  }


}
