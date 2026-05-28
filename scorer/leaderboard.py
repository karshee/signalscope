"""Cross-channel leaderboard queries."""


async def get_leaderboard(db_factory, window: str = "30d", min_signals: int = 5, user_id: str = None):
    async with db_factory() as db:
        rows = await db.execute_fetchall(
            """
            SELECT cs.channel_id, c.title, c.username, c.avatar_url,
                   cs.win_rate, cs.avg_rr, cs.entry_accuracy,
                   cs.signal_count, cs.quality_score, cs.quality_tier, cs.computed_at
            FROM channel_scores cs
            JOIN channels c ON c.id = cs.channel_id
            WHERE cs.window = ? AND cs.signal_count >= ?
              AND (? IS NULL OR c.user_id = ?)
            ORDER BY cs.quality_score DESC
            """,
            (window, min_signals, user_id, user_id),
        )
    return [dict(r) for r in rows]
