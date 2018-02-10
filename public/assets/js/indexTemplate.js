$(document).ready(function(){

  $('#logInHere').on('click', function(){
    $('#signUpForm').css({"display":"none"});
    $('#logInForm').css({"display":"block"});
  });

  $('#signUpHere').on('click', function(){
    $('#logInForm').css({"display":"none"});
    $('#signUpForm').css({"display":"block"});
  });
});
