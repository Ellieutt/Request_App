import {
  Component,
  ViewChild,
  OnInit,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Web3Service } from '../../util/web3.service';
import { MatPaginator, MatTableDataSource, MatSort } from '@angular/material';
import { UtilService } from '../../util/util.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit, AfterViewInit, OnDestroy {
  searchValue: string;
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

  @ViewChild(MatPaginator)
  paginator: MatPaginator;
  @ViewChild(MatSort)
  sort: MatSort;

  constructor(
    private web3Service: Web3Service,
    private router: Router,
    private route: ActivatedRoute,
    private utilService: UtilService
  ) {}

  async ngOnInit() {
    window.analytics.page({
      name: 'Search',
      path: window.location.href
    });

    if (!this.web3Service || !this.web3Service.web3Ready) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.ngOnInit();
    }

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
        this.getRequestsFromIds(resultsList);
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
      promises.push(
        this.web3Service
          .getRequestByRequestId(result.requestId)
          .then(requestObject => {
            result.request = requestObject.requestData;
          })
      );
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
