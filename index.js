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
        const channel = await client.channels.fetch(TICKET_CHANNEL_ID);
        if (!channel) {
            console.error("❌ Canale ticket non trovato!");
            return;
        }
        console.log(`📢 Canale trovato: ${channel.name} (${channel.id})`);

        const messages = await channel.messages.fetch({ limit: 10 });
        if (!messages.some(msg => msg.author.id === client.user.id)) {
            console.log("✉️ Nessun messaggio del bot trovato. Inviando il messaggio di apertura ticket...");
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('open_ticket')
                    .setLabel('📧 Apri Ticket')
                    .setStyle(ButtonStyle.Primary)
            );
            await channel.send({ content: "**Apri un Ticket!**\nClicca il bottone per aprire un Ticket.", components: [row] });
            console.log("✅ Messaggio inviato con successo!");
        } else {
            console.log("⚠️ Il messaggio è già presente nel canale.");
        }
    } catch (error) {
        console.error("❌ Errore durante l'invio del messaggio nel canale ticket:", error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    if (interaction.customId === 'open_ticket') {
        if (activeTickets.has(interaction.user.id)) {
            return interaction.reply({ content: "⚠️ Hai già un ticket aperto. Chiudi il ticket precedente prima di crearne un altro.", ephemeral: true });
        }

        const guild = interaction.guild;
        const category = guild.channels.cache.get(TICKET_CATEGORY_ID);
        if (!category) return;

        const ticketChannel = await guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: 0,
            parent: category.id,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                },
                {
                    id: interaction.user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                },
                ...STAFF_ROLES.map(roleName => {
                    const role = guild.roles.cache.find(r => r.name === roleName);
                    return role ? { id: role.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] } : null;
                }).filter(Boolean)
            ]
        });

        activeTickets.set(interaction.user.id, ticketChannel.id);
        await interaction.reply({ content: `✅ Ticket creato: ${ticketChannel}`, ephemeral: true });
    }
});

client.on('messageCreate', async (message) => {
    if (message.content === '!chiudi' && message.channel.name.startsWith('ticket-')) {
        if (!activeTickets.has(message.author.id) || activeTickets.get(message.author.id) !== message.channel.id) {
            return message.reply("⚠️ Non hai il permesso di chiudere questo ticket.");
        }

        await message.channel.delete();
        activeTickets.delete(message.author.id);
    }
});

client.login(TOKEN);