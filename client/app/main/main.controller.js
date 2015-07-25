'use strict';

angular.module('stockApp')
  .controller('MainCtrl', function ($scope, $http) {
    var now = new Date();
    var start = new Date(now.getFullYear(), 0, 0);
    var diff = now - start;
    var oneDay = 1000 * 60 * 60 * 24;
    var day = Math.floor(diff / oneDay);
    var lbls = Array.apply(null, new Array(day)).map(function(){return ''});
    var chartData = {
      datasets: [{label: 'default_so_chartjs_works', data: 0}],
      labels: lbls
    }; 
    var ctx = document.getElementById('graph').getContext('2d');
    var update = function() {
      var stockGraph = new Chart(ctx).Line(chartData, {scaleShowVerticalLines: false, pointDot: false, tooltipEvents: []});
    };
    update();
    $scope.names = [];
    $scope.submit = function(query) {
      if ($scope.names.indexOf(query) === -1) {
        stock(query, function(ok) {
          if (ok) {
            $scope.names.push(query);
            $http.post('/api/things/', { name: query });
          }
        });
      }
      $scope.query = '';
    };
    $scope.destroy = function(name) {
      var ind = $scope.names.indexOf(name); 
      if (ind !== -1) {
        $scope.names.splice(ind, 1);
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
      console.log(startDate, endDate);
      var data = encodeURIComponent('select * from yahoo.finance.historicaldata where symbol in ("' + symbol + '")and startDate = "' + startDate + '" and endDate = "' + endDate + '"');
      //https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.historicaldata%20where%20symbol%20in%20(%22%22)and%20startDate%20=%20%222015-01-01%22%20and%20endDate%20=%20%222015-07-24%22&format=json&diagnostics=true&env=http://datatables.org/alltables.env&format=json
      $.getJSON(url, 'q=' + data + "&format=json&diagnostics=true&env=http://datatables.org/alltables.env")
          .done(function (data) {
            if (data.query.results === null) {
              cb(false);
            } else {
              var tmp = data.query.results.quote.map(function(obj) {
                return obj.Close;
              });
              var dset = {
                label: symbol,
                fillColor: "rgba(151,187,205,0.2)",
                strokeColor: "rgba(151,187,205,1)",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(151,187,205,1)",
                data: tmp
              }
                chartData.labels = tmp.map(function(data){
                  return '';
                });
              chartData.datasets.push(dset);
              update();
              cb(true);
            }
          })
          .fail(function (jqxhr, textStatus, error) {
              var err = textStatus + ", " + error;
              console.log('Request failed: ' + err);
          });
    }
  });
