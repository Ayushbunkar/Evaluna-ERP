from typing import Any

from app.research.providers.people_provider import get_people_provider


async def find_people(
    company_name: str, 
    domain: str, 
    role_hints: list[str] | None = None
) -> list[dict[str, Any]]:
    """
    Find key decision-makers and contacts matching specific role hints.
    Integrates securely with external providers, guaranteeing zero fictional generations.
    """
    provider = get_people_provider()
    candidates = await provider.find_people(company_name=company_name, domain=domain, role_hints=role_hints)
    return [c.dict() for c in candidates]
