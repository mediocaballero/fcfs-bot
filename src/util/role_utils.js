const { Util } = require('discord.js');

async function switchAnchorRole(guild, name) {

	const ANCHOR_ROLE = guild.roles.cache.find(role => role.name === "ancla");
	const member = guild.members.cache.find(member => member.displayName === name);

	if (member.roles.cache.has(ANCHOR_ROLE.id)) {
		// Remove role
		member.roles.remove(ANCHOR_ROLE);
		console.log(`(disabled)Removing anchor role for user ${name}`);
	} else {
		// Add role
		member.roles.add(ANCHOR_ROLE);
		console.log(`Adding anchor role for user ${name}`);
	}

}

async function addAnchorRole(guild, name) {

	const ANCHOR_ROLE = guild.roles.cache.find(role => role.name === "ancla");
	const member = guild.members.cache.find(member => member.displayName === name);

	if (member.roles.cache.has(ANCHOR_ROLE.id)) {
		console.log(`User ${name} already had anchor role`);
	} else {
		// Add role
		member.roles.add(ANCHOR_ROLE);
		console.log(`Adding anchor role for user ${name}`);
	}

}

async function switchAfkRole(guild, name) {

	const AFK_ROLE = guild.roles.cache.find(role => role.name === "AFK");
	const member = guild.members.cache.find(member => member.displayName === name);

	if (member.roles.cache.has(AFK_ROLE.id)) {
		// Remove role
		member.roles.remove(AFK_ROLE);
		console.log(`Removing AFK role for user ${name}`);
		return false;
	} else {
		// Add role
		member.roles.add(AFK_ROLE);
		console.log(`Adding AFK role for user ${name}`);
		return true;
	}

}

module.exports = { switchAnchorRole, addAnchorRole, switchAfkRole };