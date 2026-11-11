// Demo interactiva de la pasarela de pagos que se muestra en la landing.
// Es solo visual: no cobra ni crea reservas (el pago real vive en BookingModal).
import React, { useState } from 'react';
import { PAY_LOGOS } from './payLogos';

type Method = 'wallet' | 'card' | 'cash';

const METHODS: Array<{ id: Method; name: string; sub: string; logos: Array<{ src: string; alt: string; h: number }> }> = [
  { id: 'wallet', name: 'Billeteras virtuales', sub: 'Mercado Pago, MODO o Ualá', logos: [{ src: PAY_LOGOS.mp, alt: 'Mercado Pago', h: 34 }, { src: PAY_LOGOS.modo, alt: 'MODO', h: 22 }, { src: PAY_LOGOS.uala, alt: 'Ualá', h: 24 }] },
  { id: 'card', name: 'Débito o crédito', sub: 'Visa o Mastercard', logos: [{ src: PAY_LOGOS.visa, alt: 'Visa', h: 30 }, { src: PAY_LOGOS.mc, alt: 'Mastercard', h: 44 }] },
  { id: 'cash', name: 'Efectivo', sub: 'Rapipago o Pago Fácil', logos: [{ src: PAY_LOGOS.rapi, alt: 'Rapipago', h: 24 }, { src: PAY_LOGOS.pf, alt: 'Pago Fácil', h: 50 }] },
];

