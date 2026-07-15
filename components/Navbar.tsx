"use client";

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, PanInfo } from 'framer-motion';
import { siteConfig } from '../siteConfig';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // 实时时钟 + 倒计时状态（导航栏左/右）
  const [clock, setClock] = useState('--:--:--');
  const [cd, setCd] = useState<{ title: string; d: number; h: number; m: number; passed: boolean }>({ title: '--', d: 0, h: 0, m: 0, passed: false });

  // --- 🌟 物理引擎：菜单转动逻辑 ---
  const wheelRef = useRef<HTMLDivElement>(null);
  const rawRotation = useMotionValue(0);
  const smoothRotation = useSpring(rawRotation, { stiffness: 200, damping: 25 });
  const inverseRotation = useTransform(smoothRotation, (r) => -r);

  const handlePan = (event: any, info: PanInfo) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const currX = info.point.x;
    const currY = info.point.y;
    const prevX = currX - info.delta.x;
    const prevY = currY - info.delta.y;
    const prevAngle = Math.atan2(prevY - centerY, prevX - centerX);
    const currAngle = Math.atan2(currY - centerY, currX - centerX);
    let deltaAngle = (currAngle - prevAngle) * (180 / Math.PI);
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;
    rawRotation.set(rawRotation.get() + deltaAngle);
  };

  // --- 🌟 物理引擎：手机端按钮拖拽逻辑 ---
  const dragY = useMotionValue(0);
  const [constraints, setConstraints] = useState({ top: 0, bottom: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const vh = window.innerHeight;
      setConstraints({
        top: -(vh / 2) + 80,
        bottom: (vh / 2) - 80
      });
    }
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) rawRotation.set(0);
  }, [isMobileMenuOpen, rawRotation]);

  // 实时时钟与倒计时（每秒刷新）
  useEffect(() => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const tick = () => {
      const now = new Date();
      setClock(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);
      const events: any[] = (siteConfig as any).countdowns || [];
      if (events.length) {
        const nowMs = now.getTime();
        let ev = events.find((e: any) => new Date(e.target).getTime() > nowMs);
        let passed = false;
        if (!ev) { ev = events[events.length - 1]; passed = true; }
        const diff = Math.abs(new Date(ev.target).getTime() - nowMs);
        setCd({
          title: ev.title,
          d: Math.floor(diff / 86400000),
          h: Math.floor(diff / 3600000) % 24,
          m: Math.floor(diff / 60000) % 60,
          passed,
        });
      }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const navLinks = [
    { name: '首页', href: '/' },
    { name: '项目', href: '/projects' },
    { name: '归档', href: '/timeline' },
    { name: '说说', href: '/moments' },
    { name: '杂谈', href: '/chatter' },
    { name: '照片墙', href: '/photowall' },
    { name: '音乐', href: '/music' },
    { name: '灵境', href: '/tree' },
    { name: '友链', href: '/friends' },
    { name: '关于', href: '/about' },
  ];

  // 🌟 核心：过滤掉“灵境”，专供手机端使用，保证圆盘自动重新均匀排布
  const mobileNavLinks = navLinks.filter(link => link.href !== '/tree');

  // 倒计时特效：按剩余天数分级呼吸闪烁（克制，不夸张）
  const cdClass = cd.passed
    ? ''
    : cd.d <= 7
      ? 'cd-pulse cd-pulse-critical'
      : cd.d <= 30
        ? 'cd-pulse cd-pulse-urgent'
        : 'cd-pulse';

  return (
    <>
      {/* PC端导航栏（常驻显示，不随滚动隐藏） */}
      <header className="hidden md:block w-full fixed top-0 left-0 right-0 z-50 border-b bg-white/40 dark:bg-slate-900/50 backdrop-blur-xl border-white/20 dark:border-white/5 shadow-sm">
        <div className="w-[94%] max-w-7xl mx-auto h-16 flex items-center justify-between gap-4 px-2 box-border">
          {/* 左侧：实时时间 */}
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-mono tabular-nums text-sm shrink-0" title="当前时间">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{clock}</span>
          </div>

          {/* 中间：Logo + 导航 */}
          <div className="flex items-center gap-5 lg:gap-7 flex-1 justify-center min-w-0">
            <Link href="/" className="text-lg font-black text-slate-800 dark:text-white tracking-tighter hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 whitespace-nowrap shrink-0">
              {siteConfig.navTitle || siteConfig.authorName}
              <span className="text-indigo-500 mx-1">{siteConfig.navSuffix || 'の'}</span>
              {siteConfig.navAfter || '宝藏之地'}
            </Link>
            <nav className="flex gap-3 lg:gap-6 text-sm font-bold overflow-x-auto no-scrollbar">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname === `${link.href}/`;
                return (
                  <Link key={link.href} href={link.href} className={`relative py-1 whitespace-nowrap transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200 hover:text-indigo-600'}`}>
                    {link.name}
                    {isActive && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-500 rounded-full animate-pulse"></span>}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* 右侧：倒计时 */}
          <div className={`flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200 shrink-0 ${cdClass}`} title={cd.passed ? '已结束' : '倒计时'}>
            <span className="cd-title text-indigo-500 dark:text-indigo-400">{cd.title}</span>
            <span className="font-mono tabular-nums">{cd.d}<span className="text-xs font-normal mx-0.5">天</span>{cd.h}<span className="text-xs font-normal mx-0.5">时</span>{cd.m}<span className="text-xs font-normal">分</span></span>
          </div>
        </div>
      </header>

      {/* 📱 手机端：可拖拽吸附的触发球 */}
      <div className="md:hidden">
        <motion.button
          drag="y"
          dragConstraints={constraints}
          dragElastic={0.1}
          dragMomentum={false}
          style={{ y: dragY }}
          onClick={() => {
            if (Math.abs(dragY.getVelocity()) < 10) {
              setIsMobileMenuOpen(true);
            }
          }}
          className={`fixed top-1/2 right-0 -translate-y-1/2 w-12 h-28 bg-indigo-500/80 backdrop-blur-xl rounded-l-full shadow-[-5px_0_20px_rgba(99,102,241,0.4)] z-[60] flex items-center justify-center transition-all duration-500 border-y border-l border-white/30 touch-none ${isMobileMenuOpen ? 'translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}
        >
          <div className="flex flex-col gap-1.5 items-center justify-center mr-2">
            <div className="w-1.5 h-1.5 bg-white/90 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-white/90 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-white/90 rounded-full"></div>
          </div>
        </motion.button>

        {/* 2. 居中展开的巨型全圆转轴 */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[65]"
              />

              <motion.div
                initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
                transition={{ type: 'spring', damping: 20, stiffness: 150 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] z-[70] pointer-events-none"
              >
                <motion.div
                  ref={wheelRef}
                  style={{ rotate: smoothRotation }}
                  onPan={handlePan}
                  className="w-full h-full rounded-full border border-white/30 dark:border-slate-500/50 bg-white/40 dark:bg-slate-800/50 backdrop-blur-3xl shadow-[0_0_50px_rgba(0,0,0,0.3)] pointer-events-auto relative cursor-grab active:cursor-grabbing"
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-700 border-4 border-slate-300 dark:border-slate-500 flex items-center justify-center shadow-inner z-10">
                    <button onClick={() => setIsMobileMenuOpen(false)} className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white font-black shadow-lg hover:bg-red-500 hover:rotate-90 transition-all duration-300 active:scale-95">
                      ✕
                    </button>
                  </div>

                  {/* 🌟 手机端轮盘渲染：使用过滤后的 mobileNavLinks */}
                  {mobileNavLinks.map((link, index) => {
                    const isActive = pathname === link.href || pathname === `${link.href}/`;
                    // 🌟 角度计算也会基于过滤后的长度，保证图标自动均匀排布！
                    const angle = index * (360 / mobileNavLinks.length);

                    return (
                      <div
                        key={link.href}
                        className="absolute top-1/2 left-1/2 w-14 h-14 -ml-7 -mt-7 flex items-center justify-center"
                        style={{
                          transform: `rotate(${angle}deg) translateY(-115px) rotate(${-angle}deg)`
                        }}
                      >
                        <motion.div style={{ rotate: inverseRotation }} className="w-full h-full">
                          <Link
                            href={link.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center justify-center w-full h-full rounded-full transition-all duration-300 ${
                              isActive 
                                ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.8)] scale-110' 
                                : 'bg-white/90 dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-md hover:scale-110 border border-white/50 dark:border-slate-600'
                            }`}
                          >
                            <span className="text-[11px] font-black">{link.name}</span>
                          </Link>
                        </motion.div>
                      </div>
                    );
                  })}
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}