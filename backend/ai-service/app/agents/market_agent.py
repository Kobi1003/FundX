MARKET_SYSTEM = "You assess market size and growth using provided metrics only. Do not invent precise figures."


async def run_market_agent(runner, *, industry: str | None, metrics: dict) -> dict:
    prompt = (
        f"Industry: {industry or 'unknown'}\n"
        f"market_size={metrics.get('market_size')} growth_rate={metrics.get('growth_rate')}"
    )
    return await runner.call_agent("market", prompt, system=MARKET_SYSTEM)
