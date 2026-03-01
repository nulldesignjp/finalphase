import * as THREE from 'three'

export default class MonalizaMatrix extends THREE.Object3D {
    constructor(params) {
        super();
        const defaultParam = { size: 100, grid: 3, gridX: 3, gridY: 3, attack: 0.25, accell: 70, slow: 1.075, texture: "/assets/img/Leonardo_da_Vinci_-_Mona_Lisa.jpg" };
        this.params = { ...defaultParam, ...params };

        this.list = []

        this.isDynamic = true;

        this._init();

    }

    _init() {
        //  Squareのグリッドを設定, Rectangleにも対応。もう少し頭良い方法考える。
        if (typeof this.params.grid === "number") {
            this.params.gridX = this.params.grid;
            this.params.gridY = this.params.grid;

        } else if (typeof this.params.grid === "object") {
            this.params.gridX = this.params.grid.x || this.params.grid[0] || 3;
            this.params.gridY = this.params.grid.y || this.params.grid[1] || 3;
        }

        // グリッドの数を設定
        this.params.texture.colorSpace = THREE.SRGBColorSpace;

        for (var i = 0; i < this.params.gridX; i++) {
            this.list[i] = [];
            for (var j = 0; j < this.params.gridY; j++) {
                let geometry = new THREE.PlaneGeometry(this.params.size, this.params.size);

                // UVの設定01110010
                let _unitX = 1.0 / this.params.gridX;
                let _unitY = 1.0 / this.params.gridY;
                let _unitSX = i * _unitX;
                let _unitSY = j * _unitY;
                let _unitEX = (i + 1) * _unitX;
                let _unitEY = (j + 1) * _unitY;

                geometry.attributes.uv.array[0] = _unitSX;
                geometry.attributes.uv.array[1] = _unitEY;
                geometry.attributes.uv.array[2] = _unitEX;
                geometry.attributes.uv.array[3] = _unitEY;
                geometry.attributes.uv.array[4] = _unitSX;
                geometry.attributes.uv.array[5] = _unitSY;
                geometry.attributes.uv.array[6] = _unitEX;
                geometry.attributes.uv.array[7] = _unitSY;

                let material = new THREE.MeshBasicMaterial(
                    {
                        side: THREE.DoubleSide,
                        map: this.params.texture
                    });
                let mesh = new THREE.Mesh(geometry, material);
                this.add(mesh);

                this.list[i][j] = {
                    mesh: mesh,
                    w: this.params.size,
                    h: this.params.size,
                    sx: 0,
                    sy: 0,
                    scale: { x: 1, y: 1 }
                }
            }
        }
    }

    update() {

        // dyanmic
        if( this.isDynamic )
        {
            this.caliculateVector0();
            this.calicurateScale0();
            this.calicuratePosition();
        } else {
            // this.caliculateVector1()
            this.calicurateScale1();
            this.calicuratePosition();
        }


    }

    caliculateVector0()
    {
        let _l = this.list;
        let _gridSize = this.params.size;
        let _gridNumX = this.params.gridX;
        let _gridNumY = this.params.gridY;
        let _attack = this.params.attack;
        let _accell = this.params.accell;
        let _slow = this.params.slow;
        
        // 基本となるベルトルの計算。バネの式を使うかイージングを使うかで分けられそう。
        for (var i = 0; i < _l[0].length; i++) {
            let _m = _l[0][i];
            _m.sy = (_m.sy + (1.0 - _m.scale.y) / _accell) / _slow;
        }
        for (var i = 0; i < _l.length; i++) {
            let _m = _l[i][0];
            _m.sx = (_m.sx + (1.0 - _m.scale.x) / _accell) / _slow;
        }


        // ベクトルの平均（スケールの変化量の平均をとって相対的な大きさを固定する意図）
        let _vector = { x: 0, y: 0 }
        for (var i = 0; i < _l[0].length; i++) {
            let _m = _l[0][i];
            _vector.y += _m.sy
        }
        for (var i = 0; i < _l.length; i++) {
            let _m = _l[i][0];
            _vector.x += _m.sx
        }

        _vector.x /= _l.length;
        _vector.y /= _l[0].length;

        // ベクトルの平均を引く
        for (var i = 0; i < _l[0].length; i++) {
            let _m = _l[0][i];
            _m.sy -= _vector.y;
        }
        for (var i = 0; i < _l.length; i++) {
            let _m = _l[i][0];
            _m.sx -= _vector.x;
        }
    }

    caliculateVector1(){}

