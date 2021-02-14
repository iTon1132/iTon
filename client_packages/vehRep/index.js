/*
 * Created by BlackGold
 * Garbage truck module for RageMp v1.0
 * Open-source license
 * Cannot be used for sale
 */

// Marker
mp.markers.new(1, new mp.Vector3(535.4251, -177.73148, 53.0), 5.0,
    {
        color: [255, 0, 0, 255],
        visible: true,
        dimension: 0
    });

// Blip
mp.blips.new(544, new mp.Vector3(535.4251, -177.73148, 53.0),
    {
        name: 'Los Santos Car Repair',
        color: 3,
        shortRange: true,
    });

//Colshape
let vehRep = mp.colshapes.newCircle(535.4251, -177.73148, 5.0, 0);
vehRep.name = "VehRep";

let repBrowser = null;
mp.events.add("playerEnterColshape",(shape) => {
    if (shape == vehRep && mp.players.local.vehicle) {
        repBrowser = mp.browsers.new('package://vehRep/web/index.html');
        setTimeout(function () {
            mp.gui.cursor.show(true, true);
        }, 500);
    }
});

mp.events.add("CLIENT:VEH:REPAIR",() => {
    mp.events.callRemote('SERVER:VEH:REPAIR');
});

mp.events.add("CLIENT:VEH:REPAIR:CANCEL",() => {
    if (repBrowser != null) {
        repBrowser.destroy();
        mp.gui.cursor.show(false, false);
    }
});

mp.events.add("CLIENT:VEH:REPAIR:BROWSER:DESTROY",() => {
    if (repBrowser != null) {
        repBrowser.destroy();
        mp.gui.cursor.show(false, false);
    }
});