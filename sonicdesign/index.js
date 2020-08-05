import Analyzer from '../src/executor.js';

const worker = new Worker("../worker.js");

var listenJson;
var gooJson;
async function loadLottie() {
    let listen = await fetch("./listen.json")
    listenJson = await listen.json();
    let goo = await fetch("./googleassist.json")
    gooJson = await goo.json();
    console.log("hej monika")
}




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
        energyFilter: 115,
    }

    loadLottie().then(() => console.log("Loaded LottieFiles"))
    var addRule = function (selector, css) {
        let style = document.createElement("style")
        var sheet = document.head.appendChild(style).sheet;
        var propText = typeof css === "string" ? css : Object.keys(css).map(function (
            p) {
            return p + ":" + (p === "content" ? "'" + css[p] + "'" : css[p]);
        }).join(";");
        sheet.insertRule(selector + "{" + propText + "}", sheet.cssRules.length);
    };


    $(document).ready(function () {
        $('#pagepiling').pagepiling({
            scrollingSpeed: 300,
            navigation: false,
            keyboardScrolling: false,
        });
        console.log("heydcnmdbcn")





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



            // bolt.addClass('animate');      // Energy changes
            // tween.restart();                //TWEEN

        })

    })





    let analyzer = new Analyzer(p, config);

    function cb(params, energy, success) {

        console.log("RECORDED", params, energy, success);

        //flash
        bolt.addClass('animate');
        tween.restart();
        // Toggle screen
        if (energy > config.energyFilter) {
            addRule(".containblack::before", {
                opacity: "1"
            });
            document.querySelector("#energyid").innerHTML = energy;
            document.querySelector("#energyalert").innerHTML = `Energy greater than ${energy}. You are close to someone stepback`
        } else {
            addRule(".containblack::before", {
                opacity: "0"
            });
            document.querySelector("#energyid").innerHTML = energy;
            document.querySelector("#energyalert").innerHTML = `Energy less than ${energy}. Excellent! Keep up the distance`
        }
    }

    function switchF(state) {
        console.log("State :" + state)
        if (state === "Receive") {
            ls.load(listenJson);
            ls.style.visibility = "visible"
            // intext.textContent = " Chirping.. "
            // ls.load(gooJson);
        } else {
            ls.style.visibility = "hidden"
        }
    }

    p.setup = () => {
        analyzer.setup();
    }



    // p.touchStarted = () => {
    //     p.getAudioContext().resume();
    // }



    worker.addEventListener("message", (e) => {
        analyzer.draw();
    })

    document.querySelector(".circle").onclick = async () => {
        await analyzer.init(cb, switchF)
        analyzer.start()
        // worker.postMessage("start");

        // css fr start-button
        document.querySelectorAll(".fonts-social").forEach((el) => {
            el.classList.add("darkcolor")
        })
        document.querySelector(".circle").classList.add("animatepush");
        setTimeout(() => {
            addRule(".circle:before", {
                animation: "ripple 0.3s 1"
            });

            setTimeout(() => {
                document.querySelector(".circle").classList.add(
                    "scale-out-center");
                setTimeout(() => {
                    document.querySelector("#activate").innerHTML =
                        "<lottie-player src='./anime.json' speed='1' style='width: 300px; height: 300px;' autoplay> </lottie-player>";
                    setTimeout(() => {
                        $.fn.pagepiling.moveSectionDown();
                        setTimeout(() => {
                            document.querySelector("#activate").innerHTML = "<div class='tooltip'><div class='wrapperIcon play-id'><i class='fas fa-play animateClick controllIcons'></i></div><div class='wrapperIcon stop-id'><i class='fas fa-stop controllIcons'></i></div></div><lottie-player src='https://assets7.lottiefiles.com/packages/lf20_ydTi0b.json' id='bear'  background='transparent'  speed='1'  style='width: 300px; height: 300px;'  loop  autoplay></lottie-player>";
                            var toggleState = true;
                            document.querySelector(".tooltip").addEventListener("click", function (e) {
                                console.warn(e.target)
                                if (e.target.classList.contains("play-id") || e.target.classList.contains("fa-play")) {
                                    document.querySelector("#acttext").innerHTML = "Busy, listening and sending sonic energy waves"
                                    if (toggleState == true) {
                                        return;
                                    }
                                    if (document.querySelector(".fa-stop").classList.contains("animateClick")) {
                                        document.querySelector(".fa-stop").classList.remove("animateClick");
                                    }
                                    document.querySelector(".fa-play").classList.add("animateClick");
                                    bearAnimate(true);
                                    // Do anything for play
                                    toggleState = true;
                                } else if (e.target.classList.contains("stop-id") || e.target.classList.contains("fa-stop")) {
                                    document.querySelector("#acttext").innerHTML = "Sleeping......"
                                    if (toggleState == false) {
                                        return;
                                    }
                                    if (document.querySelector(".fa-play").classList.contains("animateClick")) {
                                        document.querySelector(".fa-play").classList.remove("animateClick");
                                    }
                                    document.querySelector(".fa-stop").classList.add("animateClick");
                                    bearAnimate(false);
                                    //Do anything to stop
                                    toggleState = false;
                                }
                            });

                            function bearAnimate(start) {
                                if (start) {
                                    document.querySelector("#bear").play();
                                    document.querySelector("#bear").setLooping(true);
                                } else {
                                    document.querySelector("#bear").setLooping(false);
                                }
                            }

                            document.querySelector("#acttext").innerHTML = "Busy, listening and sending sonic energy waves"
                            document.querySelectorAll(".fonts-social")
                                .forEach((el) => {
                                    el.classList
                                        .remove(
                                            "darkcolor"
                                        )
                                });

                        }, 700);
                    }, 2800)
                }, 200);
            }, 300);
        }, 200);

    }

    // stopButton.onclick = function () {
    //     analyzer.stop()
    //     worker.postMessage("stop");
    // }

}


new p5(bootstrap);
