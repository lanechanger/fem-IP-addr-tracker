import GEO_IP_KEY from "./apikey.js";
import MAP_BOX_KEY from "./apikey.js";

const search = document.querySelector("#app-search");
const btn = document.querySelector("#app-btn");
const ipAddr = document.querySelector("#out-ip-addr");
const loc = document.querySelector("#out-location");
const timezone = document.querySelector("#out-timezone");
const isp = document.querySelector("#out-isp");

const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const urlRegex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;
const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const geoIpKey = GEO_IP_KEY;
const mapBoxKey = MAP_BOX_KEY;

let property;
// initialize the map on the "map" div with a given center and zoom
let mymap = L.map('mapid');
mymap.setView([51.505, -0.09], 20);
let myIcon = L.icon({
  iconUrl: '/images/icon-location.svg',
  iconSize: [46, 56],
  iconAnchor: [22, 94] // play around to find this out
});
L.marker([51.505, -0.09], {
  icon: myIcon
}).addTo(mymap);
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
  maxZoom: 18,
  id: 'mapbox/streets-v11',
  tileSize: 512,
  zoomOffset: -1,
  accessToken: mapBoxKey
}).addTo(mymap);

initMap();

// Parse input, is it an ip address? Email? or domain name?
btn.addEventListener("click", function (e) {
  let input = search.value;

  // Store the property based on what it is for use in the Geo IP API later
  if (input.match(ipRegex)) {
    property = "ipAddress";
  } else if (input.match(emailRegex)) {
    property = "email";
  } else if (input.match(urlRegex)) {
    property = "domain";
  } else {
    // error
    property = "";
  }

  if (property) {
    callGeoIpAPI(input, property);
  }
});

// Initialize map to user's ip
async function initMap() {
  try {
    fetch("https://api.ipify.org/?format=json")
      .then(response => response.json())
      .then(json => callGeoIpAPI(json.ip, "ipAddress"));
  } catch (error) {
    console.log(error);
  }
}

// Make the call to Geo IP like below
// https://geo.ipify.org/api/v1?apiKey=at_5Enpp3MpASTFXAGtCFSh5GF2HEXan&ipAddress=192.212.174.101
// API doc: https://geo.ipify.org/docs
//    Use parameters ipAddress, domain, or email depending on what's entered
async function callGeoIpAPI(input, property) {
  let url = `https://geo.ipify.org/api/v1?apiKey=${geoIpKey}&${property}=${input}`;
  console.log(`calling Geo IP API with property ${property} and value ${input} at url: ${url}`);

  try {
    let result = await fetch(url);
    let jsonResult = await result.json();
    parseGeoIpJSON(jsonResult);
  } catch (error) {
    console.log(error);
  }
}

// Parse output JSON that comes back and update output and map components
//    property ip --> Ip Address
//    property location>city , location>region --> Location 
//    property location>timezone --> timezone
//    property "isp" --> ISP
function parseGeoIpJSON(json) {
  ipAddr.textContent = json.ip;
  loc.textContent = `${json.location.city}, ${json.location.region}`;
  timezone.textContent = json.location.timezone;
  isp.textContent = json.isp;

  drawMap(json.location.lat, json.location.lng);
}

function drawMap(lat, lng) {
  mymap.setView([lat, lng], 13);
  L.marker([lat, lng], {
    icon: myIcon
  }).addTo(mymap);
}