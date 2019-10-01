import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { PayWithRequestComponent } from './pay-with-request/pay-with-request.component';

import { LedgerDialogComponent } from './util/dialogs/ledger-dialog.component';
import { SendEmailDialogComponent } from './util/dialogs/send-email-dialog.component';
import { PayDialogComponent } from './util/dialogs/pay-dialog.component';
import { DisplayPayDialogComponent } from './util/dialogs/display-pay-dialog.component';
import { BroadcastDialogComponent } from './util/dialogs/broadcast-dialog.component';
import { SubtractDialogComponent } from './util/dialogs/subtract-dialog.component';
import { AdditionalDialogComponent } from './util/dialogs/additional-dialog.component';
import { RefundDialogComponent } from './util/dialogs/refund-dialog.component';

import { SharedModule } from './shared/shared.module';
import { UtilModule } from './util/util.module';
import { AppRoutingModule } from './app-routing.module';

declare global {
  interface Window { analytics: any; }
}

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,

    SharedModule,
    UtilModule,

    AppRoutingModule,
  ],
  declarations: [
    AppComponent,
    PayWithRequestComponent,
    SendEmailDialogComponent,
    LedgerDialogComponent,
    PayDialogComponent,
    DisplayPayDialogComponent,
    BroadcastDialogComponent,
    SubtractDialogComponent,
    AdditionalDialogComponent,
    RefundDialogComponent,
  ],
  entryComponents: [
    LedgerDialogComponent,
    SendEmailDialogComponent,
    PayDialogComponent,
    DisplayPayDialogComponent,
    BroadcastDialogComponent,
    SubtractDialogComponent,
    AdditionalDialogComponent,
    RefundDialogComponent,
  ],
  providers: [UtilModule],
  bootstrap: [AppComponent],
})
export class AppModule {}
