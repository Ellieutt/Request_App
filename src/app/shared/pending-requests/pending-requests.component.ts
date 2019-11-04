import { Component, OnInit, Input } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'pending-requests',
  templateUrl: './pending-requests.component.html',
  styleUrls: ['./pending-requests.component.scss'],
})
export class PendingRequestsComponent implements OnInit {

  notificationCount = 0;
  broadcastingRequestCount = 0;
  showPendingPopup = false;
  requestList = [];

  constructor(
    private cookieService: CookieService,
  ) {

    this.checkForNotifications();
    this.calculateBroadcastingRequestCount();
    this.fetchRequestsFromCookie();
    setInterval(async () => {
      this.checkForNotifications();
      this.calculateBroadcastingRequestCount();
      this.fetchRequestsFromCookie();
    }, 1000);
  }

  fetchRequestsFromCookie() {
    if (this.cookieService.get('processing_requests')) {
      const cookieList = JSON.parse(
        this.cookieService.get('processing_requests')
      );
      this.requestList = cookieList;
    } else {
      this.requestList = [];
    }
  }

  removeRequestFromCookie(txid) {
    if (this.cookieService.get('processing_requests')) {
      const newCookieList = [];
      const cookieList = JSON.parse(
        this.cookieService.get('processing_requests')
      );
      cookieList.forEach(element => {
        if (element.txid !== txid) {
          newCookieList.push(element);
        }
      });
      this.cookieService.set('processing_requests', JSON.stringify(newCookieList), 1);
      this.requestList = newCookieList;
      if (newCookieList.length === 0) {
        this.broadcastingRequestCount = 0;
        this.showPendingPopup = false;
      }
    }
  }

  calculateBroadcastingRequestCount() {
    if (this.cookieService.get('processing_requests')) {
      let newBroadcastingRequestCount = 0;
      const cookieList = JSON.parse(
        this.cookieService.get('processing_requests')
      );
      cookieList.forEach(element => {
        if (element.status === 'broadcasting') {
          newBroadcastingRequestCount += 1;
        }
      });
      this.broadcastingRequestCount = newBroadcastingRequestCount;
    } else {
      this.broadcastingRequestCount = 0;
    }
  }

  clickPendingRequestsTab() {
    if (this.cookieService.get('processing_requests')) {
      const cookieList = JSON.parse(
        this.cookieService.get('processing_requests')
      );
      const updatedCookieList = [];
      cookieList.forEach(element => {
        if (element.unread === true) {
          element.unread = false;
        }
        updatedCookieList.push(element);
      });
      this.cookieService.set('processing_requests', JSON.stringify(updatedCookieList), 1);
    }
    this.showPendingPopup = !this.showPendingPopup;
  }

  checkForNotifications() {
    const that = this;
    if (this.cookieService.get('processing_requests')) {
      let newNotificationCount = 0;
      const cookieList = JSON.parse(
        this.cookieService.get('processing_requests')
      );
      cookieList.forEach(element => {
        if (element.unread === true) {
          newNotificationCount += 1;
        }
      });

      this.notificationCount = newNotificationCount;
    } else {
      this.notificationCount = 0;
    }
  }

  ngOnInit() {
  }
}
