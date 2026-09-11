FINANCIAL_SYSTEM = (
    "You interpret financial metrics and simulation outputs. "
    "Do not recalculate numbers; explain implications only."
)


async def run_financial_agent(runner, *, metrics: dict, simulation: dict) -> dict:
    prompt = (
        f"Metrics: {metrics}\n"
        f"Base scenario valuation={simulation.get('scenarios', {}).get('base', {}).get('valuation')} "
        f"runway={simulation.get('scenarios', {}).get('base', {}).get('runway_months')}"
    )
    return await runner.call_agent("financial", prompt, system=FINANCIAL_SYSTEM)
