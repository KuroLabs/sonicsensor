class Analyzer {
    constructor(config) {
        this.config = config;
        this.notify = null; //??

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

    }

    init(notify,switchF) {
        this.notify = notify;
        this.switchF = switchF;
        // encoding setup - record and store buffer
        this.sonic = new Sonic(this.config);
        const audioBuffer = this.sonic.send();
        audioBuffer.startRendering();
        audioBuffer.oncomplete = (e) => {
            this.songBuffer = e.renderedBuffer;
            console.log(this.songBuffer)
        }
        // decode setup
        this.freqRanges = this.getFreqRanges();

        getAudioContext().resume();
        this.audioContext = new window.AudioContext;
        // p5 setup
        this.mic = new p5.AudioIn();
        this.fft = new p5.FFT();
        this.fft.setInput(this.mic);
        this.started = true;
        loop();
    }

    setup() {
        // CANVAS SETUP
        // let cnv = createCanvas(1200, 600);
        //DECODER SETUP
        // this.coder = new SonicCoder(this.config);
        noLoop();
    }

    start() {
        this.killSwitch = false
        let songDuration = (this.config.charDuration) * 1000 * (this.config.data.length + 2) + 50
        console.log(songDuration)
        this.callTimeout(songDuration,900);
        // this.switchMic()
        // this.switchSpeaker()
    }

    draw() {

        const {freqMin, freqMax, freqError, threshold, alphabet, data} = this.config;

        if (this.started) {
            //SETUP FFT GRAPH
            // background(0);
            // noStroke();
            // fill(240, 150, 150);
            let spectrum = this.fft.analyze(); //CRITICAL
            //DRAW PEAKS
            // for (let i = 0; i < spectrum.length; i++) {
            //     let x = map(i, 0, spectrum.length, 0, width);
            //     let h = -height + map(spectrum[i], 0, 255, height, 0);
            //     rect(x, height, width / spectrum.length, h)
            // }
            // endShape();


            // DECODE---------------
            let testEnergyArr = this.freqRanges.map((x) => {
                return this.fft.getEnergy(x[0], x[1])
            });

            //FIND MAX FREQ AND ITS INDEX
            let startIndex = Util.frequencyToIndex(freqMin, spectrum.length) - 10;
            let maxx = max(spectrum.slice(startIndex))
            let index = spectrum.indexOf(maxx)

            //DECODE CHAR PROCESS
            if (maxx > threshold) {
                let f = Util.indexToFreq(index, spectrum);
                if (freqMin - f < freqError && f <= freqMax) {

                    //DEBUG ************
                    document.querySelector("#debugfreq").innerHTML = f;
                    //DEBUG ************

                    let decodedChar = this.sonic.freqToChar(f);
                    let energy = testEnergyArr[alphabet.indexOf(decodedChar)]

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
                            } else if (decodedChar == "$" || this.payload.length == 0 || this.payload.slice(-1) != decodedChar) {
                                this.payload += decodedChar;
                                if (Util.minOperations("^" + data + "$", this.payload) >= 0.6) {
                                    console.log("[DEBUG] masterCache - BEFORE: ", this.masterCache)
                                    let reqEnergy = Object.keys(this.masterCache).map(char => this.masterCache[char]['energy']);
                                    let success = reqEnergy.filter(x => x > 100).length >= Math.ceil(this.payload.length / 2)
                                    this.notify(this.payload,Math.max(...reqEnergy),success);
                                    if (success) {

                                        console.warn("[DEBUG] payload: ", this.payload);
                                        console.warn("[DEBUG] masterCache: ", this.masterCache);
                                        this.masterCache = {};
                                        this.payload = ""
                                        this.forceShedule(500); //hardcoded
                                    }
                                }       
                                if (decodedChar == "$") {
                                    this.payload = ""
                                }                         
                            }
                            
                        }
                    }
                }
            }
            // DECODE---------------
        }
    }

    stop() {
        this.killSwitch = true
    }

    getFreqRanges() {
        const {
            freqMin,
            freqMax,
            alphabet,
            freqError
        } = this.config
        const RANGE = freqMax - freqMin;
        const INTERVAL = (RANGE / alphabet.length);
        const FREQRANGES = [];
        for (let i = 0; i < alphabet.length; i++) {
            let tempArr = [];
            if (i == 0) {
                tempArr.push(freqMin - freqError);
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

    callTimeout(time1, time2) {
        if (!this.killSwitch) { // switch for killing this loop
            this.switchSpeaker();
            this.switchF("Send");
            setTimeout(() => {
                this.switchSpeaker();
                this.switchMic();
                this.switchF("Receive");
            }, time1);

            this.receiveFstop = setTimeout(() => {
                this.switchMic();
                this.callTimeout(time1, Util.getRndInteger(3, 6) * 200);
            }, time1 + time2);
        }
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
                this.song = this.audioContext.createBufferSource();
                this.song.buffer = this.songBuffer;
                this.song.loop = false
                this.song.connect(this.audioContext.destination);
                this.song.start();
            }
        }
    }

    forceShedule(time1) {
        if (this.receiveFstop) {
            clearTimeout(this.receiveFstop);
            this.switchMic();
        }
        if (!this.killSwitch) {
            this.callTimeout(time1, Util.getRndInteger(3, 6) * 200);
        }
    }


}