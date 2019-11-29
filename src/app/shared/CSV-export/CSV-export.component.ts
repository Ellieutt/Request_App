import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { Web3Service } from 'src/app/util/web3.service';

@Component({
    selector: 'CSV-export',
    templateUrl: './CSV-export.component.html',
    styleUrls: ['./CSV-export.component.scss'],
})

export class CSVExportComponent {
    @Input()
    requests: Array<any>;

    popupVisible: boolean;

    constructor(
        private web3Service: Web3Service,
        ) {
            this.popupVisible = false;
        }
        
    exportOrWarn() {
        if (this.nbValid() == this.requests.length) {
            this.exportToCsv();
        } else {
            console.log(">" + this.nbValid() + "-" + this.requests.length);
            this.togglePopup();
        }
    }

    togglePopup() {
        // TEST partial requests
        //this.requests = JSON.parse('[{"_meta":{"blockNumber":8528181,"timestamp":1568200748},"requestId":"0xdb600fda54568a35b78565b5257125bebc51eb270000000000000000000004c1"},{"_meta":{"blockNumber":8524618,"timestamp":1568152619},"requestId":"0xdb600fda54568a35b78565b5257125bebc51eb270000000000000000000004b3"},{"_meta":{"blockNumber":8520809,"timestamp":1568100828},"requestId":"0xdb600fda54568a35b78565b5257125bebc51eb270000000000000000000004af"},{"_meta":{"blockNumber":8495285,"timestamp":1567757688},"requestId":"0xdb600fda54568a35b78565b5257125bebc51eb270000000000000000000004ac"}]');
        // TEST completed requests
        //this.requests = JSON.parse('[{"_meta":{"blockNumber":8528181,"timestamp":1568200748},"requestId":"0xdb600fda54568a35b78565b5257125bebc51eb270000000000000000000004c1","request":{"creator":"0xAa0c45D2877373ad1AB2aa5Eab15563301e9b7b3","currencyContract":{"payeePaymentAddress":"0xAa0c45D2877373ad1AB2aa5Eab15563301e9b7b3","subPayeesPaymentAddress":[],"address":"0x3038045cd883aBff0C6eEa4B1954843c0fA5a735"},"data":{"hash":"QmQEFJ3EH1a96Kx9zKTbZdSwP9F6NSF7XFtqikjSVQrgvA","data":{"date":1568193834921,"reason":"Is it Rinkeby or the round table or bad luck?","miscellaneous":{"builderId":"app.request.network"}}},"payee":{"address":"0xAa0c45D2877373ad1AB2aa5Eab15563301e9b7b3","balance":"0","expectedAmount":"2386f26fc10000","label":"Benji"},"payer":"0x8400b234e7B113686bD584af9b1041E5a233E754","requestId":"0xdb600fda54568a35b78565b5257125bebc51eb270000000000000000000004c1","state":0,"subPayees":[],"currency":"ETH","status":"created","payerLabel":"Yoyo"}},{"_meta":{"blockNumber":8524618,"timestamp":1568152619},"requestId":"0xdb600fda54568a35b78565b5257125bebc51eb270000000000000000000004b3","request":{"creator":"0xAa0c45D2877373ad1AB2aa5Eab15563301e9b7b3","currencyContract":{"tokenAddress":"0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359","payeePaymentAddress":"0xAa0c45D2877373ad1AB2aa5Eab15563301e9b7b3","subPayeesPaymentAddress":[],"address":"0x3baA64a4401Bbe18865547E916A9bE8e6dD89a5A"},"data":{"hash":"QmdUQ8834GYLZMGtSGkp8e95Arct7gp8atdGBxcLg8ewpJ","data":{"date":1568116346798,"reason":"A test for Bernardo","miscellaneous":{"builderId":"app.request.network"}}},"payee":{"address":"0xAa0c45D2877373ad1AB2aa5Eab15563301e9b7b3","balance":"0","expectedAmount":"de0b6b3a7640000","label":"Benji"},"payer":"0x8400b234e7B113686bD584af9b1041E5a233E754","requestId":"0xdb600fda54568a35b78565b5257125bebc51eb270000000000000000000004b3","state":0,"subPayees":[],"currency":"DAI","status":"created","payerLabel":"Yoyo"}},{"_meta":{"blockNumber":8520809,"timestamp":1568100828},"requestId":"0xdb600fda54568a35b78565b5257125bebc51eb270000000000000000000004af","request":{"creator":"0x8400b234e7B113686bD584af9b1041E5a233E754","currencyContract":{"payeePaymentAddress":"0x8400b234e7B113686bD584af9b1041E5a233E754","subPayeesPaymentAddress":[],"address":"0x3038045cd883aBff0C6eEa4B1954843c0fA5a735"},"data":{"hash":"QmYJ8NkUnAf61BSoEQdRh59JTnAzgtkjzRP4kAMsgfankB","data":{"date":1568098265633,"reason":"A reason for Vincent","miscellaneous":{"builderId":"app.request.network"}}},"payee":{"address":"0x8400b234e7B113686bD584af9b1041E5a233E754","balance":"0","expectedAmount":"11c37937e08000","label":"Yoyo"},"payer":"0xAa0c45D2877373ad1AB2aa5Eab15563301e9b7b3","requestId":"0xdb600fda54568a35b78565b5257125bebc51eb270000000000000000000004af","state":0,"subPayees":[],"currency":"ETH","status":"created","payerLabel":"Benji"}},{"_meta":{"blockNumber":8495285,"timestamp":1567757688},"requestId":"0xdb600fda54568a35b78565b5257125bebc51eb270000000000000000000004ac","request":{"creator":"0xAa0c45D2877373ad1AB2aa5Eab15563301e9b7b3","currencyContract":{"payeePaymentAddress":"0xAa0c45D2877373ad1AB2aa5Eab15563301e9b7b3","subPayeesPaymentAddress":[],"address":"0x3038045cd883aBff0C6eEa4B1954843c0fA5a735"},"data":{"hash":"QmexPvEHTPeDRvkHAErZNJ4bV5DNSADT7xTCJ2iVsxpgHi","data":{"date":1567757563404,"reason":"Test expenses Aug-2019","miscellaneous":{"builderId":"app.request.network"}}},"payee":{"address":"0xAa0c45D2877373ad1AB2aa5Eab15563301e9b7b3","balance":"2386f26fc10000","expectedAmount":"2386f26fc10000","label":"Benji"},"payer":"0x8400b234e7B113686bD584af9b1041E5a233E754","requestId":"0xdb600fda54568a35b78565b5257125bebc51eb270000000000000000000004ac","state":1,"subPayees":[],"currency":"ETH","status":"paid","payerLabel":"Yoyo"}}]');
        /*this.requests = JSON.parse('[
            {"_meta":{"blockNumber":8528181,"timestamp":1568200748},
            "requestId":"0xdb600fda54568a35b78565b5257125bebc51eb270000000000000000000004c1",
            "request":{
                "creator":"0xAa0c45D2877373ad1AB2aa5Eab15563301e9b7b3",
                "currencyContract":{
                    "payeePaymentAddress":"0xAa0c45D2877373ad1AB2aa5Eab15563301e9b7b3","subPayeesPaymentAddress":[],"address":"0x3038045cd883aBff0C6eEa4B1954843c0fA5a735"},
                "data":{
                    "hash":"QmQEFJ3EH1a96Kx9zKTbZdSwP9F6NSF7XFtqikjSVQrgvA",
                    "data":{"date":1568193834921,
                        "reason":"Is it Rinkeby or the round table or bad luck?",
                        "miscellaneous":{"builderId":"app.request.network"}
                    }
                },"payee":{
                    "address":"0xAa0c45D2877373ad1AB2aa5Eab15563301e9b7b3",
                    "balance":"0",
                    "expectedAmount":"2386f26fc10000",
                    "label":"Benji"
                },
                "payer":"0x8400b234e7B113686bD584af9b1041E5a233E754",
                "requestId":"0xdb600fda54568a35b78565b5257125bebc51eb270000000000000000000004c1",
                "state":0,
                "subPayees":[],
                "currency":"ETH",
                "status":"created",
                "payerLabel":"Yoyo"}
            },
            {"_meta":{
                "blockNumber":8524618,
                "timestamp":1568152619
            },
            "requestId":"0xdb600fda54568a35b78565b5257125bebc51eb270000000000000000000004b3",
            "request":{"creator":"0xAa0c45D2877373ad1AB2aa5Eab15563301e9b7b3","currencyContract":{"tokenAddress":"0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359","payeePaymentAddress":"0xAa0c45D2877373ad1AB2aa5Eab15563301e9b7b3","subPayeesPaymentAddress":[],"address":"0x3baA64a4401Bbe18865547E916A9bE8e6dD89a5A"},"data":{"hash":"QmdUQ8834GYLZMGtSGkp8e95Arct7gp8atdGBxcLg8ewpJ","data":{"date":1568116346798,"reason":"A test for Bernardo","miscellaneous":{"builderId":"app.request.network"}}},"payee":{"address":"0xAa0c45D2877373ad1AB2aa5Eab15563301e9b7b3","balance":"0","expectedAmount":"de0b6b3a7640000","label":"Benji"},"payer":"0x8400b234e7B113686bD584af9b1041E5a233E754","requestId":"0xdb600fda54568a35b78565b5257125bebc51eb270000000000000000000004b3","state":0,"subPayees":[],"currency":"DAI","status":"created","payerLabel":"Yoyo"}},{"_meta":{"blockNumber":8520809,"timestamp":1568100828},"requestId":"0xdb600fda54568a35b78565b5257125bebc51eb270000000000000000000004af","request":{"creator":"0x8400b234e7B113686bD584af9b1041E5a233E754","currencyContract":{"payeePaymentAddress":"0x8400b234e7B113686bD584af9b1041E5a233E754","subPayeesPaymentAddress":[],"address":"0x3038045cd883aBff0C6eEa4B1954843c0fA5a735"},"data":{"hash":"QmYJ8NkUnAf61BSoEQdRh59JTnAzgtkjzRP4kAMsgfankB","data":{"date":1568098265633,"reason":"A reason for Vincent","miscellaneous":{"builderId":"app.request.network"}}},"payee":{"address":"0x8400b234e7B113686bD584af9b1041E5a233E754","balance":"0","expectedAmount":"11c37937e08000","label":"Yoyo"},"payer":"0xAa0c45D2877373ad1AB2aa5Eab15563301e9b7b3","requestId":"0xdb600fda54568a35b78565b5257125bebc51eb270000000000000000000004af","state":0,"subPayees":[],"currency":"ETH","status":"created","payerLabel":"Benji"}},{"_meta":{"blockNumber":8495285,"timestamp":1567757688},"requestId":"0xdb600fda54568a35b78565b5257125bebc51eb270000000000000000000004ac","request":{"creator":"0xAa0c45D2877373ad1AB2aa5Eab15563301e9b7b3","currencyContract":{"payeePaymentAddress":"0xAa0c45D2877373ad1AB2aa5Eab15563301e9b7b3","subPayeesPaymentAddress":[],"address":"0x3038045cd883aBff0C6eEa4B1954843c0fA5a735"},"data":{"hash":"QmexPvEHTPeDRvkHAErZNJ4bV5DNSADT7xTCJ2iVsxpgHi","data":{"date":1567757563404,"reason":"Test expenses Aug-2019","miscellaneous":{"builderId":"app.request.network"}}},"payee":{"address":"0xAa0c45D2877373ad1AB2aa5Eab15563301e9b7b3","balance":"2386f26fc10000","expectedAmount":"2386f26fc10000","label":"Benji"},"payer":"0x8400b234e7B113686bD584af9b1041E5a233E754","requestId":"0xdb600fda54568a35b78565b5257125bebc51eb270000000000000000000004ac","state":1,"subPayees":[],"currency":"ETH","status":"paid","payerLabel":"Yoyo"}}]');
                */
        this.popupVisible = !this.popupVisible;
    }

