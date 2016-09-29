
var app = angular.module('app',['ngRoute']);

var savedJobs = [];


/****************** Services ******************/
app.factory('jobSearchService', function($http){
  return{
    getListOfJobs: function(callback){
      $http({
        url: 'https://data.usajobs.gov/api/search',
        params: {
          //Keyword: "developer",
          JobCategoryCode: 2210,
          LocationName: 'Atlanta, Georgia'
        },
        headers: {
          //'User-Agent': 'allenhthompson1@gmail.com',
          'Authorization-Key': 'MfbLK4LehC6CQvAg3U9nr2Y0nBS5IHnMJjPK+KuoWbM='
        }
      }).success(callback);
    } // end getListOfJobs method
  }; // end return
}); // end jobSearchService factory

app.factory('weatherService', function($http){
  var APPID = '0eec4393061dd3bf6597febdb72c50c4';
  return {
    getByCityID: function(callback){
      $http({
        url: 'http://api.openweathermap.org/data/2.5/weather',
        params: {
          q: 'Atlanta',
          units: 'imperial',
          APPID: APPID
        }
      }).success(callback);
    } // end getByCityID method
  }; // end return
}); // end app.factory(weatherService)



// main controller
app.controller('MainController', function($scope, jobSearchService, googleMap){
  jobSearchService.getListOfJobs(function(data){
    // returns the first 25 results
    $scope.allResultsList = data.SearchResult.SearchResultItems;
    //console.log($scope.allResultsList);

    // call to the google service plot jobs location on map
    googleMap.plotData($scope.allResultsList);
  });
});
/**** Config: Switch between pages ****/
app.config(function($routeProvider) {
     $routeProvider
     .when('/search/:keyword/:location', {
          controller: 'JobSearch',
          templateUrl: 'main.html'
     })
     .when('/savedJobs', {
          controller: 'SaveJobs',
          templateUrl: 'savedJobs.html'
     })
     .when('/', {
          controller: 'HomePage',
          templateUrl: 'home.html'
     });

});


app.controller('SaveJobs', function($scope, $http){
  $scope.savedJobs = savedJobs;
  $scope.deleteJobBtn = function(index){
    $scope.savedJobs.splice(index,1);
    //console.log($scope.savedJobs);
  };
});

app.controller('HomePage', function($scope, $http, $location, weatherService){
  var d = new Date();
  document.getElementById("displayDate").innerHTML = d.toDateString();

     $scope.searchJobs = function() {
          $location.path('/search/' + $scope.keyword + '/' + $scope.location);
     };
     weatherService.getByCityID(function(data){
         $scope.data = data;
         console.log($scope.data);
     });


});

