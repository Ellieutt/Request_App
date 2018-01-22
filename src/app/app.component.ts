import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { Web3Service } from './util/web3.service';
import { BasicDialogComponent } from './util/dialogs/basic-dialog.component';
import blockies from 'blockies';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {

  blockies = blockies;
  accounts: string[];
  account = 'loading';
  searchForm: FormGroup;
  searchValueFormControl: FormControl;


  constructor(private web3Service: Web3Service, private formBuilder: FormBuilder, public router: Router, private route: ActivatedRoute, private dialog: MatDialog) {}


  ngOnInit() {
    this.watchAccount();

    this.searchValueFormControl = new FormControl('');
    this.searchForm = this.formBuilder.group({
      searchValueFormControl: this.searchValueFormControl
    });

    this.web3Service.searchValue.subscribe(searchValue => {
      this.searchValueFormControl.setValue(searchValue);
    });
  }


  watchAccount() {
    this.web3Service.accountsObservable.subscribe(accounts => {
      this.accounts = accounts;
      this.account = accounts[0];
    });
  }


  search(searchValue) {
    searchValue = searchValue.split(' ').join('');
    if (this.router.routerState.snapshot.url.startsWith('/request')) {
      if (searchValue.length <= 42) {
        this.router.navigate(['/search', searchValue]);
      } else {
        this.web3Service.setSearchValue(searchValue);
      }
    } else if (this.router.routerState.snapshot.url.startsWith('/search')) {
      if (searchValue.length > 42) {
        this.router.navigate(['/request/requestId', searchValue]);
      } else {
        this.web3Service.setSearchValue(searchValue);
      }
    } else {
      if (searchValue.length <= 42) {
        this.router.navigate(['/search', searchValue]);
      } else if (searchValue.length > 42) {
        this.router.navigate(['/request/requestId', searchValue]);
      }
    }
  }


}
