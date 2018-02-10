$(document).ready(function(){

  $('#logInHere').on('click touchstart', function(){
    $('#signUpForm').hide();
    $('#logInForm').show();
  });

  $('#signUpHere').on('click touchstart', function(){
    $('#logInForm').hide();
    $('#signUpForm').show();
  });
});
