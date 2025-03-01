﻿const vehicleNames = require('./RealCarNames.js');
global.menuOpened = true;
global.menu = null;

global.menuCheck = function () {
    if (global.menu !== null) {
        //mp.gui.chat.push('menu:yes');
        if (global.menuOpened) {
            //mp.gui.chat.push('menuOpen:yes');
            return true;
        }
        //mp.gui.chat.push('menuOpen:no');
        return false;
    }
    else {
        //mp.gui.chat.push('menu:no');
        return true;
    }
};
global.menuClose = function () {
    mp.gui.cursor.visible = false;
    global.menuOpened = false;
    mp.events.call('showHUD', hudWasOpened);
}
global.menuOpen = function () {
    mp.gui.cursor.visible = true;
    global.menuOpened = true;
    hudWasOpened = global.showhud;
    mp.events.call('showHUD', false);
}
var hudWasOpened = true;

mp.events.add("playerQuit", (player, exitType, reason) => {
    if (global.menu !== null) {
        if (player.name === localplayer.name) {
            global.menuClose();
            global.menu.destroy();
            global.menu = null;
        }
    }
});

let alcoUI = null;
const ClubNames = {
    10: "Bahama Mamas West",
    11: "Vanila Unicorn",
    12: "Tequi-la-la",
    13: "Diamond Penthouse",
};
const ClubAlcos = {
    10: ["«Martini Asti»", "«Sambuca»", "«Campari»"],
    11: ["«En una cáscara de limón»", "«На бруснике»", "«Русский стандарт»"],
    12: ["«Asahi»", "«Midori»", "«Yamazaki»"],
    13: ["«Jeevan»", "«Ararat»", "«Noyan Tapan»"],
};
const ClubDrinks = [75, 115, 150];
var selectedAlco = 0;
mp.events.add("openAlco", (club, modief, isOwner, stock) => {
    selectedAlco = 0;
    global.menuOpen();
    mp.gui.cursor.visible = false;
    var res = mp.game.graphics.getScreenActiveResolution(0, 0);
    const UIPositions = {
        RightMiddle: new Point(res.x - 180, res.y / 2),
        LeftMiddle: new Point(0, res.y / 2 - 200),
    };
    alcoUI = new Menu("Клуб", ClubNames[club], UIPositions.LeftMiddle);

    var drinks = [` ${ClubAlcos[club][0]} ${(ClubDrinks[0] * modief).toFixed()}$`,
        ` ${ClubAlcos[club][1]} ${(ClubDrinks[1] * modief).toFixed()}$`,
        ` ${ClubAlcos[club][2]} ${(ClubDrinks[2] * modief).toFixed()}$`];

    alcoUI.AddItem(new UIMenuListItem(
        "Напитки",
        "Вы можете выбрать любой напиток",
        new ItemsCollection(drinks)
    ));

    if (isOwner) {
        alcoUI.AddItem(new UIMenuItem("Инфо", `Materiales: ${stock[0]}\n${ClubAlcos[club][0]} - ${stock[1]}\n${ClubAlcos[club][1]} - ${stock[2]}\n${ClubAlcos[club][2]} - ${stock[3]}`));
        alcoUI.AddItem(new UIMenuItem("Взять", "Взять выбранный напиток со склада"));
        alcoUI.AddItem(new UIMenuItem("Скрафтить", "Скрафтить выбранный напиток"));
        alcoUI.AddItem(new UIMenuItem("Установить цену", "Установить модификатор цены для всех продуктов (от 50% до 150%)"));
    }

    alcoUI.AddItem(new UIMenuItem("Купить", "Купить выбранный напиток"));

    var uiItem = new UIMenuItem("Закрыть", "Закрыть меню");
    uiItem.BackColor = new Color(255, 0, 0);
    alcoUI.AddItem(uiItem);

    alcoUI.ItemSelect.on(item => {
		if(new Date().getTime() - global.lastCheck < 100) return; 
		global.lastCheck = new Date().getTime();
        if (item.Text == "Купить") {
            mp.events.callRemote('menu_alco', 0, selectedAlco);
        }
        else if (item.Text == "Взять") {
            mp.events.callRemote('menu_alco', 1, selectedAlco);
        }
        else if (item.Text == "Скрафтить") {
            mp.events.callRemote('menu_alco', 2, selectedAlco);
        }
        else if (item.Text == "Установить цену") {
            global.menuClose();
            alcoUI.Close();
            mp.events.callRemote('menu_alco', 3, 0);
        }
        else if (item.Text == "Закрыть") {
            global.menuClose();
            alcoUI.Close();
        }
    });

    alcoUI.ListChange.on((item, index) => {
        selectedAlco = index;
    });

    alcoUI.Open();
});

// // // // //
global.input = {
    head: "",
    desc: "",
    len: "",
    cBack: "",
    set: function (h, d, l, c) {
        this.head = h, this.desc = d;
        this.len = l, this.cBack = c;
        if (global.menuCheck()) return;
        global.menu.execute(`input.set("${this.head}","${this.desc}","${this.len}");`)
    },
    open: function () {
        if (global.menuCheck()) return;
        global.menu.execute('input.active=1');
        global.menuOpen();
        mp.events.call('startScreenEffect', "MenuMGHeistIn", 1, true);
    },
    close: function () {
        global.menuClose();
        global.menu.execute('input.active=0');
        mp.events.call('stopScreenEffect', "MenuMGHeistIn");
    }
};
mp.events.add('input', (text) => {
    if (input.cBack == "") return;
    if (input.cBack == "setCruise")
        mp.events.call('setCruiseSpeed', text);
    else 
        mp.events.callRemote('inputCallback', input.cBack, text);
    input.cBack = "";
    input.close();
});
mp.events.add('openInput', (h, d, l, c) => {
    if (global.menuCheck()) return;
    input.set(h, d, l, c);
    input.open();
})
mp.events.add('closeInput', () => {
    input.close();
})
// // // // //
global.dialog = {
    question: "",
    cBack: "",
    menuWasopened: false,
    lastTime: false,
    open: function () {
        global.dialog.lastTime = 0;
        if (global.menu != null) {
            global.menu.execute(`dialog.title='${global.dialog.question}'`);
            global.menu.execute(`dialog.active=1`);
        }
        menuWasopened = global.menuOpened;
        mp.gui.cursor.visible = true;
        if (!global.menuOpened) global.menuOpen();
        mp.events.call('startScreenEffect', "MenuMGHeistIn", 1, true);
    },
    close: function () {
        if (global.menu != null) global.menu.execute('dialog.active=0');
        if (!menuWasopened) global.menuClose();
        mp.events.call('stopScreenEffect', "MenuMGHeistIn");
    },
}
mp.events.add('openDialog', (c, q) => {
    global.dialog.cBack = c;
    global.dialog.question = q;
    global.dialog.open();
	mp.gui.cursor.visible = true;
})
mp.events.add('closeDialog', () => {
    global.dialog.close();
})
mp.events.add('dialogCallback', (state) => {
    if (global.dialog.cBack == 'tuningbuy')
        mp.events.call('tunbuy', state);
    else
        mp.events.callRemote('dialogCallback', global.dialog.cBack, state);
    global.dialog.close();
})
// DIAL //
mp.events.add('dial', (act, val, reset) => {
    switch (act) {
        case "open":
            if (reset == true) {
                global.menu.execute('dial.hide()');
                global.menuClose()
            }
            var off = Math.random(2, 5);
            global.menu.execute(`dial.val=${val};dial.off=${off};dial.show();`);
            global.menuOpen();
            break;
        case "close":
            global.menu.execute('dial.hide()');
            global.menuClose()
            break;
        case "call":
            mp.events.callRemote('dialPress', val);
            global.menuClose()
            break;
    }
});
// STOCK //
mp.events.add('openStock', (data) => {
    if (global.menuCheck()) return;
    global.menu.execute(`stock.count=JSON.parse('${data}');stock.show();`);
    global.menuOpen();
});
mp.events.add('closeStock', () => {
    global.menuClose()
});
mp.events.add('stockTake', (index) => {
    global.menuClose()
    switch (index) {
        case 3: //mats
            mp.events.callRemote('setStock', "mats");
            global.input.set("Взять маты", "Введите кол-во матов", 10, "take_stock");
            global.input.open();
            break;
        case 0: //cash
            mp.events.callRemote('setStock', "money");
            global.input.set("Взять деньги", "Введите кол-во денег", 10, "take_stock");
            global.input.open();
            break;
        case 1: //healkit
            mp.events.callRemote('setStock', "medkits");
            global.input.set("Взять аптечки", "Введите кол-во аптечек", 10, "take_stock");
            global.input.open();
            break;
        case 2: //weed
            mp.events.callRemote('setStock', "drugs");
            global.input.set("Взять наркотики", "Введите кол-во наркоты", 10, "take_stock");
            global.input.open();
            break;
        case 4: //weapons stock
            mp.events.callRemote('openWeaponStock');
            break;
    }
});
mp.events.add('stockPut', (index) => {
    global.menuClose()
    switch (index) {
        case 3: //mats
            mp.events.callRemote('setStock', "mats");
            global.input.set("Положить маты", "Введите кол-во матов", 10, "put_stock");
            global.input.open();
            break;
        case 0: //cash
            mp.events.callRemote('setStock', "money");
            global.input.set("Положить деньги", "Введите кол-во денег", 10, "put_stock");
            global.input.open();
            break;
        case 1: //healkit
            mp.events.callRemote('setStock', "medkits");
            global.input.set("Положить аптечки", "Введите кол-во аптечек", 10, "put_stock");
            global.input.open();
            break;
        case 2: //weed
            mp.events.callRemote('setStock', "drugs");
            global.input.set("Положить наркотики", "Введите кол-во наркоты", 10, "put_stock");
            global.input.open();
            break;
        case 4: //weapons stock
            mp.events.callRemote('openWeaponStock');
            break;
    }
});
mp.events.add('stockExit', () => {
    global.menuClose()
});
// POLICE PC //
var pcSubmenu;
mp.events.add('pcMenu', (index) => {
    switch (index) {
        case 1:
            global.menu.execute('pc.clearWanted()');
            pcSubmenu = "clearWantedLvl";
            return;
        case 2:
            global.menu.execute('pc.openCar()');
            pcSubmenu = "checkNumber";
            return;
        case 3:
            global.menu.execute('pc.openPerson()');
            pcSubmenu = "checkPerson";
            return;
        case 4:
            mp.events.callRemote('checkWantedList');
            pcSubmenu = "wantedList";
            return;
        case 5:
            global.menu.execute('pc.hide()');
            global.menuClose()
            return;
    }
});
mp.events.add('pcMenuInput', (data) => {
    mp.events.callRemote(pcSubmenu, data);
});
mp.events.add("executeWantedList", (data) => {
    global.menu.execute(`pc.openWanted('${data}')`);
});
mp.events.add("executeCarInfo", (model, holder) => {
    global.menu.execute(`pc.openCar("${model}","${holder}")`);
});
mp.events.add("executePersonInfo", (name, lastname, uuid, gender, wantedlvl, lic) => {
    global.menu.execute(`pc.openPerson("${name}","${lastname}","${uuid}","${gender}","${wantedlvl}","${lic}")`);
});

