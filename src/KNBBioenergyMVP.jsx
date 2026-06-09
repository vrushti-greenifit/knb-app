import { useState, useEffect, useRef } from "react";
import { auth, db } from "./firebase";
import { signOut, onAuthStateChanged, signInWithPhoneNumber, RecaptchaVerifier } from "firebase/auth";
import { doc, setDoc, getDoc, addDoc, collection } from "firebase/firestore";

/* ─── FONTS & GLOBAL ─────────────────────────────────────────── */
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Instrument+Serif:ital@0;1&display=swap');`;

const CSS = `
:root {
  --soil: #1e130a;
  --bark: #2d1f12;
  --earth: #4a3728;
  --clay: #7a5c48;
  --sand: #c4a882;
  --wheat: #e8d5b0;
  --cream: #f7f2ea;
  --paper: #fdf9f3;
  --leaf: #2e6b35;
  --leaf-mid: #3d8b44;
  --leaf-light: #5aad62;
  --sage: #8fbc8f;
  --mint: #e8f5e9;
  --gold: #c47c1a;
  --gold-bright: #e8960a;
  --harvest: #f5a623;
  --harvest-pale: #fff8ed;
  --sky: #1a4d7a;
  --sky-light: #e8f2fb;
  --white: #ffffff;
  --text-primary: #1e130a;
  --text-secondary: #5c4535;
  --text-muted: #9a7d6a;
  --border: #e2d5c3;
  --border-light: #f0e8da;
  --shadow-sm: 0 1px 3px rgba(30,19,10,0.06), 0 1px 2px rgba(30,19,10,0.04);
  --shadow-md: 0 4px 12px rgba(30,19,10,0.08), 0 2px 6px rgba(30,19,10,0.05);
  --shadow-lg: 0 12px 32px rgba(30,19,10,0.12), 0 4px 12px rgba(30,19,10,0.08);
  --r-sm: 8px; --r-md: 12px; --r-lg: 16px; --r-xl: 20px;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; overflow-x: hidden; max-width: 100%; }
body {
  font-family: 'Instrument Sans', sans-serif;
  background: var(--paper);
  color: var(--text-primary);
  line-height: 1.6;
  overflow-x: hidden;
  width: 100%;
  max-width: 100vw;
}
button { cursor: pointer; font-family: inherit; }
input, select, textarea { font-family: inherit; }
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: var(--cream); }
::-webkit-scrollbar-thumb { background: var(--sand); border-radius: 3px; }

/* ── TOPBAR ── */
.topbar {
  background: var(--soil);
  color: rgba(255,255,255,0.6);
  font-size: 11.5px;
  padding: 7px 0;
  text-align: center;
  letter-spacing: 0.3px;
}
.topbar span { color: var(--harvest); font-weight: 600; }

/* ── NAV ── */
.nav {
  position: sticky; top: 0; z-index: 90;
  background: rgba(253,249,243,0.97);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
  padding: 0 clamp(16px, 3.5vw, 48px);
  height: 64px;
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; max-width: 100%;
}
.nav-brand { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.nav-logo-mark {
  width: 36px; height: 36px; background: var(--leaf);
  border-radius: var(--r-sm); display: flex; align-items: center; justify-content: center;
  font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 14px;
  color: white; letter-spacing: -0.5px; flex-shrink: 0;
}
.nav-brand-name { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 700; font-size: 17px; color: var(--soil); line-height: 1; }
.nav-brand-tag { font-size: 10px; color: var(--text-muted); letter-spacing: 0.5px; margin-top: 1px; }
.nav-center { display: flex; align-items: center; gap: 2px; }
.nav-link {
  padding: 7px 14px; border-radius: var(--r-sm); font-size: 13.5px; font-weight: 500;
  color: var(--text-secondary); background: none; border: none; transition: all 0.15s;
}
.nav-link:hover { background: var(--cream); color: var(--soil); }
.nav-link.active { background: var(--mint); color: var(--leaf); font-weight: 600; }
.nav-right { display: flex; align-items: center; gap: 10px; }
.btn-ghost {
  padding: 8px 16px; border-radius: var(--r-sm); font-size: 13.5px; font-weight: 500;
  color: var(--text-secondary); background: none; border: 1.5px solid var(--border);
  transition: all 0.15s;
}
.btn-ghost:hover { border-color: var(--clay); color: var(--soil); }
.btn-primary {
  padding: 9px 20px; border-radius: var(--r-sm); font-size: 13.5px; font-weight: 600;
  background: var(--leaf); color: white; border: none; transition: all 0.2s;
  display: inline-flex; align-items: center; gap: 6px;
}
.btn-primary:hover { background: var(--leaf-mid); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(46,107,53,0.25); }
.btn-harvest {
  padding: 9px 20px; border-radius: var(--r-sm); font-size: 13.5px; font-weight: 600;
  background: var(--harvest); color: var(--soil); border: none; transition: all 0.2s;
  display: inline-flex; align-items: center; gap: 6px;
}
.btn-harvest:hover { background: #f5b84a; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(245,166,35,0.3); }
.btn-outline-leaf {
  padding: 9px 20px; border-radius: var(--r-sm); font-size: 13.5px; font-weight: 600;
  background: transparent; color: var(--leaf); border: 1.5px solid var(--leaf); transition: all 0.2s;
}
.btn-outline-leaf:hover { background: var(--mint); }
.btn-lg { padding: 14px 28px; font-size: 15px; border-radius: var(--r-md); }
.btn-xl { padding: 16px 32px; font-size: 16px; border-radius: var(--r-md); }

/* ── TICKER ── */
.ticker-wrap {
  background: var(--bark); border-bottom: 1px solid rgba(255,255,255,0.06);
  overflow: hidden; padding: 10px 0; white-space: nowrap;
}
.ticker-scroll { display: inline-flex; animation: scroll-left 40s linear infinite; }
.ticker-item {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 0 28px; border-right: 1px solid rgba(255,255,255,0.08);
  font-size: 12px; font-family: 'Instrument Sans', monospace;
}
.t-name { color: rgba(255,255,255,0.85); font-weight: 600; }
.t-price { color: var(--harvest); font-weight: 500; }
.t-up { color: #6fcf97; }
.t-dn { color: #eb5757; }
@keyframes scroll-left { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }

/* ── HERO ── */
.hero {
  background: var(--soil);
  background-image: url('/images/hero-bg.jpg');
  background-size: cover;
  background-position: center;
  background-blend-mode: overlay;
  padding: clamp(48px, 7vh, 90px) clamp(20px, 4vw, 64px) 0;
  position: relative; overflow: hidden;
  min-height: calc(100vh - 100px);
  width: 100%;
  display: flex;
  align-items: center;
}
.hero-texture {
  position: absolute; inset: 0; pointer-events: none; opacity: 0.03;
  background-image: repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%);
  background-size: 12px 12px;
}
.hero-glow {
  position: absolute; top: -200px; right: -100px;
  width: 700px; height: 700px; border-radius: 50%;
  background: radial-gradient(circle, rgba(46,107,53,0.18) 0%, transparent 60%);
  pointer-events: none;
}
.hero-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr clamp(320px, 35%, 440px); gap: clamp(32px, 5vw, 64px); align-items: center; width: 100%; padding-bottom: clamp(48px, 6vh, 80px); }
.hero-left { padding-bottom: 0; }
.hero-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(245,166,35,0.12); border: 1px solid rgba(245,166,35,0.25);
  color: var(--harvest); font-size: 11.5px; font-weight: 600; letter-spacing: 1.5px;
  text-transform: uppercase; padding: 5px 12px; border-radius: 20px; margin-bottom: 24px;
}
.hero-pulse { width: 6px; height: 6px; background: var(--harvest); border-radius: 50%; animation: pulse 2s infinite; }
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }
.hero h1 {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: clamp(40px, 5vw, 68px); font-weight: 800;
  color: white; line-height: 1.05; letter-spacing: -1.5px;
  margin-bottom: 20px;
}
.hero h1 em { color: var(--harvest); font-style: normal; }
.hero-sub { font-size: 17px; color: rgba(255,255,255,0.55); line-height: 1.75; max-width: 520px; margin-bottom: 36px; font-weight: 400; }
.hero-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 52px; }
.hero-trust { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
.trust-item { display: flex; align-items: center; gap: 7px; color: rgba(255,255,255,0.45); font-size: 12.5px; }
.trust-icon { font-size: 15px; }
.hero-right { position: relative; align-self: center; }
.hero-role-cards {
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09);
  border-radius: var(--r-xl); padding: 28px; margin-bottom: 0;
}
.hero-role-title { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 16px; }
.role-cards-grid { display: flex; flex-direction: column; gap: 10px; }
.role-card-hero {
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09);
  border-radius: var(--r-md); padding: 16px 18px; cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; gap: 14px;
}
.role-card-hero:hover { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.18); transform: translateX(4px); }
.role-card-hero.selected { background: rgba(46,107,53,0.2); border-color: rgba(46,107,53,0.5); }
.rch-icon { font-size: 26px; flex-shrink: 0; }
.rch-label { font-size: 15px; font-weight: 600; color: white; line-height: 1.2; }
.rch-sub { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 2px; }
.rch-arrow { margin-left: auto; color: rgba(255,255,255,0.25); font-size: 16px; transition: all 0.2s; }
.role-card-hero:hover .rch-arrow { color: var(--harvest); transform: translateX(3px); }

/* ── ROLE TABS (reused section) ── */
.role-tabs { display: flex; gap: 6px; background: var(--cream); border-radius: 12px; padding: 5px; width: fit-content; }
.role-tab {
  padding: 9px 20px; border-radius: var(--r-sm); font-size: 13.5px; font-weight: 600;
  background: none; border: none; color: var(--text-muted); transition: all 0.2s; display: flex; align-items: center; gap: 7px;
}
.role-tab:hover { color: var(--text-primary); }
.role-tab.active-farmer { background: var(--harvest); color: var(--soil); box-shadow: var(--shadow-sm); }
.role-tab.active-supplier { background: var(--leaf); color: white; box-shadow: var(--shadow-sm); }
.role-tab.active-buyer { background: var(--sky); color: white; box-shadow: var(--shadow-sm); }

/* ── SECTIONS ── */
.section { padding: 80px clamp(20px, 4vw, 64px); width: 100%; }
.section-narrow { max-width: 1100px; margin: 0 auto; width: 100%; }
.section-header { margin-bottom: 48px; }
.section-kicker { display: inline-flex; align-items: center; gap: 8px; color: var(--leaf); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; }
.section-kicker::before { content: ''; display: block; width: 16px; height: 2px; background: var(--leaf); border-radius: 1px; }
.section-h2 { font-family: 'Bricolage Grotesque', sans-serif; font-size: clamp(28px,3.5vw,44px); font-weight: 800; color: var(--soil); line-height: 1.1; letter-spacing: -0.8px; }
.section-h2 em { color: var(--leaf); font-style: normal; }
.section-desc { font-size: 16px; color: var(--text-secondary); line-height: 1.75; max-width: 560px; margin-top: 12px; }
.alt-bg { background: var(--cream); }
.dark-bg { background: var(--soil); }
.leaf-bg { background: var(--leaf); }

/* ── HOW IT WORKS ── */
.hiw-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
.hiw-card {
  background: var(--white); border-radius: var(--r-lg); padding: 28px;
  border: 1px solid var(--border); box-shadow: var(--shadow-sm);
  transition: all 0.25s;
}
.hiw-card:hover { box-shadow: var(--shadow-md); transform: translateY(-3px); }
.hiw-num {
  width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 15px;
  margin-bottom: 18px;
}
.num-farmer { background: var(--harvest-pale); color: var(--gold); }
.num-supplier { background: var(--mint); color: var(--leaf); }
.num-buyer { background: var(--sky-light); color: var(--sky); }
.hiw-icon { font-size: 28px; margin-bottom: 10px; }
.hiw-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: 17px; font-weight: 700; color: var(--soil); margin-bottom: 8px; }
.hiw-desc { font-size: 13.5px; color: var(--text-secondary); line-height: 1.65; }

/* ── MARKETPLACE ── */
.mkt-controls {
  display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 28px;
}
.search-box {
  display: flex; align-items: center; gap: 8px;
  background: white; border: 1.5px solid var(--border); border-radius: var(--r-sm);
  padding: 9px 14px; flex: 1; min-width: 240px; max-width: 340px;
  transition: border-color 0.15s;
}
.search-box:focus-within { border-color: var(--leaf); }
.search-box input { border: none; outline: none; font-size: 13.5px; color: var(--text-primary); width: 100%; background: none; }
.search-box input::placeholder { color: var(--text-muted); }
.filter-row { display: flex; gap: 8px; flex-wrap: wrap; }
.chip {
  padding: 7px 14px; border-radius: 20px; font-size: 12.5px; font-weight: 500;
  border: 1.5px solid var(--border); background: white; color: var(--text-secondary);
  transition: all 0.15s; cursor: pointer;
}
.chip:hover { border-color: var(--leaf); color: var(--leaf); }
.chip.on { background: var(--leaf); color: white; border-color: var(--leaf); }
.chip.on-harvest { background: var(--harvest); color: var(--soil); border-color: var(--harvest); }
.mkt-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.prod-card {
  background: white; border-radius: var(--r-lg); border: 1px solid var(--border);
  overflow: hidden; transition: all 0.25s; box-shadow: var(--shadow-sm);
}
.prod-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-4px); }
.prod-card-top { padding: 14px 16px 0; display: flex; justify-content: space-between; align-items: flex-start; }

/* ── PRODUCT IMAGE HERO ── */
.prod-img-hero {
  position: relative; height: 180px; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
}
.prod-img-bg {
  position: absolute; inset: 0;
  background-size: cover; background-position: center;
  transition: transform 0.4s ease;
}
.prod-card:hover .prod-img-bg { transform: scale(1.06); }
.prod-img-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.5) 100%);
}
.prod-raw-circle {
  position: relative; z-index: 2;
  width: 88px; height: 88px; border-radius: 50%;
  object-fit: cover; border: 3px solid rgba(255,255,255,0.9);
  box-shadow: 0 4px 16px rgba(0,0,0,0.35);
}
.prod-type-ribbon {
  position: absolute; top: 12px; left: 12px; z-index: 3;
  font-size: 9.5px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;
  padding: 4px 10px; border-radius: 20px;
}
.ribbon-brq { background: rgba(196,124,26,0.92); color: white; }
.ribbon-pel { background: rgba(46,107,53,0.92); color: white; }
.prod-cert-ribbon {
  position: absolute; top: 12px; right: 12px; z-index: 3;
  font-size: 9px; font-weight: 700; background: rgba(255,255,255,0.92);
  color: var(--leaf); padding: 3px 8px; border-radius: 20px;
}

/* ── PRODUCT TYPE INTRO CARDS ── */
.type-intro-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 36px; }
.type-intro-card {
  border-radius: var(--r-lg); overflow: hidden; border: 1px solid var(--border);
  box-shadow: var(--shadow-sm); position: relative; height: 160px;
  display: flex; align-items: flex-end;
}
.type-intro-bg {
  position: absolute; inset: 0; background-size: cover; background-position: center;
}
.type-intro-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 60%);
}
.type-intro-text { position: relative; z-index: 2; padding: 16px 18px; }
.type-intro-label { font-family: 'Bricolage Grotesque',sans-serif; font-size: 18px; font-weight: 800; color: white; line-height: 1.1; }
.type-intro-desc { font-size: 11.5px; color: rgba(255,255,255,0.75); margin-top: 3px; line-height: 1.5; }
.type-intro-tag { display:inline-block; font-size:9px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; padding:3px 8px; border-radius:20px; margin-bottom:6px; }
.tag-brq-dark { background:rgba(196,124,26,0.9); color:white; }
.tag-pel-dark { background:rgba(46,107,53,0.9); color:white; }
.prod-type-tag {
  font-size: 10.5px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
  padding: 4px 9px; border-radius: 5px;
}
.tag-brq { background: #fff3e0; color: #c47c1a; }
.tag-pel { background: var(--mint); color: var(--leaf); }
.tag-raw { background: #fce4ec; color: #c2185b; }
.tag-bio { background: var(--sky-light); color: var(--sky); }
.tag-char { background: #ede7f6; color: #5e35b1; }
.cert-badge {
  display: inline-flex; align-items: center; gap: 4px; font-size: 10.5px; font-weight: 600;
  color: var(--leaf); background: var(--mint); padding: 3px 8px; border-radius: 5px;
}
.prod-body { padding: 14px 18px; }
.prod-name { font-family: 'Bricolage Grotesque', sans-serif; font-size: 17px; font-weight: 700; color: var(--soil); margin-bottom: 3px; line-height: 1.2; }
.prod-seller { font-size: 12px; color: var(--text-muted); margin-bottom: 14px; display: flex; align-items: center; gap: 5px; }
.prod-specs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
.spec { background: var(--cream); border-radius: var(--r-sm); padding: 8px 10px; }
.spec-k { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.8px; }
.spec-v { font-size: 13px; font-weight: 600; color: var(--soil); margin-top: 2px; font-family: 'Instrument Sans', monospace; }
.carbon-line { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--leaf); font-weight: 500; padding: 8px 0; border-top: 1px solid var(--border-light); }
.prod-foot { padding: 12px 18px; border-top: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center; }
.prod-price-val { font-family: 'Bricolage Grotesque', sans-serif; font-size: 24px; font-weight: 700; color: var(--soil); }
.prod-price-unit { font-size: 11px; color: var(--text-muted); }
.prod-moq { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.btn-enquire {
  background: var(--soil); color: white; font-size: 12.5px; font-weight: 600;
  padding: 9px 16px; border-radius: var(--r-sm); border: none; transition: all 0.15s;
}
.btn-enquire:hover { background: var(--earth); }
.load-more { text-align: center; margin-top: 36px; }

/* ── FARMER SECTION ── */
.farmer-section {
  background: linear-gradient(135deg, #1a2e0a 0%, #0f1f08 100%);
  background-image: url('/images/plant.jpg');
  background-size: cover;
  background-position: center;
  background-blend-mode: overlay;
}
.farmer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
.farmer-text h2 { font-family: 'Bricolage Grotesque', sans-serif; font-size: clamp(28px,3.5vw,44px); font-weight: 800; color: white; line-height: 1.1; letter-spacing: -0.8px; margin-bottom: 16px; }
.farmer-text h2 em { color: var(--harvest); font-style: normal; }
.farmer-text p { font-size: 15.5px; color: rgba(255,255,255,0.6); line-height: 1.75; margin-bottom: 28px; }
.farmer-benefits { display: flex; flex-direction: column; gap: 14px; margin-bottom: 32px; }
.farmer-benefit { display: flex; align-items: flex-start; gap: 12px; }
.fb-icon { width: 36px; height: 36px; background: rgba(245,166,35,0.15); border-radius: var(--r-sm); display: flex; align-items: center; justify-content: center; font-size: 17px; flex-shrink: 0; margin-top: 2px; }
.fb-title { font-size: 14px; font-weight: 600; color: white; }
.fb-desc { font-size: 13px; color: rgba(255,255,255,0.5); margin-top: 2px; }
.farmer-register-card {
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  border-radius: var(--r-xl); padding: 32px;
}
.frc-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: 20px; font-weight: 700; color: white; margin-bottom: 5px; }
.frc-sub { font-size: 13px; color: rgba(255,255,255,0.45); margin-bottom: 24px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.fld { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.fld label { font-size: 11.5px; font-weight: 600; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.8px; }
.fld input, .fld select {
  background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12);
  border-radius: var(--r-sm); padding: 10px 13px; font-size: 13.5px; color: white;
  outline: none; transition: border-color 0.15s;
}
.fld input::placeholder { color: rgba(255,255,255,0.25); }
.fld input:focus, .fld select:focus { border-color: var(--harvest); background: rgba(255,255,255,0.1); }
.fld select option { background: var(--bark); color: white; }
.biomass-picker { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-bottom: 16px; }
.biomass-opt {
  padding: 9px 6px; border-radius: var(--r-sm); border: 1.5px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.6); font-size: 11.5px;
  font-weight: 500; text-align: center; cursor: pointer; transition: all 0.15s;
}
.biomass-opt:hover { border-color: rgba(245,166,35,0.4); color: white; }
.biomass-opt.sel { background: rgba(245,166,35,0.15); border-color: var(--harvest); color: var(--harvest); }

/* ── EXCHANGE / PRICES ── */
.exchange-section { background: var(--cream); }
.ex-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; }
.live-pill { display: flex; align-items: center; gap: 7px; background: white; border: 1px solid var(--border); border-radius: 20px; padding: 7px 14px; font-size: 12px; color: var(--text-secondary); }
.live-dot { width: 7px; height: 7px; background: #4caf80; border-radius: 50%; animation: pulse 1.5s infinite; }
.ex-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 24px; }
.ex-card {
  background: white; border-radius: var(--r-lg); border: 1px solid var(--border);
  padding: 20px; box-shadow: var(--shadow-sm); transition: all 0.2s;
}
.ex-card:hover { box-shadow: var(--shadow-md); }
.ex-card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
.ex-name { font-family: 'Bricolage Grotesque', sans-serif; font-size: 14px; font-weight: 700; color: var(--soil); }
.ex-grade-tag { font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 4px; background: var(--cream); color: var(--text-muted); }
.ex-price-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
.ex-price { font-family: 'Bricolage Grotesque', sans-serif; font-size: 26px; font-weight: 800; color: var(--soil); }
.ex-unit { font-size: 12px; color: var(--text-muted); }
.ex-chg-up { font-size: 12.5px; font-weight: 600; color: #27ae60; }
.ex-chg-dn { font-size: 12.5px; font-weight: 600; color: #e74c3c; }
.ex-meta { display: flex; gap: 16px; }
.ex-meta-item { font-size: 11.5px; color: var(--text-muted); }
.ex-meta-item strong { color: var(--text-secondary); font-weight: 600; }
.ex-sparkline { display: flex; gap: 2px; align-items: flex-end; height: 28px; margin-top: 12px; }
.spark-bar { width: 7px; border-radius: 2px; transition: height 0.5s ease; }
.spark-up { background: rgba(39,174,96,0.5); }
.spark-dn { background: rgba(231,76,60,0.35); }
.ex-full-table {
  background: white; border-radius: var(--r-lg); border: 1px solid var(--border);
  overflow: hidden; box-shadow: var(--shadow-sm); width: 100%;
}
.ex-full-table-scroll { overflow-x: auto; width: 100%; }
.ex-table { width: 100%; border-collapse: collapse; }
.ex-table th { padding: 12px 18px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); text-align: left; border-bottom: 1px solid var(--border); background: var(--cream); }
.ex-table td { padding: 14px 18px; border-bottom: 1px solid var(--border-light); font-size: 13.5px; }
.ex-table tr:last-child td { border-bottom: none; }
.ex-table tr:hover td { background: var(--paper); }
.td-name { font-weight: 600; color: var(--soil); }
.td-grade { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.td-price { font-family: 'Instrument Sans', monospace; font-weight: 600; color: var(--soil); }
.td-up { color: #27ae60; font-weight: 600; font-family: monospace; }
.td-dn { color: #e74c3c; font-weight: 600; font-family: monospace; }
.td-vol { color: var(--text-muted); font-family: monospace; font-size: 12.5px; }
.td-cal { color: var(--gold); font-weight: 600; font-size: 12.5px; font-family: monospace; }

/* ── CERTIFICATION ── */
.cert-section { background: white; }
.cert-flow { display: grid; grid-template-columns: repeat(4,1fr); gap: 20px; margin-top: 48px; position: relative; }
.cert-flow::before {
  content: ''; position: absolute; top: 38px; left: 12.5%; right: 12.5%; height: 2px;
  background: repeating-linear-gradient(90deg, var(--border) 0, var(--border) 6px, transparent 6px, transparent 12px);
  z-index: 0;
}
.cert-step { text-align: center; position: relative; z-index: 1; }
.cert-num {
  width: 48px; height: 48px; border-radius: 50%; background: white; border: 2px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 16px;
  color: var(--leaf); margin: 0 auto 14px; box-shadow: 0 0 0 5px white;
}
.cert-step-title { font-size: 14px; font-weight: 700; color: var(--soil); margin-bottom: 6px; }
.cert-step-desc { font-size: 12.5px; color: var(--text-muted); line-height: 1.6; }
.grades-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-top: 48px; }
.grade-card-new {
  border-radius: var(--r-lg); overflow: hidden; border: 2px solid var(--border);
  transition: all 0.25s; cursor: pointer;
}
.grade-card-new:hover { box-shadow: var(--shadow-lg); transform: translateY(-3px); }
.grade-head { padding: 24px 22px; }
.grade-mark {
  display: inline-flex; align-items: center; justify-content: center;
  width: 50px; height: 50px; border-radius: 50%; font-family: 'Bricolage Grotesque', sans-serif;
  font-weight: 800; font-size: 20px; margin-bottom: 14px;
}
.grade-Aplus .grade-head { background: linear-gradient(135deg, #e8f5e9, #f1f8f2); }
.grade-Aplus .grade-mark { background: var(--leaf); color: white; }
.grade-Aplus { border-color: var(--leaf); }
.grade-A .grade-head { background: linear-gradient(135deg, #e3f2fd, #f0f7ff); }
.grade-A .grade-mark { background: var(--sky); color: white; }
.grade-A { border-color: #90caf9; }
.grade-B .grade-head { background: linear-gradient(135deg, #fff8e1, #fffdf5); }
.grade-B .grade-mark { background: var(--gold); color: white; }
.grade-B { border-color: #ffe082; }
.grade-name-new { font-family: 'Bricolage Grotesque', sans-serif; font-size: 18px; font-weight: 800; color: var(--soil); margin-bottom: 4px; }
.grade-desc-new { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }
.grade-body { padding: 18px 22px; background: white; }
.grade-row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid var(--border-light); font-size: 13px; }
.grade-row:last-child { border: none; }
.gr-key { color: var(--text-muted); }
.gr-val { font-weight: 600; color: var(--soil); font-family: monospace; font-size: 12.5px; }

/* ── CARBON ── */
.carbon-section { background: var(--soil); width: 100%; }
.carbon-inner { max-width: 1100px; margin: 0 auto; width: 100%; }
.carbon-intro { max-width: 640px; margin-bottom: 56px; }
.carbon-intro h2 { font-family: 'Bricolage Grotesque', sans-serif; font-size: clamp(28px,3.5vw,44px); font-weight: 800; color: white; line-height: 1.1; letter-spacing: -0.8px; margin-bottom: 14px; }
.carbon-intro h2 em { color: #6fcf97; font-style: normal; }
.carbon-intro p { font-size: 16px; color: rgba(255,255,255,0.55); line-height: 1.75; }
.carbon-grid-new { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
.carbon-features { display: flex; flex-direction: column; gap: 20px; }
.cf-item {
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: var(--r-lg); padding: 20px 22px; display: flex; gap: 16px;
}
.cf-icon { font-size: 24px; flex-shrink: 0; }
.cf-title { font-size: 15px; font-weight: 600; color: white; margin-bottom: 5px; }
.cf-desc { font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.6; }
.carbon-calc-card {
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  border-radius: var(--r-xl); padding: 32px;
}
.cc-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: 20px; font-weight: 700; color: white; margin-bottom: 5px; }
.cc-sub { font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 24px; }
.cc-fuel-selector { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
.cc-fuel-opt {
  padding: 11px 14px; border-radius: var(--r-sm); border: 1.5px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.6); font-size: 12.5px;
  font-weight: 500; text-align: center; cursor: pointer; transition: all 0.15s;
}
.cc-fuel-opt:hover { border-color: rgba(111,207,151,0.4); color: white; }
.cc-fuel-opt.sel { background: rgba(111,207,151,0.15); border-color: #6fcf97; color: #6fcf97; }
.cc-slider-row { margin-bottom: 18px; }
.cc-slider-label { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px; }
.cc-slider-label span:first-child { color: rgba(255,255,255,0.5); }
.cc-slider-label span:last-child { color: var(--harvest); font-weight: 600; }
.cc-slider { width: 100%; accent-color: var(--harvest); cursor: pointer; }
.cc-result {
  background: rgba(111,207,151,0.1); border: 1px solid rgba(111,207,151,0.2);
  border-radius: var(--r-md); padding: 18px; margin-top: 20px;
  display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
}
.cc-res-item { }
.cc-res-val { font-family: 'Bricolage Grotesque', sans-serif; font-size: 28px; font-weight: 800; color: #6fcf97; }
.cc-res-label { font-size: 11px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 1px; margin-top: 3px; }
.cc-cta-row { display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap; }
.btn-carbon {
  flex: 1; padding: 11px 16px; border-radius: var(--r-sm); font-size: 13px; font-weight: 600;
  background: #6fcf97; color: var(--soil); border: none; transition: all 0.2s; font-family: inherit;
}
.btn-carbon:hover { background: #5abf84; }
.btn-carbon-outline {
  flex: 1; padding: 11px 16px; border-radius: var(--r-sm); font-size: 13px; font-weight: 600;
  background: transparent; color: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.15); transition: all 0.2s; font-family: inherit;
}
.btn-carbon-outline:hover { border-color: rgba(255,255,255,0.35); color: white; }

/* ── TRADING TERMINAL ── */
.terminal-wrap { background:var(--bark); border-radius:var(--r-lg); overflow:hidden; border:1px solid rgba(255,255,255,0.07); margin-bottom:20px; width:100%; }
.terminal-header { background:rgba(0,0,0,0.35); padding:10px 16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.06); }
.terminal-body { display:grid; grid-template-columns:1fr 260px; }
.t-cards-grid { padding:14px; display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:10px; border-right:1px solid rgba(255,255,255,0.05); }
.t-card { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); border-radius:var(--r-md); padding:12px; cursor:pointer; transition:all 0.15s; }
.t-card:hover { background:rgba(255,255,255,0.08); }
.t-card.up-card { border-top:2px solid #27ae60; }
.t-card.dn-card { border-top:2px solid #e74c3c; }
.t-short { font-family:monospace; font-size:10px; font-weight:700; color:rgba(255,255,255,0.35); letter-spacing:1.5px; margin-bottom:3px; }
.t-name { font-size:11px; font-weight:600; color:rgba(255,255,255,0.75); margin-bottom:8px; line-height:1.3; }
.t-price-big { font-family:'Bricolage Grotesque',monospace; font-size:20px; font-weight:800; margin-bottom:2px; }
.t-green { color:#27ae60; } .t-red { color:#e74c3c; }
.t-chg-row { font-size:10.5px; font-weight:600; margin-bottom:8px; }
.t-ohlc { display:grid; grid-template-columns:1fr 1fr; gap:3px; margin-bottom:8px; }
.t-ohlc-item { font-size:9.5px; }
.t-ohlc-k { color:rgba(255,255,255,0.28); text-transform:uppercase; letter-spacing:0.5px; }
.t-ohlc-v { color:rgba(255,255,255,0.7); font-family:monospace; font-weight:600; font-size:10px; }
.t-bid-ask { display:flex; gap:5px; margin-bottom:6px; }
.t-bid,.t-ask { flex:1; border-radius:4px; padding:4px 6px; text-align:center; }
.t-bid { background:rgba(39,174,96,0.12); border:1px solid rgba(39,174,96,0.25); }
.t-ask { background:rgba(231,76,60,0.12); border:1px solid rgba(231,76,60,0.25); }
.t-ba-lbl { font-size:8.5px; color:rgba(255,255,255,0.3); text-transform:uppercase; letter-spacing:0.8px; }
.t-ba-val { font-size:12px; font-weight:700; font-family:monospace; }
.t-vol-row { font-size:9.5px; color:rgba(255,255,255,0.3); }
/* Deal Feed */
.deal-panel { padding:12px; overflow:hidden; }
.deal-title { font-size:9.5px; font-weight:700; color:rgba(255,255,255,0.3); text-transform:uppercase; letter-spacing:2px; margin-bottom:10px; display:flex; align-items:center; gap:6px; }
.deal-title::before { content:''; width:6px; height:6px; border-radius:50%; background:#4caf80; animation:pulse 1.2s infinite; }
.deal-row { padding:6px 8px; border-radius:6px; margin-bottom:4px; animation:deal-in 0.35s ease; border-left:2px solid; }
.deal-row.buy { background:rgba(39,174,96,0.09); border-color:#27ae60; }
.deal-row.sell { background:rgba(231,76,60,0.09); border-color:#e74c3c; }
.deal-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:2px; }
.deal-tag { font-size:8.5px; font-weight:700; padding:1px 5px; border-radius:3px; }
.buy .deal-tag { background:rgba(39,174,96,0.25); color:#6fcf97; }
.sell .deal-tag { background:rgba(231,76,60,0.25); color:#eb5757; }
.deal-prod { font-size:11px; font-weight:700; color:rgba(255,255,255,0.85); font-family:monospace; }
.deal-meta { font-size:10px; color:rgba(255,255,255,0.4); display:flex; justify-content:space-between; }
.deal-p { font-family:monospace; font-weight:600; color:rgba(255,255,255,0.7); font-size:10.5px; }
@keyframes deal-in { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
@media(max-width:900px){ .t-cards-grid{grid-template-columns:1fr 1fr;} .terminal-body{grid-template-columns:1fr;} }

/* ── TRUST STRIP ── */
.trust-strip { background: var(--leaf); padding: 56px clamp(20px, 4vw, 48px); width: 100%; }
.trust-strip-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: repeat(4,1fr); gap: 32px; width: 100%; }
.ts-item { text-align: center; }
.ts-val { font-family: 'Bricolage Grotesque', sans-serif; font-size: 38px; font-weight: 800; color: white; line-height: 1; }
.ts-val em { color: var(--harvest); font-style: normal; }
.ts-label { font-size: 12px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1.5px; margin-top: 6px; font-weight: 500; }

/* ── SUPPLIER SECTION ── */
.supplier-section { background: var(--cream); }
.sup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: start; }
.sup-features { display: flex; flex-direction: column; gap: 20px; }
.sup-feat {
  background: white; border-radius: var(--r-lg); padding: 22px; border: 1px solid var(--border);
  display: flex; gap: 16px; box-shadow: var(--shadow-sm);
}
.sup-feat-icon { width: 44px; height: 44px; border-radius: var(--r-sm); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.sf-green { background: var(--mint); }
.sf-gold { background: var(--harvest-pale); }
.sf-blue { background: var(--sky-light); }
.sup-feat-title { font-size: 15px; font-weight: 700; color: var(--soil); margin-bottom: 5px; }
.sup-feat-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }
.list-product-form {
  background: white; border-radius: var(--r-xl); padding: 32px; border: 1px solid var(--border); box-shadow: var(--shadow-md);
}
.lpf-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: 22px; font-weight: 800; color: var(--soil); margin-bottom: 5px; }
.lpf-sub { font-size: 13px; color: var(--text-muted); margin-bottom: 24px; }
.lf-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.lf { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.lf label { font-size: 11.5px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.8px; }
.lf input, .lf select {
  background: var(--paper); border: 1.5px solid var(--border); border-radius: var(--r-sm);
  padding: 10px 13px; font-size: 13.5px; color: var(--text-primary); outline: none;
  transition: border-color 0.15s; font-family: inherit;
}
.lf input::placeholder { color: var(--text-muted); }
.lf input:focus, .lf select:focus { border-color: var(--leaf); background: white; }
.upload-box {
  border: 2px dashed var(--border); border-radius: var(--r-md); padding: 20px;
  text-align: center; cursor: pointer; margin-bottom: 16px; transition: all 0.15s;
}
.upload-box:hover { border-color: var(--leaf); background: var(--mint); }
.upload-box p { font-size: 13px; color: var(--text-muted); }
.upload-box strong { color: var(--leaf); }

/* ── CTA BOTTOM ── */
.cta-bottom {
  background: linear-gradient(135deg, var(--soil) 0%, #1a2e15 100%);
  padding: 100px clamp(20px, 4vw, 64px); text-align: center; position: relative; overflow: hidden;
  width: 100%;
}
.cta-bottom::before {
  content: ''; position: absolute; top: -50%; left: -20%;
  width: 800px; height: 800px; border-radius: 50%;
  background: radial-gradient(circle, rgba(46,107,53,0.12), transparent 60%);
  pointer-events: none;
}
.cta-bottom h2 { font-family: 'Bricolage Grotesque', sans-serif; font-size: clamp(32px,4vw,56px); font-weight: 800; color: white; letter-spacing: -1px; margin-bottom: 16px; line-height: 1.1; }
.cta-bottom h2 em { color: var(--harvest); font-style: normal; }
.cta-bottom p { font-size: 17px; color: rgba(255,255,255,0.5); margin-bottom: 40px; max-width: 480px; margin-left: auto; margin-right: auto; }
.cta-buttons { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin-bottom: 32px; }
.cta-note { font-size: 12px; color: rgba(255,255,255,0.3); }

/* ── FOOTER ── */
.footer { background: #0d0905; padding: 64px clamp(20px, 4vw, 48px) 32px; width: 100%; }
.footer-inner { max-width: 1100px; margin: 0 auto; width: 100%; }
.footer-top { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 48px; }
.ft-brand { }
.ft-brand h3 { font-family: 'Bricolage Grotesque', sans-serif; font-size: 20px; font-weight: 800; color: white; margin-bottom: 10px; }
.ft-brand p { font-size: 13px; color: rgba(255,255,255,0.4); line-height: 1.7; max-width: 270px; margin-bottom: 20px; }
.ft-badges { display: flex; flex-wrap: wrap; gap: 8px; }
.ft-badge { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 5px; font-size: 10.5px; color: rgba(255,255,255,0.35); }
.ft-col h4 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.5); margin-bottom: 16px; }
.ft-link { display: block; font-size: 13px; color: rgba(255,255,255,0.35); padding: 5px 0; cursor: pointer; transition: color 0.15s; }
.ft-link:hover { color: rgba(255,255,255,0.8); }
.footer-bottom { border-top: 1px solid rgba(255,255,255,0.06); padding-top: 24px; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
.fb-left { font-size: 12px; color: rgba(255,255,255,0.25); }
.fb-right { display: flex; gap: 20px; }
.fb-right a { font-size: 12px; color: rgba(255,255,255,0.25); cursor: pointer; }

/* ── MODAL ── */
.overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(15,10,5,0.75); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center; padding: 16px;
}
.modal-box {
  background: white; border-radius: var(--r-xl); padding: 36px;
  width: 100%; max-width: 520px; max-height: 92vh; overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0,0,0,0.3);
}
.modal-box.dark { background: var(--bark); }
.modal-hd { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.modal-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: 26px; font-weight: 800; color: var(--soil); line-height: 1.1; }
.modal-title.light { color: white; }
.modal-sub { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
.modal-sub.light { color: rgba(255,255,255,0.4); }
.modal-close { width: 32px; height: 32px; border-radius: 50%; background: var(--cream); border: none; font-size: 18px; color: var(--text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
.modal-close.dark-close { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); }
.mf { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.mf label { font-size: 11.5px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.8px; }
.mf input, .mf select, .mf textarea {
  background: var(--paper); border: 1.5px solid var(--border); border-radius: var(--r-sm);
  padding: 10px 13px; font-size: 13.5px; color: var(--text-primary); outline: none;
  transition: border-color 0.15s; font-family: inherit; width: 100%;
}
.mf input:focus, .mf select:focus, .mf textarea:focus { border-color: var(--leaf); background: white; }
.mf textarea { resize: vertical; min-height: 80px; }
.mf-dark input, .mf-dark select {
  background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.12); color: white;
}
.mf-dark label { color: rgba(255,255,255,0.5); }
.mf-dark input::placeholder { color: rgba(255,255,255,0.25); }
.mf-dark input:focus { border-color: var(--harvest); background: rgba(255,255,255,0.1); }
.modal-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.modal-footer { display: flex; gap: 12px; margin-top: 24px; }
.btn-cancel { flex: 1; padding: 12px; border-radius: var(--r-sm); border: 1.5px solid var(--border); background: white; cursor: pointer; font-size: 14px; font-weight: 500; color: var(--text-secondary); font-family: inherit; }
.btn-submit { flex: 2; padding: 12px; border-radius: var(--r-sm); border: none; background: var(--leaf); color: white; cursor: pointer; font-size: 14px; font-weight: 600; font-family: inherit; transition: all 0.15s; }
.btn-submit:hover { background: var(--leaf-mid); }
.btn-submit.harvest { background: var(--harvest); color: var(--soil); }
.btn-submit.harvest:hover { background: #f5b84a; }
.btn-submit.sky { background: var(--sky); }
.role-selector-btns { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
.role-sel-btn {
  display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: var(--r-md);
  border: 1.5px solid var(--border); background: var(--paper); cursor: pointer; transition: all 0.15s;
  text-align: left; font-family: inherit;
}
.role-sel-btn:hover { border-color: var(--leaf); background: var(--mint); }
.role-sel-btn.active { border-color: var(--leaf); background: var(--mint); }
.rsb-icon { font-size: 24px; }
.rsb-label { font-size: 15px; font-weight: 600; color: var(--soil); }
.rsb-desc { font-size: 12px; color: var(--text-muted); }
.step-indicator { display: flex; gap: 6px; margin-bottom: 20px; }
.step-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border); }
.step-dot.done { background: var(--leaf); }

/* ── TOAST ── */
.toast {
  position: fixed; bottom: 28px; right: 28px; z-index: 300;
  background: var(--soil); color: white; padding: 14px 18px; border-radius: var(--r-md);
  font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 10px;
  box-shadow: 0 8px 28px rgba(0,0,0,0.3); border-left: 3px solid var(--harvest);
  animation: toast-in 0.3s ease;
}
@keyframes toast-in { from{transform:translateY(14px);opacity:0} to{transform:translateY(0);opacity:1} }

/* ── RESPONSIVE ── */

/* Medium laptops: 1024px–1280px */
@media(max-width: 1280px) {
  .hero-inner { gap: clamp(24px, 4vw, 48px); }
  .footer-top { grid-template-columns: 2fr 1fr 1fr; gap: 32px; }
}

@media(max-width: 1100px) {
  .hero-inner { grid-template-columns: 1fr 340px; }
  .footer-top { grid-template-columns: 1fr 1fr; gap: 24px; }
}

@media(max-width: 900px){
  .nav { padding: 0 20px; }
  .nav-center { display:none; }
  .hero { padding: 60px 20px 0; }
  .hero-inner { grid-template-columns: 1fr; }
  .hero-right { display:none; }
  .section { padding: 60px 20px; }
  .trust-strip { padding: 40px 20px; }
  .trust-strip-inner { grid-template-columns: 1fr 1fr; gap: 20px; }
  .hiw-grid, .mkt-grid, .ex-grid, .grades-row, .cert-flow { grid-template-columns: 1fr; }
  .carbon-grid-new, .farmer-grid, .sup-grid { grid-template-columns: 1fr; }
  .footer-top { grid-template-columns: 1fr 1fr; gap: 28px; }
  .cta-bottom { padding: 60px 20px; }
  .footer { padding: 48px 20px 24px; }
  .topbar { display:none; }
  .hero-trust { display:none; }
}
`;

