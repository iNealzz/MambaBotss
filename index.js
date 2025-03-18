require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;

const ROLE_TAGS = {
    "🐍 MAMBA TEAM": "[MAMBA] ",
    "🐍 MAMBA PROVA": "[M.PROVA] ",
    "🐍 ACADEMY MAMBA": "[ACADEMY] "
};

const TRIGGER_CHANNELS = {
    "🕛 | CREA STANZA 1": "1305304019987730432",
    "🕛 | CREA STANZA 2": "1312813415466532924",
    "🕛 | CREA STANZA 3": "1305301814761226340",
    "🕛 | CREA STANZA 4": "1336485340893941862",
};

const TICKET_CATEGORY_ID = "1103995307341140008";
const SUPPORT_ROLE_ID = "990911592302514226";
const DISCORD_DESIGNER_ROLE_ID = "1320071503307472896";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`✅ Bot ${client.user.tag} è online!`);
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    console.log(`🔍 Evento attivato per: ${newMember.user.username}`);
    
    let baseNick = newMember.user.username;
    let foundTag = "";

    for (const [roleName, tag] of Object.entries(ROLE_TAGS)) {
        const role = newMember.guild.roles.cache.find(r => r.name === roleName);
        if (role && newMember.roles.cache.has(role.id)) {
            foundTag = tag;
            break;
        }
    }

    let newNick = foundTag + baseNick;

    if (newNick !== newMember.nickname) {
        try {
            await newMember.setNickname(newNick);
            console.log(`✅ Nickname aggiornato per ${newMember.user.username} a ${newNick}`);
        } catch (error) {
            console.error(`❌ Errore nel cambio nickname di ${newMember.user.username}: ${error}`);
        }
    }
});

client.on('messageCreate', async message => {
    if (message.content === '!setup-ticket') {
        if (!message.member.roles.cache.has(DISCORD_DESIGNER_ROLE_ID)) {
            return message.reply("❌ Non hai il permesso di usare questo comando.");
        }

        console.log("✅ Comando ricevuto!");
        
        const embed = new EmbedBuilder()
            .setColor("Green")
            .setTitle("🎫 Apri un Ticket")
            .setDescription("Clicca il bottone qui sotto per aprire un ticket con il supporto.");

        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("create_ticket")
                    .setLabel("Apri Ticket")
                    .setStyle(ButtonStyle.Primary)
            );

        try {
            await message.channel.send({ embeds: [embed], components: [button] });
            console.log("✅ Messaggio inviato!");
        } catch (error) {
            console.error("❌ Errore nell'invio del messaggio:", error);
        }
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'create_ticket') {
        const guild = interaction.guild;
        const user = interaction.user;

        const ticketChannel = await guild.channels.create({
            name: `ticket-${user.username}`,
            type: 0,
            parent: TICKET_CATEGORY_ID,
            permissionOverwrites: [
                { id: guild.id, deny: ['ViewChannel'] },
                { id: user.id, allow: ['ViewChannel', 'SendMessages'] },
                { id: SUPPORT_ROLE_ID, allow: ['ViewChannel', 'SendMessages'] }
            ]
        });

        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle("🎟 Ticket Creato")
            .setDescription("Un membro del supporto ti risponderà al più presto. Scrivi il tuo problema qui.");

        const closeButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("close_ticket")
                    .setLabel("Chiudi Ticket")
                    .setStyle(ButtonStyle.Danger)
            );

        await ticketChannel.send({ content: `<@${user.id}>`, embeds: [embed], components: [closeButton] });
        await interaction.reply({ content: `✅ Ticket creato: ${ticketChannel}`, ephemeral: true });
    }

    if (interaction.customId === 'close_ticket') {
        await interaction.channel.delete();
    }
});

client.login(TOKEN);
