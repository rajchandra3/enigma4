/*var timeRem;
var timeNow;
var timeStart;

timeRem = document.getElementById('timeRem');
timeNow = document.getElementById('timeNow');
timeStart = document.getElementById('timeStart');

timeRem.innerHTML = "timeRem";
timeNow.innerHTML = "timeRem";
timeStart.innerHTML = "timeRem";*/

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
