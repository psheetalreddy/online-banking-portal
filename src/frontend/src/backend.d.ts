import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Payee {
    ifsc: string;
    payeeName: string;
    bankName: string;
    accountNumber: string;
    branchName: string;
    payeeId: string;
}
export interface Account {
    status: string;
    balance: bigint;
    accountId: string;
    createdAt: bigint;
    accountType: Variant_creditCard_homeLoan_investment_insurance_savings_current;
    accountNumber: string;
}
export interface TransactionsFilter {
    status?: Variant_disputed_pending_completed;
    fromAmount?: bigint;
    toDate?: bigint;
    toAccountId?: string;
    fromAccountId?: string;
    fromDate?: bigint;
    toAmount?: bigint;
}
export interface PaymentInput {
    description: string;
    targetAccountId: string;
    amount: bigint;
    sourceAccountId: string;
}
export interface Message {
    messageId: string;
    subject: string;
    createdAt: bigint;
    messageStatus: Variant_read_unread;
    messageText: string;
}
export interface FundTransferInput {
    description: string;
    toAccountId: string;
    fromAccountId: string;
    amount: bigint;
}
export interface DashboardSummary {
    recentTransactions: Array<Transaction>;
    unreadMessageCount: bigint;
    totalBalance: bigint;
    accountCount: bigint;
}
export interface UserProfile {
    dateOfBirth: string;
    name: string;
    email: string;
    preferences: string;
    kycStatus: boolean;
    address: string;
    phoneNumber: string;
    idProofBlobId?: string;
}
export interface Transaction {
    status: Variant_disputed_pending_completed;
    transactionType: Variant_transfer_payment;
    date: bigint;
    description: string;
    toAccountId: string;
    fromAccountId: string;
    amount: bigint;
    transactionId: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_creditCard_homeLoan_investment_insurance_savings_current {
    creditCard = "creditCard",
    homeLoan = "homeLoan",
    investment = "investment",
    insurance = "insurance",
    savings = "savings",
    current = "current"
}
export enum Variant_disputed_pending_completed {
    disputed = "disputed",
    pending = "pending",
    completed = "completed"
}
export enum Variant_read_unread {
    read = "read",
    unread = "unread"
}
export enum Variant_transfer_payment {
    transfer = "transfer",
    payment = "payment"
}
export interface backendInterface {
    addAccount(account: Account): Promise<void>;
    addPayee(payee: Payee): Promise<void>;
    addTransaction(transaction: Transaction): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createMessage(message: Message): Promise<void>;
    deleteAccount(accountId: string): Promise<void>;
    deleteMessage(messageId: string): Promise<void>;
    deletePayee(payeeId: string): Promise<void>;
    disputeTransaction(transactionId: string): Promise<void>;
    filterTransactions(filter: TransactionsFilter, count: bigint): Promise<Array<Transaction>>;
    fundTransfer(transfer: FundTransferInput): Promise<void>;
    getAccount(accountId: string): Promise<Account>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDashboardSummary(): Promise<DashboardSummary>;
    getMessage(messageId: string): Promise<Message>;
    getProfile(): Promise<UserProfile>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listAccounts(): Promise<Array<Account>>;
    listMessages(): Promise<Array<Message>>;
    listPayees(): Promise<Array<Payee>>;
    listTransactions(): Promise<Array<Transaction>>;
    markRead(messageId: string): Promise<void>;
    markUnread(messageId: string): Promise<void>;
    processPayment(payment: PaymentInput): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setKycStatus(status: boolean): Promise<void>;
    updateProfile(profile: UserProfile): Promise<void>;
}
