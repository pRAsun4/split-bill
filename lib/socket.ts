/**
 * lib/socket.ts
 * ─────────────
 * Socket.IO singleton client for real-time events.
 *
 * Usage:
 *   import { socketService } from "../lib/socket";
 *
 *   // Connect once after login (called from useAuthStore)
 *   socketService.connect(accessToken);
 *
 *   // In a group screen
 *   socketService.joinGroup(groupId);
 *   socketService.onNewMessage((msg) => { ... });
 *   socketService.offNewMessage();
 *
 *   // On logout
 *   socketService.disconnect();
 *
 * All server → client events are typed.
 * Listener helpers follow the pattern: on<EventName> / off<EventName>.
 */

import { io, Socket } from "socket.io-client";
import type {
    ApiExpense,
    ApiGroup,
    ApiMessage,
    ApiUser,
} from "./api";

// ─── Config ───────────────────────────────────────────────────────────────────

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

// ─── Server → Client Payload Types ───────────────────────────────────────────

export type SocketNewMessage = { message: ApiMessage; expense: ApiExpense | null };
export type SocketMessageDeleted = { messageId: string };
export type SocketExpenseCreated = { expenseId: string; title: string; totalAmount: number; currency: string; createdBy: Pick<ApiUser, "id" | "name"> };
export type SocketExpenseUpdated = { expense: ApiExpense };
export type SocketExpenseLocked = { expense: ApiExpense };
export type SocketExpenseUnlocked = { expense: ApiExpense };
export type SocketExpenseDeleted = { expenseId: string };
export type SocketParticipantUpdated = { expenseId: string; userId: string; status: string };
export type SocketSettlementRecorded = { settlement: object; fullySettled: boolean };
export type SocketSettlementDeleted = { settlementId: string; groupId: string };
export type SocketBalancesUpdated = { groupId: string };
export type SocketGroupUpdated = { group: ApiGroup };
export type SocketGroupDeleted = { groupId: string };
export type SocketMembersAdded = { addedUsers: ApiUser[]; groupId: string };
export type SocketMemberRemoved = { userId: string; groupId: string };
export type SocketMemberLeft = { userId: string; groupId: string };
export type SocketMemberRoleUpdated = { userId: string; role: string; groupId: string };
export type SocketUserTyping = { userId: string; groupId: string; isTyping: boolean };
export type SocketUserOnline = { userId: string; groupId: string };
export type SocketUserOffline = { userId: string; groupId: string };

// ─── Socket Service ───────────────────────────────────────────────────────────

class SocketService {
    private socket: Socket | null = null;
    private typingTimers: Record<string, ReturnType<typeof setTimeout>> = {};

    // ── Lifecycle ───────────────────────────────────────────────────────────────