/* ─── DATA ─────────────────────────────────────────────────── */
const PRODUCTS = [
  // ── KNB Green Energy Ltd — Akola, MH ──
  { id:1,  type:"Briquette", name:"Soyabean Briquettes",    seller:"KNB Green Energy Ltd",      loc:"Akola, MH",       cal:"3,400", moist:"6%",  ash:"15-20%", price:"5,200", moq:"10 MT", cert:true,  carbon:"1.9", img:"/images/soyabean-briquette.jpg" },
  { id:2,  type:"Briquette", name:"Groundnut Briquettes",   seller:"KNB Green Energy Ltd",      loc:"Akola, MH",       cal:"3,800", moist:"5%",  ash:"8-10%",  price:"5,800", moq:"10 MT", cert:true,  carbon:"2.1", img:"/images/groundnut-briquette.jpg" },
  { id:3,  type:"Briquette", name:"Mustard Briquettes",     seller:"KNB Green Energy Ltd",      loc:"Akola, MH",       cal:"3,500", moist:"6%",  ash:"10-15%", price:"5,400", moq:"10 MT", cert:true,  carbon:"2.0", img:"/images/mustard-briquette.jpg" },
  { id:4,  type:"Briquette", name:"Rice Husk Briquettes",   seller:"KNB Green Energy Ltd",      loc:"Akola, MH",       cal:"3,500", moist:"8%",  ash:"20%",    price:"4,800", moq:"15 MT", cert:true,  carbon:"1.9", img:"/images/ricehusk-briquette.jpg" },
  { id:5,  type:"Briquette", name:"Sawdust Briquettes",     seller:"KNB Green Energy Ltd",      loc:"Akola, MH",       cal:"4,200", moist:"5%",  ash:"10%",    price:"6,500", moq:"5 MT",  cert:true,  carbon:"2.4", img:"/images/sawdust-briquette.jpg" },
  { id:6,  type:"Briquette", name:"Agro Waste Briquettes",  seller:"KNB Green Energy Ltd",      loc:"Akola, MH",       cal:"3,800", moist:"7%",  ash:"12-15%", price:"5,600", moq:"10 MT", cert:true,  carbon:"2.1", img:"/images/agrowaste-briquette.jpg" },
  { id:7,  type:"Pellet",    name:"Soyabean Pellets",       seller:"KNB Green Energy Ltd",      loc:"Akola, MH",       cal:"3,600", moist:"5%",  ash:"5-6%",   price:"6,200", moq:"5 MT",  cert:true,  carbon:"2.0", img:"/images/soyabean-pellet.jpg" },
  { id:8,  type:"Pellet",    name:"Groundnut Pellets",      seller:"KNB Green Energy Ltd",      loc:"Akola, MH",       cal:"4,000", moist:"5%",  ash:"6-8%",   price:"7,200", moq:"5 MT",  cert:true,  carbon:"2.3", img:"/images/groundnut-pellet.jpg" },
  { id:9,  type:"Pellet",    name:"Mustard Pellets",        seller:"KNB Green Energy Ltd",      loc:"Akola, MH",       cal:"3,800", moist:"5%",  ash:"6-8%",   price:"6,800", moq:"5 MT",  cert:true,  carbon:"2.1", img:"/images/mustard-pellet.jpg" },
  { id:10, type:"Pellet",    name:"Rice Husk Pellets",      seller:"KNB Green Energy Ltd",      loc:"Akola, MH",       cal:"3,700", moist:"5%",  ash:"20%",    price:"6,000", moq:"10 MT", cert:true,  carbon:"2.0", img:"/images/ricehusk-pellet.jpg" },
  { id:11, type:"Pellet",    name:"Sawdust Pellets",        seller:"KNB Green Energy Ltd",      loc:"Akola, MH",       cal:"4,200", moist:"5%",  ash:"5-6%",   price:"7,800", moq:"5 MT",  cert:true,  carbon:"2.4", img:"/images/sawdust-pellet.jpg" },
  { id:12, type:"Pellet",    name:"Agro Waste Pellets",     seller:"KNB Green Energy Ltd",      loc:"Akola, MH",       cal:"4,000", moist:"5%",  ash:"7-8%",   price:"7,000", moq:"5 MT",  cert:true,  carbon:"2.3", img:"/images/agrowaste-pellet.jpg" },
  { id:13, type:"Pellet",    name:"Pinewood Pellets",       seller:"KNB Green Energy Ltd",      loc:"Akola, MH",       cal:"4,300", moist:"5%",  ash:"2-3%",   price:"9,500", moq:"2 MT",  cert:true,  carbon:"2.6", img:"/images/pinewood-pellet.jpg" },

  // ── Other Verified Suppliers ──
  { id:14, type:"Briquette", name:"Cotton Stalk Briquettes", seller:"Suraj Bioenergy Pvt Ltd",  loc:"Amravati, MH",    cal:"3,600", moist:"7%",  ash:"14-16%", price:"5,100", moq:"10 MT", cert:true,  carbon:"2.0", img:"/images/agrowaste-briquette.jpg" },
  { id:15, type:"Briquette", name:"Sugarcane Bagasse Briquettes", seller:"Punjab Agro Fuels",   loc:"Ludhiana, PB",    cal:"3,200", moist:"9%",  ash:"8-12%",  price:"4,500", moq:"20 MT", cert:false, carbon:"1.8", img:"/images/agrowaste-briquette.jpg" },
  { id:16, type:"Pellet",    name:"Wheat Straw Pellets",    seller:"Punjab Agro Fuels",          loc:"Ludhiana, PB",    cal:"3,500", moist:"6%",  ash:"8-10%",  price:"5,800", moq:"5 MT",  cert:false, carbon:"1.9", img:"/images/ricehusk-pellet.jpg" },
  { id:17, type:"Briquette", name:"Bamboo Briquettes",      seller:"Green Flame Industries",     loc:"Nagpur, MH",      cal:"4,000", moist:"6%",  ash:"5-8%",   price:"6,200", moq:"5 MT",  cert:true,  carbon:"2.2", img:"/images/sawdust-briquette.jpg" },
  { id:18, type:"Pellet",    name:"Bamboo Pellets",         seller:"Green Flame Industries",     loc:"Nagpur, MH",      cal:"4,100", moist:"5%",  ash:"4-6%",   price:"7,400", moq:"5 MT",  cert:true,  carbon:"2.3", img:"/images/sawdust-pellet.jpg" },
  { id:19, type:"Briquette", name:"Maize Cob Briquettes",   seller:"Vidarbha Biomass Co.",       loc:"Yavatmal, MH",    cal:"3,700", moist:"7%",  ash:"3-5%",   price:"5,300", moq:"10 MT", cert:false, carbon:"2.0", img:"/images/agrowaste-briquette.jpg" },
  { id:20, type:"Pellet",    name:"Groundnut Shell Pellets", seller:"Rajkot Fuel Solutions",     loc:"Rajkot, GJ",      cal:"4,200", moist:"5%",  ash:"5-7%",   price:"7,500", moq:"5 MT",  cert:true,  carbon:"2.4", img:"/images/groundnut-pellet.jpg" },
  { id:21, type:"Raw Biomass", name:"Cotton Stalks (Loose)", seller:"Suraj Bioenergy Pvt Ltd",  loc:"Amravati, MH",    cal:"3,200", moist:"10%", ash:"16-18%", price:"2,800", moq:"25 MT", cert:false, carbon:"1.6", img:"/images/agrowaste-briquette.jpg" },
  { id:22, type:"Raw Biomass", name:"Rice Husk (Loose)",    seller:"Punjab Agro Fuels",          loc:"Ludhiana, PB",    cal:"3,000", moist:"10%", ash:"18-22%", price:"2,200", moq:"50 MT", cert:false, carbon:"1.5", img:"/images/ricehusk-briquette.jpg" },
];

