/**
 * Created by Raj Chandra on 9/1/2017.
 */
var app = angular.module('enigma',["ngRoute"]);

app.config(function($routeProvider, $locationProvider){
    $routeProvider
        .when("/leaderboard", {
            templateUrl: "/ejs/templates/others/leaderboard.ejs",
            controller: "questionController"
        })
        .otherwise({
            template : "<h1>NOT FOUND</h1>"
        });
});

app.controller('questionController',['$scope','$http','$location','$routeParams',function ($scope,$http,$location,$routeParams) {

    $('#answer').keypress(function(event){
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13'){
            $scope.sendResponse();
        }
    });

    $scope.getQuestion = function () {
        $http.get('/dashboard/question').then(successCallback, errorCallback);

        function successCallback(response) {
            $scope.data = response.data;
        }
        function errorCallback(error) {
            console.log("Data could not be Obtained !" + error);
        }
    }

    $scope.sendResponse = function () {
        $scope.msg = "...";
        if(!$scope.response.answer){
            $scope.msg = "Empty Response :(";
        }
        else {
            var sendAnswer = {
                answer : $scope.response.answer.toLowerCase()
            };
            console.log(sendAnswer);
            $http.post('/dashboard/question', sendAnswer).then(successCallback, errorCallback);

            function successCallback(response) {
                $scope.check = response.data;//code & message
                console.log($scope.check);
                switch ($scope.check.code) {
                    case 0:
                        $scope.msg = $scope.check.msg;
                        location.reload();
                        break;
                    case 1:
                        $scope.msg = $scope.check.msg;
                        $scope.taunt = $scope.check.taunt;
                        break;
                    case 2:
                        $scope.msg = $scope.check.msg;
                        $scope.taunt = $scope.check.taunt;
                        break;
                    case 3:
                        $scope.msg = $scope.check.msg;
                        $scope.taunt = $scope.check.taunt;
                        break;
                }
            }

            function errorCallback(error) {
                console.log("Data could not be Obtained !" + error);
            }
        }
    }

    $scope.getMiniLeaderboard = function () {
        $http.get('/dashboard/mini').then(successCallback, errorCallback);
        $http.get('/dashboard/currentUser').then(success, error);
        var currentUserId;
        function success(res){
            currentUserId = res.data._id;
        }
        function error(err) {
            console.log("Didn't recieve the ID");
        }
        function successCallback(response) {
            $scope.dataset = response.data;
            var dataset = $scope.dataset;
            var l =dataset.length;
                if(l>0) {
                    for (i = 0; i < l; i++) {
                        // console.log(typeof currentUserId)
                        // console.log(typeof dataset[i]._id);
                        // console.log(i+":"+dataset[i].username);
                        if (i === 0) {
                            dataset.topper = dataset[0];
                            dataset.topper.rank = 1;
                            $scope.userRank = 1;
                        }
                        if (dataset[i]._id === currentUserId) {
                            // console.log("found the user Id "+ currentUserId);
                            // assigning the rank and data on realtime
                            dataset.user = dataset[i];
                            dataset.user.rank = i + 1;
                            if (i > 0) {
                                dataset.userTop = dataset[i - 1];
                                dataset.userTop.rank = i;
                            }
                            if(i!=(l-1)){
                                dataset.userBottom = dataset[i + 1];
                                dataset.userBottom.rank = i + 2;
                            }
                            //assigning userrank
                            $scope.userRank = i + 1;
                            break;
                        }
                    }
            }
        }
        function errorCallback(error) {
            console.log("Data could not be Obtained !" + error);
        }
    }
    $scope.getAchievements = function () {
        $http.get('/dashboard/achievements').then(successCallback, errorCallback);

        function successCallback(response) {
            $scope.achieved = response.data[0].achievements.status;
        }
        function errorCallback(error) {
            console.log("Data could not be Obtained !" + error);
        }
    }
    $scope.useHint = function () {
        $http.post('/dashboard/hint').then(successCallback, errorCallback);

        function successCallback(response) {
            $scope.hintMsg = response.data.msg;
            $scope.data.playerData.hint = response.data.hintRem;
        }
        function errorCallback(error) {
            console.log("Data could not be Obtained !" + error);
        }
    }
    $scope.getData = function () {
        $http.get('/dashboard/leaderboard').then(successCallback, errorCallback);

        function successCallback(response) {
            $scope.dataset = response.data;
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
                    document.getElementById("answer").disabled = true;
                } else {
                    $(element).hide();
                    document.getElementById('answer').disabled = false;
                }
            });
        }
    };
}
