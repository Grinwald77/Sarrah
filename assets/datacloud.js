// ─────────────────────────────────────────────
//  Sarrah DataCloud — replaceable standalone
//  API: window.DataCloud.start(canvasId, size)
// ─────────────────────────────────────────────
window.DataCloud = {

    start(canvasId, size) {
        const c = document.getElementById(canvasId);
        if (!c || c._dcInit) return;
        c._dcInit = true;

        const SCALE = size / 540;
        const W = size, H = size, CX = size / 2, CY = size / 2;
        c.width  = size;
        c.height = size;

        const x = c.getContext('2d');
        const SAFE = Math.min(W, H) * 0.5 * 0.90;
        const MAX_PERSP = 1.4 / (1.4 - 0.97 * 0.6);
        const MAX_SZ = 1.5 * MAX_PERSP * 1.1;
        const R = (SAFE - MAX_SZ) * 0.78;
        const FORM_AMP = 0.32;

        const N = size > 200 ? 4500 : 1200;
        // For small sizes, don't scale sz down — keep particles visible
        const orbs = [];
        const PHI = Math.PI * (3 - Math.sqrt(5));

        for (let i = 0; i < N; i++) {
            const yN = 1 - (i / (N - 1)) * 2;
            const rad = Math.sqrt(1 - yN * yN);
            const th = PHI * i;
            const rr = 0.30 + Math.pow(Math.random(), 0.5) * 0.67;
            orbs.push({
                bx: Math.cos(th) * rad * rr,
                by: yN * rr,
                bz: Math.sin(th) * rad * rr,
                cph: Math.random() * Math.PI * 2,
                sz: (0.6 + Math.random() * 0.9) * 3 * SCALE,
                spark: 0,
                sparkCool: Math.random() * 300
            });
        }

        const C1 = [255, 140, 55];
        const C2 = [160, 80, 235];
        const C_SPARK = [120, 255, 200];  // mint/teal sparks

        function mix2(w, intensity) {
            const r = C1[0] + (C2[0] - C1[0]) * w;
            const g = C1[1] + (C2[1] - C1[1]) * w;
            const b = C1[2] + (C2[2] - C1[2]) * w;
            return [Math.min(255, r * intensity) | 0, Math.min(255, g * intensity) | 0, Math.min(255, b * intensity) | 0];
        }

        function formDeform(nx, ny, nz, t) {
            const a  = Math.sin(nx * 1.5 + ny * 0.9 - nz * 1.1 + t * 0.7);
            const b  = Math.sin(nx * 0.8 - ny * 1.6 + nz * 0.6 + t * 0.55 + 1.7);
            const c2 = Math.sin(-nx * 1.2 + ny * 0.7 + nz * 1.4 + t * 0.85 + 3.3);
            const d  = Math.sin(nx * 2.1 + ny * 1.8 + nz * 1.5 + t * 0.45 + 5.1);
            return 1 + FORM_AMP * (a * 0.45 + b * 0.35 + c2 * 0.30 + d * 0.20);
        }

        let t = 0, rotY = 0;
        const flashes = [];
        let nextFlashAt = 2 + Math.random() * 4;

        function frame() {
            if (!document.getElementById(canvasId)) return; // stop if removed from DOM

            t += 0.018;
            rotY += 0.0035;

            x.fillStyle = 'rgba(0,0,0,0.28)';
            x.fillRect(0, 0, W, H);

            // Spawn flashes
            if (t > nextFlashAt) {
                const ang1 = Math.random() * Math.PI * 2;
                const ang2 = Math.acos(Math.random() * 2 - 1);
                const r = 0.4 + Math.random() * 0.5;
                flashes.push({
                    cx: Math.sin(ang2) * Math.cos(ang1) * r,
                    cy: Math.cos(ang2) * r,
                    cz: Math.sin(ang2) * Math.sin(ang1) * r,
                    age: 0,
                    life: 0.9 + Math.random() * 0.6,
                    radius: 0.45 + Math.random() * 0.35,
                    hue: Math.random() < 0.5 ? 0 : 1
                });
                nextFlashAt = t + 4 + Math.random() * 6;
            }
            for (let i = flashes.length - 1; i >= 0; i--) {
                flashes[i].age += 0.018;
                if (flashes[i].age > flashes[i].life) flashes.splice(i, 1);
            }

            const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
            const cosX = Math.cos(rotY * 0.5), sinX = Math.sin(rotY * 0.5);
            const draw = [];
            const globalBreathe = 1 + Math.sin(t * 0.35) * 0.04;

            for (let i = 0; i < N; i++) {
                const o = orbs[i];
                const t1 = t * 1.3, t2 = t * 1.0, t3 = t * 1.6;

                let dx = Math.sin(t1 + o.by * 2.8 + o.bz * 2.1) * 0.13
                       + Math.sin(t2 * 1.7 + o.bz * 2.6) * 0.08
                       + Math.cos(t3 * 0.8 + o.by * 3.2) * 0.05;
                let dy = Math.cos(t1 * 1.1 + o.bx * 2.6 + o.bz * 2.3) * 0.13
                       + Math.sin(t3 + o.bx * 2.2) * 0.08
                       + Math.cos(t2 * 1.5 + o.bz * 3.0) * 0.05;
                let dz = Math.sin(t2 * 1.2 + o.bx * 3.0 + o.by * 2.0) * 0.13
                       + Math.cos(t1 * 1.3 + o.by * 2.4) * 0.08
                       + Math.sin(t3 * 0.9 + o.bx * 2.8) * 0.05;

                let nx = o.bx + dx, ny = o.by + dy, nz = o.bz + dz;

                const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
                if (len > 0.001) {
                    const ux = nx / len, uy = ny / len, uz = nz / len;
                    const shellR = formDeform(ux, uy, uz, t) * globalBreathe;
                    const maxLen = shellR * 0.97;
                    if (len > maxLen) { const k = maxLen / len; nx *= k; ny *= k; nz *= k; }
                }

                let rx1 = nx * cosY + nz * sinY;
                let rz1 = -nx * sinY + nz * cosY;
                let ry1 = ny * cosX - rz1 * sinX;
                let rz2 = ny * sinX + rz1 * cosX;

                const persp = 1.4 / (1.4 - rz2 * 0.6);
                let sx = CX + rx1 * R * persp;
                let sy = CY + ry1 * R * persp;

                const wave = Math.sin(o.bx * 2.4 + o.by * 2.0 + o.bz * 2.2 - t * 2.2 + o.cph * 0.3);
                const w = (wave + 1) * 0.5;
                let intensity = 1.15 + Math.sin(t * 1.2 + o.cph) * 0.15;

                o.sparkCool--;
                if (o.sparkCool < 0 && Math.random() < 0.0022) {
                    o.spark = 1;
                    o.sparkCool = 400 + Math.random() * 600;
                }

                let flashBoost = 0, flashHueShift = 0;
                for (let j = 0; j < flashes.length; j++) {
                    const fl = flashes[j];
                    const ddx = nx - fl.cx, ddy = ny - fl.cy, ddz = nz - fl.cz;
                    const d2 = ddx * ddx + ddy * ddy + ddz * ddz;
                    const r2 = fl.radius * fl.radius;
                    if (d2 < r2) {
                        const tn = fl.age / fl.life;
                        const env = tn < 0.15 ? (tn / 0.15) : Math.pow(1 - (tn - 0.15) / 0.85, 1.8);
                        const spatial = 1 - Math.sqrt(d2) / fl.radius;
                        const power = env * spatial * 1.4;
                        flashBoost += power;
                        flashHueShift += (fl.hue - w) * power * 0.6;
                    }
                }
                if (flashBoost > 0) intensity += flashBoost * 0.9;

                let rC, gC, bC;
                const wEff = Math.max(0, Math.min(1, w + flashHueShift));
                if (o.spark > 0.01 || flashBoost > 0.4) {
                    const s = Math.max(o.spark, Math.min(1, flashBoost * 0.5));
                    const base = mix2(wEff, intensity);
                    rC = Math.min(255, base[0] * (1 - s * 0.7) + C_SPARK[0] * s * 0.7 * 1.3) | 0;
                    gC = Math.min(255, base[1] * (1 - s * 0.7) + C_SPARK[1] * s * 0.7 * 1.3) | 0;
                    bC = Math.min(255, base[2] * (1 - s * 0.7) + C_SPARK[2] * s * 0.7 * 1.3) | 0;
                    if (o.spark > 0.01) o.spark *= 0.93;
                } else {
                    [rC, gC, bC] = mix2(wEff, intensity);
                }

                const depth = (rz2 + 1) * 0.5;
                const sz = o.sz * persp * (0.55 + depth * 0.55) * (1 + flashBoost * 0.4);
                const alphaBoost = size < 200 ? 0.35 : 0;
                const alpha = Math.min(1, 0.6 + depth * 0.5 + flashBoost * 0.3 + alphaBoost);

                const ddx2 = sx - CX, ddy2 = sy - CY;
                const dist = Math.sqrt(ddx2 * ddx2 + ddy2 * ddy2);
                const maxDist = SAFE - sz;
                if (dist > maxDist && dist > 0) { const k = maxDist / dist; sx = CX + ddx2 * k; sy = CY + ddy2 * k; }

                draw.push({ sx, sy, sz, rC, gC, bC, alpha, depth, spark: o.spark, flashBoost });
            }

            draw.sort((a, b) => a.depth - b.depth);

            for (let i = 0; i < draw.length; i++) {
                const d = draw[i];
                const g = x.createRadialGradient(d.sx, d.sy, 0, d.sx, d.sy, d.sz);
                g.addColorStop(0, `rgba(${d.rC},${d.gC},${d.bC},${d.alpha})`);
                g.addColorStop(0.5, `rgba(${d.rC},${d.gC},${d.bC},${d.alpha * 0.6})`);
                g.addColorStop(1, `rgba(${d.rC},${d.gC},${d.bC},0)`);
                x.fillStyle = g;
                x.beginPath();
                x.arc(d.sx, d.sy, d.sz, 0, Math.PI * 2);
                x.fill();
                if (d.spark > 0.1 || d.flashBoost > 0.3 || d.depth > 0.75) {
                    x.fillStyle = `rgba(${Math.min(255, d.rC + 60)},${Math.min(255, d.gC + 60)},${Math.min(255, d.bC + 60)},${Math.min(1, d.alpha * 0.95)})`;
                    x.beginPath();
                    x.arc(d.sx, d.sy, d.sz * 0.42, 0, Math.PI * 2);
                    x.fill();
                }
            }

            requestAnimationFrame(frame);
        }

        x.fillStyle = '#000';
        x.fillRect(0, 0, W, H);
        frame();
    }
};
