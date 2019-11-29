// Utilities

function readableDate(a) {
  var date = new Date(parseInt(a));
  var dateFormatter = new Intl.DateTimeFormat(Intl.DateTimeFormat().resolvedOptions().locale,{dateStyle:"short",timeStyle:"short"});
  return dateFormatter.format(date)
}
function capitalizeFirstLetter(t) {
  return t.charAt(0).toUpperCase()+t.slice(1);
}
function lowercaseFirstLetter(t) {
  return t.charAt(0).toLowerCase()+t.slice(1);
}

function checkDarkMode() {
  $w = $('body');

  var color = Cookies.get('bg-color');
  if (color !== undefined) {
    if (color === 'black') {
      $w.removeClass('light_version');
    } else {
      $w.addClass('light_version');
    }
    //$w.attr('data-background-color', color);
    $('.setting_switch .lv-btn').prop('checked', color === 'white');
  } else {
    //$w.attr('data-background-color',darkModeDefault ? 'black' : 'white');
    if (darkModeDefault) {
      $w.removeClass('light_version');
    } else {
      $w.addClass('light_version');
    }
  }

}

function checkMiniSidebarMode() {
  $w = $('body');

  var mini = Cookies.get('miniSideBar');
  if (mini !== undefined) {
    if (mini === 'true') {
      $w.addClass('mini_sidebar');
      $("#left-sidebar").addClass("mini_sidebar_on");
    }
    //$w.attr('data-background-color', color);
    $('.setting_switch .mini-sidebar-btn').prop('checked', mini === 'true');
  } else {
    //$w.attr('data-background-color',darkModeDefault ? 'black' : 'white');
    if (typeof miniModeDefault !== 'undefined' && miniModeDefault) {
      $w.addClass('mini_sidebar');
      $("#left-sidebar").addClass("mini_sidebar_on");
    }
  }

}

function checkContrast() {
  $w = $('body');

  var contrast = Cookies.get('contrast');
  if (contrast !== undefined) {
    $w.addClass('contrast-'+contrast);
    $("#contrastSlider").data('ionRangeSlider').update({from: contrast === 'low' ? '0' : (contrast === 'medium' ? '1' : '2')});
  } else {
    $w.addClass('contrast-med');
    $("#contrastSlider").data('ionRangeSlider').update({from: '1'});
  }

}

var coinConfigData;

function generateMinerConfig() {
  //var coin = $("#coin_select").val();
  var portText = $("#portSelector .active").text();
  var port = 0;
  var host = coinConfigData.host;
  if (portText.indexOf('-') >= 0) {
    port = parseInt(portText.split(' - ')[1]);
    if (portText.split(' - ')[0] === defaultStratumName) {
      host = coinConfigData.host;
    } else {
      for (var stratum in extraStratums) {
        if (extraStratums[stratum].name === portText.split(' - ')[0]) {
          host = extraStratums[stratum].server;
        }
      }
    }
  } else {
    port = parseInt(portText);
  }
  var address = $("#workerAddress").val();
  var name = $("#workerName").val();
  var password = $("#workerPassword").val();
  var miner = $("#generatorSoftware .active").text();
  var platform = $("#generatorPlatform .active").text();

  // Some basic validation...
  if (address === "") {
    $("#generatorResult").html("Please enter a wallet address");
    $("#copyButton").prop('disabled', true);
    return;
  }
  $("#copyButton").prop('disabled', false);
  if (password === "") { // if there is no password, assume 'x'
    password = "x";
  }
  if (name !== "") { // if there is a name, prepend a dot
    name = "."+name
  }

  var batString = "";
  if (miner === "miniZ") {
    if (platform === "Windows") {
      batString = "miniZ.exe --url="+address+name+"@"+host+":"+port+" -p "+password+" --par="+coinConfigData.pers.N+","+coinConfigData.pers.K+" --pers="+coinConfigData.pers.personalization;
    } else if (platform === "Linux") {
      batString = "miniZ -u "+address+name+" -l "+host+" --port="+port+" -p "+password+" --par="+coinConfigData.pers.N+","+coinConfigData.pers.K+" --pers="+coinConfigData.pers.personalization;
    }
  } else if (miner === "GMiner") {
    if (platform === "Windows") {
      batString = "miner.exe --user "+address+name+" --server "+host+" --port "+port+" --pass "+password+" --algo "+coinConfigData.pers.N+"_"+coinConfigData.pers.K+" --pers "+coinConfigData.pers.personalization;
    } else if (platform === "Linux") {
      batString = "miner --user "+address+name+" --server "+host+" --port "+port+" --pass "+password+" --algo "+coinConfigData.pers.N+"_"+coinConfigData.pers.K+" --pers "+coinConfigData.pers.personalization;
    }
  } else if (miner === "EWBF") {
    if (platform === "Windows") {
      batString = "miner.exe --user "+address+name+" --server "+host+" --port "+port+" --pass "+password+" --algo "+coinConfigData.pers.N+"_"+coinConfigData.pers.K+" --pers "+coinConfigData.pers.personalization+" --fee 0";
    } else if (platform === "Linux") {
      batString = "miner --user "+address+name+" --server "+host+" --port "+port+" --pass "+password+" --algo "+coinConfigData.pers.N+"_"+coinConfigData.pers.K+" --pers "+coinConfigData.pers.personalization+" --fee 0";
    }
  } else if (miner === "lolMiner") {
    if (platform === "Windows") {
      batString = "lolMiner.exe --user "+address+name+" --port "+port+" --pool "+host+" --pass "+password+" --coin "+lolMinerCoin;
    } else if (platform === "Linux") {
      batString = "lolMiner --user "+address+name+" --port "+port+" --pool "+host+" --pass "+password+" --coin "+lolMinerCoin;
    }
  } else if (miner === 'T-Rex') {
    batString = 't-rex';
    if (platform === 'Windows') {
      batString += '.exe';
    }
    batString += ' --algo '+$('#algorithm').text();
    batString += ' --url '+host+':'+port;
    batString += ' --user '+address+name;
    batString += ' --pass '+password;
  } else if (miner === 'CPUMINER') {
    batString = 'cpuminer-avx2';
    if (platform === 'Windows') {
      batString += '.exe';
    }
    batString += ' --algo ';
    if (coinConfigData.algo === 'ghostrider') {
      batString += 'gr';
    } else {
      batString += coinConfigData.algo;
    }
    batString += ' -o '+host+':'+port;
    batString += ' -u '+address+name;
    batString += ' -p '+password;
  }
  $("#generatorResult").html(batString);
}

