
let inty;

onmessage = function (js) {
    if (js.data == 'start') {
        inty = setInterval(() => {
            postMessage('tick');
        }, 1000 / 60);
    } else {
        clearInterval(inty);
    }
}