app.controller('JobSearch', function($scope, $http, $routeParams){
  var infoWindow = new google.maps.InfoWindow();

     // $scope.message = 'Test message.';//this line just checking connectivity

     $scope.getLocation = function(job){
          var cityList = job.MatchedObjectDescriptor.PositionLocation;
          console.log(cityList);
          var locations = cityList.filter(filterLocations);
          console.log(locations);
          return locations[0];
     };

     function filterLocations(location){
          if(location.LocationName.indexOf($routeParams.location) > -1){
               return true;
          } else if (location.LocationName.indexOf("Nationwide")){
               return true;
          } else if (location.LocationName.indexOf("Negotiable")){
               return true;
          }     
          return false;
     }
     $scope.openInfoWindow = function(job){
          infoWindow.setContent('<a target="_blank" href =' + job.MatchedObjectDescriptor.PositionURI + '>Apply To This Job</a>' + '<h5>' + job.MatchedObjectDescriptor.PositionTitle + '</h5>');
          infoWindow.open(map, job.marker);
     };
     // job search api call
     $http({
          url: 'https://data.usajobs.gov/api/search',
          params: {
               Keyword: $routeParams.keyword,
               //JobCategoryCode: 2210,
               LocationName: $routeParams.location
          },
          headers: {
               //'User-Agent': 'allenhthompson1@gmail.com',
               'Authorization-Key': 'MfbLK4LehC6CQvAg3U9nr2Y0nBS5IHnMJjPK+KuoWbM='
          }
     }).success(function(data) {
          var allResultsList = data.SearchResult.SearchResultItems;
          console.log('data', allResultsList);

          // var filterGeorgiaResults = function(oneResult) {
          //      var cityList = oneResult.MatchedObjectDescriptor.PositionLocation;
          //      var gaLocations = cityList.filter(filterForGa);
          //      if (gaLocations.length > 0) {
          //           return true;
          //      } else
          //      return false;
          //      /*
          //      1. store locationList as a variable
          //      2. filter locationList to only GA locations, store that in variable
          //      3. if GA locations is empty (length of 0), return false, otherwise return true
          //      */
          // };

          function clearMarker() {
               setMapOnAll(null);
          }

          $scope.allResultsList = allResultsList;


          //$scope.georgiaResultsList = allResultsList.filter(filterGeorgiaResults);
          // $scope.resultList = data.SearchResult.SearchResultItems;
          //console.log(JSON.stringify($scope.georgiaResultsList));

          var markers = $scope.allResultsList.map(function(job) {

               var locationList = job.MatchedObjectDescriptor.PositionLocation;

               //funtiont to fliter the list of jobs to only Georgia

               //var locationsInGeorgia = locationList.filter(filterForGa);

               locationList.map(function(location){
                    var lat = location.Latitude;
                    var lng = location.Longitude;
                    var position = {
                         lat: lat,
                         lng: lng
                    };

                    var marker = new google.maps.Marker({
                         anchorPoint:new google.maps.Point(0,-8),
                         position: position,
                         map: map,
                    });
                    job.marker = marker;
                    var contentString = '<a href =' + job.MatchedObjectDescriptor.PositionURI + '>Apply To This Job</a>' + '<h5>' + job.MatchedObjectDescriptor.PositionTitle + '</h5>' + job.MatchedObjectDescriptor.PositionTitle + '</h5>';

                    marker.addListener('click', function() {
                        infoWindow.setContent('<a target="_blank" href =' + job.MatchedObjectDescriptor.PositionURI + '>Apply To This Job</a>' + '<h5>' + job.MatchedObjectDescriptor.PositionTitle + '</h5>');
                         infoWindow.open(map, marker);
                    });
                    //REMOVE THE CODE BELOW
                    // var infowindow = new google.maps.InfoWindow();
                    // function openInfoWindow(job){
                    //      var contentString = '<a href =' + job.MatchedObjectDescriptor.PositionURI + '>Apply To This Job</a>' + '<h5>' + job.MatchedObjectDescriptor.PositionTitle + '</h5>';
                    //
                    //      infoWindow.setContent(contentString);
                    //
                    //REMOVE THE CODE ABOVE

               });
          });
          //<a href = "LINK"></a>
     });
     var location = $routeParams.location;
     var lat = 0;
     var lng = 0;
     if (location === "Atlanta") {
           lat = 33.748995;
           lng = -84.387982;
     } else if(location === "Philidelphia") {
           lat = 39.952584;
           lng = -75.165222;
     } else if (location === "Chicago") {

          lat = 41.878114;
          lng = -87.629798;
     } else if(location === "Miami") {
          lat = 25.78;
          lng = -80.22;
     } else if (location === "Washington") {
          lat = 38.89;
          lng = -77.03;
     }else if (location === "Montgomery") {
          lat = 32.361538;
          lng = -86.279118;
     } else if(location === "Juneau") {
          lat = 58.301935;
          lng = -134.419740;
     } else if (location === "Phoenix") {
          lat = 33.448457;
          lng = -112.073844;
     } else if (location === "Little Rock") {
          lat = 34.736009;
          lng = -92.331122;
     } else if (location === "Sacramento") {
          lat = 38.555605;
          lng = -121.468926;
     }













     else {
          lat = 1
          lng = -1;
     }
     // google map api call
     var centerLatLng = {
          lat: lat,
          lng: lng
     };

     var mapOtions = {
          center: centerLatLng,
          zoom: 9
     };

     var map = new google.maps.Map(document.getElementById('map'), mapOtions);


  $scope.saveJobBtn = function(job){
    if (savedJobs.indexOf(job) === -1) {
      savedJobs.push(job);
    }

    // $scope.jobcomments = $cookies.get('jobcomments');
    // $cookies.put('jobcomments', job);
    //console.log(savedJobs);
  };
});
