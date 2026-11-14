// Epic Games Recovery Assistant 4.5 - C++17
// Local-only organizer. Not affiliated with Epic Games.
#include <cctype>
#include <ctime>
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
#include <winhttp.h>
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


void notifyDiscord(const std::string& event) {
#ifdef _WIN32
 const char* raw=std::getenv("EPIC_RECOVERY_DISCORD_WEBHOOK");
 if(!raw || !*raw) return;
 std::wstring url; for(const unsigned char* p=(const unsigned char*)raw; *p; ++p) url.push_back((wchar_t)*p);
 URL_COMPONENTS parts{}; parts.dwStructSize=sizeof(parts);
 wchar_t host[256]{}, path[2048]{};
 parts.lpszHostName=host; parts.dwHostNameLength=256;
 parts.lpszUrlPath=path; parts.dwUrlPathLength=2048;
 if(!WinHttpCrackUrl(url.c_str(),0,0,&parts)) return;
 std::wstring hostname(host,parts.dwHostNameLength), requestPath(path,parts.dwUrlPathLength);
 if(parts.nScheme!=INTERNET_SCHEME_HTTPS || hostname!=L"discord.com" || requestPath.rfind(L"/api/webhooks/",0)!=0) return;
 std::string body="{\"content\":\"Epic Games Recovery Assistant: "+escJson(event)+"\"}";
 HINTERNET session=WinHttpOpen(L"EpicRecoveryAssistant/4.5",WINHTTP_ACCESS_TYPE_DEFAULT_PROXY,WINHTTP_NO_PROXY_NAME,WINHTTP_NO_PROXY_BYPASS,0);
 if(!session) return;
 HINTERNET connection=WinHttpConnect(session,hostname.c_str(),parts.nPort,0);
 if(connection){
  HINTERNET request=WinHttpOpenRequest(connection,L"POST",requestPath.c_str(),nullptr,WINHTTP_NO_REFERER,WINHTTP_DEFAULT_ACCEPT_TYPES,WINHTTP_FLAG_SECURE);
  if(request){
   const wchar_t* headers=L"Content-Type: application/json\r\n";
   if(WinHttpSendRequest(request,headers,(DWORD)-1,(LPVOID)body.data(),(DWORD)body.size(),(DWORD)body.size(),0)) WinHttpReceiveResponse(request,nullptr);
   WinHttpCloseHandle(request);
  }
  WinHttpCloseHandle(connection);
 }
 WinHttpCloseHandle(session);
#else
 (void)event;
#endif
}

std::string csv(const std::string& s) {
 std::string out="\"";
 for(char c:s){ if(c=='\"') out+="\"\""; else if(c=='\r'||c=='\n') out+=' '; else out+=c; }
 return out+"\"";
}
void logHistoricalIPs(const fs::path& dir,const std::string& accountId) {
 std::cout<<"\nOPTIONAL HISTORICAL IP LOG\n"
  <<"Enter only IP addresses from your own records. This log does NOT test whether an IP belongs to an Epic account.\n";
 std::string choice=ask("Add a historical IP record? (y/n)");
 fs::path logPath=dir/"ip_history_log.csv";
 bool newFile=!fs::exists(logPath);
 std::ofstream log(logPath,std::ios::app);
 if(!log){std::cerr<<"Could not open IP history log.\n";notifyDiscord("general application error");return;}
 if(newFile) log<<"logged_at_local,epic_account_id,ip_address,ip_used_date,source,verification_status\n";
 while(choice=="y"||choice=="Y"||choice=="yes"||choice=="YES"){
  std::string ip=ask("Historical IP address (manual entry only; do not guess)");
  std::string date=ask("Approximate date/period this IP was used");
  std::string source=ask("Source of this record (for example, your router records or old email)");
  std::time_t now=std::time(nullptr); std::tm* local=std::localtime(&now);
  char stamp[32]="unknown";
  if(local) std::strftime(stamp,sizeof(stamp),"%Y-%m-%d %H:%M:%S",local);
  log<<csv(stamp)<<","<<csv(accountId)<<","<<csv(ip)<<","<<csv(date)<<","<<csv(source)
     <<","<<csv("NOT VERIFIED - Epic must compare with its own records")<<"\n";
  log.flush();
  std::cout<<"Saved one user-entered historical record. No network lookup or account match was performed.\n";
  choice=ask("Add another historical IP record? (y/n)");
 }
}


