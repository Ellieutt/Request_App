import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { EmailService } from '../../util/email.service';

@Component({
  templateUrl: './send-email-dialog.component.html',
})
export class SendEmailDialogComponent {

    email: string;
    currency: string;
    reason: string;
    amount: string;
    url: string;

  constructor(
    private dialogRef: MatDialogRef<SendEmailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private emailService: EmailService
  ) {
      this.email = data.email;
      this.currency = data.currency;
      this.reason = data.reason;
      this.amount = data.amount;
      this.url = data.url;
  }

  async sendMail() {
    const currency = this.currency;
    const reason = this.reason ? this.reason : 'N/A';
    const url = this.url;
    const amount = this.amount;

    const postData = {
      to_mail: this.email,
      amount,
      currency,
      reason,
      payment_url: url
    };

    console.log(postData);

    this.emailService.sendEmail(postData);
    this.emailService.emailObservable.subscribe({
      next: success => {
        if (success) {
          this.dialogRef.close();
        }
      },
      error: err => {
        alert(err.statusText);
      },
    });
  }
}
