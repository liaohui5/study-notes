import fs from "node:fs";

// 根据文件名生成序号(用于排序)
function getOrderBy(fileName) {
  const order = Number.parseInt(fileName.slice(0, 2));
  if (Number.isNaN(order)) {
    return 0;
  }
  return order;
}

// 根据文件自动生成侧边栏(这个不是vite插件不会实时监听文件变化然后重启)
function autoGenSidebars(filePath) {
  const excludes = [".DS_Store"];
  const targetPath = `docs/${filePath}`.replace(/\/\//g, "/");
  const files = fs.readdirSync(targetPath);

  const result = [];
  for (let i = 0; i < files.length; i++) {
    const item = files[i];
    if (excludes.includes(item)) {
      continue;
    }
    if (item === "index.md") {
      result.push({
        text: "介绍",
        link: `${filePath}/index`,
        sort: 0,
      });
      continue;
    }

    const text = item.slice(0, -3); // without ".md"
    result.push({
      text,
      link: `${filePath}/${text}`,
      sort: getOrderBy(text),
    });
  }
  return result.sort((a, b) => a.sort - b.sort);
}

function sidebarGenerator(sidebarPaths = []) {
  const sidebars = {};
  for (const path of sidebarPaths) {
    sidebars[path] = autoGenSidebars(path);
  }
  return sidebars;
}

const log = console.log;

let isGenerated = false;
export default function VitePluginVitePressAutoSidebar(opt = {}) {
  return {
    name: "vite-plugin-vitepress-auto-sidebar",
    configureServer({ watcher, restart }) {
      const fsWatcher = watcher.add("*.md");
      fsWatcher.on("all", async (event, path) => {
        console.log("### sidebar should updated ###");
        // 由于重启失败(递归的读取文件目录,时间较长), 所以需要手动重启
        // if (event !== "change") {
        //   log(`${event} ${path}`);
        //   try {
        //     await restart();
        //     log("update sidebar...");
        //   } catch (e) {
        //     log(`${event} ${path}`);
        //     log("update sidebar failed");
        //   }
        // }
      });
    },
    config(config) {
      // 应该哪个目录的sidbar变化话就更新哪个, 不要全部一起更新
      // log(">>> config", config);
      if (isGenerated) {
        return config;
      }
      config.vitepress.site.themeConfig.sidebar = sidebarGenerator(opt.sidebarPaths);
      isGenerated = true;
      log("injected sidebar data successfully");
      return config;
    },
  };
}
