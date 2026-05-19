# Security Specification - GoodCircle

## Data Invariants
1. A user can only access their own profile.
2. A campaign must be owned by the user who created it.
3. Donors and Messages must belong to a valid campaign owned by the user.

## The Dirty Dozen Payloads (Rejected)
1. Creating a campaign for another user's `userId`.
2. Reading another user's campaign list.
3. Updating a campaign with a different `userId` (identity spoofing).
4. Creating a donor in another user's campaign.
5. Deleting a message that doesn't belong to the user.
6. Updating a message's parent `campaignId` to "steal" it into another campaign.
7. Injecting 2MB of junk text into a donor's name.
8. Creating a campaign without a title.
9. Modifying `createdAt` field on a message.
10. Listing all donors across all campaigns.
11. Reading PII from another user's profile.
12. Creating a message for a donor that doesn't exist in that campaign.

## Firestore Rules
Drafted in `firestore.rules`.
