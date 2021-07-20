require('dotenv').config();
const {
  response
} = require('express');
const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("IpAddrTracker"));
app.use(express.json());

app.listen(port, () => console.log(`listening at port ${port}`));

app.post('/geoIpApi/:input/:property', async (req, res) => {
  console.log("request received: geoIpApi");
  console.log(req.params);
  const input = req.params['input'];
  const property = req.params['property'];

  // Make the call to Geo IP like below
  // https://geo.ipify.org/api/v1?apiKey=at_5Enpp3MpASTFXAGtCFSh5GF2HEXan&ipAddress=192.212.174.101
  // API doc: https://geo.ipify.org/docs
  //    Use parameters ipAddress, domain, or email depending on what's entered
  let url = `https://geo.ipify.org/api/v1?apiKey=${process.env.GEO_IP_KEY}&${property}=${input}`;
  console.log(`calling Geo IP API with property ${property} and value ${input} at url: ${url}`);

  try {
    let result = await fetch(url);
    let jsonResult = await result.json();
    console.log(jsonResult);
    res.json(jsonResult);
  } catch (error) {
    console.log(error);
  }
});

// This is really to just abstract the map box api key in here away from the client code
app.post('/mapBoxApi', (req, res) => {
  console.log("request received: mapBoxApi");
  res.json({
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: process.env.MAP_BOX_KEY
  });
});