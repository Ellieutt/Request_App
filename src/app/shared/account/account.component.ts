import { Component } from '@angular/core';

import { Web3Service } from '../../util/web3.service';
import { UtilService } from '../../util/util.service';
import { MatDialog } from '@angular/material';
import { LedgerDialogComponent } from '../../util/dialogs/ledger-dialog.component';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
})
export class AccountComponent {
  constructor(
    public web3Service: Web3Service,
    private dialog: MatDialog,
    private utilService: UtilService
  ) {
    this.web3Service.accountLoadingObservable.subscribe(value => {
      if (value == 'enableWeb3' || value == 'noWeb3') {
        this.openModal();
      } else {
        this.closeModal();
      }
    });
  }

  public accountModalOpen = false;

  openLedgerDialog() {
    this.dialog.open(LedgerDialogComponent, {
      hasBackdrop: true,
      width: '500px',
    });
  }

  closeModal() {
    this.accountModalOpen = false;
  }
  openModal() {
    this.accountModalOpen = true;
  }
}
