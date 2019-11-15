import { NgModule } from '@angular/core';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
// import { MatCheckboxModule } from '@angular/material/checkbox';
// import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
// import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
// import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
// import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSliderModule } from '@angular/material/slider';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatTreeModule } from '@angular/material/tree';

import { AccountComponent } from './account/account.component';
import { GasSelectorComponent } from './gas-selector/gas-selector.component';
import { RouterModule } from '@angular/router';
import { BlockiesModule } from 'angular-blockies';
import { PopoverModule } from 'ngx-popover';
import { QRCodeModule } from 'angularx-qrcode';

import { CurrencyConverterComponent } from './currency-converter/currency-converter.component';
import { RequestMetadataComponent } from './request-metadata/request-metadata.component';
import { RequestAddressesComponent } from './request-addresses/request-addresses.component';
import { PendingRequestsComponent } from './pending-requests/pending-requests.component';
import { ShortAddressPipe } from './short-address.pipe';
import { BlockiesComponent } from './blockies/blockies.component';
import { RequestAmountComponent } from './request-amount/request-amount.component';
import { RequestAddressComponent } from './request-address/request-address.component';
import { AddressBookComponent } from './address-book/address-book.component';
import { ClipboardModule } from 'ngx-clipboard';
import { NetworkIdentifierComponent } from './network-identifier/network-identifier.component';

@NgModule({
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    RouterModule,
    BlockiesModule,
    PopoverModule,
    QRCodeModule,
    ClipboardModule,
    MatButtonModule,
    MatCardModule,
    // MatCheckboxModule,
    // MatChipsModule,
    // MatListModule,
    // MatSidenavModule,
    // MatTabsModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatExpansionModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
    MatToolbarModule,
    MatTooltipModule,
    MatSliderModule,
    MatDividerModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatTreeModule,
  ],
  declarations: [
    AccountComponent,
    GasSelectorComponent,
    RequestMetadataComponent,
    CurrencyConverterComponent,
    RequestAddressesComponent,
    PendingRequestsComponent,
    ShortAddressPipe,
    BlockiesComponent,
    RequestAmountComponent,
    RequestAddressComponent,
    AddressBookComponent,
    NetworkIdentifierComponent,
  ],
  exports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    BlockiesModule,
    PopoverModule,
    QRCodeModule,

    AccountComponent,
    GasSelectorComponent,
    RequestMetadataComponent,
    RequestAmountComponent,
    BlockiesComponent,
    RequestAddressComponent,
    CurrencyConverterComponent,
    RequestAddressesComponent,
    PendingRequestsComponent,
    AddressBookComponent,
    MatButtonModule,
    MatCardModule,
    // MatCheckboxModule,
    // MatChipsModule,
    MatDialogModule,
    MatExpansionModule,
    MatIconModule,
    MatMenuModule,
    MatInputModule,
    // MatListModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    // MatSidenavModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
    // MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    MatSliderModule,
    MatDividerModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatTreeModule,
    NetworkIdentifierComponent,
  ],
})
export class SharedModule {}
