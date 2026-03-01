import * as THREE from 'three';

export default class Wire
{

  static Triangle( _r = 50, _color = 0x000000 )
  {
      var __r = Math.PI / 3 * 2
      var _v = new Float32Array(12)
      _v[0] = Math.cos( __r * 0 + Math.PI * 0.5 ) * _r;
      _v[1] = Math.sin( __r * 0 + Math.PI * 0.5 ) * _r;
      _v[2] = 0;
      _v[3] = Math.cos( __r * 1 + Math.PI * 0.5 ) * _r;
      _v[4] = Math.sin( __r * 1 + Math.PI * 0.5 ) * _r;
      _v[5] = 0;
      _v[6] = Math.cos( __r * 2 + Math.PI * 0.5 ) * _r;
      _v[7] = Math.sin( __r * 2 + Math.PI * 0.5 ) * _r;
      _v[8] = 0;
      _v[9] = _v[0];
      _v[10] = _v[1];
      _v[11] = _v[2];

      var _g = new THREE.BufferGeometry();
      _g.setAttribute('position', new THREE.BufferAttribute( _v, 3 ) );

      return new THREE.Line( _g, new THREE.LineBasicMaterial({  color: _color, transparent: true, opacity: 0.8 } ) );

  }

  static Plane( _w = 100, _h = 100, _color = 0x000000 )
  {
    let _v = new Float32Array( 5 * 3 );
    let _hw = _w * 0.5;
    let _hh = _h * 0.5;
    _v[ 0 ] = - _hw;
    _v[ 1 ] = _hh;
    _v[ 2 ] = 0;
    _v[ 3 ] = _hw;
    _v[ 4 ] = _hh;
    _v[ 5 ] = 0;
    _v[ 6 ] = _hw;
    _v[ 7 ] = - _hh;
    _v[ 8 ] = 0;
    _v[ 9 ] = - _hw;
    _v[ 10 ] = - _hh;
    _v[ 11 ] = 0;
    _v[ 12 ] = - _hw;
    _v[ 13 ] = _hh;
    _v[ 14 ] = 0;

    let _g = new THREE.BufferGeometry();
    _g.setAttribute( 'position', new THREE.BufferAttribute( _v, 3 ) );

    return new THREE.Line( _g, new THREE.LineBasicMaterial({  color: _color, transparent: true, opacity: 0.8 } ) );

  }

  static Rectangle( _w = 100, _h = 100, _color = 0x000000 )
  {
    return Wire.Plane( _w, _h, _color );
  }

  static Box( _size = 1.0, _color = 0x000000 )
  {
    let _v = new Float32Array( 24 * 3 );
    let _vertices = []
    let _p = 0.5 * _size;
    let _idx = 0;
    _vertices.push( - _p, _p, _p );
    _vertices.push( _p, _p, _p );
    _vertices.push( _p, _p, _p );
    _vertices.push( _p, - _p, _p );
    _vertices.push( _p, - _p, _p );
    _vertices.push( - _p, - _p, _p );
    _vertices.push( - _p, - _p, _p );
    _vertices.push( - _p, _p, _p );

    _vertices.push( - _p, _p, -_p );
    _vertices.push( _p, _p, -_p );
    _vertices.push( _p, _p, -_p );
    _vertices.push( _p, - _p, -_p );
    _vertices.push( _p, - _p, -_p );
    _vertices.push( - _p, - _p, -_p );
    _vertices.push( - _p, - _p, -_p );
    _vertices.push( - _p, _p, -_p );

    _vertices.push( - _p, _p, _p );
    _vertices.push( - _p, _p, -_p );
    _vertices.push( _p, _p, _p );
    _vertices.push( _p, _p, -_p );
    _vertices.push( - _p, - _p, _p );
    _vertices.push( - _p, - _p, -_p );
    _vertices.push( _p, - _p, _p );
    _vertices.push( _p, - _p, -_p );

    for( var i = 0; i < 24 * 3; i++ )
    {
      _v[i] = _vertices[i];
    }

    let _geometry = new THREE.BufferGeometry();
    _geometry.setAttribute( 'position', new THREE.BufferAttribute( _v, 3 ) );

    return new THREE.LineSegments( _geometry, new THREE.LineBasicMaterial({  color: _color, transparent: true, opacity: 0.8 } ) );


  }

