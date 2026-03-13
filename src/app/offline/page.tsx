'use client';

export default function OfflinePage() {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta charSet="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>أنت في الفضاء — يالا نلعب</title>
        <style>{`
          * { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; }
          body {
            background:#020308; color:#f0f6ff;
            font-family:'Cairo',Arial,sans-serif;
            min-height:100dvh; display:flex; flex-direction:column;
            align-items:center; justify-content:center;
            overflow:hidden; text-align:center; padding:24px;
          }
          .stars { position:fixed; inset:0; pointer-events:none; }
          .s { position:absolute; border-radius:50%; animation:twinkle 3s ease-in-out infinite; }
          @keyframes twinkle {
            0%,100%{opacity:.3;transform:scale(1);}
            50%{opacity:1;transform:scale(1.5);}
          }
          .astronaut {
            font-size:80px; animation:float 4s ease-in-out infinite;
            filter:drop-shadow(0 0 30px rgba(0,212,255,.5));
            margin-bottom:24px;
          }
          @keyframes float {
            0%,100%{transform:translateY(0) rotate(-5deg);}
            50%{transform:translateY(-20px) rotate(5deg);}
          }
          h1 {
            font-size:28px; font-weight:900; margin-bottom:8px;
            background:linear-gradient(135deg,#00d4ff,#9b5fe0);
            -webkit-background-clip:text; background-clip:text;
            -webkit-text-fill-color:transparent;
          }
          p { font-size:14px; color:rgba(0,212,255,.5); font-weight:700; margin-bottom:32px; line-height:1.6; }
          .btn {
            display:inline-flex; align-items:center; gap:8px;
            padding:14px 32px; border-radius:16px;
            background:linear-gradient(135deg,#f5a623,#ffd060);
            color:#000; font-weight:900; font-size:14px;
            border:none; cursor:pointer;
            box-shadow:0 8px 32px rgba(245,166,35,.5);
            transition:all .2s; font-family:inherit;
          }
          .btn:active{transform:scale(.97);}
          .signal {
            position:absolute; width:200px; height:200px;
            border-radius:50%; border:1px solid rgba(0,212,255,.2);
            animation:radar 3s linear infinite;
          }
          .signal:nth-child(2){animation-delay:1s;}
          .signal:nth-child(3){animation-delay:2s;}
          @keyframes radar {
            from{transform:scale(0);opacity:.8;}
            to{transform:scale(3);opacity:0;}
          }
        `}</style>
      </head>
      <body>
        <div className="stars" aria-hidden="true">
          {[...Array(40)].map((_, i) => (
            <div key={i} className="s" style={{
              width:`${Math.random()*2+1}px`,
              height:`${Math.random()*2+1}px`,
              top:`${Math.random()*100}%`,
              left:`${Math.random()*100}%`,
              background:["#fff","#00d4ff","#9b5fe0","#f5a623"][Math.floor(Math.random()*4)],
              animationDelay:`${Math.random()*3}s`,
              animationDuration:`${2+Math.random()*3}s`,
            }}/>
          ))}
        </div>
        <div style={{position:"relative",width:200,height:200,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16}}>
          <div className="signal"/>
          <div className="signal"/>
          <div className="signal"/>
          <div className="astronaut">🧑‍🚀</div>
        </div>
        <h1>أنت في الفضاء الآن!</h1>
        <p>لا يوجد اتصال بالإنترنت<br/>تحقق من اتصالك وحاول مرة أخرى</p>
        <button className="btn" onClick={() => window.location.reload()}>
          🔄 إعادة الاتصال
        </button>
      </body>
    </html>
  );
}
