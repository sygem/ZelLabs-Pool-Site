if (typeof coinGeckoID === undefined || coinGeckoID === '') {
    $('#marketStats').parent().remove();
    $('#blocksColumn').removeClass('col-xxl-9');
  } else {
    $('#marketStats').removeClass('invisible');
  }

  function updateStats() {
    var statsUrl = site+'/api/homestats';
    $.ajax({
      Method: 'GET',
      url: statsUrl,
      dataType: 'json',
      success: function (data) {
        var stats = data;
        for (var pool in stats.pools) {
          if (pool !== poolCoin) continue;
          var pooldata = stats.pools[pool];
          var coinName = pooldata.name;
          var coinNameCaps = coinName.charAt(0).toUpperCase() + coinName.slice(1);
          var symbol = pooldata.symbol;
          var miners = pooldata.minerCount;
          var workers = pooldata.workerCount;
          var hashrate = pooldata.hashrateString;
          //var hashrateAVG = (getReadableHashRateString(calculateAverageHashrate(pool)));
          var luckDays = pooldata.luckDays;
          var validblocks = pooldata.poolStats.validBlocks;
          var totalPaid = (parseFloat(pooldata.poolStats.totalPaid)).toFixed(2);
          var networkBlocks = Number(pooldata.poolStats.networkBlocks).toLocaleString();
          var networkDiff = (parseFloat(pooldata.poolStats.networkDiff)).toFixed(2);
          var networkSols = (getReadableNetworkHashRateString(pooldata.poolStats.networkSols, coinConfigData.algo==='equihash'));
          var networkConnections = pooldata.poolStats.networkConnections;

          var poolFee = 0;
          for (var fee in pooldata.poolFees) {
            poolFee += pooldata.poolFees[fee];
          }

          //console.log(stats.pools[pool]);

          $("#poolHashrate").text(hashrate);
          if (luckDays < 0.04166667) {
            $("#poolLuck").text((luckDays*24*60).toFixed(0)+" Minutes");
          } else if (luckDays < 1) {
            $("#poolLuck").text((luckDays*24).toFixed(2)+" Hours");
          } else {
            $("#poolLuck").text(luckDays+" Days");
          }
          $("#poolBlocksFound").text(Number(validblocks).toLocaleString());
          $("#poolFee").text(poolFee+"%");
          $('#poolFeeKnob').val(poolFee).trigger('change');
          $("#poolMiners").text(miners);
          $("#poolWorkers").text(workers);

          $("#networkHashrate").text(pooldata.poolStats.networkSolsString);
          $("#networkDiff").text(networkDiff);
          $("#networkBlockHeight").text(networkBlocks);
          $("#networkBlockReward").text(pooldata.block.coininfo.blockReward+' '+coin.toUpperCase());
          $("#networkConnections").text(networkConnections);
          $("#networkVersion").text(pooldata.poolStats.networkVersion);
          $('#networkVersion2').text(pooldata.poolStats.networkProtocolVersion);

          var blockBody = $('#blocksBody');
          blockBody.empty();
          var blockTable = pooldata.block.blocktable;
          //console.log(blockTable);
          var count = -1;

          var lastBlockTime = -1;
          var validBlockFound = false;

          for (var block in blockTable.pendingblocks) {
            count++;
            if (count > maxBlocks) break;
            var blockData = blockTable.pendingblocks[block].split(":");
            
            if (lastBlockTime === -1) {
              lastBlockTime = parseInt(blockData[4]);
            }

            var tr = $('<tr></tr>');
            var td = $('<td>'+Number(blockData[2]).toLocaleString()+'</td>');
            tr.append(td);
            td = $('<td data-toggle="tooltip" data-title="'+readableLongDate(blockData[4])+'">'+readableDate(blockData[4])+'</td>');
            td.tooltip();
            tr.append(td);
            if (blockData.length > 5) {
              td = $('<td>'+blockData[5]+'</td>');
            } else {
              td = $('<td>-</td>');
            }
            tr.append(td);
            var workernames = blockData[3].split('.');
            var workername = workernames[workernames.length==2 ? 1 : 0];
            if (blockData.length > 8) {
              var location = blockData[8];
              td = $('<td></td>');
              var a = $('<a href="/coins/'+coin+'/workers/'+workernames[0]+'" data-toggle="tooltip" data-title="'+location+'" class="text-custom">'+workername+'</a>');
              td.append(a);
              /*let divCarousel = $('<div id="slider2-'+blockData[2]+'" class="carousel vert slide" data-ride="carousel" data-pause="false" data-interval="5000"></div');
              var divCarouselInner = $('<div class="carousel-inner"></div>');
              var divItem1 = $('<div class="carousel-item active"></div>');
              divItem1.append('<a href="/coins/'+coin+'/workers/'+workernames[0]+'" class="text-custom">'+workername+'</a>');
              var divItem2 = $('<div class="carousel-item"></div>');
              divItem2.append('<a href="/coins/'+coin+'/workers/'+workernames[0]+'" class="text-custom">'+location+'</a>');
              divCarouselInner.append(divItem1);
              divCarouselInner.append(divItem2);
              divCarousel.append(divCarouselInner);
              td.append(divCarousel);
              tr.append(td);
              setTimeout(function() {divCarousel.carousel();},count*80);*/
              //td = $('<td><a href="/coins/'+coin+'/workers/'+workernames[0]+'" data-toggle="tooltip" data-title="'+location+'" class="text-custom">'+workername+'</a></td>');
              tr.append(td);
              a.tooltip();
              var s = location;
              if (s.indexOf('-stratum') > 0) {
                s = s.substring(0,s.indexOf('-stratum'));
              }
              tr.append($('<td class="text-info">'+s+'</td>'));
            } else {
              td = $('<td><a href="/coins/'+coin+'/workers/'+workernames[0]+'" class="text-custom">'+workername+'</a></td>');
              tr.append(td);
              tr.append($('<td>-</td>'));
            }
            td = $('<td>-</td>');
            if (blockData.length > 7) {
              var ttf = parseFloat(blockData[6]);
              var lbf = parseFloat(blockData[7]);
              //console.log(Number(blockData[2]).toLocaleString()+' '+ttf+' '+lbf);
              if (lbf !== -1) {
                lbf /= 60;
                var effort = (lbf * 100 / ttf).toFixed(2);
                //console.log(' - '+effort);
                td.text(effort+'%');
                if (effort <= 100) {
                  td.addClass('text-success');
                } else {
                  td.addClass('text-danger');
                }
              }
              tr.append(td);
              td = $('<td>-</td>');
              if (lbf !== -1) {
                var luck = '';
                //luck = (ttf*100 / lbf).toFixed(2);
                if (lbf > ttf) {
                  luck = '-'+((lbf - ttf)*100 / ttf).toFixed(2);
                  td.addClass('text-danger');
                } else {
                  luck = (ttf*100 / lbf).toFixed(2);
                  td.addClass('text-success');
                }
                td.text(luck+'%');
              }
              tr.append(td);
            } else {
              tr.append(td);
              td = $('<td>-</td>');
              tr.append(td);
            }
            td = $('<td></td>');
            var b = '';
            if (blockTable.confirms) {
              if (blockTable.confirms[blockData[0]]) {
                validBlockFound = true;
                if (blockTable.confirms[blockData[0]] < 100) {
                  if (blockTable.confirms[blockData[0]] < 15) {
                    b = '  <div class="progress progress-lg mb-10">';
                    b += '    <div class="progress-bar progress-bar-info active progress-bar-striped progress-bar-animated" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(blockTable.confirms[blockData[0]] * 100 / 100)+'" style="width: '+Math.round(blockTable.confirms[blockData[0]] * 100 / 100)+'%; font-size: 11px;" role="progressbar" data-toggle="tooltip" title="'+blockTable.confirms[blockData[0]]+' Confirmations"></div>';
                    b += '  </div>';
                  } else {
                    b = '  <div class="progress progress-lg mb-10">';
                    b += '    <div class="progress-bar progress-bar-info active progress-bar-striped progress-bar-animated" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(blockTable.confirms[blockData[0]] * 100 / 100)+'" style="width: '+Math.round(blockTable.confirms[blockData[0]] * 100 / 100)+'%; font-size: 11px;" role="progressbar" data-toggle="tooltip" title="'+blockTable.confirms[blockData[0]]+' Confirmations"> '+blockTable.confirms[blockData[0]]+'%</div>';
                    b += '  </div>';
                  }
                } else if (coinConfigData.requireShielding === true) {
                  b = '  <div class="progress progress-lg mb-10">';
                  b += '    <div class="progress-bar progress-bar-warning active progress-bar-striped progress-bar-animated bg-warning" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" style="width: 100%; font-size: 11px;" role="progressbar">Shielding</div>';
                  b += '  </div>';
                } else {
                  var b = '  <div class="progress progress-lg mb-10 ">';
                  b += '    <div class="progress-bar progress-bar-info active progress-bar-striped progress-bar-animated" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" style="width: 100%; font-size: 11px;" role="progressbar">100%</div>';
                  b += '  </div>';
                }
              } else {
                if (validBlockFound) { // ORPHAN??
                  b = '  <div class="progress progress-lg mb-10">';
                  b += '    <div class="progress-bar progress-transparent custom-color-blue active progress-bar-striped progress-bar-animated " aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"  style="width: 100%; font-size: 11px;" role="progressbar">ORPHAN</div>';
                  b += '  </div>';
                } else {
                  b = '  <div class="progress progress-lg mb-10">';
                  b += '    <div class="progress-bar progress-bar-danger active progress-bar-striped progress-bar-animated " aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"  style="width: 100%; font-size: 11px;" role="progressbar">PENDING</div>';
                  b += '  </div>';
                }
              }
            } else {
              b = '  <div class="progress progress-lg mb-10 ">';
              b += '    <div class="progress-bar progress-bar-info progress-bar-striped" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"  style="width: 100%; font-size: 11px;" role="progressbar"></div>';
              b += '  </div>';
            }
            td.append($(b));
            tr.append(td);
            td = $('<td><a href="'+pooldata.block.blockURL+blockData[0]+'" target="_blank" rel="noopener" class="text-custom"><i title="View on Explorer" class="zel-icon zel-icon-money2"></i></a></td>');
            tr.append(td);
            tr.appendTo(blockBody);
          }
          var confirmedCount = 0;
          for (var block in blockTable.confirmedblocks) {
            count++;
            if (count > maxBlocks) break;
            confirmedCount++;
            if (confirmedCount > 20) break;
            var blockData = blockTable.confirmedblocks[block].split(":");

            if (lastBlockTime === -1) {
              lastBlockTime = parseInt(blockData[4]);
            }

            var tr = $('<tr></tr>');
            var td = $('<td>'+Number(blockData[2]).toLocaleString()+'</td>');
            tr.append(td);
            td = $('<td data-toggle="tooltip" data-title="'+readableLongDate(blockData[4])+'">'+readableDate(blockData[4])+'</td>');
            td.tooltip();
            tr.append(td);
            if (blockData.length > 5) {
              td = $('<td>'+blockData[5]+'</td>');
            } else {
              td = $('<td>-</td>');
            }
            tr.append(td);
            var workernames = blockData[3].split('.');
            var workername = workernames[workernames.length==2 ? 1 : 0];
            if (blockData.length > 8) {
              var location = blockData[8];
              td = $('<td></td>');
              var a = $('<a href="/coins/'+coin+'/workers/'+workernames[0]+'" data-toggle="tooltip" data-title="'+location+'" class="text-custom">'+workername+'</a>');
              td.append(a);
              tr.append(td);
              a.tooltip();
              /*var location = blockData[8];
              td = $('<td></td>');
              let divCarousel = $('<div id="slider2-'+blockData[2]+'" class="carousel vert slide" data-ride="carousel" data-pause="false" data-interval="5000"></div');
              var divCarouselInner = $('<div class="carousel-inner"></div>');
              var divItem1 = $('<div class="carousel-item active"></div>');
              divItem1.append('<a href="/coins/'+coin+'/workers/'+workernames[0]+'" class="text-custom">'+workername+'</a>');
              var divItem2 = $('<div class="carousel-item"></div>');
              divItem2.append('<a href="/coins/'+coin+'/workers/'+workernames[0]+'" class="text-custom">'+location+'</a>');
              divCarouselInner.append(divItem1);
              divCarouselInner.append(divItem2);
              divCarousel.append(divCarouselInner);
              td.append(divCarousel);
              tr.append(td);
              setTimeout(function() {divCarousel.carousel();},count*80);*/
              var s = location;
              if (s.indexOf('-stratum') > 0) {
                s = s.substring(0,s.indexOf('-stratum'));
              }
              tr.append($('<td class="text-info">'+s+'</td>'));
            } else {
              td = $('<td><a href="/coins/'+coin+'/workers/'+workernames[0]+'" class="text-custom">'+workername+'</a></td>');
              tr.append(td);
              tr.append($('<td>-</td>'));
            }
            td = $('<td>-</td>');
            if (blockData.length > 7) {
              var ttf = parseInt(blockData[6]);
              var lbf = parseInt(blockData[7]);
              if (lbf !== -1) {
                lbf /= 60;
                var effort = (lbf * 100 / ttf).toFixed(2);
                td.text(effort+'%');
                if (effort <= 100) {
                  td.addClass('text-success');
                } else {
                  td.addClass('text-danger');
                }
              }
              tr.append(td);
              td = $('<td>-</td>');
              if (lbf !== -1) {
                var luck = '';
                if (lbf > ttf) {
                  luck = '-'+(lbf*100 / ttf).toFixed(2);
                  luck = '-'+((lbf - ttf)*100 / ttf).toFixed(2);
                  td.addClass('text-danger');
                } else {
                  luck = (ttf*100 / lbf).toFixed(2);
                  td.addClass('text-success');
                }
                td.text(luck+'%');
              }
              tr.append(td);
            } else {
              tr.append(td);
              td = $('<td>-</td>');
              tr.append(td);
            }
            td = $('<td></td>');
            var b = '  <div class="progress progress-lg mb-10 ">';
            b += '    <div class="progress-bar progress-bar-success active progress-bar-striped" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" style="width: 100%; font-size: 11px;" role="progressbar">PAID</div>';
            b += '  </div>';
            td.append($(b));
            tr.append(td);
            td = $('<td><a href="'+pooldata.block.blockURL+blockData[0]+'" target="_blank" rel="noopener" class="text-custom"><i title="View on Explorer" class="zel-icon zel-icon-money2"></i></a></td>');
            tr.append(td);
            tr.appendTo(blockBody);
          }

          if (lastBlockTime === -1 || luckDays === 0) {
            $('#currentPoolLuck').text('0%');
          } else {
            var now = new Date();
            var then = new Date(lastBlockTime);
            var secondsSinceLastBlock = (now - then) / 1000;
            $('#currentPoolLuck').text(((secondsSinceLastBlock / (luckDays*24*60*60))*100).toFixed(2)+'%');
          }

          // EFFORT CHART
          if (!effortChart) {
            var light = $('body').hasClass('light_version');
            var contrast = Cookies.get('contrast');
            var color = light ? '#222' : '#ddd';
            if (contrast !== undefined) {
                switch (contrast) {
                    case 'low': color = light ? '#7779C7' : '#a5a8ad';
                                break;
                    case 'medium': color = light ? '#48494b' : '#bfc2c9';
                                break;
                }
            }
        
            effortChart = am4core.create("effortLineChart", am4charts.XYChart);
            effortChart.padding(2, 2, 2, 2);

            var xAxis = effortChart.xAxes.push(new am4charts.CategoryAxis());
            xAxis.dataFields.category = "numBlocks";
            xAxis.renderer.grid.template.disabled = true;
            xAxis.renderer.baseGrid.disabled = true;
            xAxis.renderer.labels.template.disabled = true;
            xAxis.cursorTooltipEnabled = false;

            effortAxis = effortChart.yAxes.push(new am4charts.ValueAxis());
            //valueAxis.min = 0;
            effortAxis.renderer.grid.template.disabled = true;
            effortAxis.renderer.baseGrid.disabled = true;
            //effortAxis.renderer.labels.template.disabled = true;
            effortAxis.cursorTooltipEnabled = false;
            effortAxis.renderer.labels.template.fill = am4core.color(color);

            effortChart.cursor = new am4charts.XYCursor();
            effortChart.cursor.lineY.disabled = true;
            effortChart.cursor.behavior = "none";

            var series = effortChart.series.push(new am4charts.LineSeries());
            series.adapter.add('tooltipText',function(text, target) {
              if (target == null || target.tooltipDataItem == null || target.tooltipDataItem.dataContext == null) return '';
              return 'Last '+target.tooltipDataItem.dataContext["numBlocks"]+' blocks\n'+
                     ' Effort: [bold]'+target.tooltipDataItem.dataContext["effort"].toFixed(1)+'%[/]';
            });
            series.tooltipText = "[bold]{effort}";
            series.dataFields.categoryX = "numBlocks";
            series.dataFields.valueY = "effort";
            series.tensionX = 0.8;
            series.strokeWidth = 2;

            var range = effortAxis.createSeriesRange(series);
            range.value = 100;
            range.endValue = -1000;
            range.contents.stroke = am4core.color('#00ff00');
            range.contents.fill = range.contents.stroke;
            range.contents.strokeOpacity = 0.7;
            range.contents.fillOpacity = 0.1;
        
            var range2 = effortAxis.createSeriesRange(series);
            range2.value = 100;
            range2.endValue = 1000;
            range2.contents.stroke = am4core.color('#ff0000');
            range2.contents.fill = range2.contents.stroke;
            range2.contents.strokeOpacity = 0.7;
            range2.contents.fillOpacity = 0.1;

            var range3 = effortAxis.axisRanges.create();
            range3.value = 99.9;
            range3.endValue = 100.1;
            range3.axisFill.fill = am4core.color("#777777");
            range3.axisFill.fillOpacity = 0.2;
            range3.grid.strokeOpacity = 0;
        
          }

          var min = 1000;
          var max = 0;
          for (var i=0;i<pooldata.effortDetails.length;i++) {
            if (pooldata.effortDetails[i].effort < min) min = pooldata.effortDetails[i].effort;
            if (pooldata.effortDetails[i].effort > max) max = pooldata.effortDetails[i].effort;
            if (pooldata.effortDetails[i].numBlocks == 64 || pooldata.effortDetails[i].numBlocks == 128 || pooldata.effortDetails[i].numBlocks == 256 || pooldata.effortDetails[i].numBlocks == 512 || pooldata.effortDetails[i].numBlocks == 1024) {
              $('#effort'+pooldata.effortDetails[i].numBlocks).removeClass();
              $('#effort'+pooldata.effortDetails[i].numBlocks).addClass(pooldata.effortDetails[i].effort > 100 ? 'text-danger' : 'text-success');
              $('#effort'+pooldata.effortDetails[i].numBlocks).text(pooldata.effortDetails[i].effort.toFixed(1)+'%');
              $('#orphan'+pooldata.effortDetails[i].numBlocks).text((pooldata.effortDetails[i].orphan/pooldata.effortDetails[i].numBlocks).toFixed(3)+'%');
            }
          }
          min -= 2;
          max += 2;
          effortAxis.min = min;
          effortAxis.max = Math.max(max,102);

          effortChart.data = pooldata.effortDetails;

        }
      }
    });
  }

  var effortChart;
  var effortAxis

  var chart;
  var poolHashArray = [];
  var poolHashAvgArray = [];
  var networkHashArray = [];
  var networkDiffArray = [];
