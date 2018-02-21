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

  $('.burger').on('click touchend', function() {
    $('.context').css("display","block");
  });

  $('.cross').on('click touchend', function() {
    $('.context').css("display","none");
  });

});
