// ============================================
// 🔑 CONFIG - BOT SETTINGS
// ============================================

import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
    botName: 'JHON BOT',
    owner: 'JHON338',
    ownerNumber: process.env.OWNER_NUMBER || '6285775137463',
};

export let ALLOWED_GROUPS = [];

export let botStatus = {
    isConnected: false,
    botName: CONFIG.botName,
    owner: CONFIG.owner,
    selectedGroup: null,
};

export function setAllowedGroups(groups) {
    ALLOWED_GROUPS = groups;
    botStatus.selectedGroup = groups[0] || null;
}