mp.events.add("openPc", () => {
    if (global.menuCheck()) return;
    global.menu.execute('pc.show()')
    global.menuOpen()
});
mp.events.add("closePc", () => {
	if (global.menu !== null) {
		global.menu.execute('pc.hide()')
		global.menuClose();
	}
});
// DOCS //
mp.events.add('passport', (data) => {
	if (global.menu !== null) {
		global.menu.execute(`passport.set('${data}');`);
		if (global.menuCheck()) return;
		global.menu.execute('passport.show()');
		global.menuOpen();
	}
});
mp.events.add('licenses', (data) => {
    global.menu.execute(`license.set('${data}');`);
    if (global.menuCheck()) return;
    global.menu.execute('license.show()');
    global.menuOpen()
});
mp.events.add('dochide', () => {
    global.menuClose()
});

mp.events.add("showJobMenu", (level, currentjob) => {
    mp.gui.cursor.visible = true;
    menu.execute(`openWorks(${level},${currentjob});`);
});

mp.events.add("closeJobMenu", () => {
    mp.gui.cursor.visible = false;
    menu.execute(`jobselector.active=false;`);
});


mp.events.add("selectJob", (jobid) => {
	if (new Date().getTime() - global.lastCheck < 1000) return;
	global.lastCheck = new Date().getTime();
    mp.events.callRemote("jobjoin", jobid);
});

// SIMPLE MENU //
function openSM(type, data) {
    if (global.menuCheck()) return;
    global.menu.execute('menu.show()');
    switch (type) {
        //case 0: menu.execute(`openWorks(${data});`); break;
        case 1: menu.execute(`openShop('${data}');`); break;
        case 2: menu.execute(`openBlack('${data}');`); break;
        case 3: menu.execute(`openFib('${data}');`); break;
        case 4: menu.execute(`openLspd('${data}');`); break;
        case 5: menu.execute(`openArmy('${data}');`); break;
        case 6: menu.execute(`openGov('${data}');`); break;
        case 7: menu.execute(`openArmygun('${data}');`); break;
        case 8: menu.execute(`openGang('${data}');`); break;
        case 9: menu.execute(`openMafia('${data}');`); break;
        case 10: menu.execute(`openFishShop('${data}');`); break;
        case 11: menu.execute(`openSheriff('${data}');`); break;
    }
    global.menuOpen()
}
function closeSM() {
    global.menu.execute('menu.hide()')
    global.menuClose()
}
mp.events.add('smExit', () => {
    //mp.gui.chat.push('exit');
    closeSM();
});
mp.events.add('smOpen', (type, data) => {
    openSM(type, data);
});
mp.events.add('menu', (action, data) => {
    switch (action) {
        case "resign":
            mp.events.callRemote('jobjoin', -1);
            break;
        case "work":
            mp.events.callRemote('jobjoin', data);
            break;
        case "shop":
            mp.events.callRemote('shop', data);
            break;
        case "black":
            mp.events.callRemote('mavrbuy', data);
            break;
        case "fib":
            mp.events.callRemote('fbigun', data);
            break;
        case "lspd":
            mp.events.callRemote('lspdgun', data);
            break;
        case "army":
            mp.events.callRemote('armygun', data);
            break;
        case "gov":
            mp.events.callRemote('govgun', data);
            break;
        case "gang":
            mp.events.callRemote('gangmis', data);
            break;
        case "mafia":
            mp.events.callRemote('mafiamis', data);
            break;
		case "fishshop":
            mp.events.callRemote('fishshop', data);
            break;
        case "sheriff":
            mp.events.callRemote('sheriffgun', data);
           break;
    }
});
// SM DATA //
mp.events.add('policeg', () => {
    let data = [
        "Дубинка",
        "Пистолет",
        "SMG",
        "Дробовик",
        "Tazer",
        "Бронежилет",
        "Аптечка",
        "Пистолетный калибр x12",
        "Малый калибр x30",
        "Дробь x6",
    ];
    openSM(4, JSON.stringify(data));
});

mp.events.add('sheriffg', () => {
    let data = [
        "Дубинка",
        "Пистолет",
        "SMG",
        "Дробовик",
        "Tazer",
        "Бронежилет",
        "Аптечка",
        "Пистолетный калибр x12",
        "Малый калибр x30",
        "Дробь x6",
    ];
    openSM(4, JSON.stringify(data));
});

mp.events.add('fbiguns', () => {
    let data = [
        "Tazer",
        "Пистолет",
        "ПОС",
        "Карабин",
        "Снайперская винтовка",
        "Бронежилет",
        "Аптечка",
        "Пистолетный калибр x12",
        "Малый калибр x30",
        "Автоматный калибр x30",
        "Снайперский калибр x5",
        "Бейдж",
    ];
    openSM(3, JSON.stringify(data));
});
mp.events.add('govguns', () => {
    let data = [
        "Tazer",
        "Пистолет",
        "Advanced Rifle",
        "Gusenberg Sweeper",
        "Бронежилет",
        "Аптечка",
        "Пистолетный калибр x12",
        "Малый калибр x30",
        "Автоматный калибр x30",
    ];
    openSM(6, JSON.stringify(data));
});
mp.events.add('armyguns', () => {
    let data = [
        "Пистолет",
        "Карабин",
        "SMG",
        "Бронежилет",
        "Аптечка",
        "Пистолетный калибр x12",
        "Автоматный калибр x30",
        "SMG калибр x100",
    ];
    openSM(7, JSON.stringify(data));
});
mp.events.add('mavrshop', () => {
    let data = [
        ["Услуга по отмыву денег", ""],
        ["Дрель для взлома", "100000$"],
        ["Отмычка для замков", "600$"],
        ["Военная отмычка", "2500$"],
        ["Стяжки для рук", "2500$"],
        ["Мешок на голову", "2500$"],
        ["Понизить розыск", "3000$"],
        ["Бронежилет", "200000$"]
    ];
    openSM(2, JSON.stringify(data));
});
mp.events.add('gangmis', () => {
    let data = [
        "Угон автотранспорта",
        "Перевозка автотранспорта",
    ];
    openSM(8, JSON.stringify(data));
});
mp.events.add('mafiamis', () => {
    let data = [
        "Перевозка оружия",
        "Перевозка денег",
        "Перевозка трупов",
    ];
    openSM(9, JSON.stringify(data));
});
mp.events.add('shop', (json) => {
    let data = JSON.parse(json);
    openSM(1, JSON.stringify(data));
})
mp.events.add('fishshop', (json) => {
    let data = JSON.parse(json);
    global.openSM(10, JSON.stringify(data));
})
// ELEVATOR //
var liftcBack = "";
function openLift(type, cBack) {
    if (global.menuCheck()) return;
    let floors = [
        ["Гараж", "1 этаж", "49 этаж", "Крыша"]
    ];
    let json = JSON.stringify(floors[type]);
    global.menu.execute(`lift.set('${json}');lift.active=1;`);
    global.menuOpen();
    liftcBack = cBack;
}
function closeLift() {
    global.menuClose();
    global.menu.execute('lift.active=0;lift.reset();');
    liftcBack = "";
}
mp.events.add('openlift', (type, cBack) => {
    openLift(type, cBack);
})
mp.events.add('lift', (act, data) => {
    switch (act) {
        case "stop":
            closeLift();
            break;
        case "start":
            mp.events.callRemote(liftcBack, data);
            closeLift();
            break;
    }
});
// PETROL //
mp.events.add('petrol', (data) => {
    mp.events.callRemote('petrol', data);
    //
    global.menuClose();
    global.menu.execute('petrol.reset()');
});
mp.events.add('petrol.full', () => {
    mp.events.callRemote('petrol', 9999);
    //
    global.menuClose();
    global.menu.execute('petrol.reset()');
});
mp.events.add('petrol.gov', () => {
    mp.events.callRemote('petrol', 99999);
    //
    global.menuClose();
    global.menu.execute('petrol.reset()');
});
mp.events.add('openPetrol', () => {
    if (global.menuCheck()) return;
    global.menuOpen();
    global.menu.execute('petrol.active=1');
});
mp.events.add('closePetrol', () => {
    global.menuClose();
    global.menu.execute('petrol.reset()');
});

