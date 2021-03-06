import { Message, MessageEmbed } from "discord.js";
import Guild from "../../database/models/Guild";
import Ranks from "../../database/models/Ranks";
import BaseClient from "../../util/BaseClient";
import BaseCommand from "../../util/BaseCommand";

export default class Rank extends BaseCommand {
    constructor() {
        super({
            category: "leveling",
            description: "Check your current rank.",
            name: "rank",
            permissions: ["SEND_MESSAGES"],
            usage: "rank [user]",
            aliases: ["level"],
        });
    }
    public async run(client: BaseClient, message: Message, args: string[]) {
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;

        let guild = await Guild.findOne({ gId: message.guild.id });
        if (!guild) guild = await Guild.create({ gId: message.guild.id });

        let rankData = client.baseClient.cachedRanks.get(message.guild.id).get(member.id) || await Ranks.findOne({ gId: member.guild.id, uId: member.id });
        if (!rankData) rankData = await Ranks.create({ gId: member.guild.id, uId: member.id });

        const allData = client.baseClient.cachedRanks.get(message.guild.id).array();

        const allSortedData = allData.sort((a, b) => b.stats.totalXp - a.stats.totalXp);
        const place = allSortedData.findIndex((rank) => rank.uId === member.id) + 1;

        const percent = rankData.stats.currXp / (guild.xpInfo.baseXP * rankData.stats.level);
        const data = percent === 0 ? 0 : parseInt(percent.toString().slice(2).split("")[0]);


        const res: string[] = [];
        for (let i = 0; i < data; i++) {
            res.push("◆");
        }

        for (let i = 0; i < 10 - data; i++) {
            res.push("◇");
        }

        const Embed = new MessageEmbed()
            .setColor(member.displayHexColor === "#000000" ? "RED" : member.displayHexColor)
            .setAuthor(`${member.user.tag}'s Rank`, member.user.displayAvatarURL({ format: "png" }))
            .setDescription(`**Ranking**: #${place}\n**Level**: ${rankData.stats.level}\n**Current XP:** ${rankData.stats.currXp}xp\n**Required XP**: ${guild.xpInfo.baseXP * rankData.stats.level}xp (${(guild.xpInfo.baseXP * rankData.stats.level) - rankData.stats.currXp}xp to next level)\n\n${res.join("")} (${(percent * 100).toFixed(1)}%)`)

        message.channel.send("", { embed: Embed });

    }
}