import { useState } from "react";
import { CLight, font, fontD } from "../../shared/design";
import { AUTH_USERS } from "../../shared/constants";
import { User, Lock, Eye } from "lucide-react";

export default function LoginPage({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const u = user.trim().toLowerCase();
    if (AUTH_USERS[u] && AUTH_USERS[u] === pass) {
      onLogin(u);
    } else {
      setError("Usuário ou senha incorretos");
      setTimeout(() => setError(""), 3000);
    }
  };

  const colors = CLight;

  return (
    <div style={{
      minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
      background:`linear-gradient(135deg, #0a0a0e 0%, #1a1020 50%, #0a0a0e 100%)`,
      fontFamily:font,position:"relative",overflow:"hidden"
    }}>
      <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"radial-gradient(circle at 50% 30%, rgba(212,35,43,0.08) 0%, transparent 60%)"}}/>
      <div style={{
        width:360,padding:"40px 36px",borderRadius:16,
        background:"rgba(18,18,24,0.85)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",
        border:"1px solid rgba(255,255,255,0.07)",boxShadow:"0 8px 40px rgba(0,0,0,0.5)",
        position:"relative",zIndex:1
      }}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <img src="/3154_imgbank_1685113109.png" alt="Botafogo FC" style={{width:64,height:64,objectFit:"contain",marginBottom:12}} onError={e=>{e.target.style.display="none"}}/>
          <div style={{fontFamily:fontD,fontSize:22,fontWeight:700,color:"#d4232b",textTransform:"uppercase",letterSpacing:"0.12em"}}>BFSA</div>
          <div style={{fontFamily:font,fontSize:10,color:"#5a6070",textTransform:"uppercase",letterSpacing:"0.15em",marginTop:2}}>Análise de Desempenho</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:16}}>
            <label style={{fontFamily:font,fontSize:9,color:"#5a6070",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6,display:"block"}}>Usuário</label>
            <div style={{position:"relative"}}>
              <User size={14} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#5a6070"}}/>
              <input
                value={user} onChange={e=>setUser(e.target.value)}
                placeholder="Digite seu usuário"
                autoFocus
                style={{
                  width:"100%",padding:"10px 12px 10px 36px",fontFamily:font,fontSize:13,
                  color:"#f0eee9",background:"rgba(12,12,18,0.8)",
                  border:"1px solid rgba(255,255,255,0.07)",borderRadius:8,outline:"none",
                  transition:"border-color 0.2s"
                }}
                onFocus={e=>e.target.style.borderColor="rgba(212,35,43,0.5)"}
                onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.07)"}
              />
            </div>
          </div>

          <div style={{marginBottom:24}}>
            <label style={{fontFamily:font,fontSize:9,color:"#5a6070",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6,display:"block"}}>Senha</label>
            <div style={{position:"relative"}}>
              <Lock size={14} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#5a6070"}}/>
              <input
                type={showPass?"text":"password"}
                value={pass} onChange={e=>setPass(e.target.value)}
                placeholder="Digite sua senha"
                style={{
                  width:"100%",padding:"10px 40px 10px 36px",fontFamily:font,fontSize:13,
                  color:"#f0eee9",background:"rgba(12,12,18,0.8)",
                  border:"1px solid rgba(255,255,255,0.07)",borderRadius:8,outline:"none",
                  transition:"border-color 0.2s"
                }}
                onFocus={e=>e.target.style.borderColor="rgba(212,35,43,0.5)"}
                onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.07)"}
              />
              <button type="button" onClick={()=>setShowPass(s=>!s)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",padding:2}}>
                <Eye size={14} color="#5a6070"/>
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              padding:"8px 12px",marginBottom:16,borderRadius:6,
              background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.25)",
              fontFamily:font,fontSize:11,color:"#ef4444",textAlign:"center"
            }}>{error}</div>
          )}

          <button type="submit" style={{
            width:"100%",padding:"12px",borderRadius:8,border:"none",cursor:"pointer",
            background:"linear-gradient(135deg, #d4232b, #a01a20)",
            fontFamily:fontD,fontSize:14,fontWeight:700,color:"#fff",
            textTransform:"uppercase",letterSpacing:"0.08em",
            transition:"opacity 0.2s",boxShadow:"0 4px 16px rgba(212,35,43,0.3)"
          }}
          onMouseEnter={e=>e.currentTarget.style.opacity="0.9"}
          onMouseLeave={e=>e.currentTarget.style.opacity="1"}
          >Entrar</button>
        </form>

        <div style={{fontFamily:font,fontSize:8,color:"#5a6070",textAlign:"center",marginTop:20}}>Acesso restrito · Dept. Análise de Desempenho</div>
      </div>
    </div>
  );
}
