var BarCounter = 0;
var AccelCounter = 0;
var samplingIntervall = 10;
var intervalBar,analysisInterval = null;

var date = [];
var xData = [1,2,3,4,5,6,7,8,9,10];
var altitude = [];
var mag = [];


var status = "#";
var saveToFile,lift,stairs,walking,still,tracking = false;


function dataHandlerBar(data) {
  if (data !== undefined) {
    date.push(Date.now());
    altitude.push(data.altitude);
    BarCounter++;
  }
}
function dataHandlerAccel(data) {
  if (data !== undefined && AccelCounter < BarCounter) {
    mag.push(data.diff);
    AccelCounter++;
  }
}

function analyze() {
  if(tracking && altitude.length > samplingIntervall) {
    var currAlt = [altitude.shift(),altitude.shift(),altitude.shift(),altitude.shift(),altitude.shift(),altitude[0],altitude[1],altitude[2],altitude[3],altitude[4]];
    var currMag = [mag.shift(),mag.shift(),mag.shift(),mag.shift(),mag.shift(),mag[0],mag[1],mag[2],mag[3],mag[4]];
    var altTrendline = linearRegression(currAlt);
    var sum = currMag.reduce(function (acc, value) {
      return acc + value;
    }, 0);
    var meanMag = sum / samplingIntervall;
    var altDiffMinMax = Math.max.apply(null, currAlt)-Math.min.apply(null, currAlt);
    var altDiffFirstsLast = Math.abs(currAlt[9] - currAlt[0]);
    //console.log("altTrendline: " + altTrendline + "; meanMag: " + meanMag + "; altDiffMinMax: " + altDiffMinMax + "; altDiffFirstsLast: " +altDiffFirstsLast);
    if(Math.abs(altTrendline) > 0.1 && (altDiffMinMax > 3 || altDiffFirstsLast > 1)) {
      if(meanMag <= 1.03){
        if(altDiffMinMax > 2 && altDiffFirstsLast > 2){
          mainmenu.Status.value = "Lift";
          console.log("Lift");
        } else {
          mainmenu.Status.value = "Still";
          console.log("Still");
        }
      } else {
        if(meanMag < 1.08 && (altDiffMinMax > 5 || altDiffFirstsLast > 5)){
          mainmenu.Status.value = "Lift";
          console.log("Lift");
        } else if(altDiffMinMax > 1 && altDiffFirstsLast > 1){
          mainmenu.Status.value = "Stairs";
          console.log("Stairs");
        } else {
          mainmenu.Status.value = "Moving";
          console.log("Moving");
        }
      }
    } else {
      if(Math.floor(meanMag * 100) / 100 <= 1.02){
        mainmenu.Status.value = "Still";
        console.log("Still");
      } else {
        mainmenu.Status.value = "Moving";
        console.log("Moving");
      }
    }
  }
  updateMenu();
}

function linearRegression(currAlt) {
    if (xData.length !== currAlt.length || currAlt.length === 0) {
      console.log("Invalid data");
      return null;
    }
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < samplingIntervall; i++) {
        sumX += xData[i];
        sumY += currAlt[i];
        sumXY += xData[i] * currAlt[i];
        sumX2 += xData[i] * xData[i];
    }
    return (samplingIntervall * sumXY - sumX * sumY) / (samplingIntervall * sumX2 - sumX * sumX);
}

var mainmenu = {
  "": { "title": "Stair Track" },
  "< Back": function () {Bangle.showLauncher(); },
  "Status": {
    value: status,
  },
  "Tracking": {
    value: tracking,
    format: v => v ? "On" : "Off",
    onchange: v => {
      tracking = v;
      if(v){
        Bangle.setBarometerPower(1);
        Bangle.setPollInterval(1000); // 12.5 Hz - the default
        intervalBar = setInterval(() => Bangle.getPressure().then(data => dataHandlerBar(data)), 1000);
        Bangle.on('accel', data => dataHandlerAccel(data));
        analysisInterval = setInterval(analyze, 5000);
        updateMenu();
      } else {
          Bangle.setBarometerPower(0);
          clearInterval(intervalBar);
          clearInterval(analysisInterval);
          BarCounter = AccelCounter = 0;
          date=altitude=mag = [];
          mainmenu.Status.value = "#";
          updateMenu();
      }
    },
  },
};
function updateMenu() {
  E.showMenu(mainmenu);
}
updateMenu();