/**
 * Created by Raj Chandra on 23-12-2017.
 */
var name = /^[a-zA-Z]{2,30}$/;
var email = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
var reg_no = /^[\w\-\s]+$/;
var phone = /^[\d -]*/;
var password = /^[A-Za-z0-9_ -@]{3,20}$/;
var code = /^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9]+$/;

var re = module.exports = {name:name,email:email,reg_no:reg_no,phone:phone,password:password,code:code};