// FRACTION MENU //

mp.events.add('openfm', () => {
    if (global.menuCheck()) return;
    global.menuOpen();
    global.menu.execute('fmenu.active=1');
});

mp.events.add('setmem', (json, count, on, off) => {
    global.menu.execute(`fmenu.set('${json}',${count},${on},${off});`);
});

mp.events.add('closefm', () => {
    global.menuClose();
});

mp.events.add('fmenu', (act, data1, data2) => {
    mp.events.callRemote('fmenu', act, data1, data2);
    global.menuClose();
});

// MATS //
/*mp.keys.bind(0x78, false, function () { // F9
    mp.events.call('matsOpen', true);
});*/
mp.events.add('matsOpen', (isArmy, isMed) => {
    if (global.menuCheck()) return;
    global.menuOpen();
    global.menu.execute(`mats.show(${isArmy},${isMed})`);
});
mp.events.add('matsL', (act) => { //load
    global.menuClose();
    switch (act) {
        case 1:
            global.input.set("Загрузить маты", "Введите кол-во матов", 4, "loadmats");
            global.input.open();
            break;
        case 2:
            global.input.set("Загрузить маты", "Введите кол-во матов", 4, "loadmats");
            global.input.open();
            break;
        case 3:
            global.input.set("Загрузить наркоту", "Введите кол-во наркоты", 4, "loaddrugs");
            global.input.open();
            break;
        case 4:
            global.input.set("Загрузить аптечки", "Введите кол-во аптечек", 4, "loadmedkits");
            global.input.open();
            break;
    }
});
mp.events.add('matsU', (act) => { //unload
    global.menuClose();
    switch (act) {
        case 1:
            global.input.set("Выгрузить маты", "Введите кол-во матов", 4, "unloadmats");
            global.input.open();
            break;
        case 2:
            global.input.set("Выгрузить маты", "Введите кол-во матов", 4, "unloadmats");
            global.input.open();
            break;
        case 3:
            global.input.set("Выгрузить наркоту", "Введите кол-во наркоты", 4, "unloaddrugs");
            global.input.open();
            break;
        case 4:
            global.input.set("Выгрузить аптечки", "Введите кол-во аптечек", 4, "unloadmedkits");
            global.input.open();
            break;
    }
});
// BODY SEARCH //
/*mp.keys.bind(0x78, false, function () { // F9
    mp.events.call('bsearchOpen', '["FirstName LastName",["Deser Eaagle"],["Water","Keys for Car"]]');
});*/
mp.events.add('bsearch', (act) => {
    global.menuClose();
    switch (act) {
        case 1:
            mp.events.callRemote('pSelected', circleEntity, "Посмотреть лицензии");
            break;
        case 2:
            mp.events.callRemote('pSelected', circleEntity, "Посмотреть паспорт");
            break;
    }
});
mp.events.add('bsearchOpen', (data) => {
    if (global.menuCheck()) return;
    global.menuOpen();
    global.menu.execute(`bsearch.active=true`);
    global.menu.execute(`bsearch.set('${data}')`);
})
// BODY CUSTOM //
function getCameraOffset(pos, angle, dist) {
    //mp.gui.chat.push(`Sin: ${Math.sin(angle)} | Cos: ${Math.cos(angle)}`);

    angle = angle * 0.0174533;

    pos.y = pos.y + dist * Math.sin(angle);
    pos.x = pos.x + dist * Math.cos(angle);

    //mp.gui.chat.push(`X: ${pos.x} | Y: ${pos.y}`);

    return pos;
}
var bodyCamValues = {
    "hair": { Angle: 0, Dist: 0.5, Height: 0.7 },
    "beard": { Angle: 0, Dist: 0.5, Height: 0.7 },
    "eyebrows": { Angle: 0, Dist: 0.5, Height: 0.7 },
    "chesthair": { Angle: 0, Dist: 1, Height: 0.2 },
    "lenses": { Angle: 0, Dist: 0.5, Height: 0.7 },
    "lipstick": { Angle: 0, Dist: 0.5, Height: 0.7 },
    "blush": { Angle: 0, Dist: 0.5, Height: 0.7 },
    "makeup": { Angle: 0, Dist: 0.5, Height: 0.7 },

    "torso": [
        { Angle: 0, Dist: 1, Height: 0.2 },
        { Angle: 0, Dist: 1, Height: 0.2 },
        { Angle: 0, Dist: 1, Height: 0.2 },
        { Angle: 180, Dist: 1, Height: 0.2 },
        { Angle: 180, Dist: 1, Height: 0.2 },
        { Angle: 180, Dist: 1, Height: 0.2 },
        { Angle: 180, Dist: 1, Height: 0.2 },
        { Angle: 305, Dist: 1, Height: 0.2 },
        { Angle: 55, Dist: 1, Height: 0.2 },
    ],
    "head": [
        { Angle: 0, Dist: 1, Height: 0.5 },
        { Angle: 305, Dist: 1, Height: 0.5 },
        { Angle: 55, Dist: 1, Height: 0.5 },
        { Angle: 180, Dist: 1, Height: 0.5 },
        { Angle: 0, Dist: 0.5, Height: 0.5 },
        { Angle: 0, Dist: 0.5, Height: 0.5 },
    ],
    "leftarm": [
        { Angle: 55, Dist: 1, Height: 0.0 },
        { Angle: 55, Dist: 1, Height: 0.1 },
        { Angle: 55, Dist: 1, Height: 0.1 },
    ],
    "rightarm": [
        { Angle: 305, Dist: 1, Height: 0.0 },
        { Angle: 305, Dist: 1, Height: 0.1 },
        { Angle: 305, Dist: 1, Height: 0.1 },
    ],
    "leftleg": [
        { Angle: 55, Dist: 1, Height: -0.6 },
        { Angle: 55, Dist: 1, Height: -0.6 },
    ],
    "rightleg": [
        { Angle: 305, Dist: 1, Height: -0.6 },
        { Angle: 305, Dist: 1, Height: -0.6 },
    ],
};
global.bodyCam = null;
global.bodyCamStart = new mp.Vector3(0, 0, 0);

var tattooValues = [0, 0, 0, 0, 0, 0];
var tattooIds = ["torso", "head", "leftarm", "rightarm", "leftleg", "rightleg"];

var barberValues = {};
barberValues["hair"] = { Style: 0, Color: 0 };
barberValues["beard"] = { Style: 255, Color: 0 };
barberValues["eyebrows"] = { Style: 255, Color: 0 };
barberValues["chesthair"] = { Style: 255, Color: 0 };
barberValues["lenses"] = { Style: 0, Color: 0 };
barberValues["lipstick"] = { Style: 255, Color: 0 };
barberValues["blush"] = { Style: 255, Color: 0 };
barberValues["makeup"] = { Style: 255, Color: 0 };
var barberIds = ["hair", "beard", "eyebrows", "chesthair", "lenses", "lipstick", "blush", "makeup"];