export const CheckoutDemo: React.FC = () => {
  const [sel, setSel] = useState<Method>('wallet');
  const [done, setDone] = useState(false);
  const [num, setNum] = useState('');
  const [name, setName] = useState('');
  const [exp, setExp] = useState('');

  const cur = METHODS.find((m) => m.id === sel) ?? METHODS[0];
  const tiles = METHODS.map((m) => {
    const on = m.id === sel;
    return {
      name: m.name,
      sub: m.sub,
      logos: m.logos.map((l) => ({ ...l, bg: 'transparent', fx: m.id === 'cash' ? '0 1 auto' : '1 1 72px' })),
      on,
      pressed: on,
      bg: on ? 'linear-gradient(160deg, rgba(59,130,246,.18), rgba(var(--card-rgb,15,22,38),.92))' : 'var(--card2,#0B1120)',
      border: on ? '#3B82F6' : 'var(--line,#1C2538)',
      glow: on ? '0 18px 44px rgba(59,130,246,.28)' : '0 6px 18px rgba(var(--sh-rgb,0,0,0),calc(.25 * var(--sh-k,1)))',
      scale: on ? 'scale(1.05)' : 'scale(1)',
      op: on ? 1 : 0.78,
      radio: on ? '#3B82F6' : 'var(--line2,#3A465E)',
      pick: () => {
        setSel(m.id);
        setDone(false);
      },
    };
  });
  const digits = num.replace(/\D/g, '');
  const brand = /^4/.test(digits) ? 'visa' : /^(5[1-5]|2[2-7])/.test(digits) ? 'mc' : '';
  const brandName = brand === 'visa' ? 'Visa' : brand === 'mc' ? 'Mastercard' : 'Tarjeta';

  const v = {
    tiles,
    brandLogos: [
      { src: PAY_LOGOS.visa, h: 20, bg: 'transparent', op: brand === 'mc' ? 0.25 : 1 },
      { src: PAY_LOGOS.mc, h: 28, bg: 'transparent', op: brand === 'visa' ? 0.25 : 1 },
    ],
    isWallet: sel === 'wallet',
    isCard: sel === 'card',
    isCash: sel === 'cash',
    selName: sel === 'card' ? brandName : cur.name,
    cardNum: digits.slice(0, 16).padEnd(16, '•').replace(/(.{4})/g, '$1 ').trim(),
    cardName: (name || 'NOMBRE Y APELLIDO').toUpperCase().slice(0, 24),
    cardExp: exp || 'MM/AA',
    ctaLabel: sel === 'cash' ? 'Generar código y reservar' : 'Confirmar reserva',
    done,
    notDone: !done,
    doneTitle: sel === 'cash' ? 'Código generado' : 'Reserva confirmada',
    doneText: sel === 'cash' ? 'Pagá con tu código en Rapipago o Pago Fácil. Te avisamos cuando se acredite.' : 'Listo. Te esperamos en la plaza B07.',
    confirm: () => setDone(true),
    reset: () => setDone(false),
    onNum: (e: React.ChangeEvent<HTMLInputElement>) => setNum(e.target.value),
    onName: (e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value),
    onExp: (e: React.ChangeEvent<HTMLInputElement>) => setExp(e.target.value),
  };

  return (
    <div className="pkc-root" style={{ width: "100%", boxSizing: "border-box", background: "var(--bg1,#070B15)", fontFamily: "'Albert Sans', sans-serif", color: "var(--tx,#FFFFFF)", padding: "24px" }}>
    <div style={{ maxWidth: "1160px", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "24px", alignItems: "flex-start" }}>
    
    <div style={{ flex: "999 1 560px", minWidth: "0", background: "linear-gradient(180deg, var(--card,#0F1626), var(--card2,#0B111E))", border: "1px solid rgba(var(--fg-rgb,255,255,255),0.08)", borderRadius: "24px", padding: "28px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "22px" }}>
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
    <h3 style={{ margin: "0", fontSize: "28px", fontWeight: 800, letterSpacing: "-0.02em" }}>Elegí cómo pagar</h3>
    <p style={{ margin: "0", fontSize: "16px", color: "var(--tx2,#9AA6BA)" }}>Pagás al confirmar. Si cancelás antes de llegar, no se cobra.</p>
    </div>
    
    <div role="radiogroup" aria-label="Medio de pago" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "16px", padding: "8px 4px" }}>
    {v.tiles.map((m, mIndex) => (<React.Fragment key={mIndex}>
    <button type="button" role="radio" aria-checked={m.pressed} onClick={m.pick} style={{ position: "relative", display: "flex", flexDirection: "column", gap: "14px", padding: "14px", borderRadius: "18px", cursor: "pointer", textAlign: "left", fontFamily: "inherit", color: "var(--tx,#FFFFFF)", background: m.bg, border: `2px solid ${m.border}`, boxShadow: m.glow, transform: m.scale, opacity: m.op, transition: "transform .35s cubic-bezier(.2,.8,.2,1), border-color .3s, box-shadow .35s, background .3s, opacity .3s" }}>
    <span style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px", borderRadius: "12px", background: "radial-gradient(120% 90% at 50% 0%, rgba(var(--fg-rgb,255,255,255),0.07), rgba(var(--fg-rgb,255,255,255),0.015))", border: "1px solid rgba(var(--fg-rgb,255,255,255),0.07)", padding: "4px" }}>
    {m.logos.map((lg, lgIndex) => (<React.Fragment key={lgIndex}><span className={lg.alt === 'Rapipago' ? 'pk-logo-dark' : undefined} style={{ flex: lg.fx, minWidth: "0", height: "60px", borderRadius: "10px", background: lg.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 10px", boxSizing: "border-box" }}><img src={lg.src} alt={lg.alt} style={{ display: "block", width: "auto", height: "auto", maxHeight: `${lg.h}px`, maxWidth: "100%", objectFit: "contain" }} /></span></React.Fragment>))}
    </span>
    <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
    <span style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
    <strong style={{ fontSize: "17px" }}>{m.name}</strong>
    <span style={{ fontSize: "13px", color: "var(--tx3,#8A96AB)" }}>{m.sub}</span>
    </span>
    <span style={{ width: "26px", height: "26px", flexShrink: 0, borderRadius: "999px", border: `2px solid ${m.radio}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color .3s" }}>
    {m.on && (<><span className="pkc-anim" style={{ width: "26px", height: "26px", borderRadius: "999px", background: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center", animation: "pkcPop .45s cubic-bezier(.2,.8,.2,1) both, pkcRingBl .9s ease-out .1s" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg></span></>)}
    </span>
    </span>
    </button>
    </React.Fragment>))}
    </div>
    
    {v.isCard && (<>
    <div className="pkc-anim" style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "stretch", animation: "pkcIn .45s cubic-bezier(.2,.8,.2,1) both" }}>
    <div aria-hidden="true" style={{ '--tx': "#FFFFFF", '--tx2': "#B8C2D3", '--acc-rgb': "163,230,53", color: "#FFFFFF", flex: "1 1 240px", minHeight: "170px", borderRadius: "18px", padding: "20px", boxSizing: "border-box", background: "radial-gradient(400px 200px at 100% 0%, rgba(var(--acc-rgb,163,230,53),.35), transparent 60%), linear-gradient(140deg, #1A2540, var(--card2,#0B1120))", border: "1px solid rgba(var(--acc-rgb,163,230,53),.35)", display: "flex", flexDirection: "column", justifyContent: "space-between" } as React.CSSProperties}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <span style={{ width: "40px", height: "30px", borderRadius: "6px", background: "linear-gradient(135deg, #E9D58A, #B79A3B)" }}></span>
    <span style={{ display: "flex", alignItems: "center", gap: "8px", height: "34px" }}>
    {v.brandLogos.map((b, bIndex) => (<React.Fragment key={bIndex}><span style={{ height: "34px", padding: "4px 8px", boxSizing: "border-box", borderRadius: "8px", background: b.bg, display: "flex", alignItems: "center", opacity: b.op, transition: "opacity .3s" }}><img src={b.src} alt="" style={{ height: `${b.h}px`, objectFit: "contain" }} /></span></React.Fragment>))}
    </span>
    </div>
    <div style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "0.12em" }}>{v.cardNum}</div>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--tx2,#B8C2D3)" }}><span>{v.cardName}</span><span>{v.cardExp}</span></div>
    </div>
    <div style={{ flex: "999 1 280px", minWidth: "0", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px" }}>
    <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 600, color: "var(--tx2,#9AA6BA)" }}>Número de tarjeta<input className="pkc-in" type="text" inputMode="numeric" placeholder="0000 0000 0000 0000" onChange={v.onNum} /></label>
    <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 600, color: "var(--tx2,#9AA6BA)" }}>Nombre como figura en la tarjeta<input className="pkc-in" type="text" placeholder="Nombre y apellido" onChange={v.onName} /></label>
    <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 600, color: "var(--tx2,#9AA6BA)" }}>Vencimiento<input className="pkc-in" type="text" placeholder="MM/AA" onChange={v.onExp} /></label>
    <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 600, color: "var(--tx2,#9AA6BA)" }}>Código de seguridad<input className="pkc-in" type="password" inputMode="numeric" placeholder="CVV" /></label>
    </div>
    </div>
    </>)}
    
    {v.isWallet && (<>
    <div className="pkc-anim" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "20px", border: "1px solid rgba(56,189,248,.4)", background: "rgba(56,189,248,.06)", borderRadius: "18px", padding: "20px", animation: "pkcIn .45s cubic-bezier(.2,.8,.2,1) both" }}>
    <div aria-hidden="true" className="pk-qr" style={{ position: "relative", width: "156px", height: "156px", flexShrink: 0, borderRadius: "16px", background: "radial-gradient(circle at 50% 40%, #0A1A33, #05080F)", boxShadow: "inset 0 0 0 1px rgba(56,189,248,.35), 0 0 30px rgba(56,189,248,.18)", padding: "8px", boxSizing: "border-box" }}><svg viewBox="0 0 25 25" width="100%" height="100%" style={{ display: "block", filter: "drop-shadow(0 0 2px #38BDF8) drop-shadow(0 0 6px rgba(56,189,248,.7))" }}><path d="M10.5 2.5H11.5M13.5 2.5H13.5M10.5 3.5H11.5M13.5 3.5H14.5M10.5 4.5H12.5M14.5 4.5H14.5M10.5 5.5H10.5M14.5 5.5H14.5M11.5 6.5H11.5M13.5 6.5H14.5M10.5 7.5H11.5M13.5 7.5H13.5M10.5 8.5H10.5M12.5 8.5H12.5M14.5 8.5H14.5M11.5 9.5H11.5M13.5 9.5H14.5M2.5 10.5H2.5M4.5 10.5H5.5M7.5 10.5H9.5M12.5 10.5H12.5M17.5 10.5H17.5M19.5 10.5H20.5M22.5 10.5H22.5M2.5 11.5H3.5M9.5 11.5H9.5M13.5 11.5H13.5M16.5 11.5H16.5M18.5 11.5H18.5M2.5 12.5H3.5M5.5 12.5H10.5M12.5 12.5H14.5M16.5 12.5H17.5M22.5 12.5H22.5M2.5 13.5H3.5M6.5 13.5H7.5M9.5 13.5H11.5M13.5 13.5H16.5M2.5 14.5H2.5M7.5 14.5H10.5M12.5 14.5H22.5M12.5 15.5H16.5M19.5 15.5H22.5M10.5 16.5H11.5M13.5 16.5H14.5M17.5 16.5H17.5M19.5 16.5H19.5M11.5 17.5H13.5M17.5 17.5H18.5M12.5 18.5H12.5M14.5 18.5H18.5M21.5 18.5H21.5M12.5 19.5H16.5M20.5 19.5H20.5M10.5 20.5H10.5M15.5 20.5H16.5M18.5 20.5H18.5M21.5 20.5H22.5M12.5 21.5H14.5M17.5 21.5H17.5M21.5 21.5H21.5M10.5 22.5H11.5M16.5 22.5H16.5M19.5 22.5H22.5" fill="none" stroke="#BAE6FD" strokeWidth="0.62" strokeLinecap="round" /><rect x="2.5" y="2.5" width="6" height="6" rx="1.4" fill="none" stroke="#38BDF8" strokeWidth="0.9" /><rect x="4" y="4" width="3" height="3" rx="0.7" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="0.4" /><rect x="16.5" y="2.5" width="6" height="6" rx="1.4" fill="none" stroke="#38BDF8" strokeWidth="0.9" /><rect x="18" y="4" width="3" height="3" rx="0.7" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="0.4" /><rect x="2.5" y="16.5" width="6" height="6" rx="1.4" fill="none" stroke="#38BDF8" strokeWidth="0.9" /><rect x="4" y="18" width="3" height="3" rx="0.7" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="0.4" /></svg><svg width="22" height="22" viewBox="0 0 22 22" style={{ position: "absolute", top: "-3px", left: "-3px", transform: "none", filter: "drop-shadow(0 0 4px #38BDF8)" }}><path d="M2 20V8l6-6h12" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg><svg width="22" height="22" viewBox="0 0 22 22" style={{ position: "absolute", top: "-3px", right: "-3px", transform: "scaleX(-1)", filter: "drop-shadow(0 0 4px #38BDF8)" }}><path d="M2 20V8l6-6h12" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg><svg width="22" height="22" viewBox="0 0 22 22" style={{ position: "absolute", bottom: "-3px", left: "-3px", transform: "scaleY(-1)", filter: "drop-shadow(0 0 4px #38BDF8)" }}><path d="M2 20V8l6-6h12" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg><svg width="22" height="22" viewBox="0 0 22 22" style={{ position: "absolute", bottom: "-3px", right: "-3px", transform: "scale(-1,-1)", filter: "drop-shadow(0 0 4px #38BDF8)" }}><path d="M2 20V8l6-6h12" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg><span className="pkc-anim" style={{ position: "absolute", left: "10px", right: "10px", top: "10px", height: "3px", borderRadius: "3px", background: "linear-gradient(90deg, transparent, #E0F2FE, transparent)", boxShadow: "0 0 12px 3px rgba(56,189,248,.8)", animation: "pkcScan 2.4s ease-in-out infinite alternate" }}></span></div>
    <div style={{ flex: "999 1 240px", minWidth: "0", display: "flex", flexDirection: "column", gap: "6px" }}>
    <strong style={{ fontSize: "19px" }}>Escaneá el QR con tu billetera</strong>
    <span style={{ fontSize: "15px", lineHeight: "1.55", color: "var(--tx2,#9AA6BA)" }}>Funciona con Mercado Pago, MODO y Ualá. Desde el celular, tocá Confirmar y elegís la app.</span>
    </div>
    </div>
    </>)}
    
    {v.isCash && (<>
    <div className="pkc-anim" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "20px", border: "1px dashed rgba(253,230,138,.45)", background: "rgba(253,230,138,.05)", borderRadius: "18px", padding: "20px", animation: "pkcIn .45s cubic-bezier(.2,.8,.2,1) both" }}>
    <div style={{ flex: "999 1 240px", minWidth: "0", display: "flex", flexDirection: "column", gap: "6px" }}>
    <strong style={{ fontSize: "19px" }}>Pagás en efectivo con un código</strong>
    <span style={{ fontSize: "15px", lineHeight: "1.55", color: "var(--tx2,#9AA6BA)" }}>Mostralo en cualquier Rapipago o Pago Fácil. La plaza queda reservada cuando se acredita el pago.</span>
    </div>
    <div style={{ flex: "0 0 auto", borderRadius: "12px", background: "var(--card2,#0B1120)", border: "1px solid #2A3550", padding: "12px 18px", textAlign: "center" }}>
    <div style={{ fontSize: "12px", color: "var(--tx3,#8A96AB)" }}>Tu código</div>
    <div style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "0.08em", color: "#FDE68A" }}>[CÓDIGO]</div>
    </div>
    </div>
    </>)}
    </div>
    
    <aside style={{ flex: "1 1 320px", minWidth: "0", position: "relative", background: "repeating-linear-gradient(0deg, rgba(var(--acc-rgb,163,230,53),.035) 0 1px, transparent 1px 4px), linear-gradient(180deg, var(--card,#111A2C), var(--card2,#0B111E))", border: "1.5px solid rgba(var(--acc-rgb,163,230,53),.55)", borderRadius: "24px", padding: "28px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "18px", boxShadow: "0 30px 80px rgba(var(--sh-rgb,0,0,0),calc(.45 * var(--sh-k,1))), 0 0 26px rgba(var(--acc-rgb,163,230,53),.18), inset 0 0 22px rgba(var(--acc-rgb,163,230,53),.08)" }}>
    <div aria-hidden="true" style={{ position: "absolute", inset: "0", borderRadius: "24px", overflow: "hidden", pointerEvents: "none" }}><span className="pkc-anim" style={{ position: "absolute", top: "-1px", left: "-35%", width: "35%", height: "3px", background: "linear-gradient(90deg, transparent, var(--acc-hi,#ECFCCB), var(--acc,#A3E635), transparent)", boxShadow: "0 0 14px 3px rgba(var(--acc-rgb,163,230,53),.75)", animation: "pkcHudRun 3.2s cubic-bezier(.5,0,.5,1) infinite" }}></span></div><span aria-hidden="true" className="pkc-anim" style={{ position: "absolute", left: "-5px", top: "50%", width: "7px", height: "54px", marginTop: "-27px", borderRadius: "3px", background: "var(--acc,#A3E635)", clipPath: "polygon(0 0, 100% 18%, 100% 82%, 0 100%)", boxShadow: "0 0 12px var(--acc,#A3E635)", animation: "pkcHudPulse 2s ease-in-out infinite", pointerEvents: "none" }}></span><span aria-hidden="true" className="pkc-anim" style={{ position: "absolute", right: "-5px", top: "50%", width: "7px", height: "54px", marginTop: "-27px", borderRadius: "3px", background: "var(--acc,#A3E635)", clipPath: "polygon(0 18%, 100% 0, 100% 100%, 0 82%)", boxShadow: "0 0 12px var(--acc,#A3E635)", animation: "pkcHudPulse 2s ease-in-out 1s infinite", pointerEvents: "none" }}></span><span aria-hidden="true" style={{ position: "absolute", left: "50%", bottom: "-4px", width: "90px", marginLeft: "-45px", height: "6px", background: "var(--acc,#A3E635)", clipPath: "polygon(0 0, 100% 0, 88% 100%, 12% 100%)", filter: "drop-shadow(0 0 6px var(--acc,#A3E635))", pointerEvents: "none" }}></span>
    {v.notDone && (<>
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
    <h3 style={{ margin: "0", fontSize: "22px", fontWeight: 800 }}>Tu reserva</h3>
    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--on-acc,#05080F)", background: "var(--acc,#A3E635)", padding: "5px 11px", borderRadius: "999px" }}>Plaza B07</span>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
    <strong style={{ fontSize: "18px" }}>Estacionamiento Centro</strong>
    <span style={{ fontSize: "15px", color: "var(--tx2,#9AA6BA)" }}>Av. Corrientes 1200, a 250 m de tu destino</span>
    </div>
    <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid rgba(var(--fg-rgb,255,255,255),.08)" }}>
    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(var(--fg-rgb,255,255,255),.06)", fontSize: "15px" }}><span style={{ color: "var(--tx2,#9AA6BA)" }}>Fecha</span><span>Hoy</span></div>
    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(var(--fg-rgb,255,255,255),.06)", fontSize: "15px" }}><span style={{ color: "var(--tx2,#9AA6BA)" }}>Horario</span><span>18:00 a 21:00</span></div>
    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(var(--fg-rgb,255,255,255),.06)", fontSize: "15px" }}><span style={{ color: "var(--tx2,#9AA6BA)" }}>Duración</span><span>3 horas</span></div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", fontSize: "15px" }}><span style={{ color: "var(--tx2,#9AA6BA)" }}>Medio de pago</span><strong>{v.selName}</strong></div>
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: "4px" }}>
    <span style={{ fontSize: "17px", fontWeight: 700 }}>Total</span>
    <span style={{ fontSize: "32px", fontWeight: 900, letterSpacing: "-0.02em" }}>$ [PRECIO]</span>
    </div>
    <button type="button" className="pkc-cta" onClick={v.confirm} style={{ height: "58px", border: "0", borderRadius: "14px", background: "var(--acc,#A3E635)", color: "var(--on-acc,#05080F)", font: "800 18px 'Albert Sans', sans-serif", cursor: "pointer", boxShadow: "0 10px 34px rgba(var(--acc-rgb,163,230,53),.35)" }}>{v.ctaLabel}</button>
    <span style={{ fontSize: "13px", color: "var(--tx3,#6F7C93)", textAlign: "center" }}>Pago protegido. Tus datos no se guardan en este dispositivo.</span>
    </div>
    </>)}
    {v.done && (<>
    <div className="pkc-anim" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "14px", padding: "24px 0", animation: "pkcIn .5s cubic-bezier(.2,.8,.2,1) both" }}>
    <span className="pkc-anim" style={{ width: "84px", height: "84px", borderRadius: "999px", background: "var(--acc,#A3E635)", display: "flex", alignItems: "center", justifyContent: "center", animation: "pkcPop .6s cubic-bezier(.2,.8,.2,1) both, pkcRing 1.2s ease-out .2s 2" }}><svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#05080F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg></span>
    <strong style={{ fontSize: "26px" }}>{v.doneTitle}</strong>
    <span style={{ fontSize: "16px", lineHeight: "1.55", color: "var(--tx2,#9AA6BA)", maxWidth: "300px" }}>{v.doneText}</span>
    <button type="button" onClick={v.reset} style={{ marginTop: "8px", border: "1.5px solid rgba(var(--fg-rgb,255,255,255),.18)", background: "transparent", color: "var(--tx,#FFFFFF)", borderRadius: "12px", padding: "12px 20px", font: "700 15px 'Albert Sans', sans-serif", cursor: "pointer" }}>Elegir otro medio de pago</button>
    </div>
    </>)}
    </aside>
    </div>
    </div>
  );
};
