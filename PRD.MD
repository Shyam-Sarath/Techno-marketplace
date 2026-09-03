Yes. That actually makes the auction **much cleaner**. We should lock these as hard product requirements:

* **Category A is auctioned completely first.**
* **Category B is auctioned only after Category A is finished.**
* **Golden Power controls are visible ONLY to the auctioneer.**
* Teams can see that a technology is Golden, but they **cannot access or activate the Golden Power interface**.
* Golden swaps happen **after the entire auction is over**, not during either category.

Here is the corrected PRD structure.

# Tech Marketplace — Auction Website PRD v2

## 1. User Roles

### 🔨 Auctioneer — `PLACE-XP-VITC`

Full administrative access.

Can:

* Start/end auction
* Randomly select technologies
* Enter winning team
* Enter winning bid
* Edit auction results
* View/edit team purses
* View all purchased technologies
* Activate Golden Power
* Perform Category-B swaps
* Set presentation order for Golden teams

### 👥 Teams

Teams log in using:

* Team Number / Team Name
* Event password: `PLACE-XP-2026`

Teams have **view-only access**.

They can see:

* Current technology
* Technology description
* Whether it is Golden
* All teams' remaining purses
* All teams' purchased technologies
* Their own purchased technologies
* Auction history

They **cannot modify anything**.

---

# 2. Two Auction Categories

The 30 assets are divided into:

## 🧠 CATEGORY A — CORE TECHNOLOGIES

These determine the primary direction/capability of the team's proposed solution.

**12 Core Technologies:**

1. Computer Vision ⭐
2. Digital Twin & Simulation ⭐
3. AR / VR & Immersive Systems ⭐
4. Geospatial Intelligence
5. Optimization & Decision Systems
6. Edge Computing
7. AI / Machine Learning
8. IoT & Sensor Systems
9. Robotics & Autonomous Systems
10. Predictive & Recommendation Systems
11. Blockchain & Decentralized Systems
12. Human-Computer Interaction

### ⭐ Golden Core Technologies

* Computer Vision
* Digital Twin & Simulation
* AR / VR & Immersive Systems

---

## 🔧 CATEGORY B — SUPPORT TECHNOLOGIES

These support the implementation, integration and usability of the core solution.

The finalized Support Technologies currently include:

1. Database & Data Storage
2. API & External Integrations
3. Cloud Infrastructure
4. Cybersecurity
5. Authentication & Identity
6. Voice Interface
7. Notification & Communication
8. Payment & Transaction System
9. Real-Time Communication
10. Analytics & Visualization
11. Workflow & Automation
12. UI/UX & Prototyping

The remaining Category-B assets can be finalized before development.

---

# 3. Auction Sequence

This is now a **strict two-stage auction**.

### PHASE 1 — CATEGORY A

The website only allows:

> **Category A → Available Technologies**

The auctioneer presses:

### 🎲 `CHOOSE NEXT TECHNOLOGY`

The system randomly selects an **unsold Category-A technology**.

The selected technology is displayed to everyone.

Physical bidding happens.

Auctioneer enters:

> Winning Team
> Winning Bid

Press:

### `ASSIGN TECHNOLOGY`

The system:

* Assigns the technology
* Deducts the bid
* Marks it SOLD
* Updates all team dashboards

Then the auctioneer chooses the next Category-A technology.

This continues until **all Category-A technologies have been auctioned**.

---

# 4. Category Transition

Once all Category-A technologies are sold, the auctioneer sees:

# 🧠 CATEGORY A COMPLETE

Then:

### `START CATEGORY B`

After pressing this, the marketplace switches to:

# 🔧 CATEGORY B AUCTION

The same process happens again.

The auctioneer can now randomly select **only Category-B technologies**.

This prevents accidental mixing of the categories.

---

# 5. Golden Technology Display

When a Golden Core Technology is randomly selected, **everyone can see that it is Golden.**

The card should have:

* Golden design
* Golden border
* Animation
* Special visual effect
* ⭐ GOLDEN TECHNOLOGY label

However:

### Teams DO NOT see the Golden Power controls.

For them, it simply appears as:

> ⭐ **GOLDEN TECHNOLOGY**
> Computer Vision

They know they have acquired something special, but the **administrative Golden Power mechanism belongs exclusively to the auctioneer interface**.

---

# 6. Auctioneer Golden Power

After **both Category A and Category B auctions are completely finished**, the auctioneer dashboard unlocks:

# ⭐ ACTIVATE GOLDEN POWERS

This button is:

