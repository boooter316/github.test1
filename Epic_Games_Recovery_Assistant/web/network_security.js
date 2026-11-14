(()=>{"use strict";
const $=id=>document.getElementById(id);
let latestReport="";
const lines=[];
const add=(s="")=>lines.push(String(s));
const safeName=s=>String(s||"unnamed").replace(/[\r\n]/g," ").slice(0,120);
function show(){latestReport=lines.join("\n");$("networkSecurityResult").textContent=latestReport;$("downloadNetworkReport").disabled=!latestReport;$("printNetworkReport").disabled=!latestReport}
function reset(){lines.length=0}
function fmtEndpoint(ip,port){return (ip||"?")+":"+(port??"?")}
function parseSnapshotText(text){
 const objects=[];
 for(const raw of text.split(/\r?\n/)){const t=raw.trim();if(!t)continue;try{const x=JSON.parse(t);if(x&&typeof x==="object")objects.push(x)}catch{}}
 if(!objects.length){try{const x=JSON.parse(text);if(Array.isArray(x))objects.push(...x);else if(x&&typeof x==="object")objects.push(x)}catch{}}
 return objects;
}
$("analyzeNetworkSnapshot").addEventListener("click",async()=>{
 reset();const files=[...$("networkSnapshotFiles").files];if(!files.length){add("Choose one or more JSON/JSONL snapshot files first.");show();return}
 let total=0,all=[];
 for(const f of files){if(f.size>10*1024*1024){add("Skipped "+safeName(f.name)+": over 10 MB.");continue}total+=f.size;if(total>30*1024*1024){add("Stopped: combined snapshot input exceeds 30 MB.");break}
 const parsed=parseSnapshotText(await f.text());add("Source: "+safeName(f.name)+" — "+parsed.length+" snapshot record(s).");all.push(...parsed)}
 if(!all.length){add("No readable snapshot records found. Run the PowerShell helper and import its JSON/JSONL output.");show();return}
 const latest=all[all.length-1];const tcp=Array.isArray(latest.TcpConnections)?latest.TcpConnections:[];const udp=Array.isArray(latest.UdpEndpoints)?latest.UdpEndpoints:[];const adapters=Array.isArray(latest.AdapterStatistics)?latest.AdapterStatistics:[];const configs=Array.isArray(latest.Interfaces)?latest.Interfaces:[];
 add("");add("LATEST SNAPSHOT");add("Timestamp: "+(latest.TimestampUtc||latest.Timestamp||"not supplied"));add("Snapshots parsed: "+all.length);add("TCP connections: "+tcp.length);add("UDP endpoints: "+udp.length);add("Network interfaces: "+configs.length);add("Adapter counter records: "+adapters.length);
 add("");add("INTERFACES");configs.slice(0,30).forEach(x=>add("- "+(x.InterfaceAlias||x.Name||"interface")+" | IPv4: "+(Array.isArray(x.IPv4Address)?x.IPv4Address.map(a=>a.IPAddress||a).join(", "):"") +" | IPv6: "+(Array.isArray(x.IPv6Address)?x.IPv6Address.map(a=>a.IPAddress||a).join(", "):"")));
 add("");add("TCP CONNECTIONS (latest snapshot; first 100)");tcp.slice(0,100).forEach(x=>add("- "+fmtEndpoint(x.LocalAddress,x.LocalPort)+" → "+fmtEndpoint(x.RemoteAddress,x.RemotePort)+" | "+(x.State||"state unavailable")));
 add("");add("UDP ENDPOINTS (latest snapshot; first 100)");udp.slice(0,100).forEach(x=>add("- "+fmtEndpoint(x.LocalAddress,x.LocalPort)));
 add("");add("ADAPTER COUNTERS");adapters.slice(0,30).forEach(x=>add("- "+(x.Name||x.InterfaceAlias||"adapter")+" | received bytes: "+(x.ReceivedBytes??"n/a")+" | sent bytes: "+(x.SentBytes??"n/a")+" | received packets: "+(x.ReceivedUnicastPackets??"n/a")+" | sent packets: "+(x.SentUnicastPackets??"n/a")));
 add("");add("LIMITATION: This is a snapshot of Windows connection metadata, not packet payload capture, user identity attribution, or proof of malicious activity. The helper does not collect passwords, cookies, tokens, or message contents.");show();
});
function read16(v,o,le){return v.getUint16(o,le)}function read32(v,o,le){return v.getUint32(o,le)}
function ip4(b,o){return [...b.slice(o,o+4)].join(".")}
function ip6(b,o){const a=[];for(let i=0;i<16;i+=2)a.push(((b[o+i]<<8)|b[o+i+1]).toString(16));return a.join(":")}
function dnsName(b,start,end){let p=start,out=[],guard=0;while(p<end&&guard++<128){const n=b[p++];if(n===0)break;if((n&192)===192){if(p>=end)break;const q=((n&63)<<8)|b[p++];if(q>=end)break;let sub=dnsName(b,q,end);out.push(sub);break}if(n>63||p+n>end)break;out.push(new TextDecoder().decode(b.slice(p,p+n)));p+=n}return out.join(".")}
function tlsClientHelloSni(payload){try{if(payload.length<9||payload[0]!==22||payload[5]!==1)return "";let p=9;p+=2+32;const sid=payload[p++];p+=sid;const cs=(payload[p]<<8)|payload[p+1];p+=2+cs;const cm=payload[p++];p+=cm;const extLen=(payload[p]<<8)|payload[p+1];p+=2;const stop=Math.min(payload.length,p+extLen);while(p+4<=stop){const typ=(payload[p]<<8)|payload[p+1],len=(payload[p+2]<<8)|payload[p+3];p+=4;if(p+len>stop)break;if(typ===0&&len>=5){let q=p+2;const nameType=payload[q++],n=(payload[q]<<8)|payload[q+1];q+=2;if(nameType===0&&q+n<=p+len)return new TextDecoder().decode(payload.slice(q,q+n))}p+=len}}catch{}return ""}
function parseFrame(b,link,stats){
 let o=0,et=0;if(link===1){if(b.length<14)return;et=(b[12]<<8)|b[13];o=14;while(et===0x8100||et===0x88a8){if(b.length<o+4)return;et=(b[o+2]<<8)|b[o+3];o+=4}}
 else if(link===113){if(b.length<16)return;et=(b[14]<<8)|b[15];o=16}
 else if(link===101){if(!b.length)return;et=(b[0]>>4)===4?0x0800:(b[0]>>4)===6?0x86dd:0}
 else return;
 let src="",dst="",proto="",l4=0,payload=0;
 if(et===0x0800){if(b.length<o+20)return;const ihl=(b[o]&15)*4;if(ihl<20||b.length<o+ihl)return;src=ip4(b,o+12);dst=ip4(b,o+16);l4=b[o+9];payload=o+ihl;proto="IPv4"}
 else if(et===0x86dd){if(b.length<o+40)return;src=ip6(b,o+8);dst=ip6(b,o+24);l4=b[o+6];payload=o+40;proto="IPv6";if([0,43,60].includes(l4)&&b.length>=payload+2){const ext=(b[payload+1]+1)*8;l4=b[payload];payload+=ext}}
 else return;
 stats.ipPackets++;stats.protocols[proto]=(stats.protocols[proto]||0)+1;
 let sport=null,dport=null,appPayload=null;
 if(l4===6&&b.length>=payload+20){sport=(b[payload]<<8)|b[payload+1];dport=(b[payload+2]<<8)|b[payload+3];const h=((b[payload+12]>>4)&15)*4;if(h>=20&&b.length>=payload+h)appPayload=b.slice(payload+h);stats.protocols.TCP=(stats.protocols.TCP||0)+1}
 else if(l4===17&&b.length>=payload+8){sport=(b[payload]<<8)|b[payload+1];dport=(b[payload+2]<<8)|b[payload+3];appPayload=b.slice(payload+8);stats.protocols.UDP=(stats.protocols.UDP||0)+1}
 else if(l4===1||l4===58){stats.protocols.ICMP=(stats.protocols.ICMP||0)+1}
 if(sport!==null){const key=proto+" "+src+":"+sport+" → "+dst+":"+dport;stats.endpoints.set(key,(stats.endpoints.get(key)||0)+1)}
 if(appPayload&&((sport===53||dport===53)&&l4===17)&&appPayload.length>=12){const qd=(appPayload[4]<<8)|appPayload[5];let q=12;for(let i=0;i<Math.min(qd,5)&&q<appPayload.length;i++){const name=dnsName(appPayload,q,appPayload.length);let p=q,guard=0;while(p<appPayload.length&&guard++<128){const n=appPayload[p++];if(n===0)break;if((n&192)===192){p++;break}if(n>63||p+n>appPayload.length)break;p+=n}q=p+4;if(name)stats.dns.add(name)}}
 if(appPayload&&l4===6&&appPayload.length>=6&&appPayload[0]===22){stats.tlsRecords++;const sni=tlsClientHelloSni(appPayload);if(sni)stats.sni.add(sni)}
}
function parseClassicPcap(buf,stats){const v=new DataView(buf),b=new Uint8Array(buf);if(b.length<24)throw Error("PCAP header is incomplete.");const magic=[...b.slice(0,4)].map(x=>x.toString(16).padStart(2,"0")).join("");let le,scale;if(magic==="a1b2c3d4"){le=false;scale=1}else if(magic==="d4c3b2a1"){le=true;scale=1}else if(magic==="a1b23c4d"){le=false;scale=0.001}else if(magic==="4d3cb2a1"){le=true;scale=0.001}else throw Error("Unrecognized classic PCAP byte order.");const link=read32(v,20,le);let p=24;while(p+16<=b.length&&stats.packetCount<250000){const cap=read32(v,p+8,le);p+=16;if(cap>b.length-p)break;parseFrame(b.slice(p,p+cap),link,stats);stats.packetCount++;p+=cap}return}
function parsePcapNg(buf,stats){const b=new Uint8Array(buf),v=new DataView(buf);let p=0,le=true,links=[];while(p+12<=b.length&&stats.packetCount<250000){const typeBytes=[...b.slice(p,p+4)];const isSHB=typeBytes.join(",")==="10,13,13,10";if(isSHB){const bom=[...b.slice(p+8,p+12)].join(",");le=bom==="77,60,43,26";if(!le&&bom!=="26,43,60,77")throw Error("Unsupported PCAPNG byte order.");links=[]}const type=read32(v,p,le),len=read32(v,p+4,le);if(len<12||p+len>b.length)break;if(isSHB){p+=len;continue}if(type===1&&len>=20){links.push(read16(v,p+8,le))}else if(type===6&&len>=32){const iface=read32(v,p+8,le),cap=read32(v,p+20,le),link=links[iface]??1;const start=p+28;if(cap<=len-32&&start+cap<=p+len-4){parseFrame(b.slice(start,start+cap),link,stats);stats.packetCount++}}p+=len}return}
$("analyzeNetworkCapture").addEventListener("click",async()=>{
 reset();const files=[...$("networkCaptureFiles").files];if(!files.length){add("Choose an authorized PCAP or PCAPNG file first.");show();return}
 let total=0;
 for(const f of files){if(f.size>50*1024*1024){add("Skipped "+safeName(f.name)+": exceeds 50 MB.");continue}total+=f.size;if(total>100*1024*1024){add("Stopped: combined capture files exceed 100 MB.");break}
 try{const buf=await f.arrayBuffer(),b=new Uint8Array(buf),stats={packetCount:0,ipPackets:0,tlsRecords:0,protocols:{},endpoints:new Map(),dns:new Set(),sni:new Set()};if(b.length>=4&&b[0]===10&&b[1]===13&&b[2]===13&&b[3]===10)parsePcapNg(buf,stats);else parseClassicPcap(buf,stats);
 add("CAPTURE: "+safeName(f.name));add("Packets parsed: "+stats.packetCount+" (limit 250,000 per file)");add("IP packets: "+stats.ipPackets);add("TLS record/handshake candidates: "+stats.tlsRecords);add("Protocol counts: "+Object.entries(stats.protocols).map(([k,v])=>k+"="+v).join(", "));
 add("Top endpoint pairs:");[...stats.endpoints.entries()].sort((a,b)=>b[1]-a[1]).slice(0,40).forEach(([k,v])=>add("- "+k+" | packets: "+v));
 add("DNS query names: "+(stats.dns.size?[...stats.dns].slice(0,50).join(", "):"none detected"));
 add("TLS ClientHello server names: "+(stats.sni.size?[...stats.sni].slice(0,50).join(", "):"none detected"));add("Note: encrypted payload contents are not displayed or analyzed.");
 }catch(e){add("Could not analyze "+safeName(f.name)+": "+(e.message||"unsupported or malformed capture"))}}
 if(!lines.length)add("No capture files were analyzed.");show();
});
const secretPatterns=[
 ["Password-like field",/\b(?:password|passwd|pwd|passphrase)\s*[:=]\s*[^\s,;]+/gi],
 ["Authorization/token field",/\b(?:authorization|access[_-]?token|refresh[_-]?token|id[_-]?token|bearer)\s*[:= ]\s*(?:bearer\s+)?[^\s,;]+/gi],
 ["Cookie/session field",/\b(?:cookie|set-cookie|session[_-]?(?:id|token)?|csrf|xsrf)\s*[:=]\s*[^\r\n,;]+/gi],
 ["API/client secret field",/\b(?:api[_-]?key|client[_-]?secret|secret[_-]?key)\s*[:=]\s*[^\s,;]+/gi]
];
$("scanNetworkLeak").addEventListener("click",async()=>{
 reset();let texts=[];const files=[...$("networkLeakFiles").files];let total=0;
 for(const f of files){if(f.size>5*1024*1024){add("Skipped "+safeName(f.name)+": exceeds 5 MB.");continue}total+=f.size;if(total>20*1024*1024){add("Stopped: combined text input exceeds 20 MB.");break}texts.push({name:f.name,text:await f.text()})}
 const pasted=$("networkLeakText").value;if(pasted)texts.push({name:"pasted text",text:pasted});
 if(!texts.length){add("Choose a text export or paste authorized log text first.");show();return}
 const counts=secretPatterns.map(([label,re])=>({label,count:0}));
 for(const source of texts){for(let i=0;i<secretPatterns.length;i++){const re=secretPatterns[i][1];re.lastIndex=0;let m;while((m=re.exec(source.text))!==null){counts[i].count++;if(!m[0].length)re.lastIndex++}}}
 add("REDACTED CREDENTIAL-EXPOSURE INDICATOR");add("Sources checked: "+texts.length);counts.forEach(x=>add("- "+x.label+": "+x.count+" pattern(s)"));add("");add("Matched values were not displayed, copied into the report, or transmitted. Pattern matches can be false positives and do not prove a credential is valid or was intercepted.");show();
});
$("clearNetworkSecurity").addEventListener("click",()=>{$("networkSnapshotFiles").value="";$("networkCaptureFiles").value="";$("networkLeakFiles").value="";$("networkLeakText").value="";reset();add("Cleared. No analysis results.");show()});
$("downloadNetworkReport").addEventListener("click",()=>{if(!latestReport)return;const blob=new Blob([latestReport],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="network-security-report.txt";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)});
$("printNetworkReport").addEventListener("click",()=>{if(!latestReport)return;const w=window.open("","_blank");if(!w){alert("Allow pop-ups to print or save the report as PDF.");return}const esc=latestReport.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");w.document.write("<!doctype html><html><head><meta charset='utf-8'><title>Network Security Report</title><style>body{font:14px system-ui;margin:32px;color:#18212f}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style></head><body><h1>Network Security Report</h1><pre>"+esc+"</pre><script>window.onload=()=>window.print()<\/script></body></html>");w.document.close()});
})();