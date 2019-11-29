let siteTitle = "Zel Labs Mining Pools";
let siteFavicon = "/assets/images/ZelLabs-Round.png";
let canonicalLink = "https://zellabs.net";

let poolCoin = "zel";
let poolCoin2 = "zelcash";
let coinTicker = "ZEL";
let coinGeckoID = poolCoin2;

// SIDEBAR CONFIG

let sidebarMinimized = true;
let darkModeDefault = true; // ideally you would also change the data-background-color in index.html...
let favouritesEnabled = false;

let coinLogoLink = "http://zel.network/zel";
let coinLogoSrc = "https://zel.network/img/Zel-Round.svg";

let extraMenus = [{title: "Masternodes",icons:"zel-icon zel-icon-mixcloud",link:"masternodes",items:[
                    {title:"Overview",icons:"zel-icon zel-icon-heartbeat",link:"/coins/zel/zel_mnstats"}
                 ],separator:true}];
   
let coinCalculatorLink = "https://www.coincalculators.io/coin/zelcash";

let coinSupportText = undefined;
let coinSupportIcons = [];
let coinLinks = [];

let explorerAddress = "https://explorer.zel.cash/address/";

// HOW TO CONNECT
let supportedMiners = [{longName:"lolMiner (> v0.8.2) (AMD)",shortName:"lolMiner"},
                       {longName:"GMiner (> v1.46) (NVIDIA)",shortName:"GMiner"},
                       {longName:"miniZ (> v1.4o) NVIDIA)",shortName:"miniZ"}];
let algorithm = "Equihash 125,4";
let pers = "ZelProof";
let lolMinerCoin = coinTicker;

let walletList = [{name:"ZelCore (Recommended)",
                   icon:"https://lh3.googleusercontent.com/JujGZjn2HIFYuToiXn9ZMDfH59BwcZoEvasayCSpp6R6JFaIyeaJu4tcqTiCakBPYHg",
                   url:"https://zel.network/project/zelcore/download.html",
                   description:"ZelCore is a multi asset platform and wallet, free-to-use by all, with top quick-swap exchanges. ZelCore+ unlocks advanced trading functionality with API integrations to the top exchanges + TradingView."},
                  {name:"ZelMate",
                   icon:"https://avatars2.githubusercontent.com/u/36568448?s=400&v=4",
                   url:"https://github.com/zelcash/zelcash-swing-wallet/releases",
                   description:"A full node wallet for ZelCash offering friendly UI to all users across all platforms - Windows, Linux and macOS. The best choice for a full node wallet featuring private transactions and messages. Your new best mate for ZelCash!"}];

let aboutUsCoinText = "";
let coinTeam = [];

// Loading circle progress
let loadingCircleColour = 'rgb(255,121,82)';
let defaultStratumName = 'US';
let extraStratums = [
  {"name": "EU",
   "server": "eu-zel.zellabs.net",
   "ports": [
    {
      "port": 7011,
      "diff": 0.5
    }
   ]
  }
];