! function () {
    "use strict";

    function e(e) {
        var s = 0;
        if (71 !== e[s++] || 73 !== e[s++] || 70 !== e[s++] || 56 !== e[s++] || 56 != (e[s++] + 1 & 253) || 97 !== e[s++])
            throw "Invalid GIF 87a/89a header.";
        var i = e[s++] | e[s++] << 8,
            n = e[s++] | e[s++] << 8,
            a = e[s++],
            r = a >> 7,
            h = 1 << (7 & a) + 1;
        e[s++];
        e[s++];
        var o = null;
        r && (o = s, s += 3 * h);
        var d = !0,
            l = [],
            c = 0,
            m = null,
            u = 0,
            p = null;
        for (this.width = i, this.height = n; d && s < e.length;)
            switch (e[s++]) {
                case 33:
                    switch (e[s++]) {
                        case 255:
                            if (11 !== e[s] || 78 == e[s + 1] && 69 == e[s + 2] && 84 == e[s + 3] && 83 == e[s + 4] && 67 == e[s + 5] && 65 == e[s + 6] && 80 == e[s + 7] && 69 == e[s + 8] && 50 == e[s + 9] && 46 == e[s + 10] && 48 == e[s + 11] && 3 == e[s + 12] && 1 == e[s + 13] && 0 == e[s + 16])
                                s += 14, p = e[s++] | e[s++] << 8, s++;
                            else
                                for (s += 12;;) {
                                    if (0 === (C = e[s++]))
                                        break;
                                    s += C
                                }
                            break;
                        case 249:
                            if (4 !== e[s++] || 0 !== e[s + 4])
                                throw "Invalid graphics extension block.";
                            var _ = e[s++];
                            c = e[s++] | e[s++] << 8, m = e[s++], 0 == (1 & _) && (m = null), u = _ >> 2 & 7, s++;
                            break;
                        case 254:
                            for (;;) {
                                if (0 === (C = e[s++]))
                                    break;
                                s += C
                            }
                            break;
                        default:
                            throw "Unknown graphic control label: 0x" + e[s - 1].toString(16)
                    }
                    break;
                case 44:
                    var f = e[s++] | e[s++] << 8,
                        v = e[s++] | e[s++] << 8,
                        g = e[s++] | e[s++] << 8,
                        y = e[s++] | e[s++] << 8,
                        b = e[s++],
                        w = b >> 6 & 1,
                        k = 1 << (7 & b) + 1,
                        x = o,
                        B = !1;
                    if (b >> 7) {
                        B = !0;
                        x = s, s += 3 * k
                    }
                    var E = s;
                    for (s++;;) {
                        var C = e[s++];
                        if (0 === C)
                            break;
                        s += C
                    }
                    l.push({
                        x: f,
                        y: v,
                        width: g,
                        height: y,
                        has_local_palette: B,
                        palette_offset: x,
                        data_offset: E,
                        data_length: s - E,
                        transparent_index: m,
                        interlaced: !!w,
                        delay: c,
                        disposal: u
                    });
                    break;
                case 59:
                    d = !1;
                    break;
                default:
                    throw "Unknown gif block: 0x" + e[s - 1].toString(16)
            }
        this.numFrames = function () {
            return l.length
        }, this.loopCount = function () {
            return p
        }, this.frameInfo = function (e) {
            if (e < 0 || e >= l.length)
                throw "Frame index out of range.";
            return l[e]
        }, this.decodeAndBlitFrameRGBA = function (s, n) {
            var a = this.frameInfo(s),
                r = a.width * a.height,
                h = new Uint8Array(r);
            t(e, a.data_offset, h, r);
            var o = a.palette_offset,
                d = a.transparent_index;
            null === d && (d = 256);
            var l = a.width,
                c = i - l,
                m = l,
                u = 4 * (a.y * i + a.x),
                p = 4 * ((a.y + a.height) * i + a.x),
                _ = u,
                f = 4 * c;
            !0 === a.interlaced && (f += 4 * i * 7);
            for (var v = 8, g = 0, y = h.length; g < y; ++g) {
                var b = h[g];
                if (0 === m && (m = l, (_ += f) >= p && (f = 4 * c + 4 * i * (v - 1), _ = u + (l + c) * (v << 1), v >>= 1)), b === d)
                    _ += 4;
                else {
                    var w = e[o + 3 * b],
                        k = e[o + 3 * b + 1],
                        x = e[o + 3 * b + 2];
                    n[_++] = w, n[_++] = k, n[_++] = x, n[_++] = 255
                }
                --m
            }
        }
    }

    function t(e, t, s, i) {
        for (var n = e[t++], a = 1 << n, r = a + 1, h = r + 1, o = n + 1, d = (1 << o) - 1, l = 0, c = 0, m = 0, u = e[t++], p = new Int32Array(4096), _ = null;;) {
            for (; l < 16 && 0 !== u;)
                c |= e[t++] << l, l += 8, 1 === u ? u = e[t++] : --u;
            if (l < o)
                break;
            var f = c & d;
            if (c >>= o, l -= o, f !== a) {
                if (f === r)
                    break;
                for (var v = f < h ? f : _, g = 0, y = v; y > a;)
                    y = p[y] >> 8, ++g;
                var b = y;
                if (m + g + (v !== f ? 1 : 0) > i)
                    return void console.log("Warning, gif stream longer than expected.");
                s[m++] = b;
                var w = m += g;
                for (v !== f && (s[m++] = b), y = v; g--;)
                    y = p[y], s[--w] = 255 & y, y >>= 8;
                null !== _ && h < 4096 && (p[h++] = _ << 8 | b, h >= d + 1 && o < 12 && (++o, d = d << 1 | 1)), _ = f
            } else
                h = r + 1, d = (1 << (o = n + 1)) - 1, _ = null
        }
        return m !== i && console.log("Warning, gif stream shorter than expected."), s
    }
    var s = function () {
        const t = document.createElement("template");
        t.innerHTML = `\n<style>\n  canvas {\n    position: absolute;\n  }\n\n  @keyframes spinner {\n    to {transform: rotate(360deg);}\n  }\n\n  .spinner:before {\n    content: '';\n    box-sizing: border-box;\n    position: absolute;\n    top: 50%;\n    left: 50%;\n    width: 20px;\n    height: 20px;\n    margin-top: -10px;\n    margin-left: -10px;\n    border-radius: 50%;\n    border-top: 2px solid #999;\n    border-right: 2px solid transparent;\n    animation: spinner .6s linear infinite;\n  }\n</style>\n<canvas></canvas>\n<div class="spinner"></spinner>\n`;
        class s extends HTMLElement {
            static get observedAttributes() {
                return ["src", "frame", "size", "speed", "play", "swipe", "repeat", "bounce", "direction"]
            }
            constructor() {
                super(), this._frames = [], this._delays = [], this._frame = 0, this._decoded = -1, this._rendered = -1, this._speed = .5, this._size = "auto", this._swipe = !0, this._repeat = !0, this._bounce = !1, this._prerender = !1, this._direction = 1, this._onload = null, this.pausePlaybackBound = this.pausePlayback.bind(this), this.moveBound = this.move.bind(this), this.resumePlaybackBound = this.resumePlayback.bind(this), this.prerenderFramesBound = this.prerenderFrames.bind(this), this.playLoopBound = this.playLoop.bind(this);
                const e = this.attachShadow({
                    mode: "open"
                });
                e.appendChild(document.importNode(t.content, !0)), this._spinner = e.querySelector(".spinner"), this._canvas = e.querySelector("canvas"), this._ctx = this._canvas.getContext("2d")
            }
            connectedCallback() {
                this.style.display = "inline-block", this.style.position = "relative", this.style.overflow = "hidden", this.style.cursor = "col-resize", this.addEventListener("touchstart", this.pausePlaybackBound, !1), this.addEventListener("touchmove", this.moveBound, !1), this.addEventListener("touchend", this.resumePlaybackBound, !1), this.addEventListener("mouseenter", this.pausePlaybackBound, !1), this.addEventListener("mousemove", this.moveBound, !1), this.addEventListener("mouseleave", this.resumePlaybackBound, !1)
            }
            disconnectedCallback() {
                this.removeEventListener("touchstart", this.pausePlaybackBound, !1), this.removeEventListener("touchmove", this.moveBound, !1), this.removeEventListener("touchend", this.resumePlaybackBound, !1), this.removeEventListener("mouseenter", this.pausePlaybackBound, !1), this.removeEventListener("mousemove", this.moveBound, !1), this.removeEventListener("mouseleave", this.resumePlaybackBound, !1)
            }
            attributeChangedCallback(e, t, s) {
                t !== s && (this[e] = s)
            }
            _handleBoolean(e, t) {
                this["_" + e] = t = null !== t && void 0 !== t, t ? this.setAttribute(e, "") : this.removeAttribute(e)
            }
            get src() {
                return this._src
            }
            set src(e) {
                this._src = e, this.load(e)
            }
            get frame() {
                return this._frame
            }
            set frame(e) {
                this._frame = parseInt(e), this.displayFrame(this._frames, this._frame)
            }
            get size() {
                return this._size
            }
            set size(e) {
                this._size = e
            }
            get speed() {
                return this._speed
            }
            set speed(e) {
                this._speed = parseFloat(e)
            }
            get swipe() {
                return this._swipe
            }
            set swipe(e) {
                this._swipe = e
            }
            get play() {
                return this._play
            }
            set play(e) {
                this._handleBoolean("play", e)
            }
            get repeat() {
                return this._repeat
            }
            set repeat(e) {
                this._repeat = parseFloat(e)
            }
            get bounce() {
                return this._bounce
            }
            set bounce(e) {
                this._handleBoolean("bounce", e)
            }
            get direction() {
                return this._direction
            }
            set direction(e) {
                this._direction = parseInt(e)
            }
            get prerender() {
                return this._prerender
            }
            set prerender(e) {
                this._prerender = e
            }
            get onload() {
                return this._onload
            }
            set onload(e) {
                this._onload = e
            }
            move(e) {
                e.preventDefault();
                var t = this.getBoundingClientRect(),
                    s = (e.clientX - t.left) / t.width;
                this.frame = Math.round((this._frames.length - 1) * s)
            }
            load(t) {
                this.dispatchEvent(new CustomEvent("gif-loading", {
                    bubbles: !0,
                    composed: !0,
                    detail: t
                })), this._spinner.style.display = "block", this._frames = [];
                var s = {
                    method: "GET",
                    mode: "cors",
                    cache: "default"
                };
                fetch(t, s).then(e => e.arrayBuffer()).then(e => new Uint8Array(e)).then(t => new e(t)).then(e => this.process(e)).then(() => this._spinner.style.display = "none")
            }
            process(e) {
                this._gif = e, this._canvas.width = e.width, this._canvas.height = e.height;
                var t = e.width / e.height,
                    s = this.clientWidth / this.clientHeight;
                switch (this._canvas.style.top = 0, this._canvas.style.left = 0, this._size) {
                    case "auto":
                        this.style.width = e.width + "px", this.style.height = e.height + "px";
                        break;
                    case "cover":
                        t > s ? (i = this.clientHeight * t, n = this.clientHeight, this._canvas.style.top = 0, this._canvas.style.left = -(i - this.clientWidth) / 2 + "px") : (i = this.clientWidth, n = this.clientWidth / t, this._canvas.style.top = -(n - this.clientHeight) / 2 + "px", this._canvas.style.left = 0), this._canvas.style.width = i + "px", this._canvas.style.height = n + "px";
                        break;
                    case "contain":
                        var i,
                            n;
                        t > s ? (i = this.clientWidth, n = this.clientWidth / t, this._canvas.style.top = (this.clientHeight - n) / 2 + "px", this._canvas.style.left = 0) : (i = this.clientHeight * t, n = this.clientHeight, this._canvas.style.top = 0, this._canvas.style.left = (this.clientWidth - i) / 2 + "px"), this._canvas.style.width = i + "px", this._canvas.style.height = n + "px";
                        break;
                    case "stretch":
                        this._canvas.style.width = "100%", this._canvas.style.height = "100%"
                }
                var a = e.numFrames();
                this._decoded = -1, this._delays = new Array(a), this._frames = new Array(a), this._frame < 0 && (this._frame = this._frames.length + this._frame);
                var r = new CustomEvent("gif-loaded", {
                    bubbles: !0,
                    composed: !0,
                    detail: e
                });
                this.dispatchEvent(r), this._onload && this._onload(r), this._play ? this.start() : this.displayFrame(this._frames, this._frame), this._prerender && requestIdleCallback(this.prerenderFramesBound)
            }
            start() {
                this.playing = !0, this.playAnimation(this._frames, this._frame)
            }
            stop() {
                this.playing = !1
            }
            pausePlayback(e) {
                this.paused = !0
            }
            resumePlayback(e) {
                this.paused = !1, this.playing && this.playAnimation(this._frames, this._frame)
            }
            playLoop(e) {
                this.rafHandle = requestAnimationFrame(this.playLoopBound), this._rendered != this._frame && this._frames[this._frame] && (this._rendered = this._frame, this._ctx.putImageData(this._frames[this._frame], 0, 0))
            }
            playAnimation(e, t) {
                0 !== e.length && (this.renderFrame(t), setTimeout(() => {
                    if (!this.paused) {
                        var e = this.frame + this._direction;
                        e < 0 ? this._bounce ? (this._direction = 1, e = 1) : e = this._frames.length - 1 : e >= this._frames.length && (this._bounce ? (this._direction = -1, e = this._frames.length - 2) : e = 0), this.frame = e, this.playAnimation(this._frames, this._frame)
                    }
                }, this._delays[t] * (1 / this._speed)))
            }
            next() {
                ++this.frame >= this._frames.length && (this.frame = 0), this.render(this.frame)
            }
            displayFrame(e, t) {
                0 !== e.length && (t >= e.length && (t = e.length - 1), t < 0 && (t += e.length), this.renderFrame(t), this._rendered != t && requestAnimationFrame(() => {
                    this._ctx.putImageData(this._frames[t], 0, 0), this._rendered = t, this.dispatchEvent(new CustomEvent("gif-frame", {
                        bubbles: !0,
                        composed: !0,
                        detail: t
                    }))
                }))
            }
            renderFrame(e) {
                for (; this._decoded < e;) {
                    var t = this._decoded + 1,
                        s = this._gif.frameInfo(t),
                        i = this._ctx.createImageData(this._gif.width, this._gif.height);
                    t > 0 && s.disposal < 2 && i.data.set(new Uint8ClampedArray(this._frames[t - 1].data)), this._gif.decodeAndBlitFrameRGBA(t, i.data), this._frames[t] = i, this._delays[t] = 10 * s.delay, this._decoded = t
                }
            }
            prerenderFrames(e) {
                for (; e.timeRemaining() > 0 && this._decoded < this._frames.length - 1;)
                    this.renderFrame(this._decoded + 1);
                this._decoded < this._frames.length - 1 && requestIdleCallback(this.prerenderBound)
            }
        }
        window.customElements.define("gif-player", s)
    };
    window.requestIdleCallback = window.requestIdleCallback || function (e) {
        var t = Date.now();
        return setTimeout(function () {
            e({
                didTimeout: !1,
                timeRemaining: function () {
                    return Math.max(0, 50 - (Date.now() - t))
                }
            })
        }, 1)
    }, window.cancelIdleCallback = window.cancelIdleCallback || function (e) {
        clearTimeout(e)
    }, window.WebComponents && window.WebComponents.ready ? s() : window.addEventListener("WebComponentsReady", s)
}();
//# sourceMappingURL=gif-player.es6.js.map
