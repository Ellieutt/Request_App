import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ClipboardModule } from 'ngx-clipboard';
import { PopoverModule } from 'ngx-popover';

import { SharedModule } from './shared/shared.module';

import { AppRoutingModule } from './app-routing.module';
import { UtilModule } from './util/util.module';
import { PayDialogComponent } from './request/dialog/pay-dialog.component';
import { SubtractDialogComponent } from './request/dialog/subtract-dialog.component';
import { AdditionalDialogComponent } from './request/dialog/additional-dialog.component';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { RequestComponent } from './request/request.component';
import { SearchComponent } from './search/search.component';



@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    RequestComponent,
    SearchComponent,
    PayDialogComponent,
    SubtractDialogComponent,
    AdditionalDialogComponent
  ],
  imports: [
    // angular
    BrowserAnimationsModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,

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
    // dialog
    PayDialogComponent,
    SubtractDialogComponent,
    AdditionalDialogComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
