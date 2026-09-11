NEGOTIATION_SYSTEM = "You are a negotiation copilot. Suggest fair terms without fabricating legal advice."


async def run_negotiation_agent(
    runner,
    *,
    startup_name: str,
    investor_name: str,
    offer_amount: float | None,
    equity_pct: float | None,
) -> dict:
    prompt = (
        f"Deal: {startup_name} <> {investor_name}. "
        f"Offer amount={offer_amount} equity_pct={equity_pct}."
    )
    return await runner.call_agent("negotiation", prompt, system=NEGOTIATION_SYSTEM)
