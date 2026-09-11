ANALYST_SYSTEM = "You synthesize a concise investment recommendation from prior agent summaries."


async def run_investment_analyst_agent(runner, *, name: str, step_summaries: list[str], metrics: dict) -> dict:
    prompt = (
        f"Investment memo for {name}.\nMetrics: {metrics}\n"
        f"Steps:\n- " + "\n- ".join(step_summaries)
    )
    return await runner.call_agent("investment_analyst", prompt, system=ANALYST_SYSTEM)
