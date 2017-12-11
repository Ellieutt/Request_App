import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Web3Service } from './util/web3.service'
import { MatSnackBar } from '@angular/material';
import blockies from 'blockies';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {

  accounts: string[];
  account: string;
  searchValue: string;
  metamaskReady: boolean = true;
  icon;

  constructor(public snackBar: MatSnackBar, private web3Service: Web3Service, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.watchAccount();

    this.web3Service.searchValue.subscribe(async(searchValue) => {
      this.searchValue = searchValue;
    })

    this.web3Service.metamaskReady.subscribe((metamaskReady) => {
      if (!metamaskReady && this.metamaskReady != metamaskReady) {
        this.openSnackBar('You need to connect your Metamask wallet to create a Request.', 'Ok');
      }
      this.metamaskReady = metamaskReady;
    })
  }

  watchAccount() {
    this.web3Service.accountsObservable.subscribe((accounts) => {
      this.accounts = accounts;
      this.account = accounts[0];
      this.icon = this.account ? blockies({
        seed: this.account.toLowerCase(),
      }) : null;
    });
  }

  openSnackBar(msg:string, ok:string) {
    this.snackBar.open(msg, ok, {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: 'warning-snackbar',
    });
  }

  search() {
    this.web3Service.setSearchValue(this.searchValue);
    if (this.searchValue && this.searchValue.length <= 42)
      this.router.navigate(['/search', this.searchValue]);
    else if (this.searchValue)
      this.router.navigate(['/request/requestId', this.searchValue]);
  }

  goHome() {
    this.router.navigate(['/']);
  }

}
