const socket = io();
const $ = id => document.getElementById(id);
let me = localStorage.getItem("nexachat_name") || "";
let typingTimer;

function initials(name){return (name||"N").trim().slice(0,1).toUpperCase()}
function showLogin(){ $("login").style.display = me ? "none" : "grid"; if(me) start(); }
function start(){
  $("myName").textContent=me; $("myAvatar").textContent=initials(me);
  socket.emit("join",{name:me});
}
$("enter").onclick=()=>{const n=$("name").value.trim(); if(!n)return; me=n.slice(0,30); localStorage.setItem("nexachat_name",me); $("login").style.display="none"; start()};
$("theme").onclick=()=>document.body.classList.toggle("dark");

function addMessage(m){
  const el=document.createElement("div");
  el.className="msg "+(m.name===me?"mine":"");
  const time=new Date(m.time).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
  el.innerHTML=`<div class="bubble">${escapeHtml(m.text)}</div><div class="meta">${m.name===me?"You":escapeHtml(m.name)} · ${time}</div>`;
  $("messages").appendChild(el); $("messages").scrollTop=$("messages").scrollHeight;
  $("preview").textContent=m.text;
}
function escapeHtml(s){const d=document.createElement("div");d.textContent=s;return d.innerHTML}

socket.on("history", list=>{ $("messages").innerHTML=""; list.forEach(addMessage) });
socket.on("message", addMessage);
socket.on("presence", list=>{
  $("count").textContent=list.length;
  $("online").textContent=list.length+" online";
  $("people").innerHTML=list.filter(x=>x!==me).map(x=>`<div class="person"><div class="avatar">${initials(x)}</div><div><b>${escapeHtml(x)}</b><small>online</small></div></div>`).join("");
});
socket.on("typing", x=>{ $("typing").textContent=x.active ? x.name+" is typing…" : "" });

$("composer").onsubmit=e=>{e.preventDefault();const v=$("message").value.trim();if(!v)return;socket.emit("message",v);$("message").value="";socket.emit("typing",false)};
$("message").oninput=()=>{socket.emit("typing",true);clearTimeout(typingTimer);typingTimer=setTimeout(()=>socket.emit("typing",false),700)};
showLogin();