var table;
var coinConfigCheck;
$(document).ready(function() {
  coinConfigCheck = setInterval(() => {
    if (coinConfigData !== undefined) {
      clearInterval(coinConfigCheck);
      updateMiners();
    }
  }, 200);
});
function updateMiners() {
  var url = site+'/api/workerstats';
  $.ajax({
    Method: 'GET',
    url: url,
    dataType: 'json',
    success: function (data) {
      var stats = data;
      for (var pool in stats.pools) {
        if (pool !== poolCoin) continue;
        var pooldata = stats.pools[pool];
        $('#minerCount').html(pooldata.minerCount);
        $('#workerCount').html(pooldata.workerCount);
        $('#sharesCount').html(pooldata.shareCount.toFixed(4));

        $('#workersBody').empty();
        /*<tr>
            <td><a href="/workers/{=worker.split('.')[0]}">{=worker}</a></td>
            <td>{=Math.round(workerstat.currRoundShares * 100) / 100}</td>
            <td>{? workerstat.shares > 0} {=Math.floor(10000 * workerstat.shares / (workerstat.shares + workerstat.invalidshares)) / 100}% {??} 0% {?}</td>
            <td>{=workerstat.hashrateString}</td>
        </tr>*/

        var miners = {};
        for (var worker in pooldata.workers) {
          var workerstat = pooldata.workers[worker];
          //console.log(workerstat);
          var minerstat = miners[worker.split('.')[0]] || {currRoundShares:0,shares:0,invalidshares:0,hashrate:0,workers:[]}
          minerstat.name = worker.split('.')[0];
          minerstat.currRoundShares += workerstat.currRoundShares;
          minerstat.shares += workerstat.shares;
          minerstat.invalidshares += workerstat.invalidshares;
          minerstat.hashrate += workerstat.hashrate;
          //minerstat.workers.push(workerstat);
          miners[minerstat.name] = minerstat;
          //console.log(minerstat);
        }
        var sortedMiners = [];
        for (var miner in miners) {
          sortedMiners.push(miners[miner]);
        }
        sortedMiners.sort(function(a,b) {
          return b.hashrate - a.hashrate;
        });

        for (var i = 0; i < sortedMiners.length; i++) {
          var tr = $('<tr></tr>');
          var td = $('<td><a href="/coins/'+coin+'/workers/'+sortedMiners[i].name+'" class="text-custom">'+getFormattedAddress(sortedMiners[i].name)+'</a></td>');
          tr.append(td);
          td = $('<td>'+(Math.round(sortedMiners[i].currRoundShares * 100) / 100)+'</td>');
          tr.append(td);
          td = $('<td>'+(sortedMiners[i].shares > 0 ? (Math.floor(10000 * sortedMiners[i].shares / (sortedMiners[i].shares + sortedMiners[i].invalidshares)) / 100): 0)+'%</td>');
          tr.append(td);
          td = $('<td data-sort="'+sortedMiners[i].hashrate+'">'+getReadableHashRateString(sortedMiners[i].hashrate, coinConfigData.algo)+'</td>');
          tr.append(td);
          tr.appendTo($('#workersBody'));
        }
      }
      if (table !== undefined) {
        table.destroy();
      }
      table = $('#minerTable').DataTable({
        "pagingType": "full_numbers",
        "lengthMenu": [
          [10, 25, 50, -1],
          [10, 25, 50, "All"]
        ],
        "order": [[3, "desc"]],
        responsive: false,
        language: {
          search: "_INPUT_",
          searchPlaceholder: "Search records",
        }
      });

    }
  });
}

function updatePage() {
  updateMiners();
}

log("workers.html vPOOL_VERSION");

