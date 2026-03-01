"use client";

import { useEffect, useState } from "react";
import styles from "./ThemeToggle.module.css";

export default function ThemeToggle() {
    const [theme, setTheme] = useState<"light" | "dark" | null>(null);

    useEffect(() => {
        // 初回読み込み時の設定取得
        const storedTheme = localStorage.getItem("theme");
        if (storedTheme === "light" || storedTheme === "dark") {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTheme(storedTheme);
        } else {
            // ローカルストレージにない場合はOSの設定を使用
            const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTheme(isDark ? "dark" : "light");
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
    };

    // Hydration Error（画面チラつき）防止のため、テーマが決定するまで何も表示しない
    if (!theme) return null;

    return (
        <button
            className={styles.toggleBtn}
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            title={theme === "light" ? "ダークモードに切り替え" : "ライトモードに切り替え"}
        >
            {theme === "light" ? "🌙" : "☀️"}
        </button>
    );
}
