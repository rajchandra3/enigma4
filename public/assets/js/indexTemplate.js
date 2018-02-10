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
    $('#modal').css({"margin-top":"50vh"});
    $('#modal').css({"transform":"translate(0,-50%)"});
  });

  $('#signUpHere').on('click touchstart', function(){
      $('#logInForm').css({"display":"none"});
      $('#signUpForm').css({"display":"block"});
      $('#modal').css({"margin-top":"0"});
      $('#modal').css({"transform":"translate(0,0)"});
    });
});

//margin-top: 50vh;
//transform: translate(0,-50%);
