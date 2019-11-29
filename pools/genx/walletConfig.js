let walletEnabled = true;

function fetchWalletData(address, callback) {
    var url = 'https://chainz.cryptoid.info/genx/api.dws?q=getbalance&a='+address;

    $.ajax({
        Method: 'GET',
        url: url,
        success: function (data) {
            var cbackData = {balance: data};
            callback(cbackData);
        },
        error: function(jqXHR, exception) {
            callback({message:exception});
        }
      });
  
}