    isValid(request: any) {
        return request.request && request._meta && request._meta.timestamp;
    }

    nbValid() {
        return this.requests.filter(r => {return this.isValid(r)}).length;
    }

    exportToCsv() {
        const filename = 'requests.csv';
        var processRow = function (row) {
            var finalVal = '';
            for (var j = 0; j < row.length; j++) {
                var innerValue = row[j] === undefined ? '' : row[j].toString();
                if (row[j] instanceof Date) {
                    innerValue = row[j].toLocaleString();
                };
                var result = innerValue.replace(/"/g, '""');
                if (result.search(/("|,|\n)/g) >= 0)
                    result = '"' + result + '"';
                if (j > 0)
                    finalVal += ',';
                finalVal += result;
            }
            return finalVal + '\n';
        };
    
        var csvFile = '';
        var rows = [];
        rows.push(["Request Date", 
            "Request ID",
            "Requester",
            "Requester Label",
            "Payer",
            "Payer Label",
            "Payment Addres",
            "Amount",
            "Currency",
            "Status",
            "Reason",
            "BuilderID",
            "Block Number"
        ]);
        this.requests.filter(r => this.isValid(r)).forEach( req => {
            if (req.requestId == "0x8fc2e7f2498f1d06461ee2d547002611b801202b000000000000000000000c67") {
                console.log(req);
            }
            rows.push([new Date (req._meta.timestamp * 1000),
                req.requestId,
                req.request.creator,
                (req.request.payee.label ? req.request.payee.label : ""), 
                req.request.payer, 
                (req.request.payerLabel ? req.request.payerLabel : ""), 
                req.request.currencyContract.payeePaymentAddress,
                this.web3Service.BNToAmount(req.request.payee.expectedAmount, req.request.currency),
                req.request.currency,
                req.request.status,
                (req.request.data && req.request.data.data ? req.request.data.data.reason : ""),
                (req.request.data && req.request.data.data ? req.request.data.data.miscellaneous.builderId : ""),
                req._meta.blockNumber,
                ]);
        })
        for (var i = 0; i < rows.length; i++) {
            csvFile += processRow(rows[i]);
        }
    
        var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, filename);
        } else {
            var link = document.createElement("a");
            if (link.download !== undefined) { // feature detection
                // Browsers that support HTML5 download attribute
                var url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    }

}