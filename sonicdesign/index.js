import Analyzer from './src/executor.js';

const worker = new Worker("./worker.js");




function bootstrap(p) {
    let config = {
        alphabet: '^ABC123$',
        data: 'A',
        charDuration: 0.15,
        rampDuration: 0.06,
        freqMin: 18500,
        freqMax: 19000,
        freqError: 50,
        threshold: 0,
    }

    (async function () {
        var f = 0
        var ls = document.querySelector("#ls");
        var inh = document.querySelector("#intext");
        let listen = await fetch("./listen.json")
        let listenJson = await listen.json();
        let goo = await fetch("./googleassist.json")
        let gooJson = await goo.json();

        // if (f) {
        //     inh.textContent = " Chirping.. "         // f=1 sending
        //     ls.load(gooJson);
        //     f = 0;
        // } else {
        //     inh.textContent = " Picking up energy waves nearby.. "  // f=0 receiving
        //     ls.load(listenJson);
        //     f = 1;
        // }
    })();


    $('.bolt').each(function (e) {

        var bolt = $(this),
            div = $(this).children('div');

        bolt.addClass('animate');

        var tween = new TimelineMax({
            onComplete() {
                bolt.removeClass('animate');         
            }
        }).set(div, {
            rotation: 360
        }).to(div, .7, {
            y: 80,
            rotation: 370
        }).to(div, .6, {
            y: -140,
            rotation: 20
        }).to(div, .1, {
            rotation: -24,
            y: 80
        }).to(div, .8, {
            ease: Back.easeOut.config(1.6),
            rotation: 0,
            y: 0
        });

        function repeat() {
            setTimeout(() => {
                bolt.addClass('animate');
                tween.restart();                //TWEEN
            }, 400);
        }

    })


    // let analyzer = new Analyzer(p, config);

    // function cb(params, energy, success) {
    //     document.querySelector("p").innerHTML = params + ' - ' + energy + " - " + success;
    //     console.log("RECORDED", params, energy, success);
    // }

    // function switchF(state) {
    //     console.log("State :" + state)
    // }

    // p.setup = () => {
    //     analyzer.setup();
    // }

    // p.touchStarted = () => {
    //     p.getAudioContext().resume();
    // }

    // // p.draw = () => {
    // //     analyzer.draw();
    // // }

    // worker.addEventListener("message", (e) => {
    //     analyzer.draw();
    // })



    // activateButton.onclick = function () {
    //     analyzer.init(cb, switchF).then(() => {
    //         // p.loop()
    //         // analyzer.start()
    //     })
    // }

    // startButton.onclick = function () {
    //     analyzer.start()
    //     worker.postMessage("start");

    // }

    // stopButton.onclick = function () {
    //     analyzer.stop()
    //     worker.postMessage("stop");
    // }

}


new p5(bootstrap);
