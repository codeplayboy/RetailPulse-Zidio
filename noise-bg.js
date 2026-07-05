registerPaint('noise-bg', class {
  static get inputProperties() {
    return ['--noise-seed', '--noise-alpha', '--noise-color1', '--noise-color2'];
  }
  paint(ctx, size, props) {
    const seed = parseInt(props.get('--noise-seed') || '1', 10);
    const alpha = parseFloat(props.get('--noise-alpha') || '0.055');
    const c1 = (props.get('--noise-color1') + '').trim() || '#a855f7';
    const c2 = (props.get('--noise-color2') + '').trim() || '#22d3ee';

    let rand = (seed ^ 0xdeadbeef) >>> 0;
    const next = () => {
      rand = Math.imul(rand ^ (rand >>> 16), 0x45d9f3b) >>> 0;
      rand = Math.imul(rand ^ (rand >>> 16), 0x45d9f3b) >>> 0;
      return (rand >>> 0) / 0xffffffff;
    };

    const bs = 2;
    for (let y = 0; y < size.height; y += bs) {
      for (let x = 0; x < size.width; x += bs) {
        const n = next();
        if (n < alpha) {
          ctx.fillStyle = next() > 0.5 ? c1 : c2;
          ctx.globalAlpha = (n / alpha) * 0.35;
          ctx.fillRect(x, y, bs, bs);
        }
      }
    }
  }
});