  static Circle( _r = 50, _s = 32, _color = 0x000000 )
  {
    _s = _s < 0? 1 : _s;
    _s = ~~( _s / 4 + 1 ) * 4;

    let PI = Math.PI;
    let _v = new Float32Array( ( _s + 1 ) * 3 );

    for( var i = 0; i < _s; i++ )
    {
      let _rad = i / _s * PI * 2;
      _v[ i * 3 + 0 ] = Math.cos( _rad ) * _r;
      _v[ i * 3 + 1 ] = Math.sin( _rad ) * _r;
      _v[ i * 3 + 2 ] = 0;
    }

    _v[ _s * 3 + 0 ] = _v[0];
    _v[ _s * 3 + 1 ] = _v[1];
    _v[ _s * 3 + 2 ] = _v[2];


    let _g = new THREE.BufferGeometry();
    _g.setAttribute( 'position', new THREE.BufferAttribute( _v, 3 ) );

    return new THREE.Line( _g, new THREE.LineBasicMaterial({  color: _color, transparent: true, opacity: 0.8 } ) );

  }

  static Sphere( _r = 50, _s = 32, _color = 0x000000 )
  {
    _s = ~~( _s / 4 + 1 ) * 4;

    let PI = Math.PI;
    let _offset = PI / _s *2;
    let _v = new Float32Array( _s * 2 * 3 * 3 );
    let _vertices = [];

    for( var i = 0; i < _s; i++ )
    {
      var _rad0 = i / _s * PI * 2 + _offset;
      var _rad1 = ( i + 1 ) / _s * PI * 2 + _offset;

      _vertices.push( Math.cos( _rad0 ) * _r );
      _vertices.push( Math.sin( _rad0 ) * _r );
      _vertices.push( 0 );

      _vertices.push( Math.cos( _rad1 ) * _r );
      _vertices.push( Math.sin( _rad1 ) * _r );
      _vertices.push( 0 );
    }

    for( var i = 0; i < _s; i++ )
    {
      var _rad0 = i / _s * PI * 2;
      var _rad1 = ( i + 1 ) / _s * PI * 2;

      _vertices.push( Math.cos( _rad0 ) * _r );
      _vertices.push( 0);
      _vertices.push( Math.sin( _rad0 ) * _r );

      _vertices.push( Math.cos( _rad1 ) * _r );
      _vertices.push( 0);
      _vertices.push( Math.sin( _rad1 ) * _r );
    }

    for( var i = 0; i < _s; i++ )
    {
      var _rad0 = i / _s * PI * 2;
      var _rad1 = ( i + 1 ) / _s * PI * 2;

      _vertices.push( 0);
      _vertices.push( Math.cos( _rad0 ) * _r );
      _vertices.push( Math.sin( _rad0 ) * _r );

      _vertices.push( 0);
      _vertices.push( Math.cos( _rad1 ) * _r );
      _vertices.push( Math.sin( _rad1 ) * _r );
    }

    let len = _vertices.length;
    for( var i = 0; i < len; i++ )
    {
      _v[i] = _vertices[i];
    }

    let _g = new THREE.BufferGeometry();
    _g.setAttribute( 'position', new THREE.BufferAttribute( _v, 3 ) );

    return new THREE.LineSegments( _g, new THREE.LineBasicMaterial({  color: _color, transparent: true, opacity: 0.8 } ) );

  }

  static Line( _vec3List = [ new THREE.Vector3(-1,0,0), new THREE.Vector3(1,0,0)], _color = 0x000000 )
  {
    let _v = new Float32Array( ( _vec3List.length + 1 ) * 3 );

    let len = _vec3List.length;
    for( var i = 0; i < len; i++ )
    {
      _v[ i * 3 + 0 ] = _vec3List[i].x;
      _v[ i * 3 + 1 ] = _vec3List[i].y;
      _v[ i * 3 + 2 ] = _vec3List[i].z;
    }

    _v[ len * 3 + 0 ] = _v[0];
    _v[ len * 3 + 1 ] = _v[1];
    _v[ len * 3 + 2 ] = _v[2];


    let _g = new THREE.BufferGeometry();
    _g.setAttribute( 'position', new THREE.BufferAttribute( _v, 3 ) );

    return new THREE.Line( _g, new THREE.LineBasicMaterial({  color: _color, transparent: true, opacity: 0.8 } ) );

  }

  static Points( _vec3List = [ new THREE.Vector3() ], _color = 0x000000, _size = 10 )
  {
    let _v = new Float32Array( ( _vec3List.length + 1 ) * 3 );

    let len = _vec3List.length;
    for( var i = 0; i < len; i++ )
    {
      _v[ i * 3 + 0 ] = _vec3List[i].x;
      _v[ i * 3 + 1 ] = _vec3List[i].y;
      _v[ i * 3 + 2 ] = _vec3List[i].z;
    }

    _v[ len * 3 + 0 ] = _v[0];
    _v[ len * 3 + 1 ] = _v[1];
    _v[ len * 3 + 2 ] = _v[2];

    let _g = new THREE.BufferGeometry();
    _g.setAttribute( 'position', new THREE.BufferAttribute( _v, 3 ) );

    return new THREE.Points( _g, new THREE.PointsMaterial({  color: _color, transparent: true, opacity: 0.8, size: _size } ) );

  }
}