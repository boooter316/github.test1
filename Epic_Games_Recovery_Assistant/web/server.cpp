// Minimal C++17 static web server. Run behind HTTPS ingress/reverse proxy.
#include <arpa/inet.h>
#include <cstdlib>
#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
#include <sys/socket.h>
#include <unistd.h>
static std::string readFile(const std::string& p){std::ifstream f(p,std::ios::binary);if(!f)return{};std::ostringstream s;s<<f.rdbuf();return s.str();}
static void reply(int fd,int code,const std::string& status,const std::string& type,const std::string& body){
 std::ostringstream h;h<<"HTTP/1.1 "<<code<<" "<<status<<"\r\nContent-Type: "<<type<<"\r\nContent-Length: "<<body.size()
 <<"\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nReferrer-Policy: no-referrer"
 <<"\r\nContent-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"
 <<"\r\nX-Frame-Options: DENY\r\nConnection: close\r\n\r\n"<<body;
 auto s=h.str();(void)send(fd,s.data(),s.size(),0);
}
int main(){
 int port=8080;if(const char*p=std::getenv("PORT")){try{port=std::stoi(p);}catch(...){std::cerr<<"Invalid PORT\n";return 1;}}
 const auto page=readFile("/app/index.html");if(page.empty()){std::cerr<<"Cannot read /app/index.html\n";return 1;}
 int srv=socket(AF_INET,SOCK_STREAM,0);if(srv<0){perror("socket");return 1;}int yes=1;setsockopt(srv,SOL_SOCKET,SO_REUSEADDR,&yes,sizeof(yes));
 sockaddr_in a{};a.sin_family=AF_INET;a.sin_addr.s_addr=INADDR_ANY;a.sin_port=htons(static_cast<unsigned short>(port));
 if(bind(srv,reinterpret_cast<sockaddr*>(&a),sizeof(a))<0||listen(srv,32)<0){perror("bind/listen");close(srv);return 1;}
 std::cout<<"Listening on port "<<port<<"\n";
 for(;;){int c=accept(srv,nullptr,nullptr);if(c<0)continue;char b[4096]{};auto n=recv(c,b,sizeof(b)-1,0);
  if(n<=0){close(c);continue;}std::istringstream req(std::string(b,static_cast<size_t>(n)));std::string method,path,ver;req>>method>>path>>ver;
  if(method!="GET")reply(c,405,"Method Not Allowed","text/plain; charset=utf-8","GET only. Form data is not sent to this server.\n");
  else if(path=="/healthz")reply(c,200,"OK","text/plain; charset=utf-8","ok\n");
  else if(path=="/"||path=="/index.html")reply(c,200,"OK","text/html; charset=utf-8",page);
  else reply(c,404,"Not Found","text/plain; charset=utf-8","Not found\n");
  close(c);
 }close(srv);return 0;
}