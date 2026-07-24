import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * locale-aware 版本的 Link / redirect / usePathname / useRouter。
 * usePathname() 回傳值不含 locale 前綴；useRouter().replace(href, { locale }) 可在
 * 保留當前 pathname 的情況下切換 locale——語系切換（Header）與需要跨 locale
 * 保留路徑的連結都走這裡，不要自己手動拼字串。
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
