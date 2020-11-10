// Utilities

const cookieExpiryDuration = 36525; // 100 years

jQuery.fn.textNodes = function() {
  return this.contents().filter(function() {
    return (this.nodeType === Node.TEXT_NODE && this.nodeValue.trim() !== "");
  });
}
function readableDate(a) {
  var date = new Date(parseInt(a));
  //var dateFormatter = new Intl.DateTimeFormat(Intl.DateTimeFormat().resolvedOptions().locale,{dateStyle:"short",timeStyle:"short"});
  var dateFormatter = new Intl.DateTimeFormat(Intl.DateTimeFormat().resolvedOptions().locale,{year:'numeric',month:'2-digit',day:'2-digit',hour:'numeric',minute:'2-digit',hour12:'true'});
  return dateFormatter.format(date)
}
function readableLongDate(a) {
  var date = (typeof a === 'number' ? new Date(parseInt(a)) : a);
  //var dateFormatter = new Intl.DateTimeFormat(Intl.DateTimeFormat().resolvedOptions().locale,{dateStyle:"short",timeStyle:"medium"});
  var dateFormatter = new Intl.DateTimeFormat(Intl.DateTimeFormat().resolvedOptions().locale,{year:'numeric',month:'2-digit',day:'2-digit',hour:'numeric',minute:'2-digit',second:'2-digit',hour12:'true'});
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

  var color = getGlobalCookieValue('bg-color');
  if (color !== undefined && color !== null) {
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

  var mini = getGlobalCookieValue('miniSideBar');
  if (mini !== undefined && mini !== null) {
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

  var contrast = getGlobalCookieValue('contrast');
  if (contrast !== undefined && contrast !== null) {
    $w.addClass('contrast-'+contrast);
    $("#contrastSlider").data('ionRangeSlider').update({from: contrast === 'low' ? '0' : (contrast === 'medium' ? '1' : '2')});
  } else {
    $w.addClass('contrast-med');
    $("#contrastSlider").data('ionRangeSlider').update({from: '1'});
  }

}

function checkAutoUpdate() {
  $w = $('body');

  var autoUpdate = getGlobalCookieValue('autoUpdate');
  if (autoUpdate !== undefined && autoUpdate !== null) {
    if (autoUpdate === 'true') {
      startAutoUpdate();
    }
    $('.setting_switch .auto-refresh-btn').prop('checked', autoUpdate === 'true');
  } else {
    startAutoUpdate();
    $('.setting_switch .auto-refresh-btn').prop('checked', true);
  }

}

function startAutoUpdate() {
  var c4 = $('.refresh.circle');

  c4.circleProgress({
    size: 30,
    startAngle: -Math.PI / 4 * 3,
    value: 1,
    lineCap: 'round',
    fill: {color: loadingCircleColour },
    animation: { duration: 30000 }
  //}).on('circle-animation-end', function(event) {
  //  updatePage();
  //  loadNotifications();
  //  c4.circleProgress({animation: { duration: 30000 }});
  });
  update = setInterval(function() {
    updatePage();
    loadNotifications();
    c4.circleProgress({animation: { duration: 30000 }});
  },30000);

}

var updateID;

function stopAutoUpdate() {
  var c4 = $('.refresh.circle');
  c4.off('circle-animation-end');
  setTimeout(function () {
    $(c4.circleProgress('widget')).stop();
    c4.circleProgress({value:0});
    clearInterval(updateID);
  },100);
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
    batString += ' --algo '+coinConfigData.algo;
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
  } else if (miner === 'CryptoDredge') {
    batString = 'CryptoDredge'
    if (platform === 'Windows') {
      batString += '.exe';
    }
    batString += ' -a '+coinConfigData.algo;
    batString += ' -o stratum+tcp://'+host+':'+port;
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
      //console.log(data);
      //console.log(poolCoin);
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
          td = $('<td'+(coinConfigData.ports[port].tls ? ' rel="tooltip" title="TLS Enabled"' : '')+'>'+coinConfigData.ports[port].diff+(coinConfigData.ports[port].tls ? '<i class="zel-icon zel-icon-lock" style="font-size: 14px; margin-left: 5px;"></i>' : '')+'</td>');
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
              tbody.append('<tr><td>'+extraStratums[stratum].server+':'+port.port+'</td><td'+(port.tls ? ' rel="tooltip" title="TLS Enabled"' : '')+'>'+port.diff+(port.tls ? '<i class="zel-icon zel-icon-lock" style="font-size: 14px; margin-left: 5px;"></i>' : '')+'</td></tr>');
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

  MicroModal.init({
    onShow: modal => {
      $body.css('overflow-y','hidden');
    },
    onClose: modal => {
      $body.css('overflow-y','auto');
    },
    disableFocus: true,
    disableScroll: true,
    awaitOpenAnimation: true,
    awaitCloseAnimation: true
  });

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
      setGlobalCookieValue('contrast',value);
      $body.removeClass('contrast-low').removeClass('contrast-medium').removeClass('contrast-high').addClass('contrast-'+value);
      contrastChanged();
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
  checkAutoUpdate();

  $("#notification-list").click(function(e){
    e.stopPropagation();
  });

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
      var a = $('<a href="'+wallet.url+'" target="_blank" rel="noopener" class="mx-auto btn btn-custom btn-round btn-sm">Download</a>');
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
    var a = $('<a href="'+fomoLinks[link].link+'" target="_blank" rel="noopener"></a>');
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
    var a = $('<a href="'+zelLinks[link].link+'" target="_blank" rel="noopener"></a>');
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
      var a = $('<a href="'+coinLinks[link].link+'" target="_blank" rel="noopener"></a>');
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

  for (var index in supportedMiners) {
    let miner = supportedMiners[index].longName;
    if (supportedMiners[index].link && supportedMiners[index].link.length > 0) {
      miner = '<a href='+supportedMiners[index].link+' target="_blank" rel="noopener"><span class="text-custom">'+miner+'</span></a>';
    }
    miners.append('<li>'+miner+'</li>');
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
        let server = data[pool].server;
        var div = $('<div class="col-lg-4 col-md-6 col-sm-12"></div>');
        var div2 = $('<div class="card w_card3"></div'); div.append(div2);
        var div3 = $('<div class="body"></div>'); div2.append(div3);
        var div4 = $('<div class="text-center"></div>'); div3.append(div4);
        var img = $('<img width="50" height="50" alt="'+ticker+'" src="'+data[pool].image+'">'); div4.append(img);
        let divCarousel = $('<div id="slider'+ticker+'" class="carousel vert slide" data-ride="carousel" data-pause="false" data-interval="5000" style="height: 120px;"></div');
        var divCarouselInner = $('<div class="carousel-inner"></div>');
        var divItem1 = $('<div class="carousel-item active" style="height: 99px;"></div>');
        var h2 = $('<h2 class="m-t-15 mb-15">'+data[pool].name.toUpperCase()+'</h2>'); divItem1.append(h2);
        let p1 = $('<p class="mb-0">Pool Hashrate:</p>'); divItem1.append(p1);
        let p2 = $('<p>Network Hashrate:</p>'); divItem1.append(p2);

        var divItem2 = $('<div class="carousel-item" style="height: 99px;"></div>');
        let p3 = $('<p class="m-t-25 m-b-5"></p>'); divItem2.append(p3);
        let p4 = $('<p class="m-b-5"></p>'); divItem2.append(p4);
        let p5 = $('<p class="m-b-5"></p>'); divItem2.append(p5);

        divCarouselInner.append(divItem1);
        divCarouselInner.append(divItem2);
        divCarousel.append(divCarouselInner);

        div4.append(divCarousel);

        var a = $('<a href="/coins/'+ticker+'" class="btn btn-danger btn-round">Visit Pool</a>'); div4.append(a);
        megaPoolList.after(div);
        megaPoolList = div;
        divCarousel.carousel();
        setTimeout(function() {
          divCarousel.carousel('pause');
        },1000);
        $.ajax({
          Method: 'GET',
          url: server+'/api/homestats',
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
                url: server+'/api/config',
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
        url: site+'/api/search?matchCase=false&address='+searchValue,
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
            var a = $('<a href="/coins/'+coin+'/workers/'+worker.name+'">'+getFormattedAddress(worker.name)+'</a>'); div2.append(a);
            var p = $('<p class="mb-0">Hashrate: '+getReadableHashRateString(worker.hashrate,coinConfigData.algo)+'  -  Rigs: '+worker.rigs+'</p>'); div2.append(p);
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

let favouritesPrefix = 'zelLabs-favourites';

function getFavourites() {
  var faves = getGlobalCookieValue(favouritesPrefix);
  if (faves !== undefined && faves !== null && faves !== '') {
    let favourites = faves.split(',');
    return favourites;
  }
  return [];
}

function setFavourites(favouritesArray) {
  let favString = '';
  for (let i=0;i<favouritesArray.length;i++) {
    favString += favouritesArray[i];
    if (i < favouritesArray.length-1) {
      favString += ',';
    }
  }
  setGlobalCookieValue(favouritesPrefix, favString);
}

function isFavourite(_coin,_address) {
  let favourites = getFavourites();
  for (let i in favourites) {
    let favourite = favourites[i];
    var bits = favourite.split('-');
    var coin = bits[0]
    var address = bits[1];
    if (coin === _coin && address === _address) {
      return true;
    }
  }
  return false;
}

function addFavourite(_coin, _address) {
  if (isFavourite(_coin, _address)) {
    return;
  }
  let favourites = getFavourites();
  favourites.push(_coin+'-'+_address);
  setFavourites(favourites);
}

function removeFavourite(_coin, _address) {
  let favourites = getFavourites();
  let index = -1;
  for (let i in favourites) {
    let favourite = favourites[i];
    var bits = favourite.split('-');
    var coin = bits[0]
    var address = bits[1];
    if (coin === _coin && address === _address) {
      index = i;
    }
  }
  if (index >= 0) {
    favourites.splice(index,1);
  }
  setFavourites(favourites);
}

function updateFavouritesList() {
  var favlist = $('#favourites');
  favlist.empty();

  let coins = [];
  let favourites = getFavourites();
  for (let i in favourites) {
    let favourite = favourites[i];
    var bits = favourite.split('-');
    var coin = bits[0]
    var address = bits[1];

    let coinAddresses = coins[coin] || {coin:coin,addresses:[]};
    coinAddresses.addresses.push(address);
    coins[coin] = coinAddresses;
  }

  /*for (let cookie in cookies) {
    if (cookie.startsWith(favouritesPrefix) && cookies[cookie] === 'true') {
      var bits = cookie.split('-');
      var coin = bits[1]
      var address = bits[2];

      let coinAddresses = coins[coin] || {coin:coin,addresses:[]};
      coinAddresses.addresses.push(address);
      coins.push(coinAddresses);
    }
  }*/
  let newCoins = [];
  for (let coin in coins) {
    newCoins.push(coins[coin]);
  }
  coins = newCoins;
  coins.sort(dynamicSort('coin'));

  function dynamicSort(property) {
    var sortOrder = 1;

    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }

    return function (a,b) {
        if(sortOrder == -1){
            return b[property].localeCompare(a[property]);
        }else{
            return a[property].localeCompare(b[property]);
        }        
    }
  }

  for (let coin in coins) {
    let coinAddresses = coins[coin];
    let coinHeader = $('<h5>'+coinAddresses.coin.toUpperCase()+'</h5>');
    let coinList = $('<ul style="list-style: none; text-indent: -2rem;"></ul>');
    for (let addressIndex in coinAddresses.addresses) {
        let address = coinAddresses.addresses[addressIndex];
        var li = $('<li class="nav-item"></id');
        var a = $('<a class="nav-link text-custom" href="/coins/'+coinAddresses.coin+'/workers/'+address+'"></a>');
        var i = $('<i class="zel-icon zel-icon-heart text-custom" style="margin-right: 10px;"></i>');
        var span = $('<span class="sidebar-normal text-custom" style="text-transform: none;">'+getFormattedAddress(address)+'</span>');

        a.append(i);
        a.append(span);
        li.append(a);
        coinList.append(li);
    }
    favlist.append(coinHeader);
    favlist.append(coinList);
  }
}

function keysrt(key) {
  return function(a,b){
   if (a[key] > b[key]) return 1;
   if (a[key] < b[key]) return -1;
   return 0;
  }
}

$(document).ready(function() {
  if (typeof minerCoinPrecision === 'undefined') {
    minerCoinPrecision = 2;
  }
//  $().ready(function() {
  $('.setting_switch .lv-btn').on("change",function() {
    if (!this.checked) {
      setGlobalCookieValue('bg-color', 'black');
      $body.removeClass('light_version');
      //$('.apexcharts-tooltip').removeClass('light');
      //$('.apexcharts-tooltip').addClass('dark');
    } else {
      setGlobalCookieValue('bg-color', 'white');
      $body.addClass('light_version');
      //$('.apexcharts-tooltip').removeClass('dark');
      //$('.apexcharts-tooltip').addClass('light');
    }
  });

  $('.setting_switch .mini-sidebar-btn').on("change",function() {
    if (!this.checked) {
      setGlobalCookieValue('miniSideBar', 'false');
      $body.removeClass('mini_sidebar');
      $("#left-sidebar").addClass("mini_sidebar_on");
    } else {
      setGlobalCookieValue('miniSideBar', 'true');
      $body.addClass('mini_sidebar');
      $("#left-sidebar").removeClass("mini_sidebar_on")
    }
  });

  $('.setting_switch .auto-refresh-btn').on("change",function() {
    if (!this.checked) {
      setGlobalCookieValue('autoUpdate', 'false');
      stopAutoUpdate();
    } else {
      setGlobalCookieValue('autoUpdate', 'true');
      startAutoUpdate();
    }
  });

  //if (!favouritesEnabled) {
  //    $('#favouritesSeparator').remove();
  //    $('#favouritesList').remove();
  //  } else {
  //    $('#favouritesSeparator').removeClass('invisible');
  //    $('#favouritesList').removeClass('invisible');
      updateFavouritesList();
  //  }

});

function getReadableHashRateString(hashrate, algorithm, force2Places = false) {
  if (algorithm==='equihash') {
    hashrate = (hashrate * 2);
    if (hashrate < 1000000) {
        return (Math.round(hashrate / 1000) / 1000 ).toFixed(2)+' Sol/s';
    }
    var byteUnits = [ ' Sol/s', ' KSol/s', ' MSol/s', ' GSol/s', ' TSol/s', ' PSol/s' ];
    var i = Math.floor((Math.log(hashrate/1000) / Math.log(1000)) - 1);
    hashrate = (hashrate/1000) / Math.pow(1000, i + 1);
    var places = hashrate < 5 ? 2 : hashrate < 10 ? 1 : 0; 
    return hashrate.toFixed(force2Places ? 2 : places) + byteUnits[i];
  } else {
    var byteUnits = algorithm==='cuckaroo29s' ? [' G/s', ' KG/s', ' MG/s', ' GG/s', ' TG/s', ' PG/s' ] : [' H/s', ' KH/s', ' MH/s', ' GH/s', ' TH/s', ' PH/s'];
    //console.log(hashrate);
    if (hashrate <= 0) {
      return '0'+byteUnits[0];
    } else if (hashrate < 1) {
      return hashrate.toFixed(2)+byteUnits[0];
    } else {
      hashrate = (hashrate * 1000000);
      if(hashrate < 1000000){
        hashrate = hashrate * 100000;
      }
      var i = Math.floor((Math.log(hashrate/1000) / Math.log(1000)) - 1);
      hashrate = (hashrate/1000) / Math.pow(1000, i + 1);
      var places = hashrate < 5 ? 2 : hashrate < 10 ? 1 : 0; 
      return hashrate.toFixed(force2Places ? 2 : places) + byteUnits[i];
    }
  }
}

function getReadableNetworkHashRateString(hashrate, algorithm, force2Places = false) {
  if (algorithm==='equihash') {
    hashrate = (hashrate * 1000000);
    if (hashrate < 1000000)
      return '0 Sol';
    var byteUnits = [' Sol/s', ' KSol/s', ' MSol/s', ' GSol/s', ' TSol/s', ' PSol/s'];
    var i = Math.floor((Math.log(hashrate / 1000) / Math.log(1000)) - 1);
    hashrate = (hashrate / 1000) / Math.pow(1000, i + 1);
    var places = hashrate < 5 ? 2 : hashrate < 10 ? 1 : 0; 
    return hashrate.toFixed(force2Places ? 2 : places) + byteUnits[i];
  } else {
    var byteUnits = algorithm==='cuckaroo29s' ? [' G/s', ' KG/s', ' MG/s', ' GG/s', ' TG/s', ' PG/s' ] : [' H/s', ' KH/s', ' MH/s', ' GH/s', ' TH/s', ' PH/s'];
    if (hashrate <= 0) {
      return '0'+byteUnits[0];
    } else {
      hashrate = (hashrate * 1000000);
      if(hashrate < 1000000){
        hashrate = hashrate * 100000;
      }
      var i = Math.floor((Math.log(hashrate/1000) / Math.log(1000)) - 1);
      hashrate = (hashrate/1000) / Math.pow(1000, i + 1);
      var places = hashrate < 5 ? 2 : hashrate < 10 ? 1 : 0; 
      return hashrate.toFixed(force2Places ? 2 : places) + byteUnits[i];
    }
  }
}

function dismissNotification(id) {
  $('#notification-'+id).fadeOut(300, function() {
    $(this).remove();
    setBooleanCookieValue("-notificationHidden-"+id,true);
    let currentNumber = Number($('#notification-badge').text());
    currentNumber--;
    $('#notification-badge').text(currentNumber);
    $('#notification-header').text('You have '+currentNumber+' new notification'+(currentNumber !== 1 ? 's' : ''));
    if (currentNumber === 0) {
      $('#notification-list').dropdown('toggle');
    }
  });
}

function loadNotifications() {
  $.ajax({
    Method: 'GET',
    url: '/pools/globalnotifications.json',
    dataType: 'json',
    success: function (globaldata) {
      $.ajax({
        Method: 'GET',
        url: '/pools/'+coin+'/notifications.json',
        dataType: 'json',
        success: function (data) {
          var notifications = globaldata.notifications.concat(data.notifications);
          //console.log(notifications);
          var icon = $('#notification-icon');
          if (notifications.length == 0) {
            icon.removeClass();
            icon.addClass('dropdown');
            icon.addClass('d-none');
          } else {
            icon.removeClass('d-none');
            var list = $('#notification-list');
            list.empty();
            let count = 0;
            list.append('<li class="header orange" id="notification-header"></li>');
            for (var n in notifications) {
              var notification = notifications[n];
              let dismissed = getBooleanCookieValue("-notificationHidden-"+notification.id, false);
              if (!dismissed) {
                var li = $('<li id="notification-'+notification.id+'"></li>');
                var a = $('<div style="display: flex; padding: 13px 20px;"></div>');
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
                var div1 = $('<div class="feeds-left bg-'+bgcolour+'"><i class="zel-icon zel-icon-'+notification.icon+'"></i></div>');
                var div2 = $('<div class="feeds-body"></div>');
                if (!notification.dismissable || notification.dismissable === 'true') {
                  div2.append('<button type="button" class="close" aria-label="Close" onclick="dismissNotification('+notification.id+');"><span aria-hidden="true">×</span></button>');
                }
                div2.append('<h4 class="title text-'+textcolour+'">'+notification.title+'<small class="float-right text-muted">'+notification.time+'</small></h4>');
                div2.append('<small>'+notification.message+'</small>');
                a.append(div1);
                a.append(div2);
                list.append(li);
                count++;
              }
            }
            $('#notification-badge').text(count);
            $('#notification-header').text('You have '+count+' new notification'+(count !== 1 ? 's' : ''));

          }
        }
      });
    }

  });

  //}
}

function emptyLog(param) {
}
function log(param) {
  var l = "console";
  l += ".";
  l += "log(param)";
  eval(l);
}

const pSBC=(p,c0,c1,l)=>{
	let r,g,b,P,f,t,h,i=parseInt,m=Math.round,a=typeof(c1)=="string";
	if(typeof(p)!="number"||p<-1||p>1||typeof(c0)!="string"||(c0[0]!='r'&&c0[0]!='#')||(c1&&!a))return null;
	if(!this.pSBCr)this.pSBCr=(d)=>{
		let n=d.length,x={};
		if(n>9){
			[r,g,b,a]=d=d.split(","),n=d.length;
			if(n<3||n>4)return null;
			x.r=i(r[3]=="a"?r.slice(5):r.slice(4)),x.g=i(g),x.b=i(b),x.a=a?parseFloat(a):-1
		}else{
			if(n==8||n==6||n<4)return null;
			if(n<6)d="#"+d[1]+d[1]+d[2]+d[2]+d[3]+d[3]+(n>4?d[4]+d[4]:"");
			d=i(d.slice(1),16);
			if(n==9||n==5)x.r=d>>24&255,x.g=d>>16&255,x.b=d>>8&255,x.a=m((d&255)/0.255)/1000;
			else x.r=d>>16,x.g=d>>8&255,x.b=d&255,x.a=-1
		}return x};
	h=c0.length>9,h=a?c1.length>9?true:c1=="c"?!h:false:h,f=this.pSBCr(c0),P=p<0,t=c1&&c1!="c"?this.pSBCr(c1):P?{r:0,g:0,b:0,a:-1}:{r:255,g:255,b:255,a:-1},p=P?p*-1:p,P=1-p;
	if(!f||!t)return null;
	if(l)r=m(P*f.r+p*t.r),g=m(P*f.g+p*t.g),b=m(P*f.b+p*t.b);
	else r=m((P*f.r**2+p*t.r**2)**0.5),g=m((P*f.g**2+p*t.g**2)**0.5),b=m((P*f.b**2+p*t.b**2)**0.5);
	a=f.a,t=t.a,f=a>=0||t>=0,a=f?a<0?t:t<0?a:a*P+t*p:0;
	if(h)return"rgb"+(f?"a(":"(")+r+","+g+","+b+(f?","+m(a*1000)/1000:"")+")";
	else return"#"+(4294967296+r*16777216+g*65536+b*256+(f?m(a*255):0)).toString(16).slice(1,f?undefined:-2)
}

function insertFooter() {
  document.getElementById('footer').insertAdjacentHTML('afterend','&copy;'+new Date().getFullYear()+' zellabs.net - Powered by <a href="https://zel.network/" target="_blank" rel="noopener" class="text-custom">ZEL</a>');
}

function getBooleanCookieValue(name, defaultValue) {
  if (typeof(Storage) !== "undefined") {
    let value = localStorage.getItem(poolCoin+name);
    if (value !== undefined && value !== null) {
      return value==='true';
    }
  } else {
    let cookie = Cookies.get(poolCoin+name);
    if (cookie !== undefined) {
        return cookie==='true';
    }
  }
  return defaultValue;
}

function setBooleanCookieValue(name, value) {
  if (typeof(Storage) !== "undefined") {
    localStorage.setItem(poolCoin+name, value);
  } else {
    Cookies.set(poolCoin+name, value, { expires: cookieExpiryDuration });
  }
}

function getNumberCookieValue(name, defaultValue) {
  if (typeof(Storage) !== "undefined") {
    let value = localStorage.getItem(poolCoin+name);
    if (value !== undefined && value !== null) {
      return Number(value);
    }
  } else {
    let cookie = Cookies.get(poolCoin+name);
    if (cookie !== undefined) {
        return Number(cookie);
    }
  }
  return defaultValue;
}

function setNumberCookieValue(name, value) {
  if (typeof(Storage) !== "undefined") {
    localStorage.setItem(poolCoin+name, value);
  } else {
    Cookies.set(poolCoin+name, ''+value, { expires: cookieExpiryDuration });
  }
}

function getStringCookieValue(name, defaultValue) {
  if (typeof(Storage) !== "undefined") {
    let value = localStorage.getItem(poolCoin+name);
    if (value !== undefined && value !== null) {
      return value;
    }
  } else {
    let cookie = Cookies.get(poolCoin+name);
    if (cookie !== undefined) {
        return cookie;
    }
  }
  return defaultValue;
}

function setStringCookieValue(name, value) {
  if (typeof(Storage) !== "undefined") {
    localStorage.setItem(poolCoin+name, value);
  } else {
    Cookies.set(poolCoin+name, value, { expires: cookieExpiryDuration });
  }
}

function getGlobalCookieValue(name) {
  if (typeof(Storage) !== "undefined") {
    return localStorage.getItem(name);
  } else {
    return Cookies.get(name);
  }
}

function setGlobalCookieValue(name, value) {
  if (typeof(Storage) !== "undefined") {
    localStorage.setItem(name, value);
  } else {
    Cookies.set(name, value, { expires: cookieExpiryDuration });
  }
}

function getFormattedAddress(address) {
  if (address.length > 50) {
    return address.substring(0,25)+'...'+address.substring(address.length-25);
  }
  return address;
}

function startPoolList() {
  $('#megamenu .carousel').each(function() {
    $(this).carousel('cycle');
  });
  particlesJS("particles-js", {
    particles: {
        number: {
            value: 30,
            density: {
                enable: !0,
                value_area: 700
            }
        },
        color: {
            value: ["#fc3c5f", "#993cfc", "#3ca9fc", "#3cfc5f", "#fcdf3c"]
        },
        shape: {
            type: "circle",
            stroke: {
                width: 0,
                color: "#000000"
            },
            polygon: {
                nb_sides: 15
            }
        },
        opacity: {
            value: .5,
            random: !1,
            anim: {
                enable: !1,
                speed: 1.2,
                opacity_min: .15,
                sync: !1
            }
        },
        size: {
            value: 2.5,
            random: !1,
            anim: {
                enable: !0,
                speed: 2,
                size_min: .15,
                sync: !1
            }
        },
        line_linked: {
            enable: !0,
            distance: 110,
            color: "#2b313c",
            opacity: 1,
            width: 1
        },
        move: {
            enable: !0,
            speed: 1.6,
            direction: "none",
            random: !1,
            straight: !1,
            out_mode: "out",
            bounce: !1,
            attract: {
                enable: !1,
                rotateX: 600,
                rotateY: 1200
            }
        }
    },
    interactivity: {
        detect_on: "canvas",
        events: {
            onhover: {
                enable: !1,
                mode: "repulse"
            },
            onclick: {
                enable: !1,
                mode: "push"
            },
            resize: !0
        },
        modes: {
            grab: {
                distance: 400,
                line_linked: {
                    opacity: 1
                }
            },
            bubble: {
                distance: 400,
                size: 30,
                duration: 2,
                opacity: 8,
                speed: 3
            },
            repulse: {
                distance: 200,
                duration: .4
            },
            push: {
                particles_nb: 4
            },
            remove: {
                particles_nb: 2
            }
        }
    },
    retina_detect: !0
  });
}

function stopPoolList() {
  $('#megamenu .carousel').each(function() {
    $(this).carousel('pause');
  });
  $('#particles-js').empty();
}

log('poolUtils.js vPOOL_VERSION');

/*

  v0.1.0 - initial version
  v0.1.1 - move data-background-color from .wrapper to <body>
  v0.2.0 - Oculux template
  v0.2.1 - Move the notification icon over if there is no coin calculator link
  v0.2.2 - 
  v0.2.3 - Added a function for replacing text in a node without disturbing children
  v0.3.0 - pSBC function, change decimal points on network hash rates for the graphs

*/ 