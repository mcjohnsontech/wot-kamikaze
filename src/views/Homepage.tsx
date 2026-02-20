import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  IconTruckDelivery,
  IconMapPinCheck,
  IconShieldCheck,
  IconChartBar,
  IconDeviceMobile,
  IconBrandWhatsapp,
  IconArrowRight,
  IconCircleCheck,
  IconSend,
  IconSun,
  IconMoon,
  IconStar,
  IconQuote,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';

/* ─────────────────── Theme ─────────────────── */
const useTheme = () => {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);
  return { dark, toggle: () => setDark(d => !d) };
};

/* ─────────────────── InView ─────────────────── */
const useInView = (threshold = 0.12) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
};

/* ─────────────────── Scroll-driven 3D reveal ─────────────────── */
const use3DScrollReveal = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'perspective(1200px) rotateX(12deg) translateY(60px) scale(0.96)';
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.style.transition = 'opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1)';
        el.style.opacity = '1';
        el.style.transform = 'perspective(1200px) rotateX(0deg) translateY(0px) scale(1)';
        obs.disconnect();
      }
    }, { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
};

/* ─────────────────── Counter ─────────────────── */
const Counter: React.FC<{ end: number; suffix?: string; label: string }> = ({ end, suffix = '', label }) => {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView();
  useEffect(() => {
    if (!inView || end === 0) { setCount(end); return; }
    let s = 0;
    const timer = setInterval(() => {
      s += end / 60;
      if (s >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(s));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end]);
  return (
    <div ref={ref} className="stat-item">
      <span className="stat-number">{count}{suffix}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
};

/* ─────────────────── Marquee ─────────────────── */
const testimonials = [
  { name: 'Chioma', role: 'Fashion Store Owner', quote: 'WOT saved me 3 hours daily on WhatsApp. Customers love the tracking. Zero disputes now.' },
  { name: 'Tunde', role: 'Food Delivery SME', quote: 'The OTP verification alone prevents fake delivery complaints. Highly recommended.' },
  { name: 'Amara', role: 'E-commerce Founder', quote: 'Riders love the PWA app. Customers get real-time updates. Our delivery rate improved 40%.' },
  { name: 'Kwame', role: 'Logistics Coordinator', quote: 'Analytics dashboard shows which riders are fastest. We optimize routes every single day.' },
  { name: 'Zainab', role: 'Pharmacy Chain Manager', quote: 'Customer satisfaction increased measurably after adding WOT. Worth every kobo.' },
  { name: 'Segun', role: 'Retail Manager', quote: 'Setup took 30 minutes. WhatsApp integration is seamless. Love the auto-updates.' },
  { name: 'Fatima', role: 'Beauty Supply Owner', quote: 'My customers stopped calling me constantly. WOT handles all delivery updates automatically.' },
  { name: 'Emeka', role: 'Electronics Retailer', quote: 'The GPS tracking feature is incredible. Customers trust us more now. Sales are up 25%.' },
];

const MarqueeRow: React.FC<{ items: typeof testimonials; reverse?: boolean }> = ({ items, reverse = false }) => {
  const doubled = [...items, ...items];
  return (
    <div className="marquee-wrapper">
      <div className={`marquee-track${reverse ? ' marquee-reverse' : ''}`}>
        {doubled.map((t, i) => (
          <div className="marquee-card" key={i}>
            <div className="mcard-quote-icon"><IconQuote size={16} /></div>
            <p className="mcard-text">"{t.quote}"</p>
            <div className="mcard-footer">
              <div className="mcard-avatar">{t.name[0]}</div>
              <div>
                <div className="mcard-name">{t.name}</div>
                <div className="mcard-role">{t.role}</div>
              </div>
              <div className="mcard-stars">
                {[...Array(5)].map((_, si) => <IconStar key={si} size={11} fill="currentColor" />)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────── 3D Tilt Feature Card ─────────────────── */
const FeatureCard3D: React.FC<{ icon: React.ComponentType<{size:number}>; title: string; desc: string; delay: number }> = ({ icon: Icon, title, desc, delay }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const wrapRef = use3DScrollReveal();

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(600px) rotateX(${-y * 12}deg) rotateY(${x * 12}deg) translateZ(8px)`;
    const glow = card.querySelector('.card-glow') as HTMLElement;
    if (glow) { glow.style.left = `${(x + 0.5) * 100}%`; glow.style.top = `${(y + 0.5) * 100}%`; }
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1)';
    card.style.transform = 'perspective(600px) rotateX(0) rotateY(0) translateZ(0)';
    setTimeout(() => { if (card) card.style.transition = ''; }, 600);
  }, []);

  return (
    <div ref={wrapRef} style={{ transitionDelay: `${delay}s` }}>
      <div ref={cardRef} className="feature-card" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        <div className="card-glow" />
        <div className="feature-icon-wrap"><Icon size={22} /></div>
        <div className="feature-title">{title}</div>
        <p className="feature-desc">{desc}</p>
      </div>
    </div>
  );
};

/* ─────────────────── Phone ─────────────────── */
const PhoneMockup: React.FC = () => {
  const [vis, setVis] = useState([false, false, false, false]);
  useEffect(() => {
    [0, 1, 2, 3].forEach(i => setTimeout(() => setVis(v => { const n = [...v]; n[i] = true; return n; }), 700 + i * 550));
  }, []);
  return (
    <div className="phone-shell">
      <div className="phone-notch" />
      <div className="phone-screen-inner">
        <div className="phone-header-bar">
          <div className="phone-avatar-sm"><IconTruckDelivery size={14} /></div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#dde5ff' }}>WOT Delivery</div>
            <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>● Online</div>
          </div>
        </div>
        {vis[0] && <div className="chat-bubble chat-in fade-in">Hi! Order #4821 confirmed ✅</div>}
        {vis[1] && <div className="chat-bubble chat-out fade-in">Your rider is heading to you 🚴</div>}
        {vis[2] && (
          <div className="fade-in" style={{ margin: '8px 0' }}>
            <div className="track-pill">
              <div style={{ fontSize: 10, fontWeight: 600, color: '#8898cc', marginBottom: 6 }}>Live Tracking • 12 mins away</div>
              <div className="track-dots-row">
                {['Picked','En route','Arriving','Delivered'].map((s, i) => (
                  <div key={s} className="track-step">
                    <div className={`track-dot-sm${i < 2 ? ' done' : i === 2 ? ' active' : ''}`} />
                    <div style={{ fontSize: 9, color: i < 3 ? '#4a82ff' : '#4f5f8a', marginTop: 3 }}>{s}</div>
                  </div>
                ))}
              </div>
              <div className="track-line-bg"><div className="track-line-fill" /></div>
            </div>
          </div>
        )}
        {vis[3] && <div className="chat-bubble chat-system fade-in">OTP: 7842 — confirm delivery 🔒</div>}
      </div>
    </div>
  );
};

/* ─────────────────── MAIN ─────────────────── */
const LandingPage: React.FC = () => {
  const { dark, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  /* Scroll parallax on hero */
  useEffect(() => {
    const onScroll = () => {
      const hero = heroRef.current;
      if (!hero) return;
      const y = window.scrollY;
      const orbs = hero.querySelectorAll<HTMLElement>('.orb');
      if (orbs[0]) orbs[0].style.transform = `translate(${y * 0.14}px, ${y * 0.08}px)`;
      if (orbs[1]) orbs[1].style.transform = `translate(${-y * 0.1}px, ${y * 0.11}px)`;
      if (orbs[2]) orbs[2].style.transform = `translate(${y * 0.05}px, ${-y * 0.06}px)`;
      const headline = hero.querySelector<HTMLElement>('.hero-headline');
      if (headline) headline.style.transform = `perspective(1000px) translateY(${y * 0.28}px) rotateX(${y * 0.009}deg)`;
      const sub = hero.querySelector<HTMLElement>('.hero-sub');
      if (sub) sub.style.transform = `translateY(${y * 0.14}px)`;
      const phone = hero.querySelector<HTMLElement>('.phone-float-wrap');
      if (phone) phone.style.transform = `perspective(1000px) translateY(${-y * 0.07}px) rotateX(${-y * 0.004}deg)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tomato+Grotesk:wght@400;500;600;700;800;900&display=swap');

        :root, [data-theme="light"] {
          --bg: #f3f5fb;
          --bg2: #ebeef8;
          --surface: #ffffff;
          --surface2: #f7f9ff;
          --border: rgba(0,0,0,0.07);
          --text: #070a1c;
          --text2: #374068;
          --text3: #6872a0;
          --blue: #1a5fff;
          --blue2: #0041d9;
          --blue3: #5b8eff;
          --blue-glow: rgba(26,95,255,0.18);
          --blue-glow2: rgba(26,95,255,0.07);
          --nav-bg: rgba(243,245,251,0.9);
          --card-bg: #ffffff;
          --card-border: rgba(26,95,255,0.1);
          --shadow-card: 0 2px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04);
          --shadow-blue: 0 8px 36px rgba(26,95,255,0.22);
          --hero-bg: linear-gradient(135deg,#070d2c 0%,#0d1a4d 45%,#080e2a 100%);
        }
        [data-theme="dark"] {
          --bg: #060919;
          --bg2: #080d1e;
          --surface: #0d1526;
          --surface2: #111d33;
          --border: rgba(255,255,255,0.055);
          --text: #dce4ff;
          --text2: #8797cc;
          --text3: #4e5e8a;
          --blue: #4a82ff;
          --blue2: #2460ff;
          --blue3: #7aa5ff;
          --blue-glow: rgba(74,130,255,0.22);
          --blue-glow2: rgba(74,130,255,0.08);
          --nav-bg: rgba(6,9,25,0.92);
          --card-bg: #0d1526;
          --card-border: rgba(74,130,255,0.12);
          --shadow-card: 0 2px 16px rgba(0,0,0,0.32);
          --shadow-blue: 0 8px 36px rgba(74,130,255,0.28);
          --hero-bg: linear-gradient(135deg,#020714 0%,#060f2e 45%,#020714 100%);
        }

        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;overflow-x:hidden;}
        body{background:var(--bg);color:var(--text);font-family:'TomatoGrotesk',sans-serif;transition:background .35s,color .35s;overflow-x:hidden;}
        ::selection{background:var(--blue);color:#fff;}
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-track{background:var(--bg2);}
        ::-webkit-scrollbar-thumb{background:var(--blue);border-radius:3px;}

        /* NAV */
        .nav{position:fixed;top:0;left:0;right:0;z-index:200;background:var(--nav-bg);backdrop-filter:blur(24px) saturate(180%);border-bottom:1px solid var(--border);transition:background .3s,box-shadow .3s;}
        .nav.scrolled{box-shadow:0 1px 32px rgba(0,0,0,0.15);}
        .nav-inner{max-width:1200px;margin:0 auto;padding:0 28px;height:66px;display:flex;align-items:center;justify-content:space-between;}
        .logo{display:flex;align-items:center;gap:10px;text-decoration:none;}
        .logo-icon{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,var(--blue),var(--blue2));display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-blue);transition:transform .4s cubic-bezier(.34,1.56,.64,1);}
        .logo:hover .logo-icon{transform:rotate(-10deg) scale(1.12);}
        .logo-text{font-family:'TomatoGrotesk',sans-serif;font-weight:800;font-size:21px;color:var(--text);letter-spacing:-.5px;}
        .nav-links{display:flex;align-items:center;gap:36px;}
        .nav-link{font-size:14px;font-weight:500;color:var(--text2);text-decoration:none;transition:color .2s;position:relative;padding-bottom:2px;}
        .nav-link::after{content:'';position:absolute;bottom:0;left:0;width:0;height:2px;background:var(--blue);border-radius:1px;transition:width .25s;}
        .nav-link:hover{color:var(--blue);}
        .nav-link:hover::after{width:100%;}
        .nav-actions{display:flex;align-items:center;gap:10px;}
        .theme-btn{width:36px;height:36px;border-radius:9px;border:1px solid var(--border);background:var(--surface2);color:var(--text2);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;}
        .theme-btn:hover{border-color:var(--blue);color:var(--blue);transform:rotate(15deg);}
        .cta-pill{padding:9px 22px;border-radius:100px;background:linear-gradient(135deg,var(--blue),var(--blue2));color:#fff;font-size:13.5px;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:6px;transition:all .3s;box-shadow:var(--shadow-blue);}
        .cta-pill:hover{transform:translateY(-2px);box-shadow:0 14px 44px rgba(26,95,255,.38);}

        /* HERO */
        .hero{min-height:100vh;background:var(--hero-bg);display:flex;align-items:center;padding-top:66px;position:relative;overflow:hidden;}
        .hero-noise{position:absolute;inset:0;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.035'/%3E%3C/svg%3E");opacity:.6;}
        .hero-grid{position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(74,130,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(74,130,255,.05) 1px,transparent 1px);background-size:72px 72px;mask-image:radial-gradient(ellipse 70% 80% at 50% 30%,black 10%,transparent 100%);}
        .hero-orbs{position:absolute;inset:0;pointer-events:none;z-index:0;}
        .orb{position:absolute;border-radius:50%;filter:blur(80px);will-change:transform;}
        .orb-1{width:700px;height:700px;background:radial-gradient(circle,rgba(26,95,255,.2) 0%,transparent 70%);top:-200px;left:-200px;}
        .orb-2{width:500px;height:500px;background:radial-gradient(circle,rgba(0,65,217,.16) 0%,transparent 70%);bottom:-100px;right:0;}
        .orb-3{width:280px;height:280px;background:radial-gradient(circle,rgba(100,160,255,.14) 0%,transparent 70%);top:40%;left:50%;}
        .orb-ring{width:900px;height:900px;border:1px solid rgba(74,130,255,.07);border-radius:50%;top:50%;left:50%;transform:translate(-50%,-50%);animation:ringPulse 9s ease-in-out infinite;filter:none;}
        @keyframes ringPulse{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.5;}50%{transform:translate(-50%,-50%) scale(1.1);opacity:.15;}}

        .hero-inner{max-width:1200px;margin:0 auto;padding:80px 28px 100px;position:relative;z-index:2;display:grid;grid-template-columns:1fr 400px;gap:72px;align-items:center;}
        .hero-left{display:flex;flex-direction:column;}
        .hero-badge{display:inline-flex;align-items:center;gap:8px;padding:7px 16px;border-radius:100px;border:1px solid rgba(74,130,255,.3);background:rgba(74,130,255,.1);color:#7aa5ff;font-size:12.5px;font-weight:600;width:fit-content;margin-bottom:28px;animation:fadeDown .8s ease both;}
        .badge-pulse{width:7px;height:7px;border-radius:50%;background:#4a82ff;animation:bpulse 2s ease infinite;}
        @keyframes bpulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(74,130,255,.5);}50%{opacity:.6;box-shadow:0 0 0 6px rgba(74,130,255,0);}}
        @keyframes fadeDown{from{opacity:0;transform:translateY(-16px);}to{opacity:1;transform:translateY(0);}}
        .hero-headline{font-family:'TomatoGrotesk',sans-serif;font-size:clamp(44px,5.5vw,78px);font-weight:900;line-height:1.0;letter-spacing:-2.5px;color:#fff;animation:fadeUp .9s .1s ease both;will-change:transform;}
        .hero-headline .gradient-text{background:linear-gradient(135deg,#4a82ff,#a8c8ff,#60a5fa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-size:200% 200%;animation:gradShift 4s ease infinite;}
        @keyframes gradShift{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(32px);}to{opacity:1;transform:translateY(0);}}
        .hero-sub{margin-top:24px;margin-bottom:40px;font-size:17px;color:rgba(200,220,255,.7);line-height:1.78;max-width:480px;animation:fadeUp .9s .22s ease both;will-change:transform;}
        .hero-actions{display:flex;gap:14px;flex-wrap:wrap;animation:fadeUp .9s .35s ease both;}
        .btn-hp{display:inline-flex;align-items:center;gap:10px;padding:15px 32px;border-radius:14px;background:linear-gradient(135deg,var(--blue),var(--blue2));color:#fff;font-size:15px;font-weight:700;text-decoration:none;border:none;cursor:pointer;transition:all .3s cubic-bezier(.34,1.56,.64,1);box-shadow:var(--shadow-blue);position:relative;overflow:hidden;}
        .btn-hp::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.15),transparent);opacity:0;transition:opacity .3s;}
        .btn-hp:hover{transform:translateY(-3px) scale(1.02);box-shadow:0 0 0 8px rgba(74,130,255,.12),0 20px 50px rgba(74,130,255,.4);}
        .btn-hp:hover::after{opacity:1;}
        .btn-ho{display:inline-flex;align-items:center;gap:8px;padding:15px 28px;border-radius:14px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:rgba(210,225,255,.8);font-size:15px;font-weight:600;text-decoration:none;cursor:pointer;transition:all .3s;backdrop-filter:blur(8px);}
        .btn-ho:hover{border-color:rgba(74,130,255,.5);background:rgba(74,130,255,.1);color:#fff;}
        .hero-trust{display:flex;align-items:center;gap:12px;margin-top:36px;animation:fadeUp .9s .48s ease both;}
        .trust-avatars{display:flex;}
        .trust-av{width:30px;height:30px;border-radius:50%;border:2px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;margin-left:-8px;}
        .trust-av:first-child{margin-left:0;}
        .trust-text{font-size:13px;color:rgba(170,195,255,.7);}
        .trust-text strong{color:rgba(210,230,255,.9);}
        .hero-right{display:flex;justify-content:center;align-items:center;}
        .phone-float-wrap{animation:phoneFloat 7s ease-in-out infinite;will-change:transform;filter:drop-shadow(0 40px 80px rgba(26,95,255,.28));}
        @keyframes phoneFloat{0%,100%{transform:perspective(1000px) translateY(0) rotateY(-4deg) rotateX(2deg);}50%{transform:perspective(1000px) translateY(-18px) rotateY(4deg) rotateX(-2deg);}}
        .phone-shell{width:258px;background:#08101f;border:1.5px solid rgba(74,130,255,.28);border-radius:36px;overflow:hidden;box-shadow:0 0 0 8px rgba(74,130,255,.05),0 0 80px rgba(74,130,255,.15),inset 0 1px 0 rgba(255,255,255,.07);}
        .phone-notch{width:80px;height:22px;background:#08101f;border-radius:0 0 16px 16px;margin:0 auto;border:1.5px solid rgba(74,130,255,.18);border-top:none;}
        .phone-screen-inner{padding:12px 14px 20px;}
        .phone-header-bar{display:flex;align-items:center;gap:10px;margin-bottom:14px;}
        .phone-avatar-sm{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#1a5fff,#0041d9);display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 4px 12px rgba(26,95,255,.4);}
        .chat-bubble{padding:9px 13px;border-radius:12px;font-size:11.5px;line-height:1.5;margin-bottom:7px;max-width:85%;}
        .chat-in{background:rgba(255,255,255,.07);color:rgba(195,210,255,.85);border-bottom-left-radius:3px;}
        .chat-out{background:linear-gradient(135deg,#1a5fff,#0041d9);color:#fff;border-bottom-right-radius:3px;margin-left:auto;}
        .chat-system{background:rgba(34,197,94,.12);color:#4ade80;border:1px solid rgba(34,197,94,.2);border-radius:20px;padding:7px 12px;font-size:10.5px;text-align:center;max-width:100%;}
        .fade-in{animation:fadein .5s ease both;}
        @keyframes fadein{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
        .track-pill{background:rgba(255,255,255,.04);border:1px solid rgba(74,130,255,.2);border-radius:12px;padding:10px 12px;}
        .track-dots-row{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;}
        .track-step{display:flex;flex-direction:column;align-items:center;gap:2px;}
        .track-dot-sm{width:10px;height:10px;border-radius:50%;border:2px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);}
        .track-dot-sm.done{background:#1a5fff;border-color:#1a5fff;}
        .track-dot-sm.active{background:#1a5fff;border-color:#1a5fff;box-shadow:0 0 0 4px rgba(26,95,255,.25);animation:activePulse 1.5s ease infinite;}
        @keyframes activePulse{0%,100%{box-shadow:0 0 0 4px rgba(26,95,255,.25);}50%{box-shadow:0 0 0 7px rgba(26,95,255,.1);}}
        .track-line-bg{height:3px;background:rgba(255,255,255,.06);border-radius:2px;margin-top:6px;}
        .track-line-fill{height:100%;width:55%;background:linear-gradient(90deg,#1a5fff,#4a82ff);border-radius:2px;animation:fillLine 1.5s .5s ease both;}
        @keyframes fillLine{from{width:0;}to{width:55%;}}

        /* STATS */
        .stats-band{background:var(--surface);border-top:1px solid var(--border);border-bottom:1px solid var(--border);}
        .stats-inner{max-width:1100px;margin:0 auto;padding:0 28px;display:grid;grid-template-columns:repeat(4,1fr);}
        .stat-item{display:flex;flex-direction:column;align-items:center;gap:4px;padding:40px 24px;border-right:1px solid var(--border);transition:background .3s;}
        .stat-item:last-child{border-right:none;}
        .stat-item:hover{background:var(--surface2);}
        .stat-number{font-family:'TomatoGrotesk',sans-serif;font-size:44px;font-weight:900;color:var(--blue);line-height:1;}
        .stat-label{font-size:13px;color:var(--text3);font-weight:500;text-align:center;}

        /* SECTIONS */
        .section{padding:110px 0;}
        .section-dark{background:var(--bg2);}
        .section-inner{max-width:1200px;margin:0 auto;padding:0 28px;}
        .section-header{margin-bottom:60px;}
        .section-eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--blue);margin-bottom:14px;}
        .section-eyebrow::before{content:'';width:18px;height:2px;background:var(--blue);border-radius:1px;}
        .section-title{font-family:'TomatoGrotesk',sans-serif;font-size:clamp(30px,4vw,52px);font-weight:800;line-height:1.1;letter-spacing:-1.5px;color:var(--text);margin-bottom:14px;}
        .section-sub{font-size:16px;color:var(--text2);line-height:1.75;max-width:520px;}

        /* FEATURES */
        .features-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
        .feature-card{background:var(--card-bg);border:1px solid var(--card-border);border-radius:20px;padding:32px;position:relative;overflow:hidden;transform-style:preserve-3d;cursor:default;box-shadow:var(--shadow-card);transition:border-color .3s,box-shadow .3s;}
        .feature-card:hover{border-color:var(--blue);box-shadow:var(--shadow-blue);}
        .card-glow{position:absolute;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,var(--blue-glow),transparent 70%);transform:translate(-50%,-50%);pointer-events:none;opacity:0;transition:left .1s,top .1s;}
        .feature-card:hover .card-glow{opacity:1;}
        .feature-icon-wrap{width:48px;height:48px;border-radius:13px;background:linear-gradient(135deg,var(--blue),var(--blue2));display:flex;align-items:center;justify-content:center;color:#fff;margin-bottom:20px;box-shadow:var(--shadow-blue);transition:transform .4s cubic-bezier(.34,1.56,.64,1);}
        .feature-card:hover .feature-icon-wrap{transform:scale(1.1) rotate(-6deg);}
        .feature-title{font-family:'TomatoGrotesk',sans-serif;font-size:16px;font-weight:700;color:var(--text);margin-bottom:10px;}
        .feature-desc{font-size:13.5px;color:var(--text2);line-height:1.72;}

        /* HOW */
        .how-grid{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--border);border-radius:20px;overflow:hidden;}
        .step-card{padding:36px 28px;border-right:1px solid var(--border);background:var(--card-bg);transition:background .3s;position:relative;overflow:hidden;}
        .step-card:last-child{border-right:none;}
        .step-card:hover{background:var(--surface2);}
        .step-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--blue),transparent);opacity:0;transition:opacity .3s;}
        .step-card:hover::before{opacity:1;}
        .step-num{font-family:'TomatoGrotesk',sans-serif;font-size:52px;font-weight:900;color:var(--border);line-height:1;margin-bottom:16px;transition:color .3s;}
        .step-card:hover .step-num{color:var(--blue);}
        .step-badge{display:inline-block;padding:3px 10px;border-radius:20px;background:var(--blue-glow2);color:var(--blue);border:1px solid var(--card-border);font-size:11px;font-weight:700;margin-bottom:12px;}
        .step-title{font-family:'TomatoGrotesk',sans-serif;font-size:16px;font-weight:700;color:var(--text);margin-bottom:10px;}
        .step-desc{font-size:13px;color:var(--text2);line-height:1.7;}

        /* TESTIMONIALS MARQUEE */
        .testimonials-section{padding:110px 0;overflow:hidden;background:var(--bg);}
        .testimonials-header{max-width:1200px;margin:0 auto 56px;padding:0 28px;}
        .marquee-wrapper{overflow:hidden;padding:10px 0;mask-image:linear-gradient(90deg,transparent,black 6%,black 94%,transparent);}
        .marquee-track{display:flex;gap:20px;width:max-content;animation:marqueeLeft 42s linear infinite;}
        .marquee-reverse{animation:marqueeRight 38s linear infinite;}
        @keyframes marqueeLeft{from{transform:translateX(0);}to{transform:translateX(-50%);}}
        @keyframes marqueeRight{from{transform:translateX(-50%);}to{transform:translateX(0);}}
        .marquee-wrapper:hover .marquee-track{animation-play-state:paused;}
        .marquee-gap{margin-top:16px;}
        .marquee-card{width:340px;flex-shrink:0;background:var(--card-bg);border:1px solid var(--card-border);border-radius:18px;padding:24px;box-shadow:var(--shadow-card);transition:all .3s;}
        .marquee-card:hover{transform:translateY(-4px) scale(1.01);border-color:var(--blue);box-shadow:var(--shadow-blue);}
        .mcard-quote-icon{color:var(--blue);margin-bottom:12px;opacity:.55;}
        .mcard-text{font-size:13.5px;color:var(--text2);line-height:1.75;margin-bottom:18px;font-style:italic;}
        .mcard-footer{display:flex;align-items:center;gap:10px;}
        .mcard-avatar{width:38px;height:38px;border-radius:10px;flex-shrink:0;background:linear-gradient(135deg,var(--blue),var(--blue2));display:flex;align-items:center;justify-content:center;font-family:'TomatoGrotesk',sans-serif;font-weight:800;font-size:15px;color:#fff;}
        .mcard-name{font-weight:700;font-size:13px;color:var(--text);}
        .mcard-role{font-size:11.5px;color:var(--text3);margin-top:1px;}
        .mcard-stars{display:flex;gap:3px;color:#f59e0b;margin-left:auto;align-self:flex-start;}

        /* CTA */
        .cta-section{padding:120px 0;background:linear-gradient(135deg,#030c2e 0%,#0a1a5c 50%,#030c2e 100%);position:relative;overflow:hidden;}
        .cta-section::before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(74,130,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(74,130,255,.05) 1px,transparent 1px);background-size:56px 56px;}
        .cta-glow{position:absolute;width:700px;height:700px;border-radius:50%;background:radial-gradient(circle,rgba(74,130,255,.22),transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%);filter:blur(60px);animation:ctaGlow 7s ease-in-out infinite alternate;}
        @keyframes ctaGlow{from{opacity:.5;transform:translate(-50%,-50%) scale(1);}to{opacity:1;transform:translate(-50%,-50%) scale(1.25);}}
        .cta-inner{max-width:740px;margin:0 auto;padding:0 28px;text-align:center;position:relative;z-index:2;}
        .cta-label{font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:rgba(140,180,255,.65);margin-bottom:20px;}
        .cta-title{font-family:'TomatoGrotesk',sans-serif;font-size:clamp(36px,5.5vw,64px);font-weight:900;color:#fff;letter-spacing:-2px;line-height:1.05;margin-bottom:20px;}
        .cta-sub{font-size:17px;color:rgba(175,205,255,.65);line-height:1.75;margin-bottom:48px;}
        .btn-white{display:inline-flex;align-items:center;gap:10px;padding:17px 44px;border-radius:14px;background:#fff;color:var(--blue2);font-size:16px;font-weight:700;text-decoration:none;border:none;cursor:pointer;transition:all .35s cubic-bezier(.34,1.56,.64,1);box-shadow:0 8px 40px rgba(0,0,0,.25);}
        .btn-white:hover{transform:translateY(-4px) scale(1.03);box-shadow:0 24px 60px rgba(0,0,0,.35);}

        /* NEWSLETTER */
        .newsletter-section{padding:80px 0;background:var(--surface);border-top:1px solid var(--border);}
        .newsletter-inner{max-width:560px;margin:0 auto;padding:0 28px;text-align:center;}
        .newsletter-title{font-family:'TomatoGrotesk',sans-serif;font-size:30px;font-weight:800;color:var(--text);margin-bottom:8px;letter-spacing:-.5px;}
        .newsletter-sub{font-size:15px;color:var(--text2);margin-bottom:28px;}
        .newsletter-form{display:flex;gap:8px;background:var(--surface2);border:1px solid var(--border);border-radius:14px;padding:6px;}
        .newsletter-input{flex:1;padding:12px 16px;background:transparent;border:none;outline:none;font-size:14px;color:var(--text);}
        .newsletter-input::placeholder{color:var(--text3);}
        .newsletter-btn{padding:12px 20px;border-radius:10px;background:linear-gradient(135deg,var(--blue),var(--blue2));color:#fff;border:none;cursor:pointer;display:flex;align-items:center;gap:6px;font-size:14px;font-weight:600;transition:all .3s;box-shadow:var(--shadow-blue);flex-shrink:0;}
        .newsletter-btn:hover{transform:scale(1.04);}

        /* FOOTER */
        .footer{padding:72px 0 40px;background:var(--bg2);border-top:1px solid var(--border);}
        .footer-inner{max-width:1200px;margin:0 auto;padding:0 28px;}
        .footer-top{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;gap:48px;margin-bottom:56px;}
        .footer-brand-desc{font-size:13.5px;color:var(--text3);line-height:1.7;margin-top:14px;max-width:220px;}
        .footer-col-head{font-family:'TomatoGrotesk',sans-serif;font-size:12px;font-weight:700;color:var(--text);margin-bottom:16px;letter-spacing:.5px;}
        .footer-links{display:flex;flex-direction:column;gap:10px;}
        .footer-link{font-size:13.5px;color:var(--text3);text-decoration:none;transition:color .2s;}
        .footer-link:hover{color:var(--blue);}
        .footer-bottom{padding-top:32px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;}
        .footer-copy{font-size:12.5px;color:var(--text3);}

        /* RESPONSIVE */
        @media(max-width:1024px){
          .hero-inner{grid-template-columns:1fr;text-align:center;}
          .hero-sub,.hero-actions{margin-left:auto;margin-right:auto;}
          .hero-actions{justify-content:center;}
          .hero-trust{justify-content:center;}
          .hero-right{display:none;}
          .features-grid{grid-template-columns:repeat(2,1fr);}
          .how-grid{grid-template-columns:repeat(2,1fr);}
          .footer-top{grid-template-columns:1fr 1fr;gap:32px;}
          .stats-inner{grid-template-columns:repeat(2,1fr);}
          .stat-item{border-right:none;border-bottom:1px solid var(--border);}
        }
        @media(max-width:640px){
          .features-grid,.how-grid{grid-template-columns:1fr;}
          .nav-links{display:none;}
          .footer-top{grid-template-columns:1fr 1fr;}
          .newsletter-form{flex-direction:column;}
        }
      `}</style>

      {/* NAV */}
      <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
        <div className="nav-inner">
          <a href="#" className="logo">
            <div className="logo-icon"><IconTruckDelivery size={19} color="#fff" /></div>
            <span className="logo-text">WOT</span>
          </a>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#how" className="nav-link">How It Works</a>
            <a href="#testimonials" className="nav-link">Reviews</a>
          </div>
          <div className="nav-actions">
            <button className="theme-btn" onClick={toggle} aria-label="Toggle theme">
              {dark ? <IconSun size={16} /> : <IconMoon size={16} />}
            </button>
            <Link to="/auth" className="cta-pill">Get Started <IconArrowRight size={14} /></Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" ref={heroRef as React.RefObject<HTMLElement>}>
        <div className="hero-noise" />
        <div className="hero-grid" />
        <div className="hero-orbs">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
          <div className="orb orb-ring" />
        </div>
        <div className="hero-inner">
          <div className="hero-left">
            <div className="hero-badge">
              <span className="badge-pulse" />
              Trusted by 100+ Nigerian SMEs
            </div>
            <h1 className="hero-headline">
              Better Deliveries,<br />
              <span className="gradient-text">Better Trust.</span>
            </h1>
            <p className="hero-sub">
              Automate your post-order conversations. Give customers live tracking, instant WhatsApp updates, and secure delivery codes. Focus on sales, not messages.
            </p>
            <div className="hero-actions">
              <Link to="/auth" className="btn-hp">Start for Free <IconArrowRight size={18} /></Link>
              <a href="#features" className="btn-ho">Explore Features</a>
            </div>
            <div className="hero-trust">
              <div className="trust-avatars">
                {[['C','#1a5fff','#0041d9'],['T','#0c47d4','#0839b0'],['A','#1560e8','#0c4bc4'],['K','#2568f5','#1254d8'],['Z','#0d52f0','#0940c8']].map(([l, a, b], i) => (
                  <div key={i} className="trust-av" style={{ background: `linear-gradient(135deg,${a},${b})`, zIndex: 5 - i }}>{l}</div>
                ))}
              </div>
              <p className="trust-text"><strong>100+ merchants</strong> — zero disputes with OTP proof</p>
            </div>
          </div>
          <div className="hero-right">
            <div className="phone-float-wrap"><PhoneMockup /></div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="stats-band">
        <div className="stats-inner">
          <Counter end={100} suffix="+" label="Active Merchants" />
          <Counter end={40} suffix="%" label="Delivery Rate Boost" />
          <Counter end={3} suffix="hrs" label="Saved Daily on WhatsApp" />
          <Counter end={0} label="Disputes with OTP Proof" />
        </div>
      </div>

      {/* FEATURES */}
      <section id="features" className="section">
        <div className="section-inner">
          <div ref={use3DScrollReveal()} className="section-header">
            <div className="section-eyebrow">Capabilities</div>
            <h2 className="section-title">Everything You Need<br />to Deliver Better</h2>
            <p className="section-sub">A complete toolkit for modern last-mile delivery — built for Nigerian SMEs.</p>
          </div>
          <div className="features-grid">
            {[
              { icon: IconBrandWhatsapp, title: 'Instant WhatsApp Updates', desc: "Status alerts sent directly from your business number via Twilio. Customers always know what's happening.", delay: 0 },
              { icon: IconMapPinCheck, title: 'Live GPS Tracking', desc: 'Customers watch their delivery in real-time on an interactive map. Zero "Where is my order?" messages.', delay: 0.07 },
              { icon: IconShieldCheck, title: 'Secure OTP Verification', desc: 'Delivery complete only when rider presents the unique code. Eliminate fraud and false claims forever.', delay: 0.14 },
              { icon: IconChartBar, title: 'Delivery Analytics', desc: 'Track your most efficient riders and busiest delivery zones. Make data-driven decisions daily.', delay: 0.21 },
              { icon: IconDeviceMobile, title: 'Rider PWA App', desc: 'Lightweight, works on any smartphone with low data. Riders ready in minutes with no install friction.', delay: 0.28 },
              { icon: IconCircleCheck, title: 'Zero Disputes', desc: 'Eliminate claims of lost or delayed deliveries with timestamped proof of every delivery step.', delay: 0.35 },
            ].map(f => <FeatureCard3D key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="section section-dark">
        <div className="section-inner">
          <div ref={use3DScrollReveal()} className="section-header">
            <div className="section-eyebrow">Process</div>
            <h2 className="section-title">How WOT Works</h2>
            <p className="section-sub">Four steps from order to verified delivery — fully automated.</p>
          </div>
          <div ref={use3DScrollReveal()} className="how-grid">
            {[
              { n: '01', badge: 'Essential', title: 'Order Confirmed', desc: 'Customer places order. WOT instantly sends WhatsApp receipt with a live tracking link.' },
              { n: '02', badge: 'Premium', title: 'Live Tracking', desc: 'Rider accepts. Customer watches GPS location in real-time. No more manual messages.' },
              { n: '03', badge: 'Pro', title: 'OTP Verification', desc: 'Rider arrives. Sends a one-time code to customer. Verified delivery, zero fraud risk.' },
              { n: '04', badge: 'Analytics', title: 'Insights Generated', desc: 'Get delivery time analytics, rider performance scores, and satisfaction metrics automatically.' },
            ].map(({ n, badge, title, desc }) => (
              <div className="step-card" key={n}>
                <div className="step-num">{n}</div>
                <div className="step-badge">{badge}</div>
                <div className="step-title">{title}</div>
                <p className="step-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="testimonials-section">
        <div className="testimonials-header">
          <div ref={use3DScrollReveal()}>
            <div className="section-eyebrow">Social Proof</div>
            <h2 className="section-title">What Merchants Say</h2>
            <p className="section-sub">Join 100+ SMEs who've eliminated manual delivery conversations.</p>
          </div>
        </div>
        <MarqueeRow items={testimonials} reverse={false} />
        <div className="marquee-gap">
          <MarqueeRow items={[...testimonials].reverse()} reverse={true} />
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-glow" />
        <div className="cta-inner">
          <div ref={use3DScrollReveal()}>
            <p className="cta-label">Ready to Scale?</p>
            <h2 className="cta-title">Stop Managing WhatsApp.<br />Start Growing.</h2>
            <p className="cta-sub">Let WOT handle every delivery conversation while you focus on what matters — building your business.</p>
            <Link to="/auth" className="btn-white">Get Started for Free <IconArrowRight size={20} /></Link>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="newsletter-section">
        <div className="newsletter-inner">
          <div ref={use3DScrollReveal()}>
            <h3 className="newsletter-title">Join Our Community</h3>
            <p className="newsletter-sub">Delivery tips, SME growth hacks, and product updates — weekly.</p>
            <div className="newsletter-form">
              <input type="email" placeholder="Enter your email address" className="newsletter-input" />
              <button className="newsletter-btn">Subscribe <IconSend size={15} /></button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div>
              <a href="#" className="logo" style={{ width: 'fit-content' }}>
                <div className="logo-icon"><IconTruckDelivery size={19} color="#fff" /></div>
                <span className="logo-text">WOT</span>
              </a>
              <p className="footer-brand-desc">Automated delivery communication for Nigerian SMEs. Better deliveries, better trust.</p>
            </div>
            {[
              { title: 'Company', links: ['About WOT', 'Careers', 'Blog', 'Press'] },
              { title: 'Product', links: ['Features', 'Pricing', 'API Docs', 'Changelog'] },
              { title: 'Resources', links: ['Help Center', 'Status', 'Contact', 'Community'] },
              { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Cookies'] },
            ].map(({ title, links }) => (
              <div key={title}>
                <div className="footer-col-head">{title}</div>
                <div className="footer-links">{links.map(l => <a key={l} href="#" className="footer-link">{l}</a>)}</div>
              </div>
            ))}
          </div>
          <div className="footer-bottom">
            <span className="footer-copy">© 2026 WOT Logistics. All rights reserved.</span>
            <span className="footer-copy">Trusted by 100+ merchants across Nigeria 🇳🇬</span>
          </div>
        </div>
      </footer>
    </>
  );
};

export default LandingPage;