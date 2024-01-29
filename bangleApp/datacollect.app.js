var BarCounter = 1;
var AccelCounter = 0;
var FileName;
var intervalBar = null;
var intervalAccel = null;

var file;
var saveToFile = false;

function dataHandlerBar(data) {
  if (data !== undefined) {
    var formattedDate = new Date(Date.now()).toISOString().slice(0, 19).replace("T", " ");
    var rowData = [BarCounter,formattedDate,data.altitude,data.temperatur,data.pressure].join(",");
    file.write(rowData);
    BarCounter++;
  }
}
function dataHandlerAccel(data) {
  if (data !== undefined && AccelCounter < BarCounter) {
    var rowData = [ data.x,data.y,data.z,data.diff,data.mag].join(",") + "\n";
    file.write("," + rowData);
    AccelCounter++;
  }
}

function readAndRemoveFirstRow() {
  file = require("Storage").open("data" + Counter + ".csv", "r");
  file.readLine();
  var line;
  while ((line = file.readLine()) !== undefined) {
    // Process the row (you can parse and use the data as needed)
    console.log("Row:", line);
  }
  file.close();
}

var mainmenu = {
  "": { "title": "Stair Track" },
  "< Back": function () { Bangle.showLauncher(); },
  "Status": {
    value: "#",
  },
  "Tracking": {
    value: false,
    format: v => v ? "On" : "Off",
    onchange: v => {
      if (v) {
        formattedDate = new Date(Date.now()).toISOString().slice(0, 19).replace("T", " ");
        FileName = "data" + formattedDate + ".csv";
        file = require("Storage").open(FileName, "a");
        file.write("Counter,Date,Altitude,Temperature,Pressure,X,Y,Z,Diff,Mag\n");
        Bangle.setBarometerPower(1);
        Bangle.setPollInterval(1000); // 12.5 Hz - the default
        intervalBar = setInterval(() => Bangle.getPressure().then(data => dataHandlerBar(data)), 1000);
        Bangle.on('accel', data => dataHandlerAccel(data));
      } else {
        Bangle.setBarometerPower(0);
        clearInterval(intervalBar);
        Bangle.removeListener('accel', dataHandlerAccel);
        saveToFile = false;
        BarCounter = AccelCounter = 0;
      }
    },
  },
  "Save to file": {
    value: saveToFile,
    format: v => v ? "On" : "Off",
    onchange: v => {
      saveToFile = v;
    },

  },
};
function updateMenu() {
  E.showMenu(mainmenu);
}
updateMenu();