mp.events.add('barber', (act, id, val) => {
	if(new Date().getTime() - global.lastCheck < 50) return; 
	global.lastCheck = new Date().getTime();
    switch (act) {
        case "buy":
            mp.events.callRemote("buyBarber", id, barberValues[id].Style, barberValues[id].Color);
            break;
        case "style":
            switch (id) {
                case "hair":
                    let gender = (localplayer.getVariable("GENDER")) ? 0 : 1;
                    barberValues["hair"].Style = hairIDList[gender][val];
                    localplayer.setComponentVariation(2, barberValues["hair"].Style, 0, 0);
                    localplayer.setHairColor(barberValues["hair"].Color, 0);
                    break;
                case "beard":
                    barberValues["beard"].Style = (val == 0) ? 255 : val - 1;
                    localplayer.setHeadOverlay(1, barberValues["beard"].Style, 100, barberValues["beard"].Color, barberValues["beard"].Color);
                    break;
                case "eyebrows":
                    barberValues["eyebrows"].Style = (val == 0) ? 255 : val - 1;
                    localplayer.setHeadOverlay(2, barberValues["eyebrows"].Style, 100, barberValues["eyebrows"].Color, barberValues["eyebrows"].Color);
                    break;
                case "chesthair":
                    barberValues["chesthair"].Style = (val == 0) ? 255 : val - 1;
                    localplayer.setHeadOverlay(10, barberValues["chesthair"].Style, 100, barberValues["chesthair"].Color, barberValues["chesthair"].Color);
                    break;
                case "lenses":
                    barberValues["lenses"].Style = val;
                    localplayer.setEyeColor(val);
                    break;
                case "lipstick":
                    barberValues["lipstick"].Style = (val == 0) ? 255 : val - 1;
                    localplayer.setHeadOverlay(8, barberValues["lipstick"].Style, 100, barberValues["lipstick"].Color, barberValues["lipstick"].Color);
                    break;
                case "blush":
                    barberValues["blush"].Style = (val == 0) ? 255 : val - 1;
                    localplayer.setHeadOverlay(5, barberValues["blush"].Style, 100, barberValues["blush"].Color, barberValues["blush"].Color);
                    break;
                case "makeup":
                    barberValues["makeup"].Style = (val == 0) ? 255 : val - 1;
                    localplayer.setHeadOverlay(4, barberValues["makeup"].Style, 100, barberValues["makeup"].Color, barberValues["makeup"].Color);
                    break;

            }

            const camValues = bodyCamValues[id];
            const camPos = getCameraOffset(new mp.Vector3(bodyCamStart.x, bodyCamStart.y, bodyCamStart.z + camValues.Height), localplayer.getRotation(2).z + 90 + camValues.Angle, camValues.Dist);

            bodyCam.setCoord(camPos.x, camPos.y, camPos.z);
            bodyCam.pointAtCoord(bodyCamStart.x, bodyCamStart.y, bodyCamStart.z + camValues.Height);
            break;
        case "color":
            switch (id) {
                case "hair":
                    barberValues["hair"].Color = val;
                    localplayer.setComponentVariation(2, barberValues["hair"].Style, 0, 0);
                    localplayer.setHairColor(barberValues["hair"].Color, 0);
                    break;
                case "beard":
                    barberValues["beard"].Color = val;
                    localplayer.setHeadOverlay(1, barberValues["beard"].Style, 100, barberValues["beard"].Color, barberValues["beard"].Color);
                    break;
                case "eyebrows":
                    barberValues["eyebrows"].Color = val;
                    localplayer.setHeadOverlay(2, barberValues["eyebrows"].Style, 100, barberValues["eyebrows"].Color, barberValues["eyebrows"].Color);
                    break;
                case "chesthair":
                    barberValues["chesthair"].Color = val;
                    localplayer.setHeadOverlay(10, barberValues["chesthair"].Style, 100, barberValues["chesthair"].Color, barberValues["chesthair"].Color);
                    break;
                case "lipstick":
                    barberValues["lipstick"].Color = val;
                    localplayer.setHeadOverlay(8, barberValues["lipstick"].Style, 100, barberValues["lipstick"].Color, barberValues["lipstick"].Color);
                    break;
                case "blush":
                    barberValues["blush"].Color = val;
                    localplayer.setHeadOverlay(5, barberValues["blush"].Style, 100, barberValues["blush"].Color, barberValues["blush"].Color);
                    break;
            }
            break;
    }
});
mp.events.add('tattoo', (act, id, val) => {
	if(new Date().getTime() - global.lastCheck < 50) return; 
	global.lastCheck = new Date().getTime();
    switch (act) {
        case "buy":
            mp.events.callRemote("buyTattoo", tattooIds.indexOf(id), tattooValues[tattooIds.indexOf(id)]);
            break;
        case "style":
            var tId = tattooIds.indexOf(id);
            tattooValues[tId] = val;

            const tattoo = tattoos[id][val];
            var hash = (localplayer.getVariable("GENDER")) ? tattoo.MaleHash : tattoo.FemaleHash;
            localplayer.clearDecorations();

            var playerTattoos = JSON.parse(localplayer.getVariable("TATTOOS"));
            for (let x = 0; x < playerTattoos[tId].length; x++) { // Очищаем ненужные татушки

                for (let i = 0; i < tattoo.Slots.length; i++) {

                    if (playerTattoos[tId][x].Slots.indexOf(tattoo.Slots[i]) != -1) {
                        playerTattoos[tId][x] = null;
                        break;
                    }

                }
            }

            for (let x = 0; x < 6; x++) // Восстанавливаем старые татуировки игрока, кроме тех, которые занимают очищенные слоты
                if (playerTattoos[x] != null)
                    for (let i = 0; i < playerTattoos[x].length; i++)
                        if (playerTattoos[x][i] != null)
                            localplayer.setDecoration(mp.game.joaat(playerTattoos[x][i].Dictionary), mp.game.joaat(playerTattoos[x][i].Hash));

            localplayer.setDecoration(mp.game.joaat(tattoo.Dictionary), mp.game.joaat(hash)); // Ну и применяем выбранную татуировку

            const camValues = bodyCamValues[id][tattoo.Slots[0]];
            const camPos = getCameraOffset(new mp.Vector3(bodyCamStart.x, bodyCamStart.y, bodyCamStart.z + camValues.Height), localplayer.getRotation(2).z + 90 + camValues.Angle, camValues.Dist);

            bodyCam.setCoord(camPos.x, camPos.y, camPos.z);
            bodyCam.pointAtCoord(bodyCamStart.x, bodyCamStart.y, bodyCamStart.z + camValues.Height);
            break;
    }
});
mp.events.add('openBody', (isBarber, price) => {
    if (global.menuCheck()) return;

    if (isBarber) {
        barberValues["hair"] = { Style: 0, Color: 0 };
        barberValues["beard"] = { Style: 255, Color: 0 };
        barberValues["eyebrows"] = { Style: 255, Color: 0 };
        barberValues["chesthair"] = { Style: 255, Color: 0 };
        barberValues["lenses"] = { Style: 0, Color: 0 };
        barberValues["lipstick"] = { Style: 255, Color: 0 };
        barberValues["blush"] = { Style: 255, Color: 0 };
        barberValues["makeup"] = { Style: 255, Color: 0 };

        for (let i = 0; i < 8; i++) {
            let id = barberIds[i];
            let bizBarberPrices = [];
            let barberSkip = [];

            for (let x = 0; x < barberPrices[id].length; x++) {
                let tempPrice = barberPrices[id][x] / 100 * price;
                bizBarberPrices[x] = tempPrice.toFixed();
            }

            mp.events.call('setBody', id, JSON.stringify(bizBarberPrices), JSON.stringify(barberSkip));
        }

        bodyCamStart = localplayer.position;
    }
    else {
        tattooValues = [0, 0, 0, 0, 0, 0];

        let gender = localplayer.getVariable("GENDER");

        for (let i = 0; i < 6; i++) {
            let id = tattooIds[i];

            let tattooPrices = [];
            let tattooSkips = [];

            for (let x = 0; x < tattoos[id].length; x++) {
                let tempPrice = tattoos[id][x].Price / 100 * price;
                tattooPrices[x] = tempPrice.toFixed();

                let hash = (gender) ? tattoos[id][x].MaleHash : tattoos[id][x].FemaleHash;
                if (hash == "") tattooSkips.push(x);
            }

            bodyCamStart = new mp.Vector3(324.9798, 180.6418, 103.6665);

            mp.events.call('setBody', id, JSON.stringify(tattooPrices), JSON.stringify(tattooSkips));
        }
    }

    var camValues = (isBarber) ? bodyCamValues['hair'] : bodyCamValues['torso'][0];
    var pos = getCameraOffset(new mp.Vector3(bodyCamStart.x, bodyCamStart.y, bodyCamStart.z + camValues.Height), localplayer.getRotation(2).z + 90 + camValues.Angle, camValues.Dist);
    bodyCam = mp.cameras.new('default', pos, new mp.Vector3(0, 0, 0), 50);
    bodyCam.pointAtCoord(bodyCamStart.x, bodyCamStart.y, bodyCamStart.z + camValues.Height);
    bodyCam.setActive(true);
    mp.game.cam.renderScriptCams(true, false, 500, true, false);

    global.menuOpen();
    global.menu.execute(`body.isBarber=${isBarber}`);
    global.menu.execute(`body.active=true`);

    mp.events.call('camMenu', true);
})
mp.events.add('closeBody', () => {
	if(new Date().getTime() - global.lastCheck < 50) return; 
	global.lastCheck = new Date().getTime();
    global.menuClose();

    bodyCam.destroy();
    mp.game.cam.renderScriptCams(false, false, 500, true, false);

    localplayer.clearDecorations();
    mp.events.callRemote("cancelBody");

    mp.events.call('camMenu', false);
})
mp.events.add('setBody', (id, data1, data2) => {
    global.menu.execute(`body.set('${id}','${data1}','${data2}')`)
})
// AUTO SHOP //
/*mp.keys.bind(0x78, false, function () { // F9
    setAuto('models', JSON.stringify(autoData.testModels));
    setAuto('colors', JSON.stringify(autoData.testColors));
    setAuto('prices', JSON.stringify(autoData.testPrices));
    mp.events.call('openAuto');
});*/