function copyToClipboard() {
  var text = $("#generatorResult").text();
  var input = document.querySelector("input.copyfrom");
  //console.log(text);

  input.value = text;
  input.select();
  document.execCommand("copy");
}


function loadCoinConfig(site) {
  var statsUrl = site+'/api/config';
  $.ajax({
    Method: 'GET',
    url: statsUrl,
    dataType: 'json',
    success: function (data) {
      var stats = data;
      for (var pool in stats) {
        if (pool !== poolCoin) continue;
        coinConfigData = stats[pool];
        setupPage();

        if (typeof defaultStratumName !== 'undefined') {
          $('#defaultStratum').before('<h6>'+defaultStratumName+' Stratum</h6>');
        }

        var first = true;
        for (var port in coinConfigData.ports) {
          var tr = $('<tr></tr>');
          var td = $('<td>'+coinConfigData.host+':'+port+'</td>');
          tr.append(td);
          td = $('<td>'+coinConfigData.ports[port].diff+'</td>');
          tr.append(td);
          $('#basicConnectionTable').append(tr);
          var stratumName = '';
          if (typeof defaultStratumName !== 'undefined') {
            stratumName = defaultStratumName+' - ';
          }
          $('#portSelector').append('<li class="nav-item"><a class="nav-link'+(first ? ' active' : '')+'" data-toggle="tab" href="#empty" role="tablist" aria-expanded="false" onclick="setTimeout(function() {generateMinerConfig();},10);">'+stratumName+port+'</a><li>');
          first = false;
        }

        if (typeof extraStratums !== 'undefined') {
          var insertAfter = $('#defaultStratum');
          for (var stratum in extraStratums) {
            insertAfter = $('<h6>'+extraStratums[stratum].name+' Stratum</h6>').insertAfter(insertAfter);
            var table = $('<table class="table"></table>');
            table.append('<thead class="text-custom"><th>Server:Port</th><th>Diff</th></thead>');
            var tbody = $('<tbody></tbody>');
            table.append(tbody);
            insertAfter = table.insertAfter(insertAfter);
            for (var p in extraStratums[stratum].ports) {
              var port = extraStratums[stratum].ports[p];
              tbody.append('<tr><td>'+extraStratums[stratum].server+':'+port.port+'</td><td>'+port.diff+'</td></tr>');
              $('#portSelector').append('<li class="nav-item"><a class="nav-link'+(first ? ' active' : '')+'" data-toggle="tab" href="#empty" role="tablist" aria-expanded="false" onclick="setTimeout(function() {generateMinerConfig();},10);">'+extraStratums[stratum].name+' - '+port.port+'</a><li>');
            }
          }
        }

        if (typeof coinConfigData.pers != 'undefined') {
          $('#persString').text(coinConfigData.pers.personalization);
        } else {
          $('#persString').remove();
          $('#persHeader').remove();
        }
        var algo = coinConfigData.algo;
        if (algo === 'equihash') {
          algo = 'Equihash ('+coinConfigData.pers.N+','+coinConfigData.pers.K+')';
        } else if (!coinConfigData.algo.startsWith('x16')) {
          algo = capitalizeFirstLetter(algo);
        }
        $('#algorithm').text(algo);
      }
      $(document).ready(function() {
        generateMinerConfig();
      });
    }
  });
}

