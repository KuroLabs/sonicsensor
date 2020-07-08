let mic, fft

function preload() {
    //sound = loadSound('sound.wav');
}

function clamp(value, min, max) {
    return min < max
        ? (value < min ? min : value > max ? max : value)
        : (value < max ? max : value > min ? min : value)
}


function setup() {
    let cnv = createCanvas(1500, 800);
    mic = new p5.AudioIn()
    mic.start()
    fft = new p5.FFT(0.2);
    fft.setInput(mic);
    // sound.amp(0.4);
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
    let op = frequencyToIndex(18000, spectrum.length);
    var max = -Infinity;
    var index = -1;
    for (var i = op; i < spectrum.length; i++) {
        if (spectrum[i] > max) {
            max = spectrum[i];
            index = i;
        }
    }
    // Only care about sufficiently tall peaks.   
    // The peak threshold is in terms of 0
    if (max > 0) {
        let f = indexToFreq(index, spectrum);
        if (f > 18000 && f <= 19000) {
            document.querySelector("p").innerHTML = f;
        }
    }

    for (var i = 0; i < spectrum.length; i++) {
        let x = map(i, 0, spectrum.length, 0, width);
        let h = -height + map(spectrum[i], 0, 255, height, 0);
        rect(x, height, width / spectrum.length, h)
    }
    endShape();
}