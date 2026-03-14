import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Member = {
    id: string;
    name: string;
    initials: string;
    avatarColor: string;
};

export type Split = {
    memberId: string;
    amount: number;
    settled: boolean;
};

export type ExpenseCategory =
    | "Food"
    | "Transport"
    | "Shopping"
    | "Gift"
    | "Accommodation"
    | "Entertainment"
    | "Utilities"
    | "Other";

export type Expense = {
    id: string;
    groupId: string;
    title: string;
    amount: number;
    paidById: string;
    date: string;
    category: ExpenseCategory;
    emoji: string;
    splits: Split[];
};

export type Group = {
    id: string;
    name: string;
    emoji: string;
    createdAt: string;
    members: Member[];
    expenses: Expense[];
};

export type Message = {
    id: string;
    groupId: string;
    senderId: string;
    type: "expense" | "text" | "settlement";
    amount?: number;
    description?: string;
    splits?: Split[];
    timestamp: string;
    content?: string;
};

export type DebtEntry = {
    fromId: string;
    fromName: string;
    toId: string;
    toName: string;
    amount: number;
};

export type FriendBalance = {
    memberId: string;
    name: string;
    initials: string;
    avatarColor: string;
    net: number;
};

// ─── Computation Helpers ──────────────────────────────────────────────────────

export function getNetBalance(userId: string, expenses: Expense[]) {
    let owes = 0, owed = 0;
    for (const exp of expenses) {
        if (exp.paidById === userId) {
            for (const s of exp.splits)
                if (s.memberId !== userId && !s.settled) owed += s.amount;
        } else {
            const mine = exp.splits.find((s) => s.memberId === userId);
            if (mine && !mine.settled) owes += mine.amount;
        }
    }
    return {
        owes: parseFloat(owes.toFixed(2)),
        owed: parseFloat(owed.toFixed(2)),
        net: parseFloat((owed - owes).toFixed(2)),
    };
}

export function computeSettlements(members: Member[], expenses: Expense[]): DebtEntry[] {
    const bal: Record<string, number> = {};
    for (const m of members) bal[m.id] = 0;
    for (const exp of expenses) {
        for (const s of exp.splits) {
            if (s.settled || s.memberId === exp.paidById) continue;
            bal[exp.paidById] = (bal[exp.paidById] ?? 0) + s.amount;
            bal[s.memberId] = (bal[s.memberId] ?? 0) - s.amount;
        }
    }
    const creditors = members.filter((m) => (bal[m.id] ?? 0) > 0.005)
        .map((m) => ({ ...m, amount: bal[m.id] })).sort((a, b) => b.amount - a.amount);
    const debtors = members.filter((m) => (bal[m.id] ?? 0) < -0.005)
        .map((m) => ({ ...m, amount: -(bal[m.id] ?? 0) })).sort((a, b) => b.amount - a.amount);

    const result: DebtEntry[] = [];
    let ci = 0, di = 0;
    while (ci < creditors.length && di < debtors.length) {
        const c = creditors[ci], d = debtors[di];
        const amt = Math.min(c.amount, d.amount);
        if (amt > 0.005) result.push({ fromId: d.id, fromName: d.name, toId: c.id, toName: c.name, amount: parseFloat(amt.toFixed(2)) });
        c.amount -= amt; d.amount -= amt;
        if (c.amount < 0.005) ci++;
        if (d.amount < 0.005) di++;
    }
    return result;
}