let autoColors = ["Черный", "Белый", "Красный", "Оранжевый", "Желтый", "Зеленый", "Голубой", "Синий", "Фиолетовый"];
let autoModels = null;

let colors = {};
colors["Черный"] = [0, 0, 0];
colors["Белый"] = [225, 225, 225];
colors["Красный"] = [230, 0, 0];
colors["Оранжевый"] = [255, 115, 0];
colors["Желтый"] = [240, 240, 0];
colors["Зеленый"] = [0, 230, 0];
colors["Голубой"] = [0, 205, 255];
colors["Синий"] = [0, 0, 230];
colors["Фиолетовый"] = [190, 60, 165];

let auto = {
    model: null,
    color: null,
    entity: null,
}
const cameraRotator = require("cef/js/vie.js");

/*var vehCamPosition = new mp.Vector3(-42.3758, -1101.672, 26.42235);
var vehCamRotation = new mp.Vector3(0, 0, 1.701622);
var vehPosition = new mp.Vector3(-42.79771, -1095.676, 26.0117);
var vehRotation = new mp.Vector3(0, 0, -136.246);*/

function createCam(x, y, z, rx, ry, rz, viewangle) {
    // camera = mp.cameras.new("Cam", {x, y, z}, {x: rx, y: ry, z: rz}, viewangle);
    camera = mp.cameras.new("default");
    camera.setCoord(x, y, z);
    camera.setRot(rx, ry, rz, 2);
    camera.setFov(viewangle);
    camera.setActive(true);

    var vehPosition = new mp.Vector3(-42.79771, -1095.676, 26.0117); // спавн авто
    cameraRotator.start(camera, vehPosition, vehPosition, new mp.Vector3(-3.0, 3.5, 0.5), 180);
    cameraRotator.setZBound(-0.8, 1.8);
    cameraRotator.setZUpMultipler(5);
    cameraRotator.pause(true);

    mp.game.cam.renderScriptCams(true, false, 3000, true, false);
}

mp.events.add('auto', (act, value) => {
    switch (act) {
        case "model":
            auto.model = autoModels[value];
            auto.entity.model = mp.game.joaat(autoModels[value]);

            auto.entity.setCustomPrimaryColour(colors[auto.color][0], colors[auto.color][1], colors[auto.color][2]);
            auto.entity.setCustomSecondaryColour(colors[auto.color][0], colors[auto.color][1], colors[auto.color][2])
            auto.entity.setRotation(0, 0, -136.246, 2, true);
            break;
        case "color":
            auto.color = autoColors[value];

            auto.entity.setCustomPrimaryColour(colors[autoColors[value]][0], colors[autoColors[value]][1], colors[autoColors[value]][2]);
            auto.entity.setCustomSecondaryColour(colors[autoColors[value]][0], colors[autoColors[value]][1], colors[autoColors[value]][2])
            break;
    }
});
mp.events.add('buyAuto', () => {
	if(new Date().getTime() - global.lastCheck < 50) return; 
	global.lastCheck = new Date().getTime();
    //mp.gui.chat.push('auto buy');

    global.menuClose();
    global.menu.execute('auto.active=0');

    mp.events.callRemote('carroomBuy', auto.model, auto.color);

    if (auto.entity == null) return;
    auto.entity.destroy();
    auto.entity = null;
})
mp.events.add('testdriveAuto', (model, value) => {
    if(new Date().getTime() - global.lastCheck < 50) return; 
    global.lastCheck = new Date().getTime();

    global.menuClose();
    global.menu.execute('auto.active=0');

    mp.events.callRemote('carroomTestDrive', auto.model, colors[autoColors[value]][0], colors[autoColors[value]][1], colors[autoColors[value]][2]);

    if (auto.entity == null) return;
    auto.entity.destroy();
    auto.entity = null;
})
mp.events.add('closeAuto', () => {
	if(new Date().getTime() - global.lastCheck < 50) return; 
	global.lastCheck = new Date().getTime();
    global.menuClose();
    global.menu.execute('auto.active=0');

    mp.events.callRemote('carroomCancel');

    if (auto.entity == null) return;
    auto.entity.destroy();
    auto.entity = null;

	cameraRotator.stop();
})
mp.events.add('openAuto', (models, prices) => {
    if (global.menuCheck()) return;
    autoModels = JSON.parse(models);

    // Подгружаем реальные названия авто
    let autoNames = [];
    autoModels.forEach(model => {
        autoNames.push(vehicleNames.get(model) || "none")
    });
    //

    setAuto('models', models);
    setAuto('modelsName', JSON.stringify(autoNames));
    setAuto('colors', JSON.stringify(autoColors));
    setAuto('prices', prices);

    createCam(-42.3758, -1101.672, 26.42235, 0, 0, 1.701622, 50); // координаты камеры и ротация
    cameraRotator.pause(false);

    // Создание авто в автосалоне
    auto.entity = mp.vehicles.new(mp.game.joaat(autoModels[0]), new mp.Vector3(-42.79771, -1095.676, 26.0117),
    {
        heading: -136.246,
        numberPlate: 'CARROOM',
        alpha: 255,
        color: [[0, 0, 0], [0, 0, 0]],
        locked: false,
        engine: false,
        dimension: localplayer.dimension
    });
    auto.entity.setRotation(0, 0, -136.246, 2, true);
    auto.color = "Черный";
    auto.model = autoModels[0];
    //

    global.menuOpen();
    global.menu.execute(`auto.active=true`);

    // donate-carroom check
    mp.console.logWarning("CARROOM-DONATE: " + localplayer.getVariable('CARROOM-DONATE'), true, true);
    if(localplayer.getVariable('CARROOM-DONATE')) global.menu.execute('auto.donate=true');
    else global.menu.execute('auto.donate=false');
    //
    
});
//types: models, colors, prices
function setAuto(type, jsonstr) {
    global.menu.execute(`auto.${type}=${jsonstr}`);
}
// PETSHOP

let petModels = null;
let petHashes = null;

let pet = {
    model: null,
    entity: null,
	dimension: 0,
}

