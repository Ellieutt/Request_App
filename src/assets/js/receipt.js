$('#download-receipt').click(function () {
    analytics.track("Downloaded a receipt", {
        copyurl: $('.url-box').val()
    });

    let doc = new jsPDF('p', 'pt', 'a5');

    doc.addHTML($('#request-invoice-outer'), function () {
        doc.save('RequestInvoice.pdf');
    });
});