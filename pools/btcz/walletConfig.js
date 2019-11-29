let walletEnabled = true;

function fetchWalletData(address, callback) {
    var url = 'https://explorer.btcz.rocks/api/addr/'+address+'/?noTxList=1';

    $.ajax({
        Method: 'GET',
        url: url,
        dataType: 'json',
        success: function (data) {
            if (data.addrStr !== address) {
                callback({});
            }
            var cbackData = {balance: data.balance,
                             received: data.totalReceived,
                             sent: data.totalSent,
                             transactions: data.txApperances};

            callback(cbackData);
        },
        error: function(jqXHR, exception) {
            callback({message:exception});
        }
      });
  
}