import { useState } from "react";
import { auth } from "./supabase.js";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async(e) => {
    e.preventDefault();
    if(!email.trim()) return;
    setLoading(true); setError("");
    try {
      const { error: err } = await auth.signInWithOtp(email.trim().toLowerCase());
      if(err) throw err;
      setSent(true);
    } catch(err) {
      setError(err.message||"Error al enviar el link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:"100vh",background:"#0f1117",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Geist',system-ui,sans-serif"}}>
      <div style={{width:"100%",maxWidth:380}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:52,height:52,background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",borderRadius:14,display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:12}}>
            <svg width="24" height="24" viewBox="0 0 16 16" fill="white"><rect x="1" y="1" width="6" height="6" rx="1.2"/><rect x="9" y="1" width="6" height="6" rx="1.2"/><rect x="1" y="9" width="6" height="6" rx="1.2"/><rect x="9" y="9" width="6" height="6" rx="1.2"/></svg>
          </div>
          <div style={{fontSize:22,fontWeight:700,color:"#fff",letterSpacing:"-.3px"}}>Boreal</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,.4)",marginTop:4}}>Gestión Comercial</div>
        </div>

        {/* Card */}
        <div style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:16,padding:28}}>
          {!sent ? (
            <>
              <div style={{fontSize:16,fontWeight:600,color:"#fff",marginBottom:6}}>Iniciar sesión</div>
              <div style={{fontSize:13,color:"rgba(255,255,255,.45)",marginBottom:20}}>Te enviaremos un link a tu email para entrar</div>
              <form onSubmit={handleLogin}>
                <div style={{marginBottom:14}}>
                  <label style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,.5)",display:"block",marginBottom:6,letterSpacing:".06em"}}>EMAIL</label>
                  <input
                    type="email" required autoFocus
                    value={email} onChange={e=>setEmail(e.target.value)}
                    placeholder="tu@empresa.cl"
                    style={{width:"100%",padding:"10px 14px",borderRadius:9,border:"1px solid rgba(255,255,255,.15)",
                      background:"rgba(255,255,255,.07)",color:"#fff",fontSize:14,outline:"none",
                      boxSizing:"border-box",fontFamily:"inherit",
                      "::placeholder":{color:"rgba(255,255,255,.3)"}}}
                  />
                </div>
                {error&&<div style={{fontSize:12,color:"#f87171",marginBottom:12,padding:"8px 12px",background:"rgba(239,68,68,.1)",borderRadius:7}}>{error}</div>}
                <button type="submit" disabled={loading}
                  style={{width:"100%",padding:"11px",borderRadius:9,border:"none",
                    background:loading?"#374151":"#1d4ed8",color:"#fff",fontSize:14,fontWeight:600,
                    cursor:loading?"wait":"pointer",fontFamily:"inherit",transition:"background .15s"}}>
                  {loading?"Enviando…":"Enviar link de acceso"}
                </button>
              </form>
            </>
          ) : (
            <div style={{textAlign:"center",padding:"8px 0"}}>
              <div style={{fontSize:28,marginBottom:12}}>📧</div>
              <div style={{fontSize:16,fontWeight:600,color:"#fff",marginBottom:8}}>Revisa tu email</div>
              <div style={{fontSize:13,color:"rgba(255,255,255,.45)",lineHeight:1.6,marginBottom:20}}>
                Enviamos un link de acceso a<br/>
                <strong style={{color:"rgba(255,255,255,.7)"}}>{email}</strong>
              </div>
              <div style={{fontSize:11,color:"rgba(255,255,255,.3)"}}>El link expira en 1 hora</div>
              <button onClick={()=>{setSent(false);setEmail("");}}
                style={{marginTop:16,fontSize:12,color:"rgba(255,255,255,.4)",background:"none",border:"none",cursor:"pointer",textDecoration:"underline",fontFamily:"inherit"}}>
                Usar otro email
              </button>
            </div>
          )}
        </div>

        <div style={{textAlign:"center",marginTop:20,fontSize:11,color:"rgba(255,255,255,.2)"}}>
          ¿No tienes acceso? Contacta al administrador
        </div>
      </div>
    </div>
  );
}
