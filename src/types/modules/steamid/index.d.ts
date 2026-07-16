declare module 'steamid' {
    import { Message as DiscordMessage, ChatInputCommandInteraction, Snowflake } from 'discord.js';
import { DiscordRedirectTarget } from '../lib/discordRedirect';

    class SteamID {
        constructor(input: string);

        universe: number;

        type: number;

        instance: number;

        accountid: number;

        isValid(): boolean;

        getSteamID64(): string;

        toString(): string;

        discordID: Snowflake | undefined;

        redirectAnswerTo: DiscordRedirectTarget | undefined;
    }

    export = SteamID;
}
