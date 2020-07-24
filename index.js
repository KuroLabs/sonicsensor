
import Analyzer from './src/executor.js';


function bootstrap(p) {
    let config = {
        alphabet: '^ABC123$',
        data: 'B',
        charDuration: 0.15,
        rampDuration: 0.06,
        freqMin: 18500,
        freqMax: 19000,
        freqError: 50,
        threshold: 0,
    }


    let analyzer = new Analyzer(p, config);

    function cb(params, energy, success) {
        console.log("RECORDED", params, energy, success);
    }

    function switchF(state) {
        console.log("State :" + state)
    }

    p.setup = () => {
        analyzer.setup();
    }

    p.touchStarted = () => {
        p.getAudioContext().resume();
    }

    p.draw = () => {
        analyzer.draw();
    }

    activateButton.onclick = function () {
        analyzer.init(cb, switchF).then(() => {
            p.loop()
            // analyzer.start()
        })
    }

    startButton.onclick = function () {
        analyzer.start()
    }

    stopButton.onclick = function () {
        analyzer.stop()
    }

}


new p5(bootstrap);






