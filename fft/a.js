activateButton.onclick = function () {
    var config = {
        alphabet: '^ABC123$',
        data: 'B',
        charDuration: 0.15,
        rampDuration: 0.06,
        freqMin: 18500,
        freqMax: 19000,
        freqError: 50,
        threshold: 0,
    }
    var sonic = new Sonic(config);
    const audioBuffer = sonic.send();
    audioBuffer.startRendering();
    audioBuffer.oncomplete = (e) => {
        songBuffer = e.renderedBuffer;
        sendWaveToPost(songBuffer);

    }

    function sendWaveToPost(buffer) {
        console.log("hit")
        var worker = new Worker('rworker.js');

        // initialize the new worker
        worker.postMessage({
            command: 'init',
            config: {
                sampleRate: 48000
            }
        });

        // callback for `exportWAV`
        worker.onmessage = function (e) {

            blob = e.data;
            var url = (window.URL || window.webkitURL).createObjectURL(blob);
            console.log(url);
            var download_link = document.getElementById("download_link");
            download_link.href = url;
            download_link.download = "hai.wav";
        };

        // send the channel data from our buffer to the worker
        worker.postMessage({
            command: 'record',
            buffer: [
                buffer.getChannelData(0),
                buffer.getChannelData(1)

            ]
        });

        worker.postMessage({
            command: 'exportWAV',
            type: 'audio/wav'
        });

    }
}
