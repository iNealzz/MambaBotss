require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;

// Canali trigger per la creazione di stanze vocali
const TRIGGER_CHANNELS = {
    "🕛 | CREA STANZA 1": "1305304019987730432", // VOCALI
    "🕛 | CREA STANZA 2": "1312813415466532924", // MAMBA  
    "🕛 | CREA STANZA 3": "1305301814761226340", // STREAMZONE
    "🕛 | CREA STANZA 4": "1336485340893941862", // VALORANT
};

// Ruoli e tag associati con priorità
const ROLE_TAGS = [
    { id: "1320059077392334989", tag: "[MAMBA]" },
    { id: "1329132463783547000", tag: "[M.PROVA]" },
    { id: "1343977810443632762", tag: "[ACADEMY]" }
];

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.once('ready', () => {
    console.log(`✅ Bot ${client.user.tag} è online!`);
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    const member = newState.member;
    const guild = newState.guild;

    if (newState.channel && TRIGGER_CHANNELS[newState.channel.name]) {
        const categoryId = TRIGGER_CHANNELS[newState.channel.name];
        const category = guild.channels.cache.get(categoryId);

        if (!category) {
            console.error(`❌ Categoria con ID ${categoryId} non trovata!`);
            return;
        }

        const tag = getHighestRoleTag(member);
        const channelName = tag ? `${tag} ${member.user.username}` : `${member.user.username} Channel`;

        const newChannel = await guild.channels.create({
            name: channelName,
            type: 2, // Canale vocale
            parent: category.id
        });

        await member.voice.setChannel(newChannel);
    }

    if (oldState.channel && !newState.channel && oldState.channel.name.includes("Channel") && oldState.channel.members.size === 0) {
        await oldState.channel.delete();
    }
});

// Aggiorna il nome del canale vocale quando i ruoli vengono modificati
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const voiceChannel = newMember.voice.channel;

    if (!voiceChannel) return;

    const tag = getHighestRoleTag(newMember);
    const newName = tag ? `${tag} ${newMember.user.username}` : `${newMember.user.username} Channel`;

    if (voiceChannel.name !== newName) {
        await voiceChannel.setName(newName).catch(console.error);
    }
});

// Trova il tag del ruolo con la priorità più alta
function getHighestRoleTag(member) {
    const role = ROLE_TAGS.find(role => member.roles.cache.has(role.id));
    return role ? role.tag : null;
}

client.login(TOKEN);
