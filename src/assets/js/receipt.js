$('#download-receipt').click(function () {
    analytics.track("Downloaded a receipt", {
        copyurl: $('.url-box').val()
    });

    var reason = $('#reasonPdf').html(),
        createdDate = $('#invoice-date-created').html(),
        paidDate = $('#invoice-date-paid').html(),
        payeeAddress = $('#payeeAddressPdf .pdf-address').html(),
        payerAddress = $('#payerAddressPdf .pdf-address').html(),
        amount = $('#request-expected-amount').html(),
        amountUSD = $('#amount-usd div').html();

    var doc = new jsPDF({
        unit: 'pt',
        format: [500, 520]
    });

    var centeredText = function (text, y) {
        var textWidth = doc.getStringUnitWidth(text) * doc.internal.getFontSize() / doc.internal.scaleFactor;
        var textOffset = (doc.internal.pageSize.width - textWidth) / 2;
        doc.text(textOffset, y, text);
    }

    var pageWidth = doc.internal.pageSize.width;

    doc.setFont('Beatrice-Regular');
    doc.setFontSize(12);

    var logoData = 'data:image/png;base64,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';
    doc.addImage(logoData, 'PNG', 20, 16, 36, 40, undefined, 'FAST');

    doc.setTextColor('#000');
    doc.setFontSize(12);
    doc.text(300, 30, 'Created: ' + createdDate);
    if (paidDate) {
        doc.text(300, 50, 'Paid: ' + paidDate);
    }

    doc.setFillColor('#3CA2F3');
    doc.rect(0, 75, pageWidth, 38, "F");

    doc.setTextColor('#fff');
    centeredText('YOUR RECEIPT', 99);

    doc.setTextColor('#000');
    doc.setFontSize(12);
    doc.text(20, 155, 'From');

    doc.text(20, 225, 'To');

    doc.setFontSize(12);
    //From
    doc.setFillColor(194, 232, 255);
    doc.rect(46, 164, (payeeAddress.length * 8) + 20, 27, "F");
    doc.text(58, 183, payeeAddress);
    //To
    doc.setFillColor(243, 243, 243);
    doc.rect(46, 234, (payerAddress.length * 8) + 20, 27, "F");
    doc.text(58, 253, payerAddress);

    // User images
    var payeeImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFuGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDIgNzkuMTYwOTI0LCAyMDE3LzA3LzEzLTAxOjA2OjM5ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOCAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDE5LTExLTA0VDA4OjAxOjU5WiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAxOS0xMS0wNFQwODowMTo1OVoiIHhtcDpNb2RpZnlEYXRlPSIyMDE5LTExLTA0VDA4OjAxOjU5WiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo0MDc2MDg4YS1kYmU1LWU2NGQtODJmOC01MjcwMDU1NzUzNTciIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDpiOWRiZjIxMi1kNTgzLTg2NDYtOTM2Yy0wMmZjZTJjODcxMGIiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDplZmVmYzA2ZS1lZDAyLTkyNDYtOTg0Yy0zZTNhNjBlZThhNzQiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDplZmVmYzA2ZS1lZDAyLTkyNDYtOTg0Yy0zZTNhNjBlZThhNzQiIHN0RXZ0OndoZW49IjIwMTktMTEtMDRUMDg6MDE6NTlaIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOCAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjQwNzYwODhhLWRiZTUtZTY0ZC04MmY4LTUyNzAwNTU3NTM1NyIgc3RFdnQ6d2hlbj0iMjAxOS0xMS0wNFQwODowMTo1OVoiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE4IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4MpADVAAAAtElEQVRIiWMM+J7GgA38/7Ydzmbk8iRbDRNWUSqCoW8By/eDalglOO0Ja0YOd1zmDP0gon0cIHM4TCci8QiHL6f9Lax6f5zOh7OHfhDR3AJG5LIIOayRwxe5zEHRjCMfIOsd+kFE+3yAGr6IcERN+9jzAS6AbObQDyLaxwFyuYEr7ZNaJ38/OFoWkQBQ6gPU8gS7ODIgRs3QDyL6xgFyPkAOU9S6mgFJDfY8hKx36AcRzS0AAJjPQDByR1w0AAAAAElFTkSuQmCC',
        payerImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFuGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDIgNzkuMTYwOTI0LCAyMDE3LzA3LzEzLTAxOjA2OjM5ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOCAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDE5LTExLTA0VDA4OjAyOjA4WiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAxOS0xMS0wNFQwODowMjowOFoiIHhtcDpNb2RpZnlEYXRlPSIyMDE5LTExLTA0VDA4OjAyOjA4WiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo1ODI1Njk2Ni0zZTZjLThiNDQtYjFlOC1lNTc5ZGUxZjNkZDMiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo3MjUwNzllMi01NGIwLTYwNDYtYmI2Zi1jMzA5OTg1OGI2ZGYiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo1YjUwYmE2Yy05YWZiLTFiNDktOTdjMC02ZThjYWQ5Y2IyNzMiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo1YjUwYmE2Yy05YWZiLTFiNDktOTdjMC02ZThjYWQ5Y2IyNzMiIHN0RXZ0OndoZW49IjIwMTktMTEtMDRUMDg6MDI6MDhaIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOCAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjU4MjU2OTY2LTNlNmMtOGI0NC1iMWU4LWU1NzlkZTFmM2RkMyIgc3RFdnQ6d2hlbj0iMjAxOS0xMS0wNFQwODowMjowOFoiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE4IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4fJfGVAAAApElEQVRIiWO80HiIAQZ498rB2SeXLIWzzWOiGbABXGo+Oz+Cs5mw6qQiGPoWsCBzkMMUGSCHKS6ArFdrvi2cPfSDiOYWMC571EpTC4Z+ENE+HyCnWeSyCBngyh+4yqjRsogkwIhcHyADXPGBC+Aqr4Z+ENG3LELOE5SAa4mH4eyhH0S0j4O7dg+wSuAqf3ABXOXS0A8i2tcHxJT1lKgZ+kFEcwsAK4Iy13ocvPUAAAAASUVORK5CYII=';
    doc.addImage(payeeImage, 'PNG', 20, 165, 26, 26, undefined, 'FAST');
    doc.addImage(payerImage, 'PNG', 20, 235, 26, 26, undefined, 'FAST');

    if (reason) {
        

        doc.setFillColor(233, 229, 236);
        doc.rect(0, 295, pageWidth, 1, "F");

        doc.setFontSize(12);
        centeredText("Reason", 345);

        doc.setTextColor('#000');
        doc.setFontSize(12);
        if (reason.length > 66) {
            var splitReason = doc.splitTextToSize(reason, 460);
                doc.text(20, 370, splitReason);
        }
        else {
            centeredText(reason, 370);
        }
    }

    // These are the heights for when there is a reason
    var amountContainerY = 415,
        amountTitleY = 450,
        amountValueY = 475;
        amountUsdValueY = 495;

    // If there isn't a reason offset by the reason height
    if (!reason) {
        amountContainerY -= 110;
        amountTitleY -= 110;
        amountValueY -= 110;
        amountUsdValueY -= 110;
    }

    doc.setFontSize(10);
    doc.setFillColor(240, 240, 240);
    doc.rect(0, amountContainerY, pageWidth, 130, "F");

    centeredText("Amount", amountTitleY);

    doc.setFontSize(22);
    centeredText(amount, amountValueY);

    doc.setFontSize(14);
    if (amountUSD) {
        centeredText(amountUSD, amountUsdValueY);
    }

    const fileName = 'RequestInvoice.pdf';

    // IOS fix for the PDF extension, according to: MrRio/jsPDF#2080
    if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase())) {
        window.open(doc.output('bloburl', { filename: fileName }))
    } else {
        doc.save(fileName)
    }

});