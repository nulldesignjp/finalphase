import Image from "next/image";
import Myscene from './components/Myscene'; // 👈 作った部品を呼ぶ
import styles from './components/Myscene.module.scss'
import Link from 'next/link';

const rootPath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function Home() {

  const customColor = '#FF0000';

  return (
    <main className={styles.main}>
      <Link href="/about">アバウトページへ.</Link>
      {/* <Myscene color={customColor} /> */}
    </main >
  );
}