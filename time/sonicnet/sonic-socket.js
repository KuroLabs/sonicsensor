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
	// input = input ;
	// Use WAAPI to schedule the frequencies.
	for (var i = 0; i < input.length; i++) {
		var char = input[i];
		var freq = this.coder.charToFreq(char);
		var time = audioContext.currentTime + this.charDuration * i;
		this.scheduleToneAt(freq, time, this.charDuration);
	}

	// If specified, callback after roughly the amount of time it would have
	// taken to transmit the token.
	if (opt_callback) {
		var totalTime = this.charDuration * input.length;
		setTimeout(opt_callback, totalTime * 1000);
	}
};

SonicSocket.prototype.scheduleToneAt = function (freq, startTime, duration) {
	var gainNode = audioContext.createGain();
	// Gain => Merger
	gainNode.gain.value = window.PARAMS.GAINVAL || 100;

	gainNode.gain.setValueAtTime(0, startTime);
	gainNode.gain.linearRampToValueAtTime(1, startTime + this.rampDuration);
	gainNode.gain.setValueAtTime(1, startTime + duration - this.rampDuration);
	gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

	gainNode.connect(audioContext.destination);

	var osc = audioContext.createOscillator();
	osc.frequency.value = freq;
	osc.connect(gainNode);
    console.log("Sent2 :",String(+new Date()).slice(9))
	osc.start(startTime);
};