function setPet(type, jsonstr) {
    global.menu.execute(`petshop.${type}=${jsonstr}`);
}
mp.events.add('petshop', (act, value) => {
    switch (act) {
        case "model":
            pet.model = petModels[value];
			if(pet.entity != null) {
				pet.entity.destroy();
				pet.entity = mp.peds.new(petHashes[value], new mp.Vector3(-758.2859, 320.9569, 175.2784), 218.8, pet.dimension);
			}
            break;
    }
});
mp.events.add('buyPet', () => {
	if(new Date().getTime() - global.lastCheck < 50) return; 
	global.lastCheck = new Date().getTime();

    global.menuClose();
    global.menu.execute('petshop.active=0');

    mp.events.callRemote('petshopBuy', pet.model);

    if (pet.entity == null) return;
    pet.entity.destroy();
    pet.entity = null;
})
mp.events.add('closePetshop', () => {
	if(new Date().getTime() - global.lastCheck < 50) return; 
	global.lastCheck = new Date().getTime();
    global.menuClose();
    global.menu.execute('petshop.active=0');

    mp.events.callRemote('petshopCancel');

    if (pet.entity == null) return;
    pet.entity.destroy();
    pet.entity = null;
})
mp.events.add('openPetshop', (models, hashes, prices, dim) => {
    if (global.menuCheck()) return;
	
    petModels = JSON.parse(models);
	petHashes = JSON.parse(hashes);

    setPet('models', models);
	setPet('hashes', hashes);
    setPet('prices', prices);
	
	pet.entity = mp.peds.new(petHashes[0], new mp.Vector3(-758.2859, 320.9569, 175.2784), 218.8, dim);
	pet.dimension = dim;
	localplayer.setRotation(0, 0, 0, 2, true);
    pet.model = petModels[0];

    global.menuOpen();
    global.menu.execute(`petshop.active=true`);
	
	cam = mp.cameras.new('default', new mp.Vector3(-755.5227, 320.0132, 177.302), new mp.Vector3(0, 0, 0), 50);
    cam.pointAtCoord(-758.2859, 320.9569, 175.7484);
    cam.setActive(true);
    mp.game.cam.renderScriptCams(true, false, 0, true, false);
})
//
//types: models, colors, prices
function setAuto(type, jsonstr) {
    global.menu.execute(`auto.${type}=${jsonstr}`);
}
// WEAPON SHOP //
/*mp.keys.bind(0x78, false, function () { // F9
    mp.events.call('openWShop', 0, '[[0,1,0,1,0,1,0]]');
});*/
let wshop = {
    lid: -1,
    tab: 0,
    data: [],
}
mp.events.add('wshop', (act, value, sub) => {
	if(new Date().getTime() - global.lastCheck < 50) return; 
	global.lastCheck = new Date().getTime();
    switch (act) {
        case "cat":
            if (value == 4) return;
            wshop.tab = value;
            global.menu.execute(`wshop.set(${value},'${JSON.stringify(wshop.data[value])}')`);
            break;
        case "buy":
            mp.events.callRemote('wshop', wshop.tab, value);
            break;
        case "rangebuy":
			mp.events.callRemote('wshopammo', value, sub);
			break;
    }
})
mp.events.add('closeWShop', () => {
    global.menuClose();
    wshop.tab = 0;
})
mp.events.add('openWShop', (id, json) => {
    if (global.menuCheck()) return;
    global.menuOpen();
    if (id !== wshop.lid) wshop.data = JSON.parse(json);
    global.menu.execute(`wshop.set(0,'${JSON.stringify(wshop.data[0])}')`);
    global.menu.execute('wshop.active=1');
    wshop.lid = id;
})
// WEAPON CRAFT //
/*mp.keys.bind(0x78, false, function () { // F9
    mp.events.call('openWCraft', 0, '[[0,1,0,1,0,1,0]]');
});*/
let wcraft = {
    tab: 0,
    frac: 0,
    data: [],
}
mp.events.add('wcraft', (act, value, sub) => {
    switch (act) {
        case "cat":
            wcraft.tab = value;
            global.menu.execute(`wcraft.set(${wcraft.frac},${value},'${JSON.stringify(wcraft.data[value])}')`);
            break;
        case "buy":
            mp.events.callRemote('wcraft', wcraft.frac, wcraft.tab, value);
            break;
        case "rangebuy":
			mp.events.callRemote('wcraftammo', wcraft.frac, value, sub);
			break;
    }
})
mp.events.add('closeWCraft', () => {
    global.menuClose();
    wcraft.top = 0;
})
mp.events.add('openWCraft', (frac, json) => {
    //mp.gui.chat.push(`${frac}:${json}`);
    wcraft.data = JSON.parse(json);
    wcraft.data[4] = [];
    wcraft.frac = frac;
    global.menu.execute(`wcraft.set(${frac}, 0,'${JSON.stringify(wcraft.data[0])}')`);
    global.menu.execute('wcraft.active=1');
    global.menuOpen();
})
// CAM //
global.camMenu = false;
var camMenuCEF = mp.browsers.new('package://cef/cam.html');
var camMenuValues = { Angle: 0, Dist: 1, Height: 0 };

mp.events.add('camMenu', (status) => {
    global.camMenu = status;
    if (global.camMenu) {
        //camMenuValues = { Angle: 0, Dist: 1, Height: 0 };
        camMenuCEF.execute('show()');
    } else {
        camMenuCEF.execute('hide()');
    }
})
mp.events.add('camCB', (act, val) => {
    switch (act) {
        case "rotate":
            camMenuValues.Angle = val;
            break;
        case "height":
            camMenuValues.Height = val;
            break;
        case "depth":
            camMenuValues.Dist = val;
            break;
    }
    const camPos = getCameraOffset(new mp.Vector3(bodyCamStart.x, bodyCamStart.y, bodyCamStart.z + camMenuValues.Height), localplayer.getRotation(2).z + 90 + camMenuValues.Angle, camMenuValues.Dist);

    bodyCam.setCoord(camPos.x, camPos.y, camPos.z);
    bodyCam.pointAtCoord(bodyCamStart.x, bodyCamStart.y, bodyCamStart.z + camMenuValues.Height);
})
// Clothes Shop //
/*mp.keys.bind(0x78, false, function () { // F9
    setClothes('styles', JSON.stringify(["Style1","Style2","Style3"]));
    setClothes('colors', JSON.stringify(["Color1", "Color2", "Color3"]));
    setClothes('prices', JSON.stringify([9, 99, 999]));
    mp.events.call('openClothes');
});*/

