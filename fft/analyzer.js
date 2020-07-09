let mic, fft, coder

// Decoded String
let payload = "";

// Sound generated is recorded as Buffer
var songBuffer = null;

let started = false;

let mail;

function preRun(data) {
    let ssocket = new SonicSocket();
    const audioBuffer = ssocket.send(data);
    audioBuffer.startRendering().then(renderedBuffer => {
        songBuffer = renderedBuffer;
    }).catch(err => console.log("Render Failed" + err))
}

function clamp(value, min, max) {
    return min < max ?
        (value < min ? min : value > max ? max : value) :
        (value < max ? max : value > min ? min : value)
}

function bootstrap(cb) {
    mic = new p5.AudioIn()
    mic.start()
    fft = new p5.FFT(0.2);
    fft.setInput(mic);
    started = true;
    mail = cb;
    loop();
    // sound.amp(0.4);
}


function setup() {
    // CANVAS SETUP
    let cnv = createCanvas(1200, 600);
    //DECODER SETUP
    coder = new SonicCoder(window.PARAMS);
    noLoop();
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
    if (started) {
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

                // Monitors for payload
                if (decodedChar == "^") {
                    payload = "^";
                } else if (decodedChar == "$") {
                    if (stringSimilarity.compareTwoStrings(window.PARAMS.DATA, payload.slice(1)) >= 0.7) {    // Compare

                        // Vibrate here
                        console.log("Encoded String:", payload.slice(1));
                        mail(payload.slice(1));
                    }
                    payload = ""
                } else {
                    if (payload.indexOf("^") == 0 && payload.slice(-1) != decodedChar) {
                        payload += decodedChar;
                    }
                }
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

}