void logLoginActivity(const fs::path& dir,const std::string& accountId) {
 std::cout<<"\nOPTIONAL LOGIN / RECOVERY ACTIVITY LOG\n"
  <<"This records only details you manually enter about your own attempts. NEVER enter a password, 2FA code, backup code, cookie, or token.\n";
 std::string choice=ask("Record a login or recovery attempt? (y/n)");
 fs::path logPath=dir/"login_activity_log.csv";
 bool newFile=!fs::exists(logPath);
 std::ofstream log(logPath,std::ios::app);
 if(!log){std::cerr<<"Could not open login activity log.\n";notifyDiscord("general application error");return;}
 if(newFile) log<<"logged_at_local,epic_account_id,username_or_display_name,email_address,activity_type,result_status,error_message,verification_status\n";
 while(choice=="y"||choice=="Y"||choice=="yes"||choice=="YES"){
  std::string username=ask("Username/display name used (optional; do not enter a password)");
  std::string email=ask("Email address used (optional; no password or code)");
  std::string activity=ask("Activity type (sign-in / password-reset request / account-recovery attempt / other)");
  std::string status=ask("Result (success / failed / waiting / blocked / other)");
  std::string error=ask("Exact non-secret error message, if any");
  std::time_t now=std::time(nullptr); std::tm* local=std::localtime(&now);
  char stamp[32]="unknown";
  if(local) std::strftime(stamp,sizeof(stamp),"%Y-%m-%d %H:%M:%S",local);
  log<<csv(stamp)<<","<<csv(accountId)<<","<<csv(username)<<","<<csv(email)<<","
     <<csv(activity)<<","<<csv(status)<<","<<csv(error)<<","
     <<csv("USER-REPORTED - NOT VERIFIED BY EPIC")<<"\n";
  log.flush();
  std::cout<<"Saved a user-reported activity record. No credentials were requested or captured.\n";
  choice=ask("Record another login or recovery attempt? (y/n)");
 }
}

