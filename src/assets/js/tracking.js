setTimeout(function() {
    $('div[data-network="messenger"]').click(function() {
        analytics.track("Shared a request", {
            platform: "messenger",
            copyurl: $('.url-box').val()
        });
    });
    $('div[data-network="whatsapp"]').click(function() {
        analytics.track("Shared a request", {
            platform: "whatsapp",
            copyurl: $('.url-box').val()
        });
    });
    $('div[data-network="email"]').click(function() {
        analytics.track("Shared a request", {
            platform: "email",
            copyurl: $('.url-box').val()
        });
    });
}, 500);