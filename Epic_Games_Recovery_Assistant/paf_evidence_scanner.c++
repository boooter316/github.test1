// Native C++17 PDF evidence indicator scanner.
// Requires Poppler's pdftotext.exe on PATH. PDF text is processed in memory only.
#define NOMINMAX
#include <windows.h>
#include <algorithm>
#include <chrono>
#include <cstdio>
#include <cstdint>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <regex>
#include <sstream>
#include <string>
#include <vector>

namespace fs = std::filesystem;
static constexpr std::uintmax_t MAX_PDF_BYTES = 20ull * 1024ull * 1024ull;
static constexpr std::size_t MAX_TEXT_BYTES = 32ull * 1024ull * 1024ull;
static constexpr std::size_t MAX_PAGES = 500;
static constexpr std::size_t MAX_FILES = 10;

std::wstring widen(const std::string& value) {
    if (value.empty()) return {};
    int n = MultiByteToWideChar(CP_UTF8, MB_ERR_INVALID_CHARS, value.data(),
                                static_cast<int>(value.size()), nullptr, 0);
    if (n <= 0) return {};
    std::wstring out(static_cast<std::size_t>(n), L'\0');
    MultiByteToWideChar(CP_UTF8, MB_ERR_INVALID_CHARS, value.data(),
                        static_cast<int>(value.size()), out.data(), n);
    return out;
}
std::wstring quoteArg(const std::wstring& s) {
    std::wstring out = L"\"";
    unsigned slashes = 0;
    for (wchar_t c : s) {
        if (c == L'\\') { ++slashes; continue; }
        if (c == L'"') { out.append(slashes * 2 + 1, L'\\'); out += c; slashes = 0; continue; }
        out.append(slashes, L'\\'); slashes = 0; out += c;
    }
    out.append(slashes * 2, L'\\');
    out += L'"';
    return out;
}
bool extractPdfText(const fs::path& pdf, std::string& text) {
    SECURITY_ATTRIBUTES sa{sizeof(sa), nullptr, TRUE};
    HANDLE readPipe = nullptr, writePipe = nullptr;
    if (!CreatePipe(&readPipe, &writePipe, &sa, 0)) return false;
    SetHandleInformation(readPipe, HANDLE_FLAG_INHERIT, 0);

    HANDLE nullInput = CreateFileW(L"NUL", GENERIC_READ, FILE_SHARE_READ | FILE_SHARE_WRITE,
                                   &sa, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, nullptr);
    STARTUPINFOW si{};
    si.cb = sizeof(si);
    si.dwFlags = STARTF_USESTDHANDLES;
    si.hStdInput = nullInput == INVALID_HANDLE_VALUE ? GetStdHandle(STD_INPUT_HANDLE) : nullInput;
    si.hStdOutput = writePipe;
    si.hStdError = GetStdHandle(STD_ERROR_HANDLE);

    std::wstring command = L"pdftotext.exe -enc UTF-8 -layout " +
                           quoteArg(fs::absolute(pdf).wstring()) + L" -";
    std::vector<wchar_t> mutableCommand(command.begin(), command.end());
    mutableCommand.push_back(L'\0');
    PROCESS_INFORMATION pi{};
    BOOL started = CreateProcessW(nullptr, mutableCommand.data(), nullptr, nullptr, TRUE,
                                   CREATE_NO_WINDOW, nullptr, nullptr, &si, &pi);
    CloseHandle(writePipe);
    if (nullInput != INVALID_HANDLE_VALUE) CloseHandle(nullInput);
    if (!started) { CloseHandle(readPipe); return false; }

    char buffer[8192];
    DWORD got = 0;
    bool overflow = false;
    for (;;) {
        if (!ReadFile(readPipe, buffer, sizeof(buffer), &got, nullptr) || got == 0) break;
        if (text.size() + got > MAX_TEXT_BYTES) { overflow = true; TerminateProcess(pi.hProcess, 2); break; }
        text.append(buffer, buffer + got);
    }
    CloseHandle(readPipe);
    WaitForSingleObject(pi.hProcess, INFINITE);
    DWORD exitCode = 1;
    GetExitCodeProcess(pi.hProcess, &exitCode);
    CloseHandle(pi.hThread);
    CloseHandle(pi.hProcess);
    if (overflow || exitCode != 0) { text.clear(); return false; }
    return true;
}
void wipeText(std::string& value) {
    volatile char* p = value.empty() ? nullptr : value.data();
    for (std::size_t i = 0; i < value.size(); ++i) p[i] = 0;
    value.clear();
}
bool has(const std::string& text, const std::regex& pattern) {
    return std::regex_search(text, pattern);
}
std::size_t countMatches(const std::string& text, const std::regex& pattern) {
    return static_cast<std::size_t>(std::distance(
        std::sregex_iterator(text.begin(), text.end(), pattern), std::sregex_iterator()));
}
std::vector<std::string> indicators(const std::string& page) {
    static const std::regex emailPattern(R"(\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b)", std::regex::icase);
    static const std::vector<std::pair<std::string, std::regex>> terms = {
        {"purchase_or_order", std::regex(R"(\b(purchase|order|receipt|transaction|invoice|payment)\b)", std::regex::icase)},
        {"epic_or_fortnite_reference", std::regex(R"(\b(epic games|epic account|fortnite|order id|transaction id)\b)", std::regex::icase)},
        {"date_reference", std::regex(R"(\b(20[0-9]{2}[-/][0-9]{1,2}[-/][0-9]{1,2}|jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may|jun(e)?|jul(y)?|aug(ust)?|sep(tember)?|oct(ober)?|nov(ember)?|dec(ember)?)\b)", std::regex::icase)},
        {"account_identifier_label", std::regex(R"(\b(account id|account number|display name|username)\b)", std::regex::icase)},
        {"fortnite_display_name_label", std::regex(R"(\bfortnite\s+(display\s*name|username)\s*[:=])", std::regex::icase)},
        {"epic_account_id_label", std::regex(R"(\b(epic\s*(games\s*)?(account\s*)?(id|identifier)|account\s*id)\s*[:=#])", std::regex::icase)},
    };
    static const std::vector<std::regex> sensitive = {
        std::regex(R"(\b(password|passwd|passcode)\s*[:=]\s*\S+)", std::regex::icase),
        std::regex(R"(\b(access[_ -]?token|refresh[_ -]?token|api[_ -]?key|secret)\s*[:=]\s*\S+)", std::regex::icase),
        std::regex(R"(\b[0-9]{6}\b)"),
        std::regex(R"(\b(?:[0-9][ -]*?){13,19}\b)")
    };
    std::vector<std::string> found;
    const auto emailCount = countMatches(page, emailPattern);
    if (emailCount) found.push_back("email_address_patterns=" + std::to_string(emailCount));
    for (const auto& term : terms) if (has(page, term.second)) found.push_back(term.first);
    for (const auto& pattern : sensitive) {
        if (has(page, pattern)) { found.push_back("possible_sensitive_value_present"); break; }
    }
    return found;
}
std::string nowUtc() {
    SYSTEMTIME t{}; GetSystemTime(&t);
    char b[40]{};
    std::snprintf(b, sizeof(b), "%04u-%02u-%02uT%02u:%02u:%02uZ",
                  t.wYear,t.wMonth,t.wDay,t.wHour,t.wMinute,t.wSecond);
    return b;
}
int main(int argc, char** argv) {
    std::vector<std::string> files;
    fs::path output = "PDF_Evidence_Scan_Report.txt";
    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if ((arg == "-o" || arg == "--output") && i + 1 < argc) output = argv[++i];
        else if (arg == "-h" || arg == "--help") {
            std::cout << "Usage: paf_evidence_scanner.exe [PDF ...] [-o report.txt]\n"
                         "Scans local PDFs for page-level evidence indicators. No document text or secret values are saved.\n"
                         "Limits: 10 files per run, 20 MiB per PDF, 500 pages per PDF.\n";
            return 0;
        } else files.push_back(arg);
    }
    if (files.empty()) {
        std::cerr << "Select one or more PDF files. Drag PDF files onto PDF_EVIDENCE_SCANNER.bat, or pass their paths as arguments.\n";
        return 2;
    }
    if (files.size() > MAX_FILES) {
        std::cerr << "Select no more than 10 PDF files per scan.\n";
        return 2;
    }
    std::vector<std::string> report = {
        "LOCAL PDF EVIDENCE SCAN — INDICATORS ONLY",
        "Generated UTC: " + nowUtc(),
        "Organizer only; not proof of account ownership or Epic verification.",
        "Extracted text is processed in memory only and is never printed or written to the report. OCR is not performed.",
        ""
    };
    std::size_t readableTotal = 0, pageTotal = 0;
    for (const auto& item : files) {
        fs::path path = fs::u8path(item);
        const std::string name = path.filename().u8string();
        std::error_code ec;
        if (!fs::is_regular_file(path, ec) || path.extension() != ".pdf" && path.extension() != ".PDF") {
            report.push_back(name + ": SKIPPED — not a PDF file"); continue;
        }
        auto size = fs::file_size(path, ec);
        if (ec || size > MAX_PDF_BYTES) { report.push_back(name + ": SKIPPED — missing, unreadable, or exceeds 20 MiB"); continue; }
        std::string extracted;
        if (!extractPdfText(path, extracted)) {
            report.push_back(name + ": NOT INSPECTED — PDF extraction failed; check that Poppler pdftotext is installed and the PDF is not encrypted/corrupt.");
            wipeText(extracted); continue;
        }
        std::vector<std::string> pages;
        std::size_t start = 0;
        for (std::size_t i = 0; i < extracted.size(); ++i) {
            if (extracted[i] == '\f') { pages.emplace_back(extracted.substr(start, i - start)); start = i + 1; }
        }
        if (start < extracted.size() || pages.empty()) pages.emplace_back(extracted.substr(start));
        if (!pages.empty() && pages.back().find_first_not_of(" \r\n\t") == std::string::npos) pages.pop_back();
        if (pages.size() > MAX_PAGES) {
            report.push_back(name + ": SKIPPED — exceeds 500 pages");
            wipeText(extracted); continue;
        }
        std::size_t readable = 0, hitPages = 0;
        for (std::size_t i = 0; i < pages.size(); ++i) {
            const auto& page = pages[i];
            if (page.find_first_not_of(" \r\n\t") == std::string::npos) {
                report.push_back(name + ": page " + std::to_string(i + 1) + ": NO READABLE TEXT — image-only/unsupported; OCR not performed");
                continue;
            }
            ++readable;
            auto found = indicators(page);
            if (!found.empty()) {
                ++hitPages;
                std::sort(found.begin(), found.end());
                std::ostringstream line;
                line << name << ": page " << (i + 1) << ": indicators=";
                for (std::size_t j = 0; j < found.size(); ++j) { if (j) line << ", "; line << found[j]; }
                line << "; document text not retained";
                report.push_back(line.str());
            }
        }
        readableTotal += readable; pageTotal += pages.size();
        report.push_back(name + ": inspected " + std::to_string(readable) + "/" +
                         std::to_string(pages.size()) + " page(s); " + std::to_string(hitPages) +
                         " page(s) with indicators");
        if (!readable) report.push_back(name + ": NOT FULLY INSPECTED — OCR is not included");
        for (auto& page : pages) wipeText(page);
        wipeText(extracted);
    }
    report.push_back("");
    report.push_back("Readable pages: " + std::to_string(readableTotal) + "/" + std::to_string(pageTotal));
    report.push_back("Ownership verification: NOT PERFORMED — only Epic can determine ownership.");
    std::ofstream out(output, std::ios::binary);
    if (!out) { std::cerr << "Cannot write the report file.\n"; return 1; }
    for (const auto& line : report) out << line << "\r\n";
    out.close();
    if (!out) { std::cerr << "Could not finish writing the report file.\n"; return 1; }
    std::cout << "Local report saved: " << output.u8string() << "\n";
    std::cout << "Extracted text and secret values were not printed or saved.\n";
    return 0;
}
