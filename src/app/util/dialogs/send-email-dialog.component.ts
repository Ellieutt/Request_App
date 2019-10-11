import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { EmailService } from '../../util/email.service';
import { UtilService } from '../../util/util.service';
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder,
  ValidationErrors,
} from '@angular/forms';

@Component({
  templateUrl: './send-email-dialog.component.html',
})
export class SendEmailDialogComponent {
  email: string;
  currency: string;
  reason: string;
  amount: string;
  url: string;
  sendToEmail: string;
  from_address: string;
  emailForm: FormGroup;
  toEmailFormControl: FormControl;

  constructor(
    private dialogRef: MatDialogRef<SendEmailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private emailService: EmailService,
    private utilService: UtilService,
    private formBuilder: FormBuilder
  ) {
    this.currency = data.currency;
    this.reason = data.reason;
    this.amount = data.amount;
    this.url = data.url;
    this.from_address = data.from_address;

    this.toEmailFormControl = new FormControl('', [
      Validators.required,
      Validators.email,
    ]);

    this.emailForm = this.formBuilder.group({
      toEmail: this.toEmailFormControl,
    });
  }

  async sendMail(sendToEmail) {
    if (!this.emailForm.valid) {
      if (this.toEmailFormControl.hasError('required')) {
        this.toEmailFormControl.markAsTouched();
        this.toEmailFormControl.setErrors({ required: true });
      }
      return;
    }

    const currency = this.currency;
    const reason = this.reason ? this.reason : 'N/A';
    const url = this.url;
    const amount = this.amount;
    const from_address = this.from_address;

    const postData = {
      to_mail: sendToEmail,
      amount,
      currency,
      reason,
      payment_url: url,
      from_address,
    };

    this.emailService.sendEmail(postData);
    this.emailService.emailObservable.subscribe({
      next: success => {
        if (success) {
          this.dialogRef.close();
          this.utilService.openSnackBar(
            'Email successfully sent.',
            null,
            'success-snackbar'
          );
        }
      },
      error: err => {
        alert(err.statusText);
      },
    });
  }
}
