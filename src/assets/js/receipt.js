$('#download-receipt').click(function () {
    let doc = new jsPDF('p', 'pt', 'a5');

    doc.addHTML($('#request-invoice-outer'), function () {
        doc.save('RequestInvoice.pdf');
    });
});