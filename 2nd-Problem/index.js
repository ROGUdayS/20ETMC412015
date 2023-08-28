var express = require("express");
var axios = require("axios");
var app = express();

var fetchDataFromUrls = async (urls) => {
  var allNumbers = [];

  var fetchNumbers = async (url) => {
    try {
      var response = await axios.get(url, { timeout: 100 }); // 100 ms timeout
      return response.data.numbers;
    } catch (err) {
      return [];
    }
  };

  var allPromises = urls.map(fetchNumbers);
  for await (var numbers of allPromises) {
    allNumbers.push(...numbers);
  }

  var uniqueSortedNumbers = [...new Set(allNumbers)].sort((a, b) => a - b);
  return uniqueSortedNumbers;
};

app.get("/numbers", async (req, res) => {
  var urls = req.query.url;
  if (!urls || urls.length === 0) {
    return res.status(400).send('No URLs provided.');
  }

  var numbers = await fetchDataFromUrls(urls);
  res.json({ numbers: numbers });
});

app.listen(3003, function () {
  console.log("Number Management Service running on http://localhost:3000");
});
