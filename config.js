var config = require('config');

function getApiRoot(configPath){
	var bpConfig = config.get(configPath);
	var apiBaseUrl = bpConfig.scheme + bpConfig.host;
	if(bpConfig.port && bpConfig.port !== 80){
		apiBaseUrl += ":"+bpConfig.port;
	}
	apiBaseUrl += bpConfig.apiRoot;
	return apiBaseUrl;
}


module.exports = {
	getApiRoot: getApiRoot
}