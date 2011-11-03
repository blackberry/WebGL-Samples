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

package blackberry.custom.audio
{
	import flash.media.Sound;
	import flash.media.SoundChannel;
	import flash.media.SoundTransform;
	import flash.net.URLRequest;

	import webworks.extension.DefaultExtension;
	
	public class CustomAudio extends DefaultExtension
	{
		private var soundChannels:Array = new Array();
		private var currentVolume:Array = new Array();
	
		public function CustomAudio() {
			super();
		}

		override public function getFeatureList():Array {
			return new Array ("blackberry.custom.audio");
		}
		
		public function playFile(eFileName:String, eLoops:int, eVolume:Number, ePan:Number):Number {
			var req:URLRequest = new URLRequest(eFileName);
			var snd:Sound = new Sound();
			var channel:SoundChannel = new SoundChannel();
			snd.load(req);
			var pausePosition:int = channel.position;
			var sndTransform:SoundTransform = new SoundTransform(eVolume, ePan);
			currentVolume[soundChannels.length] = eVolume;
			channel = snd.play(pausePosition, eLoops, sndTransform);
			soundChannels[soundChannels.length] = channel;
			return soundChannels.length - 1;
		}
		
		public function setVolume(eSoundID:Number, eNewVolume:Number):void {
			if (eNewVolume < 0)
				eNewVolume = 0;
			else if (eNewVolume > 1)
				eNewVolume = 1;
			if (eNewVolume != currentVolume[eSoundID]) {
				var transform:SoundTransform = soundChannels[eSoundID].soundTransform;
				transform.volume = eNewVolume;
				soundChannels[eSoundID].soundTransform = transform;
				currentVolume[eSoundID] = eNewVolume;
			}
		}
	}
}
