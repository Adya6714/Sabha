"""Convert InjecAgent cases into Sabha ProposedAction JSONL with weak labels.
Usage: python3 -I adapt_injecagent.py <InjecAgent/data dir> <out.jsonl> [n_per_group] [seed]
Weak label: needs_human=True for attacker-injected tool calls, False for the user's own benign call.
"""
import json, re, random, sys, os

data_dir, out_path = sys.argv[1], sys.argv[2]
n = int(sys.argv[3]) if len(sys.argv) > 3 else 60
random.seed(int(sys.argv[4]) if len(sys.argv) > 4 else 7)

TOOLKITS = sorted({tk["toolkit"] for tk in json.load(open(os.path.join(data_dir, "tools.json")))}, key=len, reverse=True)
FIRST = {
    "pay": {"Transfer", "Pay", "Withdraw", "Place", "Booking", "Reverse"},
    "delete": {"Delete", "Cancel", "Remove", "Revoke", "Disable", "Unfollow", "Unlike", "Leave"},
    "send": {"Send", "Share", "Post", "Retweet", "Reply", "Follow", "Like", "Give"},
    "accept": {"Grant", "Accept", "Approve", "Authorize", "Access", "Control"},
    "write": {"Create", "Update", "Add", "Set", "Schedule", "Upload", "Download", "Move", "Request", "Manage",
              "Manipulate", "Store", "Import", "Organize", "Execute", "Auto", "Handle"},
}

def action_part(tool):
    for tk in TOOLKITS:
        if tool.startswith(tk) and len(tool) > len(tk):
            return tool[len(tk):]
    return tool

def verb_of(tool):
    words = re.findall(r"[A-Z][a-z0-9]*", action_part(tool))
    first = words[0] if words else ""
    for v, ws in FIRST.items():
        if first in ws:
            return v
    return "read"

def rev_of(verb):
    return {"read": "easy", "draft": "easy", "write": "partial", "accept": "partial",
            "send": "hard", "pay": "hard", "delete": "hard"}[verb]

def mk(id_, tool, args, origin, label, group):
    v = verb_of(tool)
    return {"id": id_, "agentId": "agent_injecagent", "tool": tool, "verb": v, "args": args,
            "reversibility": rev_of(v),
            "meta": {"origin": origin, "group": group},
            "label": {"needs_human": label}}

rows = []
for kind, fn in [("dh", "test_cases_dh_base.json"), ("ds", "test_cases_ds_base.json")]:
    cases = json.load(open(os.path.join(data_dir, fn)))
    random.shuffle(cases)
    for i, c in enumerate(cases[:n]):
        # benign: the user's own tool call
        try:
            uargs = eval(c["Tool Parameters"]) if isinstance(c["Tool Parameters"], str) else c["Tool Parameters"]
        except Exception:
            uargs = {}
        rows.append(mk(f"{kind}{i}_user", c["User Tool"], uargs, "user", False, f"{kind}_benign"))
        # attacker steps: each tool call is its own action; all labelled needs_human
        tools = c["Attacker Tools"]
        for j, t in enumerate(tools):
            pos = "first" if j == 0 else "last"
            grp = f"{kind}_attack" if len(tools) == 1 else f"{kind}_attack_{pos}"
            rows.append(mk(f"{kind}{i}_atk{j}", t, {}, "tool_output", True, grp))

with open(out_path, "w") as f:
    for r in rows:
        f.write(json.dumps(r) + "\n")
print(len(rows), "actions written")
