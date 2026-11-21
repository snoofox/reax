export function Footer() {
  return (
    <footer id="site-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <strong>REAX</strong>
          <span>The power of RxJS with the syntax of React.</span>
        </div>
        <div class="footer-links">
          <a href="#/docs">Docs</a>
          <a href="#/integrations">Integrations</a>
          <a href="#/references">References</a>
          <a
            href="https://github.com/snoofox/reax"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <a
            href="https://www.npmjs.com/package/@snoofox/reax"
            target="_blank"
            rel="noopener noreferrer"
          >
            npm
          </a>
        </div>
      </div>
      <div class="footer-bottom">
        <p class="footer-disclaimer">
          Built for educational purposes. It will probably break in production, but you'll learn a lot watching it happen.
        </p>
        <p class="footer-copy">MIT License © 2026 snoofox</p>
      </div>
    </footer>
  );
}
