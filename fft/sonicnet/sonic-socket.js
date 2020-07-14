var audioContext = new window.AudioContext;
/**
 * Encodes text as audio streams.
 *
 * 1. Receives a string of text.
 * 2. Creates an oscillator.
 * 3. Converts characters into frequencies.
 * 4. Transmits frequencies, waiting in between appropriately.
 */
function SonicSocket(params) {
	params = params || {};
	this.coder = params.coder || new SonicCoder();
	this.charDuration = params.charDuration || window.PARAMS.CHAR_DURATION || 0.2;
	this.coder = params.coder || new SonicCoder(params);
	this.rampDuration = params.rampDuration || window.PARAMS.RAMP_DURATION || 0.07;
}


SonicSocket.prototype.send = function (input, opt_callback) {
	// Surround the word with start and end characters.
	input = this.coder.startChar + input + this.coder.endChar;

	// OfflineAudioContext for Buffer.
	const offlineCtx = new window.OfflineAudioContext({ length: input.length * window.PARAMS.CHAR_DURATION * 48000, sampleRate: 48000 });

	// Use WAAPI to schedule the frequencies.
	for (var i = 0; i < input.length; i++) {
		var char = input[i];
		var freq = this.coder.charToFreq(char);
		console.log("Freq : " + freq + " for " + char)
		var time = audioContext.currentTime + this.charDuration * i;
		this.scheduleToneAt(freq, time, this.charDuration, offlineCtx);
	}

	// If specified, callback after roughly the amount of time it would have
	// taken to transmit the token.
	if (opt_callback) {
		var totalTime = this.charDuration * input.length;
		setTimeout(opt_callback, totalTime * 1000);
	}

	//Return AudioBuffer 
	return offlineCtx
};

SonicSocket.prototype.scheduleToneAt = function (freq, startTime, duration, offlineCtx) {
	var gainNode = offlineCtx.createGain();
	// Gain => Merger
	// gainNode.gain.value = window.PARAMS.GAINVAL || 100;
	gainNode.gain.setValueAtTime(0, startTime);
	gainNode.gain.linearRampToValueAtTime(1, startTime + this.rampDuration); //change gain here
	gainNode.gain.setValueAtTime(1, startTime + duration - this.rampDuration);
	gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

	gainNode.connect(offlineCtx.destination);

	var osc = offlineCtx.createOscillator();
	osc.frequency.value = freq;
	osc.connect(gainNode);

	osc.start(startTime);
	osc.stop(startTime + duration)
};