var clothesCamValues = [
    { Angle: 0, Dist: 0.7, Height: 0.6 },
    { Angle: 0, Dist: 1.4, Height: 0.2 },
    { Angle: 0, Dist: 1.4, Height: 0.2 },
    { Angle: 0, Dist: 1.4, Height: -0.4 },
    { Angle: 0, Dist: 1.2, Height: -0.7 },
    { Angle: 0, Dist: 1, Height: -0.2 },
    { Angle: 74, Dist: 1, Height: 0 },
    { Angle: 0, Dist: 0.7, Height: 0.6 },
    { Angle: 0, Dist: 1, Height: 0.3 },
];
let clothes = {
    type: 0,
    style: 0,
    color: 0,
    colors: [0, 0, 0],
    price: 0,
}
mp.events.add('clothes', (act, value) => {
    const gender = (localplayer.getVariable("GENDER")) ? 1 : 0;

    switch (act) {
        case "style":
            //mp.gui.chat.push('clothes style' + value);

            switch (clothes.type) {
                case 0:
                    var colors = clothesHats[gender][value].Colors;
                    setClothes("colors", JSON.stringify(colors));

                    clothes.style = clothesHats[gender][value].Variation;
                    clothes.color = colors[0];
                    clothes.colors = colors;

                    localplayer.setPropIndex(0, clothes.style, clothes.color, true);
                    return;
                case 1:
                    var colors = clothesTops[gender][value].Colors;
                    setClothes("colors", JSON.stringify(colors));

                    clothes.style = clothesTops[gender][value].Variation;
                    clothes.color = colors[0];
                    clothes.colors = colors;

                    localplayer.setComponentVariation(11, clothes.style, clothes.color, 0);
                    localplayer.setComponentVariation(3, validTorsos[gender][clothes.style], 0, 0);
                    return;
                case 2:
                    var colors = clothesUnderwears[gender][value].Colors;
                    setClothes("colors", JSON.stringify(colors));

                    clothes.style = clothesUnderwears[gender][value].Top;
                    clothes.color = colors[0];
                    clothes.colors = colors;

                    localplayer.setComponentVariation(11, clothes.style, clothes.color, 0);
                    localplayer.setComponentVariation(3, validTorsos[gender][clothes.style], 0, 0);
                    return;
                case 3:
                    var colors = clothesLegs[gender][value].Colors;
                    setClothes("colors", JSON.stringify(colors));

                    clothes.style = clothesLegs[gender][value].Variation;
                    clothes.color = colors[0];
                    clothes.colors = colors;

                    localplayer.setComponentVariation(4, clothes.style, clothes.color, 0);
                    return;
                case 4:
                    var colors = clothesFeets[gender][value].Colors;
                    setClothes("colors", JSON.stringify(colors));

                    clothes.style = clothesFeets[gender][value].Variation;
                    clothes.color = colors[0];
                    clothes.colors = colors;

                    localplayer.setComponentVariation(6, clothes.style, clothes.color, 0);
                    return;
                case 5:
                    var colors = clothesGloves[gender][value].Colors;
                    setClothes("colors", JSON.stringify(colors));

                    clothes.style = clothesGloves[gender][value].Variation;
                    clothes.color = colors[0];
                    clothes.colors = colors;

                    localplayer.setComponentVariation(3, correctGloves[gender][clothes.style][15], clothes.color, 0);
                    return;
                case 6:
                    var colors = clothesWatches[gender][value].Colors;
                    setClothes("colors", JSON.stringify(colors));

                    clothes.style = clothesWatches[gender][value].Variation;
                    clothes.color = colors[0];
                    clothes.colors = colors;

                    localplayer.setPropIndex(6, clothes.style, clothes.color, true);
                    return;
                case 7:
                    var colors = clothesGlasses[gender][value].Colors;
                    setClothes("colors", JSON.stringify(colors));

                    clothes.style = clothesGlasses[gender][value].Variation;
                    clothes.color = colors[0];
                    clothes.colors = colors;

                    localplayer.setPropIndex(1, clothes.style, clothes.color, true);
                    return;
                case 8:
                    var colors = clothesJewerly[gender][value].Colors;
                    setClothes("colors", JSON.stringify(colors));

                    clothes.style = clothesJewerly[gender][value].Variation;
                    clothes.color = colors[0];
                    clothes.colors = colors;

                    localplayer.setComponentVariation(7, clothes.style, clothes.color, 0);
                    return;
            }
            break;
        case "color":
            //mp.gui.chat.push('clothes color' + value);

            switch (clothes.type) {
                case 0:
                    clothes.color = clothes.colors[value];
                    localplayer.setPropIndex(0, clothes.style, clothes.color, true);
                    return;
                case 1:
                    clothes.color = clothes.colors[value];
                    localplayer.setComponentVariation(11, clothes.style, clothes.color, 0);
                    return;
                case 2:
                    clothes.color = clothes.colors[value];
                    localplayer.setComponentVariation(11, clothes.style, clothes.color, 0);
                    return;
                case 3:
                    clothes.color = clothes.colors[value];
                    localplayer.setComponentVariation(4, clothes.style, clothes.color, 0);
                    return;
                case 4:
                    clothes.color = clothes.colors[value];
                    localplayer.setComponentVariation(6, clothes.style, clothes.color, 0);
                    return;
                case 5:
                    clothes.color = clothes.colors[value];
                    localplayer.setComponentVariation(3, correctGloves[gender][clothes.style][15], clothes.color, 0);
                    return;
                case 6:
                    clothes.color = clothes.colors[value];
                    localplayer.setPropIndex(6, clothes.style, clothes.color, true);
                    return;
                case 7:
                    clothes.color = clothes.colors[value];
                    localplayer.setPropIndex(1, clothes.style, clothes.color, true);
                    return;
                case 8:
                    clothes.color = clothes.colors[value];
                    localplayer.setComponentVariation(7, clothes.style, clothes.color, 0);
                    return;
            }
            break;
        case "cat": //category
            //some shit with 0-4 ids
            //clearClothes();

            var clothesArr = {};
            if (value == 0) clothesArr = clothesHats[gender];
            else if (value == 1) clothesArr = clothesTops[gender];
            else if (value == 2) clothesArr = clothesUnderwears[gender];
            else if (value == 3) clothesArr = clothesLegs[gender];
            else if (value == 4) clothesArr = clothesFeets[gender];
            else if (value == 5) clothesArr = clothesGloves[gender];
            else if (value == 6) clothesArr = clothesWatches[gender];
            else if (value == 7) clothesArr = clothesGlasses[gender];
            else if (value == 8) clothesArr = clothesJewerly[gender];

            var styles = [];
            var prices = [];
            var colors = clothesArr[0].Colors;

            clothesArr.forEach(item => {
                let tempPrice = item.Price / 100 * clothes.price;
                prices.push(tempPrice.toFixed());

                if (value == 2) 
                    styles.push(item.Top)
                else 
                    styles.push(item.Variation)
            });

            setClothes("styles", JSON.stringify(styles));
            setClothes("colors", JSON.stringify(colors));
            setClothes("prices", JSON.stringify(prices));

            clothes.type = value;
            clothes.style = styles[0];
            clothes.color = colors[0];
            clothes.colors = colors;

            if (value == 0) {
                localplayer.setPropIndex(0, clothes.style, clothes.color, true);
            }
            else if (value == 1 || value == 2) {
                localplayer.setComponentVariation(11, clothes.style, clothes.color, 0);
                localplayer.setComponentVariation(3, validTorsos[gender][clothes.style], 0, 0);
            }
            else if (value == 3) {
                localplayer.setComponentVariation(4, clothes.style, clothes.color, 0);
            }
            else if (value == 4) {
                localplayer.setComponentVariation(6, clothes.style, clothes.color, 0);
            }
            else if (value == 5) {
                localplayer.setComponentVariation(3, correctGloves[gender][clothes.style][15], clothes.color, 0);
            }
            else if (value == 6) {
                localplayer.setPropIndex(6, clothes.style, clothes.color, true);
            }
            else if (value == 7) {
                localplayer.setPropIndex(1, clothes.style, clothes.color, true);
            }
            else if (value == 8) {
                localplayer.setComponentVariation(7, clothes.style, clothes.color, 0);
            }

            const camValues = clothesCamValues[value];
            const camPos = getCameraOffset(new mp.Vector3(bodyCamStart.x, bodyCamStart.y, bodyCamStart.z + camValues.Height), localplayer.getRotation(2).z + 90 + camValues.Angle, camValues.Dist);

            bodyCam.setCoord(camPos.x, camPos.y, camPos.z);
            bodyCam.pointAtCoord(bodyCamStart.x, bodyCamStart.y, bodyCamStart.z + camValues.Height);
            break;
    }
});
mp.events.add('buyClothes', () => {
    mp.events.callRemote('buyClothes', clothes.type, clothes.style, clothes.color);
})
mp.events.add('closeClothes', () => {
	if(new Date().getTime() - global.lastCheck < 50) return; 
	global.lastCheck = new Date().getTime();
    global.menuClose();
    global.menu.execute('clothes.active=0');

    mp.events.call('camMenu', false);

    bodyCam.destroy();
    mp.game.cam.renderScriptCams(false, false, 500, true, false);

    mp.events.callRemote('cancelClothes');
})
mp.events.add('openClothes', (price) => {
    if (global.menuCheck()) return;

    bodyCamStart = localplayer.position;
    var camValues = { Angle: localplayer.getRotation(2).z + 90, Dist: 1.3, Height: 0.3 };
    var pos = getCameraOffset(new mp.Vector3(bodyCamStart.x, bodyCamStart.y, bodyCamStart.z + camValues.Height), camValues.Angle, camValues.Dist);
    bodyCam = mp.cameras.new('default', pos, new mp.Vector3(0, 0, 0), 50);
    bodyCam.pointAtCoord(bodyCamStart.x, bodyCamStart.y, bodyCamStart.z + camValues.Height);
    bodyCam.setActive(true);
    mp.game.cam.renderScriptCams(true, false, 500, true, false);

    const gender = (localplayer.getVariable("GENDER")) ? 1 : 0;

    var styles = [];
    var prices = [];
    var colors = clothesHats[gender][0].Colors;

    clothesHats[gender].forEach(hat => {
        let tempPrice = hat.Price / 100 * price;
        prices.push(tempPrice.toFixed());

        styles.push(hat.Variation)
    });

    setClothes("styles", JSON.stringify(styles));
    setClothes("colors", JSON.stringify(colors));
    setClothes("prices", JSON.stringify(prices));

    clothes = {
        type: 0,
        style: styles[0],
        color: colors[0],
        colors: colors,
        price: price,
    }

    clearClothes();

    global.menuOpen();
    global.menu.execute(`clothes.active=true`);

    mp.events.call('camMenu', true);
})

function clearClothes() {
    const gender = (localplayer.getVariable("GENDER")) ? 1 : 0;

    localplayer.clearProp(0);
    localplayer.clearProp(1);
    localplayer.clearProp(2);
    localplayer.clearProp(6);
    localplayer.clearProp(7);

    localplayer.setComponentVariation(1, clothesEmpty[gender][1], 0, 0);
    localplayer.setComponentVariation(3, clothesEmpty[gender][3], 0, 0);
    localplayer.setComponentVariation(4, clothesEmpty[gender][4], 0, 0);
    localplayer.setComponentVariation(5, clothesEmpty[gender][5], 0, 0);
    localplayer.setComponentVariation(6, clothesEmpty[gender][6], 0, 0);
    localplayer.setComponentVariation(7, clothesEmpty[gender][7], 0, 0);
    localplayer.setComponentVariation(8, clothesEmpty[gender][8], 0, 0);
    localplayer.setComponentVariation(9, clothesEmpty[gender][9], 0, 0);
    localplayer.setComponentVariation(10, clothesEmpty[gender][10], 0, 0);
    localplayer.setComponentVariation(11, clothesEmpty[gender][11], 0, 0);
}
//types: styles, colors, prices
function setClothes(type, jsonstr) {
    global.menu.execute(`clothes.${type}=${jsonstr}`);
    if (type == 'colors') global.menu.execute(`clothes.indexC=0`);
    else if (type == 'styles') global.menu.execute(`clothes.indexS=0`);
}