### 🔒 NOT visible to teams.

Only the `PLACE-XP-VITC` auctioneer account can access it.

---

# 7. Golden Power — Category-B Swap

When the auctioneer activates Golden Powers, the system identifies all teams that own Golden Core Technologies.

For each Golden team:

> **Team 07**
> Golden Technology: Computer Vision

The auctioneer can open:

### `USE GOLDEN POWER`

Then:

**Step 1 — Select the Golden Team**

> Team 07

**Step 2 — Select their Category-B Technology**

> Database

**Step 3 — Select another team**

> Team 12

**Step 4 — Select that team's Category-B Technology**

> Cloud Infrastructure

Then:

### `CONFIRM SWAP`

---

# 8. Swap Rules

The website should enforce the rules automatically.

### Allowed:

**Category B ↔ Category B**

### Not Allowed:

❌ Core ↔ Core
❌ Core ↔ Support
❌ Support ↔ Core
❌ Golden Core ↔ anything
❌ Golden Technology ↔ Golden Technology

The swap is strictly between **Category-B technologies**.

---

# 9. Purse After Auction

This is another important rule.

During the auction:

> **Purse matters.**

After the auction ends:

> **Purse does NOT matter for Golden swaps.**

Example:

Team 07:

> ₹20,000 remaining

Team 12:

> ₹70,000 remaining

Team 07 can still force:

> Database ↔ Cloud Infrastructure

No money is transferred.

No purse is recalculated.

The transaction simply changes **technology ownership**.

---


# 11. Editing

Everything that can change during the event should be editable by the auctioneer.

### Auction transactions

Auctioneer can edit:

* Winning team
* Bid amount
* Technology assignment

### Golden swaps

Auctioneer can edit/reverse:

* Golden team
* Other team
* Category-B technology exchanged

### Presentation order

Auctioneer can change:

* First
* Middle
* Last

This gives you a safety net if there is a human error during the live event.

---

# 12. Team Dashboard

Teams should see something like:

## TEAM 07

### 💰 REMAINING PURSE

# ₹42,000

### 🧠 CATEGORY A — YOUR CORE TECHNOLOGIES

* AI / Machine Learning
* ⭐ Computer Vision

### 🔧 CATEGORY B — YOUR SUPPORT TECHNOLOGIES

* Database
* API & External Integrations

---

### 🌐 MARKETPLACE

**All Teams**

| Team    |   Purse |
| ------- | ------: |
| Team 01 | ₹32,000 |
| Team 02 | ₹65,000 |
| Team 03 | ₹41,000 |
| Team 07 | ₹42,000 |

And below that:

### TECHNOLOGIES OWNED BY TEAMS

So everyone has complete marketplace transparency.

---

# 13. Auctioneer Dashboard

The auctioneer gets a more powerful interface:

```text
TECH MARKETPLACE
────────────────────────────

PHASE
CATEGORY A — LIVE

Current Technology
┌─────────────────────────┐
│                         │
│   COMPUTER VISION ⭐     │
│                         │
│   GOLDEN TECHNOLOGY     │
│                         │
└─────────────────────────┘

        [ ASSIGN ]

Winning Team: [ Team 07 ▼ ]
Winning Bid:  [ ₹62,000 ]

        [ ASSIGN TECHNOLOGY ]

────────────────────────────

CATEGORY A
12 / 12 SOLD

        [ START CATEGORY B ]

────────────────────────────

TEAM PURSES
Team 01    ₹45,000
Team 02    ₹22,000
Team 03    ₹71,000
...

────────────────────────────

🔒 GOLDEN POWERS
   [ LOCKED — AUCTION ACTIVE ]
```

Once the auction finishes:

```text
🔒 GOLDEN POWERS

[ ACTIVATE GOLDEN POWERS ]
```

Only then does the Golden Power interface become accessible.

---

## Final Event Logic

The website's logic should essentially be:

**LOGIN**

↓

**CATEGORY A AUCTION**

↓

12 Core Technologies auctioned

↓

**CATEGORY B AUCTION**

↓

Support Technologies auctioned

↓

**AUCTION COMPLETE**

↓

🔒 **Golden Powers unlocked for Auctioneer ONLY**

↓

Golden teams use:

**Category-B Forced Swap**

*

**Presentation Position Choice**

↓

**Solution Building / Evaluation**

---

This separation is actually important for the implementation too. We can make the application behave almost like a **state machine**, so the auctioneer physically cannot accidentally auction a Category-B asset while Category A is still running, and teams can never access administrative Golden Power controls.
