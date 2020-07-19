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

let analyzer = new Analyzer(config);

function cb(params) {
    console.log("RECORDED", params);
}

function switchF(state) {
    console.log("State :"+state)
}

function setup() {
    analyzer.setup();
}

// function draw() {
//     analyzer.draw();
// }

activateButton.onclick = function () {
    analyzer.init(cb,switchF);
}

startButton.onclick = function () {
    analyzer.start()
}

stopButton.onclick = function () {
    analyzer.stop()
}