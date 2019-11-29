let siteTitle = "Zel Labs Mining Pools";
let siteFavicon = "/assets/images/ZelLabs-Round.png";
let canonicalLink = "https://zellabs.net";

let poolCoin = "genesis";
let coinTicker = "GENX";
let coinGeckoID = "genesis-network";

// SIDEBAR CONFIG

let sidebarMinimized = true;
let darkModeDefault = true; // ideally you would also change the data-background-color in index.html...
let favouritesEnabled = false;

let coinLogoLink = "https://genesisnetwork.io/";
let coinLogoSrc = "https://avatars3.githubusercontent.com/u/42662324?s=400&v=4";

let extraMenus = [{title: "Masternodes",icons:"fas fa-server",link:"masternodes",items:[
                    {title:"Overview",icons:"fas fa-project-diagram",link:"/coins/genx/genx_mnstats"}
                  ],separator:true}];

let coinCalculatorLink = "https://www.coincalculators.io/coin/genesis";

let coinSupportText = undefined;
let coinSupportIcons = [];
let coinLinks = [];

let explorerAddress = "https://chainz.cryptoid.info/genx/address.dws?";

// HOW TO CONNECT
let supportedMiners = [{longName:"lolMiner (> v0.8.2) (AMD)",shortName:"lolMiner"},
                       {longName:"GMiner (> v1.46) (NVIDIA)",shortName:"GMiner"},
                       {longName:"miniZ (> v1.4o) NVIDIA)",shortName:"miniZ"}];
let algorithm = "Equihash 192,7";
let pers = "GENX_PoW";
let lolMinerCoin = coinTicker;

let aboutUsCoinText = "Genesis";
let coinTeam = [];

// Loading circle progress
let loadingCircleColour = 'rgb(30,192,212)';

let defaultStratumName = 'US';
let extraStratums = [
  {"name": "EU",
   "server": "eu-genx.zellabs.net",
   "ports": [
    {
      "port": 7013,
      "diff": 0.5
    }
   ]
  }
];