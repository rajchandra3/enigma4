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

$(function () {
  $('[data-toggle="tooltip"]').tooltip()
})

//JQUERY GOES HERE

$( document ).ready(function(){

  $('.burger').on('click touchstart', function(e) {
    $('.context').css("left","0");
  });

  $('.cross').on('click touchstart', function() {
    $('.context').css("left","-100%");
  });

  $('.star').on('click touchstart', function(e) {
    var url="/dashboard/leaderboard"
    window.open(url,"_self");
  });

  $('.useHint').on('click touchstart', function() {
    $('.useHint').css("display","none");
    $('.hintWarning').css("display","block");
  });

  $('.btn-nope').on('click touchstart', function() {
    $('.hintWarning').css("display","none");
    $('.useHint').css("display","block");
  });

  $('.btn-yep').on('click touchstart', function() {
    $('.hintWarning').css("display","none");
    $('.useHint').css("display","block");
  });

  $('.facebook').on('click touchstart', function(e) {
    var url="https://www.facebook.com/IEEEVIT/";
    window.open(url, '_blank');
  });

  $('.link-dark').on('click touchstart', function(e) {
    var url="../../docs/EnigmaTandC.pdf";
    window.open(url, '_blank');
  });
});

var x=setInterval(function() {
    var time=new Date().getTime();
    if(time >=1519642200000){
        location.reload(true);
    }
},1000);

