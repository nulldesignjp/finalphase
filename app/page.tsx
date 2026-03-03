import Image from "next/image";
import Myscene from './components/Myscene'; // 👈 作った部品を呼ぶ
import styles from './components/Myscene.module.scss'
import KVisual from './components/KVisual';
import Link from 'next/link';

const rootPath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function Home() {

  const customColor = '#FF0000';

  return (
    <main className={styles.main}>
      <KVisual />
    </main >
  );
}