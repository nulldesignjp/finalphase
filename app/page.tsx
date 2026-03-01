import Image from "next/image";
import Myscene from './components/Myscene'; // 👈 作った部品を呼ぶ
import styles from './components/Myscene.module.scss'
import Link from 'next/link';

const rootPath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function Home() {

  const customColor = '#FF0000';

  return (
    <main className={styles.main}>
      <h1>My First WebGL with Fuckin Next.js</h1>
      <Link href="/about">アバウトページへ</Link>

      <ul>
        <li>ページ間の遷移方法</li>
        <li>
          <pre>return &lt;Link href="/about"&gt;アバウトページへ&lt;/Link&gt;</pre>
        </li>
        <li>
          <pre>
            {`import {useRouter} from 'next/navigation';
const router = useRouter();
router.push('/about');
return <button onClick={handleClick}>移動する</button>;`}
          </pre>
        </li>
        <li>ページ間の情報保持</li>
        <li></li>
        <li></li>
        <li></li>
        <li>
          <pre>
            {`'use client';

import { useState } from 'react';
import Child from './Child';

export default function Parent() {
  // 1. 変わりうるデータ（状態）を用意する
  // cubeColor: 現在の値
  // setCubeColor: 値を書き換えるための専用の仕組み
  const [cubeColor, setCubeColor] = useState('#00ff00');

  return (
    <div>
      {/* 2. ボタンを押して、親側のデータを「赤」に書き換える */}
      <button onClick={() => setCubeColor('#ff0000')}>
        色を赤に変える
      </button>

      {/* 3. 親のデータが変わると、自動的に最新の色が子へ送られる */}
      <Child color={cubeColor} />
    </div>
  );
}`}
          </pre>
        </li>
      </ul>
      <Myscene color={customColor} />
    </main >
  );
}