import Util from './utility';
import Sonic from '../vendor/sonic';


export default class Analyzer {
    constructor(p5, config) {
        this.p5 = p5;
        this.config = config;
        this.notify = null; //??
        // switch mic on and off
        this.micSwitch = false;
        // switch speaker on and off
        this.speakerSwitch = false;
        this.killSwitch = false;
        this.receiveFstop = null;
        this.heartbeat = null;
        this.lastRandom = 900;
        // Decoded String
        this.payload = "";
        this.iterator = 0;
        // Sound generated is recorded as Buffer
        this.queue = Util.queue();
        this.songBuffer = null;
        this.alertBuffer = null;
        this.freqRanges = null;
        this.masterCache = {};
    }

    async init(notify, switchF) {
        this.notify = notify;
        this.switchF = switchF;
        // encoding setup - record and store buffer
        this.sonic = new Sonic(this.config);

        const audioBuffer = this.sonic.send();
        audioBuffer.startRendering();
        audioBuffer.oncomplete = (e) => {
            this.songBuffer = e.renderedBuffer;
        }

        // decode setup
        this.freqRanges = this.getFreqRanges();
        this.audioContext = new window.AudioContext;
        this.p5.getAudioContext().resume();
        this.alertBuffer = await Util.loadSound(this.audioContext, "/assets/snapnotify.mp3");
        console.log(this.alertBuffer)
        // p5 
        this.mic = new p5.AudioIn();
        this.fft = new p5.FFT();
        this.fft.setInput(this.mic);
        this.started = false;
    }


    setup() {
        // let cnv = this.p5.createCanvas(1200, 600);
        this.p5.noLoop();
    }

    start() {
        this.killSwitch = false
        this.mic.start();
        let songDuration = (this.config.charDuration) * 1000 * (this.config.data.length + 2) + 50
        console.log(songDuration)
        this.callTimeout(songDuration, 900);
        // this.switchMic()
        // this.switchSpeaker()
    }

    draw() {

        if (this.started) {
            const { freqMin, freqMax, freqError, threshold, alphabet, data } = this.config;
            //SETUP FFT GRAPH
            // this.p5.background(0);
            // this.p5.noStroke();
            // this.p5.fill(240, 150, 150);
            let spectrum = this.fft.analyze(); //CRITICAL
            // //DRAW PEAKS
            // for (let i = 0; i < spectrum.length; i++) {
            //     let x = this.p5.map(i, 0, spectrum.length, 0, this.p5.width);
            //     let h = -this.p5.height + this.p5.map(spectrum[i], 0, 255, this.p5.height, 0);
            //     this.p5.rect(x, this.p5.height, this.p5.width / spectrum.length, h)
            // }
            // this.p5.endShape();


            // DECODE---------------
            let testEnergyArr = this.freqRanges.map((x) => {
                return this.fft.getEnergy(x[0], x[1])
            });

            //FIND MAX FREQ AND ITS INDEX
            let startIndex = Util.frequencyToIndex(this.p5.sampleRate(), freqMin, spectrum.length) - 10;
            let maxx = this.p5.max(spectrum.slice(startIndex))
            let index = spectrum.indexOf(maxx)

            //DECODE CHAR PROCESS
            if (maxx > threshold) {
                let f = Util.indexToFreq(this.p5.sampleRate(), index, spectrum);
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
                                    this.notify(this.payload, Math.max(...reqEnergy), success);
                                    if (success) {
                                        this.queue.enqueue(1);
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
        this.queue.empty();
        this.mic.stop()
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

    randomRecurse() {
        let newRand = Util.getRndInteger(3, 7) * 200;
        if (newRand !== this.lastRandom && Util.twoHundredBound(newRand, this.lastRandom))
            return newRand
        return this.randomRecurse();
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
                this.iterator += 1;
                this.lastRandom = this.randomRecurse();
                this.callTimeout(time1, this.lastRandom);
            }, time1 + time2);
        }
    }

    switchMic() {
        if (this.started) {
            this.started = false;
        } else {
            this.started = true;
            if (!this.queue.isEmpty()) {
                if (this.heartbeat === null || this.iterator >= this.heartbeat + 2) {
                    this.queue.dequeue();
                    this.heartbeat = this.iterator;
                    this.playAlert();
                }

            }

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
            } else {
                throw 'Ultra sonic waves'
            }
        }
    }

    playAlert() {
        if (this.alertBuffer) {
            const alertSource = this.audioContext.createBufferSource();
            alertSource.buffer = this.alertBuffer;
            alertSource.connect(this.audioContext.destination);
            alertSource.start();
        } else {
            throw "Alert sound not loaded"
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
