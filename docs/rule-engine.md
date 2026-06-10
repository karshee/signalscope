# Rule engine

The automation engine (`engine/`) turns events into Telegram posts. A rule is one **trigger**, zero or more **conditions**, and one or more **actions**, drawn in the React Flow editor and compiled server-side at save time into an execution tree. The runner is a dumb tree-walker: conditions gate their subtree, actions execute and recurse into their children.

## Events

Every event is normalised to:

```python
Event(type, user_id, channel_id, data, meta, id, occurred_at)
```

`data` is type-specific:

| Type | Emitted by | `data` payload |
|---|---|---|
| `message.received` | watcher (Telethon poll) | `{text, message_id, channel_title, has_media, media_type, extracted: [...]}` — `extracted` holds parser output (e.g. the `signal` extractor's pair/direction/entry/SL) |
| `outcome.event` | tracker (TP/SL detection) | `{signal_id, outcome: "tp_hit"\|"sl_hit", tp_level, pair, direction, pips, rr, raw_text, channel_title}` |
| `schedule.tick` | APScheduler (one cron job per enabled schedule rule) | `{rule_id, cron}` |
| `webhook.received` | `POST /api/webhooks/ingest/{token}` | `{token_id, token_name, body: <posted JSON object>}` |

Events flow through an in-process asyncio `EventBus` (queue cap 1000, drops with a log rather than block producers) to the `RuleRunner`, which matches enabled rules by `(user_id, trigger_type)`.

## Node types

### Triggers (exactly one per rule)

| Type | Config | Trigger-level filtering |
|---|---|---|
| `message.received` | `{channel_ids?: [id], include_self_sent?: bool}` | Skips engine-sent messages unless `include_self_sent`; optional channel allowlist |
| `outcome.event` | `{events?: ["tp_hit"\|"sl_hit"], channel_ids?: [id], min_tp_level?: int}` | Optional outcome filter, channel allowlist, minimum TP level (applies to `tp_hit` only) |
| `schedule.tick` | `{cron: "m h dom mon dow"}` | Required 5-field cron; each schedule rule only fires on its own tick |
| `webhook.received` | `{token_id?: id}` | Optional restriction to one ingest token (default: any of the user's tokens) |

### Conditions (gate their subtree; evaluation errors count as false)

| Type | Config |
|---|---|
| `text_match` | `{field?: "text", mode: "contains"\|"exact"\|"regex", value, case_sensitive?: bool}` — `field` is a dotted path resolved against the template context then raw event data |
| `channel_filter` | `{channel_ids: [id]}` — event's channel must be in the list |
| `field_compare` | `{field, op: "=="\|"!="\|">"\|">="\|"<"\|"<="\|"in"\|"contains", value}` — numeric coercion when both sides look numeric; `in` accepts a list value |
| `time_window` | `{days?: [0-6 Mon-Sun], start?: "HH:MM", end?: "HH:MM", timezone?: "Europe/London"}` — windows may cross midnight; default tz UTC |

### Actions (require the user's bot token; failures abort the rule with status `error`)

| Type | Config | Notes |
|---|---|---|
| `send_message` | `{channel_id, template_id?\|text?, parse_mode?}` | Template body (or inline text) rendered with template variables; templates with attached media send as media + caption |
| `send_media` | `{channel_id, media_id?\|media_url?, caption?, kind?}` | Library asset or external URL; Telegram `file_id` cached after first upload |
| `forward_message` | `{channel_id}` | Bot API `copyMessage` of the triggering message — only valid on `message.received`; **bot must be admin in source AND target** |

Validation happens at save time (`POST/PUT /api/rules`): unknown types, missing required config, invalid regex/cron/timezone, ≠1 trigger, cycles, orphan nodes, >50 nodes all return 422 with per-node errors.

## Compiled tree example

"When Gold hits TP2 or better, post the celebration GIF template to the VIP channel":

```json
{
  "version": 1,
  "trigger": {
    "node_id": "t1",
    "type": "outcome.event",
    "config": { "events": ["tp_hit"], "min_tp_level": 2 }
  },
  "children": [
    {
      "kind": "condition",
      "node_id": "c1",
      "type": "field_compare",
      "config": { "field": "pair", "op": "==", "value": "XAUUSD" },
      "children": [
        {
          "kind": "action",
          "node_id": "a1",
          "type": "send_message",
          "config": {
            "channel_id": "<vip-channel-uuid>",
            "template_id": "<tp2-gif-template-uuid>"
          },
          "children": []
        }
      ]
    }
  ]
}
```

With a template body like `🔥 {pair} TP{tp_level} smashed — +{pips} pips ({rr}R)`.

## Template variables

`{var}` placeholders are replaced by safe regex substitution (no `str.format`, no eval). Unknown variables stay literal and surface as warnings in the execution trace.

| Variable | Available on | Meaning |
|---|---|---|
| `{date}` `{time}` `{event_type}` | all events | UTC date (`YYYY-MM-DD`), time (`HH:MM`), event type |
| `{text}` | message, outcome | Message text / signal raw text |
| `{channel_title}` `{message_id}` | message (title also on outcome) | Source channel/message |
| `{pair}` `{direction}` `{entry_price}` `{stop_loss}` | message (when the signal extractor parsed one) | Parsed signal fields |
| `{pair}` `{direction}` `{outcome}` `{tp_level}` `{pips}` `{rr}` `{signal_id}` | outcome | Outcome details (`outcome` = `tp_hit`/`sl_hit`) |
| `{webhook.field}` | webhook | Posted JSON body flattened with dot paths, up to 4 levels deep (e.g. `{webhook.event}`, `{webhook.trade.pips}`) |

The same context backs `text_match`/`field_compare` field lookups.

## Loop protection

Three independent guards, applied in order before actions run:

1. **Self-sent skip** — every engine send is recorded in the `sent_messages` ledger. When the watcher later sees that message, the event is flagged `self_sent` and `message.received` triggers skip it unless configured with `include_self_sent: true`. This breaks the classic "rule posts to a channel it watches" loop.
2. **Event dedup** — an LRU (2048 keys) of `rule_id + dedup_key` ensures at-most-once firing per logical event (`msg:{channel}:{message_id}` for messages, `out:{signal}:{outcome}:{tp_level}` for outcomes).
3. **Rate limit with auto-disable** — sliding 60s window per rule, default 10 fires/min (configurable 1–60). On trip the rule is **disabled**, the execution logged as `rate_limited`, and the UI notified over WebSocket ("check for loops"). Re-enable manually after fixing the rule.

Execution statuses: `success`, `condition_failed` (no action ran), `error`, `rate_limited`, `dry_run`, `skipped`.

## Dry-run testing

```
POST /api/rules/{id}/test
{ "event_type": "outcome.event",            // optional — defaults to the rule's trigger type
  "data": { "pair": "XAUUSD", "tp_level": 2 },  // optional — merged over a built-in sample event
  "channel_id": "..." }                     // optional
```

Nothing is sent to Telegram — a `DryRunSender` records would-have-sent payloads, and the response contains the full trace: which conditions passed, which actions would fire, the rendered text, and any template warnings. Dedup and rate limiting are bypassed in dry-run. Executions are logged with status `dry_run`.