function setupPage() {

  $body = $('body');
  $w = $('.wrapper');

  /*isWindows = navigator.platform.indexOf("Win") > -1;
  if (isWindows) { 
    //$(".sidebar, .rightbar, .search_div, #main-content").perfectScrollbar();
    const container = new PerfectScrollbar('#main-content');

    $("html").addClass("perfect-scrollbar-on");
   } else {
    $("html").addClass("perfect-scrollbar-off");
   }*/
   $("#contrastSlider").ionRangeSlider({
    grid: true,
    from: 1,
    values: [
        "Low",
        "Medium", "High"
    ],
    skin: 'round',
    onChange: function(data) {
      var value = lowercaseFirstLetter(data.from_value);
      Cookies.set('contrast',value);
      $body.removeClass('contrast-low').removeClass('contrast-medium').removeClass('contrast-high').addClass('contrast-'+value);
    }
  });

  document.title = siteTitle;
  $("link[rel*='canonical']").attr("href", canonicalLink);
  //$('#brandHeader').text(capitalizeFirstLetter(poolCoin)+poolHeader);
  //$('#searchButton').click(function() {
  //  window.location.href = "/workers/"+$('#searchField').val();
  //});

  checkDarkMode();
  checkMiniSidebarMode();
  checkContrast();

  $('.coin-logo > a').attr('href',coinLogoLink);
  $('.coin-logo > a > img').attr('src',coinLogoSrc);

  //$('.logo-mini > img').attr('src',headerImage);
  //$('.logo-normal').html('&nbsp '+headerText);

  /* Set up any pool-specific sidebar links */
  if (typeof extraMenus != 'undefined') {
    var insertionPoint = $('#extra-menu-items');
    for (var m = 0; m < extraMenus.length; m++) {
      var menu = extraMenus[m];
      var li = $('<li></li>');
      li.attr('id',menu.title);
      insertionPoint.after(li);
      insertionPoint = li;
      if (menu.items) {
        li.text(menu.title);
        li.addClass("header");
        var a = $('<a class="nav-link" href="#'+menu.link+'"></a>');
        a.html('<i class="'+menu.icons+'" aria-hidden="true"></i><p>'+menu.title+'<b class="caret"></b></p>');
        a.attr('data-toggle','collapse');
        //li.append(a);
        var div = $('<div class="collapse" id="'+menu.link+'"></div>');
        //var ul = $('<ul class="nav"></ul>');
        //div.append(ul);
        for (var l in menu.items) {
          var li2 = $('<li id="'+menu.items[l].title+'"></li>');
          if (currentPage === menu.items[l].link) {
            li2.addClass("active");
          }
          var a2 = $('<a href="'+menu.items[l].link+'"></a>');
          a2.append('<i class="'+menu.items[l].icons+'"></i>');
          a2.append('<span class="sidebar-normal">'+menu.items[l].title+'</span>');
          if (menu.items[l].target) a2.attr('target',menu.items[l].target);
          li2.append(a2);
          insertionPoint.after(li2);
          insertionPoint = li2;
        }
        //li.append(div);
      } else if (menu.link) {
        if (currentPage === menu.link) {
          li.addClass("active");
        }
        var a = $('<a href="'+menu.link+'"></a>');
        a.append('<i class="'+menu.icons+'" aria-hidden="true"></i>');
        a.append('<span>'+menu.title+'</span>');
        li.append(a);
        //insertionPoint.after(li);
      }
      if (menu.separator) {
        var separator = $('<li class="separator"></li>');
        insertionPoint.after(separator);
        insertionPoint = separator;
      }
    }
  }
  $('#extra-menu-items').remove();

  if (typeof walletList != 'undefined') {
    var walletsPage = $('#wallets');
    for (var w in walletList) {
      var wallet = walletList[w];
      //console.log(wallet);
      var card = $('<div class="card"></div>');
      var cardHeader = $('<div class="card-header card-header-text"></div>');
      var cardText = $('<div class="card-text"></div>');
      var cardTitle = $('<h4 class="card-title"><img src="'+wallet.icon+'" style="width: 40px; margin-right: 10px;">'+wallet.name+'</h4>');
      var cardBody = $('<div class="card-body"></div>');
      var p = $('<p>'+wallet.description+'</p>');
      var a = $('<a href="'+wallet.url+'" target="_blank" class="mx-auto btn btn-custom btn-round btn-sm">Download</a>');
      cardBody.append(p);
      cardBody.append(a);
      cardText.append(cardTitle);
      cardHeader.append(cardText);
      card.append(cardHeader);
      card.append(cardBody);
      walletsPage.append(card);
    }
  } else {
    $('#wallets').remove();
    $('#walletsTab').remove();
  }

  /* Is the coin calculator supported on this pool? */
  if (typeof coinCalculatorLink !== 'undefined') {
    $('.sidebar-calculator').attr('href',coinCalculatorLink);
  } else {
    $('#sidebarCalculator').remove();
    $('#navbarCalculator').remove();
    $('#notification-icon').addClass('no-calc');
  }
  if ($('#toolsChildren').children('li').length === 0) {
    $('#toolsItem').remove();
  }

  /* Custom dark mode toggle colour */
  //if (typeof darkModeToggleColour !== 'undefined') {
  //  $('.toggle').css('background-color', darkModeToggleColour);
  //}

  var fomoL = $('<li></li>');
  var fomoL2 = $('<a href="#FOMOSupport" class="has-arrow"><i id="fomoSupportIcon" class=""></i><span>'+fomoSupportText+' Support</span></a>');
  var fomoUL = $('<ul aria-expanded="false" class="collapse"></ul>');
  fomoL2.appendTo(fomoL);
  fomoUL.appendTo(fomoL);
  var insertionPoint = $('#support-menu-items');
  insertionPoint.after(fomoL);
  insertionPoint = fomoL;
  for (var link in fomoLinks) {
    var li = $('<li></li>');
    var a = $('<a href="'+fomoLinks[link].link+'" target="_blank"></a>');
    var i = $('<i></i>');
    for (var index in fomoLinks[link].icon) {
      i.addClass(fomoLinks[link].icon[index]);
    }
    var span = $('<span class="sidebar-normal">'+fomoLinks[link].title+'</span>');
    i.appendTo(a);
    span.appendTo(a);
    a.appendTo(li);
    li.appendTo(fomoUL);
  }
  for (var icon in fomoSupportIcons) {
    $('#fomoSupportIcon').addClass(fomoSupportIcons[icon]);
  }

  var zelL = $('<li></li>');
  var zelL2 = $('<a href="#ZELSupport" class="has-arrow"><i id="zelSupportIcon" class=""></i><span>'+zelSupportText+' Support</span></a>');
  var zelUL = $('<ul aria-expanded="false" class="collapse"></ul>');
  zelL2.appendTo(zelL);
  zelUL.appendTo(zelL);
  insertionPoint.after(zelL);
  insertionPoint = zelL;
  for (var link in zelLinks) {
    var li = $('<li></li>');
    var a = $('<a href="'+zelLinks[link].link+'" target="_blank"></a>');
    var i = $('<i></i>');
    for (var index in zelLinks[link].icon) {
      i.addClass(zelLinks[link].icon[index]);
    }
    var span = $('<span class="sidebar-normal">'+zelLinks[link].title+'</span>');
    i.appendTo(a);
    span.appendTo(a);
    a.appendTo(li);
    li.appendTo(zelUL);
  }
  for (var icon in zelSupportIcons) {
    $('#zelSupportIcon').addClass(zelSupportIcons[icon]);
  }

  if (coinSupportText !== undefined) {
    var coinL = $('<li></li>');
    var coinL2 = $('<a href="#COINSupport" class="has-arrow"><i id="coinSupportIcon" class=""></i><span>'+coinSupportText+' Support</span></a>');
    var coinUL = $('<ul></ul>');
    coinL2.appendTo(coinL);
    coinUL.appendTo(coinL);
    insertionPoint.after(coinL);
    for (var link in coinLinks) {
      var li = $('<li></li>');
      var a = $('<a href="'+coinLinks[link].link+'" target="_blank"></a>');
      var i = $('<i></i>');
      for (var index in coinLinks[link].icon) {
        i.addClass(coinLinks[link].icon[index]);
      }
      var span = $('<span class="sidebar-normal">'+coinLinks[link].title+'</span>');
      i.appendTo(a);
      span.appendTo(a);
      a.appendTo(li);
      li.appendTo(coinUL);
    }
    for (var icon in coinSupportIcons) {
      $('#coinSupportIcon').addClass(coinSupportIcons[icon]);
    }
  } else {
    $('#coinSupportItem').remove();
  }

  $('#support-menu-items').remove();
  $("#main-menu").metisMenu();
  
  // monitor the DOM - hide the about us button if the 

  // ABOUT US
  if (aboutUsCoinText !== undefined && aboutUsCoinText !== "") {
    $('#coinTeamButton').children('a').text(aboutUsCoinText);
  } else {
    $('#coinTeamButton').remove();
    $('#coinTeam').remove();
  }
    // FOMO Team
    addTeamBios($('#fomoTeam'), fomoTeam);
    addTeamBios($('#zelTeam'), zelTeam);
    addTeamBios($('#coinTeam'), coinTeam);

    function addTeamBios(teamPage, members) {
      var count = 0;
      var row = $('<div class="row"></div>');
      row.appendTo(teamPage);
      for (var i in members) {
        var teamMember = members[i];
        //console.log(teamMember);
        var col = $('<div class="col-md-4"></div>');
        var card = $('<div class="card card-product"></div>');
        var header = $('<div class="header about-us-image btn-round mx-auto"></div>');
        var img = $('<img class="img" src="/assets/images/avatars/'+teamMember.image+'">');
        img.appendTo(header);
        header.appendTo(card);
        card.appendTo(col);
        col.appendTo(row);

        var body = $('<div class="card-body"></div>');
        var actions = $('<div class="card-actions text-center"></div>');
        // actions? links?
        var title = $('<h4 class="card-title">'+teamMember.name+'</h4>');
        var role = $('<h5 class="card-title">'+teamMember.role+'</h5>');
        var description = $('<div class="card-description" style="text-align: left;">'+teamMember.bio+'</div>');
        actions.appendTo(body);
        title.appendTo(body);
        role.appendTo(body);
        description.appendTo(body);
        body.appendTo(card);

        count++;
        if (count % 3 == 0 && i < members.length-1) {
          row = $('<div class="row"></div>');
          row.appendTo(teamPage);
        }
      }
    }

  // HOW TO CONNECT
  var miners = $('#supportedMiners');
  var generatorSoftware = $('#generatorSoftware');
  /*$('#aboutUsCard').children('ul').attr('class', function(i,c) { return c.replace('info',aboutUsHeaderColour); });
  $('#configGenerator ul').attr('class', function(i,c) { return c.replace('info',configGeneratorColour); });
  $('#copyButton').attr('class', function(i,c) { return c.replace('danger',aboutUsButtonColour); });
  $('#aboutUsClose').attr('class', function(i,c) { return c.replace('danger',aboutUsButtonColour); });
  $('#basicConnection span').attr('class', function(i,c) { return c.replace('info',aboutUsStandoutTextColour); });
  $('#basicConnection thead').attr('class', function(i,c) { return c.replace('info',aboutUsStandoutTextColour); });*/

  for (var index in supportedMiners) {
    miners.append('<li>'+supportedMiners[index].longName+'</li>');
    var li = $('<li class="nav-item"></li>');
    li.append('<a class="nav-link '+(index==0 ? 'active' : '')+'" data-toggle="tab" href="#link1" role="tablist" aria-expanded="true" onclick="setTimeout(function() {generateMinerConfig();},10);">'+supportedMiners[index].shortName+'</a>');
    generatorSoftware.append(li);
  }

  // Pool List MegaMenu
  var megaPoolList = $('#mega-pool-list');
  $.ajax({
    Method: 'GET',
    url: '/poollist',
    dataType: 'json',
    success: function (data) {
      for (var pool in data) {
        let ticker = data[pool].ticker;
        var div = $('<div class="col-lg-4 col-md-6 col-sm-12"></div>');
        var div2 = $('<div class="card w_card3"></div'); div.append(div2);
        var div3 = $('<div class="body"></div>'); div2.append(div3);
        var div4 = $('<div class="text-center"></div>'); div3.append(div4);
        var img = $('<img width="50" height="50" src="'+data[pool].image+'">'); div4.append(img);
        let divCarousel = $('<div id="slider'+ticker+'" class="carousel vert slide" data-ride="carousel" data-pause="false" data-interval="5000"></div');
        var divCarouselInner = $('<div class="carousel-inner"></div>');
        var divItem1 = $('<div class="carousel-item active" style="height: 119px;"></div>');
        var h2 = $('<h2 class="m-t-15 mb-15">'+ticker.toUpperCase()+'</h2>'); divItem1.append(h2);
        let p1 = $('<p class="mb-0">Pool Hashrate:</p>'); divItem1.append(p1);
        let p2 = $('<p>Network Hashrate:</p>'); divItem1.append(p2);

        var divItem2 = $('<div class="carousel-item" style="height: 119px;"></div>');
        let p3 = $('<p class="m-t-25 m-b-5"></p>'); divItem2.append(p3);
        let p4 = $('<p class="m-b-5"></p>'); divItem2.append(p4);
        let p5 = $('<p class="m-b-5"></p>'); divItem2.append(p5);

        divCarouselInner.append(divItem1);
        divCarouselInner.append(divItem2);
        divCarousel.append(divCarouselInner);

        div4.append(divCarousel);

        var a = $('<a href="/coins/'+ticker+'" class="btn btn-info btn-round">Visit Pool</a>'); div4.append(a);
        megaPoolList.after(div);
        megaPoolList = div;
        divCarousel.carousel();
        $.ajax({
          Method: 'GET',
          url: data[pool].server+'/api/homestats',
          dataType: 'json',
          success: function (data) {
            for (var poolName in data.pools) {
              var poolData = data.pools[poolName];
              p1.text('Pool Hashrate: '+poolData.hashrateString);
              p2.text('Network Hashrate: '+poolData.poolStats.networkSolsString);
              p3.text('Miners: '+poolData.minerCount+' - Workers: '+poolData.workerCount);
              var ttf = '';
              var luckDays = poolData.luckDays;
              if (luckDays < 0.04166667) {
                  ttf = (luckDays*24*60).toFixed(0)+" Minutes";
              } else if (luckDays < 1) {
                  ttf = (luckDays*24).toFixed(2)+" Hours";
              } else {
                  ttf = luckDays+" Days";
              }

              p4.text('Time to find Blocks: '+ttf);

              let poolFee = 0;
              for (var fee in poolData.poolFees) {
                poolFee += poolData.poolFees[fee];
              }

              let pp5 = p5;

              $.ajax({
                Method: 'GET',
                url: 'https://'+ticker+'.zellabs.net/api/config',
                dataType: 'json',
                success: function (data) {
                  //console.log(data);
                  for (var poolName in data) {
                      var poolData = data[poolName];
                      if (poolData.algo === 'equihash') {
                        pp5.text('Fee: '+poolFee+'% - Algorithm: Equihash ('+poolData.pers.N+','+poolData.pers.K+')');
                      } else {
                        pp5.text('Fee: '+poolFee+'% - Algorithm: '+poolData.algo);
                      }
                  }
                }
              });

            }
          }
        })
      }
    }
  });

  // Live Search
  var searchInput = $('#miner-search');
  let searchResults = $('#search-results');
  searchInput.on('input', function(event) {
    var searchValue = $(this).val().trim();
    if (searchValue.length > 1) {
      let start = new Date().getTime();
      $.ajax({
        url: 'https://'+coin+'.zellabs.net/api/search?matchCase=false&address='+searchValue,
        dataType: 'json',
        success: function(data) {
          searchResults.empty();
          var numKeys = Object.keys(data).length;
          $('#live-search-result').text('Found '+numKeys+' result'+(numKeys > 1 ? 's' : '')+' ('+((new Date().getTime() - start)/1000).toFixed(2)+' seconds)')
          var count = 0;
          for (var workerName in data) {
            var worker = data[workerName];
            count++;
            var tr = $('<tr></tr>');
            var td1 = $('<td class="w40"></td>'); tr.append(td1);
            td1.append($('<span>'+count+'</span>'));
            var td2 = $('<td></td>'); tr.append(td2);
            var div1 = $('<div class="d-flex align-items-center"></div>'); td2.append(div1);
            var div2 = $('<div class="ml-3"></div>'); div1.append(div2);
            var a = $('<a href="/coins/'+coin+'/workers/'+worker.name+'">'+worker.name+'</a>'); div2.append(a);
            var p = $('<p class="mb-0">Hashrate: '+getReadableHashRateString(worker.hashrate,coinConfigData.algo==='equihash')+'  -  Rigs: '+worker.rigs+'</p>'); div2.append(p);
            searchResults.append(tr);
          }
        }
      })
    } else {
      searchResults.empty();
      $('#live-search-result').text('');
    }
  });
}