mp.events.add('closeMasks', () => {
	if(new Date().getTime() - global.lastCheck < 50) return; 
	global.lastCheck = new Date().getTime();
    global.menuClose();
    global.menu.execute('masks.active=0');

    mp.events.call('camMenu', false);

    bodyCam.destroy();
    mp.game.cam.renderScriptCams(false, false, 500, true, false);

    mp.events.callRemote('cancelMasks');
})
mp.events.add('masks', (act, value) => {
    switch (act) {
        case "style":
            var colors = clothesMasks[value].Colors;
            setMaskCEF("colors", JSON.stringify(colors));

            clothes.style = clothesMasks[value].Variation;
            clothes.color = colors[0];
            clothes.colors = colors;

            localplayer.setComponentVariation(1, clothes.style, clothes.color, 0);
            return;
        case "color":
            clothes.color = clothes.colors[value];
            localplayer.setComponentVariation(1, clothes.style, clothes.color, 0);
            return;
    }
})
mp.events.add('buyMasks', () => {
	if(new Date().getTime() - global.lastCheck < 50) return; 
	global.lastCheck = new Date().getTime();
    mp.events.callRemote('buyMasks', clothes.style, clothes.color);
})
mp.events.add('openMasks', (price) => {
    if (global.menuCheck()) return;

    bodyCamStart = localplayer.position;
    var camValues = { Angle: localplayer.getRotation(2).z + 90, Dist: 0.7, Height: 0.6 };
    var pos = getCameraOffset(new mp.Vector3(bodyCamStart.x, bodyCamStart.y, bodyCamStart.z + camValues.Height), camValues.Angle, camValues.Dist);
    bodyCam = mp.cameras.new('default', pos, new mp.Vector3(0, 0, 0), 50);
    bodyCam.pointAtCoord(bodyCamStart.x, bodyCamStart.y, bodyCamStart.z + camValues.Height);
    bodyCam.setActive(true);
    mp.game.cam.renderScriptCams(true, false, 500, true, false);

    var styles = [];
    var prices = [];
    var colors = clothesMasks[0].Colors;

    clothesMasks.forEach(mask => {
        let tempPrice = mask.Price / 100 * price;
        prices.push(tempPrice.toFixed());

        styles.push(mask.Variation)
    });

    setMaskCEF("styles", JSON.stringify(styles));
    setMaskCEF("colors", JSON.stringify(colors));
    setMaskCEF("prices", JSON.stringify(prices));

    clothes = {
        type: 0,
        style: styles[0],
        color: colors[0],
        colors: colors,
        price: price,
    }

    localplayer.setComponentVariation(1, styles[0], colors[0], 0);

    global.menuOpen();
    global.menu.execute(`masks.active=true`);

    mp.events.call('camMenu', true);

    localplayer.clearProp(0);
    localplayer.clearProp(1);
})

function setMaskCEF(type, jsonstr) {
    global.menu.execute(`masks.${type}=${jsonstr}`);
    if (type == 'colors') global.menu.execute(`masks.indexC=0`);
    else if (type == 'styles') global.menu.execute(`masks.indexS=0`);
}
// INFOBOX //
/*mp.keys.bind(0x79, false, function () { // F10
    mp.events.call('ib-open', "Помощь", 0);
});*/
mp.events.add('ib-exit', () => {
    global.menuClose();
})
mp.events.add('ib-open', (head, id) => {
    if (global.menuCheck()) return;
    global.menuOpen();

    menu.execute(`infobox.set('${head}',${id})`);
})
// DONATE //
var reds = 0;
var donateOpened = false;
mp.keys.bind(0x78, false, function () { // F9
    if (!global.loggedin) return;

    if (global.menuCheck()) {
        if (donateOpened) {
            global.menuClose();
            menu.execute(`donate.close()`);
            donateOpened = false;
        }
	} else {
        global.menuOpen();
        donateOpened = true;
        menu.execute(`donate.show(${reds})`);
	}
});
mp.events.add('donbuy', (id, data) => {
	global.menuClose();
	menu.execute(`donate.close()`);
    mp.events.callRemote("donate", id, data);
});
mp.events.add('redset', (reds_) => {
    reds = reds_;
    if (menu != null)
        menu.execute(`donate.balance=${reds}`);
});
// Help Menu //
var helpMenuState = false;
mp.keys.bind(0x79, false, function () { // F10
	if(!helpMenuState && global.menuCheck()) return;
    helpMenuState = !helpMenuState;
	if(helpMenuState) global.menuOpen();
	else global.menuClose();
    global.helpmenu.execute(`hhelpshow(${helpMenuState})`);
    mp.gui.cursor.visible = helpMenuState;
});
mp.events.add('helpOnline', () => {
    //
})
mp.events.add('helpClose', () => {
    helpMenuState = false;
	global.menuClose();
    mp.gui.cursor.visible = false;
})
// Color picker //
global.colorp = mp.browsers.new('package://cef/color.html');
mp.events.add('showColorp', () => {
    global.colorp.execute(`show(${true})`);
})
mp.events.add('hideColorp', () => {
    global.colorp.execute(`show(${false})`);
})
// Button events
mp.events.add('colors', (btn) => {
    switch (btn) {
        case "apply":
            //onapply
            break;
        case "cancel":
            //onbreak
            break;
    }
})
// Selected color event
mp.events.add('scolor', (c) => {
    // JSON String
    // c = {r: 255, g: 255, b: 255}
    c = JSON.parse(c);
    mp.events.call("tunColor", c)
})

// Report menu
var report = mp.browsers.new('package://cef/ticket.html');
var reportactive = false;
mp.events.add('addreport', (id_, author_, quest_) => {
    report.execute(`addReport(${id_},'${author_}','${quest_}', false, '')`);
    mp.events.call('notify', 0, 2, "Пришел новый репорт!", 3000);
})
mp.events.add('setreport', (id, name) => {
    report.execute(`setStatus(${id}, '${name}')`);
})
mp.events.add('delreport', (id) => {
    report.execute(`deleteReport(${id})`);
})
mp.events.add('takereport', (id, r) => {
    mp.events.callRemote('takereport', id, r);
})
mp.events.add('sendreport', (id, a) => {
    mp.events.callRemote('sendreport', id, a);
})
mp.events.add('exitreport', () => {
	global.menuClose();
	reportactive = false;
    mp.gui.cursor.visible = false;
})

// Advert menu
var adverts = null;
var advertsloaded = false;
var advertsactive = false;

mp.events.add('enableadvert', (toggle) => {
	try {
		if(toggle) adverts = mp.browsers.new('package://cef/adverts.html');
		advertsloaded = toggle;
	} catch(e) {
	}
})

mp.events.add('addadvert', (id_, author_, quest_) => {
	try {
		if(adverts != null) adverts.execute(`addAdvert(${id_},'${author_}','${quest_}', false, '')`);
		mp.events.call('notify', 0, 2, "Пришло новое объявление!", 3000);
	} catch(e) {
	}
})
mp.events.add('setadvert', (id, name) => {
	try {
		if(adverts != null) adverts.execute(`setStatus(${id}, '${name}')`);
	} catch(e) {
	}
})
mp.events.add('deladvert', (id) => {
	try {
		if(adverts != null) adverts.execute(`deleteAdvert(${id})`);
	} catch(e) {
	}
})
mp.events.add('takeadvert', (id, r) => {
	if(new Date().getTime() - global.lastCheck < 50) return; 
	global.lastCheck = new Date().getTime();
    mp.events.callRemote('takeadvert', id, r);
})
mp.events.add('sendadvert', (id, a) => {
	if(new Date().getTime() - global.lastCheck < 50) return; 
	global.lastCheck = new Date().getTime();
    mp.events.callRemote('sendadvert', id, a);
})
mp.events.add('exitadvert', () => {
	global.menuClose();
	advertsactive = false;
    mp.gui.cursor.visible = false;
})
mp.keys.bind(0x75, false, function () { // F6 key report menu
    if (!loggedin || chatActive || editing || advertsactive || new Date().getTime() - global.lastCheck < 1000) return;
    if (localplayer.getVariable('IS_ADMIN') != true) return;
    global.lastCheck = new Date().getTime();
    if (!global.menuOpened) {
        global.menuOpen();
        mp.gui.cursor.visible = true;
        if (!reportactive) report.execute(`app.playerName='${localplayer.name}'`);
        reportactive = true;
        report.execute('app.active=true;');
    } else {
        report.execute('app.active=false;');
        global.menuClose();
        reportactive = false;
        mp.gui.cursor.visible = false
    }
});
mp.keys.bind(0x76, false, function () { // F7 key advert menu
    if (!loggedin || chatActive || editing || reportactive || !advertsloaded || new Date().getTime() - global.lastCheck < 1000) return;
    global.lastCheck = new Date().getTime();
    if (!global.menuOpened) {
        global.menuOpen();
        mp.gui.cursor.visible = true;
        if (!advertsactive) adverts.execute(`app.playerName='${localplayer.name}'`);
        advertsactive = true;
        if(adverts != null) adverts.execute('app.active=true;');
    } else {
        if(adverts != null) adverts.execute('app.active=false;');
        global.menuClose();
        advertsactive = false;
        mp.gui.cursor.visible = false
    }
});