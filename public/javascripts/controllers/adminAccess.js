/**
 * Created by Raj Chandra on 8/31/2017.
 */
var app = angular.module("enigma", ["ngRoute"]);

app.config(function($routeProvider){
    $routeProvider
        .when("/",{
            controller : "adminController",
            templateUrl : "/ejs/templates/admin/mainAdmin.ejs"
        })
        .when("/Q", {
            controller: "adminController",
            templateUrl: "/ejs/templates/admin/question/que.ejs"
        })
        .when("/Qadd", {
            controller: "adminController",
            templateUrl: "/ejs/templates/admin/question/add.ejs"
        })
        .when("/Qedit/:id", {
            controller: "adminController",
            templateUrl: "/ejs/templates/admin/question/edit.ejs"
        })
        .when("/swr", {
            template: "SomeThing Went Wrong !!"
        })
        .otherwise({
            template : "404 url not Found !!"
        });
});
