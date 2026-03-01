
varying vec2 vUv;

void main() {
    gl_FragColor = vec4(vUv.x, 0.25, vUv.y, 1.0);
}