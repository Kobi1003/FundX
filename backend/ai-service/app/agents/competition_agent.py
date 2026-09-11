COMPETITION_SYSTEM = "You outline competitive landscape briefly from given context."


async def run_competition_agent(runner, *, name: str, industry: str | None) -> dict:
    prompt = f"Startup {name} in {industry or 'unknown industry'}: key competitors and differentiation."
    return await runner.call_agent("competition", prompt, system=COMPETITION_SYSTEM)
