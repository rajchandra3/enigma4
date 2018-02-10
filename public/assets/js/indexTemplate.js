let logInForm;
let signUpForm;
let modal;

logInForm = document.getElementById('logInForm');
signUpForm = document.getElementById('signUpForm');
modal = document.getElementById('modal');

$(document).ready(function(){

  $('#logInHere').on('click touchstart', function(){
    $('#signUpForm').css({"display":"none"});
    $('#logInForm').css({"display":"block"});
  });

  $('#signUpHere').on('click touchstart', function(){
    $('#logInForm').css({"display":"none"});
    $('#signUpForm').css({"display":"block"});
  });
});
