import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { shareReplay } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Injectable()
export class EmailService {
    private emailEndpoint = 'https://mail.requestnetworkapi.com/email';
    public emailObservable = new Subject<EmailResponse>();

    constructor(private http: HttpClient) {
    }

    sendEmail(postData) {
        this.sendEmailCall(postData).subscribe({
            next: res =>
                this.emailObservable.next({
                    success: true
                }),
            error: err => {
                this.emailObservable.error(err);
            },
        });
    }

    public sendEmailCall(postData) {
        const httpOptions = {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' })
        };

        return this.http.post<EmailResponse>(this.emailEndpoint, postData, httpOptions).pipe(
            shareReplay()
        );
    }
}

export interface EmailResponse {
    success: boolean;
}
