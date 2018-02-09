/**
 * Created by Raj Chandra on 9/2/2017.
 */

var app = angular.module('enigma');
app.controller('adminController',['$scope','$http','$location','$routeParams',function ($scope,$http,$location,$routeParams) {
    $scope.getQuestion = function () {
        $http.get('/cookiemonster/q').then(successCallback, errorCallback);

        function successCallback(response) {
            $scope.question = response.data;
        }
        function errorCallback(error) {
            console.log("Data could not be Obtained !" + error);
        }
    };

    $scope.findQuestion = function () {
        var id = $routeParams.id;
        $http.get('/cookiemonster/q/data/'+id).then(success,error);
        function success(response) {
            $scope.question = response.data;
        }
        function error(error){
            console.log("That id was not found !" + error);
        }
    };
    $scope.addQuestion = function () {
        $http.post('/cookiemonster/q/add',$scope.question).then(success,error);
        function success(response){
            $location.path('/Q');
        }
        function error(error){
            console.log("This error occured"+error);
            $location.path('/swr');
        }
    }
    $scope.updateQuestion = function () {
        var id = $routeParams.id;
        $http.put('/cookiemonster/q/update/'+id , $scope.question).then(success,error);
        function success(response){
            $location.path('/Q');
        }
        function error(error){
            $location.path('/swr');
        }
    }
    $scope.deleteQuestion = function (id) {
        $http.delete('/cookiemonster/q/delete/'+id).then(success,error);
        function success(response){
            $location.path('/Q');
        }
        function error(error){
            console.log(error);
            $location.path('/swr');
        }
    }
    $scope.getPlayerData = function () {
        $http.post('/cookiemonster/playerLog',$scope.player).then(successCallback, errorCallback);

        function successCallback(response) {
            $scope.res = response.data;
            $scope.attempts = response.data.length;
        }
        function errorCallback(error) {
            console.log("Data could not be Obtained !" + error);
        }
    }
    $scope.getPlayers = function(){
        $http.get('/cookiemonster/leaders').then(successCallback, errorCallback);

        function successCallback(response) {
            $scope.topPlayers = response.data;
        }
        function errorCallback(error) {
            console.log("Data could not be Obtained !" + error);
        }
    }
    // Data retrieved from http://vikjavev.no/ver/index.php?spenn=2d&sluttid=16.06.2015.
    $scope.getGraph = function(){
        $http.get('/cookiemonster/graph').then(successCallback, errorCallback);

        function successCallback(response) {
            $scope.graphData = response.data;
            var logs = $scope.graphData;
            var itHour = 15;
            var itDay = 8;
            var counter =0,c=0;
            var attempts = new Array(72) ;
            var correct = new Array(72) ;
            var k=0;
            for(var i=0;i<logs.length;i++){
                logs[i].time = new Date(logs[i].time);
                ftHour = logs[i].time.getHours();
                if(ftHour==itHour){ //if hour is correct
                    counter++;
                    if(logs[i].correct){ //if answer
                        c++;
                    }
                }
                else{
                    attempts[k] = counter;
                    correct[k] = c;
                    counter = c = 0;
                    k++;
                    if(itHour==23){
                        itHour=0;
                    }
                    else{
                        itHour++;
                    }
                }
            }
            Highcharts.chart('container', {
                chart: {
                    type: 'spline'
                },
                title: {
                    text: logs.length+' attempts during three days'
                },
                subtitle: {
                    text: 'Oct 9 to Oct 12, 2017'
                },
                xAxis: {
                    type: 'datetime',
                    labels: {
                        overflow: 'justify'
                    }
                },
                yAxis: {
                    title: {
                        text: 'Attempts(per hour)'
                    },
                    minorGridLineWidth: 0,
                    gridLineWidth: 0,
                    alternateGridColor: null,
                    plotBands: [{ // Light air
                        from: 1000,
                        to: 2000,
                        color: 'rgba(68, 170, 213, 0.1)',
                        label: {
                            text: 'Less Engagement',
                            style: {
                                color: '#606060'
                            }
                        }
                    }, { // Light breeze
                        from: 2000,
                        to: 3000,
                        color: 'rgba(0, 0, 0, 0)',
                        label: {
                            text: 'Engagement',
                            style: {
                                color: '#606060'
                            }
                        }
                    }, { // Gentle breeze
                        from: 3000,
                        to: 4000,
                        color: 'rgba(68, 170, 213, 0.1)',
                        label: {
                            text: 'Moderate Engagement',
                            style: {
                                color: '#606060'
                            }
                        }
                    }, { // Moderate breeze
                        from: 4000,
                        to: 5000,
                        color: 'rgba(0, 0, 0, 0)',
                        label: {
                            text: 'High Engagement',
                            style: {
                                color: '#606060'
                            }
                        }
                    }]
                },
                tooltip: {
                    valueSuffix: ' per hour'
                },
                plotOptions: {
                    spline: {
                        lineWidth: 4,
                        states: {
                            hover: {
                                lineWidth: 5
                            }
                        },
                        marker: {
                            enabled: false
                        },
                        pointInterval: 3600000, // one hour
                        pointStart: Date.UTC(2017, 9, 9, 16, 20, 0)
                    }
                },
                series: [{
                    name: 'Attempts',
                    data: attempts
                }, {
                    name: 'Correct Answers',
                    data: correct
                }],
                navigation: {
                    menuItemStyle: {
                        fontSize: '10px'
                    }
                }
            });

        }
        function errorCallback(error) {
            console.log("Data could not be Obtained !" + error);
        }
    }
}]);

angular.module('enigma').directive('loader', loader);

/**
 * Defines loading spinner behaviour
 *
 * @param {obj} $http
 * @returns {{restrict: string, link: Function}}
 */
function loader($http) {
    return {
        restrict: 'A',
        link: function(scope, element, attributes) {
            scope.$watch(function() {
                return $http.pendingRequests.length;
            }, function(isLoading) {
                if (isLoading) {
                    $(element).show();
                } else {
                    $(element).hide();
                }
            });
        }
    };
}
