# Sabha

**[sabha-beta.vercel.app](https://sabha-beta.vercel.app)**

A governance layer between human intention and autonomous AI action.

Sabha ensures that when AI systems act on behalf of people, their authority, incentives, assumptions and decision-making remain visible, contestable and accountable.

> Intelligence can be delegated. Authority should not be surrendered silently.

---

## The problem

AI agents can already research, recommend, buy, message and apply on your behalf. What they usually cannot do is show you:

- what they assumed about you
- who else benefited from the recommendation
- which downstream agents or tools were involved
- whether they had permission to act
- how the final action relates to what you originally asked for

Without that, people surrender authority quietly — even when the agent is “helpful.”

## What Sabha is

Sabha sits between you and autonomous action. It is not another agent that decides for you. It is a governance layer that makes the decision process inspectable before irreversible things happen.

**Today’s foundations**

| Layer | Job |
| --- | --- |
| **Living Memory** | Corrects the information the agent uses |
| **Council** | Challenges the reasoning from multiple perspectives |
| **Gate** | Enforces your decision based on stakes and risk |

**Where the product is heading**

| Capability | Job |
| --- | --- |
| **Delegation Map** | Shows who is doing what downstream |
| **Authority Registry** | Makes permissions explicit: Observe → Recommend → Prepare → Execute → Escalate |
| **Influence & Incentive Auditor** | Surfaces conflicts as verified, suspected or unknown |
| **Governance Receipts** | Records intention, chain, approvals and outcome |

## Who this is for

- People experimenting with personal AI agents who want consequential actions kept accountable
- Builders exploring multi-agent workflows who need a user-side governance model
- Researchers studying informed agency, delegation and influence disclosure

## What you can use today

Sabha is **usable as a product concept and interactive demo**, not yet as a production enforcement layer plugged into every agent framework.

| You can | You cannot yet |
| --- | --- |
| Explore the product site and waitlist | Install Sabha as a drop-in SDK for any agent |
| Run the interactive day-in-the-life demo | Assume real tool/API enforcement against live agents |
| Study the governance model and experiment framing | Treat Council lines as live independent expert models |

The live experience:

- **Site:** [sabha-beta.vercel.app](https://sabha-beta.vercel.app)
- **Demo:** [sabha-beta.vercel.app/demo](https://sabha-beta.vercel.app/demo)
- **How it works:** [sabha-beta.vercel.app/how-it-works](https://sabha-beta.vercel.app/how-it-works)

## How it helps

Sabha is designed to improve **informed agency** — the chance that before something consequential happens:

1. Relevant intentions and assumptions were surfaced
2. Alternatives and trade-offs were visible
3. Known influence was disclosed, and unknowns were named
4. You chose before execution when stakes required it
5. The action stayed within your permissions

In practice, that means fewer silent sponsorships, fewer stale assumptions treated as truth, fewer unapproved outbound actions, and a clearer answer to “why did my AI do that?”

## How to try it

### 1. Use the hosted product

1. Open [sabha-beta.vercel.app](https://sabha-beta.vercel.app)
2. Read the governance model on **How it works**
3. Open the **Demo** and walk through a day of agent decisions
4. Join early access if you want updates as the enforcement layer matures

### 2. Run it locally

```bash
git clone https://github.com/Adya6714/Sabha.git
cd Sabha
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional environment (copy `.env.example` → `.env.local`):

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
WAITLIST_WEBHOOK_URL=   # optional: Zapier / Make / Loops / etc.
```

Without a webhook, waitlist signups are accepted in-memory for local testing.

### 3. Deploy your own copy

```bash
npx vercel
```

Set `NEXT_PUBLIC_SITE_URL` to your production URL, and `WAITLIST_WEBHOOK_URL` if you want signups to persist.

## Repository map

| Path | Purpose |
| --- | --- |
| `/` | Product site + early access |
| `/demo` | Interactive demo |
| `/how-it-works` | Full governance model |
| `/privacy` | Privacy policy |
| `/api/waitlist` | Waitlist signup API |
| `/try` | Embedded demo app used by `/demo` |

## Status

Sabha is early.

- The **site, demo and governance narrative** are ready for people to explore
- The **demo** uses real Gate / Living Memory / Informed Agency Rate logic, with scripted council lines and catalog items
- A **production enforcement layer** still needs integrations with agent frameworks, tool gateways and execution APIs

If you are evaluating Sabha: start with the demo, then the how-it-works page. That is the current onboarding path.

## License

Proprietary for now. Questions and feedback welcome via [GitHub Issues](https://github.com/Adya6714/Sabha/issues).