    calicurateScale0()
    {
        let _l = this.list;
        let _gridSize = this.params.size;
        let _gridNumX = this.params.gridX;
        let _gridNumY = this.params.gridY;
        let _attack = this.params.attack;
        let _accell = this.params.accell;
        let _slow = this.params.slow;

        // スケールに反映(反映のみ)
        for (var i = 0; i < _l.length; i++) {
            for (var j = 0; j < _l[i].length; j++) {
                let sx = _l[i][0].sx;
                let sy = _l[0][j].sy;
                let v = _l[i][j];

                v.scale.x += sx
                v.scale.y += sy
                v.mesh.scale.x = v.scale.x
                v.mesh.scale.y = v.scale.y

                // limited （あー、要素一つの上限が_gridNumXであって、全体の平均の視点が抜けてる）
                v.mesh.scale.x = v.mesh.scale.x < 0.0 ? 0.0 : v.mesh.scale.x;
                v.mesh.scale.y = v.mesh.scale.y < 0.0 ? 0.0 : v.mesh.scale.y;
                v.mesh.scale.x = v.mesh.scale.x > _gridNumX ? _gridNumX : v.mesh.scale.x;
                v.mesh.scale.y = v.mesh.scale.y > _gridNumY ? _gridNumY : v.mesh.scale.y;
            }
        }
    }

    calicurateScale1()
    {
        let _l = this.list;
        let _gridSize = this.params.size;
        let _gridNum = this.params.grid;
        let _attack = this.params.attack;
        let _accell = this.params.accell;
        let _slow = this.params.slow;

        // 位置に反映
        for (var i = 0; i < _l.length; i++) {
            for (var j = 0; j < _l[i].length; j++) {
                let _m = _l[i][j];
                _m.mesh.scale.x += (_m.scale.x - _m.mesh.scale.x) * 0.2;
                _m.mesh.scale.y += (_m.scale.y - _m.mesh.scale.y) * 0.2;
            }
        }
    }

    calicuratePosition()
    {
        let _l = this.list;
        let _gridSize = this.params.size;
        let _gridNumX = this.params.gridX;
        let _gridNumY = this.params.gridY;
        let _attack = this.params.attack;
        let _accell = this.params.accell;
        let _slow = this.params.slow;

        // 位置に反映（スケールによって座標を変える処理）
        let _posX = - (_gridSize * _gridNumX) * 0.5;
        for (var i = 0; i < _l.length; i++) {
            let _posY = - (_gridSize * _gridNumY) * 0.5;
            _posX += _l[i][0].mesh.scale.x * _gridSize * 0.5;

            for (var j = 0; j < _l[i].length; j++) {
                let vy = _l[i][j];

                _posY += vy.mesh.scale.y * _gridSize * 0.5;

                vy.mesh.position.x = _posX;
                vy.mesh.position.y = _posY;

                _posY += vy.mesh.scale.y * _gridSize * 0.5;
            }
            _posX += _l[i][0].mesh.scale.x * _gridSize * 0.5;
        }

    }

    impact()
    {
        if( this.isDynamic )
        {
            let _gridNumX = this.params.gridX;
            let _gridNumY = this.params.gridY;
            let _attack = this.params.attack || 2;

            let _x = Math.floor(Math.random() * _gridNumX);
            let _y = Math.floor(Math.random() * _gridNumY);

            this.list[_x][0].sx += Math.random() * _attack;
            this.list[0][_y].sy += Math.random() * _attack;
        } else {

            let _gridNumX = this.params.gridX;
            let _gridNumY = this.params.gridY;
            let _total = { x: 0, y: 0 }
            let _power = Math.random();
            let _scaleValueX = _gridNumX * this.params.size * 0.5;
            let _scaleValueY = _gridNumY * this.params.size * 0.5;

            let _offset = {
                x: (Math.random() - 0.5) * 100,
                y: (Math.random() - 0.5) * 100
            }

            this.list.forEach(_l => {
                _l.forEach(_z => {
                    let _distY = _z.mesh.position.y + _offset.y;
                    let _deltaScaleY = Math.cos(_distY / _scaleValueY * 3.1416) * _power
                    _z.scale.y = 1.0 + _deltaScaleY

                    let _distX = _z.mesh.position.x + _offset.x;
                    let _deltaScaleX = Math.cos(_distX / _scaleValueX * 3.1416) * _power
                    _z.scale.x = 1.0 + _deltaScaleX

                    _total.x += _z.scale.x
                    _total.y += _z.scale.y
                })
            })

            let _s = { x: _gridNumX * _gridNumY / _total.x, y: _gridNumX * _gridNumY / _total.y }

            this.list.forEach(_l => {
                _l.forEach(_z => {
                    _z.scale.x *= _s.x;
                    _z.scale.y *= _s.y;
                })

            })
        }
    }

    resize() {}

    dispose() {
        let len = this.children.length;
        while (len) {
            len--;
            let _c = this.children.pop();
            if (_c.geometry) _c.geometry.dispose();
            if (_c.material) {
                if (Array.isArray(_c.material)) {
                    _c.material.forEach(mat => mat.dispose());
                } else {
                    _c.material.dispose();
                }
            }
            _c.parent.remove(_c);
            _c = null
        }
        this.list = [];

    }
}