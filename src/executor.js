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
        this.sendFstop = null;
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
            window.songBuffer = this.songBuffer;
        }

        // decode setup
        this.freqRanges = this.getFreqRanges();
        this.audioContext = new window.AudioContext;
        this.p5.getAudioContext().resume();
        // this.alertBuffer = await Util.loadSound(this.audioContext, "/assets/snapnotify.mp3");
        this.alertAudio = new Audio();
        let src1 = document.createElement("source");
        src1.type = "audio/mpeg";
        src1.src = "/assets/snapnotify.mp3";
        this.alertAudio.appendChild(src1);
        // p5 
        this.mic = new p5.AudioIn();
        console.log(this.alertAudio, this.mic)
        this.fft = new p5.FFT();
        this.fft.setInput(this.mic);
        this.started = true;

        this.p5.loop();
    }


    setup() {
        let cnv = this.p5.createCanvas(600, 600);
        this.p5.noLoop();
    }

    start() {
        this.killSwitch = false
        this.successStack = []
        this.successCount = 0
        let songDuration = (this.config.charDuration) * 1000 * (this.config.data.length + 2) + 50
        console.log(songDuration)
        this.mic.start(() => {
            this.playSonic();
        });
        // this.switchSpeaker()
    }

    draw() {
        if (this.started) {


            const { freqMin, freqMax, freqError, threshold, alphabet, data } = this.config;
            // SETUP FFT lGRAPH
            this.p5.background(0);
            this.p5.noStroke();
            this.p5.fill(240, 150, 150);
            var spectrum = [];
            if (!this.iamstopped) {
                spectrum = this.fft.analyze();
            }
            if (spectrum.every(x => x == 0)) {
                lol.textContent = "0"
            } else {
                lol.textContent = "222222222222222222220"
            };


            //CRITICAL
            //DRAW PEAKS
            for (let i = 0; i < spectrum.length; i++) {
                let x = this.p5.map(i, 0, spectrum.length, 0, this.p5.width);
                let h = -this.p5.height + this.p5.map(spectrum[i], 0, 255, this.p5.height, 0);
                this.p5.rect(x, this.p5.height, this.p5.width / spectrum.length, h)
            }
            this.p5.endShape();


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
                                console.log(Util.minOperations("^" + data + "$", this.payload));
                                if (Util.minOperations("^" + data + "$", this.payload) >= 0.6) {
                                    console.log("[DEBUG] masterCache - BEFORE: ", this.masterCache)

                                    let reqEnergy = Object.keys(this.masterCache).map(char => this.masterCache[char]['energy']);
                                    console.log(`Energy :` + reqEnergy.join('*-*'))

                                    let success = reqEnergy.filter(x => x > 130).length >= Math.ceil(this.payload.length / 2)
                                    document.querySelector("h2").innerHTML = "Analysis" + JSON.stringify(this.masterCache);

                                    this.notify(this.payload, Math.max(...reqEnergy), success);
                                    if (success) {
                                        this.queue.enqueue(1);
                                        document.querySelector("h1").innerHTML = "Enqued : " + this.queue.length()
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
        this.successStack = []
        this.successCount = 0
        this.killSwitch = true
        this.mic.stop()
    }

    testSuccess(success) {
        this.successStack.push(success)
        this.successCount += (success ? 1 : 0)
        if (this.successStack.length < 3) {
            return success
        } else {
            if (this.successStack.length > 3) {
                this.successCount -= (this.successStack[0] ? 1 : 0)
                this.successStack = this.successStack.slice(1)
            }
            return (this.successCount > 1)
        }
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
        let newRand = Util.getRndInteger(2, 7) * 200;
        if (newRand !== this.lastRandom && Util.twoHundredBound(newRand, this.lastRandom))
            return newRand
        return this.randomRecurse();
    }

    // callTimeout(time1, time2) {
    //     if (!this.killSwitch) { // switch for killing this loop

    //         this.switchSpeaker();
    //         this.switchF("Send");
    //         statusElem.textContent = "Status : Send"
    //         console.log("Status : Send")
    //         this.sendFstop = setTimeout(() => {
    //             this.switchSpeaker();
    //             this.switchMic();
    //             statusElem.textContent = "Status : Receive"
    //             console.log("Status : Receive", this.iterator)
    //             this.switchF("Receive");
    //         }, time1);

    //         this.receiveFstop = setTimeout(() => {
    //             this.switchMic();
    //             this.iterator += 1;
    //             this.lastRandom = this.randomRecurse();
    //             this.callTimeout(time1, this.lastRandom);
    //         }, time1 + time2);
    //     }
    // }

    // switchMic() {
    //     if (this.micSwitch) {
    //         this.mic.mute();
    //         this.micSwitch = false;
    //     } else {
    //         this.micSwitch = true;
    //         this.mic.unmute();
    //         if (!this.queue.isEmpty()) {
    //             if (this.heartbeat === null || this.iterator >= this.heartbeat + 2) {
    //                 this.queue.dequeue();
    //                 this.heartbeat = this.iterator;
    //                 this.playAlert();
    //             } else {
    //                 this.queue.dequeue();
    //             }

    //         }

    //     }
    // }

    // switchSpeaker() {
    //     if (this.speakerSwitch) {
    //         this.song.stop();
    //         this.speakerSwitch = false;
    //     } else {
    //         this.speakerSwitch = true;

    //     }
    // }

    playSonic() {
        if (!this.killSwitch) { // switch for killing this loop

            if (this.songBuffer) {
                this.mic.stop();
                this.iamstopped = true;
                muter.textContent = "Supposed to be muted"
                this.song = this.audioContext.createBufferSource();
                this.song.buffer = this.songBuffer;
                this.song.loop = false;
                this.song.connect(this.audioContext.destination);
                this.song.start();
                statusElem.textContent = "Status : Send"
                this.switchF("Send");
                this.songPlay = true;
                this.song.onended = () => {
                    this.songPlay = false;
                    statusElem.textContent = "Status : Receive"
                    this.switchF("Receive");
                    this.mic.start(() => {
                        this.iamstopped = false;
                        muter.textContent = "SUp boi"

                        if (!this.queue.isEmpty()) {
                            if (this.heartbeat === null || this.iterator >= this.heartbeat + 2) {
                                this.queue.dequeue();
                                this.heartbeat = this.iterator;
                                this.playAlert();
                            } else {
                                this.queue.dequeue();
                            }

                        }
                        var newRandom = this.randomRecurse();
                        this.lastRandom = newRandom
                        this.receiveFstop = setTimeout(() => {
                            this.iterator += 1;
                            this.playSonic();
                        }, newRandom);
                    });
                }
            } else {
                throw 'Initialization error'
            }
        }

    }

    playAlert() {
        if (this.alertAudio) {
            // const alertSource = this.audioContext.createBufferSource();
            // alertSource.buffer = this.alertBuffer;
            // alertSource.connect(this.audioContext.destination);
            // alertSource.start();
            this.alertAudio.play()
        } else {
            throw "Alert sound not loaded"
        }
    }

    forceShedule(time1) {
        if (this.receiveFstop) {
            if (this.songPlay) {
                this.song.stop()
            }
            clearTimeout(this.receiveFstop);
            this.iterator += 1;
        }
        if (!this.killSwitch) {
            this.playSonic();
        }
    }


}
