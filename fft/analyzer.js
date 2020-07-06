let mic, fft

function preload() {
    //sound = loadSound('sound.wav');
}

function setup() {
    let cnv = createCanvas(1500, 800);
    mic = new p5.AudioIn()
    mic.start()
    fft = new p5.FFT(0.2);
    fft.setInput(mic);
    // sound.amp(0.4);
}

function draw() {
    background(0);

    let spectrum = fft.analyze();
    noStroke(255);
    fill(0, 255, 0);
    for (var i = 0; i < spectrum.length; i++) {
        let x = map(i, 0, spectrum.length, 0, width);
        let h = -height + map(spectrum[i], 0, 255, height, 0);
        rect(x, height, width / spectrum.length, h)
    }
    endShape();
}