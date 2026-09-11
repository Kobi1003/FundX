RED_TEAM_SYSTEM = "You challenge the investment thesis. List material risks only."


async def run_red_team_agent(runner, *, name: str, prior_summaries: list[str]) -> dict:
    joined = " | ".join(prior_summaries[:4])
    prompt = f"Red-team {name}. Prior findings: {joined}"
    return await runner.call_agent("red_team", prompt, system=RED_TEAM_SYSTEM)
