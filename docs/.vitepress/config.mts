import { defineConfig } from 'vitepress';
import sidebar from './sidebar.mts';

export default defineConfig({
  title: "AutoLang Design",
  description: "AutoLang 初期设计",
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '目录', link: '/content/' },
    ],
    sidebar,
    socialLinks: [
      { icon: 'github', link: 'https://github.com/AutoLang-Dev/design' },
    ],
    footer: {
      copyright: "Copyright© 2025 AutoLang Dev",
      message: `基于 VitePress | <a href="https://autolang.dev">前往主站</a>`
    },
    outline: {
      level: 'deep',
      label: '页面导航'
    },
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },
    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    },
    notFound: {
      title: '页面不存在，也许将来会存在',
      quote: '但只要你不改变方向，继续寻找，你终将到达你要去的地方。',
      linkText: '回到首页',
      linkLabel: '回到首页'
    },
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: '搜索',
                buttonAriaLabel: '搜索'
              },
              modal: {
                noResultsText: '无法找到结果',
                resetButtonTitle: '清空搜索内容',
                footer: {
                  selectText: '选择',
                  navigateText: '切换',
                  closeText: '关闭'
                },
                displayDetails: '显示细节',
                backButtonTitle: '返回',

              }
            }
          }
        }
      }
    },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式'
  },
  cleanUrls: true,
  ignoreDeadLinks: true,
  markdown: {
    languageAlias: { autolang: 'cpp' },
    math: true,
    lineNumbers: true
  },
  sitemap: {
    hostname: 'https://design.autolang.dev',
  },
  lastUpdated: true,
  head: [
    ['link', { rel: 'icon', href: 'https://static.autolang.dev/icons/autolang.svg' }],
  ],  
});
