import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 內網部署為容器（見 docs/decisions/0001-frontend-stack.md）
  output: "standalone",

  // 明確指定 workspace root。不指定的話 Next 會往上找到 /Users/ch/package-lock.json
  // 並把那裡當成 root，standalone 的檔案追蹤範圍就會錯。
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
