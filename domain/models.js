var mongoose = require ("mongoose");

var seaglassDeviceScheme = new mongoose.Schema({
  ptag: { type: String, unique : true, required : true },
  act_key: { type: String, unique : true, required : true },
  sync_key: { type: String, required : true },
  rbpsn: { type: String, dropDups: true },
  blueprint_device_id: String,
  mqtt_secret: String,
  provisioning_stage: String
});

var SeaglassDevice = mongoose.model('SeaglassDevices', seaglassDeviceScheme);


module.exports = {
	SeaglassDevice: SeaglassDevice
}