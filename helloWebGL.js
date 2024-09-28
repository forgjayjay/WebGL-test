"use strict";
const canvas = document.getElementById("pretty-bg");

if (canvas) {
    canvas.width = canvas.clientWidth, canvas.height = canvas.clientHeight;
    let e = {
        SIM_RESOLUTION: 256,
        DYE_RESOLUTION: 512,
        DENSITY_DISSIPATION: .99,
        VELOCITY_DISSIPATION: .98,
        PRESSURE_DISSIPATION: .8,
        PRESSURE_ITERATIONS: 20,
        CURL: 10,
        SPLAT_RADIUS: .1,
        SHADING: !0,
        COLORFUL: !1,
        PAUSED: !1,
        BACK_COLOR: {
            r: 0,
            g: 0,
            b: 0
        },
        TRANSPARENT: !0
    };

    function pointerPrototype() {
        this.id = -1, this.x = 0, this.y = 0, this.dx = 0, this.dy = 0, this.down = !1, this.moved = !1, this.color = [30, 0, 300]
    }
    let n = [],
        r = [];
    n.push(new pointerPrototype);
    const {
        gl: t,
        ext: i
    } = getWebGLContext(canvas);

    function getWebGLContext(e) {
        const n = {
            alpha: !0,
            depth: !1,
            stencil: !1,
            antialias: !1,
            preserveDrawingBuffer: !1
        };
        let r = e.getContext("webgl2", n);
        const t = !!r;
        let i, o;
        t || (r = e.getContext("webgl", n) || e.getContext("experimental-webgl", n)), t ? (r.getExtension("EXT_color_buffer_float"), o = r.getExtension("OES_texture_float_linear")) : (i = r.getExtension("OES_texture_half_float"), o = r.getExtension("OES_texture_half_float_linear")), r.clearColor(0, 0, 0, 1);
        const a = t ? r.HALF_FLOAT : i.HALF_FLOAT_OES;
        let u, v, l;
        return t ? (u = getSupportedFormat(r, r.RGBA16F, r.RGBA, a), v = getSupportedFormat(r, r.RG16F, r.RG, a), l = getSupportedFormat(r, r.R16F, r.RED, a)) : (u = getSupportedFormat(r, r.RGBA, r.RGBA, a), v = getSupportedFormat(r, r.RGBA, r.RGBA, a), l = getSupportedFormat(r, r.RGBA, r.RGBA, a)), {
            gl: r,
            ext: {
                formatRGBA: u,
                formatRG: v,
                formatR: l,
                halfFloatTexType: a,
                supportLinearFiltering: o
            }
        }
    }

    function getSupportedFormat(e, n, r, t) {
        if (!supportRenderTextureFormat(e, n, r, t)) switch (n) {
            case e.R16F:
                return getSupportedFormat(e, e.RG16F, e.RG, t);
            case e.RG16F:
                return getSupportedFormat(e, e.RGBA16F, e.RGBA, t);
            default:
                return null
        }
        return {
            internalFormat: n,
            format: r
        }
    }

    function supportRenderTextureFormat(e, n, r, t) {
        let i = e.createTexture();
        e.bindTexture(e.TEXTURE_2D, i), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MIN_FILTER, e.NEAREST), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MAG_FILTER, e.NEAREST), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE), e.texImage2D(e.TEXTURE_2D, 0, n, 4, 4, 0, r, t, null);
        let o = e.createFramebuffer();
        return e.bindFramebuffer(e.FRAMEBUFFER, o), e.framebufferTexture2D(e.FRAMEBUFFER, e.COLOR_ATTACHMENT0, e.TEXTURE_2D, i, 0), e.checkFramebufferStatus(e.FRAMEBUFFER) == e.FRAMEBUFFER_COMPLETE
    }

    function clamp01(e) {
        return Math.min(Math.max(e, 0), 1)
    }

    function isMobile() {
        return /Mobi|Android/i.test(navigator.userAgent)
    }
    isMobile() && (e.DYE_RESOLUTION = 128, e.SHADING = !1), i.supportLinearFiltering || (e.SHADING = !1);
    class o {
        constructor(e, n) {
            if (this.uniforms = {}, this.program = t.createProgram(), t.attachShader(this.program, e), t.attachShader(this.program, n), t.linkProgram(this.program), !t.getProgramParameter(this.program, t.LINK_STATUS)) throw t.getProgramInfoLog(this.program);
            const r = t.getProgramParameter(this.program, t.ACTIVE_UNIFORMS);
            for (let e = 0; e < r; e++) {
                const n = t.getActiveUniform(this.program, e).name;
                this.uniforms[n] = t.getUniformLocation(this.program, n)
            }
        }
        bind() {
            t.useProgram(this.program)
        }
    }

    function compileShader(e, n) {
        const r = t.createShader(e);
        if (t.shaderSource(r, n), t.compileShader(r), !t.getShaderParameter(r, t.COMPILE_STATUS)) throw t.getShaderInfoLog(r);
        return r
    }
    const a = compileShader(t.VERTEX_SHADER, "\n    precision highp float;\n\n    attribute vec2 aPosition;\n    varying vec2 vUv;\n    varying vec2 vL;\n    varying vec2 vR;\n    varying vec2 vT;\n    varying vec2 vB;\n    uniform vec2 texelSize;\n\n    void main () {\n        vUv = aPosition * 0.5 + 0.5;\n        vL = vUv - vec2(texelSize.x, 0.0);\n        vR = vUv + vec2(texelSize.x, 0.0);\n        vT = vUv + vec2(0.0, texelSize.y);\n        vB = vUv - vec2(0.0, texelSize.y);\n        gl_Position = vec4(aPosition, 0.0, 1.0);\n    }\n"),
        u = compileShader(t.FRAGMENT_SHADER, "\n    precision mediump float;\n    precision mediump sampler2D;\n\n    varying highp vec2 vUv;\n    uniform sampler2D uTexture;\n    uniform float value;\n\n    void main () {\n        gl_FragColor = value * texture2D(uTexture, vUv);\n    }\n"),
        v = compileShader(t.FRAGMENT_SHADER, "\n    precision mediump float;\n\n    uniform vec4 color;\n\n    void main () {\n        gl_FragColor = color;\n    }\n"),
        l = compileShader(t.FRAGMENT_SHADER, "\n    precision highp float;\n    precision highp sampler2D;\n\n    varying vec2 vUv;\n    uniform sampler2D uTexture;\n    uniform float aspectRatio;\n\n    #define SCALE 25.0\n\n    void main () {\n        vec2 uv = floor(vUv * SCALE * vec2(aspectRatio, 1.0));\n        float v = mod(uv.x + uv.y, 2.0);\n        v = v * 0.1 + 0.8;\n        gl_FragColor = vec4(vec3(v), 1.0);\n    }\n"),
        f = compileShader(t.FRAGMENT_SHADER, "\n    precision highp float;\n    precision highp sampler2D;\n\n    varying vec2 vUv;\n    uniform sampler2D uTexture;\n\n    void main () {\n        vec3 C = texture2D(uTexture, vUv).rgb;\n        float a = max(C.r, max(C.g, C.b));\n        gl_FragColor = vec4(C, a);\n    }\n"),
        c = compileShader(t.FRAGMENT_SHADER, "\n    precision highp float;\n    precision highp sampler2D;\n\n    varying vec2 vUv;\n    varying vec2 vL;\n    varying vec2 vR;\n    varying vec2 vT;\n    varying vec2 vB;\n    uniform sampler2D uTexture;\n    uniform vec2 texelSize;\n\n    void main () {\n        vec3 L = texture2D(uTexture, vL).rgb;\n        vec3 R = texture2D(uTexture, vR).rgb;\n        vec3 T = texture2D(uTexture, vT).rgb;\n        vec3 B = texture2D(uTexture, vB).rgb;\n        vec3 C = texture2D(uTexture, vUv).rgb;\n\n        float dx = length(R) - length(L);\n        float dy = length(T) - length(B);\n\n        vec3 n = normalize(vec3(dx, dy, length(texelSize)));\n        vec3 l = vec3(0.0, 0.0, 1.0);\n\n        float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);\n        C.rgb *= diffuse;\n\n        float a = max(C.r, max(C.g, C.b));\n        gl_FragColor = vec4(C, a);\n    }\n"),
        s = compileShader(t.FRAGMENT_SHADER, "\n    precision highp float;\n    precision highp sampler2D;\n\n    varying vec2 vUv;\n    uniform sampler2D uTarget;\n    uniform float aspectRatio;\n    uniform vec3 color;\n    uniform vec2 point;\n    uniform float radius;\n\n    void main () {\n        vec2 p = vUv - point.xy;\n        p.x *= aspectRatio;\n        vec3 splat = exp(-dot(p, p) / radius) * color;\n        vec3 base = texture2D(uTarget, vUv).xyz;\n        gl_FragColor = vec4(base + splat, 1.0);\n    }\n"),
        m = compileShader(t.FRAGMENT_SHADER, "\n    precision highp float;\n    precision highp sampler2D;\n\n    varying vec2 vUv;\n    uniform sampler2D uVelocity;\n    uniform sampler2D uSource;\n    uniform vec2 texelSize;\n    uniform vec2 dyeTexelSize;\n    uniform float dt;\n    uniform float dissipation;\n\n    vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {\n        vec2 st = uv / tsize - 0.5;\n\n        vec2 iuv = floor(st);\n        vec2 fuv = fract(st);\n\n        vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);\n        vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);\n        vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);\n        vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);\n\n        return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);\n    }\n\n    void main () {\n        vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;\n        gl_FragColor = dissipation * bilerp(uSource, coord, dyeTexelSize);\n        gl_FragColor.a = 1.0;\n    }\n"),
        d = compileShader(t.FRAGMENT_SHADER, "\n    precision highp float;\n    precision highp sampler2D;\n\n    varying vec2 vUv;\n    uniform sampler2D uVelocity;\n    uniform sampler2D uSource;\n    uniform vec2 texelSize;\n    uniform float dt;\n    uniform float dissipation;\n\n    void main () {\n        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;\n        gl_FragColor = dissipation * texture2D(uSource, coord);\n        gl_FragColor.a = 1.0;\n    }\n"),
        g = compileShader(t.FRAGMENT_SHADER, "\n    precision mediump float;\n    precision mediump sampler2D;\n\n    varying highp vec2 vUv;\n    varying highp vec2 vL;\n    varying highp vec2 vR;\n    varying highp vec2 vT;\n    varying highp vec2 vB;\n    uniform sampler2D uVelocity;\n\n    void main () {\n        float L = texture2D(uVelocity, vL).x;\n        float R = texture2D(uVelocity, vR).x;\n        float T = texture2D(uVelocity, vT).y;\n        float B = texture2D(uVelocity, vB).y;\n\n        vec2 C = texture2D(uVelocity, vUv).xy;\n        if (vL.x < 0.0) { L = -C.x; }\n        if (vR.x > 1.0) { R = -C.x; }\n        if (vT.y > 1.0) { T = -C.y; }\n        if (vB.y < 0.0) { B = -C.y; }\n\n        float div = 0.5 * (R - L + T - B);\n        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);\n    }\n"),
        p = compileShader(t.FRAGMENT_SHADER, "\n    precision mediump float;\n    precision mediump sampler2D;\n\n    varying highp vec2 vUv;\n    varying highp vec2 vL;\n    varying highp vec2 vR;\n    varying highp vec2 vT;\n    varying highp vec2 vB;\n    uniform sampler2D uVelocity;\n\n    void main () {\n        float L = texture2D(uVelocity, vL).y;\n        float R = texture2D(uVelocity, vR).y;\n        float T = texture2D(uVelocity, vT).x;\n        float B = texture2D(uVelocity, vB).x;\n        float vorticity = R - L - T + B;\n        gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);\n    }\n"),
        h = compileShader(t.FRAGMENT_SHADER, "\n    precision highp float;\n    precision highp sampler2D;\n\n    varying vec2 vUv;\n    varying vec2 vL;\n    varying vec2 vR;\n    varying vec2 vT;\n    varying vec2 vB;\n    uniform sampler2D uVelocity;\n    uniform sampler2D uCurl;\n    uniform float curl;\n    uniform float dt;\n\n    void main () {\n        float L = texture2D(uCurl, vL).x;\n        float R = texture2D(uCurl, vR).x;\n        float T = texture2D(uCurl, vT).x;\n        float B = texture2D(uCurl, vB).x;\n        float C = texture2D(uCurl, vUv).x;\n\n        vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));\n        force /= length(force) + 0.0001;\n        force *= curl * C;\n        force.y *= -1.0;\n\n        vec2 vel = texture2D(uVelocity, vUv).xy;\n        gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);\n    }\n"),
        T = compileShader(t.FRAGMENT_SHADER, "\n    precision mediump float;\n    precision mediump sampler2D;\n\n    varying highp vec2 vUv;\n    varying highp vec2 vL;\n    varying highp vec2 vR;\n    varying highp vec2 vT;\n    varying highp vec2 vB;\n    uniform sampler2D uPressure;\n    uniform sampler2D uDivergence;\n\n    vec2 boundary (vec2 uv) {\n        return uv;\n        // uncomment if you use wrap or repeat texture mode\n        // uv = min(max(uv, 0.0), 1.0);\n        // return uv;\n    }\n\n    void main () {\n        float L = texture2D(uPressure, boundary(vL)).x;\n        float R = texture2D(uPressure, boundary(vR)).x;\n        float T = texture2D(uPressure, boundary(vT)).x;\n        float B = texture2D(uPressure, boundary(vB)).x;\n        float C = texture2D(uPressure, vUv).x;\n        float divergence = texture2D(uDivergence, vUv).x;\n        float pressure = (L + R + B + T - divergence) * 0.25;\n        gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);\n    }\n"),
        R = compileShader(t.FRAGMENT_SHADER, "\n    precision mediump float;\n    precision mediump sampler2D;\n\n    varying highp vec2 vUv;\n    varying highp vec2 vL;\n    varying highp vec2 vR;\n    varying highp vec2 vT;\n    varying highp vec2 vB;\n    uniform sampler2D uPressure;\n    uniform sampler2D uVelocity;\n\n    vec2 boundary (vec2 uv) {\n        return uv;\n        // uv = min(max(uv, 0.0), 1.0);\n        // return uv;\n    }\n\n    void main () {\n        float L = texture2D(uPressure, boundary(vL)).x;\n        float R = texture2D(uPressure, boundary(vR)).x;\n        float T = texture2D(uPressure, boundary(vT)).x;\n        float B = texture2D(uPressure, boundary(vB)).x;\n        vec2 velocity = texture2D(uVelocity, vUv).xy;\n        velocity.xy -= vec2(R - L, T - B);\n        gl_FragColor = vec4(velocity, 0.0, 1.0);\n    }\n"),
        x = (() => (t.bindBuffer(t.ARRAY_BUFFER, t.createBuffer()), t.bufferData(t.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), t.STATIC_DRAW), t.bindBuffer(t.ELEMENT_ARRAY_BUFFER, t.createBuffer()), t.bufferData(t.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), t.STATIC_DRAW), t.vertexAttribPointer(0, 2, t.FLOAT, !1, 0, 0), t.enableVertexAttribArray(0), e => {
            t.bindFramebuffer(t.FRAMEBUFFER, e), t.drawElements(t.TRIANGLES, 6, t.UNSIGNED_SHORT, 0)
        }))();
    let E, S, D, y, A, _, F, b, U;
    const L = new o(a, u),
        w = new o(a, v),
        C = new o(a, l),
        I = new o(a, f),
        B = new o(a, c),
        P = new o(a, s),
        N = new o(a, i.supportLinearFiltering ? d : m),
        O = new o(a, g),
        M = new o(a, p),
        G = new o(a, h),
        X = new o(a, T),
        z = new o(a, R);

    function initFramebuffers() {
        let n = getResolution(e.SIM_RESOLUTION),
            r = getResolution(e.DYE_RESOLUTION);
        E = n.width, S = n.height, D = r.width, y = r.height;
        const o = i.halfFloatTexType,
            a = i.formatRGBA,
            u = i.formatRG,
            v = i.formatR;
        A = createDoubleFBO(2, D, y, a.internalFormat, a.format, o, i.supportLinearFiltering ? t.LINEAR : t.NEAREST), _ = createDoubleFBO(0, E, S, u.internalFormat, u.format, o, i.supportLinearFiltering ? t.LINEAR : t.NEAREST), F = createFBO(4, E, S, v.internalFormat, v.format, o, t.NEAREST), b = createFBO(5, E, S, v.internalFormat, v.format, o, t.NEAREST), U = createDoubleFBO(6, E, S, v.internalFormat, v.format, o, t.NEAREST)
    }

    function getResolution(e) {
        let n = t.drawingBufferWidth / t.drawingBufferHeight;
        n < 1 && (n = 1 / n);
        let r = Math.round(e * n),
            i = Math.round(e);
        return t.drawingBufferWidth > t.drawingBufferHeight ? {
            width: r,
            height: i
        } : {
            width: i,
            height: r
        }
    }

    function createFBO(e, n, r, i, o, a, u) {
        t.activeTexture(t.TEXTURE0 + e);
        let v = t.createTexture();
        t.bindTexture(t.TEXTURE_2D, v), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MIN_FILTER, u), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MAG_FILTER, u), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_S, t.CLAMP_TO_EDGE), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_T, t.CLAMP_TO_EDGE), t.texImage2D(t.TEXTURE_2D, 0, i, n, r, 0, o, a, null);
        let l = t.createFramebuffer();
        return t.bindFramebuffer(t.FRAMEBUFFER, l), t.framebufferTexture2D(t.FRAMEBUFFER, t.COLOR_ATTACHMENT0, t.TEXTURE_2D, v, 0), t.viewport(0, 0, n, r), t.clear(t.COLOR_BUFFER_BIT), {
            texture: v,
            fbo: l,
            texId: e
        }
    }

    function createDoubleFBO(e, n, r, t, i, o, a) {
        let u = createFBO(e, n, r, t, i, o, a),
            v = createFBO(e + 1, n, r, t, i, o, a);
        return {
            get read() {
                return u
            },
            get write() {
                return v
            },
            swap() {
                let e = u;
                u = v, v = e
            }
        }
    }
    initFramebuffers();
    let H = Date.now();

    function update() {
        resizeCanvas(), input(), e.PAUSED || step(.016), render(null), requestAnimationFrame(update)
    }

    function input() {
        r.length > 0 && multipleSplats(r.pop());
        for (let e = 0; e < n.length; e++) {
            const r = n[e];
            r.moved && (splat(r.x, r.y, r.dx, r.dy, r.color), r.moved = !1)
        }
        if (e.COLORFUL && H + 100 < Date.now()) {
            H = Date.now();
            for (let e = 0; e < n.length; e++) {
                n[e].color = generateColor()
            }
        }
    }

    function step(n) {
        t.disable(t.BLEND), t.viewport(0, 0, E, S), M.bind(), t.uniform2f(M.uniforms.texelSize, 1 / E, 1 / S), t.uniform1i(M.uniforms.uVelocity, _.read.texId), x(b.fbo), G.bind(), t.uniform2f(G.uniforms.texelSize, 1 / E, 1 / S), t.uniform1i(G.uniforms.uVelocity, _.read.texId), t.uniform1i(G.uniforms.uCurl, b.texId), t.uniform1f(G.uniforms.curl, e.CURL), t.uniform1f(G.uniforms.dt, n), x(_.write.fbo), _.swap(), O.bind(), t.uniform2f(O.uniforms.texelSize, 1 / E, 1 / S), t.uniform1i(O.uniforms.uVelocity, _.read.texId), x(F.fbo), L.bind();
        let r = U.read.texId;
        t.activeTexture(t.TEXTURE0 + r), t.bindTexture(t.TEXTURE_2D, U.read.texture), t.uniform1i(L.uniforms.uTexture, r), t.uniform1f(L.uniforms.value, e.PRESSURE_DISSIPATION), x(U.write.fbo), U.swap(), X.bind(), t.uniform2f(X.uniforms.texelSize, 1 / E, 1 / S), t.uniform1i(X.uniforms.uDivergence, F.texId), r = U.read.texId, t.uniform1i(X.uniforms.uPressure, r), t.activeTexture(t.TEXTURE0 + r);
        for (let n = 0; n < e.PRESSURE_ITERATIONS; n++) t.bindTexture(t.TEXTURE_2D, U.read.texture), x(U.write.fbo), U.swap();
        z.bind(), t.uniform2f(z.uniforms.texelSize, 1 / E, 1 / S), t.uniform1i(z.uniforms.uPressure, U.read.texId), t.uniform1i(z.uniforms.uVelocity, _.read.texId), x(_.write.fbo), _.swap(), N.bind(), t.uniform2f(N.uniforms.texelSize, 1 / E, 1 / S), i.supportLinearFiltering || t.uniform2f(N.uniforms.dyeTexelSize, 1 / E, 1 / S), t.uniform1i(N.uniforms.uVelocity, _.read.texId), t.uniform1i(N.uniforms.uSource, _.read.texId), t.uniform1f(N.uniforms.dt, n), t.uniform1f(N.uniforms.dissipation, e.VELOCITY_DISSIPATION), x(_.write.fbo), _.swap(), t.viewport(0, 0, D, y), i.supportLinearFiltering || t.uniform2f(N.uniforms.dyeTexelSize, 1 / D, 1 / y), t.uniform1i(N.uniforms.uVelocity, _.read.texId), t.uniform1i(N.uniforms.uSource, A.read.texId), t.uniform1f(N.uniforms.dissipation, e.DENSITY_DISSIPATION), x(A.write.fbo), A.swap()
    }

    function render(n) {
        null != n && e.TRANSPARENT ? t.disable(t.BLEND) : (t.blendFunc(t.ONE, t.ONE_MINUS_SRC_ALPHA), t.enable(t.BLEND));
        let r = null == n ? t.drawingBufferWidth : D,
            i = null == n ? t.drawingBufferHeight : y;
        if (t.viewport(0, 0, r, i), !e.TRANSPARENT) {
            w.bind();
            let r = e.BACK_COLOR;
            t.uniform4f(w.uniforms.color, r.r / 255, r.g / 255, r.b / 255, 1), x(n)
        }
        null == n && e.TRANSPARENT && C.bind(), e.SHADING ? (B.bind(), t.uniform2f(B.uniforms.texelSize, 1 / r, 1 / i), t.uniform1i(B.uniforms.uTexture, A.read.texId)) : (I.bind(), t.uniform1i(I.uniforms.uTexture, A.read.texId)), x(n)
    }

    function splat(n, r, i, o, a) {
        t.viewport(0, 0, E, S), P.bind(), t.uniform1i(P.uniforms.uTarget, _.read.texId), t.uniform1f(P.uniforms.aspectRatio, canvas.width / canvas.height), t.uniform2f(P.uniforms.point, n / canvas.width, 1 - r / canvas.height), t.uniform3f(P.uniforms.color, i, -o, 1), t.uniform1f(P.uniforms.radius, e.SPLAT_RADIUS / 100), x(_.write.fbo), _.swap(), t.viewport(0, 0, D, y), t.uniform1i(P.uniforms.uTarget, A.read.texId), t.uniform3f(P.uniforms.color, a.r, a.g, a.b), x(A.write.fbo), A.swap()
    }

    function multipleSplats(e, n = !1) {
        for (let a = 0; a < e; a++) {
            const e = generateColor();
            e.r *= 10, e.g *= 10, e.b *= 10;
            var r = canvas.width * Math.random(),
                t = canvas.height * Math.random(),
                i = 1e3 * (Math.random() - .5),
                o = 1e3 * (Math.random() - .5);
            n && (r = canvas.width / 2, t = canvas.height / 2, i = 1e3 * (Math.random() - .5), o = 1e3 * (Math.random() - .5)), splat(r, t, i, o, e)
        }
    }

    function resizeCanvas() {
        canvas.width == canvas.clientWidth && canvas.height == canvas.clientHeight || (canvas.width = canvas.clientWidth, canvas.height = canvas.clientHeight, initFramebuffers())
    }
    update();
    var my_dx = 0,
        my_dy = 0,
        my_color = generateColor();

    function generateColor() {
        let e = HSVtoRGB(Math.random(), 1, 1);
        return e.r *= .15, e.g *= .15, e.b *= .15, e;
    }

    function getRandomInt(e, n) {
        return e = Math.ceil(e), n = Math.floor(n), Math.floor(Math.random() * (n - e + 1)) + e
    }

    function HSVtoRGB(e, n, r) {
        let t, i, o, a, u, v, l, f;
        switch (v = r * (1 - n), l = r * (1 - (u = 6 * e - (a = Math.floor(6 * e))) * n), f = r * (1 - (1 - u) * n), a % 6) {
            case 0:
                t = r, i = f, o = v;
                break;
            case 1:
                t = l, i = r, o = v;
                break;
            case 2:
                t = v, i = r, o = f;
                break;
            case 3:
                t = v, i = l, o = r;
                break;
            case 4:
                t = f, i = v, o = r;
                break;
            case 5:
                t = r, i = v, o = l
        }
        return {
            r: t,
            g: i,
            b: o
        }
    }

    let timestamp = null;
    let lastMouseX = null;
    let lastMouseY = null;
    let speedX = null;
    let speedY = null;    
    let moving = false;

    function startMove(e){
        if (timestamp === null) {
            timestamp = Date.now();
            lastMouseX = e.screenX;
            lastMouseY = e.screenY;
            return;
        }
    
        let now = Date.now();
        let dt =  now - timestamp;
        let dx = e.screenX - lastMouseX;
        let dy = e.screenY - lastMouseY;
        speedX = Math.round(dx / dt * 100);
        speedY = Math.round(dy / dt * 100);
    
        if((speedX >= 100 | speedX <= -100) | (speedY >= 100 | speedY <= -100)) {
            moving = true;
        };
        timestamp = now;
        lastMouseX = e.screenX;
        lastMouseY = e.screenY;
    }

    // canvas.addEventListener("mouseout", () => {
    //         moving = false;
    // });

    canvas.addEventListener("contextmenu", event => {event.preventDefault();})

    document.addEventListener("mousemove", e => {
        if(!moving){
            startMove(e);
        }
        else {
            splat(e.clientX, e.clientY, 5 * (e.clientX - my_dx), 5 * (e.clientY - my_dy), my_color), my_dx = e.clientX, my_dy = e.clientY;
            console.log(e);
        }
        
    }), setInterval(function() {
        my_color = generateColor()
    }, 500), canvas.addEventListener("touchmove", e => {
        e.preventDefault();
        const r = e.targetTouches;
        for (let e = 0; e < r.length; e++) {
            let t = n[e];
            t.moved = t.down, t.dx = 8 * (r[e].pageX - t.x), t.dy = 8 * (r[e].pageY - t.y), t.x = r[e].pageX, t.y = r[e].pageY
        }
    }, !1), canvas.addEventListener("touchstart", e => {
        e.preventDefault();
        const r = e.targetTouches;
        for (let e = 0; e < r.length; e++) e >= n.length && n.push(new pointerPrototype), n[e].id = r[e].identifier, n[e].down = !0, n[e].x = r[e].pageX, n[e].y = r[e].pageY, n[e].color = generateColor()
    }), window.addEventListener("mouseup", () => {
        n[0].down = !1
    }), window.addEventListener("touchend", e => {
        const r = e.changedTouches;
        for (let e = 0; e < r.length; e++)
            for (let t = 0; t < n.length; t++) r[e].identifier == n[t].id && (n[t].down = !1)
    }), window.addEventListener("keydown", n => {
        "p" === n.key && (e.PAUSED = !e.PAUSED)
    })
}