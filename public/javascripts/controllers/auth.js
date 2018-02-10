/**
 * Created by IEEE on 9/17/2017.
 */
var app = angular.module("enigma", ["ngRoute"]);

app.config(function($routeProvider){
    $routeProvider
        .when("/",{
            templateUrl : "/ejs/templates/index/index.ejs",
            controller: "authController"
        })
        .when("/forgotPassword", {
            templateUrl: "/ejs/templates/index/forgot.ejs",
            controller: "authController"
        })
        .when("/resetPassword/:params", {
            templateUrl: "/ejs/templates/index/reset.ejs",
            controller: "authController"
        })
        .when("/leaderboard", {
            templateUrl: "/ejs/templates/others/leaderboard.ejs",
            controller: "authController"
        })
        .when("/rules", {
            templateUrl: "/ejs/templates/others/rules.ejs"
        })
        .otherwise({
            template : "404 url not Found !!"
        });
});

app.controller('authController',['$scope','$http','$location','$rootScope',function ($scope,$http,$location,$rootScope) {

    $scope.getRegistered = function () {
        $scope.msg = "Saving your credentials...";
        if($scope.player.name == '' || $scope.player.name===undefined){
            $scope.msg = "Name can't be empty ! ";
        }
        else if($scope.player.password == $scope.player.cpassword ) {
            $scope.player.email = ($scope.player.email).toLowerCase();
            $http.post('/auth/save', $scope.player).then(successCallback, errorCallback);
            function successCallback(response) {
                $scope.resData = response.data; //getting response
                switch ($scope.resData.code) {
                    case 1:
                        $scope.msg = "Please verify your email to compelete the registration. Check spam if not found.";
                        break;
                    case 0:
                        $scope.msg = $scope.resData.message;
                        break;
                }
            }

            function errorCallback(error) {
                console.log("Message could not be Obtained !" + error);
            }
        }
        else{
            $scope.msg = "Passwords do not match ! "
        }
    };

    $scope.verifyLogin = function(){
        function getCookie(cname) {
            var name = cname + "=";
            var decodedCookie = decodeURIComponent(document.cookie);
            var ca = decodedCookie.split(';');
            for(var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) === ' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(name) === 0) {
                    return c.substring(name.length, c.length);
                }
            }
            return "";
        }

        function checkCookie() {
            var user=getCookie("enigma4-access-token");
            if (user) {
                window.location.href = '/dashboard';
                }
                function error(error) {
                    console.log("Mode could not be Obtained !" + error);
                }
            }
        checkCookie();
    }

    $scope.getLogin = function () {
        if($scope.player.email === '' || $scope.player.password === '') {
            $scope.msg = "Invalid credentials !!";
        }
        else{
            $scope.player.email = ($scope.player.email).toLowerCase();
            $http.post('/auth/verifyPlayer', $scope.player).then(successCallback, errorCallback);

            function successCallback(response) {
                $scope.resData = response.data;
                console.log($scope.resData);
                switch ($scope.resData.code) {
                    case 0:
                        $scope.msg = $scope.resData.message;
                        break;
                    case 1:
                        $scope.msg = "Success ! We are redirecting you to Enigma.";
                        window.location.href = '/dashboard';
                        break;
                }
            }
            function errorCallback(error) {
                console.log("Message could not be Obtained !" + error);
            }
        }
    };

    $scope.forgotPassword = function(x){
        switch(x){
            case 1:
                window.location.href='/resend';
                break;
            case 2:
                window.location.href='#!/forgotPassword';
                break;
        }
    };

    $scope.emailGen = function () {

        $http.post('/resend', $scope.player).then(successCallback, errorCallback);

        function successCallback(response) {
            $scope.resData = response.data; //getting response\
            switch (parseInt($scope.resData.code)) {
                case 1:
                    $scope.msg = $scope.resData.message;
                    break;
                case 0:
                    $scope.msg = $scope.resData.message;
                    break
            }
        }
    };

    $scope.modeSelected = function (x) {
        mode = {
            value : x
        };
        $http.post('/dashboard/modeSelected',mode).then(successCallback, errorCallback);
        function successCallback(response) {
            $scope.resData = response.data;
            window.location.href = "/dashboard";
        }

        function errorCallback(error) {
            console.log("Message could not be Obtained !" + error);
        }
    };
    $scope.forgotEmailGen = function () {

        $http.post('/player/forgot', $scope.player).then(successCallback, errorCallback);

        function successCallback(response) {
            $scope.resData = response.data;
            switch (parseInt($scope.resData.code)) {
                case 1:
                    $scope.msg = $scope.resData.message;
                    break;
                case 0:
                    $scope.msg = $scope.resData.message;
                    break;
            }
        }

        function errorCallback(error) {
            console.log("Message could not be Obtained !" + error);
        }
    };
    $scope.emailGen = function () {
        $http.post('/resend', $scope.player).then(successCallback, errorCallback);

        function successCallback(response) {
            $scope.resData = response.data; //getting response\
            switch (parseInt($scope.resData.code)) {
                case 1:
                    $scope.msg = $scope.resData.message;
                    break;
                case 0:
                    $scope.msg = $scope.resData.message;
                    break
            }
        }

        function errorCallback(error) {
            console.log("Message could not be Obtained !" + error);
        }
    };
    $scope.resetPassword = function () {
        if($scope.player.password === $scope.player.confirm){
            var par = $location.path().split("/");
            var token = par[2];

            $http.post('/reset/'+token,$scope.player).then(successCallback,errorCallback);
            function successCallback(response) {
                $scope.resData = response.data; //getting response
                switch (parseInt($scope.resData.code)) {
                    case 1:
                        $scope.msg = $scope.resData.message;
                        window.location.href = '/';
                        break;
                    case 0:
                        $scope.msg = $scope.resData.message;
                        break;
                }
            }

            function errorCallback(error) {
                console.log("Message could not be Obtained !" + error);
            }
        }
        else{
            $scope.msg = "Passwords do not match !";
        }
    };

    $scope.getLeaderboard = function () {
        $http.post('/leaderboard').then(success, error);
        function success(res) {
            $scope.leaderboard = res.data;
        }

        function error(err) {
            console.log("Didn't recieve the leaderboard !!");
        }
    }
    $scope.getAttempts = function (name) {
        $scope.requested = {name:name};
        $http.post('/playerLog',$scope.requested).then(successCallback, errorCallback);

        function successCallback(response) {
            $scope.result=response.data;
        }
        function errorCallback(error) {
            console.log("Data could not be Obtained !" + error);
        }
    }
    $scope.sendBack=function(){
        console.log("sentback");
        window.location.href = "/dashboard";
    }

}]);

app.directive("ngMobileClick", [function () {
    return function (scope, elem, attrs) {
        elem.bind("touchstart click", function (e) {
            e.preventDefault();
            e.stopPropagation();

            scope.$apply(attrs["ngMobileClick"]);
        });
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