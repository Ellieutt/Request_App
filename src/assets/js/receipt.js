$('#download-receipt').click(function () {
    analytics.track("Downloaded a receipt", {
        copyurl: $('.url-box').val()
    });

    var reason = $('#reasonPdf').html(),
        payeeAddress = $('#payeeAddressPdf').html(),
        payerAddress = $('#payerAddressPdf').html(),
        amount = $('#request-expected-amount').html();

    var doc = new jsPDF({
        unit: 'pt',
        format: [500, 500]
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
    doc.text(58, 183, payeeAddress);
    //To
    doc.text(58, 253, payerAddress);

    // User images
    var payeeImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAF+mlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDIgNzkuMTYwOTI0LCAyMDE3LzA3LzEzLTAxOjA2OjM5ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOCAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDE5LTA5LTI3VDEwOjU4OjU4KzAxOjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAxOS0wOS0yN1QxMTowMTowMiswMTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAxOS0wOS0yN1QxMTowMTowMiswMTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpkMzYzZGU0NC04OWEzLTQ5NDMtOTNjMS0zOGI4ODg4ZmM2ZTMiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDozYjQzMWNmNi0yZGNkLTliNGQtOTgyOC1jMDMzNjQyZmJjNjIiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpjODYzZWFmZi1mNmIyLWJlNDktYTExZi03MWMwYzUyNTJkMDMiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmM4NjNlYWZmLWY2YjItYmU0OS1hMTFmLTcxYzBjNTI1MmQwMyIgc3RFdnQ6d2hlbj0iMjAxOS0wOS0yN1QxMDo1ODo1OCswMTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTggKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpkMzYzZGU0NC04OWEzLTQ5NDMtOTNjMS0zOGI4ODg4ZmM2ZTMiIHN0RXZ0OndoZW49IjIwMTktMDktMjdUMTE6MDE6MDIrMDE6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE4IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4aM/hxAAACbUlEQVRYhcWXMWgiQRSGvyzCiY0QJLGTJNgsKQ0RLBJIYSFYpJGUB6lzuN0FUgUu3YqpA1ceaVIIFnsgmEIwxFK2kSTYmRACNnJWXrGzye667mqM7lfJ7HP+x8ybmf+tjEYjpmHtbTcJZPqRdArYBjaAdfH5GXgC2tFBswU0XlbvOtPMu+KXwNrb7j5wCOSBRD+S9oyPDpoAXaAC3Lys3tU/lcC3fz82gePooPkdiJvjUyZg0utH0r+Bq2G4/OgWL00QPwAugZ9W8U8QF3NcijnHGFsBWVPzwBmQAnjY686hD1u3CfNnCzjXs0rF+t22ArKmHljFv5gUcCY0xhOQNXUTKC5I3JpEUWjZEwCOgdwCxU1yQgsQNSBr6j7wB4i/7lzbop1Vb9lTV5w14zgVxO4LAD3gSM8qdXMFDpmv2mclLjSRZE1NYlwyyyYva2pSAjKA97ouhgSQCT3sdW1Vv3VbsEX1HXvqrJFx7DUj9vwdR42kJIyHJSi2JYxXLSg2JD6e1CBYDznPqbMex8+9d73GfBSdehKGmQiKZwnDyQTFkwS0A0ygHYrdF1rWEb+7fEZH5PKW2O6FlgQ0MDzcsukCDUnPKh0MA7lsKnpW6Ziv4Q3GE7ksekLzwxPKmvoLw0DacNbErH5gQvyFnlVOwe6IroCqd+JfQlVoYUtAzyqPQAnDvS6KFlASWvYERBI14HxBSZi2vGYddO2MRBNRBHLOPfTzAxPe/ypQGobLNWe8a2ckAk+AC+Y7HT0xx4mbOEBo0j9FL3cqo/7F0pxOKfzenA7D5bpXoG93bCLMa+Z159qzPRdXe0NccL78B3AI3bJRllRDAAAAAElFTkSuQmCC',
        payerImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAF+mlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDIgNzkuMTYwOTI0LCAyMDE3LzA3LzEzLTAxOjA2OjM5ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOCAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDE5LTA5LTI3VDEwOjU5OjQ4KzAxOjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAxOS0wOS0yN1QxMTowMToyMiswMTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAxOS0wOS0yN1QxMTowMToyMiswMTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo0ZWUzM2U5YS0zZTc3LThkNDgtYTI0NS1kMjZlYmVmNTY4YTgiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDpkMTI5YzMwZS01NGUyLWFjNGEtODMzNy1iYjMwNjQ0Y2UyMWUiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo2ODJiNzY4Ni0xYmQ1LWEyNGUtODQ4Ny03Njk0ZDRhNjE0ZmQiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjY4MmI3Njg2LTFiZDUtYTI0ZS04NDg3LTc2OTRkNGE2MTRmZCIgc3RFdnQ6d2hlbj0iMjAxOS0wOS0yN1QxMDo1OTo0OCswMTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTggKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo0ZWUzM2U5YS0zZTc3LThkNDgtYTI0NS1kMjZlYmVmNTY4YTgiIHN0RXZ0OndoZW49IjIwMTktMDktMjdUMTE6MDE6MjIrMDE6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE4IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6jLL63AAACP0lEQVRYhcWXP2zaQBSHP07pyErIUkIkMmVkY2iljAiGSB2qLo3EWiOPKcqE0oyuPSNlqrplsMUYKQsbI1MilTCFMNbqlIEOdyT2YWL+xPEnIWHd0/s93zvfey8znU5ZBtvzS0DlbNgpAwdAEdhWyw/AEBi0io0+0GvWsrfL+N1aQvgjcATUgcICs/fq90E9j2zPd4HLZi17vVYAOcfaAxqtYuMYyMcFqlEAvgGfco51AXQmhvknylAsED8EHOBkDfEgeeXDUT7nyOhnwPb8OnAKlAHOhp0N9KFVbMz+9oF2s5Z1g+uhHbA9/zAo/sqUgVOlMR+A7fl7gJmQeDAIU2mFAwAaQDVB8RlVpQWoM6A+td9AXs95IIdrscDfGPjcrGWvZztwxGanfVXyShOhbrj6G4rPqNueXxJAhcU3XJIUgMqWutuf0HO+6pmIs9fWywJZWNLiQCCrWloUBc8lNQ22Y8uxzqa1QUcgm4m0eBDITiYthgIYpBjAIPPT/fsVuEgpgGMB9IBRCuIjoCdU9+rGWSeA26xlb2fV8BJZIt+KsdJ87glzjvUD2UCG+PIY7lF293de9Hx3cx96/vWuG2V2PjHM7xDuiDpApPUr01VahAJQfbuF7F6Tog9YwRkh1BVPDPMKaCcURB9oK40n5mrBxDDdnGP9Q3bIVT3neo515s6IvGe7yDe/0u0jJyNlaADnbPZ1jJUPI0ocIiYjHX04XXIHRsi7JXY4jQ0gEEgJqNzd3L84nu/u76w0nv8H8v/Le3QxzYUAAAAASUVORK5CYII=';
    doc.addImage(payeeImage, 'PNG', 20, 165, 26, 26, undefined, 'FAST');
    doc.addImage(payerImage, 'PNG', 20, 235, 26, 26, undefined, 'FAST');

    if (reason) {
        doc.setFillColor(233, 229, 236);
        doc.rect(0, 295, pageWidth, 1, "F");

        doc.setFontSize(12);
        centeredText("Reason", 345);

        doc.setTextColor('#000');
        doc.setFontSize(14);
        centeredText(reason, 370);
    }

    // These are the heights for when there is a reason
    var amountContainerY = 415,
        amountTitleY = 450,
        amountValueY = 475;

    // If there isn't a reason offset by the reason height
    if (!reason) {
        amountContainerY -= 110;
        amountTitleY -= 110;
        amountValueY -= 110;
    }

    doc.setFontSize(10);
    doc.setFillColor(240, 240, 240);
    doc.rect(0, amountContainerY, pageWidth, 90, "F");

    centeredText("Amount", amountTitleY);

    doc.setFontSize(22);
    centeredText(amount, amountValueY);

    doc.save('RequestInvoice');

});