const INIT_PRICES = [
  { id:"SDBRQ", name:"Sawdust Briquettes",     short:"SD-BRQ", grade:"A+ · KNB Certified", price:6500, open:6420, high:6580, low:6380, vol:180, cal:"4,200" },
  { id:"PNPEL", name:"Pinewood Pellets",        short:"PN-PEL", grade:"Premium · KNB Assured", price:9500, open:9300, high:9650, low:9250, vol:95,  cal:"4,300" },
  { id:"GNPEL", name:"Groundnut Pellets",       short:"GN-PEL", grade:"A · KNB Certified",  price:7200, open:7100, high:7280, low:7050, vol:210, cal:"4,000" },
  { id:"RHBRQ", name:"Rice Husk Briquettes",    short:"RH-BRQ", grade:"B · KNB Tested",     price:4800, open:4850, high:4900, low:4750, vol:410, cal:"3,500" },
  { id:"GNBRQ", name:"Groundnut Briquettes",    short:"GN-BRQ", grade:"A · KNB Certified",  price:5800, open:5740, high:5860, low:5700, vol:320, cal:"3,800" },
  { id:"SDPEL", name:"Sawdust Pellets",         short:"SD-PEL", grade:"A+ · KNB Assured",   price:7800, open:7900, high:7950, low:7780, vol:145, cal:"4,200" },
  { id:"AWBRQ", name:"Agro Waste Briquettes",   short:"AW-BRQ", grade:"A · KNB Certified",  price:5600, open:5560, high:5640, low:5520, vol:280, cal:"3,800" },
];

