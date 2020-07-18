class Analyzer {
    constructor(config) {
        getAudioContext().resume();
        this.config = config
        this.notify = null ; //??




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
        }).catch(err => console.log("Render Failed" + err))

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
        coder = new SonicCoder(window.PARAMS);
        noLoop();
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
        const {freqMin, freqMax, alphabet, freqErr } = this.config
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
        if (!this.killSwitch) {                    // switch for killing this loop
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
        if(this.receiveFstop){
            clearTimeout(this.receiveFstop);
            this.switchMic();
        }
        if(!this.killSwitch){
            this.callTimeout(time1, this.getRndInteger(3, 6) * 200);
        }
    }

    getRndInteger(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
}