#include <dpp/dpp.h>
#include <cstdlib>
#include <iostream>
#include <string>

// Minimal C++17 Discord bot starter using D++ (DPP).
// Keep DISCORD_BOT_TOKEN in your local environment; never hard-code it.
int main() {
    const char* token = std::getenv("DISCORD_BOT_TOKEN");
    if (token == nullptr || std::string(token).empty()) {
        std::cerr << "Set DISCORD_BOT_TOKEN before starting the bot.\n";
        return 1;
    }

    dpp::cluster bot(token);

    bot.on_log(dpp::utility::cout_logger());

    bot.on_slashcommand([&bot](const dpp::slashcommand_t& event) {
        const std::string command = event.command.get_command_name();

        if (command == "ping") {
            event.reply("Pong! The C++ bot is online.");
            return;
        }

        if (command == "ticket") {
            // Safe starter behavior: acknowledge the request privately.
            // Configure a support category, role IDs, duplicate-ticket checks,
            // and per-user rate limits before adding channel creation.
            dpp::message response("Ticket request received. A support moderator will review it.");
            response.set_flags(dpp::m_ephemeral);
            event.reply(response);
            return;
        }
    });

    bot.on_ready([&bot](const dpp::ready_t&) {
        if (dpp::run_once<struct register_commands>()) {
            bot.global_command_create(
                dpp::slashcommand("ping", "Check whether the bot is online", bot.me.id)
            );
            bot.global_command_create(
                dpp::slashcommand("ticket", "Submit a support ticket request", bot.me.id)
            );
        }
        std::cout << "Bot connected.\n";
    });

    bot.start(dpp::st_wait);
    return 0;
}
