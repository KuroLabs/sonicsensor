let mic, fft, coder

function preload() {
	//sound = loadSound('sound.wav');
}

function clamp(value, min, max) {
	return min < max ?
		(value < min ? min : value > max ? max : value) :
		(value < max ? max : value > min ? min : value)
}


function setup() {
	// CANVAS SETUP
	let cnv = createCanvas(1200, 600);
	mic = new p5.AudioIn()
	mic.start()
	fft = new p5.FFT(0.2);
	fft.setInput(mic);
	// sound.amp(0.4);

	//DECODER SETUP
	coder = new SonicCoder(window.PARAMS)
}

function frequencyToIndex(frequency, frequencyBinCount) {
	var nyquist = sampleRate() / 2
	var index = Math.round(frequency / nyquist * frequencyBinCount)
	return clamp(index, 0, frequencyBinCount)
}

function indexToFreq(index, spectrum) {
	var nyquist = sampleRate() / 2;
	return nyquist / spectrum.length * index;
};

function draw() {
	background(0);
	let spectrum = fft.analyze();
	noStroke(255);
	fill(0, 255, 0);

	// FIND MAXFREQUENCY -----------------------------------
	let startIndex = frequencyToIndex(window.PARAMS.FREQMIN, spectrum.length);
	var max = -Infinity;
	var index = -1;
	for (var i = startIndex; i < spectrum.length; i++) {
		if (spectrum[i] > max) {
			max = spectrum[i];
			index = i;
		}
	}
	if (max > window.PARAMS.THRESHOLD) {
		let f = indexToFreq(index, spectrum);

		if (window.PARAMS.FREQMIN < f && f <= window.PARAMS.FREQMAX) {
			document.querySelector("#debugfreq").innerHTML = f;
			var decodedChar = coder.freqToChar(f);
			console.log(decodedChar);
		}
	}
	//FIND MAXFREQUENCY -----------------------------------

	//DRAW PEAKS
	for (var i = 0; i < spectrum.length; i++) {
		let x = map(i, 0, spectrum.length, 0, width);
		let h = -height + map(spectrum[i], 0, 255, height, 0);
		rect(x, height, width / spectrum.length, h)
	}
	endShape();
}