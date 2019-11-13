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
  financialFilter: string = 'all';
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
  handlePageChange() {
    this.getRequestsFromIds(
      this.dataSource.data.slice(
        this.paginator.pageIndex * this.paginator.pageSize,
        (this.paginator.pageIndex + 1) * this.paginator.pageSize,
      )
    ).then(() => {
      this.getRequestsFromIds(
        this.dataSource.data.slice(
          (this.paginator.pageIndex + 1) * this.paginator.pageSize + 1,
          (this.paginator.pageIndex + 1) * this.paginator.pageSize + 1 + this.preLoadAmount
        )
      )
    });

    return this.paginator.pageIndex;
  }

  closedModal(event) {
    this.openAddressBookModal = event;
  }

  updateTableWithNewLabel(event) {
    if (event && event.address && event.label) {
      this.dataSource.data.forEach(function(requestObject) {
        if (requestObject['request']) {
          if (requestObject['request'].payee.address.toLowerCase() === event.address) {
            requestObject['request'].payee.label = event.label;
          }
          if (requestObject['request'].payer.toLowerCase() === event.address) {
            requestObject['request'].payerLabel = event.label;
          }
        } else if (requestObject['txid']) {
          // Cookie item
          if (requestObject['payer'].toLowerCase() === event.address) {
            requestObject['payerLabel'] = event.label;
          }
          if (requestObject['payee'].toLowerCase() === event.address) {
            requestObject['payeeLabel'] = event.label;
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
        
        if (this.cookieService.get('processing_requests')) {
          const cookieList = JSON.parse(
            this.cookieService.get('processing_requests')
          );
          cookieList.forEach(element => {
            if (element.status !== 'created') {
              if (this.cookieService.get('request_label_tags')) {
                const labelList = JSON.parse(
                  this.cookieService.get('request_label_tags')
                  );
                  labelList.forEach(label => {
                    if (label.hasOwnProperty(element.payer.toLowerCase())) {
                      element.payerLabel = label[element.payer.toLowerCase()];
                    }
                    if (label.hasOwnProperty(element.payee.toLowerCase())) {
                      element.payeeLabel = label[element.payee.toLowerCase()];
                    }
                  });
                }
                resultsList.unshift(element);
              }
            });
          }
          
          this.dataSource.data = resultsList;
            
          // Financial-level filters logic for the top buttons
          this.dataSource.filterPredicate = (data: Array<any>, filter: string) => {
            switch (filter) {
              case "paid":
                return (data['request'] && data['request']['status'] == 'paid');
              case "outstanding":
                  const outstandingStatuses = ['created', 'pending', 'accepted'];
                  if (data['request']) {
                    return outstandingStatuses.includes( data['request']['status'] );
                  } else {
                    return data['status'] && outstandingStatuses.includes( data['statuses'] );
                  }
              default:
                return true;
          }
        }
        this.handlePageChange();
        this.loading = false;
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

  async fetchSearchResults() {
    
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

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
  
  filterOutstanding() {
    console.log(this.dataSource.data[0]['request']['status']);
    this.financialFilter = 'outstanding';
    this.dataSource.data = this.dataSource.data.filter(req => req['request'] && req['request']['status'] == 'created');
    this.dataSource._updateChangeSubscription();
  }
}
