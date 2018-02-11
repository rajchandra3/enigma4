
  $('#logInHere').on('click touchstart', function(){
      alert('something is clicked');
    $('#signUpForm').css({"display":"none"});
    $('#logInForm').css({"display":"block"});
  });

  $('#signUpHere').on('click touchstart', function(){
      alert('something is clicked');
    $('#logInForm').css({"display":"none"});
    $('#signUpForm').css({"display":"block"});
  });