    connect(accessToken: string): void {
        if (this.socket?.connected) return;

        this.socket = io(SOCKET_URL, {
            auth: { token: accessToken },
            transports: ["websocket"],       // skip long-polling for mobile
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1500,
            timeout: 10_000,
        });

        this.socket.on("connect", () => {
            console.log("[Socket] Connected:", this.socket?.id);
        });

        this.socket.on("connect_error", (err) => {
            console.warn("[Socket] Connect error:", err.message);
        });

        this.socket.on("disconnect", (reason) => {
            console.log("[Socket] Disconnected:", reason);
        });
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    get isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    // ── Group Room Management ───────────────────────────────────────────────────

    joinGroup(groupId: string): void {
        this.socket?.emit("join_group", groupId);
    }

    leaveGroup(groupId: string): void {
        this.socket?.emit("leave_group", groupId);
    }

    // ── Typing Indicators ───────────────────────────────────────────────────────

    startTyping(groupId: string): void {
        this.socket?.emit("typing_start", groupId);
    }

    stopTyping(groupId: string): void {
        this.socket?.emit("typing_stop", groupId);
    }

    /**
     * Debounced typing — call on every keystroke.
     * Emits typing_start immediately, typing_stop after 1.5s of silence.
     */
    debounceTyping(groupId: string): void {
        if (!this.typingTimers[groupId]) {
            this.startTyping(groupId);
        }
        clearTimeout(this.typingTimers[groupId]);
        this.typingTimers[groupId] = setTimeout(() => {
            this.stopTyping(groupId);
            delete this.typingTimers[groupId];
        }, 1500);
    }

    // ── Generic listener helpers ────────────────────────────────────────────────

    private on<T>(event: string, cb: (data: T) => void): void {
        this.socket?.on(event, cb);
    }

    private off(event: string): void {
        this.socket?.off(event);
    }

    // ── Server → Client: Messages ───────────────────────────────────────────────

    onNewMessage(cb: (data: SocketNewMessage) => void) { this.on("new_message", cb); }
    offNewMessage() { this.off("new_message"); }

    onMessageDeleted(cb: (data: SocketMessageDeleted) => void) { this.on("message_deleted", cb); }
    offMessageDeleted() { this.off("message_deleted"); }

    // ── Server → Client: Expenses ───────────────────────────────────────────────

    onExpenseCreated(cb: (data: SocketExpenseCreated) => void) { this.on("expense_created", cb); }
    offExpenseCreated() { this.off("expense_created"); }

    onExpenseUpdated(cb: (data: SocketExpenseUpdated) => void) { this.on("expense_updated", cb); }
    offExpenseUpdated() { this.off("expense_updated"); }

    onExpenseLocked(cb: (data: SocketExpenseLocked) => void) { this.on("expense_locked", cb); }
    offExpenseLocked() { this.off("expense_locked"); }

    onExpenseUnlocked(cb: (data: SocketExpenseUnlocked) => void) { this.on("expense_unlocked", cb); }
    offExpenseUnlocked() { this.off("expense_unlocked"); }

    onExpenseDeleted(cb: (data: SocketExpenseDeleted) => void) { this.on("expense_deleted", cb); }
    offExpenseDeleted() { this.off("expense_deleted"); }

    onParticipantUpdated(cb: (data: SocketParticipantUpdated) => void) { this.on("participant_updated", cb); }
    offParticipantUpdated() { this.off("participant_updated"); }

    // ── Server → Client: Balances & Settlements ─────────────────────────────────

    onBalancesUpdated(cb: (data: SocketBalancesUpdated) => void) { this.on("balances_updated", cb); }
    offBalancesUpdated() { this.off("balances_updated"); }

    onSettlementRecorded(cb: (data: SocketSettlementRecorded) => void) { this.on("settlement_recorded", cb); }
    offSettlementRecorded() { this.off("settlement_recorded"); }

    onSettlementDeleted(cb: (data: SocketSettlementDeleted) => void) { this.on("settlement_deleted", cb); }
    offSettlementDeleted() { this.off("settlement_deleted"); }

    // ── Server → Client: Group & Members ───────────────────────────────────────

    onGroupUpdated(cb: (data: SocketGroupUpdated) => void) { this.on("group_updated", cb); }
    offGroupUpdated() { this.off("group_updated"); }

    onGroupDeleted(cb: (data: SocketGroupDeleted) => void) { this.on("group_deleted", cb); }
    offGroupDeleted() { this.off("group_deleted"); }

    onMembersAdded(cb: (data: SocketMembersAdded) => void) { this.on("members_added", cb); }
    offMembersAdded() { this.off("members_added"); }

    onMemberRemoved(cb: (data: SocketMemberRemoved) => void) { this.on("member_removed", cb); }
    offMemberRemoved() { this.off("member_removed"); }

    onMemberLeft(cb: (data: SocketMemberLeft) => void) { this.on("member_left", cb); }
    offMemberLeft() { this.off("member_left"); }

    onMemberRoleUpdated(cb: (data: SocketMemberRoleUpdated) => void) { this.on("member_role_updated", cb); }
    offMemberRoleUpdated() { this.off("member_role_updated"); }

    // ── Server → Client: Presence & Typing ─────────────────────────────────────

    onUserTyping(cb: (data: SocketUserTyping) => void) { this.on("user_typing", cb); }
    offUserTyping() { this.off("user_typing"); }

    onUserOnline(cb: (data: SocketUserOnline) => void) { this.on("user_online", cb); }
    offUserOnline() { this.off("user_online"); }

    onUserOffline(cb: (data: SocketUserOffline) => void) { this.on("user_offline", cb); }
    offUserOffline() { this.off("user_offline"); }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

export const socketService = new SocketService();