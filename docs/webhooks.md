# Webhooks

Inbound webhooks let any external system fire your automation rules by POSTing JSON to Tapwire. The flow: create a token in the app (Webhooks page or `POST /api/webhooks`), point the external system at the ingest URL, build a rule with a `webhook.received` trigger.

## Ingest contract

```
POST /api/webhooks/ingest/{token}
Content-Type: application/json
```

- **Unauthenticated** — the token in the URL *is* the credential (32 hex chars, constant-time compared). Rotate it via `POST /api/webhooks/{token_id}/rotate` if it leaks.
- Body must be a **JSON object** (not array/scalar), max **16 KB** → otherwise `422` / `413`.
- Rate limit: **60 requests/min per token** → `429` when exceeded.
- Unknown or inactive token → `404`.
- Success → `202 Accepted` with `{"accepted": true}`. The event is queued; rule execution is asynchronous (`accepted: false` means the engine isn't running or its queue is full).

The request becomes a `webhook.received` event for the token owner:

```python
data = {"token_id": ..., "token_name": ..., "body": <your JSON>}
```

## Using the body in rules

**Template variables** — the body is flattened to dot paths under `webhook.` (up to 4 levels deep). For body `{"event": "tp_hit", "trade": {"pair": "XAUUSD", "pips": 150}}`:

- `{webhook.event}` → `tp_hit`
- `{webhook.trade.pair}` → `XAUUSD`
- `{webhook.trade.pips}` → `150`

**Conditions** — the same paths work in `field_compare` and `text_match`:

```json
{ "kind": "condition", "type": "field_compare",
  "config": { "field": "webhook.event", "op": "==", "value": "tp_hit" } }
```

Numeric comparisons coerce (`{"field": "webhook.tp_level", "op": ">=", "value": 2}` matches whether the body sent `2` or `"2"`).

**Trigger scoping** — a `webhook.received` trigger fires on any of your tokens by default; set `token_id` in the trigger config to bind a rule to one token.

## curl example

```bash
curl -X POST https://your-host/api/webhooks/ingest/abcd1234ef567890abcd1234ef567890 \
  -H 'Content-Type: application/json' \
  -d '{"event": "tp_hit", "pair": "XAUUSD", "tp_level": 2, "pips": 150}'
# → 202 {"accepted": true}
```

## Example: trade-watcher integration

A typical setup for a trading stack (e.g. a JoeTheTrader-style signal watcher): the watcher already detects TP/SL hits on live accounts — have it POST each detection to Tapwire, and let a rule announce it to the VIP channel.

Watcher side (on TP detection):

```python
import httpx

httpx.post(
    "https://tapwire.example.com/api/webhooks/ingest/<token>",
    json={"event": "tp_hit", "pair": "XAUUSD", "tp_level": 2, "pips": 150},
    timeout=5,
)
```

Tapwire side — rule "Announce TP hits":

- **Trigger:** `webhook.received` (token: *trade-watcher*)
- **Condition:** `field_compare` — `webhook.event == "tp_hit"`
- **Condition:** `field_compare` — `webhook.tp_level >= 2`
- **Action:** `send_message` to *VIP Signals* with template:

  ```
  🎯 {webhook.pair} TP{webhook.tp_level} hit — +{webhook.pips} pips
  ```

Dry-run it first with `POST /api/rules/{id}/test` passing a sample `data.body` — see [rule-engine.md](rule-engine.md). The built-in sample webhook event is exactly this shape (`{"event": "tp_hit", "pair": "XAUUSD", "tp_level": 2, "pips": 150}`).