void openLink(const char* url){
#ifdef _WIN32
 ShellExecuteA(nullptr,"open",url,nullptr,nullptr,SW_SHOWNORMAL);
#else
 std::cout<<"Open in browser: "<<url<<"\n";
#endif
}
int main(){
 std::cout<<"EPIC GAMES RECOVERY ASSISTANT 4.5 (C++17)\n"
 <<"Local organizer only; not an official Epic tool.\n"
 <<"Never enter passwords, account PINs, CVV, full card numbers, 2FA codes,\n"
 <<"backup codes, authenticator secrets, session cookies, or access tokens.\n"
 <<"IP/VPN history is optional context, never proof of ownership. No spoofing.\n\n";
 notifyDiscord("application started");
 add("Your first and last name (as used on purchases)");
 add("Epic display name (current)"); add("Previous Epic display names");
 add("Current Epic email (never enter password)"); add("Previous Epic emails");
 add("Desired display name (planning only)"); add("Desired email (planning only)");
 add("Epic Account ID (also called account number, if shown by Epic)");
 add("Epic account number / alternate account reference (only if Epic provided one; do not invent)"); add("Country/region"); add("Approximate account creation date");
 add("Support-A-Creator code (if applicable)"); add("Purchase invoice/order ID");
 add("Country/region used when the Epic account was originally created");
 add("Approximate date of first Epic purchase (if known)");
 add("Epic account country at creation (if different from current country)");
 add("Name on a past purchase"); add("Billing street address (optional)");
 add("Billing city"); add("Billing state/region"); add("Billing ZIP/postal code");
 add("Payment provider (for example, card issuer or PayPal)");
 add("Payment method type used for purchases (card / PayPal / other)");
 add("Card last four digits ONLY (optional; never enter full card number or CVV)");
 add("Payment method review request (describe the issue; do not request or enter payment credentials)");
 add("Remembered historical public IP (optional; do not guess)");
 add("Approximate date/period IP was used");
 add("VPN/proxy provider and region used (history only; no spoofing)");
 add("VPN/proxy active during recovery attempts? (yes/no/unsure)");
 add("VPN/proxy usage dates and purpose (historical notes only)");
 add("Was the remembered IP obtained from your own records? (yes/no/unsure; do not guess)");
 add("Network history note: this app does not connect to proxies, rotate VPNs, spoof IPs, or imitate another device/location");
 add("2FA methods enabled: Epic Authenticator / third-party authenticator app / email / SMS-phone (list methods only)");
 add("Preferred or primary 2FA method (if known)");
 add("Can you access your email inbox now? (yes/no/unsure)");
 add("Can you access your SMS phone number now? (yes/no/unsure)");
 add("Can you access your authenticator app now? (yes/no/unsure)");
 add("2FA help requested: set up / switch method / lost email / lost phone / lost authenticator / other (planning only)");
 add("2FA recovery notes: describe which registered methods you can still access; never enter codes or backup codes");
 add("Email 2FA access status (can access / cannot access / unsure; never enter a code)");
 add("SMS/phone 2FA access status (can access / cannot access / unsure; never enter a code)");
 add("Epic Authenticator access status (can access / cannot access / unsure; never enter a code)");
 add("Third-party authenticator app access status (can access / cannot access / unsure; never enter a code)");
 add("2FA method requested for official support guidance (email / SMS-phone / authenticator app / alternative method)");
 add("SMS/phone 2FA: confirm whether you still control the registered number; do not record the full number or any SMS code");
 add("Preferred official recovery contact to discuss with support (email / SMS-phone / authenticator app / unsure; planning only)");
 add("Evidence attachments checklist: note filenames of genuine receipts, notices, screenshots, or support emails kept privately on your device; do not paste passwords, codes, cookies, or tokens");
 add("Evidence source/date: where each document came from and when it was created (truthful notes only)");
 add("Linked services to review (Xbox, PlayStation, Nintendo, Steam, Apple, Google, LEGO, GeForce NOW, Disney, Twitch, YouTube, TikTok, Facebook, other Epic-connected apps/services)");
 add("Linked-service actions requested (review only; actual unlinking must be done by the platform owner)");
 add("Xbox linked gamertag and whether currently linked (public details only)");
 add("PlayStation Online ID and whether currently linked (public details only)");
 add("Nintendo account nickname/ID and whether currently linked (public details only)");
 add("Steam profile name/ID and whether currently linked (public details only)");
 add("Other linked services and public profile names/IDs (Apple, Google/Gmail, LEGO, GeForce NOW, Disney, Twitch, YouTube, TikTok, Instagram, Facebook, Roblox, GTA/Rockstar Games, other)");
 add("Linked-service inventory (Xbox, PlayStation, Nintendo, Steam, Twitch, YouTube, Instagram, TikTok, Facebook, Google/Gmail, LEGO, Roblox, GTA/Rockstar Games; enter public profile names/IDs only)");
 add("Password-change planning status (needed / already changed / not needed / unsure; never enter any current or new password)");
 add("Password-change request notes (planning only; change it yourself through Epic's official account security page after verifying the official site)");
 add("Phone ownership status for the recovery number (I control it / no longer control it / unsure; do not enter the full phone number)");
 add("IP consistency notes (historical IP/date/source you personally remember; Epic must verify any match against its own records; this app cannot check or validate it)");
 add("Do you have a genuine historical record of the account's IP? (yes/no/unsure; do not guess or obtain someone else's IP)");
 add("For each linked service: service type, public ID/profile name, approximate link date, and whether it is currently linked");
 add("Linked-account concern: unknown link / lost access / wrong account / unlink information / other");
 add("Approximate dates each relevant service was linked (if known)");
 add("Requested Epic display-name change (planning only; official account settings required)");
 add("Requested Epic email change (planning only; official verification required)");
 add("Restriction appeal target: Epic / Xbox / PlayStation / Steam / Nintendo / other");
 add("Xbox case/reference ID"); add("Xbox restriction type (communication / multiplayer / account / other)"); add("Xbox restriction date and end date/duration"); add("Xbox appeal status (not started / submitted / response received / closed)"); add("Xbox factual appeal notes (what happened, policy cited, evidence available)");
 add("Xbox appeal request summary (official review only; no automated enforcement changes)");
 add("PlayStation case/reference ID"); add("PlayStation restriction type (account suspension / communication suspension / other)"); add("PlayStation restriction date and end date/duration"); add("PlayStation appeal status (not started / submitted / response received / closed)"); add("PlayStation factual appeal notes (what happened, policy cited, evidence available)");
 add("PlayStation appeal request summary (official review only; no automated suspension changes)");
 add("Steam case/reference ID"); add("Steam restriction type (Community Ban / VAC ban / game ban / account lock / other)"); add("Steam restriction date and end date/duration, if shown"); add("Steam appeal/support status (not started / submitted / response received / closed)"); add("Steam factual appeal notes (game/app, policy cited, evidence available)");
 add("Steam restriction/support request summary (official review only; no automated restriction changes)");
 add("Nintendo support case/reference ID"); add("Nintendo restriction type (account restriction / online-service restriction / parental-control issue / other)"); add("Nintendo restriction date and end date/duration, if shown"); add("Nintendo support/appeal status (not started / submitted / response received / closed)"); add("Nintendo factual appeal notes (service affected, notice wording, evidence available)");
 add("Nintendo restriction/support request summary (official review only; no automated restriction changes)");
 add("Restriction review request: state the exact platform notice, policy section if shown, and why you believe a review is warranted; no bypass or removal automation");
 add("Appeal evidence checklist: notice screenshot, case ID, dates, relevant receipts, and concise factual timeline (store files privately; do not include secrets)");
 add("Evidence bundle description: list only lawful, truthful documents you already possess; do not dump credentials, cookies, tokens, or private account databases");
 add("Epic recovery request status (not started / submitted / waiting / approved / denied / unsure)");
 add("ACCOUNT RECOVERY FAILED: has an Epic recovery attempt failed? (yes / no / waiting / unsure)");
 add("ACCOUNT RECOVERY FAILED: date and approximate time of the failed attempt");
 add("ACCOUNT RECOVERY FAILED: exact error or denial message shown by Epic (copy wording; no passwords or codes)");
 add("ACCOUNT RECOVERY FAILED: Epic request/reference number, if provided");
 add("ACCOUNT RECOVERY FAILED: what step failed? (email verification / 2FA / ownership questions / form submission / sign-in / other)");
 add("ACCOUNT RECOVERY FAILED: what troubleshooting steps have already been tried? (factual notes)");
 add("ACCOUNT RECOVERY FAILED: did Epic specify a waiting period or ask you not to retry? (yes/no/unsure; record the stated period)");
 add("ACCOUNT RECOVERY FAILED: date of last support contact and response received (if any)");
 add("ACCOUNT RECOVERY FAILED: follow-up request to Epic (ask for clarification/review and approved alternative verification options; do not demand guaranteed recovery)");

 add("Epic recovery request ID (if provided; never enter a verification code)");
 add("Date of most recent Epic recovery request and any stated waiting period");
 add("Official recovery-form details still missing (list non-secret items only)");
 add("Account data export limitation: this tool exports only the information you type into this form; it cannot extract or dump data from Epic or another platform");
 add("Restriction notice details, appeal eligibility, end date, and case/reference number");
 add("Requested support ticket category and desired outcome (review/appeal/recovery/linking guidance)");
 add("Support agent conversation notes or ticket number (do not enter passwords or codes)");
 add("Public linked profile names/IDs only (no login credentials)");
 add("Requested action: recovery / 2FA help / name change / email change / unlink / restriction appeal / other");
 add("Restriction platform: Epic / Xbox / PlayStation / Steam / Nintendo / other");
 add("Epic restriction notice, reason, date, duration, and case number (if applicable)");
 add("Xbox enforcement notice, reason, date, and case/reference number (if applicable)");
 add("PlayStation suspension notice, reason, date, and case/reference number (if applicable)");
 add("Steam restriction notice, reason, date, and case/reference number (if applicable)");
 add("Nintendo restriction notice, reason, date, and case/reference number (if applicable)");
 add("Appeal history and any response received from the relevant platform");
 add("Exact recovery/sign-in error message and date (for example, canceled, disabled, or verification failed; do not assume the account is disabled)");
 add("What happened immediately before the error? (brief factual description)");
 add("Number of recent recovery attempts (approximate); stop repeated attempts if the official page asks you to wait"); add("Prior support ticket/reference number");
 add("Other truthful, non-secret ownership evidence");
 add("Reminder: Epic's form may request account ID/invoice ID, historic emails/display names, original country, linked-account identifiers/link dates, phone 2FA status, and payment history. Supply details only in Epic's official form.");
 add("IP address is optional historical context only; do not use it as an ownership test or attempt to imitate another network.");
 add("Account safety preference if ownership cannot be established: stop and refer to official support (no automatic lock or disable action).");
 std::cout<<"\nEvidence readiness (self-assessment only; this program cannot verify ownership):\n1. Have requested evidence\n2. Unsure\n3. Do not have requested evidence\n";
 fields.push_back({"Evidence readiness",ask("Choose 1, 2, or 3")});
 std::string request=ask("Describe the support request (do not include secrets)");
 fields.push_back({"Support request summary",request});
 fs::path dir=fs::current_path()/safe("Epic_Recovery_"+(fields.empty()?std::string("Packet"):fields[0].value));
 std::error_code ec;fs::create_directories(dir,ec);if(ec){std::cerr<<ec.message()<<"\n";notifyDiscord("general application error");return 1;}
 std::string epicId;
 for(const auto& f:fields) if(f.label=="Epic Account ID (also called account number, if shown by Epic)") { epicId=f.value; break; }
 logHistoricalIPs(dir,epicId);
 logLoginActivity(dir,epicId);
 std::ostringstream txt,j,draft;std::vector<std::string> lines={
 "EPIC GAMES RECOVERY ASSISTANT - LOCAL PACKET","Version 4.5 | Not an official Epic form",
 "This app cannot verify ownership, change accounts, unlink services, or remove restrictions.",
 "IP and VPN/proxy history are optional user-reported context; this app cannot compare it with Epic records or verify account ownership.",
 "Never provide passwords, account PINs, full card numbers, CVV, full phone numbers, 2FA codes, or backup codes.",
 "Use official platform forms and share only information they request.",""};
 txt<<"EPIC GAMES RECOVERY ASSISTANT - LOCAL PACKET\nVersion 4.5\n\n";
 j<<"{\n \"version\":\"4.5\",\n \"notice\":\"Local organizer only; no sign-in or account verification.\",\n \"fields\":[\n";
 for(size_t i=0;i<fields.size();++i){txt<<fields[i].label<<": "<<fields[i].value<<"\n";lines.push_back(fields[i].label+": "+fields[i].value);
 j<<"  {\"label\":\""<<escJson(fields[i].label)<<"\",\"value\":\""<<escJson(fields[i].value)<<"\"}"<<(i+1==fields.size()?"\n":",\n");}
 j<<" ]\n}\n";
 draft<<"Subject: Follow-up: Epic account recovery attempt was unsuccessful\n\nHello Epic Support,\n\nI am following up because my account recovery attempt was unsuccessful. Please review the information below and let me know whether there are approved alternative verification steps or additional non-secret evidence I can provide. I understand that Epic Support alone determines account ownership and recovery eligibility.\n\nMy request: "<<request<<"\n\nRecovery failure details (as entered by me):\n";
 for(const auto& field:fields) if(field.label.find("ACCOUNT RECOVERY FAILED:")==0) draft<<field.label.substr(std::string("ACCOUNT RECOVERY FAILED:").size())<<": "<<field.value<<"\n";
 draft<<"\nPlease do not treat an IP address alone as proof of ownership. I will provide any requested information only through Epic's official secure support process.\n\nThank you.\n";
 save(dir/"recovery_details.txt",txt.str());save(dir/"recovery_details.json",j.str());save(dir/"support_request_draft.txt",draft.str());
 // Copy the C++ source into the packet when it is beside the executable/source.
 fs::path appDir=fs::current_path();
#ifdef _WIN32
 char exePath[MAX_PATH]={0};
 DWORD exeLen=GetModuleFileNameA(nullptr,exePath,MAX_PATH);
 if(exeLen>0 && exeLen<MAX_PATH) appDir=fs::path(exePath).parent_path();
#endif
 fs::path sourcePath=appDir/"recovery_assistant.c++";
 if(fs::exists(sourcePath)){std::error_code copyEc;fs::copy_file(sourcePath,dir/"recovery_assistant.c++",fs::copy_options::overwrite_existing,copyEc);if(copyEc)save(dir/"SOURCE_NOT_COPIED.txt","The C++ source file could not be copied: "+copyEc.message());}
 else save(dir/"SOURCE_NOT_COPIED.txt","recovery_assistant.c++ was not found beside the running executable. Place the source file beside the executable and run again to include it.");
 if(!pdf(dir/"recovery_request.pdf",lines))std::cerr<<"PDF export failed; other exports attempted.\n";
 std::cout<<"\nSaved packet to: "<<dir.string()<<"\nIncludes PDF evidence report, JSON evidence packet, readable text details, support-request draft, and a copy of recovery_assistant.c++ when the source file is beside the program (otherwise a SOURCE_NOT_COPIED.txt note). This is a user-entered evidence export, not an account/credential dump.\n"
 <<"No account action was taken. If evidence is missing, pause and ask official support about alternatives.\n\n"
 <<"1 Open Epic account recovery request form\n2 Open Epic support/contact\n3 Open linked-account settings\n4 Open 2FA/security settings\n5 Epic sign-in\n6 Epic display-name help\n7 Epic email-change help\n8 Xbox enforcement/support\n9 PlayStation suspension support\n10 Steam account help\n11 Nintendo support\n12 Epic account settings\n13 Epic lost-2FA help\n14 Epic unlink help\n15 Epic sanctions and appeals\n16 Epic support contact / ticket options\n17 2FA methods and setup guide\n18 Lost access to 2FA help\n19 Epic recovery help\n20 Steam Community Ban FAQ\n21 Xbox enforcement history\n22 Guided recovery chat (offline helper)\n0 Exit\n";
 std::string choice=ask("Choose an official page");
 if(choice=="1")openLink("https://www.epicgames.com/help/c-45487929/a21414514");
 else if(choice=="2")openLink("https://www.epicgames.com/help/c-45487929?contact=1&lang=en-US");
 else if(choice=="3")openLink("https://www.epicgames.com/account/connections");
 else if(choice=="4")openLink("https://www.epicgames.com/account/password");
 else if(choice=="5")openLink("https://www.epicgames.com/id/login");
 else if(choice=="6")openLink("https://www.epicgames.com/help/c-34254770/c-5719365892123/a18323090?lang=en-US");
 else if(choice=="7")openLink("https://www.epicgames.com/help/c-45487929/c-40721840/a18546270?lang=en-US");
 else if(choice=="8")openLink("https://enforcement.xbox.com/");
 else if(choice=="9")openLink("https://www.playstation.com/en-us/support/account/suspensions/");
 else if(choice=="10")openLink("https://help.steampowered.com/en/wizard/HelpWithAccount");
 else if(choice=="11")openLink("https://en-americas-support.nintendo.com/");
 else if(choice=="12")openLink("https://www.epicgames.com/account/personal");
 else if(choice=="13")openLink("https://www.epicgames.com/help/c-45487929/c-38978022/a22922707?lang=en-US");
 else if(choice=="14")openLink("https://www.epicgames.com/help/c-Category_EpicAccounts/c-38854402/a17347934?lang=en-US");
 else if(choice=="15")openLink("https://safety.epicgames.com/en-US/sanctions-and-appeals");
 else if(choice=="16")openLink("https://www.epicgames.com/help/c-45487929?contact=1&lang=en-US");
 else if(choice=="17")openLink("https://www.epicgames.com/help/c-45487929/c-38978022/a11272697");
 else if(choice=="18")openLink("https://www.epicgames.com/help/c-45487929/c-38978022/a22922707?lang=en-US");
 else if(choice=="19")openLink("https://www.epicgames.com/help/c-45487929/a21414514");
 else if(choice=="20")openLink("https://help.steampowered.com/en/faqs/view/4F62-35F9-F395-5C23");
 else if(choice=="21")openLink("https://enforcement.xbox.com/");
 else if(choice=="22"){
  std::cout<<"GUIDED RECOVERY CHAT (offline helper; not Epic Support or a live AI agent)\\n";
  std::cout<<"Never enter passwords, 2FA codes, backup codes, cookies, tokens, or full payment details. Type exit to finish.\\n";
  for(;;){
   std::string q=ask("You");std::string low=q;for(char& c:low)c=(char)std::tolower((unsigned char)c);
   if(low=="exit"||low=="quit")break;
   if(low.find("ip")!=std::string::npos||low.find("vpn")!=std::string::npos||low.find("proxy")!=std::string::npos)
    std::cout<<"Helper: Record only an IP genuinely found in your own historical records, with its approximate date and source. Never spoof it or use it to impersonate a device/location; it is not proof of ownership.\\n";
   else if(low.find("2fa")!=std::string::npos||low.find("authenticator")!=std::string::npos)
    std::cout<<"Helper: Note which registered 2FA methods you can still access. Never share a verification or backup code. Use Epic's official lost-2FA help page.\\n";
   else if(low.find("ticket")!=std::string::npos||low.find("support")!=std::string::npos)
    std::cout<<"Helper: Review support_request_draft.txt, then submit requested details yourself through Epic's official contact page. Save the ticket number locally.\\n";
   else if(low.find("account")!=std::string::npos||low.find("number")!=std::string::npos||low.find("id")!=std::string::npos)
    std::cout<<"Helper: Enter the Epic Account ID/account number exactly as Epic shows it, if known. It is included in the PDF, JSON, and text exports. Do not guess.\\n";
   else if(low.find("evidence")!=std::string::npos||low.find("pdf")!=std::string::npos||low.find("export")!=std::string::npos)
    std::cout<<"Helper: Export the packet, verify every detail, and keep it private. It contains only information entered here; it cannot retrieve Epic's internal account data.\\n";
   else std::cout<<"Helper: I can guide you through recovery, account IDs, historical IP notes, 2FA, evidence exports, and ticket preparation. Account-specific decisions must come from Epic Support.\\n";
  }
  std::cout<<"Official Epic contact: https://www.epicgames.com/help/c-45487929?contact=1&lang=en-US\\n";
 }
 notifyDiscord("application closed");
 return 0;
}