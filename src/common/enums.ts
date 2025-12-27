export enum UserRole {
    CUSTOMER = 'customer',
    AGENT = 'agent',
    ADMIN = 'admin',
}

export enum TicketStatus {
    PENDING = 'pending',
    CALLED = 'called',
    SERVING = 'serving',
    COMPLETED = 'completed',
    NO_SHOW = 'no_show',
    HOLD = 'hold',
    CANCELLED = 'cancelled',
}
