/**
 * A simple sonic encoder/decoder for [a-z0-9] => frequency (and back).
 * A way of representing characters with frequency.
 */
var ALPHABET = '^ABC123$';

function SonicCoder(params) {
	params = params || {};
	this.freqMin = params.freqMin || 18500;
	this.freqMax = params.freqMax || 19500;
	this.freqError = params.freqError || 50;
	this.alphabet = params.alphabet || ALPHABET; //MUST INCLUDE startChar AND endChar
	this.startChar = this.alphabet[0];
	this.endChar = this.alphabet[this.alphabet.length-1];
	this.freqRange = this.freqMax - this.freqMin
	
}

/**
 * Given a character, convert to the corresponding frequency.
 */
SonicCoder.prototype.charToFreq = function(char) {
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
};

/**
 * Given a frequency, convert to the corresponding character.
 */
SonicCoder.prototype.freqToChar = function(freq) {
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
};