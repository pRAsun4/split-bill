/**
 * lib/socket.ts
 * ─────────────
 * Socket.IO singleton. Connects once when authenticated.
 * Screens join/leave group rooms on navigation.
 * Events update Zustand stores directly.
 */

import { io, Socket } from "socket.io-client";
import { useGroupStore } from "../store/useGroupStore";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

let socket: Socket | null = null;

// ─── Connect ──────────────────────────────────────────────────────────────────

export function connectSocket(accessToken: string) {
  if (socket?.connected) return;

  socket = io(BASE_URL, {
    auth: { token: accessToken },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on("connect", () => {
    console.log("[socket] connected:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("[socket] disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.warn("[socket] connect error:", err.message);
  });

  // ── Server → Client events ──────────────────────────────────────────────────

  socket.on("new_message", ({ message, expense }) => {
    if (!message?.groupId) return;
    // prependMessage already deduplicates by id
    useGroupStore.getState().prependMessage(message.groupId, message);
    if (expense) {
      useGroupStore.getState().updateExpenseInCache(message.groupId, expense);
    }
  });

  socket.on("message_deleted", ({ messageId }) => {
    // No direct cache for individual messages — refetch on next load
    console.log("[socket] message_deleted:", messageId);
  });

  socket.on("expense_created", ({ expenseId, groupId }) => {
    // Refetch expenses for the group to get full expense with participants
    if (groupId) useGroupStore.getState().fetchExpenses(groupId);
  });

  socket.on("expense_updated", ({ expense }) => {
    if (expense?.groupId) {
      useGroupStore.getState().updateExpenseInCache(expense.groupId, expense);
    }
  });

  socket.on("expense_locked", ({ expense }) => {
    if (expense?.groupId) {
      useGroupStore.getState().updateExpenseInCache(expense.groupId, expense);
    }
  });

  socket.on("expense_unlocked", ({ expense }) => {
    if (expense?.groupId) {
      useGroupStore.getState().updateExpenseInCache(expense.groupId, expense);
    }
  });

  socket.on("expense_deleted", ({ expenseId, groupId }) => {
    if (groupId && expenseId) {
      useGroupStore.getState().removeExpenseFromCache(groupId, expenseId);
    }
  });

  socket.on("participant_updated", ({ expenseId, groupId }) => {
    if (groupId) useGroupStore.getState().fetchExpenses(groupId);
  });

  socket.on("balances_updated", ({ groupId }) => {
    if (groupId) {
      useGroupStore.getState().fetchBalances(groupId);
      useGroupStore.getState().fetchSummary(groupId);
    }
  });

  socket.on("settlement_recorded", ({ groupId }) => {
    if (groupId) {
      useGroupStore.getState().fetchBalances(groupId);
      useGroupStore.getState().fetchSummary(groupId);
    }
  });

  socket.on("settlement_deleted", ({ groupId }) => {
    if (groupId) {
      useGroupStore.getState().fetchBalances(groupId);
      useGroupStore.getState().fetchSummary(groupId);
    }
  });

  socket.on("group_updated", ({ group }) => {
    if (!group?.id) return;
    useGroupStore.setState((s) => ({
      groups: s.groups.map((g) => (g.id === group.id ? { ...g, ...group } : g)),
    }));
  });

  socket.on("group_deleted", ({ groupId }) => {
    if (!groupId) return;
    useGroupStore.setState((s) => ({
      groups: s.groups.filter((g) => g.id !== groupId),
    }));
  });

  socket.on("members_added", ({ groupId }) => {
    // Refetch group to get updated member list
    if (groupId) useGroupStore.getState().fetchGroups();
  });

  socket.on("member_removed", ({ groupId }) => {
    if (groupId) useGroupStore.getState().fetchGroups();
  });

  socket.on("member_left", ({ groupId }) => {
    if (groupId) useGroupStore.getState().fetchGroups();
  });

  socket.on("member_role_updated", ({ groupId }) => {
    if (groupId) useGroupStore.getState().fetchGroups();
  });
}

// ─── Disconnect ───────────────────────────────────────────────────────────────

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// ─── Group room helpers ───────────────────────────────────────────────────────

export function joinGroup(groupId: string) {
  socket?.emit("join_group", groupId);
}

export function leaveGroup(groupId: string) {
  socket?.emit("leave_group", groupId);
}

// ─── Typing indicators ────────────────────────────────────────────────────────

export function startTyping(groupId: string) {
  socket?.emit("typing_start", groupId);
}

export function stopTyping(groupId: string) {
  socket?.emit("typing_stop", groupId);
}

// ─── Get socket instance (for listening to custom events in screens) ──────────

export function getSocket(): Socket | null {
  return socket;
}



// /**
//  * lib/socket.ts
//  * ─────────────
//  * Socket.IO singleton. Connects once when authenticated.
//  * Screens join/leave group rooms on navigation.
//  * Events update Zustand stores directly.
//  */

// import { io, Socket } from "socket.io-client";
// import { useGroupStore } from "../store/useGroupStore";

// const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

// let socket: Socket | null = null;

// // ─── Connect ──────────────────────────────────────────────────────────────────

// export function connectSocket(accessToken: string) {
//   if (socket?.connected) return;

//   socket = io(BASE_URL, {
//     auth: { token: accessToken },
//     transports: ["websocket"],
//     reconnection: true,
//     reconnectionAttempts: 5,
//     reconnectionDelay: 2000,
//   });

//   socket.on("connect", () => {
//     console.log("[socket] connected:", socket?.id);
//   });

//   socket.on("disconnect", (reason) => {
//     console.log("[socket] disconnected:", reason);
//   });

//   socket.on("connect_error", (err) => {
//     console.warn("[socket] connect error:", err.message);
//   });

//   // ── Server → Client events ──────────────────────────────────────────────────

//   socket.on("new_message", ({ message, expense }) => {
//     if (!message?.groupId) return;
//     useGroupStore.getState().prependMessage(message.groupId, message);
//     if (expense) {
//       useGroupStore.getState().addExpenseToCache(message.groupId, expense);
//     }
//   });

//   socket.on("message_deleted", ({ messageId }) => {
//     // No direct cache for individual messages — refetch on next load
//     console.log("[socket] message_deleted:", messageId);
//   });

//   socket.on("expense_created", ({ expenseId, groupId }) => {
//     // Refetch expenses for the group to get full expense with participants
//     if (groupId) useGroupStore.getState().fetchExpenses(groupId);
//   });

//   socket.on("expense_updated", ({ expense }) => {
//     if (expense?.groupId) {
//       useGroupStore.getState().updateExpenseInCache(expense.groupId, expense);
//     }
//   });

//   socket.on("expense_locked", ({ expense }) => {
//     if (expense?.groupId) {
//       useGroupStore.getState().updateExpenseInCache(expense.groupId, expense);
//     }
//   });

//   socket.on("expense_unlocked", ({ expense }) => {
//     if (expense?.groupId) {
//       useGroupStore.getState().updateExpenseInCache(expense.groupId, expense);
//     }
//   });

//   socket.on("expense_deleted", ({ expenseId, groupId }) => {
//     if (groupId && expenseId) {
//       useGroupStore.getState().removeExpenseFromCache(groupId, expenseId);
//     }
//   });

//   socket.on("participant_updated", ({ expenseId, groupId }) => {
//     if (groupId) useGroupStore.getState().fetchExpenses(groupId);
//   });

//   socket.on("balances_updated", ({ groupId }) => {
//     if (groupId) {
//       useGroupStore.getState().fetchBalances(groupId);
//       useGroupStore.getState().fetchSummary(groupId);
//     }
//   });

//   socket.on("settlement_recorded", ({ groupId }) => {
//     if (groupId) {
//       useGroupStore.getState().fetchBalances(groupId);
//       useGroupStore.getState().fetchSummary(groupId);
//     }
//   });

//   socket.on("settlement_deleted", ({ groupId }) => {
//     if (groupId) {
//       useGroupStore.getState().fetchBalances(groupId);
//       useGroupStore.getState().fetchSummary(groupId);
//     }
//   });

//   socket.on("group_updated", ({ group }) => {
//     if (!group?.id) return;
//     useGroupStore.setState((s) => ({
//       groups: s.groups.map((g) => (g.id === group.id ? { ...g, ...group } : g)),
//     }));
//   });

//   socket.on("group_deleted", ({ groupId }) => {
//     if (!groupId) return;
//     useGroupStore.setState((s) => ({
//       groups: s.groups.filter((g) => g.id !== groupId),
//     }));
//   });

//   socket.on("members_added", ({ groupId }) => {
//     // Refetch group to get updated member list
//     if (groupId) useGroupStore.getState().fetchGroups();
//   });

//   socket.on("member_removed", ({ groupId }) => {
//     if (groupId) useGroupStore.getState().fetchGroups();
//   });

//   socket.on("member_left", ({ groupId }) => {
//     if (groupId) useGroupStore.getState().fetchGroups();
//   });

//   socket.on("member_role_updated", ({ groupId }) => {
//     if (groupId) useGroupStore.getState().fetchGroups();
//   });
// }

// // ─── Disconnect ───────────────────────────────────────────────────────────────

// export function disconnectSocket() {
//   if (socket) {
//     socket.disconnect();
//     socket = null;
//   }
// }

// // ─── Group room helpers ───────────────────────────────────────────────────────

// export function joinGroup(groupId: string) {
//   socket?.emit("join_group", groupId);
// }

// export function leaveGroup(groupId: string) {
//   socket?.emit("leave_group", groupId);
// }

// // ─── Typing indicators ────────────────────────────────────────────────────────

// export function startTyping(groupId: string) {
//   socket?.emit("typing_start", groupId);
// }

// export function stopTyping(groupId: string) {
//   socket?.emit("typing_stop", groupId);
// }

// // ─── Get socket instance (for listening to custom events in screens) ──────────

// export function getSocket(): Socket | null {
//   return socket;
// }