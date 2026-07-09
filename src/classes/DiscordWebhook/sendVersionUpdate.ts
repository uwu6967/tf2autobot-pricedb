import Bot from '../Bot';
import log from '../../lib/logger';
import { timeNow } from '../../lib/tools/time';
import { Webhook } from './interfaces';
import { sendWebhook } from './utils';

export default function sendVersionUpdate(bot: Bot, message: string): void {
    const optDW = bot.options.discordWebhook;

    if (optDW.sendAlert.enable && optDW.sendAlert.url.main !== '') {
        const botInfo = bot.handler.getBotInfo;
        const webhook: Webhook = {
            username: optDW.displayName || botInfo.name,
            avatar_url: optDW.avatarURL || botInfo.avatarURL,
            content:
                optDW.sendAlert.isMention && optDW.ownerID.length > 0
                    ? optDW.ownerID.map(id => `<@!${id}>`).join(', ')
                    : '',
            embeds: [
                {
                    title: 'Update available',
                    description: message,
                    color: '3447003',
                    footer: {
                        text: `${timeNow(bot.options).time} • v${process.env.BOT_VERSION}`
                    }
                }
            ]
        };

        sendWebhook(optDW.sendAlert.url.main, webhook, 'version-update').catch(err => {
            log.warn('Failed to send version update webhook to Discord: ', err);
        });
    }

    bot.discordBot?.notifyAdmins(message);
}
