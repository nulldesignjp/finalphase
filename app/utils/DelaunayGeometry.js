import { BufferGeometry, Float32BufferAttribute } from 'three';

/**
 * Delaunay 3角分割アルゴリズム (内部ユーティリティ)
 * 元のコードのロジックを ES6 形式に整理
 */
const Delaunay = (function() {
    const EPSILON = 1.0 / 1048576.0;

    function supertriangle(vertices) {
        let xmin = Infinity, ymin = Infinity, xmax = -Infinity, ymax = -Infinity;
        for (let i = vertices.length; i--; ) {
            if (vertices[i][0] < xmin) xmin = vertices[i][0];
            if (vertices[i][0] > xmax) xmax = vertices[i][0];
            if (vertices[i][1] < ymin) ymin = vertices[i][1];
            if (vertices[i][1] > ymax) ymax = vertices[i][1];
        }
        const dx = xmax - xmin, dy = ymax - ymin;
        const dmax = Math.max(dx, dy);
        const xmid = xmin + dx * 0.5, ymid = ymin + dy * 0.5;
        return [
            [xmid - 20 * dmax, ymid - dmax],
            [xmid, ymid + 20 * dmax],
            [xmid + 20 * dmax, ymid - dmax]
        ];
    }

    function circumcircle(vertices, i, j, k) {
        const x1 = vertices[i][0], y1 = vertices[i][1];
        const x2 = vertices[j][0], y2 = vertices[j][1];
        const x3 = vertices[k][0], y3 = vertices[k][1];
        const fabsy1y2 = Math.abs(y1 - y2), fabsy2y3 = Math.abs(y2 - y3);
        let xc, yc, m1, m2, mx1, mx2, my1, my2;

        if (fabsy1y2 < EPSILON && fabsy2y3 < EPSILON) throw new Error("Coincident points!");
        if (fabsy1y2 < EPSILON) {
            m2 = -((x3 - x2) / (y3 - y2));
            mx2 = (x2 + x3) / 2.0; my2 = (y2 + y3) / 2.0;
            xc = (x2 + x1) / 2.0; yc = m2 * (xc - mx2) + my2;
        } else if (fabsy2y3 < EPSILON) {
            m1 = -((x2 - x1) / (y2 - y1));
            mx1 = (x1 + x2) / 2.0; my1 = (y1 + y2) / 2.0;
            xc = (x3 + x2) / 2.0; yc = m1 * (xc - mx1) + my1;
        } else {
            m1 = -((x2 - x1) / (y2 - y1)); m2 = -((x3 - x2) / (y3 - y2));
            mx1 = (x1 + x2) / 2.0; mx2 = (x2 + x3) / 2.0;
            my1 = (y1 + y2) / 2.0; my2 = (y2 + y3) / 2.0;
            xc = (m1 * mx1 - m2 * mx2 + my2 - my1) / (m1 - m2);
            yc = (fabsy1y2 > fabsy2y3) ? m1 * (xc - mx1) + my1 : m2 * (xc - mx2) + my2;
        }
        const dx = x2 - xc, dy = y2 - yc;
        return { i, j, k, x: xc, y: yc, r: dx * dx + dy * dy };
    }

    function dedup(edges) {
        for (let j = edges.length; j; ) {
            let b = edges[--j], a = edges[--j];
            for (let i = j; i; ) {
                let n = edges[--i], m = edges[--i];
                if ((a === m && b === n) || (a === n && b === m)) {
                    edges.splice(j, 2); edges.splice(i, 2);
                    break;
                }
            }
        }
    }

    return {
        triangulate: function(vertices) {
            let n = vertices.length;
            if (n < 3) return [];
            vertices = vertices.slice(0);
            let indices = new Array(n);
            for (let i = n; i--; ) indices[i] = i;
            indices.sort((i, j) => vertices[j][0] - vertices[i][0]);
            let st = supertriangle(vertices);
            vertices.push(st[0], st[1], st[2]);
            let open = [circumcircle(vertices, n + 0, n + 1, n + 2)], closed = [], edges = [];
            for (let i = indices.length; i--; edges.length = 0) {
                let c = indices[i];
                for (let j = open.length; j--; ) {
                    let dx = vertices[c][0] - open[j].x;
                    if (dx > 0.0 && dx * dx > open[j].r) {
                        closed.push(open[j]); open.splice(j, 1);
                        continue;
                    }
                    let dy = vertices[c][1] - open[j].y;
                    if (dx * dx + dy * dy - open[j].r > EPSILON) continue;
                    edges.push(open[j].i, open[j].j, open[j].j, open[j].k, open[j].k, open[j].i);
                    open.splice(j, 1);
                }
                dedup(edges);
                for (let j = edges.length; j; ) {
                    let b = edges[--j], a = edges[--j];
                    open.push(circumcircle(vertices, a, b, c));
                }
            }
            for (let i = open.length; i--; ) closed.push(open[i]);
            let results = [];
            for (let i = closed.length; i--; ) {
                if (closed[i].i < n && closed[i].j < n && closed[i].k < n) {
                    results.push(closed[i].i, closed[i].j, closed[i].k);
                }
            }
            return results;
        }
    };
})();

/**
 * カスタム DelaunayGeometry クラス
 */
class DelaunayGeometry extends BufferGeometry {
    constructor(width = 100, height = 100, segment = 100, initPoints = []) {
        super();
        this.type = 'DelaunayGeometry';
        this.parameters = { width, height, segment, initPoints };

        const verticesArray = [...initPoints];
        const grid = Math.floor(Math.sqrt(segment));
        const gridX = width / grid;
        const gridY = height / grid;

        // 境界の頂点を追加 (外枠を安定させるため)
        for (let i = 0; i < grid; i++) {
            verticesArray.push([-width * 0.5 + (i * gridX), height * 0.5]);
            verticesArray.push([-width * 0.5 + (i * gridX), -height * 0.5]);
        }
        verticesArray.push([width * 0.5, height * 0.5]);
        verticesArray.push([width * 0.5, -height * 0.5]);
        for (let i = 1; i < grid; i++) {
            verticesArray.push([-width * 0.5, height * 0.5 - (i * gridY)]);
            verticesArray.push([width * 0.5, height * 0.5 - (i * gridY)]);
        }

        // ランダムな頂点を追加
        for (let i = 0; i < segment; i++) {
            verticesArray.push([
                Math.random() * width - width * 0.5,
                Math.random() * height - height * 0.5
            ]);
        }

        // 3角分割の実行
        const indices = Delaunay.triangulate(verticesArray);

        // BufferAttributes 用の配列準備
        const positions = new Float32Array(verticesArray.length * 3);
        const uvs = new Float32Array(verticesArray.length * 2);

        for (let i = 0; i < verticesArray.length; i++) {
            const x = verticesArray[i][0];
            const y = verticesArray[i][1];
            
            // Position (zは0)
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = 0;

            // UV (0.0 - 1.0 に正規化)
            uvs[i * 2] = (x + width * 0.5) / width;
            uvs[i * 2 + 1] = (y + height * 0.5) / height;
        }

        // データのセットアップ
        this.setIndex(indices); // インデックスをセット
        this.setAttribute('position', new Float32BufferAttribute(positions, 3)); // 頂点座標
        this.setAttribute('uv', new Float32BufferAttribute(uvs, 2)); // UV座標

        // 法線の自動計算
        this.computeVertexNormals(); // 法線を計算してライティングに対応させる
    }

    copy(source) {
        super.copy(source);
        this.parameters = Object.assign({}, source.parameters);
        return this;
    }
}

export { DelaunayGeometry };