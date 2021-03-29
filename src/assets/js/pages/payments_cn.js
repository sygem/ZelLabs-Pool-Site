var table;
function updatePayments() {
  var url = site+'/api/poolpayments';
  //console.log(url);
  $.ajax({
    Method: 'GET',
    url: url,
    dataType: 'json',
    success: function (data) {
      var stats = data;
      for (var pool in stats) {
        //console.log(stats[pool]);
        if (stats[pool].name !== poolCoin) continue;
        var pooldata = stats[pool];
        var paymentsBody = $('#paymentsBody');
        paymentsBody.empty();
        //console.log(pooldata);
        for (var p in pooldata.payments) {
          var payment = pooldata.payments[p];
          //if (payment.blocks.length===0 && payment.miners===1 && payment.shares===0) {
          //  continue;
          //}
          var tr = $('<tr></tr>');
          /*var td = $('<td></td>');
          tr.append(td);
          if (pooldata.config.txURL) {
            var a = $('<a href="'+pooldata.config.txURL+payment.hash+'" title="View transaction" target="_blank" class="text-custom"></a>')
            td.append(a);
            td = a;
          }*/
          /*for (var i=0;i<payment.blocks.length;i++) {
            td.append(payment.blocks[i]);
            if (i < payment.blocks.length-1) {
              td.append(',');
            }
          }*/
          let td = $('<td data-sort="'+payment.time+'">'+readableDate(payment.time*1000)+'</td>');
          tr.append(td);
          td = $('<td><a href="'+pooldata.config.txURL+payment.hash+'" title="View transaction" target="_blank" class="text-custom">'+payment.hash+'</a></td>');
          tr.append(td);
          td = $('<td>'+payment.amount+'</td>');
          tr.append(td);
          td = $('<td>'+payment.fee+'</td>');
          tr.append(td);
          td = $('<td>'+payment.payees+'</td>');
          tr.append(td);
          tr.appendTo(paymentsBody);
        }
        $('#minerCount').text(pooldata.pooldata.minerCount);
        $('#workerCount').text(pooldata.pooldata.workerCount);
        $('#sharesCount').text(pooldata.pooldata.shareCount.toFixed(4));

        if (table !== undefined) {
          table.destroy();
        }
        table = $('#paymentsTable').DataTable({
          "pagingType": "full_numbers",
          "lengthMenu": [
            [10, 25, 50, 100, -1],
            [10, 25, 50, 100, "All"]
          ],
          "order": [[1, "desc"]],
          responsive: false,
          language: {
            search: "_INPUT_",
            searchPlaceholder: "Search payments",
          }
        });
      }
    }
  });
}

var coinConfigCheck;
$(document).ready(function() {
  coinConfigCheck = setInterval(() => {
    if (coinConfigData !== undefined) {
      clearInterval(coinConfigCheck);
      updatePayments();
    }
  }, 200);
});
function updatePage() {
  updatePayments();
}

log("payments_cn.html vPOOL_VERSION");

