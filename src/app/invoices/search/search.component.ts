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
    'request.arrow',
    'requestId',
    '_meta.timestamp',
    'request.payee.address',
    'request.payer',
    'request.payee.expectedAmount',
    'request.status',
  ];
  dataSource = new MatTableDataSource();
  loading = true;
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

  // on page change we preload the next page to ensure a smooth UX
  handlePageChange(e) {
    const pageIndex = e.pageIndex;
    const pageSize = e.pageSize;
    const start = pageIndex * pageSize + this.preLoadAmount;
    const end = start + pageSize + this.preLoadAmount;

    this.getRequestsFromIds(this.dataSource.data.slice(start, end));
    return pageIndex;
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

        if (this.cookieService.get('processing_requests')) {
          const cookieList = JSON.parse(
            this.cookieService.get('processing_requests')
          );
          cookieList.forEach(element => {
            if (element.status !== 'created') {
              console.log(element);
              resultsList.unshift(element);
            }
          });
        }

        this.dataSource.data = resultsList;
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

  getRequestsFromIds(resultsList) {
    const promises = [];
    for (const result of resultsList) {
      if (!result.request) {
        promises.push(
          this.web3Service
            .getRequestByRequestId(result.requestId)
            .then(requestObject => {
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
}