/*  var timeLabelsArray = [];
  var minDiff = Number.MAX_SAFE_INTEGER;
  var maxDiff = 0;
  var maxPoolHash = 0;
  var minPoolHash = Number.MAX_SAFE_INTEGER;
  var seriesShowing = [true,true,false,true];
  var seriesNames = ['Pool Hash', 'Pool Hash Avg', 'Network Hash', 'Network Diff'];*/

  var coinConfigCheck;
  $(document).ready(function() {
    coinConfigCheck = setInterval(() => {
      if (coinConfigData !== undefined) {
        clearInterval(coinConfigCheck);
        updateStats();
        updateChart_amCharts(getNumberCookieValue('_DashboardGraph_Time',86400));
        updateMarketStats();
        $('.setting_switch .lv-btn').change(function() {
          setTimeout(function() { 
            updateChart_amCharts_Colours();
          },10);
        });
      }
    }, 200);
  });

  function updateMarketStats() {
    $.ajax({
      Method: 'GET',
      url: "https://api.coingecko.com/api/v3/coins/"+coinGeckoID+"?tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false",
      dataType: 'json',
      success: function (data) {
        //console.log(data);
        if (data.hasOwnProperty("market_data")) {
          $('#btcPrice').html('<i class="zel-icon zel-icon-bitcoin"></i> '+data.market_data.current_price.btc.toFixed(8));
          $('#usdPrice').html("$"+data.market_data.current_price.usd.toFixed(2).toLocaleString());
          if (data.market_data.price_change_percentage_1h_in_currency.btc) {
            var oneHchange = data.market_data.price_change_percentage_1h_in_currency.btc.toFixed(2);
            $('#1hChange').html(oneHchange.toLocaleString()+'%');
            $('#1hChange').removeClass();
            if (oneHchange < 0) {
              $('#1hChange').addClass('text-danger');
            } else if (oneHchange > 0) {
              $('#1hChange').addClass('text-success');
            }
          } else {
            $('#1hChange').html('0%');
          }
          if (data.market_data.price_change_percentage_24h_in_currency.btc) {
            var twentyfourHchange = data.market_data.price_change_percentage_24h_in_currency.btc.toFixed(2);
            $('#24hChange').html(twentyfourHchange.toLocaleString()+'%');
            $('#24hChange').removeClass();
            if (twentyfourHchange < 0) {
              $('#24hChange').addClass('text-danger');
            } else if (twentyfourHchange > 0) {
              $('#24hChange').addClass('text-success');
            }
          } else {
            $('#24hChange').html('0%');
          }
          $('#24hVolUSD').html("$"+data.market_data.total_volume.usd.toLocaleString());
          $('#24hVolBTC').html('<i class="zel-icon zel-icon-bitcoin"></i> '+data.market_data.total_volume.btc);
          $('#marketCap').html("$"+data.market_data.market_cap.usd.toLocaleString());
          $('#marketCapRank').html(data.market_data.market_cap_rank);
        }
      }
    });
  }

  function toggleGraphFullScreen() {
    var graphCard = $('.hashrate-graph');
    var height = 402;
    if (graphCard.hasClass('fullscreen')) {
      height = window.innerHeight - 100;
    }
    chart.svgContainer.htmlElement.style.height = height + "px";
    chart.appear();
    //chart.updateOptions(options, false, false, true);

  }

  var valueAxisHash;
  var valueAxisDiff;
  var dateAxis;
  var columnDateAxis;
  let first = true;
  var poolHashSeries;
  var bgColor;
  var thumbColor;

  var scrollbarVisible = getBooleanCookieValue("_DashboardGraph_Scrollbar",true); // set this from a cookie

  function toggleGraphScrollbar() {
    scrollbarVisible = !scrollbarVisible;
    if (!scrollbarVisible) {
        chart.scrollbarX.dispose();
    } else {
        chart.scrollbarX = new am4charts.XYChartScrollbar();
        chart.scrollbarX.series.push(poolHashSeries);
        chart.scrollbarX.unselectedOverlay.fill = am4core.color(bgColor);
        chart.scrollbarX.background.fill = am4core.color(bgColor);
        chart.scrollbarX.thumb.background.fill = am4core.color(thumbColor);
        chart.scrollbarX.start = getNumberCookieValue('_DashboardGraph_Start',0.75);
        chart.scrollbarX.end = getNumberCookieValue('_DashboardGraph_End',1);
    }
    setBooleanCookieValue("_DashboardGraph_Scrollbar",scrollbarVisible);
    chart.appear();
  }

  function contrastChanged() {
    updateChart_amCharts_Colours();
  }

  function updateChart_amCharts_Colours() {
    var light = $('body').hasClass('light_version');
    var contrast = Cookies.get('contrast');
    var color = light ? '#222' : '#ddd';
    if (contrast !== undefined) {
        switch (contrast) {
            case 'low': color = light ? '#7779C7' : '#a5a8ad';
                        break;
            case 'medium': color = light ? '#48494b' : '#bfc2c9';
                        break;
        }
    }
    bgColor = light ? '#FFF' : '#282B2F';
    thumbColor = light ? new Color(bgColor).darken(10) : new Color(bgColor).lighten(10);

    dateAxis.renderer.labels.template.fill = am4core.color(color);
    valueAxisHash.title.fill = am4core.color(color);
    valueAxisHash.renderer.labels.template.fill = am4core.color(color);
    valueAxisDiff.title.fill = am4core.color(color);
    valueAxisDiff.renderer.labels.template.fill = am4core.color(color);

    if (scrollbarVisible) {
      chart.scrollbarX.unselectedOverlay.fill = am4core.color(bgColor);
      chart.scrollbarX.background.fill = am4core.color(bgColor);
      chart.scrollbarX.thumb.background.fill = am4core.color(thumbColor);
    }

    chart.series.values.forEach(series => {
      series.legendSettings.labelText = "["+color+"]{name}[/]";
    });

    effortAxis.renderer.labels.template.fill = am4core.color(color);
  }

  var lastChartDate = 0;
  var blockDataStart = 0;
  var numHours = 0;

  function deleteChart() {
    chart.dispose();
    chart = null;
  }

  function recreateChart(time) {
    lastChartDate=0;
    deleteChart();
    setTimeout(function() {
      updateChart_amCharts(time);
    },10);
  }

  function updateChart_amCharts(numSeconds = 86400) {
    setNumberCookieValue('_DashboardGraph_Time',numSeconds);
    var timeSelector = $('#timeSelector li a.active');
    //var numSeconds = parseInt(timeSelector.attr('id'));
    var light = $('body').hasClass('light_version');
    var contrast = Cookies.get('contrast');
    var color = light ? '#222' : '#ddd';
    if (contrast !== undefined) {
        switch (contrast) {
            case 'low': color = light ? '#7779C7' : '#a5a8ad';
                        break;
            case 'medium': color = light ? '#48494b' : '#bfc2c9';
                        break;
        }
    }
    bgColor = light ? '#FFF' : '#282B2F';
    thumbColor = light ? new Color(bgColor).darken(10) : new Color(bgColor).lighten(10);

    var lastDateArg = '';
    if (lastChartDate > 0) {
      lastDateArg = '&fromDate='+lastChartDate;
      //console.log(lastDateArg);
    }

    $.ajax({
        Method: 'GET',
        url: site+"/api/homegraphdata?maxData=720&numSeconds="+numSeconds+lastDateArg,
        dataType: 'json',
        success: function (data) {
            
            if (!chart || chart===null) {
                am4core.useTheme(am4themes_animated);
                chart = am4core.create("hashrateLineChart", am4charts.XYChart);
                chart.padding(8, 2, 2, 2);

                dateAxis = chart.xAxes.push(new am4charts.DateAxis());
                dateAxis.renderer.labels.template.fill = am4core.color(color);
                dateAxis.dataFields.category = "time";
                dateAxis.renderer.labels.template.fontSize = 12;
                dateAxis.cursorTooltipEnabled = false;

                categoryAxisBlocks = chart.xAxes.push(new am4charts.CategoryAxis());
                categoryAxisBlocks.hidden = true;
                categoryAxisBlocks.dataFields.category = "hour";
                categoryAxisBlocks.renderer.labels.template.disabled = true
                categoryAxisBlocks.renderer.grid.template.disabled = true;
                categoryAxisBlocks.renderer.baseGrid.disabled = true;
                categoryAxisBlocks.renderer.opposite = true;
                categoryAxisBlocks.cursorTooltipEnabled = false;

                dateAxis.keepSelection = true;
                
                valueAxisHash = chart.yAxes.push(new am4charts.ValueAxis());
                valueAxisHash.title.text = "Hashrate"
                valueAxisHash.title.fill = am4core.color(color);
                valueAxisHash.renderer.labels.template.fill = am4core.color(color);
                valueAxisHash.renderer.labels.template.adapter.add("text", (label, target, key) => {
                    return $(window).width() > 500 ? getReadableNetworkHashRateString(target.dataItem.value, coinConfigData.algo==='equihash') : '';
                });
                valueAxisHash.renderer.labels.template.fontSize = 10;
                valueAxisHash.cursorTooltipEnabled = false;

                valueAxisDiff = chart.yAxes.push(new am4charts.ValueAxis());
                valueAxisDiff.title.text = "Network Diff"
                valueAxisDiff.title.fill = am4core.color(color);
                valueAxisDiff.renderer.labels.template.fill = am4core.color(color);
                valueAxisDiff.renderer.opposite = true;
                valueAxisDiff.renderer.labels.template.fontSize = 10;
                valueAxisDiff.cursorTooltipEnabled = false;

                var animationDuration = 1000;

                var poolColor = getComputedStyle(document.documentElement).getPropertyValue('--color1').toUpperCase().trim();
                var avgColor = Color(poolColor).h(25, true);
                var netColor = Color(poolColor).h(180, true);
                var blockColor = Color(poolColor).h(90, true);

                chart.colors.list = [
                    am4core.color(poolColor), // POOL HASHRATE
                    am4core.color(avgColor.toString()), // POOL AVG HASH
                    am4core.color(netColor.toString()), // NET HASH
                    am4core.color('#DF4159'), // DIFF,
                    am4core.color(blockColor.toString()), // BLOCKS
                ];

                poolHashSeries = chart.series.push(new am4charts.LineSeries());
                poolHashSeries.name = "Pool Hashrate";
                poolHashSeries.dataFields.valueY = "poolHash";
                poolHashSeries.dataFields.dateX = "time";
                poolHashSeries.yAxis = valueAxisHash;
                poolHashSeries.xAxis = dateAxis;
                poolHashSeries.strokeWidth = 2;
                poolHashSeries.fillOpacity = 0.1;
                poolHashSeries.stroke = am4core.color(poolColor);
                poolHashSeries.tensionX = 0.9;
                poolHashSeries.adapter.add('tooltipText',function(text, target) {
                    //console.log(JSON.stringify(target.tooltipDataItem.dataContext["blocks"]));
                    var blockToolTip = '';
                    /*var blocks = target.tooltipDataItem.dataContext["blocks"];
                    if (blocks.length > 0) {
                        blockToolTip += '\n\n';
                        for (var i=0;i<blocks.length;i++) {
                            blockToolTip += '[bold]Block [/]'+Number(blocks[i].number).toLocaleString()+'\n';
                        }
                    }*/
                    if (target == null || target.tooltipDataItem == null || target.tooltipDataItem.dataContext == null) return '';
                    return '[bold]'+readableLongDate(target.tooltipDataItem.dataContext["time"])+'[/]\n'+
                           '- Pool Hash: '+getReadableNetworkHashRateString(target.tooltipDataItem.dataContext["poolHash"], coinConfigData.algo==='equihash', true)+'\n'+
                           '- Network Hash: '+getReadableNetworkHashRateString(target.tooltipDataItem.dataContext["netHash"], coinConfigData.algo==='equihash', true)+'\n'+
                           '- Network Diff: '+target.tooltipDataItem.dataContext["diff"]+blockToolTip;
                });
                poolHashSeries.legendSettings.labelText = "["+color+"]{name}[/]";

                var fillModifier = new am4core.LinearGradientModifier();
                fillModifier.opacities = [0.15, 0];
                fillModifier.offsets = [0, 1];
                fillModifier.gradient.rotation = 60;
                //series.segments.template.fillModifier = fillModifier;

                var avgHashSeries = chart.series.push(new am4charts.LineSeries());
                avgHashSeries.name = "Pool Hash Avg";
                avgHashSeries.dataFields.valueY = "avg";
                avgHashSeries.dataFields.dateX = "time";
                avgHashSeries.strokeWidth = 1.5;
                avgHashSeries.yAxis = valueAxisHash;
                avgHashSeries.xAxis = dateAxis;
                avgHashSeries.stroke = am4core.color(avgColor.toString());
                avgHashSeries.hidden = getBooleanCookieValue('_DashboardGraph_Pool_Hash_Avg', false);
                avgHashSeries.legendSettings.labelText = "["+color+"]{name}[/]";

                var networkHashSeries = chart.series.push(new am4charts.LineSeries());
                networkHashSeries.name = "Network Hashrate";
                networkHashSeries.dataFields.valueY = "netHash";
                networkHashSeries.dataFields.dateX = "time";
                networkHashSeries.strokeWidth = 1.5;
                networkHashSeries.yAxis = valueAxisHash;
                networkHashSeries.xAxis = dateAxis;
                networkHashSeries.hidden = getBooleanCookieValue('_DashboardGraph_Network_Hashrate', true);
                networkHashSeries.stroke = am4core.color(netColor.toString());
                networkHashSeries.legendSettings.labelText = "["+color+"]{name}[/]";

                var networkDiffSeries = chart.series.push(new am4charts.LineSeries());
                networkDiffSeries.name = "Network Diff";
                networkDiffSeries.dataFields.valueY = "diff";
                networkDiffSeries.dataFields.dateX = "time";
                networkDiffSeries.strokeWidth = 1.5;
                networkDiffSeries.tensionX = 0.8;
                networkDiffSeries.zindex = 0;
                networkDiffSeries.hidden = getBooleanCookieValue('_DashboardGraph_Network_Diff', false);
                networkDiffSeries.yAxis = valueAxisDiff;
                networkDiffSeries.xAxis = dateAxis;
                networkDiffSeries.stroke = am4core.color('#DF4159');
                networkDiffSeries.strokeDasharray = "3,6";
                networkDiffSeries.legendSettings.labelText = "["+color+"]{name}[/]";

                valueAxisBlocks = chart.yAxes.push(new am4charts.ValueAxis());
                valueAxisBlocks.renderer.labels.template.disabled = true
                valueAxisBlocks.renderer.opposite = true;
                valueAxisBlocks.cursorTooltipEnabled = false;

                var numBlocksSeries = chart.series.push(new am4charts.ColumnSeries());
                numBlocksSeries.name = "Blocks";
                numBlocksSeries.yAxis = valueAxisBlocks;
                numBlocksSeries.xAxis = categoryAxisBlocks;
                numBlocksSeries.dataFields.valueY = "numBlocks";
                numBlocksSeries.dataFields.categoryX = "hour";
                numBlocksSeries.hidden = getBooleanCookieValue('_DashboardGraph_Blocks', true);
                numBlocksSeries.zindex = 0;
                numBlocksSeries.fillOpacity = 0.15;
                numBlocksSeries.columns.template.strokeOpacity = 0.8;
                numBlocksSeries.legendSettings.labelText = "["+color+"]{name}[/]";
                numBlocksSeries.adapter.add('tooltipText',function(text, target) {
                    //console.log(JSON.stringify(target.tooltipDataItem.dataContext["blocks"]));
                    if (target == null || target.tooltipDataItem == null || target.tooltipDataItem.dataContext == null) return '';
                    var numBlocks = target.tooltipDataItem.dataContext["numBlocks"];
                    if (numBlocks > 0) {
                        return numBlocks+' Block'+(numBlocks > 1 ? 's' : '')+' Found';
                    } else {
                        return '';
                    }
                });

                /*var series4 = chart.series.push(new am4charts.LineSeries());
                series4.name = "Blocks";
                series4.dataFields.valueY = "block";
                series4.dataFields.dateX = "time";
                series4.strokeWidth = 0;
                //series4.tensionX = 0.8;
                //series4.zindex = 0;
                series4.yAxis = valueAxisDiff;
                series4.stroke = am4core.color(avgColor.toString());
                //series4.strokeDasharray = "3,3";
                series4.legendSettings.labelText = "["+color+"]{name}[/]";
                series4.adapter.add('tooltipText',function(text, target) {
                    var blocks = target.tooltipDataItem.dataContext["blocks"];
                    if (blocks.length == 0) return '';
                    //console.log(JSON.stringify(blocks));
                    return "Block "+Number(blocks[0].number).toLocaleString();
                });
                var bullet = series4.bullets.push(new am4charts.Bullet());
                var square = bullet.createChild(am4core.Rectangle);
                square.width = 5;
                square.height = 5;
                square.horizontalCenter = "middle";
                square.verticalCenter = "middle";
                //square.stroke = am4core.color(avgColor.toString());
                //square.strokeWidth = 1;
                // Make square drop shadow by adding a DropShadow filter
                var shadow = new am4core.DropShadowFilter();
                shadow.dx = 2;
                shadow.dy = 2;
                square.filters.push(shadow);*/
                //series4.yAxis = valueAxisBlocks;

                if (scrollbarVisible) {
                    // Create a horizontal scrollbar with previe and place it underneath the date axis
                    chart.scrollbarX = new am4charts.XYChartScrollbar();
                    chart.scrollbarX.series.push(poolHashSeries);
                    //chart.scrollbarX.series.push(numBlocksSeries);
                    chart.scrollbarX.unselectedOverlay.fill = am4core.color(bgColor);
                    chart.scrollbarX.background.fill = am4core.color(bgColor);
                    chart.scrollbarX.thumb.background.fill = am4core.color(thumbColor);
                    //chart.scrollbarX.height = 10;
                    //chart.scrollbarX.parent = chart.bottomAxesContainer;
                    //chart.scrollbarX = new am4core.Scrollbar();
                }
            

                // Make a panning cursor
                chart.cursor = new am4charts.XYCursor();
                chart.cursor.behavior = "panX";
                chart.cursor.xAxis = dateAxis;
                //chart.cursor.snapToSeries = series;
                chart.cursor.lineY.disabled = true;
                chart.cursor.fullWidthLineX = true;
                chart.cursor.lineX.strokeWidth = 0;
                chart.cursor.lineX.fill = am4core.color("#777");
                chart.cursor.lineX.fillOpacity = 0.25;

                poolHashSeries.hidden = getBooleanCookieValue('_DashboardGraph_Pool_Hashrate', false);

                dateAxis.events.on("selectionextremeschanged", valueAxisZoomed);
                function valueAxisZoomed(ev) {
                    //console.log('Axis range: '+dateAxis.start+' = '+dateAxis.end);
                    if (!first) {
                        setNumberCookieValue('_DashboardGraph_Start',dateAxis.start);
                        setNumberCookieValue('_DashboardGraph_End',dateAxis.end);
                    } else {
                        first = !first;
                    }
                    //console.log(' and now: '+dateAxis.start+' = '+dateAxis.end);
                }

                chart.legend = new am4charts.Legend();
                chart.legend.useDefaultMarker = true;
                chart.legend.itemContainers.template.paddingTop = 2;
                chart.legend.itemContainers.template.paddingBottom = 2;
                chart.legend.itemContainers.template.events.on("hit", function(ev) {
                    setBooleanCookieValue('_DashboardGraph_'+ev.target.dataItem.dataContext.name.replace(/ /g,"_"),!ev.target.isActive);
                });
                var marker = chart.legend.markers.template.children.getIndex(0);
                marker.cornerRadius(12, 12, 12, 12);
                marker.strokeWidth = 1.8;
                marker.strokeOpacity = 0.5;
                marker.stroke = am4core.color("#ccc");

            }

            if (lastChartDate == 0) {
              let d = [];
              poolHashArray.length = 0;
              for (var i = 0, length = data.length; i < length; i++) {
                  var poolData = data[i].pools[poolCoin];
                  if (poolData === undefined) continue;
                  if (!poolData.networkHash) continue;
                  var poolHash = (coinConfigData.algo==='equihash' ? poolData.hashrate*2/1000000.0 : poolData.hashrate);
                  var netHash = parseInt(poolData.networkHash);
                  var diff = parseInt(poolData.networkDiff);
                  var date = new Date(data[i].time*1000);
                  d.push({"time":date,"poolHash":poolHash,"netHash":netHash,"diff":diff});
                  poolHashArray.push([data[i].time*1000,poolHash]);
              }

              poolHashArray.sort(function(a,b){return a[0]-b[0]});
              poolHashAvgArray.length = 0;
              var dObj = ssci.smooth.EWMA()
                                    .x(function(d){ return d[0];})
                                    .y(function(d){ return d[1];})
                                    .data(poolHashArray)
                                    .factor(0.05);
              dObj();
              poolHashAvgArray = dObj.output();
              //console.log(poolHashAvgArray);
              for (var i=0;i<d.length;i++) {
                  var dataObj = d[i];
                  dataObj.avg = poolHashAvgArray[i][1];
                  if (dataObj.time > lastChartDate) {
                    lastChartDate = dataObj.time.getTime()/1000;
                  }
              }

              chart.data = d;

              $.ajax({
                  Method: 'GET',
                  url: site+"/api/homegraphblockdata?numSeconds="+numSeconds+'&coin='+poolCoin,
                  dataType: 'json',
                  success: function (data) {
                      var blocks = data.data.blocks;
                      var last24hrBlocks = 0;
                      blockDataStart = 0;
                      for (var blockPos = blocks.length-1;blockPos >= 0;blockPos--) {
                          d.splice(0,0,blocks[blockPos]);
                          if (blocks[blockPos].hour < 24) {
                            last24hrBlocks += blocks[blockPos].numBlocks;
                          }
                      }
                      numHours = blocks.length;
                      $('#poolBlocksFound24hr').text(Number(last24hrBlocks).toLocaleString());

                      setTimeout(function() {
                          if (chart.scrollbarX) {
                              chart.scrollbarX.start = getNumberCookieValue('_DashboardGraph_Start',0.75);
                              chart.scrollbarX.end = getNumberCookieValue('_DashboardGraph_End',1);
                          }
                      },100);
                      chart.data = d;
                      //chart.invalidateData();
                      console.log("After first load:");
                      console.log(chart.data);
                  }
              });
            } else {  // updating the chart
              let d = [];
              for (var i = 0, length = data.length; i < length; i++) {
                  var poolData = data[i].pools[poolCoin];
                  if (poolData === undefined) continue;
                  if (!poolData.networkHash) continue;
                  var poolHash = (coinConfigData.algo==='equihash' ? poolData.hashrate*2/1000000.0 : poolData.hashrate);
                  var netHash = parseInt(poolData.networkHash);
                  var diff = parseInt(poolData.networkDiff);
                  var date = new Date(data[i].time*1000);
                  d.push({"time":date,"poolHash":poolHash,"netHash":netHash,"diff":diff});
                  poolHashArray.push([data[i].time*1000,poolHash]);
              }

              poolHashArray.sort(function(a,b){return a[0]-b[0]});
              var originalEnd = poolHashAvgArray.length > 0 ? poolHashAvgArray.length-1 : 0;
              poolHashAvgArray.length = 0;
              var dObj = ssci.smooth.EWMA()
                                    .x(function(d){ return d[0];})
                                    .y(function(d){ return d[1];})
                                    .data(poolHashArray)
                                    .factor(0.05);
              dObj();
              poolHashAvgArray = dObj.output();
              //console.log(poolHashAvgArray);
              for (var i=0;i<d.length;i++) {
                  var dataObj = d[i];
                  dataObj.avg = poolHashAvgArray[i+originalEnd][1];
                  if (dataObj.time > lastChartDate) {
                    lastChartDate = dataObj.time.getTime()/1000;
                  }
                  chart.data.splice(numHours,1);
                  chart.addData(dataObj);
              }

              $.ajax({
                Method: 'GET',
                url: site+"/api/homegraphblockdata?numSeconds="+numSeconds+'&coin='+poolCoin,
                dataType: 'json',
                success: function (data) {
                    var blocks = data.data.blocks;
                    var last24hrBlocks = 0;

                    for (var blockPos = blocks.length-1;blockPos >= 0;blockPos--) {
                        var block = blocks[blockPos];
                        for (var i=blockDataStart;i<blockDataStart+numHours;i++) {
                            if (chart && chart!==null && chart.data[i].hour === block.hour) {
                              chart.data[i].numBlocks = block.numBlocks;
                              chart.data[i].blocks = block.blocks;
                            }
                        }
                        if (block.hour < 24) {
                          last24hrBlocks += block.numBlocks;
                        }
                    }
                    $('#poolBlocksFound24hr').text(Number(last24hrBlocks).toLocaleString());

                    setTimeout(function() {
                        if (chart.scrollbarX) {
                            chart.scrollbarX.start = getNumberCookieValue('_DashboardGraph_Start',0.75);
                            chart.scrollbarX.end = getNumberCookieValue('_DashboardGraph_End',1);
                        }
                    },100);
                    chart.invalidateRawData();
    
                }
            });


            }
        }
    });
  }


  function updatePage() {
    console.log("update page");
    updateStats();
    updateChart_amCharts(getNumberCookieValue('_DashboardGraph_Time',86400));
    updateMarketStats();
  }
  log("home.html vPOOL_VERSION");

