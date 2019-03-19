/*jslint es5:true, indent: 2 */
/*global Vue, io */
/* exported vm */
'use strict';
var socket = io();

var vm = new Vue({
  el: '#page',
  data: {
      express: null,
      orderId: null,
      map: null,
      fromMarker: null,
      destMarker: null,
      baseMarker: null,
      driverMarkers: {},
      orderInfo:{}
  },


// When the user clicks the button, open the modal 
  created: function () {
    socket.on('initialize', function (data) {
      // add marker for home base in the map
      this.baseMarker = L.marker(data.base, {icon: this.baseIcon}).addTo(this.map);
      this.baseMarker.bindPopup("This is the dispatch and routing center");
    }.bind(this));
    socket.on('orderId', function (orderId) {
      this.orderId = orderId;
    }.bind(this));

    // These icons are not reactive
    this.fromIcon = L.icon({
      iconUrl: "img/box.png",
      iconSize: [42,30],
      iconAnchor: [21,34]
    });
    this.baseIcon = L.icon({
      iconUrl: "img/base.png",
      iconSize: [40,40],
      iconAnchor: [20,20]
    });
  },
  mounted: function () {
    // set up the map
    this.map = L.map('my-map').setView([59.8415,17.648], 13);

    // create the tile layer with correct attribution
    var osmUrl='http://{s}.tile.osm.org/{z}/{x}/{y}.png';
    var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
    L.tileLayer(osmUrl, {
        attribution: osmAttrib,
        maxZoom: 18
    }).addTo(this.map);
    this.map.on('click', this.handleClick);

    var searchDestControl = L.esri.Geocoding.geosearch({allowMultipleResults: false, zoomToResult: false, placeholder: "Destination"}).addTo(this.map);
    var searchFromControl = L.esri.Geocoding.geosearch({allowMultipleResults: false, zoomToResult: false, placeholder: "From"});
    // listen for the results event and add the result to the map
    searchDestControl.on("results", function(data) {
        this.destMarker = L.marker(data.latlng, {draggable: true}).addTo(this.map);
        this.destMarker.on("drag", this.moveMarker);
        searchFromControl.addTo(this.map);
    }.bind(this));

    // listen for the results event and add the result to the map
    searchFromControl.on("results", function(data) {
        this.fromMarker = L.marker(data.latlng, {icon: this.fromIcon, draggable: true}).addTo(this.map);
        this.fromMarker.on("drag", this.moveMarker);
        this.connectMarkers = L.polyline([this.fromMarker.getLatLng(), this.destMarker.getLatLng()], {color: 'blue'}).addTo(this.map);
    }.bind(this));
  },
  methods: {
      orderSum: function() {

          this.orderInfo = {totalgrams: document.getElementById('Vikt').value, storlek: document.getElementById('Storlek').value, driverInstructions: document.getElementById('Ovrigt').value, telefonMottagare: document.getElementById('Telefonnummert').value, telefonAvsändare: document.getElementById('Telefonnummerf').value, emailMottagare: document.getElementById('emailt').value, emailAvsändare: document.getElementById('emailf').value, FnamnM: document.getElementById('Förnamnt').value, EnamnM: document.getElementById('Efternamnt').value, FnamnF: document.getElementById('Förnamnf').value, EnamnF: document.getElementById('Efternamnf').value}
      },
      getNumber: function() {
    var minNumber = 0; // The minimum number you want
    var maxNumber = 10000000; // The maximum number you want
    var randomnumber = Math.floor(Math.random() * (maxNumber + 1) + minNumber); // Generates random number
    $('#myNumber').html(randomnumber); // Sets content of <div> to number
    return randomnumber; // Returns false just to tidy everything up
      },
      placeOrder: function() {
          this.orderSum();
                   socket.emit("placeOrder", { fromLatLong: [this.fromMarker.getLatLng().lat, this.fromMarker.getLatLng().lng],
        destLatLong: [this.destMarker.getLatLng().lat, this.destMarker.getLatLng().lng],
        expressOrAlreadyProcessed: this.express ? true : false,
                                  orderDetails: {totalgrams: document.getElementById('Vikt').value, storlek: document.getElementById('Storlek').value, driverInstructions: document.getElementById('Ovrigt').value, telefonMottagare: document.getElementById('Telefonnummert').value, telefonAvsändare: document.getElementById('Telefonnummerf').value, emailMottagare: document.getElementById('emailt').value, emailAvsändare: document.getElementById('emailf').value }
                                   });
        window.location.href="./done.html";
      },
      openModal: function (){
          this.orderSum();
          $("#myModal").openModal();
          
  },
    getPolylinePoints: function() {
      if (this.express) {
        return [this.fromMarker.getLatLng(), this.destMarker.getLatLng()];
      } else {
        return [this.fromMarker.getLatLng(), this.baseMarker.getLatLng(), this.destMarker.getLatLng()];
      }
    },
    handleClick: function (event) {
      // first click sets pickup location
      if (this.fromMarker === null) {
        this.fromMarker = L.marker(event.latlng, {icon: this.fromIcon, draggable: true}).addTo(this.map);
        this.fromMarker.on("drag", this.moveMarker);
      }
      // second click sets destination
      else if (this.destMarker === null) {
        this.destMarker = L.marker([event.latlng.lat, event.latlng.lng], {draggable: true}).addTo(this.map);
        this.destMarker.on("drag", this.moveMarker);
        this.connectMarkers = L.polyline(this.getPolylinePoints(), {color: 'blue'}).addTo(this.map);
      } 
      // subsequent clicks assume moved markers
      else {
        this.moveMarker();
      }
    },
    moveMarker: function (event) {
      this.connectMarkers.setLatLngs(this.getPolylinePoints(), {color: 'blue'});
      /*socket.emit("moveMarker", { orderId: event.target.orderId,
                                latLong: [event.target.getLatLng().lat, event.target.getLatLng().lng]
                                });
                                */
    }
  }
});
