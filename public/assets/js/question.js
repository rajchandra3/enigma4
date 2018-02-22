//POPOVER UI

$(function () {
  $('[data-toggle="popover"]').popover()
});

$(function () {
  $('.example-popover').popover({
    container: 'body'
  })
});

$('.popover-dismiss').popover({
  trigger: 'focus'
});

$("#menu-toggle").click(function(e) {
       e.preventDefault();
       $("#wrapper").toggleClass("toggled");
});

//JQUERY GOES HERE

$( document ).ready(function(){

  $('.burger').on('click touchstart', function(e) {
    $('.context').css("left","0");
  });

  $('.cross').on('click touchstart', function() {
    $('.context').css("left","-100%");
  });

  $('.star').on('click touchstart', function() {
    $('.context-left').css("display","block");
    $('.context-left').css("right","0");
    $('.star').css("display","none");
  });

  $('.cross-left').on('click touchstart', function() {
    $('.context-left').css("right","-100%");
    $('.context-left').css("display","none");
    $('.star').css("display","block");
  });

});
