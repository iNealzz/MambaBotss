require('dotenv').config();
const { Client, GatewayIntentBits, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;

// Mappa di ruoli e tag corrispondenti
const ROLE_TAGS = {
    "🐍 MAMBA TEAM": "[MAMBA] ",
    "🐍 MAMBA PROVA": "[M.PROVA] ",
    "🐍 ACADEMY MAMBA": "[ACADEMY] "
};

// Canali trigger per la creazione di stanze vocali
const TRIGGER_CHANNELS = {
    "🕛 | CREA STANZA 1": "1305304019987730432",
    "🕛 | CREA STANZA 2": "1312813415466532924",
    "🕛 | CREA STANZA 3": "1305301814761226340",
    "🕛 | CREA STANZA 4": "1336485340893941862",
};

// Configurazione Ticket System
const TICKET_CATEGORY_ID = "1103995307341140008";
const TICKET_CHANNEL_ID = "990911592302514226";
const STAFF_ROLES = ["👑FOUNDER", "🔥 ADMIN", "⚙️ MODERATORE", "✏️ DISCORD DESIGNER"];
const activeTickets = new Map();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', async () => {
    console.log(`✅ Bot ${client.user.tag} è online!`);
    try {
        console.log("🔍 Tentativo di recuperare il canale ticket...");
        const guild = client.guilds.cache.first();
        if (!guild) {
            console.error("❌ Nessuna guild trovata! Il bot è dentro un server?");
            return;
        }
        
        let channel = guild.channels.cache.get(TICKET_CHANNEL_ID);
        if (!channel) {
            console.log("📡 Canale non trovato in cache, provo a fetcharlo...");
            channel = await guild.channels.fetch(TICKET_CHANNEL_ID);
        }

        if (!channel) {
            console.error("❌ Canale ticket non trovato! Controlla l'ID.");
            return;
        }
        console.log(`📢 Canale trovato: ${channel.name} (${channel.id})`);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_ticket')
                .setLabel('📧 Apri Ticket')
                .setStyle(ButtonStyle.Primary)
        );

        console.log("📤 Inviando il messaggio nel canale ticket...");
        await channel.send({ content: "**Apri un Ticket!**\nClicca il bottone per aprire un Ticket.", components: [row] });
        console.log("✅ Messaggio inviato con successo!");
    } catch (error) {
        console.error("❌ Errore durante l'invio del messaggio nel canale ticket:", error);
    }
});

client.login(TOKEN);
