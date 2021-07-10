import {
  GEO_IP_KEY as geoIpKey,
  MAP_BOX_KEY as mapBoxKey
} from "./apikey.js";

const search = document.querySelector("#app-search");
const btn = document.querySelector("#app-btn");
const form = document.querySelector("#app-form");
const main = document.querySelector("#out-main");
const list = document.querySelector("#out-list");
const ipAddr = document.querySelector("#out-ip-addr");
const loc = document.querySelector("#out-location");
const flag = document.querySelector("#out-flag");
const timezone = document.querySelector("#out-timezone");
const isp = document.querySelector("#out-isp");
const toggleBtn = document.querySelector("#toggle-btn");

const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const urlRegex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;
const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

let property, mymap, marker;
initMap();

// button at the bottom of the text section to collapse the section
toggleBtn.addEventListener("click", function (e) {
  console.log("toggle button clicked");
  if (list.classList.contains("output__list-is-collapsed")) {
    list.classList.remove("output__list-is-collapsed");
    toggleBtn.classList.remove("output__toggle-is-collapsed");
  } else {
    list.classList.add("output__list-is-collapsed");
    toggleBtn.classList.add("output__toggle-is-collapsed");
  }
});

// Parse input, is it an ip address? Email? or domain name?
btn.addEventListener("click", function (e) {
  console.log("app button clicked");
  e.preventDefault();
  app()
});

function app() {
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
    search.value = "";
  }
}

// initialize the map at the world view and locate user's location
function initMap() {
  mymap = L.map('mapid', {
    minZoom: 1
  })

  mymap.fitWorld();

  marker = L.marker([1, 1], {
    icon: L.icon({
      iconUrl: '/images/icon-location.svg',
      iconSize: [46, 56],
      iconAnchor: [22, 94]
    })
  })

  marker.addTo(mymap);

  L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: mapBoxKey
  }).addTo(mymap);

  fetch("https://api.ipify.org/?format=json")
    .then(response => response.json())
    .then(json => (callGeoIpAPI(json.ip, "ipAddress")));
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
// At the same time, call country REST API to get their flag
function parseGeoIpJSON(json) {
  console.log(json);

  fetch(`https://restcountries.eu/rest/v2/alpha/${json.location.country}`)
    .then(response => response.json())
    .then(countryJson => {
      // retrieve the flag through the Countries REST API
      flag.style.backgroundImage = `url(${countryJson.flag})`;

      // at the same time, update the other text sections with the Geo IP API's data
      ipAddr.textContent = json.ip;
      loc.textContent = `${json.location.city}, ${json.location.region}`;
      timezone.textContent = "UTC " + json.location.timezone;
      isp.textContent = json.isp;
    });

  drawMap(json.location.lat, json.location.lng);
}

// Update the map's view and marker
function drawMap(lat, lng) {
  mymap.flyTo([lat, lng], 13);
  marker.setLatLng([lat, lng]);
}

// Adding an event listener to the button to listen for the enter key to make this user friendlier
btn.addEventListener("keydown", function (event) {
  if (event.keyCode == 13) {
    btn.click();
  }
});