import {globalManager} from "../shard";
import {lavamusic} from "../LavaClient";
import {Context} from "../structures";

// @ts-ignore
export async function prepare(req, res) {
    const clientId = req.query.clientId;
    const baseUrl = req.route.path.substring(1);
    debugger;
    const query = req.query.query;
    // Find the guild and voice channel the user is in
    const manager = globalManager;
    const userInfo = await manager.broadcastEval((client, {userId}) => {
        // Find the guild member
        const stringUserId = userId.toString();
        const guilds = client.guilds.cache.filter(guild => guild.members.cache.has(stringUserId));
        if (guilds.size === 0) return null;

        // Find the guild where the user is in a voice channel
        for (const [guildId, guild] of guilds) {
            const member = guild.members.cache.get(stringUserId);
            if (member && member.voice.channelId) {
                return {
                    guildId,
                    voiceChannelId: member.voice.channelId,
                    textChannelId: guild.channels.cache.find(channel =>
                        channel.type === 0 && channel.permissionsFor(client.user.id)?.has(["SendMessages", "ViewChannel"])
                    )?.id
                };
            }
        }
        return null;
    }, {context: {userId: clientId}});

    if (!userInfo) {
        return res.status(404).json({error: 'User not found in any voice channel'});
    }

    // Filter out null results and get the first valid result
    const userGuildInfo = userInfo.filter(info => info !== null)[0];

    if (!userGuildInfo) {
        return res.status(404).json({error: 'User not found in any voice channel'});
    }

    const client = lavamusic;
    const guild = client.guilds.cache.get(userGuildInfo.guildId);
    if (!guild) return;

    // @ts-ignore
    const member = await guild.members.fetch(clientId);
    // @ts-ignore
    const textChannel: TextChannel = guild.channels.cache.get("877503705782566965");

    const lastMessage = await textChannel.messages.fetch({limit: 1});
    const mockMessage = lastMessage.first();
    if (!mockMessage) {
        console.error('No messages found in the text channel');
        return res.status(404).json({error: 'No messages found in the text channel'});
    }
    const commandFromUrl = baseUrl;
    mockMessage.content = `j${commandFromUrl} ${query ?? ''}`; // Simulate the command message
    mockMessage.author = member.user;

    const args = mockMessage.content.slice(1).trim().split(/ +/);
    args.shift(); // Remove the command name


    const command = lavamusic.commands.get(commandFromUrl);
    if (!command) {
        console.error(`${commandFromUrl} command not found`);
        return;
    }


    // Execute the command with proper error handling
    try {
        const context = new Context(mockMessage, args);
        await command.run(lavamusic, context, args);
        console.log(`Successfully executed ${commandFromUrl} command for ${member.user.tag}`);
    } catch (executeError) {
        // @ts-ignore
        console.error(`Command execution failed: ${executeError.message}`);
        // @ts-ignore
        await mockMessage.reply(`❌ Error executing command: ${executeError.message}`);
    }
}

// @ts-ignore
export function createSimpleEndpoint(app, endpoint, hasQuery) {
    // @ts-ignore
    app.get('/' + endpoint, async (req, res) => {
        const {clientId, query} = req.query;

        if (!clientId || (hasQuery && !query)) {
            return res.status(400).json({error: 'Missing required parameters'});
        }

        try {
            await prepare(req, res);
            sendSuccess(res, `Processed request for clientId: ${clientId} with query: ${query}`);
        } catch (error) {
            // @ts-ignore
            sendError(res, error.message);
        }
    });
}

// @ts-ignore
export function sendSuccess(res, message) {
    res.json({
        success: true,
        message
    });
}

// @ts-ignore
export function sendError(res, message) {
    res.status(500).json({
        success: false,
        message
    });
}