const BIOMASS_TYPES = ["Soyabean Husk","Rice","Corn Cob","Agro Waste Mix","Mustard","Sawdust","Groundnut","Other"];

const TAG_COLORS = { Briquette:"tag-brq", Pellet:"tag-pel", "Raw Biomass":"tag-raw", Biochar:"tag-char" };

/* ─── MAIN COMPONENT ───────────────────────────────────────── */
export default function KNBPlatform() {
  const [activeNav, setActiveNav] = useState("home");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [searchQ, setSearchQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [certFilter, setCertFilter] = useState(false);
  const [prices] = useState(() =>
    INIT_PRICES.map(p => {
      const chg = p.price - p.open;
      // Deterministic history using sin waves — stable shape, no random flicker
      const history = Array.from({length:60}, (_,i) => {
        const progress = i / 59;
        const base = p.open + (p.price - p.open) * progress;
        const wave = Math.sin(i * 0.6) * p.price * 0.007 + Math.sin(i * 1.4 + 1) * p.price * 0.004;
        return Math.round(base + wave);
      });
      return { ...p, up: chg >= 0, chg, pct: ((chg/p.open)*100).toFixed(2), history };
    })
  );
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"}));
  const [regRole, setRegRole] = useState("buyer");
  const [regStep, setRegStep] = useState(1);
  const [selectedBiomass, setSelectedBiomass] = useState([]);
  const [fuelType, setFuelType] = useState("Coal");
  const [mtQty, setMtQty] = useState(100);
  const [selectedHeroRole, setSelectedHeroRole] = useState(null);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const captchaRef = useRef(null);
  const [enquiryProduct, setEnquiryProduct] = useState(null);

  // ── Auth state ──
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authErr, setAuthErr] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  // ── Login OTP ──
  const [loginPhone, setLoginPhone] = useState("");
  const [loginOTP, setLoginOTP] = useState("");
  const [loginOTPSent, setLoginOTPSent] = useState(false);
  const [loginConfirm, setLoginConfirm] = useState(null);

  // ── Register form (controlled inputs) ──
  const [regName, setRegName] = useState("");
  const [regCompany, setRegCompany] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regOTP, setRegOTP] = useState("");
  const [regOTPSent, setRegOTPSent] = useState(false);
  const [regConfirm, setRegConfirm] = useState(null);
  const [regIndustry, setRegIndustry] = useState("Textiles");
  const [regLocation, setRegLocation] = useState("");
  const [regRequirement, setRegRequirement] = useState("");

  // ── Enquiry form (controlled inputs) ──
  const [enqName, setEnqName] = useState("");
  const [enqCompany, setEnqCompany] = useState("");
  const [enqEmail, setEnqEmail] = useState("");
  const [enqPhone, setEnqPhone] = useState("");
  const [enqQty, setEnqQty] = useState("");
  const [enqLocation, setEnqLocation] = useState("");
  const [enqMsg, setEnqMsg] = useState("");

  // Auto-fill enquiry when logged in
  useEffect(() => {
    if (modal === "enquiry" && userProfile) {
      setEnqName(userProfile.name || "");
      setEnqCompany(userProfile.company || "");
      setEnqEmail(userProfile.email || "");
      setEnqPhone(userProfile.phone || "");
    }
  }, [modal]);

  // Auth state listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists()) setUserProfile(snap.data());
        } catch(e) {}
      } else {
        setUserProfile(null);
      }
    });
    return unsub;
  }, []);

  // ── OTP helper ──
  const fmtPhone = (p) => {
    const d = p.replace(/\D/g,"");
    return d.startsWith("91") && d.length===12 ? "+"+d : "+91"+d;
  };

  const getOTPErr = (e) => {
    const code = e?.code;
    const msg  = e?.message;
    const known = {
      "auth/invalid-phone-number":      "Invalid number. Enter a valid 10-digit mobile number.",
      "auth/quota-exceeded":            "SMS limit reached. Try again after some time.",
      "auth/invalid-verification-code": "Wrong OTP. Check the SMS and try again.",
      "auth/code-expired":              "OTP expired. Go back and request a new one.",
      "auth/too-many-requests":         "Too many attempts. Wait a few minutes and try again.",
      "auth/unauthorized-domain":       "Domain not authorised in Firebase. Contact +91 99206 57193.",
      "auth/missing-phone-number":      "Please enter your mobile number.",
      "auth/captcha-check-failed":      "Security check failed. Refresh the page and try again.",
      "auth/operation-not-allowed":     "Phone sign-in not enabled. Contact +91 99206 57193.",
      "auth/billing-not-enabled":       "Billing not enabled on Firebase project. Contact +91 99206 57193.",
      "auth/network-request-failed":    "Network error. Check your internet and try again.",
    }[code];
    if (known) return known;
    if (msg)   return `${msg}`;
    return `Error (${code ?? "unknown"}). Please try again or call +91 99206 57193`;
  };

  // ── reCAPTCHA helpers ──
  const clearVerifier = () => {
    try { window._knbCaptcha?.clear(); } catch(_) {}
    window._knbCaptcha = null;
    captchaRef.current = null;
    // Manually wipe the container so the next RecaptchaVerifier can render fresh
    const el = document.getElementById("recaptcha-root");
    if (el) el.innerHTML = "";
  };

  const makeVerifier = () => {
    clearVerifier();
    const v = new RecaptchaVerifier(auth, "recaptcha-root", { size: "invisible" });
    window._knbCaptcha = v;
    captchaRef.current = v;
    return v;
  };

  // Login: Send OTP
  const handleSendLoginOTP = async () => {
    if (!loginPhone || loginPhone.replace(/\D/g,"").length < 10) {
      setAuthErr("Please enter a valid 10-digit mobile number."); return;
    }
    setAuthErr(""); setAuthBusy(true);
    try {
      const verifier = makeVerifier();
      const result = await signInWithPhoneNumber(auth, fmtPhone(loginPhone), verifier);
      setLoginConfirm(result); setLoginOTPSent(true);
    } catch(e) {
      console.error("Login OTP error:", e);
      setAuthErr(getOTPErr(e));
      clearVerifier();
    }
    setAuthBusy(false);
  };

  // Login: Verify OTP
  const handleVerifyLoginOTP = async () => {
    if (!loginOTP || loginOTP.length < 6) { setAuthErr("Please enter the 6-digit OTP."); return; }
    setAuthErr(""); setAuthBusy(true);
    try {
      const cred = await loginConfirm.confirm(loginOTP);
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      if (snap.exists()) {
        setUserProfile(snap.data());
        setModal(null);
        setLoginPhone(""); setLoginOTP(""); setLoginOTPSent(false); setLoginConfirm(null);
        showToast(`✓ Welcome back, ${snap.data().name?.split(" ")[0]}!`);
      } else {
        // Phone not registered — sign them out and ask to register
        await signOut(auth);
        setAuthErr("❌ This number is not registered. Please click 'New here? Register' to create an account.");
        setLoginOTPSent(false); setLoginOTP("");
      }
    } catch(e) { setAuthErr(getOTPErr(e.code)); }
    setAuthBusy(false);
  };

  // Register: Send OTP
  const handleSendRegOTP = async () => {
    if (!regName) { setAuthErr("Please enter your name first."); return; }
    if (!regPhone || regPhone.replace(/\D/g,"").length < 10) { setAuthErr("Please enter a valid 10-digit mobile number."); return; }
    setAuthErr(""); setAuthBusy(true);
    try {
      const verifier = makeVerifier();
      const result = await signInWithPhoneNumber(auth, fmtPhone(regPhone), verifier);
      setRegConfirm(result); setRegOTPSent(true); setRegStep(2);
    } catch(e) {
      console.error("Register OTP error:", e);
      setAuthErr(getOTPErr(e));
      clearVerifier();
    }
    setAuthBusy(false);
  };

  // Register: Verify OTP + save profile
  const handleRegisterVerifyOTP = async () => {
    if (!regOTP || regOTP.length < 6) { setAuthErr("Please enter the 6-digit OTP."); return; }
    setAuthErr(""); setAuthBusy(true);
    try {
      const cred = await regConfirm.confirm(regOTP);
      await setDoc(doc(db, "users", cred.user.uid), {
        name: regName, company: regCompany, phone: fmtPhone(regPhone),
        role: regRole, industry: regIndustry,
        location: regLocation, requirement: regRequirement,
        biomass: selectedBiomass, createdAt: new Date().toISOString(),
      });
      setModal(null); setRegStep(1);
      setRegName(""); setRegCompany(""); setRegPhone("");
      setRegOTP(""); setRegOTPSent(false); setRegConfirm(null);
      setRegLocation(""); setRegRequirement("");
      showToast(`✓ Welcome to KNB, ${regName.split(" ")[0]}! Our team will be in touch.`);
    } catch(e) { setAuthErr(getOTPErr(e.code)); }
    setAuthBusy(false);
  };

  const handleEnquirySubmit = async () => {
    if (!enqName || !enqEmail || !enqPhone) {
      showToast("Please fill your name, email and mobile number."); return;
    }
    try {
      await addDoc(collection(db, "enquiries"), {
        product: enquiryProduct?.name || "",
        price: enquiryProduct?.price || "",
        name: enqName, company: enqCompany,
        email: enqEmail, phone: enqPhone,
        qty: enqQty, location: enqLocation, message: enqMsg,
        userId: currentUser?.uid || null,
        status: "new",
        createdAt: new Date().toISOString(),
      });
      setModal(null);
      setEnqName(""); setEnqCompany(""); setEnqEmail("");
      setEnqPhone(""); setEnqQty(""); setEnqLocation(""); setEnqMsg("");
      showToast("✓ Enquiry sent! KNB team will contact you within 24 hours.");
    } catch(e) {
      showToast("❌ Submit failed. Please call: +91 99206 57193");
    }
  };

  // Clock only
  useEffect(() => {
    const t = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"}));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const showToast = (msg, delay=0) => {
    setTimeout(() => {
      setToast(msg);
      setTimeout(() => setToast(null), 3800);
    }, delay);
  };

  const navTo = (id) => {
    setActiveNav(id);
    window.scrollTo({top:0, behavior:"smooth"});
  };

  const filteredProducts = PRODUCTS.filter(p => {
    const matchQ = !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase()) || p.seller.toLowerCase().includes(searchQ.toLowerCase()) || p.loc.toLowerCase().includes(searchQ.toLowerCase());
    const matchT = typeFilter === "All" || p.type === typeFilter;
    const matchC = !certFilter || p.cert;
    return matchQ && matchT && matchC;
  });

  const visibleProducts = showAllProducts ? filteredProducts : filteredProducts.slice(0,6);

  // Carbon calc
  const emFactor = {Coal:2.4, "Furnace Oil":3.1, "Natural Gas":2.0, LPG:2.9};
  const tCO2e = Math.round(mtQty * (emFactor[fuelType]||2.4) * 0.6);
  const creditVal = Math.round(tCO2e * 650);

  const handleEnquire = (product) => {
    setEnquiryProduct(product);
    setModal("enquiry");
  };

  const handleSubmit = () => {
    setModal(null);
    setRegStep(1);
    showToast("✓ Submitted! Our team will contact you within 24 hours.");
  };

  const openRegister = (role) => {
    setRegRole(role);
    setRegStep(1);
    setModal("register");
  };

  const TYPES = ["All","Briquette","Pellet","Raw Biomass"];

  return (
    <>
      <style>{FONTS + CSS}</style>

      {/* TOP BAR */}
      <div className="topbar">
        🇮🇳 India's leading Biomass Briquette & Pellet manufacturer — <span>KNB Green Energy Ltd</span> · 300+ Tons/Day · Akola, Maharashtra
      </div>

      {/* NAV */}
      <nav className="nav" id="home">
        <div className="nav-brand" onClick={() => navTo("home")}>
          <div className="nav-logo-mark">KNB</div>
          <div>
            <div className="nav-brand-name">KNB BioEnergy</div>
            <div className="nav-brand-tag">Bioenergy Products Platform</div>
          </div>
        </div>
        <div className="nav-center">
          {[["home","Home"],["products","Products"],["exchange","Exchange"],["about","About"],["contact","Contact"]].map(([id,label]) => (
            <button key={id} className={`nav-link ${activeNav===id?"active":""}`} onClick={() => navTo(id)}>{label}</button>
          ))}
        </div>
        <div className="nav-right">
          {currentUser ? (
            <>
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"5px 12px 5px 5px",background:"var(--mint)",borderRadius:20,border:"1px solid rgba(46,107,53,0.15)"}}>
                <div style={{width:26,height:26,borderRadius:"50%",background:"var(--leaf)",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>
                  {(userProfile?.name || currentUser.email || "U")[0].toUpperCase()}
                </div>
                <span style={{fontSize:12,color:"var(--leaf)",fontWeight:600,maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {userProfile?.name?.split(" ")[0] || "Account"}
                </span>
              </div>
              <button className="btn-ghost" style={{fontSize:13}} onClick={() => signOut(auth).then(() => showToast("Signed out."))}>Sign Out</button>
            </>
          ) : (
            <>
              <button className="btn-ghost" onClick={() => { setAuthErr(""); setModal("login"); }}>Sign In</button>
              <button className="btn-primary" onClick={() => setModal("choose-role")}>Get Started →</button>
            </>
          )}
        </div>
      </nav>

      {/* ═══════════════════════════════════════
          HOME PAGE
      ═══════════════════════════════════════ */}
      {activeNav === "home" && <>

      {/* TICKER */}
      <div className="ticker-wrap">
        <div className="ticker-scroll">
          {[...INIT_PRICES,...INIT_PRICES].map((p,i) => (
            <div key={i} className="ticker-item">
              <span className="t-name">{p.name}</span>
              <span className="t-price">₹{p.price.toLocaleString("en-IN")}/MT</span>
              <span style={{color:"rgba(255,255,255,0.3)",fontSize:11}}>Cal: {p.cal} kcal/kg</span>
            </div>
          ))}
        </div>
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="hero-texture"/><div className="hero-glow"/>
        <div className="hero-inner">
          <div className="hero-left">
            <div className="hero-eyebrow"><div className="hero-pulse"/>India's Bioenergy Marketplace — Open Now</div>
            <h1>Buy & Sell<br/><em>Clean Biomass</em><br/>with Confidence</h1>
            <p className="hero-sub">Connect with verified suppliers and industrial buyers. Every product is quality-certified. Every transaction generates carbon offset data.</p>
            <div className="hero-actions">
              <button className="btn-harvest btn-lg" onClick={() => navTo("products")}>Browse Products</button>
              <button className="btn-outline-leaf btn-lg" onClick={() => setModal("choose-role")}>Join the Platform</button>
            </div>
            <div className="hero-trust">
              {[["🏅","NABL Certified Products"],["🌿","Carbon Credits Included"],["⚡","Live Price Discovery"],["🔒","Verified Suppliers Only"]].map(([icon,txt],i) => (
                <div key={i} className="trust-item"><span className="trust-icon">{icon}</span><span>{txt}</span></div>
              ))}
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-role-cards">
              <div className="hero-role-title">I want to join as</div>
              <div className="role-cards-grid">
                {[
                  { role:"farmer", icon:"🌾", label:"Farmer / Raw Material Producer", sub:"I produce agricultural biomass & want to sell", color:"harvest" },
                  { role:"supplier", icon:"🏭", label:"Supplier / Manufacturer", sub:"I produce briquettes, pellets or processed biomass", color:"green" },
                  { role:"buyer", icon:"🏗️", label:"Industrial Buyer", sub:"I need bulk biomass for my factory or plant", color:"blue" },
                ].map(r => (
                  <div key={r.role} className={`role-card-hero ${selectedHeroRole===r.role?"selected":""}`}
                    onClick={() => { setSelectedHeroRole(r.role); openRegister(r.role); }}>
                    <div className="rch-icon">{r.icon}</div>
                    <div>
                      <div className="rch-label">{r.label}</div>
                      <div className="rch-sub">{r.sub}</div>
                    </div>
                    <div className="rch-arrow">›</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST NUMBERS */}
      <div className="trust-strip">
        <div className="trust-strip-inner">
          {[["₹48<em>Cr+</em>","Traded This Quarter"],["12,000<em>+</em>","MT Listed Monthly"],["240<em>+</em>","Verified Suppliers"],["18,000<em>+</em>","tCO₂e Credits Issued"]].map(([v,l],i) => (
            <div key={i} className="ts-item">
              <div className="ts-val" dangerouslySetInnerHTML={{__html:v}}/>
              <div className="ts-label">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HOME: FEATURED PRODUCTS (3 items teaser) */}
      <section className="section" style={{background:"var(--paper)"}}>
        <div className="section-narrow">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:16,marginBottom:32}}>
            <div>
              <div className="section-kicker">Marketplace Preview</div>
              <div className="section-h2">Browse <em>Biomass Products</em></div>
              <div className="section-desc">Briquettes, pellets & raw biomass from verified suppliers across India. 22 products · 6 suppliers listed.</div>
            </div>
            <button className="btn-harvest" onClick={() => navTo("products")}>View All Products →</button>
          </div>
          <div className="mkt-grid">
            {PRODUCTS.slice(0,3).map(p => (
              <div key={p.id} className="prod-card">
                <div className="prod-img-hero">
                  <div className="prod-img-bg" style={{backgroundImage:`url('${p.type==="Pellet"?"/images/pellet-8.jpg":"/images/briquette-5.jpg"}')`}}/>
                  <div className="prod-img-overlay"/>
                  {p.img && <img src={p.img} alt={p.name+" raw material"} className="prod-raw-circle" onError={e=>e.target.style.display="none"}/>}
                  <div className={`prod-type-ribbon ${p.type==="Pellet"?"ribbon-pel":"ribbon-brq"}`}>{p.type}</div>
                  {p.cert && <div className="prod-cert-ribbon">✓ KNB Assured</div>}
                </div>
                <div className="prod-card-top">
                  <span style={{fontSize:11,color:"var(--text-muted)",fontWeight:500}}>{p.loc}</span>
                </div>
                <div className="prod-body">
                  <div className="prod-name">{p.name}</div>
                  <div className="prod-specs">
                    <div className="spec"><div className="spec-k">Calorific Value</div><div className="spec-v">{p.cal} kcal/kg</div></div>
                    <div className="spec"><div className="spec-k">Moisture</div><div className="spec-v">{p.moist}</div></div>
                    <div className="spec"><div className="spec-k">Min Order</div><div className="spec-v">{p.moq}</div></div>
                  </div>
                </div>
                <div className="prod-foot">
                  <div>
                    <div className="prod-price-val">₹{p.price}<span className="prod-price-unit">/MT</span></div>
                    <div className="prod-moq">Min. {p.moq}</div>
                  </div>
                  <button className="btn-enquire" onClick={() => handleEnquire(p)}>Get Quote</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{textAlign:"center",marginTop:32}}>
            <button className="btn-ghost" style={{padding:"13px 40px",fontSize:15}} onClick={() => navTo("products")}>Browse All Products →</button>
          </div>
        </div>
      </section>

      {/* HOME: BOTTOM CTA */}
      <section className="cta-bottom">
        <h2>Ready to source <em>clean biomass?</em></h2>
        <p>India's most trusted bioenergy platform. Verified products. Transparent pricing.</p>
        <div className="cta-buttons">
          <button className="btn-harvest btn-xl" onClick={() => setModal("choose-role")}>Get Started Free →</button>
          <button className="btn-outline-leaf btn-xl" onClick={() => navTo("contact")}>Talk to Us</button>
        </div>
        <div className="cta-note">Free to join · No listing fees · NABL Certified Products</div>
      </section>

      </>}{/* END HOME */}

      {/* ═══════════════════════════════════════
          PRODUCTS PAGE
      ═══════════════════════════════════════ */}
      {activeNav === "products" && <>
      <section className="section" style={{background:"var(--paper)",paddingTop:48}}>
        <div className="section-narrow">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:16,marginBottom:24}}>
            <div>
              <div className="section-kicker">Marketplace</div>
              <div className="section-h2">Biomass <em>Product Marketplace</em></div>
              <div className="section-desc">Products listed by verified suppliers across India. NABL certified. Direct from manufacturers.</div>
            </div>
            <button className="btn-harvest" onClick={() => setModal("choose-role")}>+ Get Quote</button>
          </div>

          {/* ── WHAT ARE BRIQUETTES & PELLETS? ── */}
          <div className="type-intro-grid">
            <div className="type-intro-card">
              <div className="type-intro-bg" style={{backgroundImage:"url('/images/briquette-5.jpg')"}}/>
              <div className="type-intro-overlay"/>
              <div className="type-intro-text">
                <div className="type-intro-tag tag-brq-dark">Biomass Briquettes</div>
                <div className="type-intro-label">Dense Solid Fuel Blocks</div>
                <div className="type-intro-desc">Compressed agricultural waste pressed into cylindrical logs. Burns like coal — used in boilers, brick kilns & furnaces.</div>
              </div>
            </div>
            <div className="type-intro-card">
              <div className="type-intro-bg" style={{backgroundImage:"url('/images/pellet-8.jpg')"}}/>
              <div className="type-intro-overlay"/>
              <div className="type-intro-text">
                <div className="type-intro-tag tag-pel-dark">Biomass Pellets</div>
                <div className="type-intro-label">Small Cylindrical Pellets</div>
                <div className="type-intro-desc">Fine-ground biomass extruded into uniform 6–8mm pellets. Higher energy density, cleaner burn — ideal for pellet burners & gasifiers.</div>
              </div>
            </div>
          </div>

          <div className="mkt-controls">
            <div className="search-box">
              <span style={{color:"var(--text-muted)",fontSize:16}}>🔍</span>
              <input placeholder="Search by product name…" value={searchQ} onChange={e=>setSearchQ(e.target.value)}/>
            </div>
            <div className="filter-row">
              {TYPES.map(t => <div key={t} className={`chip ${typeFilter===t?"on":""}`} onClick={()=>setTypeFilter(t)}>{t}</div>)}
              <div className={`chip ${certFilter?"on-harvest":""}`} onClick={()=>setCertFilter(!certFilter)}>🏅 KNB Assured</div>
            </div>
          </div>
          {filteredProducts.length === 0 ? (
            <div style={{textAlign:"center",padding:"60px 0",color:"var(--text-muted)"}}>
              <div style={{fontSize:40,marginBottom:12}}>🔍</div>
              <div style={{fontSize:16,fontWeight:600}}>No products found</div>
              <div style={{fontSize:14,marginTop:6}}>Try adjusting your search or filters</div>
            </div>
          ) : (
            <>
              <div className="mkt-grid">
                {visibleProducts.map(p => (
                  <div key={p.id} className="prod-card">
                    <div className="prod-img-hero">
                      <div className="prod-img-bg" style={{backgroundImage:`url('${p.type==="Pellet"?"/images/pellet-8.jpg":"/images/briquette-5.jpg"}')`}}/>
                      <div className="prod-img-overlay"/>
                      {p.img && <img src={p.img} alt={p.name+" raw material"} className="prod-raw-circle" onError={e=>e.target.style.display="none"}/>}
                      <div className={`prod-type-ribbon ${p.type==="Pellet"?"ribbon-pel":"ribbon-brq"}`}>{p.type}</div>
                      {p.cert && <div className="prod-cert-ribbon">✓ KNB Assured</div>}
                    </div>
                    <div className="prod-card-top">
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:"var(--soil)"}}>{p.seller}</div>
                        <div style={{fontSize:11,color:"var(--text-muted)",marginTop:1}}>📍 {p.loc}</div>
                      </div>
                      {p.seller==="KNB Green Energy Ltd" && <span style={{fontSize:9,fontWeight:800,background:"var(--leaf)",color:"white",padding:"3px 7px",borderRadius:20,letterSpacing:"0.5px",whiteSpace:"nowrap"}}>KNB ★</span>}
                    </div>
                    <div className="prod-body">
                      <div className="prod-name">{p.name}</div>
                      <div className="prod-specs">
                        <div className="spec"><div className="spec-k">Calorific Value</div><div className="spec-v">{p.cal} kcal/kg</div></div>
                        <div className="spec"><div className="spec-k">Moisture</div><div className="spec-v">{p.moist}</div></div>
                        <div className="spec"><div className="spec-k">Ash Content</div><div className="spec-v">{p.ash}</div></div>
                        <div className="spec"><div className="spec-k">Min Order</div><div className="spec-v">{p.moq}</div></div>
                      </div>
                      <div className="carbon-line">🌿 {p.carbon} tCO₂e/MT offset credit available</div>
                    </div>
                    <div className="prod-foot">
                      <div>
                        <div className="prod-price-val">₹{p.price}<span className="prod-price-unit">/MT</span></div>
                        <div className="prod-moq">Min. {p.moq}</div>
                      </div>
                      <button className="btn-enquire" onClick={() => handleEnquire(p)}>Get Quote</button>
                    </div>
                  </div>
                ))}
              </div>
              {filteredProducts.length > 6 && (
                <div className="load-more">
                  <button className="btn-ghost" style={{padding:"12px 32px",fontSize:14}} onClick={() => setShowAllProducts(!showAllProducts)}>
                    {showAllProducts ? "Show Less" : `View All ${filteredProducts.length} Products →`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
      </>}{/* END PRODUCTS */}

      {/* ═══════════════════════════════════════
          EXCHANGE PAGE
      ═══════════════════════════════════════ */}
      {activeNav === "exchange" && <>
      <div className="ticker-wrap">
        <div className="ticker-scroll">
          {[...INIT_PRICES,...INIT_PRICES].map((p,i) => (
            <div key={i} className="ticker-item">
              <span className="t-name">{p.name}</span>
              <span className="t-price">₹{p.price.toLocaleString("en-IN")}/MT</span>
              <span style={{color:"rgba(255,255,255,0.3)",fontSize:11}}>Cal: {p.cal} kcal/kg</span>
            </div>
          ))}
        </div>
      </div>

      {/* SPOT EXCHANGE */}
      <section className="section exchange-section" id="exchange">
        <div className="section-narrow">
          <div className="ex-header">
            <div>
              <div className="section-kicker">Spot Exchange</div>
              <div className="section-h2">Live <em>Biomass Prices</em></div>
              <div className="section-desc">Prices update with every transaction. Bid & Ask refresh every 1.2 seconds.</div>
            </div>
            <div className="live-pill"><div className="live-dot"/>Live · {liveTime}</div>
          </div>

          {/* Price Terminal */}
          <div className="terminal-wrap">
            <div className="terminal-header">
              <div style={{display:"flex",gap:14,alignItems:"center"}}>
                <span style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.45)",letterSpacing:"1.5px",textTransform:"uppercase"}}>KNB Spot Exchange · Catalog Prices</span>
              </div>
              <div className="live-pill" style={{background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.07)"}}>
                <div className="live-dot"/><span style={{fontSize:11,fontFamily:"monospace"}}>{liveTime}</span>
              </div>
            </div>
            <div style={{padding:14,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:10}}>
              {prices.map(p => (
                <div key={p.id} className={`t-card ${p.up?"up-card":"dn-card"}`} onClick={()=>setSelectedPrice(p)} style={{cursor:"pointer"}}>
                  <div className="t-short">{p.short}</div>
                  <div className="t-name">{p.name}</div>
                  <div className="t-price-big" style={{color:"#f5a623"}}>₹{p.price.toLocaleString("en-IN")}<span style={{fontSize:11,fontWeight:400,color:"rgba(255,255,255,0.4)"}}>/MT</span></div>
                  <div className="t-ohlc" style={{marginTop:8}}>
                    <div className="t-ohlc-item"><div className="t-ohlc-k">Cal. Value</div><div className="t-ohlc-v">{p.cal} kcal/kg</div></div>
                    <div className="t-ohlc-item"><div className="t-ohlc-k">Grade</div><div className="t-ohlc-v" style={{color:"#f5a623"}}>{p.grade.split("·")[0].trim()}</div></div>
                  </div>
                  <div className="t-bid-ask" style={{marginTop:10}}>
                    <div className="t-bid"><div className="t-ba-lbl">Bid</div><div className="t-ba-val t-green">₹{(p.price-Math.round(p.price*0.002)).toLocaleString("en-IN")}</div></div>
                    <div className="t-ask"><div className="t-ba-lbl">Ask</div><div className="t-ba-val t-red">₹{(p.price+Math.round(p.price*0.002)).toLocaleString("en-IN")}</div></div>
                  </div>
                  <div className="t-vol-row" style={{marginTop:6,textAlign:"center",color:"rgba(255,255,255,0.2)"}}>Tap to view chart ↗</div>
                </div>
              ))}
            </div>
          </div>

          {/* Full Price Table */}
          <div className="ex-full-table">
           <div className="ex-full-table-scroll">
            <table className="ex-table">
              <thead><tr>
                <th>Product</th><th>Grade</th><th>Calorific Value</th><th>Spot Price</th><th>MOQ</th><th>Action</th>
              </tr></thead>
              <tbody>
                {prices.map((p,i) => (
                  <tr key={i}>
                    <td><div className="td-name">{p.name}</div><div className="td-grade">{p.short}</div></td>
                    <td><span className="td-grade">{p.grade}</span></td>
                    <td><span style={{color:"var(--gold)",fontWeight:600}}>{p.cal} kcal/kg</span></td>
                    <td><span className="td-price">₹{p.price.toLocaleString("en-IN")}/MT</span></td>
                    <td><span className="td-vol">10 MT</span></td>
                    <td><button className="btn-enquire" style={{fontSize:11.5,padding:"7px 14px"}} onClick={()=>{setModal("enquiry");setEnquiryProduct({name:p.name,price:`₹${p.price.toLocaleString("en-IN")}/MT`});}}>Get Quote</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
           </div>
          </div>
        </div>
      </section>
      </>}{/* END EXCHANGE */}

      {/* ═══════════════════════════════════════
          ABOUT PAGE
      ═══════════════════════════════════════ */}
      {activeNav === "about" && <>

      {/* HOW IT WORKS */}
      <section className="section alt-bg">
        <div className="section-narrow">
          <div className="section-header">
            <div className="section-kicker">How It Works</div>
            <div className="section-h2">Simple. Transparent. <em>Trusted.</em></div>
          </div>
          <HowItWorks />
        </div>
      </section>

      {/* CERTIFICATION */}
      <section className="section cert-section" id="certification">
        <div className="section-narrow">
          <div className="section-header">
            <div className="section-kicker">Quality Assurance</div>
            <div className="section-h2">Every Product is <em>Lab-Tested & Graded</em></div>
            <div className="section-desc">India's first standardized quality framework for biomass. Buyers always know exactly what they're getting.</div>
          </div>
          <div className="cert-flow">
            {[["1","Upload Lab Report","Submit NABL or government-approved lab test report for your product"],["2","Automated Grading","Our system assigns Grade A+, A, or B based on calorific value, moisture, ash & density"],["3","Greenifit Verification","A+ listings undergo independent third-party verification by our partner Greenifit"],["4","Go Live","Your product appears on the marketplace with a quality badge buyers trust"]].map(([n,t,d]) => (
              <div key={n} className="cert-step">
                <div className="cert-num">{n}</div>
                <div className="cert-step-title">{t}</div>
                <div className="cert-step-desc">{d}</div>
              </div>
            ))}
          </div>
          <div className="grades-row">
            {[
              { cls:"grade-Aplus", mark:"A+", name:"Platform Assured", desc:"NABL tested + Greenifit independently verified. Highest trust on the platform.", rows:[["Calorific Value","≥ 4,200 kcal/kg"],["Moisture","< 7%"],["Ash Content","< 5%"],["Density","≥ 620 kg/m³"],["Verification","NABL + Greenifit"]] },
              { cls:"grade-A", mark:"A", name:"NABL Certified", desc:"Lab-tested by NABL-approved facility. Meets specifications for most industrial sectors.", rows:[["Calorific Value","≥ 3,500 kcal/kg"],["Moisture","< 10%"],["Ash Content","< 12%"],["Density","≥ 580 kg/m³"],["Verification","NABL Approved"]] },
              { cls:"grade-B", mark:"B", name:"Standard Grade", desc:"Government-approved lab tested. Suitable for industries with standard heat requirements.", rows:[["Calorific Value","≥ 2,800 kcal/kg"],["Moisture","< 14%"],["Ash Content","< 18%"],["Density","≥ 520 kg/m³"],["Verification","Govt Lab Approved"]] },
            ].map(g => (
              <div key={g.mark} className={`grade-card-new ${g.cls}`}>
                <div className="grade-head">
                  <div className="grade-mark">{g.mark}</div>
                  <div className="grade-name-new">{g.name}</div>
                  <div className="grade-desc-new">{g.desc}</div>
                </div>
                <div className="grade-body">
                  {g.rows.map(([k,v]) => <div key={k} className="grade-row"><span className="gr-key">{k}</span><span className="gr-val">{v}</span></div>)}
                  <button className="btn-primary" style={{width:"100%",marginTop:16,padding:"11px"}} onClick={() => showToast("Certification application submitted! We'll contact you within 24 hours.")}>Get Certified</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CARBON CREDITS */}
      <section className="section carbon-section" id="carbon">
        <div className="carbon-inner">
          <div className="carbon-intro">
            <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(111,207,151,0.1)",border:"1px solid rgba(111,207,151,0.2)",color:"#6fcf97",fontSize:11.5,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",padding:"5px 12px",borderRadius:20,marginBottom:20}}>
              🌿 Carbon Intelligence
            </div>
            <h2>Every Transaction Earns <em>Carbon Credits</em></h2>
            <p>When you switch from coal or furnace oil to verified biomass, KNB calculates and certifies your Scope 1 emission reduction. Get Verra VCS-ready carbon credits for ESG reporting.</p>
          </div>
          <div className="carbon-grid-new">
            <div className="carbon-features">
              {[
                ["🌍","Scope 1 Emission Offset","Switching from fossil fuels to certified biomass generates measurable, certifiable carbon offsets under Verra VCS or Gold Standard methodology."],
                ["📋","BRSR & ESG Ready","Export carbon reduction reports compatible with SEBI's BRSR framework, GRI disclosures, and CDP submissions — automatically generated per transaction."],
                ["🏛️","India CCTS Compliant","Credits generated on KNB are structured to be compatible with India's upcoming Carbon Credit Trading Scheme (CCTS) and BEE PAT cycles."],
                ["💰","Sell Surplus Credits","Earn additional income by listing surplus carbon credits on our exchange for other buyers who need offsets — creating a new revenue stream."],
              ].map(([icon,title,desc]) => (
                <div key={title} className="cf-item">
                  <div className="cf-icon">{icon}</div>
                  <div><div className="cf-title">{title}</div><div className="cf-desc">{desc}</div></div>
                </div>
              ))}
            </div>
            <div className="carbon-calc-card">
              <div className="cc-title">Carbon Savings Calculator</div>
              <div className="cc-sub">Estimate your emission reduction when switching to biomass</div>
              <div style={{marginBottom:16}}>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.45)",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10,fontWeight:600}}>Currently using</div>
                <div className="cc-fuel-selector">
                  {["Coal","Furnace Oil","Natural Gas","LPG"].map(f => (
                    <div key={f} className={`cc-fuel-opt ${fuelType===f?"sel":""}`} onClick={() => setFuelType(f)}>{f}</div>
                  ))}
                </div>
              </div>
              <div className="cc-slider-row">
                <div className="cc-slider-label">
                  <span>Biomass required per month</span>
                  <span>{mtQty} MT/month</span>
                </div>
                <input type="range" className="cc-slider" min={10} max={2000} step={10} value={mtQty} onChange={e=>setMtQty(Number(e.target.value))}/>
              </div>
              <div className="cc-result">
                <div className="cc-res-item">
                  <div className="cc-res-val">{tCO2e.toLocaleString()}</div>
                  <div className="cc-res-label">tCO₂e saved / year</div>
                </div>
                <div className="cc-res-item">
                  <div className="cc-res-val">₹{(creditVal/100000).toFixed(1)}L</div>
                  <div className="cc-res-label">Est. credit value / year</div>
                </div>
              </div>
              <div className="cc-cta-row">
                <button className="btn-carbon" onClick={() => { setModal("enquiry"); setEnquiryProduct({name:"Carbon Credit Registration",price:"—"}); }}>Get My Credits →</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      </>}{/* END ABOUT */}

      {/* ═══════════════════════════════════════
          CONTACT PAGE
      ═══════════════════════════════════════ */}
      {activeNav === "contact" && <>
      <section className="section" style={{background:"var(--paper)",paddingTop:60}}>
        <div className="section-narrow">
          <div style={{textAlign:"center",maxWidth:600,margin:"0 auto 56px"}}>
            <div className="section-kicker">Get In Touch</div>
            <div className="section-h2">Talk to Our <em>Team</em></div>
            <div className="section-desc">Get bulk quotes, register on the platform, or ask us anything. We respond within 24 hours.</div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:32,marginBottom:48}}>
            {/* Quick Actions */}
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div style={{fontWeight:700,fontSize:16,color:"var(--soil)",marginBottom:4}}>What do you need?</div>
              {[
                {icon:"📦",title:"Get a Bulk Quote",sub:"Tell us the product & quantity. We'll send pricing within 24 hrs.",action:()=>{setModal("enquiry");setEnquiryProduct({name:"Bulk Order",price:"—"});}},
                {icon:"🏭",title:"Register as a Buyer",sub:"Create your buyer account to access the full platform.",action:()=>openRegister("buyer")},
                {icon:"🌿",title:"Carbon Credits Query",sub:"Learn how KNB credits can help your ESG & BRSR reporting.",action:()=>{setModal("enquiry");setEnquiryProduct({name:"Carbon Credit Registration",price:"—"});}},
                {icon:"💼",title:"Partnership / Distributor",sub:"Interested in distributing KNB products in your region?",action:()=>{setModal("enquiry");setEnquiryProduct({name:"Partnership Enquiry",price:"—"});}}
              ].map(({icon,title,sub,action}) => (
                <div key={title} onClick={action} style={{background:"var(--cream)",border:"1px solid var(--border)",borderRadius:12,padding:"16px 20px",cursor:"pointer",display:"flex",gap:16,alignItems:"center",transition:"all 0.15s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="var(--leaf)"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
                  <div style={{fontSize:28,flexShrink:0}}>{icon}</div>
                  <div>
                    <div style={{fontWeight:600,fontSize:14,color:"var(--soil)"}}>{title}</div>
                    <div style={{fontSize:12,color:"var(--text-muted)",marginTop:2}}>{sub}</div>
                  </div>
                  <div style={{marginLeft:"auto",color:"var(--text-muted)",fontSize:18}}>›</div>
                </div>
              ))}
            </div>

            {/* Company Details */}
            <div style={{background:"var(--soil)",borderRadius:16,padding:32,color:"white"}}>
              <div style={{fontSize:18,fontWeight:700,marginBottom:6}}>🌿 KNB Green Energy Ltd</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.45)",marginBottom:24}}>India's Leading Biomass Manufacturer</div>
              {[
                ["📞","Call Us","+91 99206 57193\n+91 9920 225395"],
                ["✉️","Email Us","knbgreenenergy@gmail.com\nkinjal@knbgreenenergy.com"],
                ["📍","Mumbai Office","Dahisar, Mumbai – 400068"],
                ["🏭","Manufacturing Plant","Gut No.33, Akola – 444107, MH"],
                ["⏱️","Response Time","Within 24 business hours"],
              ].map(([icon,label,val]) => (
                <div key={label} style={{marginBottom:20}}>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:4}}>{icon} {label}</div>
                  {val.split("\n").map(v => <div key={v} style={{fontSize:13,color:"rgba(255,255,255,0.8)",fontWeight:500}}>{v}</div>)}
                </div>
              ))}
              <button className="btn-harvest" style={{width:"100%",padding:"13px",marginTop:8}} onClick={()=>{setModal("enquiry");setEnquiryProduct({name:"General Enquiry",price:"—"});}}>
                Send Enquiry →
              </button>
            </div>
          </div>

          {/* Badges row */}
          <div style={{textAlign:"center",padding:"32px 0",borderTop:"1px solid var(--border)"}}>
            <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:16}}>Certified & Compliant</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:10,justifyContent:"center"}}>
              {["NABL Partner","Greenifit Verified","Verra VCS","Gold Standard","CCTS Ready","BEE PAT","ISO 9001"].map(b => (
                <span key={b} style={{background:"var(--mint)",color:"var(--leaf)",fontSize:11.5,fontWeight:600,padding:"5px 12px",borderRadius:20,border:"1px solid rgba(46,107,53,0.2)"}}>{b}</span>
              ))}
            </div>
          </div>
        </div>
      </section>
      </>}{/* END CONTACT */}

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="ft-brand">
              <h3>🌿 KNB Green Energy Ltd</h3>
              <p>India's leading manufacturer of Biomass Briquettes & Pellets. 300+ tons/day capacity. Made from 100% agricultural waste. Eco-friendly substitute to coal & furnace oil.</p>
              <div className="ft-badges">
                {["NABL Partner","Greenifit Verified","Verra VCS","Gold Standard","CCTS Ready","BEE PAT"].map(b => <span key={b} className="ft-badge">{b}</span>)}
              </div>
            </div>
            <div className="ft-col">
              <h4>Platform</h4>
              {["Marketplace","Spot Exchange","Certification","Carbon Credits","Forward Contracts"].map(l => <div key={l} className="ft-link">{l}</div>)}
            </div>
            <div className="ft-col">
              <h4>For You</h4>
              {["I'm a Farmer / Raw Material Producer","I'm a Supplier","I'm an Industry Buyer","Certification Guide","Carbon Calculator","Help Center"].map(l => <div key={l} className="ft-link">{l}</div>)}
            </div>
            <div className="ft-col">
              <h4>Contact Us</h4>
              <div className="ft-link">📞 +91 99206 57193</div>
              <div className="ft-link">📞 +91 9920 225395</div>
              <div className="ft-link">✉️ knbgreenenergy@gmail.com</div>
              <div className="ft-link">✉️ kinjal@knbgreenenergy.com</div>
              <div className="ft-link">📍 Dahisar, Mumbai 400068</div>
              <div className="ft-link">🏭 Gut No.33, Akola 444107</div>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="fb-left">© 2025 KNB Green Energy Ltd. Platform concept & architecture by JP Ventures. All rights reserved.</div>
            <div className="fb-right">
              <a>Privacy Policy</a><a>Terms of Use</a><a>Grievance</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── MODALS ── */}
      {modal && (
        <div className="overlay" onClick={e => e.target===e.currentTarget && (setModal(null), setRegStep(1), setAuthErr(""))}>
          <div className="modal-box" style={modal==="register" && regRole==="farmer" ? {background:"var(--bark)"} : {}}>

            {/* ── LOGIN (Mobile OTP) ── */}
            {modal === "login" && (
              <>
                <div className="modal-hd">
                  <div>
                    <div className="modal-title">Sign In</div>
                    <div className="modal-sub">{loginOTPSent ? `OTP sent to ${fmtPhone(loginPhone)}` : "Enter your mobile number to receive OTP"}</div>
                  </div>
                  <button className="modal-close" onClick={() => { setModal(null); setAuthErr(""); setLoginOTPSent(false); setLoginPhone(""); setLoginOTP(""); }}>×</button>
                </div>

                {!loginOTPSent ? (
                  <>
                    <div className="mf">
                      <label>Mobile Number</label>
                      <input placeholder="98765 43210" value={loginPhone} onChange={e=>setLoginPhone(e.target.value)}
                        onKeyDown={e=>e.key==="Enter"&&handleSendLoginOTP()}
                        style={{fontSize:18,letterSpacing:"1px"}}/>
                      <div style={{fontSize:11,color:"var(--text-muted)",marginTop:4}}>+91 added automatically · India numbers only</div>
                    </div>
                    {authErr && <div style={{fontSize:12,color:"#c0392b",background:"#fef2f2",border:"1px solid #fecaca",padding:"8px 12px",borderRadius:6,marginTop:4}}>{authErr}</div>}
                    <div className="modal-footer">
                      <button className="btn-cancel" onClick={()=>{setModal("choose-role");setAuthErr("");}}>New here? Register →</button>
                      <button className="btn-submit sky" onClick={handleSendLoginOTP} disabled={authBusy}>{authBusy?"Sending OTP…":"Send OTP →"}</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{background:"var(--mint)",border:"1px solid rgba(46,107,53,0.2)",borderRadius:8,padding:"10px 14px",fontSize:13,color:"var(--leaf)",marginBottom:16}}>
                      ✓ OTP sent! Check your SMS messages.
                    </div>
                    <div className="mf">
                      <label>Enter 6-digit OTP</label>
                      <input placeholder="• • • • • •" maxLength={6} value={loginOTP}
                        onChange={e=>setLoginOTP(e.target.value.replace(/\D/g,""))}
                        onKeyDown={e=>e.key==="Enter"&&handleVerifyLoginOTP()}
                        style={{fontSize:28,letterSpacing:"12px",textAlign:"center",fontWeight:700,fontFamily:"monospace"}}/>
                    </div>
                    {authErr && <div style={{fontSize:12,color:"#c0392b",background:"#fef2f2",border:"1px solid #fecaca",padding:"8px 12px",borderRadius:6,marginTop:4}}>{authErr}</div>}
                    <div className="modal-footer">
                      <button className="btn-cancel" onClick={()=>{setLoginOTPSent(false);setLoginOTP("");setAuthErr("");}}>← Change Number</button>
                      <button className="btn-submit sky" onClick={handleVerifyLoginOTP} disabled={authBusy}>{authBusy?"Verifying…":"Verify & Sign In →"}</button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* ── CHOOSE ROLE ── */}
            {modal === "choose-role" && (
              <>
                <div className="modal-hd">
                  <div><div className="modal-title">Join KNB BioEnergy</div><div className="modal-sub">Select how you'd like to use the platform</div></div>
                  <button className="modal-close" onClick={() => setModal(null)}>×</button>
                </div>
                <div className="role-selector-btns">
                  {[
                    {role:"farmer",icon:"🌾",label:"I'm a Farmer / Raw Material Producer",desc:"Sell agricultural residue & biomass directly to processors"},
                    {role:"supplier",icon:"🏭",label:"I'm a Supplier / Manufacturer",desc:"List processed biomass products: briquettes, pellets, biochar"},
                    {role:"buyer",icon:"🏗️",label:"I'm an Industry Buyer",desc:"Source verified biomass fuel for my factory or plant"},
                  ].map(r => (
                    <button key={r.role} className="role-sel-btn" onClick={() => openRegister(r.role)}>
                      <span className="rsb-icon">{r.icon}</span>
                      <div><div className="rsb-label">{r.label}</div><div className="rsb-desc">{r.desc}</div></div>
                      <span style={{marginLeft:"auto",color:"var(--text-muted)"}}>›</span>
                    </button>
                  ))}
                </div>
                <div style={{textAlign:"center",fontSize:13,color:"var(--text-muted)"}}>Already have an account? <span style={{color:"var(--leaf)",fontWeight:600,cursor:"pointer"}}>Sign in</span></div>
              </>
            )}

            {/* ── REGISTER (multi-step, real Firebase auth) ── */}
            {modal === "register" && (
              <>
                <div className="modal-hd">
                  <div>
                    <div className={`modal-title ${regRole==="farmer"?"light":""}`}>
                      {{farmer:"🌾 Join as Farmer",supplier:"🏭 Join as Supplier",buyer:"🏗️ Join as Buyer"}[regRole]}
                    </div>
                    <div className={`modal-sub ${regRole==="farmer"?"light":""}`}>
                      Step {regStep} of 2 · {regRole==="buyer"?"Industrial Buyer":regRole==="supplier"?"Supplier / Manufacturer":"Farmer / Raw Material"}
                    </div>
                  </div>
                  <button className={`modal-close ${regRole==="farmer"?"dark-close":""}`} onClick={() => { setModal(null); setRegStep(1); setAuthErr(""); }}>×</button>
                </div>
                <div className="step-indicator">
                  {[1,2].map(s => <div key={s} className={`step-dot ${regStep>=s?"done":""}`}/>)}
                </div>

                {/* ─ Step 1: Info + Send OTP ─ */}
                {regStep === 1 && (
                  <div>
                    <div className="modal-row">
                      <div className={`mf ${regRole==="farmer"?"mf-dark":""}`}><label>Full Name *</label>
                        <input placeholder="Your full name" value={regName} onChange={e=>setRegName(e.target.value)}/>
                      </div>
                      <div className={`mf ${regRole==="farmer"?"mf-dark":""}`}><label>{regRole==="farmer"?"Village / Farm":"Company Name"}</label>
                        <input placeholder={regRole==="farmer"?"Village, District":"Company name"} value={regCompany} onChange={e=>setRegCompany(e.target.value)}/>
                      </div>
                    </div>
                    {regRole === "buyer" && (
                      <div className="modal-row">
                        <div className="mf"><label>Industry</label>
                          <select value={regIndustry} onChange={e=>setRegIndustry(e.target.value)}>
                            {["Textiles","Chemicals","Cement","Paper & Pulp","Food Processing","Ceramics","Pharma","Steel / Foundry","Other"].map(x=><option key={x}>{x}</option>)}
                          </select>
                        </div>
                        <div className="mf"><label>Annual Requirement (MT)</label>
                          <input type="number" placeholder="e.g. 2400" value={regRequirement} onChange={e=>setRegRequirement(e.target.value)}/>
                        </div>
                      </div>
                    )}
                    {regRole === "supplier" && (
                      <div className="modal-row">
                        <div className="mf"><label>Monthly Capacity (MT)</label>
                          <input type="number" placeholder="e.g. 500" value={regRequirement} onChange={e=>setRegRequirement(e.target.value)}/>
                        </div>
                        <div className="mf"><label>Manufacturing Location</label>
                          <input placeholder="City, State" value={regLocation} onChange={e=>setRegLocation(e.target.value)}/>
                        </div>
                      </div>
                    )}
                    {regRole === "farmer" && (
                      <div className={`mf mf-dark`}><label>Available Biomass (select all)</label>
                        <div className="biomass-picker" style={{marginTop:6}}>
                          {BIOMASS_TYPES.map(b => (
                            <div key={b} className={`biomass-opt ${selectedBiomass.includes(b)?"sel":""}`}
                              onClick={() => setSelectedBiomass(prev => prev.includes(b)?prev.filter(x=>x!==b):[...prev,b])}>{b}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className={`mf ${regRole==="farmer"?"mf-dark":""}`}><label>Mobile Number * (OTP will be sent)</label>
                      <input placeholder="98765 43210" value={regPhone} onChange={e=>setRegPhone(e.target.value)} style={{fontSize:17,letterSpacing:"1px"}}/>
                      <div style={{fontSize:11,color:regRole==="farmer"?"rgba(255,255,255,0.35)":"var(--text-muted)",marginTop:4}}>+91 added automatically</div>
                    </div>
                    {authErr && <div style={{fontSize:12,color:"#c0392b",background:"#fef2f2",border:"1px solid #fecaca",padding:"8px 12px",borderRadius:6,marginTop:4}}>{authErr}</div>}
                    <div className="modal-footer">
                      <button className="btn-cancel" style={regRole==="farmer"?{background:"rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.5)",border:"1px solid rgba(255,255,255,0.1)"}:{}} onClick={() => setModal(null)}>Cancel</button>
                      <button className={`btn-submit ${regRole==="farmer"?"harvest":regRole==="buyer"?"sky":""}`}
                        onClick={handleSendRegOTP} disabled={authBusy}>
                        {authBusy ? "Sending OTP…" : "Send OTP →"}
                      </button>
                    </div>
                  </div>
                )}

                {/* ─ Step 2: OTP Verification ─ */}
                {regStep === 2 && (
                  <div>
                    <div style={{background:"var(--mint)",border:"1px solid rgba(46,107,53,0.2)",borderRadius:8,padding:"10px 14px",fontSize:13,color:"var(--leaf)",marginBottom:20}}>
                      ✓ OTP sent to +91 {regPhone} · Check your SMS
                    </div>
                    <div className={`mf ${regRole==="farmer"?"mf-dark":""}`}>
                      <label>Enter 6-digit OTP</label>
                      <input placeholder="• • • • • •" maxLength={6} value={regOTP}
                        onChange={e=>setRegOTP(e.target.value.replace(/\D/g,""))}
                        onKeyDown={e=>e.key==="Enter"&&handleRegisterVerifyOTP()}
                        style={{fontSize:28,letterSpacing:"12px",textAlign:"center",fontWeight:700,fontFamily:"monospace"}}/>
                    </div>
                    {authErr && <div style={{fontSize:12,color:"#c0392b",background:"#fef2f2",border:"1px solid #fecaca",padding:"8px 12px",borderRadius:6,marginTop:4}}>{authErr}</div>}
                    <div className="modal-footer">
                      <button className="btn-cancel" style={regRole==="farmer"?{background:"rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.5)",border:"1px solid rgba(255,255,255,0.1)"}:{}}
                        onClick={() => { setRegStep(1); setRegOTP(""); setRegOTPSent(false); setAuthErr(""); }}>← Change Number</button>
                      <button className={`btn-submit ${regRole==="farmer"?"harvest":regRole==="buyer"?"sky":""}`}
                        onClick={handleRegisterVerifyOTP} disabled={authBusy}>
                        {authBusy ? "Verifying…" : "Verify & Create Account →"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── ENQUIRY (saves to Firestore) ── */}
            {modal === "enquiry" && enquiryProduct && (
              <>
                <div className="modal-hd">
                  <div>
                    <div className="modal-title">Get a Quote</div>
                    <div className="modal-sub">{enquiryProduct.name}{enquiryProduct.price && enquiryProduct.price!=="—" ? ` · ${enquiryProduct.price}` : ""}</div>
                  </div>
                  <button className="modal-close" onClick={() => setModal(null)}>×</button>
                </div>
                {currentUser && userProfile && (
                  <div style={{background:"var(--mint)",border:"1px solid rgba(46,107,53,0.2)",borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:12,color:"var(--leaf)",display:"flex",gap:8,alignItems:"center"}}>
                    ✓ Logged in as <strong>{userProfile.name}</strong> · form pre-filled
                  </div>
                )}
                <div className="modal-row">
                  <div className="mf"><label>Your Name *</label>
                    <input placeholder="Full name" value={enqName} onChange={e=>setEnqName(e.target.value)}/>
                  </div>
                  <div className="mf"><label>Company</label>
                    <input placeholder="Company name" value={enqCompany} onChange={e=>setEnqCompany(e.target.value)}/>
                  </div>
                </div>
                <div className="modal-row">
                  <div className="mf"><label>Email *</label>
                    <input type="email" placeholder="you@company.com" value={enqEmail} onChange={e=>setEnqEmail(e.target.value)}/>
                  </div>
                  <div className="mf"><label>Mobile *</label>
                    <input placeholder="+91 98765 43210" value={enqPhone} onChange={e=>setEnqPhone(e.target.value)}/>
                  </div>
                </div>
                <div className="modal-row">
                  <div className="mf"><label>Quantity Needed (MT)</label>
                    <input type="number" placeholder="e.g. 50" value={enqQty} onChange={e=>setEnqQty(e.target.value)}/>
                  </div>
                  <div className="mf"><label>Delivery State</label>
                    <input placeholder="e.g. Maharashtra" value={enqLocation} onChange={e=>setEnqLocation(e.target.value)}/>
                  </div>
                </div>
                <div className="mf"><label>Message / Specific Requirements</label>
                  <textarea placeholder="Grade, calorific value, delivery timeline, payment terms…" value={enqMsg} onChange={e=>setEnqMsg(e.target.value)}/>
                </div>
                <div className="modal-footer">
                  <button className="btn-cancel" onClick={() => setModal(null)}>Cancel</button>
                  <button className="btn-submit" onClick={handleEnquirySubmit}>Submit Enquiry →</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
      {/* reCAPTCHA container — must be in DOM at all times for Firebase Phone Auth */}
      <div id="recaptcha-root" style={{position:"fixed",bottom:0,left:0,zIndex:9999}}/>

      {/* ── PRICE CHART MODAL ── */}
      {selectedPrice && (
        <div onClick={()=>setSelectedPrice(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#2d1f12",border:"1px solid rgba(255,255,255,0.1)",borderRadius:18,padding:28,maxWidth:680,width:"100%",maxHeight:"92vh",overflowY:"auto"}}>

            {/* Header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
              <div>
                <div style={{fontFamily:"monospace",fontSize:10,color:"rgba(255,255,255,0.3)",letterSpacing:"2px",marginBottom:4}}>{selectedPrice.short} · {selectedPrice.grade}</div>
                <div style={{fontSize:22,fontWeight:700,color:"white",lineHeight:1.2}}>{selectedPrice.name}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:30,fontWeight:800,fontFamily:"'Bricolage Grotesque',sans-serif",color:"#f5a623",lineHeight:1}}>₹{selectedPrice.price.toLocaleString("en-IN")}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:2}}>per Metric Tonne</div>
              </div>
            </div>

            {/* Chart */}
            <div style={{background:"rgba(0,0,0,0.35)",borderRadius:10,padding:"14px 14px 8px",marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{fontSize:10,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"1.2px"}}>Price History</span>
                <span style={{fontSize:10,color:"rgba(255,255,255,0.2)",fontStyle:"italic"}}>Live data coming soon · Indicative only</span>
              </div>
              <MiniChart history={selectedPrice.history} up={selectedPrice.up} width={600} height={130}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"rgba(255,255,255,0.18)",marginTop:6,paddingTop:6,borderTop:"1px solid rgba(255,255,255,0.04)"}}>
                <span>60 min ago</span><span>45 min ago</span><span>30 min ago</span><span>15 min ago</span><span>Now</span>
              </div>
            </div>

            {/* OHLC Grid */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
              {[["Open","₹"+selectedPrice.open.toLocaleString("en-IN"),null],
                ["High","₹"+selectedPrice.high.toLocaleString("en-IN"),"#27ae60"],
                ["Low","₹"+selectedPrice.low.toLocaleString("en-IN"),"#e74c3c"],
                ["Cal. Value",selectedPrice.cal+" kcal/kg","#f5a623"]
              ].map(([k,v,c])=>(
                <div key={k} style={{background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"10px 12px"}}>
                  <div style={{fontSize:9,color:"rgba(255,255,255,0.28)",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:5}}>{k}</div>
                  <div style={{fontSize:13,fontWeight:700,fontFamily:"monospace",color:c||"rgba(255,255,255,0.75)"}}>{v}</div>
                </div>
              ))}
            </div>

            {/* Bid / Ask */}
            <div style={{display:"flex",gap:8,marginBottom:18}}>
              <div style={{flex:1,background:"rgba(39,174,96,0.1)",border:"1px solid rgba(39,174,96,0.25)",borderRadius:10,padding:"12px 16px",textAlign:"center"}}>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:4}}>Bid Price</div>
                <div style={{fontSize:20,fontWeight:700,color:"#27ae60",fontFamily:"monospace"}}>₹{(selectedPrice.price-Math.round(selectedPrice.price*0.002)).toLocaleString("en-IN")}</div>
              </div>
              <div style={{flex:1,background:"rgba(231,76,60,0.1)",border:"1px solid rgba(231,76,60,0.25)",borderRadius:10,padding:"12px 16px",textAlign:"center"}}>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:4}}>Ask Price</div>
                <div style={{fontSize:20,fontWeight:700,color:"#e74c3c",fontFamily:"monospace"}}>₹{(selectedPrice.price+Math.round(selectedPrice.price*0.002)).toLocaleString("en-IN")}</div>
              </div>
            </div>

            {/* Actions */}
            <div style={{display:"flex",gap:10}}>
              <button className="btn-enquire" style={{flex:1,padding:"13px",fontSize:14}} onClick={()=>{setSelectedPrice(null);setModal("enquiry");setEnquiryProduct({name:selectedPrice.name,price:"₹"+selectedPrice.price.toLocaleString("en-IN")+"/MT"});}}>
                Get Quote for {selectedPrice.name}
              </button>
              <button onClick={()=>setSelectedPrice(null)} style={{padding:"13px 20px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,color:"rgba(255,255,255,0.45)",fontSize:13,cursor:"pointer"}}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── MINI CHART COMPONENT ─────────────────────────────────── */
function MiniChart({ history, up, width=200, height=44 }) {
  if (!history || history.length < 2) return <div style={{height:44}}/>;
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;
  const pts = history.map((v, i) => [
    (i / (history.length - 1)) * width,
    height - ((v - min) / range) * (height - 4) - 2
  ]);
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const areaD = `${pathD} L${width},${height} L0,${height} Z`;
  const color = up ? '#27ae60' : '#e74c3c';
  const gradId = `grad-${up ? 'up' : 'dn'}`;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{display:'block',marginBottom:8}}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`}/>
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="3" fill={color}/>
    </svg>
  );
}

/* ─── HOW IT WORKS SUB-COMPONENT ───────────────────────────── */
function HowItWorks() {
  const [role, setRole] = useState("farmer");
  const STEPS = {
    farmer: [
      {icon:"📝",title:"Register Free",desc:"Sign up in 2 minutes with your name, mobile, and location. No documents needed to start."},
      {icon:"🌾",title:"List Your Biomass",desc:"Tell us what you have — rice husk, cotton stalk, bagasse — and how many MT per month."},
      {icon:"📞",title:"We Connect You",desc:"Our team calls you within 24 hours with pricing and a pickup schedule from your farm."},
      {icon:"💰",title:"Get Paid",desc:"Receive payment directly to your bank account within 5 days of pickup. No middlemen."},
    ],
    supplier: [
      {icon:"🏭",title:"Create Supplier Account",desc:"Register your company, manufacturing location, and product range. Free to join."},
      {icon:"🏅",title:"Get Certified",desc:"Upload your NABL lab report. We assign a quality grade and display your Platform Assured badge."},
      {icon:"📋",title:"List Products",desc:"Add your briquettes, pellets, or biomass with pricing, specs, and available quantities."},
      {icon:"📈",title:"Receive Verified Enquiries",desc:"Industrial buyers send direct enquiries. Close orders and build a repeat customer base."},
    ],
    buyer: [
      {icon:"🔍",title:"Browse Verified Products",desc:"Search by product type, calorific value, location, and certification grade. All sellers are verified."},
      {icon:"📊",title:"Compare Prices",desc:"See live market prices and compare multiple sellers side by side before placing an enquiry."},
      {icon:"📦",title:"Place Your Order",desc:"Submit an enquiry or place an order directly. Our team confirms availability and logistics."},
      {icon:"🌿",title:"Get Carbon Credits",desc:"Receive certified carbon offset credits for your purchase, ready for ESG and BRSR reporting."},
    ],
  };
  const colorMap = { farmer:"active-farmer", supplier:"active-supplier", buyer:"active-buyer" };
  const numMap = { farmer:"num-farmer", supplier:"num-supplier", buyer:"num-buyer" };
  return (
    <div>
      <div className="role-tabs" style={{marginBottom:32}}>
        {[["🌾","Farmers","farmer"],["🏭","Suppliers","supplier"],["🏗️","Buyers","buyer"]].map(([icon,label,r]) => (
          <button key={r} className={`role-tab ${role===r?colorMap[r]:""}`} onClick={() => setRole(r)}>{icon} {label}</button>
        ))}
      </div>
      <div className="hiw-grid">
        {STEPS[role].map((step,i) => (
          <div key={i} className="hiw-card">
            <div className={`hiw-num ${numMap[role]}`}>{i+1}</div>
            <div className="hiw-icon">{step.icon}</div>
            <div className="hiw-title">{step.title}</div>
            <div className="hiw-desc">{step.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
