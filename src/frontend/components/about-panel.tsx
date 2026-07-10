export function AboutPanel() {
  return (
    <div className="page-stack">
      <header className="hero-panel">
        <span className="eyebrow">关于这个项目</span>
        <h1>它帮你把域名变成代理软件能用的链接。</h1>
        <p>你只需要维护分类和域名，系统会自动生成 OpenClash、Mihomo、Loon、Quantumult X、Surge 等格式。</p>
      </header>
      <section className="soft-card">
        <h2>怎么使用</h2>
        <p>新增分类，添加域名，进入订阅链接页，选择你的代理软件并复制链接到客户端。</p>
      </section>
      <section className="soft-card">
        <h2>隐私边界</h2>
        <p>Token 链接不是绝对私密链接。如果完整地址泄露，别人也能访问规则内容。</p>
      </section>
    </div>
  );
}
