import { ChatInputCommandInteraction, Message as DiscordMessage } from 'discord.js';

export type DiscordRedirectTarget = DiscordMessage | ChatInputCommandInteraction;

export function isDiscordRedirect(target: unknown): target is DiscordRedirectTarget {
    if (!target || typeof target !== 'object') {
        return false;
    }

    return target instanceof DiscordMessage || (target as ChatInputCommandInteraction).isChatInputCommand?.() === true;
}

export function getDiscordUserId(target: DiscordRedirectTarget): string {
    if (target instanceof DiscordMessage) {
        return target.author.id;
    }

    return target.user.id;
}
