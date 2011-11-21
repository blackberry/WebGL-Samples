/*
* Copyright (c) 2011 Research In Motion Limited.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

(function () {
	var CUSTOM_FILE_API_URL = "blackberry/custom/audio";
	
	var ARGS_ID = "id";
	var ARGS_FILENAME = "filename";
	var ARGS_LOOPS = "loops";
	var ARGS_VOLUME = "volume";
	var ARGS_PAN = "pan";

	function CustomAudioDispatcher() {
	};

	CustomAudioDispatcher.prototype.playFile = function(fileName, loops, volume, pan) {
		var remoteCall = new blackberry.transport.RemoteFunctionCall(CUSTOM_FILE_API_URL + "/playFile");
		remoteCall.addParam(ARGS_FILENAME, fileName);
        remoteCall.addParam(ARGS_LOOPS, loops);
        remoteCall.addParam(ARGS_VOLUME, volume);
		remoteCall.addParam(ARGS_PAN, pan);

		return remoteCall.makeSyncCall();
	};
	
	CustomAudioDispatcher.prototype.setVolume = function(id, volume) {
		var remoteCall = new blackberry.transport.RemoteFunctionCall(CUSTOM_FILE_API_URL + "/setVolume");
		remoteCall.addParam(ARGS_ID, id);
        remoteCall.addParam(ARGS_VOLUME, volume);

		return remoteCall.makeSyncCall();
	};

	blackberry.Loader.javascriptLoaded("blackberry.custom.audio", CustomAudioDispatcher);
})();
