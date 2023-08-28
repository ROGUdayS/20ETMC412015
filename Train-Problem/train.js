var express = require("express");
var app = express();
var axios = require("axios");

// lets Cache the data using these variables
let trainDataCache = [];
let lastFetched = null;

var fetchData = async() => {
  var URL = "http://20.244.56.144/train/trains"; 
  var Key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2OTMyMzQxNDYsImNvbXBhbnlOYW1lIjoiSm9obiBEb2UgUmFpbHdheSBTZXJ2ZXIiLCJjbGllbnRJRCI6ImE2NGJmYWM5LTk1NDctNDllNC1iODM0LWZjZjkzNTU1NDEzOSIsIm93bmVyTmFtZSI6IiIsIm93bmVyRW1haWwiOiIiLCJyb2xsTm8iOiIyMEVUTUM0MTIwMTUifQ.NQHGuminV08JkQftABw2X_XVglrjn1FKyVZw5eXdQE4"; 
  
  try {
    var response = await axios.get(URL, {
      headers: { Authorization: `Bearer ${Key}` },
    });

    if (!response.data) {
      console.log("No data received");
      return;
    }
    
    let dataset = response.data;

    // Filter based on departure time
    var currentTimeInMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    var filteredTrains = dataset.filter(train => {
      var trainDepartureTimeInMinutes = train.departureTime.Hours * 60 + train.departureTime.Minutes;
      var effectiveDepartureTime = trainDepartureTimeInMinutes + train.delayedBy;

      return effectiveDepartureTime > currentTimeInMinutes + 30;
    });

    // Sorting Algo
    trainDataCache = filteredTrains.sort((a, b) => {
      var aLowestPrice = Math.min(a.price.sleeper, a.price.AC);
      var bLowestPrice = Math.min(b.price.sleeper, b.price.AC);
      if (aLowestPrice !== bLowestPrice) return aLowestPrice - bLowestPrice;

      var aTotalSeats = a.seatsAvailable.sleeper + a.seatsAvailable.AC;
      var bTotalSeats = b.seatsAvailable.sleeper + b.seatsAvailable.AC;
      if (aTotalSeats !== bTotalSeats) return bTotalSeats - aTotalSeats;

      var aEffectiveDepartureTime = (a.departureTime.Hours * 60 + a.departureTime.Minutes) + a.delayedBy;
      var bEffectiveDepartureTime = (b.departureTime.Hours * 60 + b.departureTime.Minutes) + b.delayedBy;
      return bEffectiveDepartureTime - aEffectiveDepartureTime;
    });

    lastFetched = new Date();

  } catch (err) {
    console.error(`Failed to fetch data: ${err}`);
  }
};

app.get("/trains", async (req, res) => {
  var now = new Date();
  if (!lastFetched || (now - lastFetched > 30 * 60 * 1000)) { // 30 minutes
    await fetchData();
  }
  res.json(trainDataCache);
});

app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(3003, function () {
  console.log("Train Tickets server running on port 3003...");
});
