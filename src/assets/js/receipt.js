$('#download-receipt').click(function () {
    analytics.track("Downloaded a receipt", {
        copyurl: $('.url-box').val()
    });

    const pdfElement = document.getElementById('request-invoice-outer');

    html2pdf(pdfElement, {
        margin: 0,
        filename: 'RequestInvoice.pdf',
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a5', orientation: 'p' }
    });
});