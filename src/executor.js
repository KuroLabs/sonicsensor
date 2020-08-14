import Util from './utility';
import Sonic from '../vendor/sonic';


export default class Analyzer {
    constructor(p5, config) {
        this.p5 = p5;
        this.config = config;
        this.notify = null; //??
        this.killSwitch = false;
        this.receiveFstop = null;
        this.sendFstop = null;
        this.heartbeat = null;
        this.volumeOn = true;
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
        this.lastForceSchedule = null;
    }

    stopCycle() {
        return this.collector;
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
        console.log("[INFO] Mic: ", this.mic);
        this.fft = new p5.FFT();
        this.fft.setInput(this.mic);
        this.started = true;

        this.p5.loop();
    }


    setup() {
        this.p5.noLoop();
    }

    start() {
        this.killSwitch = false
        let songDuration = (this.config.charDuration) * 1000 * (this.config.data.length + 2) + 50
        console.log(songDuration)
        this.mic.start(() => {
            this.playSonic();
        });
    }

    stop() {
        this.queue.empty();
        this.killSwitch = true;
        this.mic.stop();
    }

    draw() {
        if (this.started) {

            const {
                freqMin,
                freqMax,
                freqError,
                threshold,
                alphabet,
                data
            } = this.config;

            var spectrum = [];
            if (!this.iamstopped) {
                spectrum = this.fft.analyze();
            }

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
                                    console.log(`[DEBUG] Energy :` + reqEnergy.join('*-*'))
                                    let success = reqEnergy.filter(x => x > 84).length >= Math.ceil(this.payload.length / 2)
                                    this.notify(this.payload, Math.max(...reqEnergy), success);

                                    if (success) {

                                        if (this.lastForceSchedule && this.iterator + 1 - this.lastForceSchedule <= 2) {
                                            this.alertUserVibrate(true);
                                            this.notify(this.payload, Math.max(...reqEnergy), success, "activateRed");
                                        } else {
                                            this.alertUserVibrate(false);
                                        }
                                        this.queue.enqueue(1);
                                        console.warn("[DEBUG] payload: ", this.payload);
                                        console.warn("[DEBUG] masterCache: ", this.masterCache);
                                        this.masterCache = {};
                                        this.payload = ""
                                        this.forceShedule(500, Math.max(...reqEnergy)); //hardcoded
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

    playSonic() {
        if (!this.killSwitch) { // switch for killing this loop

            if (this.songBuffer) {
                this.iamstopped = true;
                if (this.setTime && (this.iterator + 1 - this.lastForceSchedule) > 2) {
                    console.log("waited two cycles")
                    this.notify("true")
                    this.setTime = null;
                }
                this.song = this.audioContext.createBufferSource();
                this.song.buffer = this.songBuffer;
                this.song.loop = false;
                this.song.connect(this.audioContext.destination);
                this.song.start();
                this.switchF("Send");
                this.songPlay = true;
                this.song.onended = () => {
                    setTimeout(() => {
                        this.songPlay = false;

                        this.switchF("Receive");
                        this.mic.start(() => {
                            this.iamstopped = false;

                            if (!this.queue.isEmpty()) {
                                if (this.heartbeat === null || this.iterator >= this.heartbeat + 2) {
                                    this.queue.dequeue();
                                    this.heartbeat = this.iterator;
                                    this.alertUserAudio()
                                } else {
                                    this.queue.dequeue();
                                }

                            }
                            var newRandom = this.randomRecurse();
                            this.lastRandom = newRandom
                            this.receiveFstop = setTimeout(() => {
                                this.iterator += 1;
                                this.mic.stop();
                                this.playSonic();
                            }, newRandom);
                        });
                    }, 50)

                }
            } else {
                throw 'Initialization error'
            }
        }
    }

    alertUserVibrate(vibratehigh = false) {
        if (!this.volumeOn) {
            if (vibratehigh) {
                navigator.vibrate(300);
            } else {
                navigator.vibrate(100);
            }
        }
    }

    alertUserAudio() {
        if (this.volumeOn) {
            if (this.alertAudio) {
                this.alertAudio.play()
            } else {
                throw "Alert sound not loaded"
            }
        }
    }

    forceShedule() {
        if (this.receiveFstop) {
            if (this.songPlay) {
                this.song.stop()
            }
            clearTimeout(this.receiveFstop);
            this.setTime = 500;
            this.iterator += 1;
            this.lastForceSchedule = this.iterator;
        }
        if (!this.killSwitch) {
            this.playSonic();
        }
    }

    setVolumeOn(volumeOn) {
        this.volumeOn = volumeOn;
    }
}
