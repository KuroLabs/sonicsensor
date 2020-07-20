class Util{
    
    // This is an implementation of edit distance using dp: equal priority each character and operations
    static minOperations(parent, child) {

        //  Early case of identification
        if (parent == child)
            return 1;
    
        //If child not in range with parent string, not evaluated
        if (child.length < Math.ceil(0.5*parent.length) || child.length >= Math.ceil(1.5*parent.length))
            return 0;    
    
        const [row, col] = [parent.length + 1, child.length + 1];
        const memo = new Array(row).fill().map(() => new Array(col).fill(-1));
        
        const getEditDistance = (str1, str2, i, j, memo) => {
            // return memorized value right away if edit distance 
            // has been calculated
            if (memo[i][j] > -1) {
                return memo[i][j];
            }
            
            if (i === 0) {
                memo[i][j] = j;
                return j;
            }
            if (j === 0) {
                memo[i][j] = i;
                return i;
            }
            if (str1[i - 1] === str2[j - 1]) {
                memo[i][j] = getEditDistance(str1, str2, i - 1, j - 1, memo);
                return memo[i][j]
            }
            memo[i][j] = 1 + Math.min(
                getEditDistance(str1, str2, i - 1, j - 1, memo),
                getEditDistance(str1, str2, i, j - 1, memo),
                getEditDistance(str1, str2, i - 1, j, memo)
            ) ;
            return memo[i][j];
        }
        
        return 1 - (getEditDistance(parent, child, parent.length, child.length, memo)/parent.length)
    }

    static getRndInteger(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    static clamp(value, min, max) {
        return min < max ?
            (value < min ? min : value > max ? max : value) :
            (value < max ? max : value > min ? min : value)
    }

    static frequencyToIndex(frequency, frequencyBinCount) {
        let nyquist = sampleRate() / 2;
        let index = Math.round(frequency / nyquist * frequencyBinCount);
        return this.clamp(index, 0, frequencyBinCount);
    }

    
    static indexToFreq(index, spectrum) {
        let nyquist = sampleRate() / 2;
        return nyquist / spectrum.length * index;
    }
}