let favouritesPrefix = 'fav-';

function updateFavouritesList() {
  var favlist = $('#favourites ul');
  favlist.children('li').remove();
  var cookies = Cookies.get();
  for (var cookie in cookies) {
    if (cookie.startsWith(favouritesPrefix) && cookies[cookie] === 'true') {
      var address = cookie.substring(4);
      var li = $('<li class="nav-item"></id');
      var a = $('<a class="nav-link" href="/workers/'+address+'"></a>');
      var i = $('<i class="far fa-heart"></i>');
      var span = $('<span class="sidebar-normal" style="text-transform: none;">'+address+'</span>');

      a.append(i);
      a.append(span);
      li.append(a);
      favlist.append(li);
    }
  }
}

$(document).ready(function() {
//  $().ready(function() {
  $('.setting_switch .lv-btn').on("change",function() {
    if (!this.checked) {
      Cookies.set('bg-color', 'black');
      $body.removeClass('light_version');
      $('.apexcharts-tooltip').removeClass('light');
      $('.apexcharts-tooltip').addClass('dark');
    } else {
      Cookies.set('bg-color', 'white');
      $body.addClass('light_version');
      $('.apexcharts-tooltip').removeClass('dark');
      $('.apexcharts-tooltip').addClass('light');
    }
  });

  $('.setting_switch .mini-sidebar-btn').on("change",function() {
    if (!this.checked) {
      Cookies.set('miniSideBar', 'false');
      $body.removeClass('mini_sidebar');
      $("#left-sidebar").addClass("mini_sidebar_on");
    } else {
      Cookies.set('miniSideBar', 'true');
      $body.addClass('mini_sidebar');
      $("#left-sidebar").removeClass("mini_sidebar_on")
    }
  });

  if (!favouritesEnabled) {
      $('#favouritesSeparator').remove();
      $('#favouritesList').remove();
    } else {
      $('#favouritesSeparator').removeClass('invisible');
      $('#favouritesList').removeClass('invisible');
      updateFavouritesList();
    }

    var c4 = $('.refresh.circle');

    c4.circleProgress({
      size: 30,
      startAngle: -Math.PI / 4 * 3,
      value: 1,
      lineCap: 'round',
      fill: {color: loadingCircleColour },
      animation: { duration: 30000 }
    }).on('circle-animation-end', function(event) {
      updatePage();
      loadNotifications();
      c4.circleProgress({animation: { duration: 30000 }});
    });
  //});
});

