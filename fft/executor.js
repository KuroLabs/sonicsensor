class Analyzer {
    constructor(config) {
        getAudioContext().resume();
        this.config = config
        this.notify = null; //??

        //sonic-coder
        this.coder = null;

        // switch mic on and off
        this.micSwitch = false;
        // switch speaker on and off
        this.speakerSwitch = false;
        this.killSwitch = false;
        this.receiveFstop = null;

        // Decoded String
        this.payload = "";

        // Sound generated is recorded as Buffer
        this.songBuffer = null;

        this.freqRanges = null;

        this.masterCache = {};

        let mail;
    }

    init(payload, callback) {
        this.notify = callback;
        // encoding setup - record and store buffer
        const ssocket = new SonicSocket(this.config);
        const audioBuffer = ssocket.send(payload);
        audioBuffer.startRendering().then((renderedBuffer) => {
            this.songBuffer = renderedBuffer;
        }).catch(err => console.log("[ERR] Render Failed" + err))

        // decode setup
        this.freqRanges = this.getFreqRanges()

        // p5 setup
        this.mic = new p5.AudioIn()
        this.fft = new p5.FFT();
        this.fft.setInput(this.mic);
        this.started = true;
        loop();
    }

    setup() {
        // CANVAS SETUP
        let cnv = createCanvas(1200, 600);
        //DECODER SETUP
        this.coder = new SonicCoder(window.PARAMS);
        noLoop();
    }

    draw() {
        if (this.started) {
            //SETUP FFT GRAPH
            background(0);
            noStroke();
            fill(240, 150, 150);
            let spectrum = this.fft.analyze();
            //DRAW PEAKS
            for (var i = 0; i < spectrum.length; i++) {
                let x = map(i, 0, spectrum.length, 0, width);
                let h = -height + map(spectrum[i], 0, 255, height, 0);
                rect(x, height, width / spectrum.length, h)
            }
            endShape();


            // DECODE---------------
            let testEnergyArr = this.freqRanges.map((x) => {
                return fft.getEnergy(x[0], x[1])
            });

            //FIND MAX FREQ AND ITS INDEX
            let startIndex = this.frequencyToIndex(window.PARAMS.FREQMIN, spectrum.length) - 10;
            let maxx = max(spectrum.slice(startIndex))
            let index = spectrum.indexOf(maxx)

            //DECODE CHAR PROCESS
            if (maxx > window.PARAMS.THRESHOLD) {
                let f = this.indexToFreq(index, spectrum);
                if (window.PARAMS.FREQMIN - f < window.PARAMS.FREQERR && f <= window.PARAMS.FREQMAX) {

                    //DEBUG ************
                    document.querySelector("#debugfreq").innerHTML = f;
                    //DEBUG ************

                    var decodedChar = this.coder.freqToChar(f);
                    var energy = testEnergyArr[window.PARAMS.ALPHABET.indexOf(decodedChar)]

                    if (energy <= 160 && energy >= 70) {
                        if (decodedChar in this.masterCache) {
                            this.masterCache[decodedChar]['energy'] = Math.max(energy, this.masterCache[decodedChar]['energy'])
                            this.masterCache[decodedChar]['count'] += 1
                        } else {
                            this.masterCache[decodedChar] = {}
                            this.masterCache[decodedChar]['energy'] = energy
                            this.masterCache[decodedChar]['count'] = 1
                        }

                        if (this.masterCache[decodedChar]['count'] >= 2) {
                            // Monitors for payload
                            if (decodedChar == "^") {
                                this.payload = "^";
                            } else if (decodedChar == "$") {
                                this.payload += decodedChar;
                                if (minOperations("^" + window.PARAMS.DATA + "$", this.payload) >= 0.6) { // Compare
                                    console.log("[DEBUG] masterCache - BEFORE: ", this.masterCache)
                                    if (Object.keys(this.masterCache).map(char => this.masterCache[char]['energy'])
                                        .filter(x => x > 100).length >= Math.ceil(this.payload.length / 2)) {

                                        console.warn("[DEBUG] payload: ", this.payload);
                                        console.warn("[DEBUG] masterCache: ", this.masterCache);

                                        this.masterCache = {};
                                        mail(this.payload); ////////////MAIL
                                        this.payload = ""
                                        this.forceShedule(480); //hardcoded
                                    }
                                }
                                this.payload = ""
                            } else {
                                if (this.payload.length == 0 || this.payload.slice(-1) != decodedChar) {
                                    this.payload += decodedChar;
                                    if (minOperations("^" + window.PARAMS.DATA + "$", this.payload) >= 0.6) {
                                        // VIBRATE HERE
                                        console.log("[DEBUG] masterCache - BEFORE: ", this.masterCache)
                                        if (Object.keys(this.masterCache).map(char => this.masterCache[char]['energy'])
                                            .filter(x => x > 100).length >= Math.ceil(this.payload.length / 2)) {

                                            console.warn("[DEBUG] payload-1: ", this.payload);
                                            console.warn("[DEBUG] masterCache-1: ", this.masterCache);

                                            this.masterCache = {};
                                            mail(this.payload); ////////////MAIL
                                            this.payload = ""
                                            this.forceShedule(480); // hardcoded
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            // DECODE---------------
        }
    }

    clamp(value, min, max) {
        return min < max ?
            (value < min ? min : value > max ? max : value) :
            (value < max ? max : value > min ? min : value)
    }

    frequencyToIndex(frequency, frequencyBinCount) {
        let nyquist = sampleRate() / 2
        let index = Math.round(frequency / nyquist * frequencyBinCount)
        return this.clamp(index, 0, frequencyBinCount)
    }

    indexToFreq(index, spectrum) {
        let nyquist = sampleRate() / 2;
        return nyquist / spectrum.length * index;
    }

    getFreqRanges() {
        const {
            freqMin,
            freqMax,
            alphabet,
            freqErr
        } = this.config
        const RANGE = freqMax - freqMin;
        const INTERVAL = (RANGE / alphabet.length);
        const FREQRANGES = [];
        for (let i = 0; i < alphabet.length; i++) {
            tempArr = [];
            if (i == 0) {
                tempArr.push(freqMin - freqErr);
                tempArr.push(freqMin + (Math.round((INTERVAL * 10) / 2) / 10));
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

    switchMic() {
        if (this.micSwitch) {
            this.micSwitch = false;
            this.mic.stop();
        } else {
            this.micSwitch = true;
            this.mic.start()
        }
    }

    switchSpeaker() {
        if (this.speakerSwitch) {
            this.song.stop();
            this.speakerSwitch = false;
        } else {
            this.speakerSwitch = true;
            if (this.songBuffer) {
                this.song = audioContext.createBufferSource();
                this.song.buffer = this.songBuffer;
                this.song.connect(audioContext.destination);
                this.song.start();
            }
        }
    }

    setKillSwitch(flag) {
        this.killSwitch = flag
    }

    callTimeout(time1, time2) {
        if (!this.killSwitch) { // switch for killing this loop
            this.switchSpeaker();
            setTimeout(function () {
                this.switchSpeaker();
                this.switchMic();
            }, time1);

            this.receiveFstop = setTimeout(function () {
                this.switchMic();
                this.callTimeout(time1, this.getRndInteger(3, 6) * 200);
            }, time1 + time2);
        }
    }

    forceShedule(time1) {
        if (this.receiveFstop) {
            clearTimeout(this.receiveFstop);
            this.switchMic();
        }
        if (!this.killSwitch) {
            this.callTimeout(time1, this.getRndInteger(3, 6) * 200);
        }
    }

    getRndInteger(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
}