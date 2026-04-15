# MiniPanel

Self-hosted Mixpanel clone. Built by a two-agent harness (coder + validator) driven by `harness/loop.sh`.

## Where to look

| For | Read |
|---|---|
| **The spec** — user stories, acceptance criteria, priority, status (`passes` field) | [prd.json](./prd.json) |
| Agent roles and behaviour | [.claude/skills/code/SKILL.md](./.claude/skills/code/SKILL.md) and [.claude/skills/validate/SKILL.md](./.claude/skills/validate/SKILL.md) |
| Build/run/test commands, operational patterns | [AGENTS.md](./AGENTS.md) |
| What the validator last found | [VALIDATION_REPORT.md](./VALIDATION_REPORT.md) |
| Cross-cutting issues, architectural decisions | [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) |

`prd.json` is the single source of truth for both specification and status. RFC 2119 keywords (MUST/SHOULD/MAY) in acceptance criteria carry their standard meanings.

## Iterating

```bash
./harness/loop.sh --fresh 40    # nuke previous state, iterate up to 40 times
./harness/loop.sh 10            # continue from current state, 10 iterations
./harness/loop.sh --code-only 1 # debug: run just the coder once
```
