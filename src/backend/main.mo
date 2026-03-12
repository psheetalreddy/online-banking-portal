import Array "mo:core/Array";
import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Set "mo:core/Set";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Int "mo:core/Int";

actor {
  type UserProfile = {
    name : Text;
    email : Text;
    dateOfBirth : Text;
    address : Text;
    phoneNumber : Text;
    preferences : Text;
    kycStatus : Bool;
    idProofBlobId : ?Text;
  };

  type Account = {
    accountId : Text;
    accountNumber : Text;
    accountType : {
      #savings;
      #current;
      #creditCard;
      #homeLoan;
      #investment;
      #insurance;
    };
    balance : Int;
    status : Text;
    createdAt : Int;
  };

  type Transaction = {
    transactionId : Text;
    fromAccountId : Text;
    toAccountId : Text;
    amount : Int;
    transactionType : {
      #transfer;
      #payment;
    };
    date : Int;
    description : Text;
    status : {
      #completed;
      #pending;
      #disputed;
    };
  };

  type Payee = {
    payeeId : Text;
    payeeName : Text;
    bankName : Text;
    branchName : Text;
    accountNumber : Text;
    ifsc : Text;
  };

  type Message = {
    messageId : Text;
    subject : Text;
    messageText : Text;
    messageStatus : {
      #read;
      #unread;
    };
    createdAt : Int;
  };

  type DashboardSummary = {
    totalBalance : Int;
    accountCount : Nat;
    recentTransactions : [Transaction];
    unreadMessageCount : Nat;
  };

  type FundTransferInput = {
    fromAccountId : Text;
    toAccountId : Text;
    amount : Int;
    description : Text;
  };

  type PaymentInput = {
    sourceAccountId : Text;
    targetAccountId : Text;
    amount : Int;
    description : Text;
  };

  type TransactionsFilter = {
    fromAccountId : ?Text;
    toAccountId : ?Text;
    status : ?{ #completed; #pending; #disputed };
    fromDate : ?Int;
    toDate : ?Int;
    fromAmount : ?Int;
    toAmount : ?Int;
  };

  module Account {
    public func compareByCreated(a1 : Account, a2 : Account) : Order.Order {
      if (a1.createdAt < a2.createdAt) { #less } else if (a1.createdAt > a2.createdAt) { #greater } else { #equal };
    };
  };

  module Transaction {
    public func compareByDate(t1 : Transaction, t2 : Transaction) : Order.Order {
      if (t1.date < t2.date) { #less } else if (t1.date > t2.date) { #greater } else { #equal };
    };
  };

  module Message {
    public func compareByCreated(m1 : Message, m2 : Message) : Order.Order {
      if (m1.createdAt < m2.createdAt) { #less } else if (m1.createdAt > m2.createdAt) { #greater } else { #equal };
    };
  };

  type AccountId = Text;
  type TransactionId = Text;
  type PayeeId = Text;
  type MessageId = Text;

  let profiles = Map.empty<Principal, UserProfile>();
  let accounts = Map.empty<Principal, Map.Map<AccountId, Account>>();
  let transactions = Map.empty<Principal, Map.Map<TransactionId, Transaction>>();
  let payees = Map.empty<Principal, Map.Map<PayeeId, Payee>>();
  let messages = Map.empty<Principal, Map.Map<MessageId, Message>>();

  func getAccountsByCaller(caller : Principal) : Map.Map<AccountId, Account> {
    switch (accounts.get(caller)) {
      case (null) {
        let newMap = Map.empty<AccountId, Account>();
        accounts.add(caller, newMap);
        newMap;
      };
      case (?existing) { existing };
    };
  };

  func getTransactionsByCaller(caller : Principal) : Map.Map<TransactionId, Transaction> {
    switch (transactions.get(caller)) {
      case (null) {
        let newMap = Map.empty<TransactionId, Transaction>();
        transactions.add(caller, newMap);
        newMap;
      };
      case (?existing) { existing };
    };
  };

  func getPayeesByCaller(caller : Principal) : Map.Map<PayeeId, Payee> {
    switch (payees.get(caller)) {
      case (null) {
        let newMap = Map.empty<PayeeId, Payee>();
        payees.add(caller, newMap);
        newMap;
      };
      case (?existing) { existing };
    };
  };

  func getMessagesByCaller(caller : Principal) : Map.Map<MessageId, Message> {
    switch (messages.get(caller)) {
      case (null) {
        let newMap = Map.empty<MessageId, Message>();
        messages.add(caller, newMap);
        newMap;
      };
      case (?existing) { existing };
    };
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    profiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    profiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    profiles.add(caller, profile);
  };

  public query ({ caller }) func getProfile() : async UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) { profile };
    };
  };

  public shared ({ caller }) func updateProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update profiles");
    };
    profiles.add(caller, profile);
  };

  public shared ({ caller }) func setKycStatus(status : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set KYC status");
    };
    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?existing) {
        let updated = {
          existing with
          kycStatus = status;
        };
        profiles.add(caller, updated);
      };
    };
  };

  public query ({ caller }) func listAccounts() : async [Account] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list accounts");
    };
    let accountsMap = getAccountsByCaller(caller);
    accountsMap.values().toArray();
  };

  public shared ({ caller }) func addAccount(account : Account) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add accounts");
    };
    let accountsMap = getAccountsByCaller(caller);
    accountsMap.add(account.accountId, account);
  };

  public shared ({ caller }) func deleteAccount(accountId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete accounts");
    };
    let accountsMap = getAccountsByCaller(caller);
    if (not accountsMap.containsKey(accountId)) {
      Runtime.trap("Account ID not found");
    };
    accountsMap.remove(accountId);
  };

  public query ({ caller }) func getAccount(accountId : Text) : async Account {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access accounts");
    };
    let accountsMap = getAccountsByCaller(caller);
    switch (accountsMap.get(accountId)) {
      case (null) { Runtime.trap("Account ID not found") };
      case (?account) { account };
    };
  };

  public query ({ caller }) func listTransactions() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list transactions");
    };
    let transactionsMap = getTransactionsByCaller(caller);
    transactionsMap.values().toArray();
  };

  public shared ({ caller }) func addTransaction(transaction : Transaction) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add transactions");
    };
    let transactionsMap = getTransactionsByCaller(caller);
    transactionsMap.add(transaction.transactionId, transaction);
  };

  public shared ({ caller }) func disputeTransaction(transactionId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can dispute transactions");
    };
    let transactionsMap = getTransactionsByCaller(caller);
    switch (transactionsMap.get(transactionId)) {
      case (null) { Runtime.trap("Transaction ID not found") };
      case (?existing) {
        let updated = {
          existing with
          status = #disputed;
        };
        transactionsMap.add(transactionId, updated);
      };
    };
  };

  public query ({ caller }) func filterTransactions(filter : TransactionsFilter, count : Nat) : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can filter transactions");
    };
    let transactionsMap = getTransactionsByCaller(caller);
    let transactions = transactionsMap.values();

    func matches(transaction : Transaction) : Bool {
      switch (filter.fromAccountId) {
        case (null) {};
        case (?fromAccountId) {
          if (not Text.equal(transaction.fromAccountId, fromAccountId)) {
            return false;
          };
        };
      };
      switch (filter.toAccountId) {
        case (null) {};
        case (?toAccountId) {
          if (not Text.equal(transaction.toAccountId, toAccountId)) {
            return false;
          };
        };
      };
      switch (filter.status) {
        case (null) {};
        case (?status) {
          if (transaction.status != status) {
            return false;
          };
        };
      };
      switch (filter.fromDate) {
        case (null) {};
        case (?fromDate) {
          if (transaction.date < fromDate) {
            return false;
          };
        };
      };
      switch (filter.toDate) {
        case (null) {};
        case (?toDate) {
          if (transaction.date > toDate) {
            return false;
          };
        };
      };
      switch (filter.fromAmount) {
        case (null) {};
        case (?fromAmount) {
          if (transaction.amount < fromAmount) {
            return false;
          };
        };
      };
      switch (filter.toAmount) {
        case (null) {};
        case (?toAmount) {
          if (transaction.amount > toAmount) {
            return false;
          };
        };
      };
      true;
    };

    transactions.toArray().filter(matches).sort(Transaction.compareByDate).sliceToArray(0, count);
  };

  public query ({ caller }) func listPayees() : async [Payee] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list payees");
    };
    let payeesMap = getPayeesByCaller(caller);
    payeesMap.values().toArray();
  };

  public shared ({ caller }) func addPayee(payee : Payee) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add payees");
    };
    let payeesMap = getPayeesByCaller(caller);
    payeesMap.add(payee.payeeId, payee);
  };

  public shared ({ caller }) func deletePayee(payeeId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete payees");
    };
    let payeesMap = getPayeesByCaller(caller);
    if (not payeesMap.containsKey(payeeId)) {
      Runtime.trap("Payee ID not found");
    };
    payeesMap.remove(payeeId);
  };

  public query ({ caller }) func listMessages() : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list messages");
    };
    let messagesMap = getMessagesByCaller(caller);
    messagesMap.values().toArray().sort(Message.compareByCreated);
  };

  public query ({ caller }) func getMessage(messageId : Text) : async Message {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access messages");
    };
    let messagesMap = getMessagesByCaller(caller);
    switch (messagesMap.get(messageId)) {
      case (null) { Runtime.trap("Message ID not found") };
      case (?message) { message };
    };
  };

  public shared ({ caller }) func createMessage(message : Message) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create messages");
    };
    let messagesMap = getMessagesByCaller(caller);
    messagesMap.add(message.messageId, message);
  };

  public shared ({ caller }) func deleteMessage(messageId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete messages");
    };
    let messagesMap = getMessagesByCaller(caller);
    if (not messagesMap.containsKey(messageId)) {
      Runtime.trap("Message ID not found");
    };
    messagesMap.remove(messageId);
  };

  public shared ({ caller }) func markRead(messageId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark messages as read");
    };
    let messagesMap = getMessagesByCaller(caller);
    switch (messagesMap.get(messageId)) {
      case (null) { Runtime.trap("Message ID not found") };
      case (?existing) {
        let updated = {
          existing with
          messageStatus = #read;
        };
        messagesMap.add(messageId, updated);
      };
    };
  };

  public shared ({ caller }) func markUnread(messageId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark messages as unread");
    };
    let messagesMap = getMessagesByCaller(caller);
    switch (messagesMap.get(messageId)) {
      case (null) { Runtime.trap("Message ID not found") };
      case (?existing) {
        let updated = {
          existing with
          messageStatus = #unread;
        };
        messagesMap.add(messageId, updated);
      };
    };
  };

  public shared ({ caller }) func fundTransfer(transfer : FundTransferInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can transfer funds");
    };
    let accountsMap = getAccountsByCaller(caller);

    switch (accountsMap.get(transfer.fromAccountId)) {
      case (null) { Runtime.trap("Source account not found") };
      case (?source) {
        if (source.balance < transfer.amount) {
          Runtime.trap("Insufficient funds");
        };

        let updatedSource = {
          source with
          balance = source.balance - transfer.amount;
        };

        switch (accountsMap.get(transfer.toAccountId)) {
          case (null) { Runtime.trap("Destination account not found") };
          case (?destination) {
            let updatedDestination = {
              destination with
              balance = destination.balance + transfer.amount;
            };

            accountsMap.add(transfer.fromAccountId, updatedSource);
            accountsMap.add(transfer.toAccountId, updatedDestination);

            let transaction = {
              transactionId = transfer.fromAccountId # "_" # transfer.toAccountId # "_" # transfer.amount.toText();
              fromAccountId = transfer.fromAccountId;
              toAccountId = transfer.toAccountId;
              amount = transfer.amount;
              transactionType = #transfer;
              date = 0;
              description = transfer.description;
              status = #completed;
            };

            let transactionsMap = getTransactionsByCaller(caller);
            transactionsMap.add(transaction.transactionId, transaction);
          };
        };
      };
    };
  };

  public shared ({ caller }) func processPayment(payment : PaymentInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can process payments");
    };
    let accountsMap = getAccountsByCaller(caller);

    switch (accountsMap.get(payment.sourceAccountId)) {
      case (null) { Runtime.trap("Source account not found") };
      case (?source) {
        if (source.balance < payment.amount) {
          Runtime.trap("Insufficient funds");
        };

        let updatedSource = {
          source with
          balance = source.balance - payment.amount;
        };

        switch (accountsMap.get(payment.targetAccountId)) {
          case (null) { Runtime.trap("Target account not found") };
          case (?target) {
            let updatedTarget = {
              target with
              balance = target.balance - payment.amount;
            };

            accountsMap.add(payment.sourceAccountId, updatedSource);
            accountsMap.add(payment.targetAccountId, updatedTarget);

            let transaction = {
              transactionId = payment.sourceAccountId # "_" # payment.targetAccountId # "_" # payment.amount.toText();
              fromAccountId = payment.sourceAccountId;
              toAccountId = payment.targetAccountId;
              amount = payment.amount;
              transactionType = #payment;
              date = 0;
              description = payment.description;
              status = #completed;
            };

            let transactionsMap = getTransactionsByCaller(caller);
            transactionsMap.add(transaction.transactionId, transaction);
          };
        };
      };
    };
  };

  public query ({ caller }) func getDashboardSummary() : async DashboardSummary {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access dashboard");
    };
    let accountsMap = getAccountsByCaller(caller);
    let transactionsMap = getTransactionsByCaller(caller);
    let messagesMap = getMessagesByCaller(caller);

    var totalBalance : Int = 0;
    for (account in accountsMap.values()) {
      totalBalance += account.balance;
    };

    let accountCount = accountsMap.size();
    let allTransactions = transactionsMap.values().toArray().sort(Transaction.compareByDate);
    let recentTransactions = allTransactions.sliceToArray(0, 5);

    var unreadMessageCount = 0;
    for (message in messagesMap.values()) {
      switch (message.messageStatus) {
        case (#unread) { unreadMessageCount += 1 };
        case (_) {};
      };
    };

    {
      totalBalance;
      accountCount = accountCount.toNat();
      recentTransactions;
      unreadMessageCount;
    };
  };
};
