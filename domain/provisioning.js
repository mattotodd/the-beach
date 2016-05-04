var config = require('config');
var models = require ("./models");
var randomstring = require('randomstring');

var blueprint = require('../services/blueprint');
var dApi = blueprint.devices;
var credsApi = blueprint.accessMqttCredentials;
var auth = require('../services/auth');

var SeaglassDevice = models.SeaglassDevice;

exports.onPreOsInstall = function (callback) {
  	var ptag = randomstring.generate({
		length: 7,
		charset: 'alphanumeric',
  		capitalization:'uppercase'
  	});

  	var act_key = randomstring.generate({
		length: 7,
		charset: 'alphanumeric',
  		capitalization:'uppercase'
  	});

  	var sync_key = randomstring.generate({
		length: 12,
		charset: 'alphanumeric',
  		capitalization:'uppercase'
  	});

  	var device = new SeaglassDevice ({
	  ptag: ptag,
	  act_key: act_key,
	  sync_key: sync_key,
	  provisioning_stage: "pre_os_install"
	});

	// Saving it to the database.  
	device.save(function (err) {
		if (err) {
			callback(err, null);
		} else {
			callback(null, device);
		}
	});
};

exports.onPostOsInstall = function (ptag, rbpsn, callback) {
	SeaglassDevice.findOne({ptag: ptag}, 
		function(err,device) { 
			if (err) {
				callback(err, null);
				return;
			}
			if(device == null){
				err = "Unable to find device"
				callback(err, null);
			}
			//console.log(ptag);
			device.rbpsn = rbpsn;
			device.provisioning_stage = "post_os_install";

			device.save(function (err) {
				if (err) {
					callback(err, null);
				} else {
					callback(null, device);
				}
			});
		}
	);
};

exports.onFirstOSBoot = function (rbpsn, sync_key, callback) {
	SeaglassDevice.findOne({rbpsn: rbpsn, sync_key:sync_key}, 
		function(err,device) { 
			if (err) {
				callback(err, null);
				return;
			}
			if(device == null){
				err = "Unable to find device"
				callback(err, null);
				return;
			}

			device.rbpsn = rbpsn;
			device.provisioning_stage = "first_os_boot";

			var seaglassTmplId = config.get('SeaglassGateway.deviceTemplateId');
			var orgId = config.get('SeaglassGateway.orgId');
			var acctId = config.get('SeaglassGateway.accountId');

			var u = process.env.XIVELY_ACCOUNT_USER_NAME;
			var p = process.env.XIVELY_ACCOUNT_USER_PASSWORD;
			auth.getJwtForCredentials(acctId, u, p).then((jwtResp) => {
				console.log(JSON.stringify(jwtResp));
				dApi.createDevice(acctId, jwtResp.jwt, seaglassTmplId, orgId, rbpsn).then(function(createResp){
					console.log(JSON.stringify(createResp));
					var deviceId = createResp.device.id;
					device.activation_channel = `xi/blue/v1/${acctId}/d/${deviceId}/activate`;
					device.blueprint_device_id = deviceId;
					return credsApi.create(acctId, jwtResp.jwt, "device", deviceId);
				}).then(function(mqttCreateResp){
	            	device.mqtt_secret = mqttCreateResp.mqttCredential.secret;
					device.save(function (err) {
						if (err) {
							callback(err, null);
						} else {
							callback(null, device);
						}
					});
				});
			});
		}
	);
};

exports.onAwaitingActivation = function (rbpsn, sync_key, callback) {
	SeaglassDevice.findOne({rbpsn: rbpsn, sync_key:sync_key}, 
		function(err,device) { 
			if (err) {
				callback(err, null);
				return;
			}
			if(device == null){
				err = "Unable to find device"
				callback(err, null);
				return;
			}

			device.provisioning_stage = "awaiting_activation";

			device.save(function (err) {
				if (err) {
					callback(err, null);
				} else {
					callback(null, device);
				}
			});
		}
	);
};