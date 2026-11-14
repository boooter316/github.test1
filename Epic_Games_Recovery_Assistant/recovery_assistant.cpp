// Epic Games Recovery Assistant 3.5 - C++17
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
 std::cout<<"EPIC GAMES RECOVERY ASSISTANT 3.5 (C++17)\n"
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
 add("2FA methods enabled: Epic Authenticator / third-party authenticator app / email / SMS-phone (list methods only)");
 add("Preferred or primary 2FA method (if known)");
 add("Can you access your email inbox now? (yes/no/unsure)");
 add("Can you access your SMS phone number now? (yes/no/unsure)");
 add("Can you access your authenticator app now? (yes/no/unsure)");
 add("2FA help requested: set up / switch method / lost email / lost phone / lost authenticator / other (planning only)");
 add("2FA recovery notes: describe which registered methods you can still access; never enter codes or backup codes");
 add("Phone number associated with SMS 2FA (optional; never enter SMS codes)");
 add("Linked services to review (Xbox, PlayStation, Nintendo, Steam, Apple, Google, LEGO, GeForce NOW, Disney, Twitch, YouTube, TikTok, Facebook, other Epic-connected apps/services)");
 add("Linked-service actions requested (review only; actual unlinking must be done by the platform owner)");
 add("Xbox linked gamertag and whether currently linked (public details only)");
 add("PlayStation Online ID and whether currently linked (public details only)");
 add("Nintendo account nickname/ID and whether currently linked (public details only)");
 add("Steam profile name/ID and whether currently linked (public details only)");
 add("Other linked services and public profile names/IDs (Apple, Google, LEGO, GeForce NOW, Disney, Twitch, YouTube, TikTok, Facebook)");
 add("For each linked service: service type, public ID/profile name, approximate link date, and whether it is currently linked");
 add("Linked-account concern: unknown link / lost access / wrong account / unlink information / other");
 add("Approximate dates each relevant service was linked (if known)");
 add("Requested Epic display-name change (planning only; official account settings required)");
 add("Requested Epic email change (planning only; official verification required)");
 add("Restriction appeal target: Epic / Xbox / PlayStation / Steam / Nintendo / other");
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
 std::error_code ec;fs::create_directories(dir,ec);if(ec){std::cerr<<ec.message()<<"\n";return 1;}
 std::ostringstream txt,j,draft;std::vector<std::string> lines={
 "EPIC GAMES RECOVERY ASSISTANT - LOCAL PACKET","Version 3.5 | Not an official Epic form",
 "This app cannot verify ownership, change accounts, unlink services, or remove restrictions.",
 "IP and VPN/proxy history are optional context, not proof of ownership.",
 "Never provide passwords, account PINs, full card numbers, CVV, 2FA codes, or backup codes.",
 "Use official platform forms and share only information they request.",""};
 txt<<"EPIC GAMES RECOVERY ASSISTANT - LOCAL PACKET\nVersion 3.4\n\n";
 j<<"{\n \"version\":\"3.4\",\n \"notice\":\"Local organizer only; no sign-in or account verification.\",\n \"fields\":[\n";
 for(size_t i=0;i<fields.size();++i){txt<<fields[i].label<<": "<<fields[i].value<<"\n";lines.push_back(fields[i].label+": "+fields[i].value);
 j<<"  {\"label\":\""<<escJson(fields[i].label)<<"\",\"value\":\""<<escJson(fields[i].value)<<"\"}"<<(i+1==fields.size()?"\n":",\n");}
 j<<" ]\n}\n";
 draft<<"Subject: Request for account recovery / support\n\nHello Support Team,\n\nI am requesting assistance with my account. I can provide truthful, non-secret information through your official secure process and additional evidence if requested.\n\nRequest: "<<request<<"\n\nPlease advise which official verification steps and documents are required. I understand that only your team can verify ownership, review restrictions, or approve account changes.\n\nThank you.\n";
 save(dir/"recovery_details.txt",txt.str());save(dir/"recovery_details.json",j.str());save(dir/"support_request_draft.txt",draft.str());
 if(!pdf(dir/"recovery_request.pdf",lines))std::cerr<<"PDF export failed; other exports attempted.\n";
 std::cout<<"\nSaved packet to: "<<dir.string()<<"\nIncludes PDF, JSON, text details, and support-request draft.\n"
 <<"No account action was taken. If evidence is missing, pause and ask official support about alternatives.\n\n"
 <<"1 Open Epic account recovery request form\n2 Open Epic support/contact\n3 Open linked-account settings\n4 Open 2FA/security settings\n5 Epic sign-in\n6 Epic display-name help\n7 Epic email-change help\n8 Xbox enforcement/support\n9 PlayStation suspension support\n10 Steam account help\n11 Nintendo support\n12 Epic account settings\n13 Epic lost-2FA help\n14 Epic unlink help\n15 Epic sanctions and appeals\n16 Epic support contact / ticket options\n17 2FA methods and setup guide\n18 Lost access to 2FA help\n19 Epic recovery help\n0 Exit\n";
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
 return 0;
}