function getReadableHashRateString(hashrate, equihash) {
  if (equihash) {
    hashrate = (hashrate * 2);
    if (hashrate < 1000000) {
        return (Math.round(hashrate / 1000) / 1000 ).toFixed(2)+' Sol/s';
    }
    var byteUnits = [ ' Sol/s', ' KSol/s', ' MSol/s', ' GSol/s', ' TSol/s', ' PSol/s' ];
    var i = Math.floor((Math.log(hashrate/1000) / Math.log(1000)) - 1);
    hashrate = (hashrate/1000) / Math.pow(1000, i + 1);
    return hashrate.toFixed(2) + byteUnits[i];
  } else {
    if (hashrate <= 0) {
      return '0 H/s';
    } else {
      hashrate = (hashrate * 1000000);
      if(hashrate < 1000000){
        hashrate = hashrate * 100000;
      }
      var byteUnits = [' H/s', ' KH/s', ' MH/s', ' GH/s', ' TH/s', ' PH/s'];
      var i = Math.floor((Math.log(hashrate/1000) / Math.log(1000)) - 1);
      hashrate = (hashrate/1000) / Math.pow(1000, i + 1);
      return hashrate.toFixed(2) + byteUnits[i];
    }
  }
}

function getReadableNetworkHashRateString(hashrate, equihash) {
  if (equihash) {
    hashrate = (hashrate * 1000000);
    if (hashrate < 1000000)
      return '0 Sol';
    var byteUnits = [' Sol/s', ' KSol/s', ' MSol/s', ' GSol/s', ' TSol/s', ' PSol/s'];
    var i = Math.floor((Math.log(hashrate / 1000) / Math.log(1000)) - 1);
    hashrate = (hashrate / 1000) / Math.pow(1000, i + 1);
    return hashrate.toFixed(2) + byteUnits[i];
  } else {
    if (hashrate <= 0) {
      return '0 H/s';
    } else {
      hashrate = (hashrate * 1000000);
      if(hashrate < 1000000){
        hashrate = hashrate * 100000;
      }
      var byteUnits = [' H/s', ' KH/s', ' MH/s', ' GH/s', ' TH/s', ' PH/s'];
      var i = Math.floor((Math.log(hashrate/1000) / Math.log(1000)) - 1);
      hashrate = (hashrate/1000) / Math.pow(1000, i + 1);
      return hashrate.toFixed(2) + byteUnits[i];
    }
  }
}

