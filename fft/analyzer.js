let mic, fft, coder,song

// switch mic on and off
let micSwitch = false;
let speakerSwitch = true ;

// Decoded String
let payload = "";

// Sound generated is recorded as Buffer
var songBuffer = null;

var freqRanges = null;

let started = false;

let mail;

function preload() {
}

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
    getAudioContext().resume();
    mic = new p5.AudioIn()
    // mic.start()
    fft = new p5.FFT();
    fft.setInput(mic);
    mail = cb;
    started = true;
    setTimeout(() => {
        loop();
    }, 2000);
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
        noStroke();
        fill(240, 150, 150);
        let spectrum = fft.analyze();
        // FIND MAXFREQUENCY -----------------------------------
        
        // GET ENERGY ARR
        let testEnergyArr = freqRanges.map((x) => {
            return fft.getEnergy(x[0], x[1])
        });
        console.log(testEnergyArr);
        
        
        let startIndex = frequencyToIndex(window.PARAMS.FREQMIN, spectrum.length) - 10;
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

            if (window.PARAMS.FREQMIN - f < window.PARAMS.FREQERR && f <= window.PARAMS.FREQMAX) {
                document.querySelector("#debugfreq").innerHTML = f;
                var decodedChar = coder.freqToChar(f);
                // Monitors for payload
                if (decodedChar == "^") {
                    payload = "^";
                } else if (decodedChar == "$") {
                    if (minOperations(window.PARAMS.DATA, payload) >= 0.6) {    // Compare
                        // Vibrate here
                        console.log("Encoded String:", payload.slice(1));
                        mail(payload.slice(1));
                    }
                    payload = ""
                } else {
                    if (payload.length == 0 || payload.slice(-1) != decodedChar) {
                        payload += decodedChar;
                        if (minOperations(window.PARAMS.DATA, payload) >= 0.6){
                            // Vibrate here
                            console.log("Encoded String:", payload);
                            mail(payload);
                            payload = ""
                        }
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

const getFreqRanges = () => {
    var RANGE = window.PARAMS.FREQMAX - window.PARAMS.FREQMIN;
    var INTERVAL = (RANGE / window.PARAMS.ALPHABET.length);
    var FREQRANGES = [];
    for (var i = 0; i < window.PARAMS.ALPHABET.length; i++) {
        tempArr = [];
        if (i == 0) {
            tempArr.push(window.PARAMS.FREQMIN - PARAMS.FREQERR);
            tempArr.push(PARAMS.FREQMIN + (Math.round((INTERVAL * 10) / 2) / 10));
            FREQRANGES.push(tempArr);
        } else if (i == 1) {
            tempArr.push(FREQRANGES[i - 1][1])
            tempArr.push(tempArr[0] + INTERVAL);
            FREQRANGES.push(tempArr);
        } else {
            tempArr.push(FREQRANGES[i - 1][1]);
            tempArr.push(tempArr[0] + INTERVAL);
            FREQRANGES.push(tempArr);
        }
    }
    return FREQRANGES;
}
freqRanges = getFreqRanges();

// // Prototype Switching Model 
// const callTimeout = (time1,time2) => {
//     if(!killSwitch){                    // switch for killing this loop
//         funca()
//         setTimeout(funcb(),time1)
//         setTimeout(funtion(){
//             //randomize time1 & time2
//             callTimeout(time1,time2)
//         },time1+time2)
//     }
// }




//REFERENCE
// ^ - 18050.1 - 18156.2  (106.1)
// A - 18156.3            (122.4)
// B - 18268.8
// C - 18381.3
// 1 - 18493.8
// 2 - 18606.3
// 3 - 18718.8
// $ - 18831.3