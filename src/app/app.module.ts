import { NgModule } from '@angular/core';
import { ClipboardModule } from 'ngx-clipboard';
import { PopoverModule } from 'ngx-popover';

import { SharedModule } from './shared/shared.module';

import { AppRoutingModule } from './app-routing.module';
import { UtilModule } from './util/util.module';

import { AppComponent } from './app.component';
import { ContactComponent } from './contact/contact.component';
import { HomeComponent } from './home/home.component';
import { RequestComponent } from './request/request.component';
import { SearchComponent } from './search/search.component';

import { LedgerDialogComponent } from './util/dialogs/ledger-dialog.component';
import { PayDialogComponent } from './util/dialogs/pay-dialog.component';
import { SubtractDialogComponent } from './util/dialogs/subtract-dialog.component';
import { AdditionalDialogComponent } from './util/dialogs/additional-dialog.component';
import { RefundDialogComponent } from './util/dialogs/refund-dialog.component';
import { AccountComponent } from './shared/account/account.component';


@NgModule({
  declarations: [
    AppComponent,
    ContactComponent,
    HomeComponent,
    RequestComponent,
    SearchComponent,

    LedgerDialogComponent,
    PayDialogComponent,
    SubtractDialogComponent,
    AdditionalDialogComponent,
    RefundDialogComponent,
    AccountComponent,
  ],
  imports: [
    // Feature Modules
    ClipboardModule,
    PopoverModule,

    // features
    SharedModule,
    UtilModule,

    // app
    AppRoutingModule,
  ],
  entryComponents: [
    LedgerDialogComponent,
    PayDialogComponent,
    SubtractDialogComponent,
    AdditionalDialogComponent,
    RefundDialogComponent
  ],
  providers: [UtilModule],
  bootstrap: [AppComponent]
})
export class AppModule {}
