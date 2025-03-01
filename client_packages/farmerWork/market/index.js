global.melogMarket = mp.browsers.new('package://cef/jobs/FarmerMarket/index.html');
let melogMarketLoaded = false;

mp.peds.new(0x94562DD7, new mp.Vector3(2367.39, 4881.526, 42), 120, 0);

mp.events.add("loadPage", (page, json) => {
	if (!loggedin || chatActive || editing || cuffed) return;
	if(!melogMarketLoaded)
	{
		global.menuOpen();
		global.melogMarket.active = true;
		melogMarketLoaded = true;
	}
	global.melogMarket.execute(`melogMarket.active=true`);
	if(page == 0) global.melogMarket.execute(`melogMarket.setinfo(${json})`);
	if(page == 1) global.melogMarket.execute(`melogMarket.buyitems=${json}`);
	if(page == 2) global.melogMarket.execute(`melogMarket.sellitems=${json}`);
});

mp.events.add("closeMarketMenu", () => {
  setTimeout(function() {
		global.menuClose();
		global.melogMarket.active = false;
		melogMarketLoaded = false;
	}, 100);
});

mp.events.add("changePage", (page) => {
	mp.events.callRemote("changePage", page);
});

mp.events.add("farmerBuy", (item, value) => {
	mp.events.callRemote("buyFarmerItem", item, value);
});
mp.events.add("farmerSell", (item, value) => {
	mp.events.callRemote("sellFarmerItem", item, value);
});