import {
  Component,
  ViewChild,
  OnInit,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Web3Service } from '../../util/web3.service';
import {
  MatPaginator,
  MatTableDataSource,
  MatSort,
  PageEvent,
} from '@angular/material';
import { UtilService } from '../../util/util.service';
import { CookieService } from 'ngx-cookie-service';
import { ConstantPool } from '@angular/compiler';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit, AfterViewInit, OnDestroy {
  searchValue: string;
  pageEvent: PageEvent;
  subscription;
  displayedColumns = [
    '_meta.timestamp',
    'request.payee.address',
    'request.payer',
    'request.payee.expectedAmount',
    'request.status',
    'requestId',
  ];
  dataSource = new MatTableDataSource();
  loading = true;
  openAddressBookModal = false;
  addressToAdd = '';
  addressLabel = '';
  preLoadAmount = 10; // default page is 10, so we load the next page

  @ViewChild(MatPaginator)
  paginator: MatPaginator;
  @ViewChild(MatSort)
  sort: MatSort;

  constructor(
    private web3Service: Web3Service,
    private router: Router,
    private route: ActivatedRoute,
    private utilService: UtilService,
    private cookieService: CookieService
  ) {}

  openAddressModal(address, label) {
    this.openAddressBookModal = true;
    this.addressToAdd = address;
    this.addressLabel = label;
  }

  // on page change we preload the next page to ensure a smooth UX
  handlePageChange(e) {
    const pageIndex = e.pageIndex;
    const pageSize = e.pageSize;
    const start = pageIndex * pageSize + this.preLoadAmount;
    const end = start + pageSize + this.preLoadAmount;

    this.getRequestsFromIds(this.dataSource.data.slice(start, end));
    return pageIndex;
  }

  closedModal(event) {
    this.openAddressBookModal = event;
  }

  updateTableWithNewLabel(event) {
    if (event && event.address && event.label) {
      this.dataSource.data.forEach(function(requestObject) {
        if (requestObject['request']) {
          // For existing requests
          if (requestObject['request'].payee.address.toLowerCase() === event.address) {
            requestObject['request'].payee.label = event.label;
          }
          if (requestObject['request'].payer.toLowerCase() === event.address) {
            requestObject['request'].payerLabel = event.label;
          }
        } else if (requestObject['payee'] && requestObject['payerLabel']) {
          // For pending requests
          if (requestObject['payee'].address.toLowerCase() === event.address) {
            requestObject['payee'].label = event.label;
          }
          if (requestObject['payer'].toLowerCase() === event.address) {
            requestObject['payerLabel'] = event.label;
          }
        }
      });
    }
  }

  async ngOnInit() {
    if (!this.web3Service || !this.web3Service.web3Ready) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.ngOnInit();
    }

    window.analytics.page({
      name: 'Search',
      path: window.location.href,
    });

    this.subscription = this.utilService.searchValue.subscribe(
      async searchValue => {
        this.searchValue = searchValue;
        this.loading = true;
        this.dataSource.data = [];
        if (searchValue !== this.searchValue) {
          history.pushState(null, null, `/#/search/${searchValue}`);
        }
        const results = await this.web3Service.getRequestsByAddress(
          searchValue
        );
        if (!results || !results.asPayer || !results.asPayee) {
          return (this.dataSource.data = []);
        }
        let resultsList = results.asPayer.concat(results.asPayee);
        resultsList = resultsList.sort(
          (a, b) => b._meta.timestamp - a._meta.timestamp
        );
        // We load the first 10 requests (default page of 10, immediately after we pre-load the next page)
        this.getRequestsFromIds(
          resultsList.slice(
            this.paginator.pageIndex * this.paginator.pageSize,
            this.paginator.pageSize
          )
        ).then(() => {
          this.getRequestsFromIds(
            resultsList.slice(
              this.preLoadAmount,
              this.paginator.pageSize + this.preLoadAmount
            )
          );
        });
        this.dataSource.data = resultsList;
        this.loading = false;
        this.updateAndShowPendingRequests();
      }
    );

    if (this.route.snapshot.params['searchValue']) {
      setTimeout(() =>
        this.utilService.setSearchValue(
          this.route.snapshot.params['searchValue']
        )
      );
    }
  }

  getRequestsFromIds(resultsList) {
    const promises = [];
    for (const result of resultsList) {
      if (!result.request) {
        promises.push(
          this.web3Service
            .getRequestByRequestId(result.requestId)
            .then(requestObject => {

              if (this.cookieService.get('request_label_tags')) {
                const labelList = JSON.parse(
                  this.cookieService.get('request_label_tags')
                );
                labelList.forEach(element => {
                  if (element.hasOwnProperty(requestObject.requestData.payee.address.toLowerCase())) {
                    requestObject.requestData.payee.label = element[requestObject.requestData.payee.address.toLowerCase()];
                  }
                  if (element.hasOwnProperty(requestObject.requestData.payer.toLowerCase())) {
                    requestObject.requestData.payerLabel = element[requestObject.requestData.payer.toLowerCase()];
                  }
                });
              }

              result.request = requestObject.requestData;
            })
        );
      }
    }
    return Promise.all(promises);
  }

  private updateAndShowPendingRequests() {
    // Updating the status of requests that were broadcasting before displaying them
    this.web3Service.checkCookies().then(() => {
      if (this.cookieService.get('processing_requests')) {
        var pendingCookieList = JSON.parse(
          this.cookieService.get('processing_requests')
        ).filter(e => {return e.status == 'broadcasting';});
        // For requests that are still pending, fetch the label and add them to the data source
        pendingCookieList.forEach(pendingRequest => {
          if (this.cookieService.get('request_label_tags')) {
            const labelList = JSON.parse(
              this.cookieService.get('request_label_tags')
              );
              labelList.forEach(label => {
              if (label.hasOwnProperty(pendingRequest.payer.toLowerCase())) {
                pendingRequest.payerLabel = label[pendingRequest.payer.toLowerCase()];
              }
              if (label.hasOwnProperty(pendingRequest.payee.address.toLowerCase())) {
                pendingRequest.payee.label = label[pendingRequest.payee.address.toLowerCase()];
              }
            });
          }
          this.dataSource.data.unshift(pendingRequest);
        });
      }
      this.dataSource._updateChangeSubscription();
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
