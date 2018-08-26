function main() {
  const sheet = SpreadsheetApp.getActiveSheet();
  updateInstrumentsData(sheet);
  updateUnemploymentData(sheet);
  updateModifiedAt(sheet);
}

function getInstrumentMA(id, days) {
  const payload = {
    orderbookId: id,
    chartType: "AREA",
    chartResolution: "DAY",
    timePeriod: "year",
    ta: [
      {
        type: "sma",
        timeFrame: days
      }
    ]
  };

  const url = "https://www.avanza.se/ab/component/highstockchart/getchart/orderbook";
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  };

  const response = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(response.getContentText());

  const smaSeries = json.technicalAnalysis[0];
  const sma = smaSeries.dataPoints[smaSeries.dataPoints.length - 1][1];

  return sma;
}

function getFundInfo(id) {
  const url = "https://www.avanza.se/_mobile/market/fund/" + id;
  const response = UrlFetchApp.fetch(url, {});
  return JSON.parse(response.getContentText());
}

function updateInstrumentsData(sheet) {
  const ids = sheet
    .getRange("A2:A12")
    .getValues()
    .map(function(row) {
      return row[0];
    });
  const rows = ids.reduce(function(acc, id) {
    const ma = getInstrumentMA(id, 200);
    const info = getFundInfo(id);
    return acc.concat([
      [
        '=HYPERLINK("https://www.avanza.se/fonder/om-fonden.html/' + info.id + '"; "' + info.name + '")',
        info.subCategory,
        info.managementFee,
        info.NAV / ma - 1,
        ma,
        info.NAV,
        info.changeSinceOneMonth / 100,
        info.changeSinceThreeMonths / 100,
        info.changeSinceSixMonths / 100,
        info.changeSinceOneYear / 100 || "",
        info.changeSinceThreeYears / 100 || "",
        info.changeSinceFiveYears / 100 || "",
        info.changeSinceTenYears / 100 || "",
        info.NAVLastUpdated.split("T")[0]
      ]
    ]);
  }, []);
  sheet.getRange(2, 2, rows.length, rows[0].length).setValues(rows);
}

function updateUnemploymentData(sheet) {
  const url = "https://api.bls.gov/publicAPI/v2/timeseries/data/LNS14000000";
  const response = UrlFetchApp.fetch(url, {});
  const data = JSON.parse(response.getContentText());
  const n = 10;
  const series = data.Results.series[0].data.map(function(datum) {
    return parseFloat(datum.value, 10);
  });
  const ma = series.slice(0, n).reduce(function(acc, v) { return acc + v; }, 0) / n;
  sheet.getRange("B16:B17").setValues([[series[0]], [ma]]);
}

function updateModifiedAt(sheet) {
  sheet
    .getRange("B29:B29")
    .setValues([[new Date().toISOString().split("T")[0]]]);
}
