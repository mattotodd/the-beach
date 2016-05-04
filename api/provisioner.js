var express = require('express');
var router = express.Router();

var provisioning = require("../domain/provisioning");

// First ping we get from a seaglass in the provisioning cycle
// It sends no identifying information, but we return a ptag
// which gets set as a shell param
// Response will be executed as an ASH shell script (busybox)
router.get('/announce/pre-os-installer', function(req, res, next) {
	provisioning.onPreOsInstall(function(err, device){
		if(!err){
			res.send('seaglass_ptag='+device.ptag);
		}else{
			res.send(err);
		}
	});
});

// Second ping we get from a seaglass in the provisioning cycle
// Raspbian has been installed (but not run) and we get the serial
// number of the raspberrypi microcontroller
// Response json will be saved on the pi in the seaglass logs
router.get('/announce/post-os-installer/:ptag/:rbpsn', function(req, res, next) {
	provisioning.onPostOsInstall(req.params.ptag, req.params.rbpsn, function(err, device){
		if(!err){
			res.json({sync_key:device.sync_key});
		}else{
			res.send(err);
		}
	});
});

// Third ping we get from a seaglass in the provisioning cycle
// first boot Raspbian (called from /etc/rc.local)
// Response json will be saved on the pi in the seaglass logs
router.get('/announce/first-boot/:rbpsn/:sync_key', function(req, res, next) {
	provisioning.onFirstOSBoot(req.params.rbpsn, req.params.sync_key, function(err, device){
		if(!err){
			res.json({
				id:device.blueprint_device_id, 
				mqtt:device.mqtt_secret,
				activation_channel:device.activation_channel
			});
		}else{
			res.send(err);
		}
	});
});

// Fourth ping we get from a seaglass in the provisioning cycle
// pi is up and waiting to be activated for a xively account
router.get('/announce/awaiting-activation/:rbpsn/:sync_key', function(req, res, next) {
	provisioning.onAwaitingActivation(req.params.rbpsn, req.params.sync_key, function(err, device){
		if(!err){
			res.json({success:true});
		}else{
			res.send(err);
		}
	});
});

module.exports = router;
