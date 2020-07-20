class Sonic{
    constructor(config) {
        let params = config || {};
        this.freqMin = params.freqMin || 18500;
        this.freqMax = params.freqMax || 19500;
        this.freqError = params.freqError || 50;
        this.alphabet = params.alphabet || "^ABC123$"; //MUST INCLUDE startChar AND endChar
        this.startChar = this.alphabet[0];
        this.endChar = this.alphabet[this.alphabet.length-1];
        this.freqRange = this.freqMax - this.freqMin
        this.rampDuration = params.rampDuration || 0.07;
        this.charDuration = params.charDuration || 0.2;
        this.data = params.data || "B"

    }

    send(opt_callback) {
        // Surround the word with start and end characters.
        let input = this.startChar + this.data + this.endChar;
        // console.log(input+" "+this.charDuration+" "+this.rampDuration)
        // OfflineAudioContext for Buffer.
        const offlineCtx = new window.OfflineAudioContext(1 ,input.length * this.charDuration * 48000 ,48000 );

        // Use WAAPI to schedule the frequencies.
        for (let i = 0; i < input.length; i++) {
            let freq = this.charToFreq(input[i]);
            let time = offlineCtx.currentTime + this.charDuration * i;
            this.scheduleToneAt(freq, time, this.charDuration, offlineCtx);
        }

        // If specified, callback after roughly the amount of time it would have
        // taken to transmit the token.
        if (opt_callback) {
            var totalTime = this.charDuration * input.length;
            setTimeout(opt_callback, totalTime * 1000);
        }

        //Return AudioBuffer 
        return offlineCtx
    }

    scheduleToneAt(freq, startTime, duration, offlineCtx) {
        let gainNode = offlineCtx.createGain();
        // Gain => Merger
        // gainNode.gain.value = window.PARAMS.GAINVAL || 100;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(1, startTime + this.rampDuration); //change gain here
        gainNode.gain.setValueAtTime(1, startTime + duration - this.rampDuration);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
    
        gainNode.connect(offlineCtx.destination);
    
        let osc = offlineCtx.createOscillator();
        osc.frequency.value = freq;
        osc.connect(gainNode);
    
        osc.start(startTime);
        osc.stop(startTime + duration)        

    }

    charToFreq(char) {
        // Get the index of the character.
        let index = this.alphabet.indexOf(char);
        if (index == -1) {
            // If this character isn't in the alphabet, error out.
            console.error(char, 'is an invalid character.');
            index = this.alphabet.length - 1;
        }
        // Convert from index to frequency.
        let percent = index / this.alphabet.length;
        let freqOffset = Math.round(this.freqRange * percent);
        return this.freqMin + freqOffset;
    }

    freqToChar(freq) {
        // If the frequency is out of the range.
        if (!(this.freqMin <= freq && freq <= this.freqMax)) {
            // If it's close enough to the min, clamp it (and same for max).
            if ( freq < this.freqMin && (this.freqMin - freq) < this.freqError) {
                freq = this.freqMin;
            } else if (freq > this.freqMax && (freq - this.freqMax) < this.freqError) {
                freq = this.freqMax;
            } else {
                // Otherwise, report error.
                console.error(freq, 'is out of range.');
                return null;
            }
        }

        // Convert frequency to index to char.
        let percent = (freq - this.freqMin) / this.freqRange;
        let index = Math.round(this.alphabet.length * percent);
        return this.alphabet[index];        
    }
}