  if (typeof walletEnabled == 'undefined') walletEnabled = false;

  if (!walletEnabled) {
    $('#walletItem').remove();
    $('#walletTable').remove();
  }

  var workerHashrateDataNew;
  var chart;
  var workerWalletChart;
  var minHash;
  var maxHash;
  var _workerCount = 0;
  var selectedWorker;
  var table;
  var customPayoutProgress;

  function toggleFavourite() {
    var address = (window.location.href.substring(window.location.href.lastIndexOf('/') + 1)).replace('#','');
    var fav = isFavourite(coin,address);
    $('#favouriteButton i').removeClass("zel-icon-heart-o").removeClass("zel-icon-heart");
    if (!fav) {
      addFavourite(coin,address);
    } else {
      removeFavourite(coin,address);
    }
    $('#favouriteButton i').addClass(!fav ? 'zel-icon-heart' : 'zel-icon-heart-o');
    updateFavouritesList();
  }

  var coinConfigCheck;
  $(document).ready(function() {
    if (window.matchMedia("(max-width: 1600px)").matches) {
      $('#rewards').insertBefore($('#blocks'));
      $('#rewards').attr('data-swapped','true');
    }
    $(window).resize(function() { 
      if (window.matchMedia("(max-width: 1600px)").matches) {
        if ($('#rewards').attr('data-swapped')!=='true') {
          $('#rewards').insertBefore($('#blocks'));
          $('#rewards').attr('data-swapped','true');
        }
      } else {
        if ($('#rewards').attr('data-swapped')==='true') {
          $('#blocks').insertBefore($('#rewards'));
          $('#rewards').attr('data-swapped','false');
        }
      }
    });

    //if (favouritesEnabled) {
      var address = (window.location.href.substring(window.location.href.lastIndexOf('/') + 1)).replace('#','');
      var fav = isFavourite(coin, address);
      var active = "-o";
      if (fav) {
        active = ""
      }
      $('#subHeaderText').after('<button class="btn btn-custom btn-fab btn-fab-mini btn-round" onclick="toggleFavourite();" id="favouriteButton"><i class="zel-icon zel-icon-heart'+active+'"></i></button>');
    //}
    coinConfigCheck = setInterval(() => {
      if (coinConfigData !== undefined) {
        if (coinConfigData.schema === 'solo') {
          console.log("Removing items not applicable to solo mining");
          $('.remove_solo').remove();
        }
        checkStatsBuckets();
        clearInterval(coinConfigCheck);
        updateWorkerStats();
        $('.setting_switch .lv-btn').change(function() {
          //console.log("change");
          setTimeout(function() { doChart(); },10);
        });
      }
    }, 200);

    var showLegend = getBooleanCookieValue('_MinerGraph_RigSelectorOpen',true);
    $('#chart').addClass(showLegend ? 'legend-open' : 'legend-closed');
    $('#chartLegendWrapper').addClass(showLegend ? 'legend-open' : 'legend-closed');

    customPayoutProgress = $('#customPayoutProgress');

    /*customPayoutProgress.circleProgress({
      size: 35,
      startAngle: -Math.PI / 2,
      value: 0,
      //lineCap: 'round',
      thickness: 5,
      emptyFill: "rgba(120,120,120,0.3)",
      fill: {color: loadingCircleColour },
      animation: { duration: 1500 }
    });*/


  });

  function checkStatsBuckets() {
    if (coinConfigData.stats && coinConfigData.stats.buckets) {
      $('.statRange').each(function() {
        $(this).remove();
      });
      let bar = $('#insertStatRangesHere');
      for (let bucketID in coinConfigData.stats.buckets) {
        let bucket = coinConfigData.stats.buckets[bucketID];
        let newRange = $('<li class="statRange"><a href="#" onclick="recreateChart('+bucket.time+');return false;" id="'+bucket.time+'">'+bucket.description+'</a></li>');
        newRange.insertAfter(bar);
        bar = newRange;
      }
    }
  }

  var lastChartDate = 0;
  let rigs = [];
  var totalHashSeries;
  var avgHashSeries
  let chartData = [];
  let otherData = []; // contains data used by disabled series
  let legendData = [];
  let chartColors;
  let legend;
  let legendContainer;

  function deleteChart() {
    chart.dispose();
    legendContainer.dispose();
    //delete chart;
    chart = null;
    cursorSeries = null;
    chartData.length = 0;
    otherData.length = 0;
    legendData.length = 0;
  }

  function recreateChart(time) {
    lastChartDate=0;
    deleteChart();
    setNumberCookieValue('_MinerGraph_Time',time);
    setTimeout(function() {
      updateWorkerStats();
    },10);
  }

  function updateWorkerStats() {
    var address = (window.location.href.substring(window.location.href.lastIndexOf('/') + 1)).replace('#','');
    let blockReward;
    var seconds  = getNumberCookieValue('_MinerGraph_Time',86400);

    var lastDateArg = '';
    if (lastChartDate > 0) {
      lastDateArg = '&fromDate='+lastChartDate;
    }
    //console.log(site+"/api/worker_stats2?address="+address+"&dataPoints=720&numSeconds="+seconds+lastDateArg);

    $.ajax({
      Method: 'GET',
      url: site+"/api/worker_stats2?address="+address+"&dataPoints=720&numSeconds="+seconds+lastDateArg,
      dataType: 'json',
      success: function (stats) {
        blockReward = stats.blockreward;
        //console.log(data.history);
        var minerShares = 0;
        for (var w in stats.workers) { 
          _workerCount++; 
          minerShares += stats.workers[w].currRoundShares;
        }
        //buildChartData(data);
        //doChart();
        //console.log(d);

        //updateChart_amCharts(d);
        //setNumberCookieValue('_MinerGraph_Time',numSeconds);
        //var timeSelector = $('#timeSelector li a.active');
        //var numSeconds = parseInt(timeSelector.attr('id'));
        var light = $('body').hasClass('light_version');
        var contrast = getGlobalCookieValue('contrast');
        let color = light ? '#222' : '#ddd';
        if (contrast !== undefined && contrast !== null) {
            switch (contrast) {
                case 'low': color = light ? '#7779C7' : '#a5a8ad';
                            break;
                case 'medium': color = light ? '#48494b' : '#bfc2c9';
                            break;
            }
        }
        bgColor = light ? '#FFF' : '#282B2F';
        thumbColor = light ? new Color(bgColor).darken(10) : new Color(bgColor).lighten(10);

        var poolColor = getComputedStyle(document.documentElement).getPropertyValue('--color1').toUpperCase().trim();

        if (!chart || chart===null) {
            am4core.useTheme(am4themes_animated);
            chart = am4core.create("chart", am4charts.XYChart);
            chart.padding(8, 2, 2, 2);
            chart.interpolationDuration = 0;
            chart.defaultState.transitionDuration = 0;
            chart.preloader.disabled = true;

            dateAxis = chart.xAxes.push(new am4charts.DateAxis());
            dateAxis.renderer.labels.template.fill = am4core.color(color);
            dateAxis.dataFields.category = "time";
            dateAxis.renderer.labels.template.fontSize = 12;
            dateAxis.cursorTooltipEnabled = false;

            dateAxis.keepSelection = true;
            
            valueAxisHash = chart.yAxes.push(new am4charts.ValueAxis());
            valueAxisHash.title.text = "Hashrate"
            valueAxisHash.title.fill = am4core.color(color);
            valueAxisHash.renderer.labels.template.fill = am4core.color(color);
            valueAxisHash.renderer.labels.template.adapter.add("text", (label, target, key) => {
                return $(window).width() > 500 ? getReadableHashRateString(target.dataItem.value, coinConfigData.algo, false) : '';
            });
            valueAxisHash.renderer.labels.template.fontSize = 10;
            valueAxisHash.cursorTooltipEnabled = false;

            if (scrollbarVisible) {
                // Create a horizontal scrollbar with preview
                chart.scrollbarX = new am4charts.XYChartScrollbar();
                //chart.scrollbarX.series.push(cursorSeries);
                //chart.scrollbarX.series.push(numBlocksSeries);
                chart.scrollbarX.unselectedOverlay.fill = am4core.color(bgColor);
                chart.scrollbarX.background.fill = am4core.color(bgColor);
                chart.scrollbarX.thumb.background.fill = am4core.color(thumbColor);
            }
        
            chartColors = new am4core.ColorSet();
            chartColors.baseColor = am4core.color(poolColor);
            chart.colors = chartColors;

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

            //poolHashSeries.hidden = getBooleanCookieValue('_MinerGraph_Pool_Hashrate', false);

            setTimeout(function() {
              dateAxis.events.on("selectionextremeschanged", valueAxisZoomed);
              function valueAxisZoomed(ev) {
                  if (!first) {
                      setNumberCookieValue('_MinerGraph_Start',dateAxis.start);
                      setNumberCookieValue('_MinerGraph_End',dateAxis.end);
                  } else {
                      first = !first;
                  }
                  //console.log(' and now: '+dateAxis.start+' = '+dateAxis.end);
              }
            }, 500);

            legendContainer = am4core.create("chartLegend", am4core.Container);
            legendContainer.width = am4core.percent(100);
            legendContainer.height = am4core.percent(100);
            legend = new am4charts.Legend();
            legend.useDefaultMarker = true;
            legend.position = "right";
            legend.scrollable = true;
            legend.parent = legendContainer;
            legend.labels.template.fill = color;
            legend.labels.template.fontSize = rigs.length > 10 ? 12 : 14;
            legend.itemContainers.template.paddingTop = rigs.length > 10 ? 0 : 3;
            legend.itemContainers.template.paddingBottom = 0;
            legend.itemContainers.template.events.on("hit", function(ev) {
                setBooleanCookieValue('_MinerGraph_Rig_'+ev.target.dataItem.dataContext.name.replace(/ /g,"_"),!ev.target.isActive);
                if (ev.target.dataItem.dataContext.name !== 'Rig Hash Avg' && ev.target.dataItem.dataContext.name !== 'Total Hash') {
                  if (ev.target.isActive) {
                    for (var i in chartData) {
                      var dataItem = chartData[i];
                      var otherDataItem = otherData[i]
                      dataItem[ev.target.dataItem.dataContext.name] = otherDataItem[ev.target.dataItem.dataContext.name];
                      delete otherDataItem[ev.target.dataItem.dataContext.name];
                    }
                    var rig = rigs.filter(rig => rig.rigName === ev.target.dataItem.dataContext.name);
                    addChartSeries(rig[0]);
                  } else {
                    for (var i in chartData) {
                      var dataItem = chartData[i];
                      var otherDataItem = otherData[i]
                      otherDataItem[ev.target.dataItem.dataContext.name] = dataItem[ev.target.dataItem.dataContext.name];
                      delete dataItem[ev.target.dataItem.dataContext.name];
                    }
                    var rig = rigs.filter(rig => rig.rigName === ev.target.dataItem.dataContext.name);
                    removeChartSeries(rig[0]);
                  }
                  chart.invalidateRawData();
                  //console.log(chart.data);
                } else {
                  var index = 0;
                  if (ev.target.dataItem.dataContext.name === 'Total Hash') {
                    index = 0;
                  } else if (ev.target.dataItem.dataContext.name === 'Rig Hash Avg') {
                    index = 1;
                  }
                  if (ev.target.isActive){
                    chart.series.getIndex(index).show();
                  } else {
                    chart.series.getIndex(index).hide();
                  }
                }
            });
            //legend.marker.template.fill = color;
            var marker = legend.markers.template.children.getIndex(0);
            marker.cornerRadius(12, 12, 12, 12);
            marker.strokeWidth = 1.8;
            marker.strokeOpacity = 0.5;
            marker.stroke = am4core.color("#ccc");

        }

        if (lastChartDate == 0) {

          var data = [];
          rigs.length = 0;
          chartData.length = 0;

          let rigPos = 0;

          for (var worker in stats.workers) {
            var workerName = getWorkerNameFromAddress(worker);
            //console.log(workerName);
            //console.log(rigs);
            if (!rigs.some(rig => rig.rigName === workerName)) {
              var disabled = getBooleanCookieValue('_MinerGraph_Rig_'+workerName, rigPos>=5);
              var newRig = {'rigName': workerName, 'enabled': !disabled};
              rigs.push(newRig);
              //console.log(newRig);
              rigPos++;
            }
          }

          chartColors.minColors = rigs.length > 30 ? (rigs.length+2)/2 : rigs.length+2;
          chartColors.wrap = true;
          //chartColors.step = 

          for (var workerName in stats.history) {
              //console.log(workerName);
              var workerHistory = stats.history[workerName];
              //console.log(workerHistory);
              //console.log(rigs);
              var matchingRigs = rigs.filter(rig => rig.rigName === getWorkerNameFromAddress(workerName));
              if (matchingRigs.length == 0) {
                rigs.push({'rigName': getWorkerNameFromAddress(workerName), 'workerHistory': workerHistory, 'enabled': !getBooleanCookieValue('_MinerGraph_Rig_'+workerName, false)});
              } else {
                matchingRigs[0].workerHistory = workerHistory;
              }
              if (typeof(smoothWorkerGraph) !== 'undefined' && smoothWorkerGraph && rigs.length < 20) {
                var dObj = ssci.smooth.EWMA()
                                      .x(function(d){ return d.time;})
                                      .y(function(d){ return d.hashrate;})
                                      .data(workerHistory)
                                      .factor(smoothWorkerGraphFactor || 0.1);
                dObj();
                workerHistory = dObj.output();
                //console.log(workerHistory);
                var rigName = getWorkerNameFromAddress(workerName);
                for (var i=0;i<workerHistory.length;i++) {
                    var historyElement = workerHistory[i];
                    var time = historyElement[0].toFixed(0);
                    var dataElement = data[time] || {};
                    dataElement[rigName] = historyElement[1];
                    if (!dataElement.time) dataElement.time = new Date(time*1000);
                    data[time] = dataElement;
                }
              } else {
                var rigName = getWorkerNameFromAddress(workerName);
                for (var i=0;i<workerHistory.length;i++) {
                    var historyElement = workerHistory[i];
                    var time = historyElement.time.toFixed(0);
                    var dataElement = data[time] || {};
                    dataElement[rigName] = historyElement.hashrate;
                    if (!dataElement.time) dataElement.time = new Date(time*1000);
                    data[time] = dataElement;
                }
              }
          }

          rigPos = 0;

          for (var i in data) {
            let dataItem = data[i];
            var otherDataItem = {'time': dataItem.time};
            for (rigPos=0;rigPos<rigs.length;rigPos++) {
              var rig = rigs[rigPos];
              if (!rig.enabled) {
                otherDataItem[rig.rigName] = dataItem[rig.rigName];
                delete dataItem[rig.rigName];
              }
            }
            chartData.push(dataItem);
            otherData.push(otherDataItem);
            //console.log(JSON.stringify(dataItem));
            //console.log(JSON.stringify(otherDataItem));
          }
          //console.log(chartData);

          for (var i in chartData) {
              var dd = chartData[i];
              var od = otherData[i];
              let avg = 0;
              let rigCount = 0;
              for (rigPos=0;rigPos<rigs.length;rigPos++) {
                var rig = rigs[rigPos];
                //var enabled = getBooleanCookieValue('_MinerGraph_Rig_'+rig.rigName, rigPos>=5);
                if (rig.enabled && !dd[rig.rigName]) {
                  dd[rig.rigName] = 0;
                } else if (!rig.enabled && !od[rig.rigName]) {
                  od[rig.rigName] = 0;
                } else {
                  if (dd[rig.rigName]) {
                    avg += dd[rig.rigName];
                  } else if (od[rig.rigName]) {
                    avg += od[rig.rigName];
                  }
                  rigCount++;
                }
              }
              if (rigCount > 1) {
                dd.total = avg;
                avg /= rigCount;
                dd.avg = avg;
              } else {
                dd.avg = avg;
                dd.total = avg;
              }
              if (dd.time > lastChartDate) {
                lastChartDate = dd.time.getTime() / 1000;
              }
          }

          if (rigs.length > 1) {
            totalHashSeries = chart.series.push(new am4charts.LineSeries());
            cursorSeries = totalHashSeries;
            totalHashSeries.name = "Total Hash";
            totalHashSeries.dataFields.valueY = "total";
            totalHashSeries.dataFields.dateX = "time";
            totalHashSeries.strokeWidth = 1.5;
            totalHashSeries.yAxis = valueAxisHash;
            totalHashSeries.xAxis = dateAxis;
            //totalHashSeries.tensionX = 0.8;
            //avgHashSeries.stroke = am4core.color(avgColor.toString());
            totalHashSeries.legendSettings.labelText = "["+color+"]{name}[/]";
            totalHashSeries.tooltipText = "{total}";
            totalHashSeries.adapter.add('tooltipText',function(text, target) {
              if (target == null || target.tooltipDataItem == null || target.tooltipDataItem.dataContext == null) return '';
              //console.log("total hash tooltip");
              return 'Total Hash: [bold]'+getReadableHashRateString(target.tooltipDataItem.dataContext["total"], coinConfigData.algo)+'[/]';
            });
            legend.data.push({'name': totalHashSeries.name, 'visible': !getBooleanCookieValue('_MinerGraph_Rig_Total_Hash', false), 'fill': chartColors.getIndex(0)});

            avgHashSeries = chart.series.push(new am4charts.LineSeries());
            //cursorSeries = avgHashSeries;
            avgHashSeries.name = "Rig Hash Avg";
            avgHashSeries.dataFields.valueY = "avg";
            avgHashSeries.dataFields.dateX = "time";
            avgHashSeries.strokeWidth = 1.5;
            avgHashSeries.yAxis = valueAxisHash;
            avgHashSeries.xAxis = dateAxis;
            //avgHashSeries.tensionX = 0.8;
            //avgHashSeries.stroke = am4core.color(avgColor.toString());
            avgHashSeries.hidden = getBooleanCookieValue('_MinerGraph_Rig_Rig_Hash_Avg', false);
            avgHashSeries.legendSettings.labelText = "["+color+"]{name}[/]";
            legend.data.push({'name': avgHashSeries.name, 'visible': !avgHashSeries.hidden, 'fill': chartColors.getIndex(1)});

          }

          rigPos = 0;
          rigs.forEach(rig => {
              rigPos++;
              var hidden = getBooleanCookieValue('_MinerGraph_Rig_'+rig.rigName, rigPos>=5);
              var legendItem = {'name': rig.rigName, 'visible': !hidden, 'fill': chartColors.getIndex(rigPos+(rigs.length > 1 ? 1 : -1))};
              legend.data.push(legendItem);

              if (!hidden) {
                addChartSeries(rig);
              }
          });

          if (chart.scrollbarX) {
            //console.log(cursorSeries);
            if (cursorSeries) {
              chart.scrollbarX.series.push(cursorSeries);
            }
            if (totalHashSeries) {
              totalHashSeries.hidden = getBooleanCookieValue('_MinerGraph_Rig_Total_Hash', false);
              legend.data[0].visible = !totalHashSeries.hidden;
            }
          }

          chart.data = chartData;
          //console.log(chart.data);

          setTimeout(function() {
              if (chart.scrollbarX) {
                  chart.scrollbarX.start = getNumberCookieValue('_MinerGraph_Start',0.75);
                  chart.scrollbarX.end = getNumberCookieValue('_MinerGraph_End',1);
              }
          },rigs.length < 20 ? 100 : 500);
        } else {
          //console.log(stats.history);
          var data = [];

          for (var workerName in stats.history) {
            var rigName = getWorkerNameFromAddress(workerName);
            var matchingRigs = rigs.filter(rig => rig.rigName === rigName);
            if (matchingRigs.length === 0) {
              //console.log("Unknown rig: "+rigName);
              //console.log("Forcing a full data refresh");
              lastChartDate = 0;
              break;
            } else {
              //console.log("Rig found: "+rigName);
              //console.log(matchingRigs[0]);
            }
            
            //console.log(data.history[workerName]);
            var newWorkerHistory = stats.history[workerName];
            var workerHistory = matchingRigs[0].workerHistory;
            for (var i=0;i<newWorkerHistory.length;i++) {
              workerHistory.push(newWorkerHistory[i]);
              if (newWorkerHistory[i].time > lastChartDate) {
                lastChartDate = newWorkerHistory[i].time;
              }
            }
            if (workerHistory.length > 720) {
              workerHistory.splice(0, workerHistory.length-720);
            }
            if (typeof(smoothWorkerGraph) !== 'undefined' && smoothWorkerGraph && rigs.length < 20) {
              var dObj = ssci.smooth.EWMA()
                                    .x(function(d){ return d.time;})
                                    .y(function(d){ return d.hashrate;})
                                    .data(workerHistory)
                                    .factor(smoothWorkerGraphFactor || 0.1);
              dObj();
              var smoothedWorkerHistory = dObj.output();
              //console.log(workerHistory);
              var rigName = getWorkerNameFromAddress(workerName);
              for (var i=smoothedWorkerHistory.length-newWorkerHistory.length-1;i<smoothedWorkerHistory.length;i++) {
                //console.log("Adding "+i);
                  var historyElement = smoothedWorkerHistory[i];
                  //console.log(historyElement);
                  var time = historyElement[0].toFixed(0);
                  var dataElement = data[time] || {};
                  dataElement[rigName] = historyElement[1];
                  if (!dataElement.time) dataElement.time = new Date(time*1000);
                  //console.log(dataElement);
                  data[time] = dataElement;
              }
            } else {
              var rigName = getWorkerNameFromAddress(workerName);
              for (var i=0;i<newWorkerHistory.length;i++) {
                  var historyElement = newWorkerHistory[i];
                  var time = historyElement.time.toFixed(0);
                  var dataElement = data[time] || {};
                  dataElement[rigName] = historyElement.hashrate;
                  if (!dataElement.time) dataElement.time = new Date(time*1000);
                  data[time] = dataElement;
              }
            }
          }
          //console.log(data);
          //console.log(data.length);
          var count = 0;
          for (var i in data) {
            count++;
          }
          var changed = false;
          //chart.removeData(data.length);
          chartData.splice(0, count);
          otherData.splice(0, count);
          //console.log("Chart Data");
          //console.log(chartData);
          //console.log("Real Chart Data");
          //console.log(chart.data);
          //console.log("Other Data");
          //console.log(otherData);
          for (var i in data) {
            var dd = data[i];
            let avg = 0;
            let rigCount = 0;
            rigs.forEach(rig => {
                if (!dd[rig.rigName]) {
                    dd[rig.rigName] = 0;
                } else {
                    avg += dd[rig.rigName];
                    rigCount++;
                }
            });
            if (rigCount > 1) {
              dd.total = avg;
              avg /= rigCount;
              dd.avg = avg;
            } else {
              dd.avg = avg;
              dd.total = avg;
            }
            var otherDataItem = {'time': dd.time};
            for (var rigPos=0;rigPos<rigs.length;rigPos++) {
              var rig = rigs[rigPos];
              if (rig.enabled) {
                otherDataItem[rig.rigName] = dd[rig.rigName];
                delete dd[rig.rigName];
              }
            }

            //console.log(dd);
            //console.log(otherDataItem);
            chart.addData(dd);
            //chartData.push(dd);
            otherData.push(otherDataItem);
            //changed = true;
            chart.invalidateRawData();
          }
          //console.log(chart.data);

          if (changed) {
          }

        }


        stats.coin = stats.coin || coinTicker;

        $('#rewardCoinHeader').html(stats.coin);

        // WALLET
        if (walletEnabled) {
          $('#walletBalanceHeader').html(stats.coin+" Balance");
        }

        var percentShares = (stats.currentroundshares > 0 ? minerShares / stats.currentroundshares * 100 : 0);

        if (percentShares > 100) percentShares = 100;
        $('#percentShareProgressHolder .progress-bar').css('width',percentShares+'%');
        //if (percentShares > 16) {
        //} else if (percentShares > 12) {
        //  $('#percentShareText').text(percentShares.toFixed(1));
        //} else {
        //  $('#percentShareText').text('');
        //}
        //$('#blockPercentageKnob').val(percentShares.toFixed(1)).knob();
        var blockContribution = percentShares.toFixed(1)+'%';

        //var sharesTable = "<table><tbody><tr><td>";
        //sharesTable +=  "Percent of Block:</td><td>";
        //sharesTable +=  percentShares.toFixed(1)+'%';
        //sharesTable +=  "</td></tr>";
        if (stats.blockreward && stats.blockreward.blockReward) {
          //sharesTable +=  "<tr><td>";
          //sharesTable +=  "Estimated "+data.coin+":</td><td>";
          //sharesTable +=  ((percentShares/100)*data.blockreward.blockReward).toFixed(2);
          //sharesTable +=  "</td></tr>";
          //$('#estimatedCoins').text(((percentShares/100)*data.blockreward.blockReward).toFixed(2));
          blockContribution += ' (~'+((percentShares/100)*stats.blockreward.blockReward).toFixed(minerCoinPrecision)+' '+stats.coin+')';
          //$('#percentShareProgressHolder').tooltip('dispose');
          //$('#percentShareProgressHolder').attr('title','Estimated '+data.coin+': '+((percentShares/100)*data.blockreward.blockReward).toFixed(2));
          //$('#percentShareProgressHolder').tooltip();
        }
        //sharesTable +=  "</tbody></table>";
        $('#percentShareText').text(blockContribution);

        var count = 0;

        if ($.fn.dataTable.isDataTable('#rigsTable')) {
          $('#rigsTable').DataTable().destroy();
        }

        $('#rigsBody').empty();
        $('#rigSelector').empty();
        $('#rigSelector').append('<button class="dropdown-item" type="button">Totals</button>');

        for (var w in stats.workers) {
          var htmlSafeName = w.split('.').join('_').replace(/[^\w\s]/gi, '');
      		var saneWorkerName = getWorkerNameFromAddress(w);
          var workerObj = stats.workers[w];

          var tr = $('<tr></tr>');
          var td = $('<td></td>'); // Expand/Collapse
          tr.append(td);
          var workerName = htmlSafeName.substr(htmlSafeName.indexOf("_")+1,htmlSafeName.length);
          td = $('<td>'+workerName+'</td>'); // Worker Name
          tr.append(td);
          td = $('<td>'+workerObj.hashrateString+'</td>'); // Hashrate (Now)
          tr.append(td);
          td = $('<td>'+getReadableHashRateString(calculateAverageHashrate(saneWorkerName, chartData, otherData))+'</td>'); // Hashrate (Avg)
          tr.append(td);
          td = $('<td>'+workerObj.diff+'</td>'); // DIFF
          tr.append(td);
          td = $('<td>'+(Math.round(workerObj.currRoundShares * 100) / 100)+'</td>'); // SHARES
          tr.append(td);
          //console.log(workerObj);
          var efficiency = (workerObj.invalidshares > 0) ? ((workerObj.shares / (workerObj.shares + workerObj.invalidshares))*100).toFixed(2) : (workerObj.diff > 0 ? 100 : 0);
          if (workerObj.diff < 0) {
            tr.addClass('serious-error');
          } else if (efficiency < 95) {
            tr.addClass('error');
          }
          td = $('<td>'+efficiency+'</td>'); // EFFICIENCY
          tr.append(td);
          td = $('<td>'+workerObj.luckDays+'</td>'); // LUCK
          tr.append(td);
          td = $('<td>'+workerObj.balance.toFixed(minerCoinPrecision)+'</td>'); // BALANCE
          tr.append(td);
          td = $('<td>'+workerObj.paid.toFixed(minerCoinPrecision)+'</td>'); // PAID
          tr.append(td);
          tr.appendTo($('#rigsBody'));

          if (count == 0) {
            $('#rigSelector').append('<div class="dropdown-divider"></div>');
          }
          $('#rigSelector').append('<button class="dropdown-item" type="button">'+workerName+'</button>');

          count++;
        }
        $('#rigsBadge').html(count);

        table = $('#rigsTable').DataTable({
          "ordering": false,
          "paging": false,
          "pagingType": "full_numbers",
          "lengthMenu": [
            [10, 25, 50, -1],
            [10, 25, 50, "All"]
          ],
          select: 'single',
          responsive: true,
          language: {
            search: "_INPUT_",
            searchPlaceholder: "Search records",
          },
          "columnDefs": [
            { targets: [0,1,2,3], visible: true},
            { targets: '_all', visible: false}
          ],
          "columns": [
           { "className": 'details-control',
             "data": null,
             "defaultContent": '',
             "render": function () {
                         return '<i class="zel-icon zel-icon-plus-circle" aria-hidden="true"></i>';
             },
             width:"15px"
           },
           null,
           null,
           null,
           null,
           null,
           null,
           null,
           null,
           null
          ]
        });

        // Add event listener for opening and closing details
        $('#rigsTable tbody').off('click');
        $('#rigsTable tbody').on('click', 'td.details-control', function () {
          //console.log("Open or close?");
            var tr = $(this).closest('tr');
            var tdi = tr.find("i.zel-icon");
            var row = table.row( tr );

            if ( row.child.isShown() ) {
                // This row is already open - close it
                row.child.hide();
                tr.removeClass('shown');
                tdi.first().removeClass('zel-icon-minus-circle');
                tdi.first().addClass('zel-icon-plus-circle');
            }
            else {
                // Open this row
                row.child( format(row.data()) ).show();
                tr.addClass('shown');
                tdi.first().removeClass('zel-icon-plus-circle');
                tdi.first().addClass('zel-icon-minus-circle');
            }
        } );
        table.on("user-select", function (e, dt, type, cell, originalEvent) {
             if ($(cell.node()).hasClass("details-control")) {
                 e.preventDefault();
             }
         });

        if (stats.immature) {
          console.log(stats);
          $('#unconfirmedBalance').textNodes().replaceWith(stats.immature.toLocaleString(undefined, { minimumFractionDigits:minerCoinPrecision, maximumFractionDigits:minerCoinPrecision }));
        } else {
          $('#unconfirmedBalance').textNodes().replaceWith('0');
        }
        $('#unconfirmedBalance .coin').text(' '+stats.coin);
        $('#unpaidBalance').textNodes().replaceWith(stats.balance.toLocaleString(undefined, { minimumFractionDigits:minerCoinPrecision, maximumFractionDigits:minerCoinPrecision }));
        $('#unpaidBalance .coin').text(' '+stats.coin);
        $('#totalPaid').textNodes().replaceWith(stats.paid.toLocaleString(undefined, { minimumFractionDigits:minerCoinPrecision, maximumFractionDigits:minerCoinPrecision }));
        $('#totalPaid .coin').text(' '+stats.coin);
        if (stats.custompayout >= 0) {
          $('#minPayout').html(stats.custompayout.toLocaleString()+' '+stats.coin);
          $('#minPayoutHeaderCustom').removeClass('d-none');
        } else {
          $('#minPayout').html((coinConfigData.minPayout || 0.1)+' '+stats.coin);
        }

        var payoutProgress = $('#customPayoutProgress');
        if (stats.custompayout >= 0) {
          //payoutProgress.removeClass('invisible');
          $('#customPayoutProgress .progress-bar').css('width',((stats.balance / stats.custompayout)*100)+'%');
          payoutProgress.attr('data-original-title',((stats.balance / stats.custompayout)*100).toLocaleString(undefined, { minimumFractionDigits:minerCoinPrecision, maximumFractionDigits:minerCoinPrecision })+"% of Custom Payout");
        } else {
          $('#customPayoutProgress .progress-bar').css('width',((stats.balance)*100)+'%');
          payoutProgress.attr('data-original-title',((stats.balance)*100).toLocaleString(undefined, { minimumFractionDigits:minerCoinPrecision, maximumFractionDigits:minerCoinPrecision })+"% of Minimim Payout");
          //payoutProgress.removeClass('invisible');
          //payoutProgress.addClass('invisible'); // is this necessary? would it keep adding the same class?
        }
        $("#currentHashrate").text(getReadableHashRateString(stats.totalHash, coinConfigData.algo));
        $("#5mAvgHashrate").text(getReadableHashRateString(stats.averages.avg5m, coinConfigData.algo));
        $("#1hAvgHashrate").text(getReadableHashRateString(stats.averages.avg1h, coinConfigData.algo));
        $("#3hAvgHashrate").text(getReadableHashRateString(stats.averages.avg3h, coinConfigData.algo));
        $("#24hAvgHashrate").text(getReadableHashRateString(stats.averages.avg24h, coinConfigData.algo));

      }
    }).done(function() {
      var statsUrl = site+'/api/poolblocks2?address='+address;
      $.ajax({
        Method: 'GET',
        url: statsUrl,
        dataType: 'json',
        success: function (data) {
          var stats = data;
          console.log(data);
          $('#subHeaderText').html('Miner:&nbsp;'+getFormattedAddress(address));

          var togglePercentageState = getGlobalCookieValue('togglepercentage');
          var toggleRewardState = getGlobalCookieValue('togglereward');
          var toggleEffortState = getGlobalCookieValue('toggleeffort');
          var toggleLuckState = getGlobalCookieValue('toggleluck');
          togglePercentageState = ((togglePercentageState === undefined || togglePercentageState === null) ? true : togglePercentageState === "true");
          toggleRewardState = ((toggleRewardState === undefined || toggleRewardState === null) ? true : toggleRewardState === "true");
          toggleEffortState = ((toggleEffortState === undefined || toggleEffortState === null) ? true : toggleEffortState === "true");
          toggleLuckState = ((toggleLuckState === undefined || toggleLuckState === null) ? true : toggleLuckState === "true");

          var numConfirms = coinConfigData.confirms || 100;
          var percentSymbol = numConfirms==100 ? '%' : '';

          for (var pool in stats.pools) {
            if (pool !== poolCoin) continue;
            var pooldata = stats.pools[pool];
            var expAddress = pooldata.explorerAddress;
            if (!expAddress) {
              if (typeof explorerAddress != 'undefined') {
                expAddress = explorerAddress;
              }
            }
            var poolFee = 0;
            for (var fee in pooldata.poolFees) {
              poolFee += pooldata.poolFees[fee];
            }
  
            let unconfirmedBalance = 0;

            if (expAddress) {
              $('#subHeaderText').attr('href',expAddress+address);
              $('#subHeaderText').attr('target','_blank');
              //$('#subHeaderText').addClass('text-'+minerSubheaderColour);
            }
            var blockBody = $('#blocksBody');
            blockBody.empty();
            var blocks = Object.keys(pooldata.pending);
            blocks.sort();
            blocks.reverse();
            var validBlockFound = false;
            for (var i = 0; i < blocks.length; i++) {
              if (i > maxBlocks) break;
              var blockData = pooldata.pending[blocks[i]];

              if (lastBlockTime === -1) {
                lastBlockTime = Number(blockData.time);
                updatePoolEffort();
              }

              if (coinConfigData.schema === "solo") {
                // check that this miner mined this block
                if (blockData.miner.indexOf(address) !== 0) {
                  break;
                }
              }
  
              var tr = $('<tr></tr>');
              var td = $('<td>'+Number(blockData.blocknumber).toLocaleString()+'</td>');
              tr.append(td);
              td = $('<td data-toggle="tooltip" data-title="'+readableLongDate(blockData.time)+'">'+readableDate(blockData.time)+'</td>');
              td.tooltip();
              tr.append(td);
              td = $('<td>'+blockData.diff+'</td>');
              tr.append(td);
              td = $('<td class="effort" style="'+(toggleEffortState ? '' : 'display: none;')+'">-</td>');
              if (blockData.ttf && blockData.lbf) {
                var ttf = parseFloat(blockData.ttf);
                var lbf = parseFloat(blockData.lbf);
                if (lbf !== -1 && ttf !== -1) {
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
                td = $('<td class="luck" style="'+(toggleLuckState ? '' : 'display: none;')+'">-</td>');
                if (lbf !== -1 && ttf !== -1) {
                  var luck = '';
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
                td = $('<td class="luck" style="'+(toggleLuckState ? '' : 'display: none;')+'">-</td>');
                tr.append(td);
              }
              //console.log(blockData);
              if (coinConfigData.schema !== "solo") {
                if (blockData.sharePercentage && blockReward) {
                  //console.log("???");
                  let places = 2;
                  if ((blockData.sharePercentage - Math.floor(blockData.sharePercentage) === 0)) places = 0;
                  let sharePercentage = blockData.sharePercentage.toFixed(places);
                  td = $('<td class="percentage" style="'+(togglePercentageState ? '' : 'display: none;')+'">'+sharePercentage+'%</td>');
                  tr.append(td);
                  unconfirmedBalance += ((blockData.sharePercentage*blockReward.blockReward/100)*(100-poolFee)/100);
                  td = $('<td class="reward" style="'+(toggleRewardState ? '' : 'display: none;')+'">'+((blockData.sharePercentage*blockReward.blockReward/100)*(100-poolFee)/100).toFixed(minerCoinPrecision)+' '+coin.toUpperCase()+'</td>');
                  tr.append(td);
                } else {
                  //console.log("nope");
                  tr.append($('<td class="percentage" style="'+(togglePercentageState ? '' : 'display: none;')+'">0%</td>'));
                  tr.append($('<td class="reward" style="'+(toggleRewardState ? '' : 'display: none;')+'">0 '+coin.toUpperCase()+'</td>'));
                }
              }
              if (blockData.confirmations) {
                validBlockFound = true;
                if (blockData.confirmations >= numConfirms && coinConfigData.requireShielding) {
                  td = $('<td><div class="progress progress-lg mb-10"><div class="progress-bar bg-warning progress-bar-striped progress-bar-animated w-100" role="progressbar"><span><i class="zel-icon zel-icon-shield"></i> Shielding</span></div></div></td>');
                } else {
                  if (blockData.confirmations < (numConfirms*0.15)) {
                    var b = '<td><div class="progress progress-lg mb-10">';
                    b += '    <div class="progress-bar progress-bar-info active progress-bar-striped progress-bar-animated" aria-valuemin="0%" aria-valuemax="100%" style="width: '+Math.round(blockData.confirmations * 100 / numConfirms)+'%; font-size: 11px;" role="progressbar" rel="tooltip" title="'+blockData.confirmations+' Confirmations"></div>';
                    b += '  </div></td>';
                    td = $(b);
                  } else {
                    var b = '<td><div class="progress progress-lg mb-10">';
                    b += '    <div class="progress-bar progress-bar-info active progress-bar-striped progress-bar-animated" aria-valuemin="0%" aria-valuemax="100%" style="width: '+Math.round(blockData.confirmations * 100 / numConfirms)+'%; font-size: 11px;" role="progressbar" rel="tooltip" title="'+blockData.confirmations+' Confirmations"> '+blockData.confirmations+percentSymbol+'</div>';
                    b += '  </div></td>';
                    td = $(b);
                  }
                  //td = $('<td><div class="progress progress-lg mb-10"><div class="progress-bar bg-info progress-bar-striped progress-bar-animated" role="progressbar" style="width: '+Math.round(blockData.confirmations * 100 / 100)+'%;">'+blockData.confirmations+'%</div></div></td>');
                }
              } else {
                if (validBlockFound) {
                  td = $('<td><div class="progress progress-lg mb-10"><div class="progress-bar progress-transparent custom-color-blue active progress-bar-striped progress-bar-animated " aria-valuemin="0%" aria-valuemax="100%" style="width: 100%; font-size: 11px;" role="progressbar">ORPHAN</div></div></td>');
                } else {
                  td = $('<td><div class="progress progress-lg mb-10"><div class="progress-bar progress-bar-danger active progress-bar-striped progress-bar-animated " aria-valuemin="0%" aria-valuemax="100%" style="width: 100%; font-size: 11px;" role="progressbar">PENDING</div></div></td>');
                }
              }
              tr.append(td);
              tr.append(td);
              td = $('<td><a href="'+pooldata.explorerBlock+blockData.blockhash+'" target="_blank" class="text-custom"><i class="zel-icon zel-icon-money2"></i></a></td>');
              tr.append(td);
              tr.appendTo(blockBody);
            }
            if (lastBlockTime === -1) {
              // let's look at the confirmed blocks
              blocks = Object.keys(pooldata.confirmed);
              if (blocks.length > 0) {
                let lastConfirmedBlock = pooldata.confirmed[blocks[blocks.length-1]];
                lastBlockTime = Number(lastConfirmedBlock.time);
                updatePoolEffort();
              }
            }
            if (pooldata.calculateUnconfirmedBalance) {
              $('#unconfirmedBalance').textNodes().replaceWith(unconfirmedBalance.toLocaleString(undefined, { minimumFractionDigits:minerCoinPrecision, maximumFractionDigits:minerCoinPrecision }));
              $('#unconfirmedBalance .coin').text(' '+pooldata.coin);
            }
    
          }
          initColumn('percentage');
          initColumn('reward');
          initColumn('effort');
          initColumn('luck');
        }
      });
    });

    var paymentsUrl = site+'/api/miner_rewards?'+address;
    //console.log(paymentsUrl);
    $.ajax({
      Method: 'GET',
      url: paymentsUrl,
      dataType: 'json',
      success: function (data) {
        var lasthour = 0;
        //console.log(data);
        var last12hours = 0;
        var last24hours = 0;
        var today = 0;
        var yesterday = 0;
        var last7days = 0;
        var last30days = 0;
        for (var i=0;i<data.length;i++) {
          if (data[i].name !== poolCoin) continue;
          if (data[i].address !== address) continue;
          lasthour = data[i].lasthour;
          last12hours = data[i].last12hours;
          last24hours = data[i].last24hours;
          today = data[i].today;
          yesterday = data[i].yesterday;
          last7days = data[i].last7days;
          last30days = data[i].last30days;
        }
        $('#lastHourCoin').html(lasthour.toFixed(minerCoinPrecision));
        $('#last12HourCoin').html(last12hours.toFixed(minerCoinPrecision));
        $('#last24HourCoin').html(last24hours.toFixed(minerCoinPrecision));
        $('#todayCoin').html(today.toFixed(minerCoinPrecision));
        $('#yesterdayCoin').html(yesterday.toFixed(minerCoinPrecision));
        $('#last7DaysCoin').html(last7days.toFixed(minerCoinPrecision));
        $('#last30DaysCoin').html(last30days.toFixed(minerCoinPrecision));

        if (typeof(coinGeckoID) !== 'undefined') {
          $.ajax({
            Method: 'GET',
            url: "https://api.coingecko.com/api/v3/simple/price?ids="+coinGeckoID+"&vs_currencies=btc%2Cusd",
            dataType: 'json',
            success: function (data) {
              if (data.hasOwnProperty(coinGeckoID)) {
                var usd = data[coinGeckoID].usd || 0;
                var btc = data[coinGeckoID].btc || 0;

                $('#lastHourUSD').html("$"+(lasthour*usd).toFixed(2));
                $('#last12HourUSD').html("$"+(last12hours*usd).toFixed(2));
                $('#last24HourUSD').html("$"+(last24hours*usd).toFixed(2));
                $('#todayUSD').html("$"+(today*usd).toFixed(2));
                $('#yesterdayUSD').html("$"+(yesterday*usd).toFixed(2));
                $('#last7DaysUSD').html("$"+(last7days*usd).toFixed(2));
                $('#last30DaysUSD').html("$"+(last30days*usd).toFixed(2));

                $('#lastHourBTC').html('<i class="zel-icon zel-icon-bitcoin"></i> '+(lasthour*btc).toFixed(8));
                $('#last12HourBTC').html('<i class="zel-icon zel-icon-bitcoin"></i> '+(last12hours*btc).toFixed(8));
                $('#last24HourBTC').html('<i class="zel-icon zel-icon-bitcoin"></i> '+(last24hours*btc).toFixed(8));
                $('#todayBTC').html('<i class="zel-icon zel-icon-bitcoin"></i> '+(today*btc).toFixed(8));
                $('#yesterdayBTC').html('<i class="zel-icon zel-icon-bitcoin"></i> '+(yesterday*btc).toFixed(8));
                $('#last7DaysBTC').html('<i class="zel-icon zel-icon-bitcoin"></i> '+(last7days*btc).toFixed(8));
                $('#last30DaysBTC').html('<i class="zel-icon zel-icon-bitcoin"></i> '+(last30days*btc).toFixed(8));

                if (walletEnabled) {
                  fetchWalletData(address, function(data) {
                    $('#walletBalance').text(data.balance || data.message);
                    if (!data.message) {
                      $('#walletBTCBalance').html('<i class="zel-icon zel-icon-bitcoin"></i> '+(data.balance*btc).toFixed(8));
                      $('#walletUSDBalance').text(('$'+(data.balance*usd).toFixed(2)));
                      $('#walletReceived').text((data.received || 0).toFixed(minerCoinPrecision) || "Unknown");
                      $('#walletSent').text((data.sent || 0).toFixed(minerCoinPrecision) || "Unknown");
                      $('#walletTransactions').text(data.transactions || "Unknown");

                      /*if (typeof data.received != 'undefined') {
                        var options = {
                            chart: {
                                width: 390,
                                type: 'donut',
                            },
                            series: [data.received, data.sent],
                            labels: ['Received', 'Sent'],
                            fill: {
                              type: 'gradient',
                            }
                        }

                        if (workerWalletChart) {
                          workerWalletChart.updateOptions(options, false, false, true);
                        } else {
                          workerWalletChart = new ApexCharts(document.querySelector("#walletChart"), options);
                          workerWalletChart.render();
                        }
                      }*/
                    } else {

                    }
                  });
                }

              }
            }
          });
        } else {
          if (typeof(fixedUSDPrice) !== 'undefined') {
            var usd = fixedUSDPrice || 0;

            $('#lastHourUSD').html("$"+(lasthour*usd).toFixed(2));
            $('#last12HourUSD').html("$"+(last12hours*usd).toFixed(2));
            $('#last24HourUSD').html("$"+(last24hours*usd).toFixed(2));
            $('#todayUSD').html("$"+(today*usd).toFixed(2));
            $('#yesterdayUSD').html("$"+(yesterday*usd).toFixed(2));
            $('#last7DaysUSD').html("$"+(last7days*usd).toFixed(2));
            $('#last30DaysUSD').html("$"+(last30days*usd).toFixed(2));
          }

          if (typeof(fixedBTCPrice) !== 'undefined') {
            var btc = fixedBTCPrice || 0;

            $('#lastHourBTC').html('<i class="zel-icon zel-icon-bitcoin"></i> '+(lasthour*btc).toFixed(8));
            $('#last12HourBTC').html('<i class="zel-icon zel-icon-bitcoin"></i> '+(last12hours*btc).toFixed(8));
            $('#last24HourBTC').html('<i class="zel-icon zel-icon-bitcoin"></i> '+(last24hours*btc).toFixed(8));
            $('#todayBTC').html('<i class="zel-icon zel-icon-bitcoin"></i> '+(today*btc).toFixed(8));
            $('#yesterdayBTC').html('<i class="zel-icon zel-icon-bitcoin"></i> '+(yesterday*btc).toFixed(8));
            $('#last7DaysBTC').html('<i class="zel-icon zel-icon-bitcoin"></i> '+(last7days*btc).toFixed(8));
            $('#last30DaysBTC').html('<i class="zel-icon zel-icon-bitcoin"></i> '+(last30days*btc).toFixed(8));
          }

        }

      }
    });
    var statsUrl = site+'/api/minerstats';
    $.ajax({
      Method: 'GET',
      url: statsUrl,
      dataType: 'json',
      success: function (data) {
        var stats = data;
        for (var pool in stats.pools) {
          if (pool !== poolCoin) continue;
          var pooldata = stats.pools[pool];

          $("#networkHashrate").text(pooldata.poolStats.networkSolsString);
          $("#networkDiff").text((parseFloat(pooldata.poolStats.networkDiff)).toFixed(2));
          $("#networkBlockHeight").text(Number(pooldata.poolStats.networkBlocks).toLocaleString());
          $("#networkBlockReward").text(pooldata.block.coininfo.blockReward);
          $("#networkConnections").text(pooldata.poolStats.networkConnections);

          var miners = pooldata.minerCount;
          var workers = pooldata.workerCount;
          var hashrate = pooldata.hashrateString;
          luckDays = pooldata.luckDays;
          var validblocks = pooldata.poolStats.validBlocks;

          var poolFee = 0;
          for (var fee in pooldata.poolFees) {
            poolFee += pooldata.poolFees[fee];
          }

          $("#poolHashrate").text(hashrate);
          if (luckDays < 0.04166667) {
            $("#poolLuck").text((luckDays*24*60).toFixed(0)+" Minutes");
          } else if (luckDays < 1) {
            $("#poolLuck").text((luckDays*24).toFixed(2)+" Hours");
          } else if (isFinite(luckDays)) {
            $("#poolLuck").text(luckDays.toFixed(2)+" Days");
          } else {
            $("#poolLuck").text(luckDays);
          }
          $("#poolBlocksFound").text(validblocks);
          $("#poolFee").text(poolFee+"%");
          $("#poolMiners").text(miners+" / "+workers);

          updatePoolEffort();

        }
      }
    });

    //$('body').change(function() {
    //  doChart();
    //});

    /* Formatting function for row details - modify as you need */
    function format ( d ) {
        // `d` is the original data object for the row
        return '<table cellpadding="0" cellspacing="0" border="0" style="margin-left:30px;">'+
            '<tr>'+
                '<td><i class="zel-icon zel-icon-line-chart"></i> Diff:</td>'+
                '<td>'+d['4']+'</td>'+
                '<td><i class="zel-icon zel-icon-cog"></i> Shares:</td>'+
                '<td>'+d['5']+'</td>'+
            '</tr>'+
            '<tr>'+
                '<td><i class="zel-icon zel-icon-tasks"></i> Efficiency:</td>'+
                '<td>'+d['6']+'%</td>'+
                '<td><i class="zel-icon zel-icon-gavel"></i> Luck:</td>'+
                '<td>'+d['7']+'</td>'+
            '</tr>'+
            '<tr>'+
                '<td><i class="zel-icon zel-icon-money2"></i> Balance:</td>'+
                '<td>'+d['8']+'</td>'+
                '<td><i class="zel-icon zel-icon-account_balance_wallet"></i> Paid:</td>'+
                '<td>'+d['9']+'</td>'+
            '</tr>'
        '</table>';
    }

    function isToday(dateParameter) {
      var today = new Date();
      return dateParameter.getDate() === today.getDate() && dateParameter.getMonth() === today.getMonth() && dateParameter.getFullYear() === today.getFullYear();
    }

    function isInLastNDays(dateParameter, days) {
      var today = new Date();
      today.setHours(0);
      today.setMinutes(0);
      today.setSeconds(0);
      return (today.getTime() - dateParameter.getTime()) < (84600000 * days);
    }
  }

  function addChartSeries(rig) {
    var rigSeries = chart.series.push(new am4charts.LineSeries());
    if (!cursorSeries) cursorSeries = rigSeries;
    rig.series = rigSeries;
    rigSeries.name = rig.rigName;
    rigSeries.dataFields.valueY = rig.rigName
    rigSeries.dataFields.dateX = "time";
    rigSeries.yAxis = valueAxisHash;
    rigSeries.xAxis = dateAxis;
    rigSeries.strokeWidth = 2;
    rigSeries.showOnInit = false;
    rigSeries.tensionX = 0.9;
    rigSeries.tensionY = 0.9;
    //rigSeries.legendSettings.labelText = "["+color+"]{name}[/]";
    rigSeries.hidden = getBooleanCookieValue('_MinerGraph_Rig_'+rig.rigName, false);
    rig.enabled = rigSeries.hidden;
    if (rigs.length==1) {
      rigSeries.adapter.add('tooltipText',function(text, target) {
        if (target == null || target.tooltipDataItem == null || target.tooltipDataItem.dataContext == null) return '';
        return 'Total Hash: [bold]'+getReadableHashRateString(target.tooltipDataItem.dataContext[rig.rigName], coinConfigData.algo)+'[/]';
      });
    }
    let name = rig.rigName;
    rigSeries.adapter.add('stroke', (color, target) => {
      //console.log(target.dataItem.dataContext);
      var c = rigs.length > 1 ? 2 : 0;
      for (var r in rigs) {
        //console.log(r+" "+name+" "+c+" "+chartColors.getIndex(c));
        if (rigs[r].rigName === name) {
          return chartColors.getIndex(c);
        }
        c++;
      }
    });

    return rigSeries;
  }

  function removeChartSeries(rig) {
    chart.series.removeIndex(
      chart.series.indexOf(rig.series)
    ).dispose();
  }

  var luckDays = 0;
  var lastBlockTime = -1;

  function updatePoolEffort() {
    if (lastBlockTime === -1 || luckDays === 0) {
      return;
    }
    var now = new Date();
    var then = new Date(lastBlockTime);
    var secondsSinceLastBlock = (now - then) / 1000;
    //console.log(now+' '+lastBlockTime+' '+then+' '+secondsSinceLastBlock+' '+luckDays);
    $('#poolEffort').text(((secondsSinceLastBlock / (luckDays*24*60*60))*100).toFixed(2)+'%');
  }

  function getWorkerNameFromAddress(w) {
    var worker = w;
    var workerNames = w.split(".");
  	if (workerNames.length > 1) {
  		worker = workerNames[1];
  		if (worker == null || worker.length < 1) {
  			worker = "noname";
  		}
  	} else {
  		worker = "noname";
  	}
  	return worker;
  }

  function calculateAverageHashrate(worker, data, otherData) {
  	var count = 0;
  	//var total = 1;
    var avg = 0;
    //console.log("AVERAGE: "+worker);
    for (var i=0;i<data.length;i++) {
      //console.log(data[i]);
      var dataElement = data[i];
      var otherDataElement = otherData[i];
      //console.log(dataElement);
      //console.log(otherDataElement);
  		for (var ii in dataElement) {
  			if (worker == null || ii === worker) {
  				count++;
  				avg += dataElement[ii];
  			}
      }
  		for (var ii in otherDataElement) {
  			if (worker == null || ii === worker) {
  				count++;
  				avg += otherDataElement[ii];
  			}
      }
    }
    avg = avg / count;
    //console.log("Average for "+worker+" is "+avg+" "+getReadableHashRateString(avg,coinConfigData.algo)+" "+total+" "+count);
  	return avg;
  }

  function timeOfDayFormat(timestamp){
      var dStr = d3.time.format('%I:%M %p')(new Date(timestamp));
      if (dStr.indexOf('0') === 0) dStr = dStr.slice(1);
      return dStr;
  }

  function togglePercentage() {
    toggleColumn('percentage');
  }

  function toggleReward() {
    toggleColumn('reward');
  }

  function toggleEffortLuck() {
    toggleColumn('effort');
    toggleColumn('luck');
  }

  function initColumn(name) {
    var toggleState = getGlobalCookieValue('toggle'+name);
    if (toggleState === undefined || toggleState === null) {
      toggleState = true;
    } else {
      toggleState = toggleState === "true";
    }
    if (!toggleState) {
      $('#blocksStats').find('.'+name).css({"display": 'none'});
    }
  }

  function toggleColumn(name) {
    var toggleState = getGlobalCookieValue('toggle'+name);
    //console.log(name+" = "+toggleState);
    if (toggleState === undefined || toggleState === null) {
      toggleState = false;
    } else {
      toggleState = toggleState === "true";
      toggleState = !toggleState;
    }
    setGlobalCookieValue('toggle'+name,toggleState);
    //console.log(name+" == "+toggleState);
    if (!toggleState) {
      $('#blocksStats').find('.'+name).fadeOut('slow');
    } else {
      $('#blocksStats').find('.'+name).fadeIn('slow');
    }
  }

  function toggleGraphFullScreen() {
    var graphCard = $('#graph>.card');
    var height = 330;
    if (graphCard.hasClass('fullscreen')) {
      height = window.innerHeight - 100;
    }
    chart.svgContainer.htmlElement.style.height = height + "px";
    chart.appear();

    setTimeout(function() {
      chart.legend.invalidate();
    },250);
  }

  var valueAxisHash;
  var valueAxisDiff;
  var dateAxis;
  let first = true;
  var bgColor;
  var thumbColor;
  var cursorSeries;

  var scrollbarVisible = getBooleanCookieValue("_MinerGraph_Scrollbar",true); // set this from a cookie

  function toggleGraphScrollbar() {
    scrollbarVisible = !scrollbarVisible;
    if (!scrollbarVisible) {
        chart.scrollbarX.dispose();
    } else {
        chart.scrollbarX = new am4charts.XYChartScrollbar();
        chart.scrollbarX.series.push(cursorSeries);
        chart.scrollbarX.unselectedOverlay.fill = am4core.color(bgColor);
        chart.scrollbarX.background.fill = am4core.color(bgColor);
        chart.scrollbarX.thumb.background.fill = am4core.color(thumbColor);
        chart.scrollbarX.start = getNumberCookieValue('_MinerGraph_Start',0.75);
        chart.scrollbarX.end = getNumberCookieValue('_MinerGraph_End',1);
    }
    setBooleanCookieValue("_MinerGraph_Scrollbar",scrollbarVisible);
    chart.appear();
  }

  function contrastChanged() {
    updateChart_amCharts_Colours();
  }

  function updateChart_amCharts_Colours() {
    var light = $('body').hasClass('light_version');
    var contrast = getGlobalCookieValue('contrast');
    var color = light ? '#222' : '#ddd';
    if (contrast !== undefined && contrast !== null) {
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
    //valueAxisDiff.title.fill = am4core.color(color);
    //valueAxisDiff.renderer.labels.template.fill = am4core.color(color);

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

  function updateChart_amCharts(data) {
  }

  function toggleRigSelector() {
      var chartDiv = $('#chart');
      if (chartDiv.hasClass('legend-open')) {
          chartDiv.removeClass('legend-open');
          chartDiv.addClass('legend-closed');
      } else {
          chartDiv.addClass('legend-open');
          chartDiv.removeClass('legend-closed');
      }
      setBooleanCookieValue('_MinerGraph_RigSelectorOpen',chartDiv.hasClass('legend-open'));
      var chartLegendDiv = $('#chartLegendWrapper');
      if (chartLegendDiv.hasClass('legend-open')) {
          chartLegendDiv.removeClass('legend-open');
          chartLegendDiv.addClass('legend-closed');
      } else {
          chartLegendDiv.addClass('legend-open');
          chartLegendDiv.removeClass('legend-closed');
      }
  }

  function updatePage() {
    updateWorkerStats();
  }

  
log("miner_stats.html vPOOL_VERSION");
