// Epic Games Recovery Assistant 3.0 - C++17
// Local-only organizer. Not affiliated with Epic Games.
#include <cctype>
#include <cstdlib>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#ifdef _WIN32
#include <windows.h>
#include <shellapi.h>
#endif
namespace fs = std::filesystem;
struct Field { std::string label, value; };
std::vector<Field> fields;
std::string ask(const std::string& q) { std::cout << q << "\n> "; std::string s; std::getline(std::cin,s); return s; }
void add(const std::string& q) { fields.push_back({q,ask(q)}); }
std::string escJson(const std::string& s) { std::string o; for(unsigned char c:s){ if(c=='"')o+="\\\""; else if(c=='\\')o+="\\\\"; else if(c=='\n')o+="\\n"; else if(c=='\r')o+="\\r"; else if(c=='\t')o+="\\t"; else if(c>=32)o+=(char)c;} return o; }
std::string escPdf(const std::string& s) { std::string o; for(unsigned char c:s){ if(c=='('||c==')'||c=='\\')o+='\\'; if(c>=32&&c<=126)o+=(char)c; else if(c=='\t')o+=' '; else if(c>=128)o+='?'; } return o; }
std::string safe(std::string s){ for(char& c:s) if(!std::isalnum((unsigned char)c)&&c!='_'&&c!='-')c='_'; return s.empty()?"Recovery_Packet":s; }
void save(const fs::path& p,const std::string& s){std::ofstream f(p,std::ios::binary);f<<s;}
bool pdf(const fs::path& path,const std::vector<std::string>& lines){
 std::vector<std::vector<std::string>> pages(1);
 for(const auto& line:lines){
  std::string rest=line.empty()?" ":line;
  while(!rest.empty()){
   std::string part=rest.substr(0,88);rest.erase(0,part.size());
   if(pages.back().size()>=52)pages.emplace_back();
   pages.back().push_back(part);
  }
 }
 std::vector<std::string> objects;
 objects.push_back("<< /Type /Catalog /Pages 2 0 R >>");
 std::ostringstream kids;kids<<"<< /Type /Pages /Kids [";
 for(size_t i=0;i<pages.size();++i)kids<<(4+i*2)<<" 0 R ";
 kids<<"] /Count "<<pages.size()<<" >>";objects.push_back(kids.str());
 objects.push_back("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
 for(size_t i=0;i<pages.size();++i){
  size_t pageId=4+i*2, contentId=pageId+1;
  std::ostringstream page;page<<"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 3 0 R >> >> /Contents "<<contentId<<" 0 R >>";
  objects.push_back(page.str());
  std::ostringstream stream;stream<<"BT\n/F1 9 Tf\n45 795 Td\n";
  for(const auto& line:pages[i])stream<<"("<<escPdf(line)<<") Tj\n0 -14 Td\n";
  stream<<"ET";std::string body=stream.str();
  objects.push_back("<< /Length "+std::to_string(body.size())+" >>\nstream\n"+body+"\nendstream");
 }
 std::ofstream f(path,std::ios::binary);if(!f)return false;f<<"%PDF-1.4\n";
 std::vector<long> off(1,0);
 for(size_t i=0;i<objects.size();++i){off.push_back((long)f.tellp());f<<i+1<<" 0 obj\n"<<objects[i]<<"\nendobj\n";}
 long x=(long)f.tellp();f<<"xref\n0 "<<off.size()<<"\n0000000000 65535 f \n";
 for(size_t i=1;i<off.size();++i){std::ostringstream z;z.width(10);z.fill('0');z<<off[i];f<<z.str()<<" 00000 n \n";}
 f<<"trailer\n<< /Size "<<off.size()<<" /Root 1 0 R >>\nstartxref\n"<<x<<"\n%%EOF\n";return(bool)f;
}
void openLink(const char* url){
#ifdef _WIN32
 ShellExecuteA(nullptr,"open",url,nullptr,nullptr,SW_SHOWNORMAL);
#else
 std::cout<<"Open in browser: "<<url<<"\n";
#endif
}
int main(){
 std::cout<<"EPIC GAMES RECOVERY ASSISTANT 3.0 (C++17)\n"
 <<"Local organizer only; not an official Epic tool.\n"
 <<"Never enter passwords, account PINs, CVV, full card numbers, 2FA codes,\n"
 <<"backup codes, authenticator secrets, session cookies, or access tokens.\n"
 <<"IP/VPN history is optional context, never proof of ownership. No spoofing.\n\n";
 add("Your first and last name (as used on purchases)");
 add("Epic display name (current)"); add("Previous Epic display names");
 add("Current Epic email (never enter password)"); add("Previous Epic emails");
 add("Desired display name (planning only)"); add("Desired email (planning only)");
 add("Epic Account ID"); add("Country/region"); add("Approximate account creation date");
 add("Support-A-Creator code (if applicable)"); add("Purchase invoice/order ID");
 add("Name on a past purchase"); add("Billing street address (optional)");
 add("Billing city"); add("Billing state/region"); add("Billing ZIP/postal code");
 add("Payment provider"); add("Card last four digits ONLY (optional)");
 add("Remembered historical public IP (optional; do not guess)");
 add("Approximate date/period IP was used");
 add("VPN/proxy provider and region used (history only; no spoofing)");
 add("VPN/proxy active during recovery attempts? (yes/no/unsure)");
 add("2FA method: Epic Authenticator / authenticator app / email / SMS-phone");
 add("Can you access that 2FA method now? (yes/no/unsure)");
 add("Phone number associated with SMS 2FA (optional; never enter SMS codes)");
 add("Linked services to review (Xbox, PlayStation, Steam, Nintendo, Apple, Google, LEGO, GeForce NOW, Disney, Twitch, YouTube, TikTok, Facebook, other)");
 add("Public linked profile names/IDs only (no login credentials)");
 add("Requested action: recovery / 2FA help / name change / email change / unlink / restriction appeal / other");
 add("Restriction platform: Epic / Xbox / PlayStation / Steam / Nintendo / other");
 add("Restriction notice, reason, date, or case number");
 add("Exact error message and date"); add("Prior support ticket/reference number");
 add("Other truthful, non-secret ownership evidence");
 std::cout<<"\nEvidence readiness (self-assessment only; this program cannot verify ownership):\n1. Have requested evidence\n2. Unsure\n3. Do not have requested evidence\n";
 fields.push_back({"Evidence readiness",ask("Choose 1, 2, or 3")});
 std::string request=ask("Describe the support request (do not include secrets)");
 fields.push_back({"Support request summary",request});
 fs::path dir=fs::current_path()/safe("Epic_Recovery_"+(fields.empty()?std::string("Packet"):fields[0].value));
 std::error_code ec;fs::create_directories(dir,ec);if(ec){std::cerr<<ec.message()<<"\n";return 1;}
 std::ostringstream txt,j,draft;std::vector<std::string> lines={
 "EPIC GAMES RECOVERY ASSISTANT - LOCAL PACKET","Version 3.0 | Not an official Epic form",
 "This app cannot verify ownership, change accounts, unlink services, or remove restrictions.",
 "IP and VPN/proxy history are optional context, not proof of ownership.",
 "Never provide passwords, account PINs, full card numbers, CVV, 2FA codes, or backup codes.",
 "Use official platform forms and share only information they request.",""};
 txt<<"EPIC GAMES RECOVERY ASSISTANT - LOCAL PACKET\nVersion 3.0\n\n";
 j<<"{\n \"version\":\"3.0\",\n \"notice\":\"Local organizer only; no sign-in or account verification.\",\n \"fields\":[\n";
 for(size_t i=0;i<fields.size();++i){txt<<fields[i].label<<": "<<fields[i].value<<"\n";lines.push_back(fields[i].label+": "+fields[i].value);
 j<<"  {\"label\":\""<<escJson(fields[i].label)<<"\",\"value\":\""<<escJson(fields[i].value)<<"\"}"<<(i+1==fields.size()?"\n":",\n");}
 j<<" ]\n}\n";
 draft<<"Subject: Request for account recovery / support\n\nHello Support Team,\n\nI am requesting assistance with my account. I can provide truthful, non-secret information through your official secure process and additional evidence if requested.\n\nRequest: "<<request<<"\n\nPlease advise which official verification steps and documents are required. I understand that only your team can verify ownership, review restrictions, or approve account changes.\n\nThank you.\n";
 save(dir/"recovery_details.txt",txt.str());save(dir/"recovery_details.json",j.str());save(dir/"support_request_draft.txt",draft.str());
 if(!pdf(dir/"recovery_request.pdf",lines))std::cerr<<"PDF export failed; other exports attempted.\n";
 std::cout<<"\nSaved packet to: "<<dir.string()<<"\nIncludes PDF, JSON, text details, and support-request draft.\n"
 <<"No account action was taken. If evidence is missing, pause and ask official support about alternatives.\n\n"
 <<"1 Open Epic recovery page\n2 Open Epic support/contact\n3 Open linked-account settings\n4 Open 2FA/security settings\n0 Exit\n";
 std::string choice=ask("Choose an official page");
 if(choice=="1")openLink("https://www.epicgames.com/help/c-1/a10856556?lang=en-US");
 else if(choice=="2")openLink("https://www.epicgames.com/help/c-45487929?contact=1&lang=en-US");
 else if(choice=="3")openLink("https://www.epicgames.com/account/connections");
 else if(choice=="4")openLink("https://www.epicgames.com/account/password");
 return 0;
}