export function computeFriendBalances(userId: string, groups: Group[]): FriendBalance[] {
    const balMap: Record<string, FriendBalance> = {};
    for (const g of groups) {
        if (!g.members.some((m) => m.id === userId)) continue;
        for (const exp of g.expenses) {
            if (exp.paidById === userId) {
                for (const s of exp.splits) {
                    if (s.memberId === userId || s.settled) continue;
                    const mem = g.members.find((m) => m.id === s.memberId);
                    if (!mem) continue;
                    if (!balMap[mem.id]) balMap[mem.id] = { memberId: mem.id, name: mem.name, initials: mem.initials, avatarColor: mem.avatarColor, net: 0 };
                    balMap[mem.id].net += s.amount;
                }
            } else {
                const mine = exp.splits.find((s) => s.memberId === userId);
                if (!mine || mine.settled) continue;
                const payer = g.members.find((m) => m.id === exp.paidById);
                if (!payer) continue;
                if (!balMap[payer.id]) balMap[payer.id] = { memberId: payer.id, name: payer.name, initials: payer.initials, avatarColor: payer.avatarColor, net: 0 };
                balMap[payer.id].net -= mine.amount;
            }
        }
    }
    return Object.values(balMap).map((b) => ({ ...b, net: parseFloat(b.net.toFixed(2)) }));
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const ME: Member = { id: "me", name: "You", initials: "ME", avatarColor: "#FF6B35" };
const JOHN: Member = { id: "john", name: "John", initials: "JO", avatarColor: "#6C63FF" };
const WADE: Member = { id: "wade", name: "Wade Howard", initials: "WH", avatarColor: "#FF6584" };
const GUY: Member = { id: "guy", name: "Guy Warren", initials: "GW", avatarColor: "#43BCCD" };
const JACK: Member = { id: "jack", name: "Jack", initials: "JK", avatarColor: "#FF9F43" };
const KIM: Member = { id: "kim", name: "Kim", initials: "KM", avatarColor: "#EE5A24" };

const SEED_GROUPS: Group[] = [
    {
        id: "g1", name: "Birthday House", emoji: "🎂", createdAt: "2023-03-24",
        members: [ME, JOHN, WADE],
        expenses: [
            { id: "e1", groupId: "g1", title: "Ansh's Gift", amount: 600, paidById: "me", date: "2024-03-26", category: "Gift", emoji: "🎁", splits: [{ memberId: "me", amount: 200, settled: false }, { memberId: "john", amount: 200, settled: false }, { memberId: "wade", amount: 200, settled: false }] },
            { id: "e2", groupId: "g1", title: "Trip", amount: 450, paidById: "john", date: "2024-03-22", category: "Transport", emoji: "✈️", splits: [{ memberId: "me", amount: 150, settled: false }, { memberId: "john", amount: 150, settled: false }, { memberId: "wade", amount: 150, settled: false }] },
            { id: "e3", groupId: "g1", title: "Balloons", amount: 90, paidById: "wade", date: "2024-03-21", category: "Entertainment", emoji: "🎈", splits: [{ memberId: "me", amount: 30, settled: false }, { memberId: "john", amount: 30, settled: false }, { memberId: "wade", amount: 30, settled: false }] },
            { id: "e4", groupId: "g1", title: "Dinning", amount: 360, paidById: "me", date: "2024-03-20", category: "Food", emoji: "🍽️", splits: [{ memberId: "me", amount: 120, settled: false }, { memberId: "john", amount: 120, settled: false }, { memberId: "wade", amount: 120, settled: false }] },
            { id: "e5", groupId: "g1", title: "Stationary", amount: 60, paidById: "john", date: "2024-03-18", category: "Shopping", emoji: "📎", splits: [{ memberId: "me", amount: 20, settled: false }, { memberId: "john", amount: 20, settled: false }, { memberId: "wade", amount: 20, settled: false }] },
        ],
    },
    {
        id: "g2", name: "Party Time", emoji: "🎉", createdAt: "2023-03-24",
        members: [ME, GUY, WADE],
        expenses: [
            { id: "e6", groupId: "g2", title: "Venue Booking", amount: 750, paidById: "me", date: "2023-03-24", category: "Entertainment", emoji: "🎊", splits: [{ memberId: "me", amount: 250, settled: false }, { memberId: "guy", amount: 250, settled: false }, { memberId: "wade", amount: 250, settled: true }] },
        ],
    },
    {
        id: "g3", name: "Shopping", emoji: "🛍️", createdAt: "2023-03-24",
        members: [ME, JACK, KIM],
        expenses: [
            { id: "e7", groupId: "g3", title: "Groceries", amount: 505, paidById: "jack", date: "2023-03-24", category: "Shopping", emoji: "🛒", splits: [{ memberId: "me", amount: 168.34, settled: false }, { memberId: "jack", amount: 168.33, settled: false }, { memberId: "kim", amount: 168.33, settled: false }] },
        ],
    },
];

const SEED_MESSAGES: Message[] = [
    { id: "msg1", groupId: "g1", senderId: "me", type: "expense", amount: 600, description: "Ansh's Gift", splits: SEED_GROUPS[0].expenses[0].splits, timestamp: "2024-03-26T10:00:00Z" },
    { id: "msg2", groupId: "g1", senderId: "john", type: "expense", amount: 450, description: "Trip", splits: SEED_GROUPS[0].expenses[1].splits, timestamp: "2024-03-22T14:30:00Z" },
    { id: "msg3", groupId: "g1", senderId: "wade", type: "expense", amount: 90, description: "Balloons", splits: SEED_GROUPS[0].expenses[2].splits, timestamp: "2024-03-21T09:15:00Z" },
];

// ─── Store ────────────────────────────────────────────────────────────────────

type AppState = {
    currentUserId: string;
    groups: Group[];
    messages: Message[];
    addGroup: (g: Omit<Group, "id" | "expenses">) => string;
    addExpense: (groupId: string, e: Omit<Expense, "id">) => void;
    addMessage: (m: Omit<Message, "id">) => void;
    settleDebt: (groupId: string, fromId: string, toId: string) => void;
    getGroup: (id: string) => Group | undefined;
    getGroupMessages: (groupId: string) => Message[];
    getAllExpenses: () => (Expense & { groupName: string; groupEmoji: string })[];
    getMyNetBalance: () => { totalOwed: number; totalOwes: number };
    getFriendBalances: () => FriendBalance[];
};

export const useAppStore = create<AppState>((set, get) => ({
    currentUserId: "me",
    groups: SEED_GROUPS,
    messages: SEED_MESSAGES,

    addGroup: (group) => {
        const id = `g${Date.now()}`;
        set((s) => ({ groups: [...s.groups, { ...group, id, expenses: [] }] }));
        return id;
    },

    addExpense: (groupId, expense) => {
        const e: Expense = { ...expense, id: `e${Date.now()}` };
        set((s) => ({ groups: s.groups.map((g) => g.id === groupId ? { ...g, expenses: [...g.expenses, e] } : g) }));
    },

    addMessage: (msg) => {
        set((s) => ({ messages: [...s.messages, { ...msg, id: `msg${Date.now()}` }] }));
    },

    settleDebt: (groupId, fromId, toId) => {
        set((s) => ({
            groups: s.groups.map((g) => g.id !== groupId ? g : {
                ...g,
                expenses: g.expenses.map((exp) => exp.paidById !== toId ? exp : {
                    ...exp,
                    splits: exp.splits.map((sp) => sp.memberId === fromId ? { ...sp, settled: true } : sp),
                }),
            }),
        }));
    },

    getGroup: (id) => get().groups.find((g) => g.id === id),

    getGroupMessages: (groupId) =>
        get().messages.filter((m) => m.groupId === groupId)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),

    getAllExpenses: () =>
        get().groups.flatMap((g) => g.expenses.map((e) => ({ ...e, groupName: g.name, groupEmoji: g.emoji }))),

    getMyNetBalance: () => {
        const { currentUserId, groups } = get();
        let totalOwed = 0, totalOwes = 0;
        for (const g of groups) { const b = getNetBalance(currentUserId, g.expenses); totalOwed += b.owed; totalOwes += b.owes; }
        return { totalOwed: parseFloat(totalOwed.toFixed(2)), totalOwes: parseFloat(totalOwes.toFixed(2)) };
    },

    getFriendBalances: () => computeFriendBalances(get().currentUserId, get().groups),
}));