function loadNotifications() {
  //if (typeof notifications !== 'undefined') {
    /*for (var i in notifications) {
      var n = notifications[i];
      $.notify({
      	// options
        title: n.title,
      	message: n.message,
        icon: n.icon || ''
      },{
      	// settings
      	type: n.type,
        allow_dismiss: true,
        icon_type: 'fa-class',
        z_index: 1051,
        delay: n.delay || 7500,
        template: '<div data-notify="container" class="col-11 col-md-4 alert alert-{0}" role="alert"><button type="button" aria-hidden="true" class="close" data-notify="dismiss"><i class="fas fa-window-close"></i></button><i data-notify="icon" class=""></i><span data-notify="title" style="font-weight: bold;">{1}</span> <span data-notify="message">{2}</span><div class="progress" data-notify="progressbar"><div class="progress-bar progress-bar-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div></div><a href="{3}" target="{4}" data-notify="url"></a></div>'
      });
    }*/
    /*                               
                                <li class="header blue" id="notification-list-header"></li>
                                <li>
                                    <a href="javascript:void(0);">
                                        <div class="feeds-left bg-red"><i class="fa fa-check"></i></div>
                                        <div class="feeds-body">
                                            <h4 class="title text-danger">Issue Fixed <small class="float-right text-muted">9:10 AM</small></h4>
                                            <small>WE have fix all Design bug with Responsive</small>
                                        </div>
                                    </a>
                                </li>                               
*/
    $.ajax({
      Method: 'GET',
      url: '/pools/'+coin+'/notifications.json',
      dataType: 'json',
      success: function (data) {
        var notifications = data.notifications;
        //console.log(notifications);
        var icon = $('#notification-icon');
        if (notifications.length == 0) {
          icon.removeClass();
          icon.addClass('dropdown');
          icon.addClass('d-none');
        } else {
          icon.removeClass('d-none');
          $('#notification-badge').text(notifications.length);
          var list = $('#notification-list');
          list.empty();
          list.append('<li class="header orange">You have '+notifications.length+' new notification'+(notifications.length > 1 ? 's' : '')+'</li>');
          for (var n in notifications) {
            var notification = notifications[n];
            var li = $('<li></li>');
            var a = $('<a href="javascript:void(0);"></a>');
            li.append(a);
            var bgcolour = "";
            var textcolour = "";
            if (notification.type === 'warning') {
              bgcolour = 'orange';
              textcolour = 'warning';
            } else if (notification.type === 'error') {
              bgcolour = 'red';
              textcolour = 'danger';
            } else if (notification.type === 'success') {
              bgcolour = 'green';
              textcolour = 'success';
            } else if (notification.type === 'info') {
              bgcolour = 'info';
              textcolour = 'info';
            }
            var div1 = $('<div class="feeds-left bg-'+bgcolour+'"><i class="'+notification.icon+'"></i></div>');
            var div2 = $('<div class="feeds-body"></div>');
            div2.append('<h4 class="title text-'+textcolour+'">'+notification.title+'<small class="float-right text-muted">'+notification.time+'</small></h4>');
            div2.append('<small>'+notification.message+'</small>');
            a.append(div1);
            a.append(div2);
            list.append(li);
          }
        }
      }
    });

  //}
}

function insertFooter() {
  document.getElementById('footer').insertAdjacentHTML('afterend','&copy;'+new Date().getFullYear()+' zellabs.net - Powered by <a href="https://zel.network/" target="_blank" class="text-custom">ZEL</a>');
}

console.log('poolUtils.js v0.2.1');

/*

  v0.1.0 - initial version
  v0.1.1 - move data-background-color from .wrapper to <body>
  v0.2.0 - Oculux template
  v0.2.1 - Move the notification icon over if there is no coin calculator link

*/ 