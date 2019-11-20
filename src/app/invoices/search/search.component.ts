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
  Sort,
} from '@angular/material';
import { UtilService } from '../../util/util.service';
import { CookieService } from 'ngx-cookie-service';

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
  backgroundLoading = false;
  openAddressBookModal = false;
  addressToAdd = '';
  addressLabel = '';
  preLoadBatchSize = 10;  // default page is 10, so we load the next page
  maxPreLoad = 100;       // 10 default pages in advance, loaded in the background

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

  openAddressModal(address) {
    this.addressToAdd = address;
    this.openAddressBookModal = true;
  }

  closedModal(event) {
    this.openAddressBookModal = event;
  }

  updateTableWithNewLabel(event) {
    if (event && event.address) {
      this.dataSource.data.forEach(function (requestObject) {
        if (requestObject['request']) {
          // For existing requests
          if (
            requestObject['request'].payee.address.toLowerCase() ===
            event.address
          ) {
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
        /*resultsList = resultsList.sort(
          //(a, b) => b._meta.timestamp - a._meta.timestamp
          //(a, b) => a.request ? b.request.payee.expectedAmount - a.request.payee.expectedAmount : 1000
          (a, b) => this.compareHardcoded(a, b, true) //does not work(this.dataSource.data.sort === 'asc')
          //req.request.payee.expectedAmount
        );*/

        this.dataSource = new MatTableDataSource(resultsList);
        this.dataSource.filter = 'all';

        // Financial-level filters logic for the top buttons
        this.dataSource.filterPredicate = (data: any, filter: string) => {
          if (!data['txid'] && (
            !data['request']
            || !data['request']['status']
          )) {
            return true; // Loading result could match
          }
          switch (filter) {
            case "paid":
              return (data['request'] && data['request']['status'] == 'paid');
            case "outstanding":
                const outstandingStatuses = ['created', 'pending', 'accepted', 'in progress'];
                if (data['request']) {
                  return outstandingStatuses.includes( data['request']['status'] );
                } else {
                  return data['status'] && outstandingStatuses.includes( data['status'] );
                }
            default:
              return true;
          }
        }

        this.handlePageLoading();
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;

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

  sortData(sort: Sort) {
    //const data = this.dataSource.filteredData.slice();
    /*if (!sort.active || sort.direction === '') {
      this.sortedData = data;
      return;
    }
    
    this.sortedData = data.sort((a, b) => {
      switch (sort.active) {
        case 'name': return compare(a.name, b.name, isAsc);
        case 'calories': return compare(a.calories, b.calories, isAsc);
        case 'fat': return compare(a.fat, b.fat, isAsc);
        case 'carbs': return compare(a.carbs, b.carbs, isAsc);
        case 'protein': return compare(a.protein, b.protein, isAsc);
        default: return 0;
      }
      
    });*/
    const isAsc = sort.direction === 'asc';
    console.log(sort);
    console.log(this.sort);
    this.sortRequests(this.dataSource.filteredData, sort.active, isAsc);
  }

  private sortRequests(data: Array<any>, activeSort: string, isAsc: boolean) {
    //this.dataSource.filteredData = data.sort((a,b) => this.compare(a,b,true));
    data.sort((a,b) => {
      let usedSort = activeSort;
      switch (usedSort) {
        case 'request.payee.expectedAmount': {
          if(a['request'] && b['request']) {
            return this.compare(
              a['request'].payee.expectedAmount, 
              b['request'].payee.expectedAmount, 
              isAsc
            );
          } else if (!a['request'] && !b['request']) {
            usedSort = '_meta.timestamp';
          } else {
            return a['request'] ? -1 : 1;
          }
        }
        default:
        case '_meta.timestamp': return this.compare(
          a['_meta'].timestamp, 
          b['_meta'].timestamp, 
          isAsc
        );
      }
    });
    console.log(activeSort + '-' + isAsc);
  }

  // Return a negative number if a comes first, a positive one if b comes first
  private compare(a: any, b: any, isAsc: boolean) {
    return (b - a) * (isAsc ? 1 : -1);
  }

  // The smaller the result, the higher a is displayed compared to b
  // Return a negative number if a comes first, a positive one if b comes first
  private compareHardcoded(a: any, b: any, isAsc: boolean) {
    
    let comparison:number;
    if (a.request && b.request) {
      comparison = b.request.payee.expectedAmount - a.request.payee.expectedAmount;
    } else if (a.request && !b.request) {
      comparison = -100000;
    } else if (!a.request && b.request) {
      comparison = 100000;
    } else {
      comparison = b._meta.timestamp - a._meta.timestamp;
    }
    return comparison * (isAsc ? 1 : -1);
  }
  
  async financialFilter(filter: string) {
    this.backgroundLoading = false;
    this.dataSource.filter = filter;
    this.paginator.firstPage();
    this.handlePageLoading();
  }

  getNetworkValue() {
    return this.web3Service.networkIdObservable.value;
  }

  getRequestsFromIds(resultsList) {
    const promises = [];
    for (const result of resultsList.filter(f => {return f.txid === undefined && f.request === undefined;})) {
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
    return Promise.all(promises);
  }

  private updateAndShowPendingRequests() {
    // Updating the status of requests that were broadcasting before displaying them
    this.web3Service.checkCookies().then(() => {
      if (this.cookieService.get('processing_requests')) {
        const pendingCookieList = JSON.parse(
          this.cookieService.get('processing_requests')
        ).filter(e => {
          return e.status == 'pending';
        });
        // For requests that are still pending, fetch the label and add them to the data source
        pendingCookieList.forEach(pendingRequest => {
          if (this.cookieService.get('request_label_tags')) {
            const labelList = JSON.parse(
              this.cookieService.get('request_label_tags')
            );
            labelList.forEach(label => {
              if (label.hasOwnProperty(pendingRequest.payer.toLowerCase())) {
                pendingRequest.payerLabel =
                  label[pendingRequest.payer.toLowerCase()];
              }
              if (
                label.hasOwnProperty(pendingRequest.payee.address.toLowerCase())
              ) {
                pendingRequest.payee.label =
                  label[pendingRequest.payee.address.toLowerCase()];
              }
            });
          }
          this.dataSource.data.unshift(pendingRequest);
        });
      }
      this.dataSource._updateChangeSubscription();
    });
  }

  // Function handlePageLoading
  // Called at every filter change and page change to refresh the visible results list.
  // In case of a search, makes sure to fetch rows one by one to avoid brief appearance of wrong results.
  // Once the page is full of results, pre-load next results.
  // Parameter: unused, mandatory for usage in mat-paginator
  handlePageLoading() {
    const pageStart = this.paginator.pageIndex * this.paginator.pageSize;
    const pageEnd = pageStart + this.paginator.pageSize - 1;
    let data = this.dataSource.data;

    if (this.dataSource.filter != 'all') {
      data = this.dataSource.filteredData;
    }
    this.backgroundLoading = true;
    this.loadInBackground(data, pageStart, this.paginator.pageSize, this.paginator.pageSize
    ).then(() => {
      // When there is a filter, we preload the whole data to be sure we fetch the relevant info
      if (this.dataSource.filter != 'all') {
        this.backgroundLoading = true;
        this.loadInBackground(data, pageEnd + 1, this.paginator.pageSize, data.length);
      } else {
        // When there is no filter, we limit the query with maxPreload
        this.backgroundLoading = true;
        this.loadInBackground(data, pageEnd + 1, this.preLoadBatchSize, this.maxPreLoad);
      }
    });
  }

  handlePageChange(pageEvent?:PageEvent) {
    this.pageEvent = pageEvent;
    this.handlePageLoading();
  }

  private async loadInBackground(data: Array<any>, startIndex: number, batchSize: number, loadingLimit: number) {
    if (
      this.backgroundLoading &&
      loadingLimit > 0 &&
      startIndex < data.length
    ) {
      const endIndex = startIndex + batchSize - 1;
      this.getRequestsFromIds(data.slice(startIndex, endIndex + 1)
      ).then(() => {
        //data.sort((a,b) => this.compareHardcoded(a,b,true));
        this.sortRequests(data, this.sort.active, this.sort.direction === 'asc');
        this.dataSource._updateChangeSubscription();
        //this.sortData(this.sort);
        this.loadInBackground(data, endIndex + 1, batchSize, loadingLimit - batchSize);
      });
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy() {
    this.backgroundLoading = false;
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
