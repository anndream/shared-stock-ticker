'use strict';

angular.module('stockApp')
  .controller('MainCtrl', function ($scope, $http) {

    $scope.submit = function(query) {
      query = query.toUpperCase();
      if ($scope.names.indexOf(query) === -1) {
        stock(query, function(ok, rnd) {
          if (ok) {
            $scope.names.push(query);
            $scope.colors.push(rnd);
            $http.post('/api/things/', { name: query });
            update();
          }
        });
      }
      $scope.query = '';
    };

    $scope.destroy = function(name) {
      var ind = $scope.names.indexOf(name); 
      if (ind !== -1) {
        $scope.names.splice(ind, 1);
        $scope.colors.splice(ind, 1);
        $http.delete('/api/things/' + name);
        chartData.datasets = chartData.datasets.filter(function(data) {
          return data.label !== name;
        });
        update();
      }
    };

    function pad(num) {
      if (num.toString().length === 1) {
        return '0' + num;
      }
      return '' + num;
    }

    function stock(symbol, cb) {
      var url = 'http://query.yahooapis.com/v1/public/yql';
      var endDate = new Date();
      var startDate = new Date();
      startDate.setDate(1);
      startDate.setMonth(1);
      endDate = '' + endDate.getFullYear() + '-' + pad(endDate.getMonth() + 1) + '-' + pad(endDate.getDate());
      startDate = '' + startDate.getFullYear() + '-' + pad(startDate.getMonth()) + '-' + pad(startDate.getDate());
      var data = encodeURIComponent('select * from yahoo.finance.historicaldata where symbol in ("' + symbol + '")and startDate = "' + startDate + '" and endDate = "' + endDate + '"');
      //https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.historicaldata%20where%20symbol%20in%20(%22%22)and%20startDate%20=%20%222015-01-01%22%20and%20endDate%20=%20%222015-07-24%22&format=json&diagnostics=true&env=http://datatables.org/alltables.env&format=json
      $.getJSON(url, 'q=' + data + "&format=json&diagnostics=true&env=http://datatables.org/alltables.env")
          .done(function (data) {
            if (data.query.results === null) {
              cb(false);
            } else {
              var tmp = data.query.results.quote.reverse().map(function(obj) {
                return obj.Close;
              });
              var color = rnd();
              var dset = {
                label: symbol,
                fillColor: color,
                strokeColor: color,
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(151,187,205,1)",
                data: tmp
              }
              var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'August', 'October', 'November', 'December'];
              var numDays = [20, 19, 22, 22, 20, 22, 22, 21, 21, 21, 19, 22];
              var curr = 0;
              var count = 1;
              chartData.labels = tmp.map(function(data){

               if (count === 1) {
                      count += 1;
                      return months[curr++];
                }

                count += 1;

                if (count === numDays[curr]) {
                  count = 1;
                }
                return '';
              });
              chartData.datasets.push(dset);
              cb(true, color);
            }
          })
          .fail(function (jqxhr, textStatus, error) {
              var err = textStatus + ", " + error;
              console.log('Request failed: ' + err);
          });
    }

    var update = function() {
      var stockGraph = new Chart(ctx).Line(chartData, {scaleShowVerticalLines: false, pointDot: false, tooltipEvents: [], responsive: true});
    };

    var rnd = function() {
      var f = function() {
        return Math.floor(Math.random() * 140 + 95);
      }
      return 'rgba(' + f() + ',' + f() + ',' + f() + ',' + .6 + ')';
    }

    $scope.names = [];
    $scope.colors = [];
    var chartData = {
      datasets: [{label: 'default_so_chartjs_works', data: 0}],
      labels: ['']
    }; 
    var ctx = document.getElementById('graph').getContext('2d');
    $http.get('/api/things/').success(function(data) {
      data.forEach(function(d, ind) {
        var fn = ind === data.length - 1 ? update : angular.noop;
        stock(d.name, function(ok, rnd) {
          if (ok) {
            $scope.$apply($scope.names.push(d.name));
            $scope.$apply($scope.colors.push(rnd));
            fn();
          }
        });
      }); 
      update();
    });
    update();
  });
