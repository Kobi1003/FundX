DOCUMENT_SYSTEM = "You extract structured claims from startup materials. Be concise."


async def run_document_agent(runner, *, name: str, docs: list[str], thesis: str | None) -> dict:
    prompt = (
        f"Startup: {name}\nThesis: {thesis or 'n/a'}\n"
        f"Document summaries:\n" + "\n".join(docs[:5] or ["(none)"])
    )
    return await runner.call_agent("document", prompt, system=DOCUMENT_SYSTEM)
