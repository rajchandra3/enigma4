var daySlot = document.getElementById('days');
var hourSlot = document.getElementById('hours');
var minuteSlot = document.getElementById('minutes');
var secondSlot = document.getElementById('seconds');

var dayLength=24*60*60*1000;
var hourLength=60*60*1000;
var minuteLength=60*1000;

var time;
var currentSecond;
var currentHour;
var currentMinute;

var counter=0;

var x=setInterval(function() {
  time=new Date().getTime();
  time=1519383000000-time;

  currentSecond=Math.floor((time)/1000)%60;
  currentDay=Math.floor(time/dayLength);
  currentHour=Math.floor((time-currentDay*dayLength)/hourLength);
  currentMinute=Math.floor((time-currentDay*dayLength-currentHour*hourLength)/minuteLength);

  if(currentMinute===60){
    currentHour++;
    currentMinute=0;
  }
  if(currentHour===24){
    currentDay++;
    currentHour=0;
  }
  daySlot.innerHTML = currentDay;
  hourSlot.innerHTML = currentHour;
  minuteSlot.innerHTML = currentMinute;
  secondSlot.innerHTML = currentSecond;
},1000);


/*var y=setInterval(function(){
  counter+=1;
  if ((counter%4==0)||((counter+1)%4==0)){

  }
},200);*/
